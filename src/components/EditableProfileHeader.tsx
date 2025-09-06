import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building, User, Edit2, Save, X } from 'lucide-react';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { toast } from '@/components/ui/use-toast';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import ProfileBasicInfo from '@/components/profile/ProfileBasicInfo';
import ProfileContactInfo from '@/components/profile/ProfileContactInfo';

interface EditableProfileHeaderProps {
  profile: any;
  onProfileUpdate: () => void;
  isReadOnly?: boolean;
  onOptimisticUpdate?: (field: string, value: string) => void;
}

const EditableProfileHeader: React.FC<EditableProfileHeaderProps> = ({ 
  profile, 
  onProfileUpdate,
  isReadOnly = false,
  onOptimisticUpdate
}) => {
  console.log('EditableProfileHeader props:', { profile, onOptimisticUpdate });
  const { profiles, updateProfile } = useUserProfiles();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFieldEdit = (field: string) => {
    setEditingField(field);
  };

  const handleFieldSave = async (field: string, value: string) => {
    console.log('handleFieldSave called', field, value);
    try {
      setSaving(true);
      let updateData: any = {};
      if (field === 'full_name') {
        updateData.full_name = value;
      } else if (field === 'phone') {
        updateData.phone = value;
      } else if (field === 'location') {
        updateData.location = value;
      } else if (field === 'role') {
        updateData.role = value;
      } else if (field === 'department') {
        updateData.department = value;
      } else if (field === 'manager') {
        updateData.manager = value;
      }
      
      console.log('Updating profile:', profile.id, updateData);
      
      if (!profile.id) {
        console.error('Profile ID is undefined. Profile object:', profile);
        console.log('Early return: profile.id is undefined');
        toast({
          title: "Error",
          description: "Profile ID is missing. Cannot update profile.",
          variant: "destructive",
        });
        return;
      }
      
      const result = await updateProfile(profile.id, updateData);
      console.log('Update result:', result);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setEditingField(null);
      console.log('onOptimisticUpdate', onOptimisticUpdate);
      if (onOptimisticUpdate) {
        console.log('Calling onOptimisticUpdate', field, value);
        onOptimisticUpdate(field, value);
      }
      onProfileUpdate();
    } catch (error: any) {
      console.error('Save error:', error);
      console.log('Early return: error in save');
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFieldCancel = () => {
    setEditingField(null);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Avatar and basic info section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 lg:flex-1">
            <ProfileAvatar 
              avatarUrl={profile.avatar}
              firstName={profile.firstName}
              lastName={profile.lastName}
            />
            
            <div className="text-center sm:text-left flex-1">
            <ProfileBasicInfo
              firstName={profile.firstName}
              lastName={profile.lastName}
              manager={profile.manager}
              phone={profile.phone}
              location={profile.location}
              editingField={editingField}
              onEdit={handleFieldEdit}
              onSave={handleFieldSave}
              onCancel={handleFieldCancel}
              saving={saving}
              profiles={profiles}
              currentUserId={profile.id}
              userId={profile.id}
            />
            </div>
          </div>

          {/* Contact information section - right justified */}
          <div className="lg:flex-shrink-0 lg:w-80">
            <ProfileContactInfo
              startDate={profile.startDate}
              status={profile.account?.status}
              accessLevel={profile.account?.accessLevel}
              lastLogin={profile.account?.lastLogin}
              passwordLastChanged={profile.account?.passwordLastChanged}
              twoFactorEnabled={profile.account?.twoFactorEnabled}
              userId={profile.id}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EditableProfileHeader;
