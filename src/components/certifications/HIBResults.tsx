import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SortableTable, SortableTableHeader, SortableTableBody, SortableTableRow, SortableTableHead, SortableTableCell } from '@/components/ui/sortable-table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from '@/components/ui/use-toast';

interface HIBResultsClause {
  id: string;
  hibSection: string;
  implementationStatus: 'No' | 'Yes' | 'Partially' | '';
  sectionNumber?: number;
}

interface ResultSection {
  section: string;
  total: number;
  implemented: number;
  notImplemented: number;
  fail: number;
  pass: number;
  result: 'Pass' | 'Fail';
  sectionNumber?: number;
}

const HIBResults: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<ResultSection[]>([]);
  const [sortedResults, setSortedResults] = useState<ResultSection[]>([]);
  const [overallResult, setOverallResult] = useState<'Pass' | 'Fail'>('Fail');
  const [overallStats, setOverallStats] = useState({
    total: 0,
    implemented: 0,
    notImplemented: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Calculate and save results based on Supabase data
  const calculateAndSaveResults = async () => {
    if (!user) return;

    try {
      console.log('Calculating HIB results for user:', user.id);
      
      // Fetch HIB checklist data
      const { data, error } = await supabase
        .from('hib_checklist')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      console.log('HIB checklist data loaded:', data);

      if (!data || data.length === 0) {
        console.log('No HIB checklist data found');
        setResults([]);
        setSortedResults([]);
        setOverallStats({ total: 0, implemented: 0, notImplemented: 0 });
        setOverallResult('Fail');
        return;
      }

      const clauses: HIBResultsClause[] = data.map(item => ({
        id: item.id,
        hibSection: item.hib_section,
        implementationStatus: item.implementation_status as 'No' | 'Yes' | 'Partially' | '',
        sectionNumber: item.section_number
      }));
      
      console.log('Mapped clauses:', clauses);
      
      // Group clauses by HIB Section
      const sectionGroups = clauses.reduce((acc, clause) => {
        if (!acc[clause.hibSection]) {
          acc[clause.hibSection] = [];
        }
        acc[clause.hibSection].push(clause);
        return acc;
      }, {} as Record<string, HIBResultsClause[]>);

      console.log('Section groups:', sectionGroups);

      const sectionResults: ResultSection[] = Object.entries(sectionGroups).map(([sectionName, sectionClauses]) => {
        const total = sectionClauses.length;
        
        // Count implemented items (Yes + Partially count as implemented)
        const implementedCount = sectionClauses.filter(c => 
          c.implementationStatus === 'Yes' || c.implementationStatus === 'Partially'
        ).length;
        
        console.log(`Section ${sectionName}: total=${total}, implemented=${implementedCount}`);
        
        // Not Implemented = Total - Implemented
        const notImplemented = total - implementedCount;
        
        // Fail = Not Implemented, Pass = Implemented
        const fail = notImplemented;
        const pass = implementedCount;
        
        // Result is Pass if all items are implemented (notImplemented = 0), otherwise Fail
        const result: 'Pass' | 'Fail' = notImplemented === 0 ? 'Pass' : 'Fail';
        
        // Get section number from the first clause in the group (they should all have the same section number)
        const sectionNumber = sectionClauses[0]?.sectionNumber;
        
        return {
          section: sectionName,
          total,
          implemented: implementedCount,
          notImplemented,
          fail,
          pass,
          result,
          sectionNumber
        };
      });

      // Sort sections by section_number first, then by name for consistent display
      sectionResults.sort((a, b) => {
        // If both have section numbers, sort by section number
        if (a.sectionNumber !== undefined && b.sectionNumber !== undefined) {
          return a.sectionNumber - b.sectionNumber;
        }
        // If only one has section number, prioritize it
        if (a.sectionNumber !== undefined && b.sectionNumber === undefined) {
          return -1;
        }
        if (a.sectionNumber === undefined && b.sectionNumber !== undefined) {
          return 1;
        }
        // If neither has section number, sort by section name
        return a.section.localeCompare(b.section);
      });

      console.log('Calculated section results:', sectionResults);

      setResults(sectionResults);
      setSortedResults(sectionResults);

      // Calculate overall statistics
      const totalClauses = sectionResults.reduce((sum, section) => sum + section.total, 0);
      const totalImplemented = sectionResults.reduce((sum, section) => sum + section.implemented, 0);
      const totalNotImplemented = sectionResults.reduce((sum, section) => sum + section.notImplemented, 0);
      
      const newOverallStats = {
        total: totalClauses,
        implemented: totalImplemented,
        notImplemented: totalNotImplemented
      };
      
      console.log('Overall stats:', newOverallStats);
      
      setOverallStats(newOverallStats);

      // Overall result - Pass only if ALL sections pass
      const finalOverallResult = sectionResults.every(section => section.result === 'Pass') ? 'Pass' : 'Fail';
      setOverallResult(finalOverallResult);

      console.log('Final overall result:', finalOverallResult);

      // Save results to database
      await saveResultsToDatabase(sectionResults);

    } catch (error) {
      console.error('Error calculating results:', error);
      toast({
        title: "Error",
        description: "Failed to calculate HIB results",
        variant: "destructive",
      });
    }
  };

  const saveResultsToDatabase = async (sectionResults: ResultSection[]) => {
    if (!user) return;

    try {
      // Delete existing results for this user
      await supabase
        .from('hib_results')
        .delete()
        .eq('user_id', user.id);

      // Insert new results
      const dataToInsert = sectionResults.map((section, index) => ({
        user_id: user.id,
        section_name: section.section,
        section_number: section.sectionNumber || index + 1,
        total: section.total,
        implemented: section.implemented,
        not_implemented: section.notImplemented,
        fail: section.fail,
        pass: section.pass,
        result: section.result
      }));

      const { error } = await supabase
        .from('hib_results')
        .insert(dataToInsert);

      if (error) throw error;

      console.log('HIB results saved to database successfully');
    } catch (error) {
      console.error('Error saving results to database:', error);
      toast({
        title: "Warning",
        description: "Results calculated but failed to save to database",
        variant: "destructive",
      });
    }
  };

  const handleRecalculate = async () => {
    setSaving(true);
    try {
      await calculateAndSaveResults();
      toast({
        title: "Success",
        description: "HIB results recalculated and saved successfully",
      });
    } catch (error) {
      console.error('Error recalculating results:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSort = (sortedData: ResultSection[]) => {
    setSortedResults(sortedData);
  };

  // Always calculate fresh results when component loads
  useEffect(() => {
    const initializeResults = async () => {
      if (!user) return;

      setLoading(true);
      
      // Always calculate fresh results from current HIB checklist data
      await calculateAndSaveResults();
      setLoading(false);
    };

    initializeResults();
  }, [user]);

  const getResultIcon = (result: 'Pass' | 'Fail') => {
    return result === 'Pass' ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getResultBadge = (result: 'Pass' | 'Fail') => {
    return (
      <Badge variant={result === 'Pass' ? 'default' : 'destructive'} className="flex items-center gap-1">
        {getResultIcon(result)}
        {result}
      </Badge>
    );
  };

  const renderColorBar = (implemented: number, notImplemented: number) => {
    const total = implemented + notImplemented;
    if (total === 0) return null;
    
    const implementedPercentage = (implemented / total) * 100;
    const notImplementedPercentage = (notImplemented / total) * 100;
    
    return (
      <div className="flex w-full h-6 bg-gray-200 rounded overflow-hidden">
        {implemented > 0 && (
          <div 
            className="bg-green-500 h-full flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${implementedPercentage}%` }}
          >
            {implemented > 0 && implementedPercentage > 15 ? implemented : ''}
          </div>
        )}
        {notImplemented > 0 && (
          <div 
            className="bg-orange-500 h-full flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${notImplementedPercentage}%` }}
          >
            {notImplemented > 0 && notImplementedPercentage > 15 ? notImplemented : ''}
          </div>
        )}
      </div>
    );
  };

  const implementationPercentage = overallStats.total > 0 
    ? Math.round((overallStats.implemented / overallStats.total) * 100) 
    : 0;

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Please log in to access the HIB Results functionality.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading HIB Results...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">HIB Results</h3>
          <p className="text-sm text-muted-foreground">
            These are the results of your HIB Assessment
          </p>
        </div>
        <Button 
          onClick={handleRecalculate} 
          disabled={saving}
          variant="outline"
          className="flex items-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Recalculate Results
        </Button>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {getResultBadge(overallResult)}
                </div>
              </div>
              {overallResult === 'Fail' && <AlertTriangle className="h-8 w-8 text-red-500" />}
              {overallResult === 'Pass' && <CheckCircle className="h-8 w-8 text-green-500" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Implementation Progress</p>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Completed</span>
                  <span>{implementationPercentage}%</span>
                </div>
                <Progress value={implementationPercentage} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Summary Stats</p>
              <div className="mt-1 space-y-1">
                <p className="text-sm">Total: {overallStats.total}</p>
                <p className="text-sm">Implemented: {overallStats.implemented}</p>
                <p className="text-sm">Not Implemented: {overallStats.notImplemented}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Results for the {results.length} Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <SortableTable
              data={results}
              onSort={handleSort}
            >
              <SortableTableHeader>
                <SortableTableRow>
                  <SortableTableHead sortKey="sectionNumber" className="min-w-[200px]">Section</SortableTableHead>
                  <SortableTableHead sortKey="total" className="text-center">Total</SortableTableHead>
                  <SortableTableHead sortKey="implemented" className="text-center">Implemented</SortableTableHead>
                  <SortableTableHead sortKey="notImplemented" className="text-center">Not Implemented</SortableTableHead>
                  <SortableTableHead sortKey="fail" className="text-center">Fail</SortableTableHead>
                  <SortableTableHead sortKey="pass" className="text-center">Pass</SortableTableHead>
                  <SortableTableHead className="min-w-[200px]">Visual</SortableTableHead>
                  <SortableTableHead sortKey="result" className="text-center">Result</SortableTableHead>
                </SortableTableRow>
              </SortableTableHeader>
              <SortableTableBody>
                {sortedResults.map((section, index) => (
                  <SortableTableRow key={index}>
                    <SortableTableCell className="text-sm font-medium">
                      {section.section}
                    </SortableTableCell>
                    <SortableTableCell className="text-center">{section.total}</SortableTableCell>
                    <SortableTableCell className="text-center">{section.implemented}</SortableTableCell>
                    <SortableTableCell className="text-center">{section.notImplemented}</SortableTableCell>
                    <SortableTableCell className="text-center">{section.fail}</SortableTableCell>
                    <SortableTableCell className="text-center">{section.pass}</SortableTableCell>
                    <SortableTableCell className="px-2">
                      {renderColorBar(section.implemented, section.notImplemented)}
                    </SortableTableCell>
                    <SortableTableCell className="text-center">
                      {getResultBadge(section.result)}
                    </SortableTableCell>
                  </SortableTableRow>
                ))}
              </SortableTableBody>
            </SortableTable>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Message */}
      <Card className={`border-2 ${overallResult === 'Pass' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {overallResult === 'Pass' ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-red-600" />
            )}
            <div>
              <p className="font-medium">
                Your organisation is {overallResult === 'Pass' ? 'HIB COMPLIANT' : 'not HIB COMPLIANT yet'}.
              </p>
              {overallResult === 'Fail' && (
                <p className="text-sm text-muted-foreground mt-1">
                  To be HIB COMPLIANT, all the HIB Assessment requirements have to be implemented.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HIBResults;
