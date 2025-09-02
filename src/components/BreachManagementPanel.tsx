import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, FileText, Users } from 'lucide-react';
import IncidentManagementTeamTable from '@/components/breach/IncidentManagementTeamTable';

const BreachManagementPanel: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="h-6 w-6 text-destructive" />
        <h1 className="text-3xl font-bold">Breach Management</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Data Breach Incident Management Team</CardTitle>
        </CardHeader>
        <CardContent>
          <IncidentManagementTeamTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default BreachManagementPanel;
