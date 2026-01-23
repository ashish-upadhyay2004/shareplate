import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  org_name: string | null;
  contact: string | null;
  address: string | null;
  avatar_url: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  role?: 'donor' | 'ngo' | 'admin';
}

export interface AdminStats {
  totalUsers: number;
  totalDonors: number;
  totalNgos: number;
  pendingVerifications: number;
  totalListings: number;
  completedDonations: number;
  activeListings: number;
}

export const useAdmin = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isAdmin = role === 'admin';

  const profilesQuery = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get roles for each user
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) ?? []);

      return profiles.map(p => ({
        ...p,
        role: rolesMap.get(p.user_id) as UserProfile['role'],
      })) as UserProfile[];
    },
    enabled: !!user && isAdmin,
  });

  const listingsQuery = useQuery({
    queryKey: ['admin-listings'],
    queryFn: async () => {
      const { data: listings, error } = await supabase
        .from('donation_listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch donor profiles separately
      const donorIds = [...new Set(listings.map(l => l.donor_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, org_name')
        .in('user_id', donorIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

      return listings.map(listing => ({
        ...listing,
        donor_profile: profilesMap.get(listing.donor_id) || null,
      }));
    },
    enabled: !!user && isAdmin,
  });

  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      const profiles = profilesQuery.data ?? [];
      const listings = listingsQuery.data ?? [];

      return {
        totalUsers: profiles.length,
        totalDonors: profiles.filter(p => p.role === 'donor').length,
        totalNgos: profiles.filter(p => p.role === 'ngo').length,
        pendingVerifications: profiles.filter(p => p.verification_status === 'pending').length,
        totalListings: listings.length,
        completedDonations: listings.filter(l => l.status === 'completed').length,
        activeListings: listings.filter(l => ['posted', 'requested', 'confirmed'].includes(l.status)).length,
      };
    },
    enabled: !!profilesQuery.data && !!listingsQuery.data && isAdmin,
  });

  const updateVerificationMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: status })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({
        title: variables.status === 'approved' ? 'User Approved!' : 'User Rejected',
        description: `The user has been ${variables.status}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating verification',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteListingMutation = useMutation({
    mutationFn: async (listingId: string) => {
      const { error } = await supabase
        .from('donation_listings')
        .delete()
        .eq('id', listingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({
        title: 'Listing Deleted',
        description: 'The listing has been removed.',
      });
    },
  });

  const profiles = profilesQuery.data ?? [];
  const pendingUsers = profiles.filter(p => p.verification_status === 'pending' && p.role !== 'admin');
  const approvedUsers = profiles.filter(p => p.verification_status === 'approved');
  const donors = profiles.filter(p => p.role === 'donor');
  const ngos = profiles.filter(p => p.role === 'ngo');

  const defaultStats: AdminStats = {
    totalUsers: profiles.length,
    totalDonors: profiles.filter(p => p.role === 'donor').length,
    totalNgos: profiles.filter(p => p.role === 'ngo').length,
    pendingVerifications: profiles.filter(p => p.verification_status === 'pending').length,
    totalListings: listingsQuery.data?.length ?? 0,
    completedDonations: listingsQuery.data?.filter(l => l.status === 'completed').length ?? 0,
    activeListings: listingsQuery.data?.filter(l => ['posted', 'requested', 'confirmed'].includes(l.status)).length ?? 0,
  };

  return {
    profiles,
    pendingUsers,
    approvedUsers,
    donors,
    ngos,
    listings: listingsQuery.data ?? [],
    stats: statsQuery.data ?? defaultStats,
    isLoading: profilesQuery.isLoading || listingsQuery.isLoading,
    updateVerification: updateVerificationMutation.mutateAsync,
    deleteListing: deleteListingMutation.mutateAsync,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  };
};
