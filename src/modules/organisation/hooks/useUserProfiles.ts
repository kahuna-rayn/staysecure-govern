import { useState, useEffect } from 'react';
import { useOrganisationContext } from '../context/OrganisationContext';
import type { UserProfile } from '../types';

export const useUserProfiles = () => {
  const { supabaseClient } = useOrganisationContext();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profiles from the profiles table
      const { data: profilesData, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('full_name');

      if (profilesError) throw profilesError;

      // Try to enrich with email data from account_inventory
      let enrichedProfiles = [...(profilesData || [])];
      
      try {
        const { data: accountData, error: accountError } = await supabaseClient
          .from('account_inventory')
          .select('user_id, email');

        if (!accountError && accountData) {
          const emailMap = new Map(accountData.map(acc => [acc.user_id, acc.email]));
          
          enrichedProfiles = profilesData?.map(profile => ({
            ...profile,
            email: profile.email || emailMap.get(profile.id) || undefined
          })) || [];
        }
      } catch (emailError) {
        console.warn('Could not fetch email data:', emailError);
      }

      setProfiles(enrichedProfiles);
    } catch (err: any) {
      console.error('Error fetching profiles:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileId: string, updates: Partial<UserProfile>) => {
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update(updates)
        .eq('id', profileId);

      if (error) throw error;

      // Update local state
      setProfiles(prev => prev.map(profile => 
        profile.id === profileId ? { ...profile, ...updates } : profile
      ));

      return { success: true };
    } catch (err: any) {
      console.error('Error updating profile:', err);
      return { success: false, error: err.message };
    }
  };

  const createProfile = async (profileData: Partial<UserProfile>) => {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setProfiles(prev => [...prev, data]);

      return { success: true, data };
    } catch (err: any) {
      console.error('Error creating profile:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteProfile = async (profileId: string) => {
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      // Remove from local state
      setProfiles(prev => prev.filter(profile => profile.id !== profileId));

      return { success: true };
    } catch (err: any) {
      console.error('Error deleting profile:', err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [supabaseClient]);

  return {
    profiles,
    loading,
    error,
    refetch: fetchProfiles,
    updateProfile,
    createProfile,
    deleteProfile,
  };
};