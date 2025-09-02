
import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Users } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';

const ImportUsers: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { createProfile } = useUserProfiles();

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

  const processUserImport = async (row: any) => {
    const email = row['Email'] || row['email'];
    const password = row['Password'] || row['password'] || 'TempPassword123!';
    
    if (!email) {
      console.error('Missing email for row:', row);
      throw new Error('Missing email');
    }

    console.log('Processing user:', email);

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: row['Full Name'] || row['full_name'] || 'Unknown User',
          username: row['Username'] || row['username'] || email.split('@')[0],
          role: row['Role'] || row['role'] || 'Employee',
          department: row['Department'] || row['department'] || 'General',
          phone: row['Phone'] || row['phone'] || null,
          location: row['Location'] || row['location'] || null,
          status: row['Status'] || row['status'] || 'Active',
          access_level: row['Access Level'] || row['access_level'] || 'User',
          bio: row['Bio'] || row['bio'] || null,
          employee_id: row['Employee ID'] || row['employee_id'] || `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          manager: row['Manager'] || row['manager'] || null
        }
      }
    });

    if (authError) {
      console.error('Auth error for user:', email, authError);
      throw authError;
    }

    if (authData.user) {
      console.log('User created successfully:', email);
      
      // Wait for the trigger to create the profile, then update it
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        // Update the profile with additional data
        const profileUpdates = {
          full_name: row['Full Name'] || row['full_name'] || 'Unknown User',
          username: row['Username'] || row['username'] || email.split('@')[0],
          role: row['Role'] || row['role'] || 'Employee',
          department: row['Department'] || row['department'] || 'General',
          phone: row['Phone'] || row['phone'] || null,
          location: row['Location'] || row['location'] || null,
          status: row['Status'] || row['status'] || 'Active',
          access_level: row['Access Level'] || row['access_level'] || 'User',
          bio: row['Bio'] || row['bio'] || null,
          employee_id: row['Employee ID'] || row['employee_id'] || `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          manager: row['Manager'] || row['manager'] || null
        };

        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', authData.user.id);

        if (updateError) {
          console.error('Error updating profile for:', email, updateError);
        } else {
          console.log('Profile updated successfully for:', email);
        }
      } catch (updateError) {
        console.error('Error updating profile for:', email, updateError);
      }
    }

    return { email, success: true };
  };

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

          console.log('Processing', data.length, 'rows');
          let successCount = 0;
          let errorCount = 0;
          const errors: string[] = [];

          // Process users sequentially to avoid overwhelming the system
          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            
            // Skip empty rows
            if (!row['Email'] && !row['email'] && !row['Full Name'] && !row['full_name']) {
              console.log('Skipping empty row at index', i);
              continue;
            }

            try {
              console.log(`Processing user ${i + 1} of ${data.length}:`, row['Email'] || row['email']);
              await processUserImport(row);
              successCount++;
              console.log(`Successfully processed user ${i + 1}`);
            } catch (error: any) {
              console.error(`Error importing user ${i + 1}:`, error);
              errorCount++;
              const email = row['Email'] || row['email'] || 'Unknown';
              errors.push(`${email}: ${error.message}`);
            }

            // Add a small delay between users to prevent rate limiting
            if (i < data.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          console.log('Import completed. Success:', successCount, 'Errors:', errorCount);

          toast({
            title: "Import completed",
            description: `Successfully imported ${successCount} users. ${errorCount} errors occurred. Users will need to verify their email before logging in.`,
          });

          if (errors.length > 0) {
            console.log('Import errors:', errors);
          }

          setUploadedFile(null);
        },
        error: (error) => {
          console.error('Parse error:', error);
          toast({
            title: "Parse error",
            description: "Failed to parse the CSV file",
            variant: "destructive",
          });
          setIsProcessing(false);
        }
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: "An error occurred while importing the file",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Import Users</h3>
        <p className="text-sm text-muted-foreground mb-6">Upload a CSV or Excel file to import users in bulk. Users will be created with authentication accounts.</p>
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
            <p className="text-lg font-medium text-blue-700">Drop your user file here</p>
          ) : (
            <div>
              <p className="text-lg font-medium">Drag and drop your user file here, or browse</p>
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
                  Import Users
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
        <h4 className="text-sm font-medium text-yellow-800 mb-2">User Import Template</h4>
        <p className="text-sm text-yellow-700 mb-3">Download a template for importing users.</p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-white rounded border">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">Users Template (CSV)</span>
              <Badge variant="secondary" className="text-xs">Basic template with essential fields</Badge>
            </div>
            <Button size="sm" variant="outline">Download</Button>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-white rounded border">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">Users Template (XLSX)</span>
              <Badge variant="secondary" className="text-xs">Comprehensive template with all fields</Badge>
            </div>
            <Button size="sm" variant="outline">Download</Button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Required Columns</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            'Email', 'Full Name', 'Username', 'Role', 'Department', 
            'Phone', 'Location', 'Status', 'Access Level', 'Bio', 
            'Employee ID', 'Manager', 'Password'
          ].map((column) => (
            <Badge key={column} variant="outline" className="text-xs">
              {column}
            </Badge>
          ))}
        </div>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Email</strong> is required for each user</p>
          <p>• <strong>Password</strong> is optional - if not provided, a default temporary password will be used</p>
          <p>• Users will need to verify their email before logging in</p>
          <p>• All other fields are optional and will use default values if not provided</p>
        </div>
      </div>
    </div>
  );
};

export default ImportUsers;
