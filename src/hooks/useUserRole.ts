import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

type AppRole = 'super_admin' | 'client_admin' | 'moderator' | 'user';

const ROLE_HIERARCHY: Record<AppRole, number> = {
  super_admin: 4,
  client_admin: 3,
  moderator: 2,
  user: 1,
};

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
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
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      setRole(data?.role as AppRole || null);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  // Role hierarchy checking
  const hasPermission = (requiredRole: AppRole): boolean => {
    if (!role) return false;
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole];
  };

  // Role assignment restrictions
  const canAssignRole = (targetRole: AppRole): boolean => {
    if (!role) return false;
    
    // super_admin can assign any role
    if (role === 'super_admin') return true;
    
    // client_admin can assign client_admin, moderator, and user (not super_admin)
    if (role === 'client_admin') {
      return ['client_admin', 'moderator', 'user'].includes(targetRole);
    }
    
    return false;
  };

  // Legacy compatibility and specific role checks
  const isSuperAdmin = role === 'super_admin';
  const isClientAdmin = role === 'client_admin';
  const isAdmin = role === 'super_admin' || role === 'client_admin'; // For backward compatibility
  const isModerator = role === 'moderator';
  const isUser = role === 'user';

  return {
    role,
    isSuperAdmin,
    isClientAdmin,
    isAdmin, // Legacy - includes both super_admin and client_admin
    isModerator,
    isUser,
    hasPermission,
    canAssignRole,
    loading,
    refetch: fetchUserRole,
  };
};