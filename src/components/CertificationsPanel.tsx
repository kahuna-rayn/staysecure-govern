
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, FileCheck, BarChart } from 'lucide-react';
import HIBChecklist from './certifications/HIBChecklist';
import HIBResults from './certifications/HIBResults';

const CertificationsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('checklist');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Certifications</h1>
          <p className="text-muted-foreground">Manage HIB Assessment and compliance</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Award className="h-5 w-5" />
              HIB Assessment
            </h2>
            <p className="text-muted-foreground mt-1">
              Health Information Bill compliance assessment and results
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="checklist" className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                HIB Checklist
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                HIB Results
              </TabsTrigger>
            </TabsList>

            <TabsContent value="checklist" className="space-y-4">
              <HIBChecklist />
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              <HIBResults />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CertificationsPanel;
