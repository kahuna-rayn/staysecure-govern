import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserRole } from '@/hooks/useUserRole';
import { RoleBadge } from '@/components/ui/role-badge';

type AppRole = 'super_admin' | 'client_admin' | 'moderator' | 'user';

interface RoleAssignmentSelectProps {
  value: AppRole | string;
  onValueChange: (value: AppRole) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const RoleAssignmentSelect: React.FC<RoleAssignmentSelectProps> = ({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select a role"
}) => {
  const { canAssignRole, role: currentUserRole } = useUserRole();

  const roles: { value: AppRole; label: string; disabled?: boolean }[] = [
    { 
      value: 'super_admin', 
      label: 'Super Admin',
      disabled: !canAssignRole('super_admin')
    },
    { 
      value: 'client_admin', 
      label: 'Client Admin',
      disabled: !canAssignRole('client_admin')
    },
    { 
      value: 'moderator', 
      label: 'Moderator',
      disabled: !canAssignRole('moderator')
    },
    { 
      value: 'user', 
      label: 'User',
      disabled: !canAssignRole('user')
    },
  ];

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem 
            key={role.value} 
            value={role.value}
            disabled={role.disabled}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span>{role.label}</span>
              <RoleBadge role={role.value} showIcon={false} className="text-xs h-4" />
            </div>
            {role.disabled && (
              <span className="text-xs text-muted-foreground ml-2">
                (Restricted)
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};