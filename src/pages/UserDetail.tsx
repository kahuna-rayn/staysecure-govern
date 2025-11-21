import React from 'react';
import { useParams } from 'react-router-dom';
import { OrganisationProvider, UserDetailView } from 'staysecure-organisation';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from 'staysecure-auth';
import { useUserRole } from '@/hooks/useUserRole';

const UserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  const organisationConfig = {
    supabaseClient: supabase,
    // Add other config as needed
  };

  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">User ID not provided.</p>
      </div>
    );
  }

  return (
    <OrganisationProvider config={organisationConfig}>
      <UserDetailView />
    </OrganisationProvider>
  );
};

export default UserDetail;

