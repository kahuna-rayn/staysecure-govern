import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown } from 'lucide-react';

type AppRole = 'super_admin' | 'client_admin' | 'moderator' | 'user';

interface RoleBadgeProps {
  role: AppRole | string | null;
  showIcon?: boolean;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, showIcon = true, className = '' }) => {
  if (!role) return null;

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'super_admin':
        return {
          label: 'Super Admin',
          className: 'bg-destructive text-destructive-foreground border-destructive',
          icon: Crown,
        };
      case 'client_admin':
        return {
          label: 'Client Admin',
          className: 'bg-destructive text-destructive-foreground border-destructive',
          icon: Shield,
        };
      case 'moderator':
        return {
          label: 'Moderator',
          className: 'bg-orange-500 text-white border-orange-500',
          icon: Shield,
        };
      case 'user':
        return {
          label: 'User',
          className: 'bg-muted text-muted-foreground border-muted',
          icon: Shield,
        };
      default:
        return {
          label: role,
          className: 'bg-muted text-muted-foreground border-muted',
          icon: Shield,
        };
    }
  };

  const config = getRoleConfig(role);
  const IconComponent = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} ${className}`}>
      {showIcon && <IconComponent className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  );
};