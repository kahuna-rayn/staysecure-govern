
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useViewPreference } from '@/hooks/useViewPreference';
import { handleSaveUser, handleCreateUser, handleDeleteUser } from '@/utils/userManagementActions';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LayoutGrid, List } from 'lucide-react';
import UserList from './UserList';
import UserTable from './UserTable';
import CreateUserDialog from './CreateUserDialog';
import EditUserDialog from './EditUserDialog';

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { profiles, loading, updateProfile } = useUserProfiles();
  const [viewMode, setViewMode] = useViewPreference('userManagement', 'cards');
  const {
    editingUser,
    setEditingUser,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    newUser,
    setNewUser,
    openEditDialog,
    closeEditDialog,
    resetNewUser
  } = useUserManagement();

  const onSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    await handleSaveUser(editingUser, async (id, updates) => {
      await updateProfile(id, updates);
    }, closeEditDialog);
  };

  const onCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Close dialog and reset form immediately
    setIsCreateDialogOpen(false);
    resetNewUser();
    
    await handleCreateUser(newUser, async (id, updates) => {
      await updateProfile(id, updates);
    }, () => {
      // User creation completed - no additional navigation needed as we're already on the right page
    });
  };

  const onDeleteUser = async (userId: string) => {
    await handleDeleteUser(userId);
  };

  const onUpdateProfile = async (id: string, updates: any) => {
    const result = await updateProfile(id, updates);
    return { success: result.success, error: result.error };
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">User Management</h2>
        <div className="flex items-center gap-4">
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(value) => value && setViewMode(value as 'cards' | 'list')}
          >
            <ToggleGroupItem value="cards" aria-label="Card view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <CreateUserDialog
            isOpen={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            newUser={newUser}
            onUserChange={setNewUser}
            onSubmit={onCreateUser}
          />
        </div>
      </div>

      {viewMode === 'cards' ? (
        <UserList
          profiles={profiles}
          onEdit={openEditDialog}
          onDelete={onDeleteUser}
        />
      ) : (
        <UserTable
          profiles={profiles}
          onEdit={openEditDialog}
          onDelete={onDeleteUser}
          onUpdate={onUpdateProfile}
        />
      )}

      <EditUserDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingUser={editingUser}
        onUserChange={setEditingUser}
        onSubmit={onSaveUser}
      />
    </div>
  );
};

export default UserManagement;
