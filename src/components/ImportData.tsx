
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, FileText, Laptop, Package, Users, Database, Shield } from 'lucide-react';
import ImportAssets from './import/ImportAssets';
import ImportUsers from './import/ImportUsers';
import ImportGuide from './import/ImportGuide';

const ImportData: React.FC = () => {
  const [activeTab, setActiveTab] = useState('import');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Import Data</h1>
          <p className="text-muted-foreground">Import asset data and users from CSV or Excel files</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="import" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import Assets
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Import Users
              </TabsTrigger>
              <TabsTrigger value="guide" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Import Guide
              </TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-6 mt-6">
              <ImportAssets />
            </TabsContent>

            <TabsContent value="users" className="space-y-6 mt-6">
              <ImportUsers />
            </TabsContent>

            <TabsContent value="guide" className="space-y-6 mt-6">
              <ImportGuide />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportData;
