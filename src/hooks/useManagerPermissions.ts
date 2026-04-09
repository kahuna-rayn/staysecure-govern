import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

export interface ManagedDepartment {
  id: string;
  name: string;
  description?: string;
}

export interface ManagedUser {
  id: string;
  full_name?: string;
  email?: string;
  username?: string;
  department?: string;
  role?: string;
  status?: string;
}

export const useManagerPermissions = () => {
  const { isManager, hasManagerAccess, hasAdminAccess } = useUserRole();
  const [managedDepartments, setManagedDepartments] = useState<ManagedDepartment[]>([]);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchManagedDepartments = async () => {
    if (!isManager) return;
    
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('departments')
        .select('id, name, description')
        .eq('manager_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;
      setManagedDepartments(data || []);
    } catch (err) {
      console.error('Error fetching managed departments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch managed departments');
    } finally {
      setLoading(false);
    }
  };

  /** Users this manager can see: (a) department members + (b) direct reports (profiles.manager). */
  const fetchManagedUsers = async () => {
    if (!isManager) return;

    try {
      setLoading(true);
      setError(null);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      const uid = authUser?.id;
      if (!uid) {
        setManagedUsers([]);
        return;
      }

      // (a) User IDs from managed departments
      const departmentIds = managedDepartments.map(d => d.id);
      let userIds: string[] = [];
      if (departmentIds.length > 0) {
        const { data: userDepartments, error: udError } = await supabase
          .from('user_departments')
          .select('user_id, department_id')
          .in('department_id', departmentIds);
        if (udError) throw udError;
        userIds = userDepartments?.map(ud => ud.user_id) || [];
      }

      // (b) Direct reports (profiles.manager = current user)
      const { data: directProfiles, error: directError } = await supabase
        .from('profiles')
        .select('id')
        .eq('manager', uid);
      if (directError) throw directError;
      const directIds = (directProfiles || []).map(p => p.id);
      // Include the manager so they appear in staff counts and performance metrics (standard practice)
      const allIds = [...new Set([uid, ...userIds, ...directIds])];

      if (allIds.length === 0) {
        setManagedUsers([]);
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, username, status')
        .in('id', allIds);

      if (profileError) throw profileError;

      const { data: accountData } = await supabase
        .from('account_inventory')
        .select('user_id, username_email')
        .in('user_id', allIds);

      const users: ManagedUser[] = (profiles || []).map(profile => ({
        id: profile.id,
        full_name: profile.full_name,
        username: profile.username,
        status: profile.status,
        email: accountData?.find(acc => acc.user_id === profile.id)?.username_email,
      }));

      setManagedUsers(users);
    } catch (err) {
      console.error('Error fetching managed users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch managed users');
    } finally {
      setLoading(false);
    }
  };

  const managedUserIds = useMemo(() => managedUsers.map(u => u.id), [managedUsers]);

  const canViewUser = (userId: string): boolean => {
    if (!isManager) return false;
    return managedUserIds.includes(userId);
  };

  const canManageDepartment = (departmentId: string): boolean => {
    if (!isManager) return false;
    return managedDepartments.some(dept => dept.id === departmentId);
  };

  useEffect(() => {
    if (isManager) {
      fetchManagedDepartments();
    }
  }, [isManager]);

  useEffect(() => {
    if (isManager) {
      fetchManagedUsers();
    }
  }, [isManager, managedDepartments]);

  return {
    isManager,
    hasManagerAccess,
    hasAdminAccess,
    managedDepartments,
    managedUsers,
    managedUserIds,
    loading,
    error,
    canViewUser,
    canManageDepartment,
    refetchManagedDepartments: fetchManagedDepartments,
    refetchManagedUsers: fetchManagedUsers,
  };
};