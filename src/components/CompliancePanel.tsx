import React, { useEffect, useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Calendar, Search, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { EditableTable } from '@/components/ui/editable-table';
import { toast } from '@/hooks/use-toast';

interface KeyDate {
  id: string;
  key_activity: string | null;
  due_date: string | null;
  updated_due_date: string | null;
  frequency: string | null;
  certificate: string | null;
  created_at: string;
  modified_at: string | null;
  created_by: string | null;
  modified_by: string | null;
}

interface PeriodicReview {
  id: string;
  activity: string | null;
  due_date: string | null;
  submitted_at: string | null;
  submitted_by: string | null;
  approved_at: string;
  approved_by: string | null;
  approval_status: 'Not Submitted' | 'Submitted' | 'Rejected' | 'Approved' | null;
  summary_or_evidence: string | null;
  any_change: boolean | null;
}

interface PeriodicReviewWithNames extends PeriodicReview {
  submitted_by_name?: string;
  approved_by_name?: string;
}

const CompliancePanel: React.FC = () => {
  const [keyDates, setKeyDates] = useState<KeyDate[]>([]);
  const [periodicReviews, setPeriodicReviews] = useState<PeriodicReviewWithNames[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewsSearchTerm, setReviewsSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('key-dates');

  useEffect(() => {
    const fetchKeyDates = async () => {
      try {
        const { data, error } = await supabase.rpc('get_key_dates');

        if (error) throw error;
        setKeyDates(data || []);
      } catch (error) {
        console.error('Error fetching key dates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKeyDates();
  }, []);

  useEffect(() => {
    const fetchPeriodicReviews = async () => {
      try {
        // Fetch periodic reviews first
        console.log('Fetching periodic reviews...');
        const { data, error } = await supabase
          .from('periodic_reviews')
          .select('*')
          .order('due_date', { ascending: true });

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        console.log('Raw data:', data);

        // Get unique user IDs for fetching names
        const userIds = [...new Set([
          ...(data || []).map((item: any) => item.submitted_by).filter(Boolean),
          ...(data || []).map((item: any) => item.approved_by).filter(Boolean)
        ])];

        // Fetch user names if we have any user IDs
        let userNames: { [key: string]: string } = {};
        if (userIds.length > 0) {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);

          if (!userError && userData) {
            userNames = userData.reduce((acc: any, user: any) => {
              acc[user.id] = user.full_name || 'Unknown';
              return acc;
            }, {});
          }
        }

        // Transform the data to include user names
        const reviewsWithNames = (data || []).map((review: any) => ({
          ...review,
          submitted_by_name: review.submitted_by ? (userNames[review.submitted_by] || 'Unknown') : 'Unknown',
          approved_by_name: review.approved_by ? (userNames[review.approved_by] || 'Unknown') : 'Unknown',
        }));

        console.log('Processed data:', reviewsWithNames);
        console.log('Sample item structure:', reviewsWithNames[0]);

        setPeriodicReviews(reviewsWithNames);
      } catch (error) {
        console.error('Error fetching periodic reviews:', error);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchPeriodicReviews();
  }, []);

  // Calculate due date based on frequency and activity name
  // TODO: This is a temporary implementation for demo purposes.
  // The correct implementation should calculate dates based on organization certification dates.
  // See docs/KEY_DATES_DUE_DATE_CALCULATION.md for details.
  const calculateDueDate = (item: KeyDate): string | null => {
    // If there's an updated_due_date, use that
    if (item.updated_due_date) {
      return item.updated_due_date;
    }

    // If there's already a due_date, use that
    if (item.due_date) {
      return item.due_date;
    }

    // Calculate based on frequency
    const frequency = item.frequency?.toLowerCase() || '';
    const activityName = item.key_activity || '';
    const currentYear = new Date().getFullYear();
    const currentDate = new Date();

    // Extract quarter from activity name (e.g., "Q1", "Q2", "Q3", "Q4")
    const quarterMatch = activityName.match(/\bQ([1-4])\b/i);
    
    if (quarterMatch) {
      const quarter = parseInt(quarterMatch[1]);
      const currentMonth = currentDate.getMonth(); // 0-11 (Jan = 0, Dec = 11)
      const currentQuarter = Math.floor(currentMonth / 3) + 1; // 1-4
      
      let dueDate: Date;
      let targetYear = currentYear;

      switch (quarter) {
        case 1:
          dueDate = new Date(targetYear, 2, 31); // March 31
          break;
        case 2:
          dueDate = new Date(targetYear, 5, 30); // June 30
          break;
        case 3:
          dueDate = new Date(targetYear, 8, 30); // September 30
          break;
        case 4:
          dueDate = new Date(targetYear, 11, 31); // December 31
          break;
        default:
          return null;
      }

      // If the quarter has passed this year, use next year
      // Also, if we're in a later quarter, earlier quarters should be next year
      if (quarter < currentQuarter || (quarter === currentQuarter && dueDate < currentDate)) {
        dueDate = new Date(currentYear + 1, dueDate.getMonth(), dueDate.getDate());
      }

      return dueDate.toISOString().split('T')[0];
    }

    // Handle semi-annual frequency
    if (frequency.includes('semi-annual') || frequency.includes('semi-annually') || frequency.includes('semiannual')) {
      // Semi-annual: twice a year - typically June 30 and December 31
      // Check if activity name indicates H1 (first half) or H2 (second half)
      const halfMatch = activityName.match(/\bH([12])\b/i);
      
      if (halfMatch) {
        const half = parseInt(halfMatch[1]);
        let dueDate: Date;
        
        if (half === 1) {
          // First half: June 30
          dueDate = new Date(currentYear, 5, 30); // June 30
        } else {
          // Second half: December 31
          dueDate = new Date(currentYear, 11, 31); // December 31
        }
        
        // If the half-year has passed, use next year
        if (dueDate < currentDate) {
          dueDate = new Date(currentYear + 1, dueDate.getMonth(), dueDate.getDate());
        }
        
        return dueDate.toISOString().split('T')[0];
      } else {
        // No H1/H2 indicator - determine based on current date
        const currentMonth = currentDate.getMonth();
        const june30 = new Date(currentYear, 5, 30); // June 30
        const dec31 = new Date(currentYear, 11, 31); // December 31
        
        // If we're past June 30, next due date is December 31
        // If we're past December 31, next due date is June 30 of next year
        if (currentDate > dec31) {
          return new Date(currentYear + 1, 5, 30).toISOString().split('T')[0];
        } else if (currentDate > june30) {
          return dec31.toISOString().split('T')[0];
        } else {
          return june30.toISOString().split('T')[0];
        }
      }
    }

    // Handle other frequencies
    if (frequency.includes('monthly')) {
      // Monthly: end of current month, or next month if we're past the 15th
      const day = currentDate.getDate();
      const month = day > 15 ? currentDate.getMonth() + 1 : currentDate.getMonth();
      const year = month > 11 ? currentYear + 1 : currentYear;
      const lastDay = new Date(year, month + 1, 0).getDate();
      return new Date(year, month, lastDay).toISOString().split('T')[0];
    }

    if (frequency.includes('annually') || frequency.includes('yearly') || frequency.includes('annual')) {
      // Annually: end of current year
      // If we're past the end of the year, use next year
      const yearEnd = new Date(currentYear, 11, 31);
      if (currentDate > yearEnd) {
        return new Date(currentYear + 1, 11, 31).toISOString().split('T')[0];
      }
      return yearEnd.toISOString().split('T')[0];
    }

    if (frequency.includes('weekly')) {
      // Weekly: end of current week (Sunday)
      const dayOfWeek = currentDate.getDay();
      const daysUntilSunday = 7 - dayOfWeek;
      const dueDate = new Date(currentDate);
      dueDate.setDate(currentDate.getDate() + daysUntilSunday);
      return dueDate.toISOString().split('T')[0];
    }

    if (frequency.includes('daily')) {
      // Daily: today
      return currentDate.toISOString().split('T')[0];
    }

    return null;
  };

  const filteredKeyDates = useMemo(() => {
    return keyDates
      .map((item) => {
        // Calculate due_date if it's missing
        const calculatedDueDate = item.due_date || calculateDueDate(item);
        // Format for display - EditableTable will use this value for display
        const formattedDueDate = calculatedDueDate 
          ? format(new Date(calculatedDueDate), 'MMM dd, yyyy')
          : '';
        
        return {
          ...item,
          // Store original date for updates, but display formatted version
          due_date: formattedDueDate || calculatedDueDate,
          _original_due_date: calculatedDueDate, // Keep original for saving
        };
      })
      .filter((item) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          (item.key_activity?.toLowerCase().includes(searchLower) ?? false) ||
          (item.certificate?.toLowerCase().includes(searchLower) ?? false) ||
          (item.frequency?.toLowerCase().includes(searchLower) ?? false)
        );
      });
  }, [keyDates, searchTerm]);

  const filteredPeriodicReviews = useMemo(() => {
    return periodicReviews.filter((item) => {
      const searchLower = reviewsSearchTerm.toLowerCase();
      return (
        (item.activity?.toLowerCase().includes(searchLower) ?? false) ||
        (item.approval_status?.toLowerCase().includes(searchLower) ?? false) ||
        (item.summary_or_evidence?.toLowerCase().includes(searchLower) ?? false) ||
        (item.submitted_by_name?.toLowerCase().includes(searchLower) ?? false) ||
        (item.approved_by_name?.toLowerCase().includes(searchLower) ?? false)
      );
    }).map(item => ({
      ...item,
      // Format dates for display
      due_date: item.due_date ? format(new Date(item.due_date), 'MMM dd, yyyy') : '',
      submitted_at: item.submitted_at ? format(new Date(item.submitted_at), 'MMM dd, yyyy HH:mm') : '',
      approved_at: item.approved_at ? format(new Date(item.approved_at), 'MMM dd, yyyy HH:mm') : '',
      // Format boolean for display
      any_change: item.any_change ? 'Yes' : 'No',
    }));
  }, [periodicReviews, reviewsSearchTerm]);

  const handleKeyDateUpdate = async (id: string, updates: Partial<KeyDate>) => {
    try {
      const { error } = await supabase
        .from('key_dates')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setKeyDates(prev => 
        prev.map(item => 
          item.id === id ? { ...item, ...updates } : item
        )
      );

      toast({
        title: "Success",
        description: "Key date updated successfully",
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating key date:', error);
      toast({
        title: "Error",
        description: "Failed to update key date",
        variant: "destructive",
      });
      return { success: false, error: "Failed to update key date" };
    }
  };

  const handlePeriodicReviewUpdate = async (id: string, updates: Partial<PeriodicReviewWithNames>) => {
    try {
      // Remove computed fields before updating
      const { submitted_by_name, approved_by_name, ...rawUpdates } = updates;
      
      // Convert any_change string back to boolean if present
      const dbUpdates = { ...rawUpdates };
      if ('any_change' in dbUpdates && typeof dbUpdates.any_change === 'string') {
        dbUpdates.any_change = dbUpdates.any_change === 'Yes';
      }
      
      const { error } = await supabase
        .from('periodic_reviews')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setPeriodicReviews(prev => 
        prev.map(item => 
          item.id === id ? { ...item, ...updates } : item
        )
      );

      toast({
        title: "Success",
        description: "Periodic review updated successfully",
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating periodic review:', error);
      toast({
        title: "Error",
        description: "Failed to update periodic review",
        variant: "destructive",
      });
      return { success: false, error: "Failed to update periodic review" };
    }
  };

  const keyDateColumns = [
    {
      key: 'key_activity' as keyof KeyDate,
      header: 'Activity',
      type: 'text' as const,
      editable: false,
      sortable: true,
      width: '40%',
    },
    {
      key: 'frequency' as keyof KeyDate,
      header: 'Frequency',
      type: 'text' as const,
      editable: false,
      sortable: true,
    },
    {
      key: 'certificate' as keyof KeyDate,
      header: 'Certificate',
      type: 'text' as const,
      editable: false,
      sortable: true,
      width: '15%', // Reduced from default to make room for Due Date
    },
    {
      key: 'due_date' as keyof KeyDate,
      header: 'Due Date',
      type: 'date' as const,
      editable: false,
      sortable: true,
      width: '20%', // Increased width so dates display on one line
    },
    {
      key: 'updated_due_date' as keyof KeyDate,
      header: 'Updated Due Date',
      type: 'date' as const,
      editable: true,
      sortable: true,
      width: '20%',
    },
  ];

  const periodicReviewColumns = [
    {
      key: 'activity' as keyof PeriodicReviewWithNames,
      header: 'Activity',
      type: 'text' as const,
      editable: false,
      sortable: true,
      width: '350px',
    },
    {
      key: 'due_date' as keyof PeriodicReviewWithNames,
      header: 'Due Date',
      type: 'text' as const,
      editable: false,
      sortable: true,
      width: '140px',
    },
    {
      key: 'approval_status' as keyof PeriodicReviewWithNames,
      header: 'Status',
      type: 'text' as const,
      editable: true,
      sortable: true,
      width: '140px',
    },
    {
      key: 'any_change' as keyof PeriodicReviewWithNames,
      header: 'Changes Made',
      type: 'text' as const,
      editable: false,
      sortable: true,
      width: '140px',
    },
    {
      key: 'submitted_at' as keyof PeriodicReviewWithNames,
      header: 'Submitted At',
      type: 'text' as const,
      editable: false,
      sortable: true,
      width: '180px',
    },
    {
      key: 'submitted_by_name' as keyof PeriodicReviewWithNames,
      header: 'Submitted By',
      type: 'text' as const,
      editable: false,
      sortable: true,
      width: '180px',
    },
    {
      key: 'approved_at' as keyof PeriodicReviewWithNames,
      header: 'Approved At',
      type: 'text' as const,
      editable: false,
      sortable: true,
      width: '180px',
    },
    {
      key: 'approved_by_name' as keyof PeriodicReviewWithNames,
      header: 'Approved By',
      type: 'text' as const,
      editable: false,
      sortable: true,
      width: '180px',
    },
    {
      key: 'summary_or_evidence' as keyof PeriodicReviewWithNames,
      header: 'Summary/Evidence',
      type: 'text' as const,
      editable: true,
      sortable: true,
      width: '400px',
    },
  ];

  return (
    <div className="w-full px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compliance</h1>
          <p className="text-muted-foreground">Critical activities and information to stay cyber and data resilient</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="key-dates" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Key Dates & Activities
          </TabsTrigger>
          <TabsTrigger value="periodic-reviews" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Periodic Reviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="key-dates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Key Dates & Activities
                <Badge variant="outline" className="ml-auto border-blue-500 text-blue-600">
                  {filteredKeyDates.length} {filteredKeyDates.length === 1 ? 'activity' : 'activities'}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search activities, certificates, or frequency..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading compliance data...</div>
                </div>
              ) : (
                <EditableTable
                  data={filteredKeyDates}
                  columns={keyDateColumns}
                  onUpdate={handleKeyDateUpdate}
                  allowAdd={false}
                  allowDelete={false}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="periodic-reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Periodic Reviews
                <Badge variant="outline" className="ml-auto border-green-500 text-green-600">
                  {filteredPeriodicReviews.length} {filteredPeriodicReviews.length === 1 ? 'review' : 'reviews'}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search activities, status, or summary..."
                    value={reviewsSearchTerm}
                    onChange={(e) => setReviewsSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading periodic reviews...</div>
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-md">
                  <div className="min-w-[1950px]">
                     <EditableTable
                       data={filteredPeriodicReviews}
                       columns={periodicReviewColumns}
                       onUpdate={(id: string, updates: any) => handlePeriodicReviewUpdate(id, updates)}
                       allowAdd={false}
                       allowDelete={false}
                     />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompliancePanel;