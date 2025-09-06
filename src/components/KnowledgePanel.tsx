import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUserRole } from '@/hooks/useUserRole';
import { BookOpen, FileText, Users, Calendar, CheckCircle } from 'lucide-react';
import { RoleBadge } from '@/components/ui/role-badge';
import DocumentManagement from '@/components/knowledge/DocumentManagement';
import DocumentAssignments from '@/components/knowledge/DocumentAssignments';
import ComplianceTracking from '@/components/knowledge/ComplianceTracking';

const KnowledgePanel: React.FC = () => {
  const { hasPermission, role } = useUserRole();
  const [activeTab, setActiveTab] = useState('documents');

  const handleNavigateToTab = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Management</h1>
          <p className="text-muted-foreground">
            Manage organizational documents, policies, and compliance tracking
          </p>
        </div>
        {hasPermission('moderator') && (
          <RoleBadge role={role} />
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Compliance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <DocumentManagement onNavigateToAssignments={() => handleNavigateToTab('assignments')} />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <DocumentAssignments />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <ComplianceTracking />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KnowledgePanel;