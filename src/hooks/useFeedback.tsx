import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface FeedbackProfile {
  name: string;
  org_name: string | null;
}

export interface Feedback {
  id: string;
  listing_id: string;
  from_user_id: string;
  to_user_id: string;
  stars: number;
  comment: string | null;
  created_at: string;
  from_profile?: FeedbackProfile;
  to_profile?: FeedbackProfile;
}

interface CreateFeedbackData {
  listing_id: string;
  to_user_id: string;
  stars: number;
  comment?: string;
}

export const useFeedback = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const feedbackQuery = useQuery({
    queryKey: ['feedback', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: feedback, error } = await supabase
        .from('feedback')
        .select('*')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get all user IDs
      const userIds = [...new Set([
        ...feedback.map(f => f.from_user_id),
        ...feedback.map(f => f.to_user_id),
      ])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, org_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

      return feedback.map(f => ({
        ...f,
        from_profile: profileMap.get(f.from_user_id) as FeedbackProfile | undefined,
        to_profile: profileMap.get(f.to_user_id) as FeedbackProfile | undefined,
      })) as Feedback[];
    },
    enabled: !!user,
  });

  const createFeedbackMutation = useMutation({
    mutationFn: async (data: CreateFeedbackData) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: feedback, error } = await supabase
        .from('feedback')
        .insert({
          ...data,
          from_user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return feedback;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      toast({
        title: 'Feedback Submitted!',
        description: 'Thank you for your feedback.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error submitting feedback',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getFeedbackForListing = async (listingId: string): Promise<Feedback[]> => {
    const { data: feedback, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('listing_id', listingId);

    if (error) {
      console.error('Error fetching feedback:', error);
      return [];
    }

    // Get all user IDs
    const userIds = [...new Set([
      ...feedback.map(f => f.from_user_id),
      ...feedback.map(f => f.to_user_id),
    ])];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, name, org_name')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

    return feedback.map(f => ({
      ...f,
      from_profile: profileMap.get(f.from_user_id) as FeedbackProfile | undefined,
      to_profile: profileMap.get(f.to_user_id) as FeedbackProfile | undefined,
    })) as Feedback[];
  };

  const hasFeedbackForListing = async (listingId: string): Promise<boolean> => {
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('feedback')
      .select('id')
      .eq('listing_id', listingId)
      .eq('from_user_id', user.id)
      .maybeSingle();

    if (error) return false;
    return !!data;
  };

  const receivedFeedback = feedbackQuery.data?.filter(f => f.to_user_id === user?.id) ?? [];
  const givenFeedback = feedbackQuery.data?.filter(f => f.from_user_id === user?.id) ?? [];
  
  const averageRating = receivedFeedback.length > 0
    ? receivedFeedback.reduce((sum, f) => sum + f.stars, 0) / receivedFeedback.length
    : 0;

  return {
    feedback: feedbackQuery.data ?? [],
    receivedFeedback,
    givenFeedback,
    averageRating,
    isLoading: feedbackQuery.isLoading,
    createFeedback: createFeedbackMutation.mutateAsync,
    isCreating: createFeedbackMutation.isPending,
    getFeedbackForListing,
    hasFeedbackForListing,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['feedback'] }),
  };
};
