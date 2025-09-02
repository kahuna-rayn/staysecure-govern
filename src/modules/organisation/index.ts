// Main exports for the organisation module
export { OrganisationPanel } from './components/OrganisationPanel';
export { OrganisationProvider, useOrganisationContext } from './context/OrganisationContext';

// Component exports
export { default as UserManagement } from './components/admin/UserManagement';
export { default as UserList } from './components/admin/UserList';
export { default as UserCard } from './components/admin/UserCard';
export { default as UserTable } from './components/admin/UserTable';
export { default as CreateUserDialog } from './components/admin/CreateUserDialog';
export { default as EditUserDialog } from './components/admin/EditUserDialog';


// Hook exports
export { useUserManagement } from './hooks/useUserManagement';
export { useUserProfiles } from './hooks/useUserProfiles';

// Type exports
export type {
  OrganisationConfig,
  ThemeConfig,
  PermissionConfig,
  UserProfile,
  NewUser,
  Role,
  Department,
  Location,
  OrgCertificate,
} from './types';

// Utility exports
export { handleSaveUser, handleCreateUser, handleDeleteUser } from './utils/userManagementActions';