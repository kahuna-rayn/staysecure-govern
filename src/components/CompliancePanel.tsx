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

  const filteredKeyDates = useMemo(() => {
    return keyDates.filter((item) => {
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
    },
    {
      key: 'due_date' as keyof KeyDate,
      header: 'Due Date',
      type: 'date' as const,
      editable: false,
      sortable: true,
    },
    {
      key: 'updated_due_date' as keyof KeyDate,
      header: 'Updated Due Date',
      type: 'date' as const,
      editable: true,
      sortable: true,
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