import { useState } from 'react';
import type { UserProfile, NewUser } from '../types';

export const useUserManagement = () => {
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    password: '',
    full_name: '',
    first_name: '',
    last_name: '',
    username: '',
    phone: '',
    location: '',
    location_id: '',
    status: 'Active',
    access_level: 'User',
    bio: '',
    employee_id: ''
  });

  const openEditDialog = (user: UserProfile) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingUser(null);
  };

  const resetNewUser = () => {
    setNewUser({
      email: '',
      password: '',
      full_name: '',
      first_name: '',
      last_name: '',
      username: '',
      phone: '',
      location: '',
      location_id: '',
      status: 'Active',
      access_level: 'User',
      bio: '',
      employee_id: ''
    });
  };

  return {
    editingUser,
    setEditingUser,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    viewMode,
    setViewMode,
    newUser,
    setNewUser,
    openEditDialog,
    closeEditDialog,
    resetNewUser
  };
};