import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { EditableTable } from '@/components/ui/editable-table';
import { supabase } from '@/integrations/supabase/client';
import { MultiMemberSelectCell } from '@/components/ui/editable-table/MultiMemberSelectCell';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';

interface BreachTeamRow {
  id: string;
  team_role: string;
  recommended_designee: string | null;
  activity: string | null;
  best_practice: string | null;
  org_practice: string | null;
  member: string | null; // profile id (deprecated - using junction table now)
  mandatory: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

const IncidentManagementTeamTable: React.FC = () => {
  const [rows, setRows] = useState<BreachTeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { hasAdminAccess } = useUserRole();

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('breach_management_team')
      .select('*')
      .order('sequence');
    if (!error && data) setRows(data as unknown as BreachTeamRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const onUpdate = async (id: string, updates: Partial<BreachTeamRow>) => {
    try {
      // Find the row being updated to check if it's editable
      const row = rows.find(r => r.id === id);
      
      const allowed: Partial<BreachTeamRow> = {};
      
      // Only allow org_practice updates for admins
      if (hasAdminAccess && Object.prototype.hasOwnProperty.call(updates, 'org_practice')) {
        allowed.org_practice = updates.org_practice ?? null;
      }
      
      // Only allow other fields for non-system rows (if needed in future)
      if (!row?.is_system) {
        if (Object.prototype.hasOwnProperty.call(updates, 'team_role')) {
          allowed.team_role = updates.team_role || '';
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'recommended_designee')) {
          allowed.recommended_designee = updates.recommended_designee ?? null;
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'activity')) {
          allowed.activity = updates.activity ?? null;
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'best_practice')) {
          allowed.best_practice = updates.best_practice ?? null;
        }
      }
      
      if (Object.keys(allowed).length === 0) return { success: true };

      const { error } = await (supabase as any)
        .from('breach_management_team')
        .update(allowed)
        .eq('id', id);
      if (error) throw error;
      await fetchRows();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const onDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('breach_management_team')
        .delete()
        .eq('id', id)
        .eq('is_system', false); // Only allow deleting non-system rows

      if (error) throw error;
      
      toast.success('Custom role removed successfully');
      await fetchRows();
      return { success: true };
    } catch (e: any) {
      console.error('Error deleting custom role:', e);
      toast.error(e.message || 'Failed to remove custom role');
      return { success: false, error: e.message };
    }
  };

  const onCreate = async (newRow: Partial<BreachTeamRow>) => {
    try {
      // Find the maximum sequence_id from existing rows
      const maxSequence = rows.length > 0
        ? Math.max(...rows.map(row => (row as any).sequence || 0))
        : 0;
      
      // Set the new sequence_id to be one higher than the maximum
      const nextSequence = maxSequence + 1;

      const { error } = await supabase
        .from('breach_management_team')
        .insert({
          team_role: newRow.team_role || '',
          recommended_designee: newRow.recommended_designee || null,
          activity: newRow.activity || null,
          best_practice: newRow.best_practice || null,
          org_practice: newRow.org_practice || null,
          mandatory: false,
          is_system: false,
          sequence: nextSequence
        });

      if (error) throw error;
      
      toast.success('Custom role added successfully');
      await fetchRows();
      return { success: true };
    } catch (e: any) {
      console.error('Error creating custom role:', e);
      toast.error(e.message || 'Failed to add custom role');
      return { success: false, error: e.message };
    }
  };

  const renderMemberCell = useCallback((item: BreachTeamRow) => {
    return <MultiMemberSelectCell breachTeamId={item.id} onUpdate={fetchRows} />;
  }, [fetchRows]);

  const columns = useMemo(() => [
    { 
      key: 'team_role', 
      header: 'Team Role', 
      editable: false, 
      sortable: true 
    },
    { 
      key: 'recommended_designee', 
      header: 'Recommended Designee', 
      editable: false 
    },
    { 
      key: 'activity', 
      header: 'Activity', 
      editable: false, 
      sortable: true,
      className: 'max-w-[400px]'
    },
    { 
      key: 'best_practice', 
      header: 'Best Practice', 
      type: 'textarea' as const, 
      editable: false, 
      className: 'max-w-[350px]' 
    },
    { 
      key: 'org_practice', 
      header: 'Your Organization Practice', 
      type: 'textarea' as const, 
      editable: hasAdminAccess, 
      className: 'max-w-[350px]' 
    },
    { 
      key: 'member', 
      header: 'Assigned Members', 
      type: 'custom' as const, 
      editable: false,
      render: renderMemberCell,
      className: 'max-w-[188px]'
    } as any,
  ], [hasAdminAccess, renderMemberCell]);

  if (loading) return <div>Loading team...</div>;

  return (
    <EditableTable
      data={rows}
      columns={columns}
      onUpdate={onUpdate}
      onCreate={onCreate}
      onDelete={onDelete}
      allowAdd={true}
      allowDelete={true}
      allowView={false}
    />
  );
};

export default IncidentManagementTeamTable;
