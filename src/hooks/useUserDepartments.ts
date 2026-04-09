import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { debug } from '@/utils/debug';
import { useState } from 'react';

export interface UserDepartment {
  id: string;
  user_id: string;
  department_id: string;
  department_name: string;
  is_primary: boolean;
  assigned_at: string;
  assigned_by: string;
  pairing_id: string;
}

export const USER_DEPARTMENTS_KEY = (userId?: string) => ['user-departments', userId] as const;

export const useUserDepartments = (userId?: string) => {
  const queryClient = useQueryClient();
  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  const [isRemovingDepartment, setIsRemovingDepartment] = useState(false);
  const [isUpdatingPrimary, setIsUpdatingPrimary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: userDepartments = [], isLoading, refetch } = useQuery({
    queryKey: USER_DEPARTMENTS_KEY(userId),
    queryFn: async () => {
      if (!userId) return [];

      debug.log('useUserDepartments: Fetching departments for user:', userId);

      const { data, error } = await supabase
        .from('user_departments')
        .select(`
          id,
          user_id,
          department_id,
          is_primary,
          assigned_at,
          assigned_by,
          pairing_id,
          department:departments(name)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        department_id: item.department_id,
        department_name: (item as any).department?.name || '',
        is_primary: item.is_primary || false,
        assigned_at: item.assigned_at,
        assigned_by: item.assigned_by || '',
        pairing_id: item.pairing_id || '',
      })) as UserDepartment[];
    },
    enabled: !!userId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: USER_DEPARTMENTS_KEY(userId) });

  const addDepartment = async (params: {
    userId: string;
    departmentId: string;
    isPrimary: boolean;
    pairingId?: string;
    assignedBy?: string;
  }) => {
    try {
      setIsAddingDepartment(true);
      debug.log('useUserDepartments: addDepartment called with params:', params);

      const { error } = await supabase
        .from('user_departments')
        .insert([{
          user_id: params.userId,
          department_id: params.departmentId,
          is_primary: params.isPrimary,
          pairing_id: params.pairingId,
          assigned_by: params.assignedBy,
        }]);

      if (error) throw error;
      await invalidate();
    } catch (err) {
      console.error('useUserDepartments: addDepartment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add department');
    } finally {
      setIsAddingDepartment(false);
    }
  };

  const removeDepartment = async (assignmentId: string) => {
    try {
      setIsRemovingDepartment(true);
      const { error } = await supabase
        .from('user_departments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      await invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove department');
    } finally {
      setIsRemovingDepartment(false);
    }
  };

  const setPrimaryDepartment = async (params: { userId: string; departmentId: string }) => {
    try {
      setIsUpdatingPrimary(true);

      await supabase
        .from('user_departments')
        .update({ is_primary: false })
        .eq('user_id', params.userId);

      const { error } = await supabase
        .from('user_departments')
        .update({ is_primary: true })
        .eq('user_id', params.userId)
        .eq('department_id', params.departmentId);

      if (error) throw error;
      await invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set primary department');
    } finally {
      setIsUpdatingPrimary(false);
    }
  };

  return {
    userDepartments,
    isLoading,
    error,
    addDepartment,
    removeDepartment,
    setPrimaryDepartment,
    isAddingDepartment,
    isRemovingDepartment,
    isUpdatingPrimary,
    refetch,
  };
};
