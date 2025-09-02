
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

interface CreateUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newUser: NewUser;
  onUserChange: (user: NewUser) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  isOpen,
  onOpenChange,
  newUser,
  onUserChange,
  onSubmit
}) => {
  const { data: departments } = useQuery({
    queryKey: ['departments-for-create'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: roles } = useQuery({
    queryKey: ['roles-for-create', newUser.department],
    queryFn: async () => {
      let query = supabase
        .from('roles')
        .select('role_id, name, department_id, departments(name)')
        .eq('is_active', true);
      
      if (newUser.department) {
        // First get the department ID for the selected department name
        const { data: deptData } = await supabase
          .from('departments')
          .select('id')
          .eq('name', newUser.department)
          .single();
        
        if (deptData) {
          // Get roles for the selected department OR roles without department
          query = query.or(`department_id.eq.${deptData.id},department_id.is.null`);
        }
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: true,
  });

  const { data: locations } = useQuery({
    queryKey: ['locations-for-create'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new_email">Email *</Label>
              <Input
                id="new_email"
                type="email"
                value={newUser.email}
                onChange={(e) => onUserChange({ ...newUser, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="new_password">Password *</Label>
              <Input
                id="new_password"
                type="password"
                value={newUser.password}
                onChange={(e) => onUserChange({ ...newUser, password: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new_full_name">Full Name</Label>
              <Input
                id="new_full_name"
                value={newUser.full_name}
                onChange={(e) => onUserChange({ ...newUser, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="new_username">Username</Label>
              <Input
                id="new_username"
                value={newUser.username}
                onChange={(e) => onUserChange({ ...newUser, username: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new_department">Department</Label>
              <Select value={newUser.department} onValueChange={(value) => onUserChange({ ...newUser, department: value, role: '' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map((department) => (
                    <SelectItem key={department.id} value={department.name}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          <div>
            <Label htmlFor="new_role">Role</Label>
            <Select value={newUser.role} onValueChange={(value) => onUserChange({ ...newUser, role: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles?.map((role, index) => (
                  <SelectItem key={`${role.role_id}-${index}`} value={role.name}>
                    {role.name} {role.departments?.name && `(${role.departments.name})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new_phone">Phone</Label>
              <Input
                id="new_phone"
                value={newUser.phone}
                onChange={(e) => onUserChange({ ...newUser, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="new_location">Location</Label>
              <Select value={newUser.location} onValueChange={(value) => onUserChange({ ...newUser, location: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map((location) => (
                    <SelectItem key={location.id} value={location.name}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new_employee_id">Employee ID</Label>
              <Input
                id="new_employee_id"
                value={newUser.employee_id}
                onChange={(e) => onUserChange({ ...newUser, employee_id: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="new_status">Status</Label>
              <Select value={newUser.status} onValueChange={(value) => onUserChange({ ...newUser, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="OnLeave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="new_access_level">Access Level</Label>
            <Select value={newUser.access_level} onValueChange={(value) => onUserChange({ ...newUser, access_level: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="User">User</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="new_bio">Bio</Label>
            <Textarea
              id="new_bio"
              value={newUser.bio}
              onChange={(e) => onUserChange({ ...newUser, bio: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
