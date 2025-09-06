
import React from "react";
import { Calendar, Shield, Clock, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUserProfileRoles } from "@/hooks/useUserProfileRoles";

interface ProfileContactInfoProps {
  startDate: string;
  // Account status props
  status?: string;
  accessLevel?: string;
  lastLogin?: string;
  passwordLastChanged?: string;
  twoFactorEnabled?: boolean;
  userId?: string; // Add userId to fetch user roles
}

const ProfileContactInfo: React.FC<ProfileContactInfoProps> = ({
  startDate,
  status,
  accessLevel,
  lastLogin,
  passwordLastChanged,
  twoFactorEnabled,
  userId
}) => {
  const { primaryRole } = useUserProfileRoles(userId);
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="flex flex-col items-end space-y-3 ml-auto">
      {/* Account Status Information */}
      <div className="flex items-center gap-2 text-sm">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <Badge variant={status === 'Active' ? 'default' : 'secondary'}>
          {status || 'Active'}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Key className="h-4 w-4 text-muted-foreground" />
        {primaryRole ? (
          primaryRole.role_name === 'client_admin' ? (
            <Badge className="bg-red-500 text-white border-red-500">
              Admin
            </Badge>
          ) : (
            <span className="capitalize">{primaryRole.role_name.replace('_', ' ')}</span>
          )
        ) : (
          <span>User</span>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <Badge variant={twoFactorEnabled ? 'default' : 'secondary'}>
          2FA {twoFactorEnabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span>Started {formatDate(startDate)}</span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span>Last login: {lastLogin ? formatDate(lastLogin) : 'Never'}</span>
      </div>
    </div>
  );
};

export default ProfileContactInfo;
