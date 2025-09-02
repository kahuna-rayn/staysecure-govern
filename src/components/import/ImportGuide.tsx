import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Laptop, Package, Users, Database, Shield } from 'lucide-react';

const ImportGuide: React.FC = () => {
  const assetGuides = [
    {
      title: 'User Accounts',
      icon: Users,
      description: 'Import user accounts with authentication, profiles, and role assignments.',
      requiredColumns: [
        'Email',
        'Full Name', 
        'Username',
        'Role',
        'Department',
        'Phone',
        'Location',
        'Status',
        'Access Level',
        'Bio',
        'Employee ID',
        'Manager',
        'Password'
      ],
      examples: [
        'Email: john.doe@company.com',
        'Full Name: John Doe',
        'Username: john.doe',
        'Role: Software Engineer',
        'Department: Engineering',
        'Phone: +1-555-123-4567',
        'Location: New York Office',
        'Status: Active',
        'Access Level: User',
        'Bio: Senior developer with 5 years experience',
        'Employee ID: EMP-2024-001',
        'Manager: Jane Smith',
        'Password: TempPassword123! (optional)'
      ]
    },
    {
      title: 'Hardware Assets',
      icon: Laptop,
      description: 'Import physical IT equipment such as laptops, desktops, servers, and peripherals.',
      requiredColumns: [
        'Asset Owner',
        'Device Name', 
        'Serial Number',
        'Asset Type',
        'Asset Location',
        'Asset Classification',
        'Approval Status',
        'Status'
      ],
      examples: [
        'Asset Owner: John Smith',
        'Device Name: MacBook Pro 14-inch',
        'Serial Number: ABC123456789',
        'Asset Type: Laptop',
        'Asset Location: Office Floor 2',
        'Asset Classification: Confidential',
        'Approval Status: Approved',
        'Status: Active'
      ]
    },
    {
      title: 'Software Assets',
      icon: Package,
      description: 'Import software applications, licenses, cloud services, and subscriptions.',
      requiredColumns: [
        'Software Name',
        'Software Publisher',
        'Software Version',
        'Business Purpose',
        'Department',
        'Asset Classification',
        'Status'
      ],
      examples: [
        'Software Name: Microsoft Office 365',
        'Software Publisher: Microsoft',
        'Software Version: 2023',
        'Business Purpose: Productivity Suite',
        'Department: IT',
        'Asset Classification: User',
        'Status: Active'
      ]
    },
    {
      title: 'Account Inventory',
      icon: Users,
      description: 'Import user identities, access accounts, and permissions.',
      requiredColumns: [
        'Full Name',
        'Username Email',
        'Software',
        'Department',
        'Role Account Type',
        'Data Class',
        'Approval Status',
        'Status'
      ],
      examples: [
        'Full Name: Jane Doe',
        'Username Email: jane.doe@company.com',
        'Software: Active Directory',
        'Department: Marketing',
        'Role Account Type: User User',
        'Data Class: Internal',
        'Approval Status: Approved',
        'Status: Active'
      ]
    },
    {
      title: 'Data Assets',
      icon: Database,
      description: 'Import data repositories, databases, and information assets.',
      requiredColumns: [
        'Asset ID',
        'Name',
        'Type',
        'Classification',
        'Location',
        'Owner',
        'Retention Period',
        'Backup Frequency'
      ],
      examples: [
        'Asset ID: DB001',
        'Name: Customer Database',
        'Type: MySQL Database',
        'Classification: Restricted',
        'Location: Data Center A',
        'Owner: IT Department',
        'Retention Period: 7 years',
        'Backup Frequency: Daily'
      ]
    },
    {
      title: 'Physical Access',
      icon: Shield,
      description: 'Import physical security assets such as keys, access cards, and secured areas.',
      requiredColumns: [
        'Asset ID',
        'Location',
        'Access Type',
        'Access Level',
        'Assigned To',
        'Issue Date',
        'Return Date',
        'Status'
      ],
      examples: [
        'Asset ID: CARD001',
        'Location: Main Building',
        'Access Type: Key Card',
        'Access Level: Level 2',
        'Assigned To: John Smith',
        'Issue Date: 2024-01-15',
        'Return Date: 2024-12-31',
        'Status: Active'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Import Guide</h3>
        <p className="text-sm text-muted-foreground">
          Learn about the required columns and formatting for each data type to ensure successful imports.
        </p>
      </div>

      <div className="space-y-6">
        {assetGuides.map((guide, index) => {
          const Icon = guide.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{guide.title}</h4>
                    <p className="text-sm text-muted-foreground">{guide.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                      Required columns:
                      <Badge variant="secondary" className="text-xs">
                        {guide.requiredColumns.length} fields
                      </Badge>
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {guide.requiredColumns.map((column, colIndex) => (
                        <Badge key={colIndex} variant="outline" className="text-xs">
                          {column}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium mb-2">Example values:</h5>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                      {guide.examples.map((example, exIndex) => (
                        <div key={exIndex} className="text-xs font-mono text-gray-600">
                          {example}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h4 className="font-semibold text-blue-900 mb-2">Import Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Ensure your CSV file has headers that match the required column names</li>
            <li>• Use UTF-8 encoding for files with special characters</li>
            <li>• Required fields must not be empty - use "Unknown" or appropriate defaults</li>
            <li>• Date fields should be in YYYY-MM-DD format</li>
            <li>• Remove any empty rows at the end of your file</li>
            <li>• Test with a small subset of data first</li>
            <li>• For user imports: Email is required, Password is optional (defaults will be used)</li>
            <li>• Imported users will need to verify their email before logging in</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportGuide;
