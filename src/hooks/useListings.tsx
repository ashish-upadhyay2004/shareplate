import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type DonationStatus = 'posted' | 'requested' | 'confirmed' | 'completed' | 'expired' | 'cancelled';
export type FoodType = 'veg' | 'non-veg' | 'both';

export interface DonorProfile {
  name: string;
  org_name: string | null;
  contact: string | null;
  email: string;
}

export interface DonationListing {
  id: string;
  donor_id: string;
  food_type: FoodType;
  food_category: string;
  quantity: number;
  quantity_unit: string;
  packaging_type: string | null;
  prepared_time: string;
  expiry_time: string;
  pickup_time_start: string;
  pickup_time_end: string;
  location: string;
  address: string;
  status: DonationStatus;
  photos: string[];
  hygiene_notes: string | null;
  allergens: string[];
  created_at: string;
  updated_at: string;
  latitude?: number | null;
  longitude?: number | null;
  donor_profile?: DonorProfile;
}

interface CreateListingData {
  food_type: FoodType;
  food_category: string;
  quantity: number;
  quantity_unit: string;
  packaging_type?: string;
  prepared_time: string;
  expiry_time: string;
  pickup_time_start: string;
  pickup_time_end: string;
  location: string;
  address: string;
  photos?: string[];
  hygiene_notes?: string;
  allergens?: string[];
}

export const useListings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const listingsQuery = useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      const { data: listings, error } = await supabase
        .from('donation_listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const donorIds = [...new Set(listings.map(l => l.donor_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, org_name, contact, email')
        .in('user_id', donorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

      return listings.map(listing => ({
        ...listing,
        donor_profile: profileMap.get(listing.donor_id) as DonorProfile | undefined,
      })) as DonationListing[];
    },
    enabled: !!user,
  });

  const myListingsQuery = useQuery({
    queryKey: ['my-listings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: listings, error } = await supabase
        .from('donation_listings')
        .select('*')
        .eq('donor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, name, org_name, contact, email')
        .eq('user_id', user.id)
        .maybeSingle();

      return listings.map(listing => ({
        ...listing,
        donor_profile: profile as DonorProfile | undefined,
      })) as DonationListing[];
    },
    enabled: !!user,
  });

  const createListingMutation = useMutation({
    mutationFn: async (data: CreateListingData) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: listing, error } = await supabase
        .from('donation_listings')
        .insert({
          ...data,
          donor_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      toast({
        title: 'Listing Created!',
        description: 'Your donation is now visible to NGOs.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating listing',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateListingStatusMutation = useMutation({
    mutationFn: async ({ listingId, status }: { listingId: string; status: DonationStatus }) => {
      const { error } = await supabase
        .from('donation_listings')
        .update({ status })
        .eq('id', listingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    },
  });

  const getListingById = async (id: string): Promise<DonationListing | null> => {
    const { data: listing, error } = await supabase
      .from('donation_listings')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !listing) {
      console.error('Error fetching listing:', error);
      return null;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, name, org_name, contact, email')
      .eq('user_id', listing.donor_id)
      .maybeSingle();

    return {
      ...listing,
      donor_profile: profile as DonorProfile | undefined,
    } as DonationListing;
  };

  return {
    listings: listingsQuery.data ?? [],
    myListings: myListingsQuery.data ?? [],
    isLoading: listingsQuery.isLoading,
    isMyListingsLoading: myListingsQuery.isLoading,
    createListing: createListingMutation.mutateAsync,
    isCreating: createListingMutation.isPending,
    updateListingStatus: updateListingStatusMutation.mutateAsync,
    getListingById,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    },
  };
};
