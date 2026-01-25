import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type ComplaintType = 'inappropriate_behavior' | 'food_quality' | 'no_show' | 'communication' | 'safety' | 'other';
export type ComplaintStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';

export interface Complaint {
  id: string;
  from_user_id: string;
  to_user_id: string;
  listing_id: string | null;
  type: ComplaintType;
  description: string;
  status: ComplaintStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  from_profile?: {
    name: string;
    org_name: string | null;
    email: string;
  };
  to_profile?: {
    name: string;
    org_name: string | null;
    email: string;
  };
}

interface CreateComplaintData {
  to_user_id: string;
  listing_id?: string;
  type: ComplaintType;
  description: string;
}

interface UpdateComplaintData {
  complaintId: string;
  status?: ComplaintStatus;
  admin_notes?: string;
}

export const useComplaints = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isAdmin = role === 'admin';

  // Fetch all complaints (admin) or user's own complaints
  const complaintsQuery = useQuery({
    queryKey: ['complaints', user?.id, isAdmin],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      // Non-admins only see their own complaints
      if (!isAdmin) {
        query = query.or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);
      }

      const { data: complaints, error } = await query;
      if (error) throw error;

      // Fetch profile data for all users
      const userIds = [...new Set([
        ...complaints.map(c => c.from_user_id),
        ...complaints.map(c => c.to_user_id),
      ])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, org_name, email')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

      return complaints.map(c => ({
        ...c,
        from_profile: profileMap.get(c.from_user_id),
        to_profile: profileMap.get(c.to_user_id),
      })) as Complaint[];
    },
    enabled: !!user,
  });

  // Create complaint
  const createComplaintMutation = useMutation({
    mutationFn: async (data: CreateComplaintData) => {
      if (!user) throw new Error('Not authenticated');

      const { data: complaint, error } = await supabase
        .from('complaints')
        .insert({
          from_user_id: user.id,
          to_user_id: data.to_user_id,
          listing_id: data.listing_id || null,
          type: data.type,
          description: data.description,
        })
        .select()
        .single();

      if (error) throw error;
      return complaint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      toast({
        title: 'Complaint Submitted',
        description: 'Your complaint has been submitted for review.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error submitting complaint',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update complaint (admin only)
  const updateComplaintMutation = useMutation({
    mutationFn: async (data: UpdateComplaintData) => {
      const updateData: Record<string, unknown> = {};
      if (data.status) updateData.status = data.status;
      if (data.admin_notes !== undefined) updateData.admin_notes = data.admin_notes;

      const { error } = await supabase
        .from('complaints')
        .update(updateData)
        .eq('id', data.complaintId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      toast({
        title: 'Complaint Updated',
        description: 'The complaint has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating complaint',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const myComplaints = complaintsQuery.data?.filter(c => c.from_user_id === user?.id) ?? [];
  const complaintsAboutMe = complaintsQuery.data?.filter(c => c.to_user_id === user?.id) ?? [];
  const pendingComplaints = complaintsQuery.data?.filter(c => c.status === 'pending') ?? [];

  return {
    complaints: complaintsQuery.data ?? [],
    myComplaints,
    complaintsAboutMe,
    pendingComplaints,
    isLoading: complaintsQuery.isLoading,
    createComplaint: createComplaintMutation.mutateAsync,
    isCreating: createComplaintMutation.isPending,
    updateComplaint: updateComplaintMutation.mutateAsync,
    isUpdating: updateComplaintMutation.isPending,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['complaints'] }),
  };
};
