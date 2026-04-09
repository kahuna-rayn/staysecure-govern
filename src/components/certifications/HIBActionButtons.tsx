
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Download } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import Papa from 'papaparse';
import { HIBClause } from '@/utils/hibDataUtils';

interface HIBActionButtonsProps {
  clauses: HIBClause[];
  onToggleImport: () => void;
}

const HIBActionButtons: React.FC<HIBActionButtonsProps> = ({ clauses, onToggleImport }) => {
  const downloadCurrentData = () => {
    const dataToExport = clauses.map(clause => ({
      'HIB Section': clause.hibSection,
      'HIB Clause': clause.hibClause.toString(),
      'Suggested artefacts': clause.suggestedArtefacts,
      'Implementation Status': clause.implementationStatus,
      'Remarks': clause.remarks,
      'Additional Information (I)': clause.additionalInformationI,
      'Additional Information (II)': clause.additionalInformationII,
      'Additional Information (III)': clause.additionalInformationIII
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `hib-checklist-data-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Data exported",
      description: "Current HIB checklist data has been downloaded",
    });
  };

  return (
    <div className="flex gap-2">
      <Button onClick={onToggleImport} variant="outline" size="icon">
        <Upload className="h-4 w-4" />
      </Button>
      <Button onClick={downloadCurrentData} variant="outline" size="icon">
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default HIBActionButtons;
