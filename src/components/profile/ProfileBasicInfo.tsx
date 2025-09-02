import React from "react";
import { Phone, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import EditableField from "./EditableField";
import { useUserDepartments } from "@/hooks/useUserDepartments";
import { useUserProfileRoles } from "@/hooks/useUserProfileRoles";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProfileBasicInfoProps {
  firstName: string;
  lastName: string;
  manager: string;
  phone: string;
  location: string;
  editingField: string | null;
  onEdit: (field: string) => void;
  onSave: (field: string, value: string) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  profiles: { id: string; full_name: string; username: string }[];
  currentUserId: string;
  userId: string; // Add userId for multiple roles
}

const ProfileBasicInfo: React.FC<ProfileBasicInfoProps> = ({
  firstName,
  lastName,
  manager,
  phone,
  location,
  editingField,
  onEdit,
  onSave,
  onCancel,
  saving,
  profiles,
  currentUserId,
  userId
}) => {
  const { userDepartments } = useUserDepartments(userId);
  const { primaryRole } = useUserProfileRoles(userId);
  
  // Get primary department
  const primaryDepartment = userDepartments.find(dept => dept.is_primary);
  
  const handleNameSave = async (fieldKey: string, value: string) => {
    await onSave('full_name', value);
  };
  const [managerValue, setManagerValue] = React.useState(manager);
  React.useEffect(() => { setManagerValue(manager); }, [manager, editingField]);
  const handleManagerChange = async (userId: string) => {
    setManagerValue(userId);
    await onSave('manager', userId);
  };
  const filteredProfiles = profiles.filter(user => user.id !== currentUserId);
  const managerProfile = profiles.find(u => u.id === manager);
  const managerName = managerProfile ? (managerProfile.full_name || managerProfile.username) : 'Not assigned';

  return (
    <div className="space-y-1.5 flex-1">
      <div className="flex items-center gap-2">
        <EditableField
          value={`${firstName} ${lastName}`}
          fieldKey="full_name"
          onSave={handleNameSave}
          isEditing={editingField === 'full_name'}
          onEdit={onEdit}
          onCancel={onCancel}
          saving={saving}
          className="flex-1"
          inputClassName="text-2xl font-bold h-10"
        />
      </div>
      
      {editingField === 'manager' ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Reports to:</span>
          <Select
            value={managerValue}
            onValueChange={handleManagerChange}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select manager" />
            </SelectTrigger>
            <SelectContent>
              {filteredProfiles.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name || user.username || 'Unnamed User'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <EditableField
          value={managerName}
          fieldKey="manager"
          label="Reports to:"
          onSave={onSave}
          isEditing={editingField === 'manager'}
          onEdit={onEdit}
          onCancel={onCancel}
          saving={saving}
          inputClassName="text-sm h-6"
        />
      )}
      
      {/* Primary Department and Role side by side */}
      <div className="flex items-center gap-4">
        {primaryDepartment && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-current text-yellow-500" />
            <Badge variant="default">
              {primaryDepartment.department_name}
            </Badge>
          </div>
        )}
        
        {primaryRole && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-current text-yellow-500" />
            <Badge variant="default">
              {primaryRole.role_name}
            </Badge>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <Phone className="h-4 w-4 text-muted-foreground" />
        <EditableField
          value={phone || 'Not provided'}
          fieldKey="phone"
          placeholder="Phone number"
          onSave={onSave}
          isEditing={editingField === 'phone'}
          onEdit={onEdit}
          onCancel={onCancel}
          saving={saving}
          inputClassName="h-6 text-sm"
        />
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <EditableField
          value={location || 'Not specified'}
          fieldKey="location"
          placeholder="Location"
          onSave={onSave}
          isEditing={editingField === 'location'}
          onEdit={onEdit}
          onCancel={onCancel}
          saving={saving}
          inputClassName="h-6 text-sm"
        />
      </div>
    </div>
  );
};

export default ProfileBasicInfo;
