import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { OrganisationPanel, OrganisationProvider } from '@/modules/organisation';

const SettingsPanel: React.FC = () => {
  const { isAdmin, loading: roleLoading } = useUserRole();

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
      canCreateUsers: isAdmin,
      canEditUsers: isAdmin,
      canDeleteUsers: isAdmin,
      canManageRoles: isAdmin,
      canManageDepartments: isAdmin,
      canManageLocations: isAdmin,
      canManageCertificates: isAdmin,
      canManageProfile: isAdmin,
    },
    onNavigate: (tab: string) => console.log(`Navigated to ${tab}`),
    onUserAction: (action: string, data?: any) => console.log(`User action: ${action}`, data),
  };

  return (
    <OrganisationProvider config={organisationConfig}>
      <OrganisationPanel 
        title="Organisation"
        description="Manage users, roles, departments, and locations"
        showAdminBadge={isAdmin}
      />
    </OrganisationProvider>
  );
};

export default SettingsPanel;