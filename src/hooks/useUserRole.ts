import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from 'staysecure-auth';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserRole = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setRole(data?.role || null);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for role checking
  const isAdmin = role === 'admin' || role === 'super_admin' || role === 'client_admin'; // Legacy compatibility
  const isSuperAdmin = role === 'super_admin';
  const isClientAdmin = role === 'client_admin'; // Support existing client_admin users
  const isModerator = role === 'moderator';
  
  // Check if user has any admin privileges
  const hasAdminAccess = isSuperAdmin || isClientAdmin;

  // Permission checks for different features
  const canAccessLessons = isSuperAdmin;
  const canAccessLearningTracks = isSuperAdmin;
  const canAccessTranslation = isSuperAdmin;
  const canAccessAssignments = hasAdminAccess;
  const canAccessAnalytics = hasAdminAccess;
  const canAccessReports = hasAdminAccess;
  const canAccessOrganisation = hasAdminAccess;
  const canAccessNotifications = hasAdminAccess;
  const canAccessTemplates = hasAdminAccess;
  const canAccessAnyAdminFeature = hasAdminAccess;

  // Get display name for role
  const getRoleDisplayName = () => {
    switch (role) {
      case 'super_admin':
        return 'Super Administrator';
      case 'client_admin':
        return 'Administrator';
      case 'moderator':
        return 'Moderator';
      case 'user':
        return 'User';
      default:
        return 'User';
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = () => {
    switch (role) {
      case 'super_admin':
      case 'client_admin':
        return 'destructive'; // Red color to stand out
      case 'moderator':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return {
    role,
    isAdmin,
    isSuperAdmin,
    isClientAdmin,
    isModerator,
    hasAdminAccess,
    canAccessLessons,
    canAccessLearningTracks,
    canAccessTranslation,
    canAccessAssignments,
    canAccessAnalytics,
    canAccessReports,
    canAccessOrganisation,
    canAccessNotifications,
    canAccessTemplates,
    canAccessAnyAdminFeature,
    loading,
    refetch: fetchUserRole,
    getRoleDisplayName,
    getRoleBadgeVariant,
  };
};