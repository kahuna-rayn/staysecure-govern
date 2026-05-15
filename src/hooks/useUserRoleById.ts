import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AppRole = 'super_admin' | 'client_admin' | 'manager' | 'author' | 'user';

export const useUserRoleById = (userId?: string) => {
  const queryClient = useQueryClient();

  const { data: role, isLoading, error } = useQuery({
    queryKey: ['user-role', userId],
    queryFn: async () => {
      if (!userId) return 'user';
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
  
      if (error) {
        console.error('Error fetching user role:', error);
        throw error;
      }
      
      const roleValue = (data?.role as AppRole) || 'user';
      return roleValue;
    },
    enabled: !!userId,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (newRole: AppRole) => {
      if (!userId) throw new Error('User ID is required');

      // Map role → product_license_assignments.access_level (author not applicable in Govern)
      const accessLevelMap: Partial<Record<AppRole, string>> = {
        client_admin: 'admin',
        user: 'user',
        manager: 'user',
      };
      const newAccessLevel = accessLevelMap[newRole] ?? null;

      // ── Update user_roles ─────────────────────────────────────────────────
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);
      if (roleError) throw roleError;

      // ── Sync product_license_assignments via SECURITY DEFINER RPC ────────
      if (newAccessLevel !== null) {
        const { data: existing } = await supabase
          .from('product_license_assignments')
          .select('license_id')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();

        if (existing?.license_id) {
          const { error: assignError } = await (supabase.rpc as any)('update_user_access_level', {
            p_user_id: userId,
            p_license_id: existing.license_id,
            p_access_level: newAccessLevel,
          });
          if (assignError) console.warn('Could not sync license assignment:', assignError.message);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-role', userId] });
      toast.success('User role updated successfully');
    },
    onError: (error) => {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    },
  });

  const getRoleDisplayName = (role: AppRole | null) => {
    switch (role) {
      case 'super_admin':
        return 'Super Administrator';
      case 'client_admin':
        return 'Client Administrator';
      case 'manager':
        return 'Manager';
      case 'author':
        return 'Author';
      case 'user':
        return 'User';
      default:
        return 'User';
    }
  };

  const getRoleBadgeVariant = (role: AppRole | null) => {
    switch (role) {
      case 'super_admin':
      case 'client_admin':
        return 'destructive' as const; // Red
      case 'user':
        return 'default' as const; // Green (you may need to add a 'success' variant)
      case 'manager':
        return 'secondary' as const; // Blue
      case 'author':
        return 'outline' as const; // Orange (you may need to add a 'warning' variant)
      default:
        return 'outline' as const;
    }
  };

  return {
    role,
    isLoading,
    error,
    updateRole: updateRoleMutation.mutate,
    isUpdating: updateRoleMutation.isPending,
    getRoleDisplayName,
    getRoleBadgeVariant,
  };
};
