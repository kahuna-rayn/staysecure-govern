import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from 'staysecure-auth';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [isDepartmentManager, setIsDepartmentManager] = useState(false);
  const [isUserManager, setIsUserManager] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      let cancelled = false;
      setLoading(true);

      const fetchAll = async () => {
        const [roleResult, deptManagerResult, userManagerResult] = await Promise.all([
          supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(),
          supabase.from('departments').select('id').eq('manager_id', user.id).limit(1),
          supabase.from('profiles').select('id').eq('manager', user.id).limit(1),
        ]);

        if (cancelled) return;

        const { data: roleData, error: roleError } = roleResult;
        if (roleError) console.error('Error fetching user role:', roleError);
        setRole(roleData?.role ?? null);

        const { data: deptData, error: deptError } = deptManagerResult;
        if (deptError) console.error('Error checking department manager:', deptError);
        setIsDepartmentManager(!!(deptData && deptData.length > 0));

        const { data: directReportData, error: directError } = userManagerResult;
        if (directError) console.error('Error checking direct reports (profiles.manager):', directError);
        setIsUserManager(!!(directReportData && directReportData.length > 0));

        setLoading(false);
      };

      fetchAll();
      return () => { cancelled = true; };
    } else {
      setLoading(false);
    }
  }, [user]);

  const isAdmin = role === 'admin' || role === 'super_admin' || role === 'client_admin';
  const isSuperAdmin = role === 'super_admin';
  const isClientAdmin = role === 'client_admin';
  const isModerator = role === 'moderator';
  // Manager = department manager (departments.manager_id) or user manager (profiles.manager)
  const isManager = isDepartmentManager || isUserManager;

  const hasAdminAccess = isSuperAdmin || isClientAdmin;
  const hasManagerAccess = isManager;

  // Permission checks
  const canAccessAssignments = hasAdminAccess || hasManagerAccess;
  const canAccessAnalytics = hasAdminAccess || hasManagerAccess;
  const canAccessReports = hasAdminAccess || hasManagerAccess;
  const canAccessOrganisation = hasAdminAccess;
  const canAccessNotifications = hasAdminAccess;
  const canAccessTemplates = hasAdminAccess;
  const canAccessAnyAdminFeature = hasAdminAccess || hasManagerAccess;

  const getRoleDisplayName = () => {
    if (isManager && !hasAdminAccess) return 'Manager';
    switch (role) {
      case 'super_admin': return 'Super Administrator';
      case 'client_admin': return 'Administrator';
      case 'moderator': return 'Moderator';
      case 'user': return 'User';
      default: return 'User';
    }
  };

  const getRoleBadgeVariant = () => {
    switch (role) {
      case 'super_admin':
      case 'client_admin':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const refetch = async () => {
    if (!user?.id) return;
    setLoading(true);
    const [roleResult, deptResult, userManagerResult] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(),
      supabase.from('departments').select('id').eq('manager_id', user.id).limit(1),
      supabase.from('profiles').select('id').eq('manager', user.id).limit(1),
    ]);
    const { data: roleData, error: roleError } = roleResult;
    if (roleError) console.error('Error fetching user role:', roleError);
    setRole(roleData?.role ?? null);
    const { data: deptData, error: deptError } = deptResult;
    if (deptError) console.error('Error checking department manager:', deptError);
    setIsDepartmentManager(!!(deptData && deptData.length > 0));
    const { data: directReportData, error: directError } = userManagerResult;
    if (directError) console.error('Error checking direct reports:', directError);
    setIsUserManager(!!(directReportData && directReportData.length > 0));
    setLoading(false);
  };

  return {
    role,
    isAdmin,
    isSuperAdmin,
    isClientAdmin,
    isModerator,
    isManager,
    hasAdminAccess,
    hasManagerAccess,
    canAccessAssignments,
    canAccessAnalytics,
    canAccessReports,
    canAccessOrganisation,
    canAccessNotifications,
    canAccessTemplates,
    canAccessAnyAdminFeature,
    loading,
    refetch,
    getRoleDisplayName,
    getRoleBadgeVariant,
  };
};
