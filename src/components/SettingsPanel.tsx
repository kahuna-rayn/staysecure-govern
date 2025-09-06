import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { OrganisationPanel, OrganisationProvider } from '@/modules/organisation';

const SettingsPanel: React.FC = () => {
  const { isSuperAdmin, isClientAdmin, hasPermission, loading: roleLoading } = useUserRole();

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const organisationConfig = {
    supabaseClient: supabase,
    enabledTabs: ['users', 'roles', 'departments', 'locations', 'certificates', 'profile'],
    permissions: {
      canCreateUsers: hasPermission('client_admin'),
      canEditUsers: hasPermission('client_admin'),
      canDeleteUsers: isSuperAdmin, // Only super_admin can delete users
      canManageRoles: hasPermission('client_admin'),
      canManageDepartments: hasPermission('client_admin'),
      canManageLocations: hasPermission('client_admin'),
      canManageCertificates: hasPermission('client_admin'),
      canManageProfile: hasPermission('client_admin'),
    },
    onNavigate: (tab: string) => console.log(`Navigated to ${tab}`),
    onUserAction: (action: string, data?: any) => console.log(`User action: ${action}`, data),
  };

  return (
    <OrganisationProvider config={organisationConfig}>
      <OrganisationPanel 
        title="Organisation"
        description="Manage users, roles, departments, and locations"
        showAdminBadge={hasPermission('client_admin')}
      />
    </OrganisationProvider>
  );
};

export default SettingsPanel;