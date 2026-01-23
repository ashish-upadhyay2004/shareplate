import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export interface NgoProfile {
  name: string;
  org_name: string | null;
  contact: string | null;
  email: string;
}

export interface ListingInfo {
  id: string;
  food_category: string;
  quantity: number;
  quantity_unit: string;
  location: string;
  photos: string[];
  donor_id: string;
  status?: string;
  donor_profile?: NgoProfile;
}

export interface DonationRequest {
  id: string;
  listing_id: string;
  ngo_id: string;
  message: string | null;
  requested_pickup_time: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  ngo_profile?: NgoProfile;
  listing?: ListingInfo;
}

interface CreateRequestData {
  listing_id: string;
  message?: string;
  requested_pickup_time: string;
}

export const useRequests = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get requests for listings I own (as donor)
  const requestsForMyListingsQuery = useQuery({
    queryKey: ['requests-for-my-listings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // First get my listings
      const { data: myListings } = await supabase
        .from('donation_listings')
        .select('id')
        .eq('donor_id', user.id);

      if (!myListings || myListings.length === 0) return [];

      const listingIds = myListings.map(l => l.id);

      // Get requests for my listings
      const { data: requests, error } = await supabase
        .from('donation_requests')
        .select('*')
        .in('listing_id', listingIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get NGO profiles
      const ngoIds = [...new Set(requests.map(r => r.ngo_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, org_name, contact, email')
        .in('user_id', ngoIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

      // Get listings data
      const { data: listings } = await supabase
        .from('donation_listings')
        .select('id, food_category, quantity, quantity_unit, location, photos, donor_id, status')
        .in('id', listingIds);

      const listingMap = new Map(listings?.map(l => [l.id, l]) ?? []);

      return requests.map(request => ({
        ...request,
        ngo_profile: profileMap.get(request.ngo_id) as NgoProfile | undefined,
        listing: listingMap.get(request.listing_id) as ListingInfo | undefined,
      })) as DonationRequest[];
    },
    enabled: !!user,
  });

  // Real-time subscription for donation_requests changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`requests-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'donation_requests',
        },
        () => {
          // Invalidate both request queries when any request changes
          queryClient.invalidateQueries({ queryKey: ['requests-for-my-listings', user.id] });
          queryClient.invalidateQueries({ queryKey: ['my-requests', user.id] });
          queryClient.invalidateQueries({ queryKey: ['my-listings', user.id] });
          queryClient.invalidateQueries({ queryKey: ['listings'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'donation_listings',
        },
        () => {
          // Invalidate when listings change (for status updates)
          queryClient.invalidateQueries({ queryKey: ['requests-for-my-listings', user.id] });
          queryClient.invalidateQueries({ queryKey: ['my-requests', user.id] });
          queryClient.invalidateQueries({ queryKey: ['my-listings', user.id] });
          queryClient.invalidateQueries({ queryKey: ['listings'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Get my requests (as NGO)
  const myRequestsQuery = useQuery({
    queryKey: ['my-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: requests, error } = await supabase
        .from('donation_requests')
        .select('*')
        .eq('ngo_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get listings data (include status for progress tracking)
      const listingIds = [...new Set(requests.map(r => r.listing_id))];
      const { data: listings } = await supabase
        .from('donation_listings')
        .select('id, food_category, quantity, quantity_unit, location, photos, donor_id, status')
        .in('id', listingIds);

      // Get donor profiles
      const donorIds = [...new Set(listings?.map(l => l.donor_id) ?? [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, org_name, contact, email')
        .in('user_id', donorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);
      const listingMap = new Map(listings?.map(l => [l.id, {
        ...l,
        donor_profile: profileMap.get(l.donor_id),
      }]) ?? []);

      return requests.map(request => ({
        ...request,
        listing: listingMap.get(request.listing_id) as ListingInfo | undefined,
      })) as DonationRequest[];
    },
    enabled: !!user,
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: CreateRequestData) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: request, error } = await supabase
        .from('donation_requests')
        .insert({
          ...data,
          ngo_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update listing status to requested
      await supabase
        .from('donation_listings')
        .update({ status: 'requested' })
        .eq('id', data.listing_id);

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast({
        title: 'Request Sent!',
        description: 'The restaurant will review your request.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error sending request',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateRequestStatusMutation = useMutation({
    mutationFn: async ({ requestId, status, listingId }: { 
      requestId: string; 
      status: 'accepted' | 'rejected';
      listingId: string;
    }) => {
      const { error } = await supabase
        .from('donation_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      // If accepted, update listing status to confirmed
      if (status === 'accepted') {
        await supabase
          .from('donation_listings')
          .update({ status: 'confirmed' })
          .eq('id', listingId);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['requests-for-my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      
      toast({
        title: variables.status === 'accepted' ? 'Request Accepted!' : 'Request Declined',
        description: variables.status === 'accepted' 
          ? 'Contact details are now shared with the NGO.'
          : 'The NGO has been notified.',
      });
    },
  });

  const getRequestsByListing = async (listingId: string): Promise<DonationRequest[]> => {
    const { data: requests, error } = await supabase
      .from('donation_requests')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      return [];
    }

    // Get NGO profiles
    const ngoIds = [...new Set(requests.map(r => r.ngo_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, name, org_name, contact, email')
      .in('user_id', ngoIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

    return requests.map(request => ({
      ...request,
      ngo_profile: profileMap.get(request.ngo_id) as NgoProfile | undefined,
    })) as DonationRequest[];
  };

  return {
    requestsForMyListings: requestsForMyListingsQuery.data ?? [],
    myRequests: myRequestsQuery.data ?? [],
    isLoading: requestsForMyListingsQuery.isLoading || myRequestsQuery.isLoading,
    createRequest: createRequestMutation.mutateAsync,
    isCreating: createRequestMutation.isPending,
    updateRequestStatus: updateRequestStatusMutation.mutateAsync,
    getRequestsByListing,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['requests-for-my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
    },
  };
};
