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
  is_blocked: boolean;
  blocked_reason: string | null;
  blocked_at: string | null;
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

export interface MonthlyAnalytics {
  month: number;
  year: number;
  donations_count: number;
  meals_served: number;
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
        is_blocked: p.is_blocked ?? false,
        blocked_reason: p.blocked_reason ?? null,
        blocked_at: p.blocked_at ?? null,
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

  // Fetch real monthly analytics from database
  const analyticsQuery = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async (): Promise<MonthlyAnalytics[]> => {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Try to get from monthly_analytics table first
      const { data: analyticsData, error } = await supabase
        .from('monthly_analytics')
        .select('*')
        .order('year', { ascending: true })
        .order('month', { ascending: true });

      if (!error && analyticsData && analyticsData.length > 0) {
        // Filter to only include months up to current month
        return analyticsData.filter(a => {
          if (a.year < currentYear) return true;
          if (a.year === currentYear && a.month <= currentMonth) return true;
          return false;
        });
      }

      // Fallback: Calculate from completed listings
      const listings = listingsQuery.data ?? [];
      const completedListings = listings.filter(l => l.status === 'completed');
      
      const monthlyMap = new Map<string, { donations: number; meals: number }>();
      
      completedListings.forEach(listing => {
        const date = new Date(listing.created_at);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const existing = monthlyMap.get(key) || { donations: 0, meals: 0 };
        monthlyMap.set(key, {
          donations: existing.donations + 1,
          meals: existing.meals + (listing.quantity || 0),
        });
      });

      const result: MonthlyAnalytics[] = [];
      monthlyMap.forEach((value, key) => {
        const [year, month] = key.split('-').map(Number);
        // Only include months up to current month
        if (year < currentYear || (year === currentYear && month <= currentMonth)) {
          result.push({
            year,
            month,
            donations_count: value.donations,
            meals_served: value.meals,
          });
        }
      });

      return result.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
    },
    enabled: !!user && isAdmin && !!listingsQuery.data,
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
        pendingVerifications: profiles.filter(p => p.verification_status === 'pending' && p.role !== 'admin').length,
        totalListings: listings.length,
        completedDonations: listings.filter(l => l.status === 'completed').length,
        activeListings: listings.filter(l => ['posted', 'requested', 'confirmed'].includes(l.status)).length,
      };
    },
    enabled: !!profilesQuery.data && !!listingsQuery.data && isAdmin,
  });

  const updateVerificationMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: 'approved' | 'rejected' | 'pending' }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: status })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      const statusText = variables.status === 'approved' ? 'approved' : 
                         variables.status === 'rejected' ? 'rejected' : 'set to pending';
      toast({
        title: 'Status Updated',
        description: `User has been ${statusText}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: async ({ userId, blocked, reason }: { userId: string; blocked: boolean; reason?: string }) => {
      const updateData: Record<string, unknown> = {
        is_blocked: blocked,
        blocked_reason: blocked ? reason || null : null,
        blocked_at: blocked ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      toast({
        title: variables.blocked ? 'User Blocked' : 'User Unblocked',
        description: variables.blocked 
          ? 'The user has been blocked from the platform.'
          : 'The user has been unblocked.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
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
    pendingVerifications: profiles.filter(p => p.verification_status === 'pending' && p.role !== 'admin').length,
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
    analytics: analyticsQuery.data ?? [],
    isLoading: profilesQuery.isLoading || listingsQuery.isLoading,
    updateVerification: updateVerificationMutation.mutateAsync,
    isUpdatingVerification: updateVerificationMutation.isPending,
    blockUser: blockUserMutation.mutateAsync,
    isBlockingUser: blockUserMutation.isPending,
    deleteListing: deleteListingMutation.mutateAsync,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  };
};
