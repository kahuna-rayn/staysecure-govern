import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import HIBChecklistTable from './HIBChecklistTable';
import HIBImportSection from './HIBImportSection';
import HIBActionButtons from './HIBActionButtons';
import {
  HIBClause,
  getInitialClauses,
  loadHIBData,
  saveHIBData,
  updateHIBClause,
  createHIBClause,
  deleteHIBClause
} from '@/utils/hibDataUtils';

const HIBChecklist: React.FC = () => {
  const { user } = useAuth();
  const [clauses, setClauses] = useState<HIBClause[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await loadHIBData(user.id);
      
      if (data.length > 0) {
        setClauses(data);
      } else {
        // Initialize with sample data if no data exists
        const initialClauses = getInitialClauses();
        setClauses(initialClauses);
        await saveHIBData(user.id, initialClauses);
      }
    } catch (error) {
      console.error('Error loading HIB checklist:', error);
      toast({
        title: "Error",
        description: "Failed to load HIB checklist data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleImport = async (importedClauses: HIBClause[]) => {
    if (!user) return;

    try {
      setClauses(importedClauses);
      await saveHIBData(user.id, importedClauses);
      toast({
        title: "Import successful",
        description: `Imported ${importedClauses.length} HIB clauses and saved to database`,
      });
    } catch (error) {
      toast({
        title: "Import successful but save failed",
        description: `Imported ${importedClauses.length} HIB clauses but failed to save to database`,
        variant: "destructive",
      });
    }
  };

  const handleUpdateClause = async (id: string, updates: Partial<HIBClause>) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    console.log('handleUpdateClause called with:', { id, updates, userId: user.id });

    // Update local state immediately
    setClauses(prev => {
      const updated = prev.map(clause => 
        clause.id === id ? { ...clause, ...updates } : clause
      );
      console.log('Local state updated:', updated.find(c => c.id === id));
      return updated;
    });

    const result = await updateHIBClause(user.id, id, updates);
    console.log('Database update result:', result);
    
    if (!result.success) {
      // Revert local state if database update failed
      setClauses(prev => prev.map(clause => 
        clause.id === id ? { ...clause, ...updates } : clause
      ));
      
      toast({
        title: "Update failed",
        description: result.error || "Failed to update clause",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Updated",
        description: "Clause updated successfully",
      });
    }

    return result;
  };

  const handleCreateClause = async (data: Partial<HIBClause>) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    const result = await createHIBClause(user.id, data);
    
    if (result.success && result.data) {
      setClauses(prev => [...prev, result.data!]);
    }

    return { success: result.success, error: result.error };
  };

  const handleDeleteClause = async (id: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    const result = await deleteHIBClause(user.id, id);
    
    if (result.success) {
      setClauses(prev => prev.filter(clause => clause.id !== id));
    }

    return result;
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Please log in to access the HIB Checklist functionality.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading HIB Checklist...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Health Information Bill Checklist</h3>
          <p className="text-sm text-muted-foreground">
            Complete the implementation status and remarks for each clause (click on any cell to edit)
          </p>
        </div>
        <HIBActionButtons 
          clauses={clauses}
          onToggleImport={() => setShowImport(!showImport)}
        />
      </div>

      {showImport && (
        <HIBImportSection
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}

      <Card>
        <CardContent className="p-4">
          <HIBChecklistTable
            clauses={clauses}
            onUpdate={handleUpdateClause}
            onCreate={handleCreateClause}
            onDelete={handleDeleteClause}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default HIBChecklist;
