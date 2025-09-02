
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import type { UserProfile } from '@/hooks/useUserProfiles';
import type { NewUser } from '@/hooks/useUserManagement';

export const handleSaveUser = async (
  editingUser: UserProfile,
  updateProfile: (id: string, updates: Partial<UserProfile>) => Promise<void>,
  onSuccess: () => void
) => {
  try {
    await updateProfile(editingUser.id, editingUser);
    
    toast({
      title: "User updated",
      description: "User profile has been successfully updated.",
    });
    onSuccess();
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  }
};

export const handleCreateUser = async (
  newUser: NewUser,
  updateProfile: (id: string, updates: Partial<UserProfile>) => Promise<void>,
  onSuccess: () => void
) => {
  try {
    console.log('Creating user with email:', newUser.email);
    
    // Use Edge Function to create user without affecting current session
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        email: newUser.email,
        password: newUser.password,
        userData: {
          full_name: newUser.full_name,
          username: newUser.username,
          phone: newUser.phone,
          location: newUser.location,
          status: newUser.status,
          access_level: newUser.access_level,
          bio: newUser.bio,
          employee_id: newUser.employee_id
        }
      }
    });

    console.log('User creation result:', data, error);
    if (error) throw error;
    if (data.error) throw new Error(data.error);

    const authData = { user: data.user };

    if (authData.user) {
      setTimeout(async () => {
        try {
          // Update basic profile information
          const profileUpdates = {
            full_name: newUser.full_name,
            username: newUser.username,
            phone: newUser.phone,
            location: newUser.location,
            status: newUser.status,
            access_level: newUser.access_level,
            bio: newUser.bio,
            employee_id: newUser.employee_id
          };

          await updateProfile(authData.user.id, profileUpdates);

          // Assign department if selected
          if (newUser.department) {
            const { data: deptData } = await supabase
              .from('departments')
              .select('id')
              .eq('name', newUser.department)
              .single();

            if (deptData) {
              await supabase
                .from('user_departments')
                .insert({
                  user_id: authData.user.id,
                  department_id: deptData.id,
                  is_primary: true
                });
            }
          }

          // Assign role if selected
          if (newUser.role) {
            const { data: roleData } = await supabase
              .from('roles')
              .select('role_id')
              .eq('name', newUser.role)
              .single();

            if (roleData) {
              await supabase
                .from('user_profile_roles')
                .insert({
                  user_id: authData.user.id,
                  role_id: roleData.role_id,
                  is_primary: true
                });
            }
          }
        } catch (updateError) {
          console.error('Error updating profile:', updateError);
        }
      }, 1000);
    }

    toast({
      title: "User created",
      description: "New user has been successfully created. They will need to verify their email before logging in.",
    });
    onSuccess();
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  }
};

export const handleDeleteUser = async (userId: string) => {
  if (confirm('Are you sure you want to delete this user?')) {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;

      toast({
        title: "User profile deleted",
        description: "User profile has been successfully deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }
};
