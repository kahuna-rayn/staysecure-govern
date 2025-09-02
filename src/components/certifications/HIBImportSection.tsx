import React, { useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from '@/components/ui/use-toast';
import Papa from 'papaparse';
import { HIBClause } from '@/utils/hibDataUtils';

interface HIBImportSectionProps {
  onImport: (clauses: HIBClause[]) => Promise<void>;
  onClose: () => void;
}

const HIBImportSection: React.FC<HIBImportSectionProps> = ({ onImport, onClose }) => {
  const handleImport = async (file: File) => {
    try {
      console.log('Starting import process for file:', file.name);
      const text = await file.text();
      console.log('File content loaded, length:', text.length);
      
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          console.log('Parse results:', results);
          const data = results.data as any[];
          
          if (data.length === 0) {
            toast({
              title: "Empty file",
              description: "The uploaded file contains no data",
              variant: "destructive",
            });
            return;
          }

          console.log('Parsed data:', data);
          console.log('First row keys:', Object.keys(data[0] || {}));

          const importedClauses: HIBClause[] = data
            .filter(row => {
              const hasContent = Object.values(row).some(value => 
                value && typeof value === 'string' && value.trim() !== ''
              );
              return hasContent;
            })
            .map((row, index) => {
              console.log(`Processing row ${index + 1}:`, row);
              
              const hibClauseValue = row['HIB Clause'] || row['hib_clause'] || row['Clause'] || '';
              const hibClauseNumber = hibClauseValue ? parseInt(hibClauseValue.toString(), 10) : index + 1;
              const sectionNumberValue = row['Section Number'] || row['section_number'] || '';
              const sectionNumber = sectionNumberValue ? parseInt(sectionNumberValue.toString(), 10) : undefined;
              
              return {
                id: (index + 1).toString(),
                hibSection: row['HIB Section'] || row['hib_section'] || row['Section'] || '',
                hibClause: isNaN(hibClauseNumber) ? index + 1 : hibClauseNumber,
                hibClauseDescription: row['HIB Clause Description'] || row['hib_clause_description'] || row['Description'] || row['Clause Description'] || '',
                suggestedArtefacts: row['Suggested artefacts'] || row['suggested_artefacts'] || row['Suggested Artefacts'] || row['Artefacts'] || '',
                implementationStatus: '' as '',
                remarks: '',
                additionalInformationI: row['Additional Information (I)'] || row['additional_information_i'] || row['Additional Info I'] || '',
                additionalInformationII: row['Additional Information (II)'] || row['additional_information_ii'] || row['Additional Info II'] || '',
                additionalInformationIII: row['Additional Information (III)'] || row['additional_information_iii'] || row['Additional Info III'] || '',
                sectionNumber: isNaN(sectionNumber!) ? undefined : sectionNumber
              };
            });

          console.log('Imported clauses:', importedClauses);

          if (importedClauses.length === 0) {
            toast({
              title: "No valid data found",
              description: "Could not find valid HIB data in the file. Please check the column names.",
              variant: "destructive",
            });
            return;
          }

          await onImport(importedClauses);
          onClose();
          
          toast({
            title: "Import successful",
            description: `Imported ${importedClauses.length} HIB clauses`,
          });
        },
        error: (error) => {
          console.error('Parse error:', error);
          toast({
            title: "Parse error",
            description: "Failed to parse the file. Please check the file format.",
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
    }
  };

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
      
      console.log('File selected for import:', file.name, file.type);
      handleImport(file);
    }
  }, [handleImport]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  const downloadCSVTemplate = () => {
    const template = [
      {
        'HIB Section': 'Section 4.1',
        'HIB Clause': '1',
        'Section Number': '1',
        'HIB Clause Description': 'The organisation shall develop a policy to prioritise the implementation of critical software updates from established software companies or legitimate sources for operating systems or applications (e.g., security patches) to be applied as soon as possible.',
        'Suggested artefacts': 'Software Update Policy, Patch Management Procedures',
        'Additional Information (I)': 'Data Security/Enterprise Data Management Planning',
        'Additional Information (II)': 'Implementation Planning',
        'Additional Information (III)': 'Technology'
      },
      {
        'HIB Section': 'Section 4.2',
        'HIB Clause': '2',
        'Section Number': '2',
        'HIB Clause Description': 'When determining the patch timeline in the patch policy, Organisation shall take into consideration patient care schedules.',
        'Suggested artefacts': 'Risk Assessment Documentation, Patch Timeline Matrix',
        'Additional Information (I)': 'Operational Planning',
        'Additional Information (II)': 'Healthcare Continuity',
        'Additional Information (III)': 'Risk Management'
      }
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'hib-checklist-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Template downloaded",
      description: "CSV template has been downloaded successfully",
    });
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium">Import HIB Checklist Data</h4>
            <Button onClick={downloadCSVTemplate} variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            
            {isDragActive ? (
              <p className="text-md font-medium text-blue-700">Drop your HIB data file here</p>
            ) : (
              <div>
                <p className="text-md font-medium">Drag and drop your HIB data file here, or click to browse</p>
                <p className="text-sm text-gray-500 mt-1">Supports CSV and Excel files (.xlsx, .xls, .csv)</p>
              </div>
            )}
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-800">
              <strong>Expected columns:</strong> HIB Section, HIB Clause, Section Number, HIB Clause Description, Suggested artefacts, Additional Information (I), Additional Information (II), Additional Information (III)
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Alternative column names are also supported (e.g., "Section" instead of "HIB Section")
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HIBImportSection;
