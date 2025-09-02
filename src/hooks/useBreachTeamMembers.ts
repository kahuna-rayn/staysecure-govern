import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BreachTeamMember {
  id: string;
  breach_team_id: string;
  user_id: string;
  role_id?: string;
  department_id?: string;
  is_primary: boolean;
  assigned_at: string;
  assigned_by?: string;
  profiles?: { full_name: string };
  roles?: { name: string };
  departments?: { name: string };
}

export interface Profile {
  id: string;
  full_name: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface Role {
  role_id: string;
  name: string;
}

export const useBreachTeamMembers = (breachTeamId: string) => {
  const [members, setMembers] = useState<BreachTeamMember[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('breach_team_members')
        .select(`
          *,
          profiles!user_id (full_name),
          roles!role_id (name),
          departments!department_id (name)
        `)
        .eq('breach_team_id', breachTeamId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setMembers((data as any) || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load team members');
    }
  };

  const fetchReferenceData = async () => {
    try {
      const [profilesRes, departmentsRes, rolesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name')
          .eq('status', 'Active')
          .order('full_name'),
        supabase
          .from('departments')
          .select('id, name')
          .order('name'),
        supabase
          .from('roles')
          .select('role_id, name')
          .eq('is_active', true)
          .order('name')
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (departmentsRes.error) throw departmentsRes.error;
      if (rolesRes.error) throw rolesRes.error;

      setProfiles(profilesRes.data || []);
      setDepartments(departmentsRes.data || []);
      setRoles(rolesRes.data || []);
    } catch (error) {
      console.error('Error fetching reference data:', error);
      toast.error('Failed to load reference data');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMembers(), fetchReferenceData()]);
      setLoading(false);
    };

    if (breachTeamId) {
      loadData();
    }
  }, [breachTeamId]);

  const addMember = async (params: {
    userId: string;
    roleId?: string;
    departmentId?: string;
    isPrimary?: boolean;
  }) => {
    try {
      const { userId, roleId, departmentId, isPrimary = false } = params;
      const currentUser = await supabase.auth.getUser();

      const { error } = await supabase
        .from('breach_team_members')
        .insert({
          breach_team_id: breachTeamId,
          user_id: userId,
          role_id: roleId || null,
          department_id: departmentId || null,
          is_primary: isPrimary,
          assigned_by: currentUser.data.user?.id
        });

      if (error) throw error;

      toast.success('Member added successfully');
      await fetchMembers();
      return { success: true };
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast.error(error.message || 'Failed to add member');
      return { success: false, error: error.message };
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('breach_team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member removed successfully');
      await fetchMembers();
      return { success: true };
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast.error(error.message || 'Failed to remove member');
      return { success: false, error: error.message };
    }
  };

  const setPrimaryMember = async (memberId: string) => {
    try {
      // First, unset all primary flags for this breach team
      await supabase
        .from('breach_team_members')
        .update({ is_primary: false })
        .eq('breach_team_id', breachTeamId);

      // Then set the selected member as primary
      const { error } = await supabase
        .from('breach_team_members')
        .update({ is_primary: true })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Primary member updated');
      await fetchMembers();
      return { success: true };
    } catch (error: any) {
      console.error('Error setting primary member:', error);
      toast.error(error.message || 'Failed to set primary member');
      return { success: false, error: error.message };
    }
  };

  const updateMember = async (memberId: string, updates: {
    roleId?: string;
    departmentId?: string;
    isPrimary?: boolean;
  }) => {
    try {
      const { error } = await supabase
        .from('breach_team_members')
        .update({
          role_id: updates.roleId || null,
          department_id: updates.departmentId || null,
          is_primary: updates.isPrimary || false
        })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member updated successfully');
      await fetchMembers();
      return { success: true };
    } catch (error: any) {
      console.error('Error updating member:', error);
      toast.error(error.message || 'Failed to update member');
      return { success: false, error: error.message };
    }
  };

  return {
    members,
    profiles,
    departments,
    roles,
    loading,
    addMember,
    removeMember,
    setPrimaryMember,
    updateMember,
    refetch: fetchMembers
  };
};