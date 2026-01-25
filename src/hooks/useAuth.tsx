import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

type AppRole = 'donor' | 'ngo' | 'admin';

interface Profile {
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
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (
    email: string,
    password: string,
    userData: {
      name: string;
      role: AppRole;
      orgName: string;
      contact: string;
      address: string;
    }
  ) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return null;
      }
      
      if (profileData) {
        // Ensure is_blocked has a default value
        const profile = {
          ...profileData,
          is_blocked: profileData.is_blocked ?? false,
          blocked_reason: profileData.blocked_reason ?? null,
        } as Profile;
        setProfile(profile);
        return profile;
      }
      return null;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  const fetchRole = async (userId: string): Promise<AppRole | null> => {
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (roleError) {
        console.error('Error fetching role:', roleError);
        return null;
      }
      
      if (roleData) {
        const userRole = roleData.role as AppRole;
        setRole(userRole);
        return userRole;
      }
      return null;
    } catch (error) {
      console.error('Error in fetchRole:', error);
      return null;
    }
  };

  const fetchUserData = async (userId: string) => {
    const [profileResult, roleResult] = await Promise.all([
      fetchProfile(userId),
      fetchRole(userId),
    ]);
    return { profile: profileResult, role: roleResult };
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // Only handle sign out events here - login is handled by login function
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setRole(null);
          setIsLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Handle token refresh
          setSession(session);
          setUser(session.user);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        await fetchUserData(session.user.id);
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Set loading to true at the start of login
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setIsLoading(false);
        return { error: error.message };
      }

      if (!data.user) {
        setIsLoading(false);
        return { error: 'Login failed. Please try again.' };
      }

      // Fetch user data immediately after login and set state
      const userData = await fetchUserData(data.user.id);
      
      // Set session and user immediately
      setSession(data.session);
      setUser(data.user);

      // Check if user is blocked
      if (userData.profile?.is_blocked) {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        setRole(null);
        setIsLoading(false);
        const reason = userData.profile.blocked_reason || 'Please contact support.';
        return { error: `Your account has been suspended. ${reason}` };
      }

      // Check verification status (admins bypass this check)
      if (userData.role !== 'admin' && userData.profile) {
        if (userData.profile.verification_status === 'pending') {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setProfile(null);
          setRole(null);
          setIsLoading(false);
          return { error: 'Your account is pending verification. Please wait for admin approval.' };
        }
        if (userData.profile.verification_status === 'rejected') {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setProfile(null);
          setRole(null);
          setIsLoading(false);
          return { error: 'Your account has been rejected. Please contact support for more information.' };
        }
      }

      // Only set isLoading to false after all data is ready
      setIsLoading(false);
      return { error: null, role: userData.role };
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const register = async (
    email: string,
    password: string,
    userData: {
      name: string;
      role: AppRole;
      orgName: string;
      contact: string;
      address: string;
    }
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            name: userData.name,
            role: userData.role,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (!data.user) {
        return { error: 'Registration failed. Please try again.' };
      }

      // Wait for the trigger to create the profile and role
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify profile exists, if not wait a bit more
      let retries = 3;
      let profileExists = false;
      
      while (retries > 0 && !profileExists) {
        const { data: checkProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();
        
        if (checkProfile) {
          profileExists = true;
        } else {
          await new Promise(resolve => setTimeout(resolve, 500));
          retries--;
        }
      }

      // Update profile with additional data
      if (profileExists) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            name: userData.name,
            org_name: userData.orgName,
            contact: userData.contact,
            address: userData.address,
          })
          .eq('user_id', data.user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
        }
      }

      // Sign out after registration (they need to wait for approval)
      await supabase.auth.signOut();

      return { error: null };
    } catch (error) {
      console.error('Registration error:', error);
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', user.id);

      if (error) {
        return { error: error.message };
      }

      await fetchProfile(user.id);
      return { error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error: 'Failed to update profile.' };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  // isAuthenticated should check for user, session, role, AND profile
  const isAuthenticated = !!user && !!session && !!role && !!profile;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
