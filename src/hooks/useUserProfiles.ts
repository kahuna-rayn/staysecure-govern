import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  department: string;
  manager: string;
  phone: string;
  location: string;
  employee_id: string;
  access_level: string;
  status: string;
  start_date: string;
  last_login: string;
  password_last_changed: string;
  two_factor_enabled: boolean;
  avatar_url: string;
  bio: string;
  cyber_learner: boolean;
  dpe_learner: boolean;
  learn_complete: boolean;
  dpe_complete: boolean;
  enrolled_in_learn: boolean;
  language: string;
  created_at: string;
  updated_at: string;
}

export const useUserProfiles = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      // First fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch emails from account_inventory table
      const { data: accountInventoryData, error: accountError } = await supabase
        .from('account_inventory')
        .select('full_name, username_email');

      if (accountError) {
        console.error('Error fetching account inventory emails:', accountError);
      }

      // Create a map of full names to emails from account inventory
      const emailMap = new Map<string, string>();
      if (accountInventoryData) {
        accountInventoryData.forEach((account: any) => {
          if (account.full_name && account.username_email) {
            emailMap.set(account.full_name, account.username_email);
          }
        });
      }

      // Note: admin.listUsers() requires admin privileges, so we skip this for regular users
      const authEmailMap = new Map<string, string>();

      const formattedProfiles: UserProfile[] = (profilesData || []).map((profile: any) => ({
        id: profile.id,
        full_name: profile.full_name || '',
        username: profile.username || '',
        // Try to get email from account inventory first, then from auth, then fall back to 'Not available'
        email: emailMap.get(profile.full_name) || authEmailMap.get(profile.id) || 'Not available',
        role: '', // Role would need to be fetched from user_profile_roles
        department: '', // Department would need to be fetched from user_departments
        manager: profile.manager || '',
        phone: profile.phone || '',
        location: profile.location || '',
        employee_id: profile.employee_id || '',
        access_level: profile.access_level || '',
        status: profile.status || '',
        start_date: profile.start_date || '',
        last_login: profile.last_login || '',
        password_last_changed: profile.password_last_changed || '',
        two_factor_enabled: profile.two_factor_enabled || false,
        avatar_url: profile.avatar_url || '',
        bio: profile.bio || '',
        cyber_learner: profile.cyber_learner ?? false,
        dpe_learner: profile.dpe_learner ?? false,
        learn_complete: profile.learn_complete ?? false,
        dpe_complete: profile.dpe_complete ?? false,
        enrolled_in_learn: profile.enrolled_in_learn ?? false,
        language: profile.language || '',
        created_at: profile.created_at || '',
        updated_at: profile.updated_at || ''
      }));

      setProfiles(formattedProfiles);
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profiles');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileId: string, updates: Partial<UserProfile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profileId);

      if (error) throw error;

      // Update local state
      setProfiles(prev => prev.map(profile => 
        profile.id === profileId ? { ...profile, ...updates } : profile
      ));
      return { success: true };
    } catch (err) {
      console.error('Error updating profile:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update profile' 
      };
    }
  };

  const createProfile = async (profileData: Partial<UserProfile>) => {
    try {
      // Ensure required id field is present
      const profileWithId = {
        id: profileData.id,
        ...profileData
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileWithId)
        .select()
        .single();

      if (error) throw error;

      const newProfile: UserProfile = {
        id: data.id,
        full_name: data.full_name || '',
        username: data.username || '',
        email: '',
        role: '', // Role would need to be fetched from user_profile_roles
        department: '', // Department would need to be fetched from user_departments
        manager: data.manager || '',
        phone: data.phone || '',
        location: data.location || '',
        employee_id: data.employee_id || '',
        access_level: data.access_level || '',
        status: data.status || '',
        start_date: data.start_date || '',
        last_login: data.last_login || '',
        password_last_changed: data.password_last_changed || '',
        two_factor_enabled: data.two_factor_enabled || false,
        avatar_url: data.avatar_url || '',
        bio: data.bio || '',
        cyber_learner: (data as any).cyber_learner ?? false,
        dpe_learner: (data as any).dpe_learner ?? false,
        learn_complete: (data as any).learn_complete ?? false,
        dpe_complete: (data as any).dpe_complete ?? false,
        enrolled_in_learn: (data as any).enrolled_in_learn ?? false,
        language: (data as any).language || '',
        created_at: data.created_at || '',
        updated_at: data.updated_at || ''
      };

      setProfiles(prev => [newProfile, ...prev]);
      return { success: true, data: newProfile };
    } catch (err) {
      console.error('Error creating profile:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to create profile' 
      };
    }
  };

  const deleteProfile = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      // Update local state
      setProfiles(prev => prev.filter(profile => profile.id !== profileId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting profile:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete profile' 
      };
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  return {
    profiles,
    loading,
    error,
    refetch: fetchProfiles,
    updateProfile,
    createProfile,
    deleteProfile
  };
};
