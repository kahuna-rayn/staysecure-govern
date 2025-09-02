
import { useState } from 'react';
import type { UserProfile } from '@/hooks/useUserProfiles';

interface NewUser {
  email: string;
  password: string;
  full_name: string;
  username: string;
  role: string;
  department: string;
  phone: string;
  location: string;
  status: string;
  access_level: string;
  bio: string;
  employee_id: string;
}

export const useUserManagement = () => {
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    password: '',
    full_name: '',
    username: '',
    role: '',
    department: '',
    phone: '',
    location: '',
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
      username: '',
      role: '',
      department: '',
      phone: '',
      location: '',
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

export type { NewUser };
