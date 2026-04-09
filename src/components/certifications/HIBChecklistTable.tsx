
import React from 'react';
import { EditableTable } from '@/components/ui/editable-table';

interface HIBClause {
  id: string;
  hibSection: string;
  hibClause: number;
  hibClauseDescription: string; // Renamed from suggestedArtefacts
  suggestedArtefacts: string; // New column
  implementationStatus: 'No' | 'Yes' | 'Partially' | '';
  remarks: string;
  additionalInformationI: string;
  additionalInformationII: string;
  additionalInformationIII: string;
  sectionNumber?: number; // New column
}

interface HIBChecklistTableProps {
  clauses: HIBClause[];
  onUpdate: (id: string, updates: Partial<HIBClause>) => Promise<{ success: boolean; error?: string }>;
  onDelete?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onCreate?: (data: Partial<HIBClause>) => Promise<{ success: boolean; error?: string }>;
}

const HIBChecklistTable: React.FC<HIBChecklistTableProps> = ({
  clauses,
  onUpdate,
  onDelete,
  onCreate,
}) => {
  const columns = [
    { 
      key: 'hibSection', 
      header: 'HIB Section', 
      type: 'text' as const, 
      editable: false, 
      required: true,
      sortable: true,
      width: '320px'
    },
    { 
      key: 'hibClause', 
      header: 'HIB Clause', 
      type: 'number' as const,
      editable: false, 
      required: true,
      sortable: true,
      width: '120px'
    },
    { 
      key: 'hibClauseDescription', 
      header: 'HIB Clause Description', 
      type: 'textarea' as const, 
      editable: false,
      width: '450px'
    },
    { 
      key: 'suggestedArtefacts', 
      header: 'Suggested Artefacts', 
      type: 'textarea' as const, 
      editable: false,
      width: '450px'
    },
    { 
      key: 'implementationStatus', 
      header: 'Implementation Status', 
      type: 'select' as const, 
      editable: true,
      options: ['No', 'Yes', 'Partially'],
      width: '200px'
    },
    { 
      key: 'remarks', 
      header: 'Remarks', 
      type: 'textarea' as const, 
      editable: true,
      width: '300px'
    },
    { 
      key: 'additionalInformationI', 
      header: 'Additional Info (I)', 
      type: 'text' as const, 
      editable: false,
      width: '200px'
    },
    { 
      key: 'additionalInformationII', 
      header: 'Additional Info (II)', 
      type: 'text' as const, 
      editable: false,
      width: '200px'
    },
    { 
      key: 'additionalInformationIII', 
      header: 'Additional Info (III)', 
      type: 'textarea' as const, 
      editable: false,
      width: '300px'
    }
  ];

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto">
        <EditableTable
          data={clauses}
          columns={columns}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onCreate={onCreate}
          allowAdd={true}
          allowDelete={false}
          className="min-w-full"
        />
      </div>
    </div>
  );
};

export default HIBChecklistTable;
