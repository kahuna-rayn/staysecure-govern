
import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Laptop, Package, Users, Database, Shield, Download } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useInventory } from '@/hooks/useInventory';
import Papa from 'papaparse';

type AssetType = 'hardware' | 'software' | 'accounts' | 'data' | 'physical';

const ImportAssets: React.FC = () => {
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType>('hardware');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { addHardwareItem, addSoftwareItem, addAccountItem } = useInventory();

  const assetTypes = [
    {
      id: 'hardware' as AssetType,
      name: 'Hardware',
      icon: Laptop,
      description: 'Devices, computers, servers, and other physical IT equipment. Import must follow the required column format.',
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    {
      id: 'software' as AssetType,
      name: 'Software',
      icon: Package,
      description: 'Software applications, licenses, cloud services, and subscriptions.',
      color: 'bg-green-50 border-green-200 text-green-800'
    },
    {
      id: 'accounts' as AssetType,
      name: 'User Accounts',
      icon: Users,
      description: 'User identities, access accounts, and permissions.',
      color: 'bg-purple-50 border-purple-200 text-purple-800'
    },
    {
      id: 'data' as AssetType,
      name: 'Data',
      icon: Database,
      description: 'Data repositories, databases, and information assets.',
      color: 'bg-orange-50 border-orange-200 text-orange-800'
    },
    {
      id: 'physical' as AssetType,
      name: 'Physical Access',
      icon: Shield,
      description: 'Physical security assets such as keys, access cards, and secured areas.',
      color: 'bg-red-50 border-red-200 text-red-800'
    }
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
          variant: "destructive",
        });
        return;
      }
      
      setUploadedFile(file);
      toast({
        title: "File uploaded",
        description: `${file.name} is ready for import`,
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  const handleImport = async () => {
    if (!uploadedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a file first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const text = await uploadedFile.text();
      
      Papa.parse(text, {
        header: true,
        complete: async (results) => {
          const data = results.data as any[];
          
          if (data.length === 0) {
            toast({
              title: "Empty file",
              description: "The uploaded file contains no data",
              variant: "destructive",
            });
            setIsProcessing(false);
            return;
          }

          let successCount = 0;
          let errorCount = 0;

          for (const row of data) {
            try {
              if (selectedAssetType === 'hardware') {
                await addHardwareItem({
                  asset_owner: row['Asset Owner'] || row['asset_owner'] || 'Unknown',
                  device_name: row['Device Name'] || row['device_name'] || 'Unknown Device',
                  serial_number: row['Serial Number'] || row['serial_number'] || `SN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  asset_type: row['Asset Type'] || row['asset_type'] || 'Hardware',
                  asset_location: row['Asset Location'] || row['asset_location'] || null,
                  owner: row['Owner'] || row['owner'] || null,
                  asset_classification: row['Asset Classification'] || row['asset_classification'] || null,
                  approval_status: row['Approval Status'] || row['approval_status'] || 'Not submitted',
                  status: row['Status'] || row['status'] || 'Active'
                });
              } else if (selectedAssetType === 'software') {
                await addSoftwareItem({
                  software_name: row['Software Name'] || row['software_name'] || 'Unknown Software',
                  software_publisher: row['Software Publisher'] || row['software_publisher'] || null,
                  software_version: row['Software Version'] || row['software_version'] || null,
                  business_purpose: row['Business Purpose'] || row['business_purpose'] || null,
                  department: row['Department'] || row['department'] || null,
                  asset_classification: row['Asset Classification'] || row['asset_classification'] || null,
                  status: row['Status'] || row['status'] || 'Active',
                  end_of_support_date: row['End of Support Date'] || row['end_of_support_date'] || null
                });
              } else if (selectedAssetType === 'accounts') {
                await addAccountItem({
                  full_name: row['Full Name'] || row['full_name'] || 'Unknown User',
                  username_email: row['Username Email'] || row['username_email'] || `user${Date.now()}@example.com`,
                  software: row['Software'] || row['software'] || null,
                  department: row['Department'] || row['department'] || null,
                  role_account_type: row['Role Account Type'] || row['role_account_type'] || null,
                  data_class: row['Data Class'] || row['data_class'] || null,
                  approval_status: row['Approval Status'] || row['approval_status'] || 'Not submitted',
                  status: row['Status'] || row['status'] || 'Active',
                  created_by: 'Import'
                });
              }
              successCount++;
            } catch (error) {
              console.error('Error importing row:', error);
              errorCount++;
            }
          }

          toast({
            title: "Import completed",
            description: `Successfully imported ${successCount} items. ${errorCount} errors occurred.`,
          });

          setUploadedFile(null);
        },
        error: (error) => {
          console.error('Parse error:', error);
          toast({
            title: "Parse error",
            description: "Failed to parse the CSV file",
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: "An error occurred while importing the file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedType = assetTypes.find(type => type.id === selectedAssetType);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Import Assets</h3>
        <p className="text-sm text-muted-foreground mb-6">Upload a CSV or Excel file to import assets in bulk.</p>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-3">Select Asset Type</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {assetTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedAssetType(type.id)}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  selectedAssetType === type.id
                    ? type.color
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mb-2" />
                <div className="text-sm font-medium">{type.name}</div>
              </button>
            );
          })}
        </div>
        
        {selectedType && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">{selectedType.description}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-400 bg-blue-50'
              : uploadedFile
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          
          {uploadedFile ? (
            <div>
              <p className="text-lg font-medium text-green-700">File Ready for Import</p>
              <p className="text-sm text-green-600 mt-1">{uploadedFile.name}</p>
              <p className="text-xs text-gray-500 mt-2">
                Click to select a different file or drop a new one here
              </p>
            </div>
          ) : isDragActive ? (
            <p className="text-lg font-medium text-blue-700">Drop your {selectedType?.name.toLowerCase()} file here</p>
          ) : (
            <div>
              <p className="text-lg font-medium">Drag and drop your {selectedType?.name.toLowerCase()} file here, or browse</p>
              <p className="text-sm text-gray-500 mt-1">Supports CSV and Excel files (.xlsx, .xls)</p>
            </div>
          )}
        </div>

        {uploadedFile && (
          <div className="flex gap-3">
            <Button
              onClick={handleImport}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import {selectedType?.name}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setUploadedFile(null)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">Templates</h4>
        <p className="text-sm text-yellow-700 mb-3">Download a template for your specific asset type.</p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-white rounded border">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">{selectedType?.name} Template (CSV)</span>
              <Badge variant="secondary" className="text-xs">Basic template with essential fields</Badge>
            </div>
            <Button size="sm" variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-white rounded border">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">{selectedType?.name} Template (XLSX)</span>
              <Badge variant="secondary" className="text-xs">Comprehensive template with all fields</Badge>
            </div>
            <Button size="sm" variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportAssets;
