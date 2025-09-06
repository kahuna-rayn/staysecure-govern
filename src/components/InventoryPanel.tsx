import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Settings, Shield, Package, BarChart, Upload } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import UserManagement from './admin/UserManagement';
import InventoryManagement from './admin/InventoryManagement';
import Dashboard from './Dashboard';
import ImportData from './ImportData';

const InventoryPanel: React.FC = () => {
  const location = useLocation();
  const { hasPermission, role, loading: roleLoading } = useUserRole();
  const { profiles, loading: profilesLoading } = useUserProfiles();
  const [activeTab, setActiveTab] = useState('inventory');

  // Ensure inventory tab is active by default when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveTab('inventory');
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle navigation state to set active tab
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeUsers = profiles.filter(p => p.status === 'Active').length;
  const totalUsers = profiles.length;

  const handleNavigateToImport = () => {
    console.log('Navigating to import tab');
    setActiveTab('import');
  };

  return (
    <div className="w-full px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage hardware, software, accounts, physical locations and import data</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Administrator
        </Badge>
      </div>

      {/* Admin Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inventory" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Inventory
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="space-y-4">
              <InventoryManagement />
            </TabsContent>

            <TabsContent value="import" className="space-y-4">
              <ImportData />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryPanel;