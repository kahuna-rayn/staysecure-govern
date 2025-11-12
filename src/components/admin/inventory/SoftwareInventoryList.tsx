
import React from 'react';
import { useInventory } from '@/hooks/useInventory';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import SoftwareTable from './SoftwareTable';
import type { SoftwareInventoryItem } from '@/hooks/useInventory';

const SoftwareInventoryList: React.FC = () => {
  const { softwareInventory, loading, error, refetch } = useInventory();

  const updateSoftwareItem = async (id: string, updates: Partial<SoftwareInventoryItem>) => {
    try {
      const { error } = await supabase
        .from('software_inventory')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await refetch();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteSoftwareItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('software_inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await refetch();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  if (loading) {
    return <div>Loading software inventory...</div>;
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-md bg-red-50">
        <p className="text-red-800">Error loading software inventory: {error}</p>
        <Button onClick={() => refetch()} className="mt-2" variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SoftwareTable
        softwareInventory={softwareInventory}
        onUpdate={updateSoftwareItem}
        onDelete={deleteSoftwareItem}
      />
    </div>
  );
};

export default SoftwareInventoryList;
