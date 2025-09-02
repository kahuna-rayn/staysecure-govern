
import React, { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AccountDetails from "./AccountDetails";
import HardwareInventory from "./HardwareInventory";
import SoftwareAccounts from "./SoftwareAccounts";
import EditableCertificates from "./EditableCertificates";
import PhysicalLocationTab from "./PhysicalLocationTab";
import AssignHardwareDialog from "./admin/AssignHardwareDialog";
import AssignSoftwareDialog from "./admin/AssignSoftwareDialog";
import AddEducationDialog from "./admin/AddEducationDialog";
import { UserRound, Laptop, MonitorSmartphone, GraduationCap, MapPin, Plus, BookOpen, Users, Play } from "lucide-react";
import MyDocuments from "./knowledge/MyDocuments";
import { UserDepartmentsRolesManager, UserDepartmentsRolesManagerRef } from "./admin/UserDepartmentsRolesManager";
import LearningTracksTab from "./LearningTracksTab";

interface PersonaDetailsTabsProps {
  profile: any; // Using any for now since we're adapting the data structure
  userId: string;
  onUpdate?: () => void;
}

const PersonaDetailsTabs: React.FC<PersonaDetailsTabsProps> = ({ profile, userId, onUpdate }) => {
  const [isAssignHardwareOpen, setIsAssignHardwareOpen] = useState(false);
  const [isAssignSoftwareOpen, setIsAssignSoftwareOpen] = useState(false);
  const [isAddEducationOpen, setIsAddEducationOpen] = useState(false);
  const departmentRolesRef = useRef<UserDepartmentsRolesManagerRef>(null);

  const handleCertificateUpdate = (certificateId: string, updates: any) => {
    console.log('Certificate update requested:', certificateId, updates);
    // This would typically update the certificate in the database
    // For now, we'll just log it
  };

  const handleDataChange = () => {
    // Trigger data refresh
    onUpdate?.();
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <Tabs defaultValue="account" className="w-full">
          <TabsList className={`grid w-full ${profile?.enrolled_in_learn ? 'grid-cols-8' : 'grid-cols-7'} mb-6`}>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <UserRound className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="departments" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Departments & Roles</span>
            </TabsTrigger>
            <TabsTrigger value="hardware" className="flex items-center gap-2">
              <Laptop className="h-4 w-4" />
              <span className="hidden sm:inline">Hardware</span>
            </TabsTrigger>
            <TabsTrigger value="software" className="flex items-center gap-2">
              <MonitorSmartphone className="h-4 w-4" />
              <span className="hidden sm:inline">Accounts</span>
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Physical Location</span>
            </TabsTrigger>
            <TabsTrigger value="certification" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Certificates</span>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Knowledge</span>
            </TabsTrigger>
            {profile?.enrolled_in_learn && (
              <TabsTrigger value="learn" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                <span className="hidden sm:inline">StaySecure LEARN</span>
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="account" className="space-y-4 animate-fade-in">
            <AccountDetails profile={profile} />
          </TabsContent>

          <TabsContent value="departments" className="space-y-4 animate-fade-in">
            <div className="flex justify-end">
              <Button 
                onClick={() => departmentRolesRef.current?.handleAddNewRow?.()}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <UserDepartmentsRolesManager userId={userId} ref={departmentRolesRef} />
          </TabsContent>
          
          <TabsContent value="hardware" className="space-y-4 animate-fade-in">
            <div className="flex justify-end">
              <Button 
                onClick={() => setIsAssignHardwareOpen(true)}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <HardwareInventory profile={profile} onUpdate={handleDataChange} />
          </TabsContent>
          
          <TabsContent value="software" className="space-y-4 animate-fade-in">
            <div className="flex justify-end">
              <Button 
                onClick={() => setIsAssignSoftwareOpen(true)}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <SoftwareAccounts profile={profile} />
          </TabsContent>
          
          <TabsContent value="location" className="space-y-4 animate-fade-in">
            <PhysicalLocationTab profile={profile} />
          </TabsContent>
          
          <TabsContent value="certification" className="space-y-4 animate-fade-in">
            <div className="flex justify-end">
              <Button 
                onClick={() => setIsAddEducationOpen(true)}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <EditableCertificates 
              profile={profile} 
              onUpdate={handleCertificateUpdate}
              onDataChange={handleDataChange}
            />
          </TabsContent>
          
          <TabsContent value="knowledge" className="space-y-4 animate-fade-in">
            <MyDocuments userId={profile.id} />
          </TabsContent>

          {profile?.enrolled_in_learn && (
            <TabsContent value="learn" className="space-y-4 animate-fade-in">
              <LearningTracksTab userId={profile.id} />
            </TabsContent>
          )}
        </Tabs>

        {/* Dialogs */}
        <AssignHardwareDialog
          isOpen={isAssignHardwareOpen}
          onOpenChange={setIsAssignHardwareOpen}
          userId={profile.id} // Changed from profile.email to profile.id
          onSuccess={() => {
            setIsAssignHardwareOpen(false);
            handleDataChange(); // Refresh data after assignment
          }}
        />

        <AssignSoftwareDialog
          isOpen={isAssignSoftwareOpen}
          onOpenChange={setIsAssignSoftwareOpen}
          userId={profile.id} // Changed from profile.email to profile.id
          onSuccess={() => {
            setIsAssignSoftwareOpen(false);
            handleDataChange(); // Refresh data after assignment
          }}
        />

        <AddEducationDialog
          isOpen={isAddEducationOpen}
          onOpenChange={setIsAddEducationOpen}
          userId={profile.id} // This was already correct
          onSuccess={() => {
            setIsAddEducationOpen(false);
            handleDataChange(); // Refresh data after adding education
          }}
        />
      </CardContent>
    </Card>
  );
};

export default PersonaDetailsTabs;
