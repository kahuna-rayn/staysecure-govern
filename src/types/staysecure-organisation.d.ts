declare module 'staysecure-organisation' {
  import { SupabaseClient } from '@supabase/supabase-js';
  import { ReactNode } from 'react';

  export interface OrganisationConfig {
    supabaseClient: SupabaseClient;
    enabledTabs?: string[];
    permissions?: {
      canCreateUsers?: boolean;
      canEditUsers?: boolean;
      canDeleteUsers?: boolean;
      canManageRoles?: boolean;
      canManageDepartments?: boolean;
      canManageLocations?: boolean;
      canManageCertificates?: boolean;
      canManageProfile?: boolean;
    };
  }

  export interface OrganisationProviderProps {
    config: OrganisationConfig;
    children: ReactNode;
  }

  export interface OrganisationPanelProps {
    title?: string;
    description?: string;
    showAdminBadge?: boolean;
    className?: string;
  }

  export interface PersonProfile {
    id: string;
    full_name: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    avatar: string;
    role: string;
    department: string;
    manager: string;
    startDate: string;
    account: {
      username: string;
      employeeId: string;
      status: string;
      accessLevel: string;
      lastLogin: string;
      passwordLastChanged: string;
      twoFactorEnabled: boolean;
    };
    hardware: Array<{
      id: string;
      type: string;
      model: string;
      serialNumber: string;
      status: string;
      assignedDate: string;
      manufacturer: string;
      osEdition: string;
      osVersion: string;
    }>;
    software: Array<{
      id: string;
      name: string;
      role_account_type: string;
      expiryDate: string | null;
      lastUsed: string | null;
    }>;
    certificates: Array<{
      name: string;
      issuedBy: string;
      dateAcquired: string;
      expiryDate: string;
      credentialId: string;
      status: string;
    }>;
  }

  export const OrganisationProvider: React.FC<OrganisationProviderProps>;
  export const OrganisationPanel: React.FC<OrganisationPanelProps>;
  export const UserDetailView: React.FC<any>;
  export const OrganisationWrapper: React.FC<any>;
  export const PersonaDetailsTabs: React.FC<any>;
  export const EditableProfileHeader: React.FC<any>;
  export const PersonaProfile: React.FC<any>;
  export const UserManagement: React.FC<any>;
  export const UserList: React.FC<any>;
  export const UserCard: React.FC<any>;
  export const UserTable: React.FC<any>;
  export const Certificates: React.FC<any>;
  export const PhysicalLocationTab: React.FC<any>;
  export const EditableField: React.FC<any>;
  export const DepartmentRolePairsDisplay: React.FC<any>;
}

