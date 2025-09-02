
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useInventory } from '@/hooks/useInventory';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Users, Shield, FileText, TrendingUp, ChevronRight, Globe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import MetricDrillDown from './dashboard/MetricDrillDown';
import ReadinessMetrics from './dashboard/ReadinessMetrics';
import type { DrillDownLevel } from './dashboard/EnhancedMetrics';

interface DashboardProps {
  onNavigateToImport?: () => void;
  onNavigateToAssets?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigateToImport, onNavigateToAssets }) => {
  const { hardwareInventory, softwareInventory, accountInventory, loading } = useInventory();
  const { profiles } = useUserProfiles();
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [drillDownPath, setDrillDownPath] = useState<any[]>([]);
  const { data: phishingData = [] } = useQuery({
    queryKey: ['phishing-scores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_phishing_scores')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch document assignments data
  const { data: documentAssignments = [] } = useQuery({
    queryKey: ['document-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_assignments')
        .select(`
          *,
          documents (
            title,
            category
          )
        `);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch documents data
  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch software assignments data
  const { data: softwareAssignments = [] } = useQuery({
    queryKey: ['software-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('software_inventory')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch physical location access data
  const { data: physicalLocationAccess = [] } = useQuery({
    queryKey: ['physical-location-access'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('physical_location_access')
        .select(`
          *,
          locations (
            id,
            name
          )
        `);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch cybersecurity assessment data from csba_domain_score_view
  const { data: cybersecurityAssessmentData = [] } = useQuery({
    queryKey: ['cybersecurity-assessment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('csba_domain_score_view' as any)
        .select('domain, domain_avg')
        .not('domain_avg', 'is', null);
      
      if (error) throw error;
      
      // Transform data to include colors and rename score field
      return (data || []).map((item: any) => ({
        domain: item.domain,
        score: item.domain_avg,
        color: '#3b82f6'
      }));
    },
  });

  // Fetch priority data for heat map using the existing priority column
  const { data: priorityData = [] } = useQuery({
    queryKey: ['cybersecurity-priority'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('csba_domain_score_view' as any)
        .select('domain, priority')
        .not('priority', 'is', null);
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        domain: item.domain,
        priority: item.priority
      })).sort((a, b) => {
        // Sort positive priorities (best to worst) at top, then negative priorities (worst to best) below
        if (a.priority >= 0 && b.priority >= 0) {
          return b.priority - a.priority; // Positive: best to worst
        } else if (a.priority < 0 && b.priority < 0) {
          return a.priority - b.priority; // Negative: worst to best
        } else {
          return b.priority - a.priority; // Positive before negative
        }
      });
    },
  });

  // Fetch key insights data
  const { data: keyInsightsData = [] } = useQuery({
    queryKey: ['key-insights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('csba_key_insights_view' as any)
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch detailed insights data for top 3 areas of improvement
  const { data: detailedInsightsData = [] } = useQuery({
    queryKey: ['detailed-insights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('csba_detailed_insights_view' as any)
        .select('*')
        .limit(3); // Limit to top 3 areas
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch checklist data for DBIMT identification
  const { data: hibChecklist = [] } = useQuery({
    queryKey: ['hib-checklist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hib_checklist')
        .select('*')
        .eq('hib_clause', 67);
      
      if (error) throw error;
      return data || [];
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate learning metrics from profiles
  const totalStaff = profiles.length;
  const cyberLearners = profiles.filter(p => p.cyber_learner === true).length;
  const dataProtectionLearners = profiles.filter(p => p.dpe_learner === true).length;
  const completedLearn = profiles.filter(p => p.learn_complete === true).length;
  const completedPDPA = profiles.filter(p => p.dpe_complete === true).length;

  // Calculate unique locations and departments for drill-downs
  const locations = [...new Set(profiles.map(p => p.location).filter(Boolean))];
  const departments = [...new Set(profiles.map(p => p.department).filter(Boolean))];

  // Create a simple user department map
  const userDeptMap = new Map();
  profiles.forEach(profile => {
    if (profile.department) {
      userDeptMap.set(profile.id, [{ department: { name: profile.department } }]);
    }
  });

  // Hidden table for cybersecurity score calculation
  const hiddenMetricsTable = [
    { measure: '% Staff enrolled in Learn', value: 95, weight: 0.10, purpose: 'Shows organizational commitment to cybersecurity education' },
    { measure: '% Completed Cyber Security Training', value: 92, weight: 0.40, purpose: 'Critical for overall awareness' },
    { measure: '% Completed Data Protection Training', value: 90, weight: 0.00, purpose: 'Equally important for PDPA compliance' },
    { measure: 'Average Cybersecurity Assessment Score', value: 90, weight: 0.25, purpose: 'Measures knowledge retention, key for effectiveness' },
    { measure: 'Average Data Protection Assessment Score', value: 86, weight: 0.25, purpose: 'Measures knowledge retention, key for complying with PDPA' }
  ];

  // Calculate weighted readiness score
  const calculateWeightedReadinessScore = () => {
    // Phishing exercise pass% (80 points max): Phishing Simulation Pass % * 40%
    const totalSent = phishingData?.filter(p => p.resource === 'sent').length || 0;
    const totalClicked = phishingData?.filter(p => p.resource === 'click_link').length || 0;
    const phishingPassRate = totalSent > 0 ? ((totalSent - totalClicked) / totalSent) * 100 : 0;
    const phishingScore = (phishingPassRate * 0.4);

    // DBIMT Identified (100 points max): IRT Score * 20%
    const hibImplemented = hibChecklist.some(item => 
      item.implementation_status === 'Implemented' || 
      item.implementation_status === 'Complete'
    );
    const irtScore = hibImplemented ? 100 : 0;
    const irtWeightedScore = (irtScore * 0.2);

    // Document completion rates
    const getDocumentCompletionRate = (titleKeywords: string[]) => {
      const doc = documents.find(d => 
        titleKeywords.some(keyword => 
          d.title?.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      if (!doc) return 0;
      
      const totalAssigned = documentAssignments.filter(a => a.document_id === doc.document_id).length;
      const totalCompleted = documentAssignments.filter(a => 
        a.document_id === doc.document_id && a.status === 'Completed'
      ).length;
      
      return totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0;
    };

    // Incident Response Plan Read (100 points max): IRP completion Rate * 10%
    const irpCompletionRate = getDocumentCompletionRate(['incident response']);
    const irpWeightedScore = (irpCompletionRate * 0.1);

    // Information Security Policy Read (100 points max): ISP completion Rate * 10%
    const ispCompletionRate = getDocumentCompletionRate(['information security', 'security policy']);
    const ispWeightedScore = (ispCompletionRate * 0.1);

    // Data Protection Policy Read (100 points max): DPP completion Rate * 10%
    const dppCompletionRate = getDocumentCompletionRate(['data protection', 'privacy policy']);
    const dppWeightedScore = (dppCompletionRate * 0.1);

    // Cyber Hygiene Handbook Read (100 points max): CHH completion rate * 10%
    const chhCompletionRate = getDocumentCompletionRate(['cyber hygiene', 'handbook']);
    const chhWeightedScore = (chhCompletionRate * 0.1);

    // Total weighted score
    const totalScore = phishingScore + irtWeightedScore + irpWeightedScore + ispWeightedScore + dppWeightedScore + chhWeightedScore;
    
    return Math.round(totalScore);
  };

  // Calculate category scores
  const educationScore = 795; // Based on weighted calculation: (10%*69 + 10%*36 + 10%*60 + 35%*90 + 35%*90)
  const protectionScore = Math.round((85 * 0.4) + (50 * 0.3) + (50 * 0.3)); // Compliance % (85%)*40% + Updated Account Inventory (50%)*30% + Updated Hardware Inventory (50%)*30%
  const readinessScore = calculateWeightedReadinessScore();
  
  // Calculate overall score using weighted formula: Education (40%), Protection (35%), Readiness (25%)
  const overallScore = Math.round(educationScore * 0.4 + protectionScore * 0.35 + readinessScore * 0.25);

  // Education metrics
  const educationMetrics = [
    // Count metrics
    {
      id: 'total_staff',
      title: 'Total Staff',
      icon: <Users className="h-6 w-6" />,
      getValue: () => totalStaff,
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count' as const
    },
    {
      id: 'cyber_learners',
      title: 'Cyber Learners',
      icon: <Shield className="h-6 w-6" />,
      getValue: () => cyberLearners,
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count' as const
    },
    {
      id: 'data_protection_learners',
      title: 'Data Protection Learners',
      icon: <FileText className="h-6 w-6" />,
      getValue: () => dataProtectionLearners,
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count' as const
    },
    {
      id: 'english_learners',
      title: 'English Learners',
      icon: <Globe className="h-6 w-6" />,
      getValue: () => profiles.filter(p => p.language === 'English' || p.language === '').length,
      drillDownLevels: ['Organization', 'Location', 'Department'],
      type: 'count' as const
    },
    {
      id: 'mandarin_learners',
      title: 'Mandarin Learners',
      icon: <Globe className="h-6 w-6" />,
      getValue: () => profiles.filter(p => p.language === 'Mandarin').length,
      drillDownLevels: ['Organization', 'Location', 'Department'],
      type: 'count' as const
    },
    // Performance/percentage metrics
    {
      id: 'staff_enrolled_learn',
      title: '% staff enrolled in Learn',
      icon: <Users className="h-6 w-6" />,
      getValue: () => totalStaff > 0 ? Math.round((cyberLearners / totalStaff) * 100) : 0,
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'percentage' as const
    },
    {
      id: 'cyber_aware_percentage',
      title: '% staff cyber security aware',
      icon: <Shield className="h-6 w-6" />,
      getValue: () => cyberLearners > 0 ? Math.round((profiles.filter(p => p.learn_complete === true).length / cyberLearners) * 100) : 0,
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'percentage' as const
    },
    {
      id: 'data_protection_aware_percentage',
      title: '% staff data protection aware',
      icon: <FileText className="h-6 w-6" />,
      getValue: () => dataProtectionLearners > 0 ? Math.round((profiles.filter(p => p.dpe_complete === true).length / dataProtectionLearners) * 100) : 0,
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'percentage' as const
    },
    {
      id: 'episode_completion',
      title: 'Staff completed each learn episode',
      icon: <TrendingUp className="h-6 w-6" />,
      getValue: () => profiles.filter(p => p.learn_complete === true).length,
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count' as const
    },
    {
      id: 'track_completion',
      title: 'Staff completing learn track',
      icon: <TrendingUp className="h-6 w-6" />,
      getValue: () => totalStaff > 0 ? Math.round((cyberLearners / totalStaff) * 100) : 0,
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'percentage' as const
    }
  ];

  // Protection metrics based on inventory data
  const protectionMetrics = [
    // Count Metrics
    {
      id: 'total_endpoints',
      title: 'Total Endpoints',
      icon: <Shield className="h-6 w-6" />,
      getValue: () => hardwareInventory.length,
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count' as const
    },
    {
      id: 'total_software',
      title: 'Total Software',
      icon: <FileText className="h-6 w-6" />,
      getValue: () => softwareInventory.length,
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count' as const
    },
    {
      id: 'total_physical_locations',
      title: 'Total Physical Locations',
      icon: <Globe className="h-6 w-6" />,
      getValue: () => [...new Set(profiles.map(p => p.location).filter(Boolean))].length,
      drillDownLevels: ['Organization', 'Location', 'Staff Count'],
      type: 'count' as const
    },
    {
      id: 'hw_onboarded_30d',
      title: 'HW Onboarded (30 days)',
      icon: <TrendingUp className="h-6 w-6" />,
      getValue: () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return hardwareInventory.filter(hw => 
          hw.created_at && new Date(hw.created_at) >= thirtyDaysAgo
        ).length;
      },
      drillDownLevels: ['Organization', 'Location', 'Department'],
      type: 'count' as const
    },
    {
      id: 'sw_onboarded_30d',
      title: 'SW Onboarded (30 days)',
      icon: <TrendingUp className="h-6 w-6" />,
      getValue: () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return softwareInventory.filter(sw => 
          sw.created_at && new Date(sw.created_at) >= thirtyDaysAgo
        ).length;
      },
      drillDownLevels: ['Organization', 'Location', 'Department'],
      type: 'count' as const
    },
    {
      id: 'hw_reaching_eos',
      title: 'HW Reaching EOS (100 days)',
      icon: <Shield className="h-6 w-6" />,
      getValue: () => {
        const hundredDaysFromNow = new Date();
        hundredDaysFromNow.setDate(hundredDaysFromNow.getDate() + 100);
        return hardwareInventory.filter(hw => 
          hw.end_of_support_date && new Date(hw.end_of_support_date) <= hundredDaysFromNow
        ).length;
      },
      drillDownLevels: ['Organization', 'Location', 'Department'],
      type: 'count' as const
    },
    {
      id: 'sw_reaching_eos',
      title: 'SW Reaching EOS (100 days)',
      icon: <FileText className="h-6 w-6" />,
      getValue: () => {
        const hundredDaysFromNow = new Date();
        hundredDaysFromNow.setDate(hundredDaysFromNow.getDate() + 100);
        return softwareInventory.filter(sw => 
          sw.end_of_support_date && new Date(sw.end_of_support_date) <= hundredDaysFromNow
        ).length;
      },
      drillDownLevels: ['Organization', 'Location', 'Department'],
      type: 'count' as const
    },
    // Performance Metrics
    {
      id: 'hw_security_config_completed',
      title: '% HW Security Configuration Completed',
      icon: <Shield className="h-6 w-6" />,
      getValue: () => {
        const configuredEndpoints = hardwareInventory.filter(hw => hw.status === 'Active').length;
        const totalEndpoints = hardwareInventory.length;
        return totalEndpoints > 0 ? Math.round((configuredEndpoints / totalEndpoints) * 100) : 0;
      },
      drillDownLevels: ['Organization %', 'Department %', 'Endpoint Details'],
      type: 'percentage' as const
    },
    {
      id: 'hw_patched_updated',
      title: '% HW Patched & Updated',
      icon: <TrendingUp className="h-6 w-6" />,
      getValue: () => {
        // Assuming hardware with recent updates are patched
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const patchedEndpoints = hardwareInventory.filter(hw => 
          hw.updated_at && new Date(hw.updated_at) >= thirtyDaysAgo
        ).length;
        const totalEndpoints = hardwareInventory.length;
        return totalEndpoints > 0 ? Math.round((patchedEndpoints / totalEndpoints) * 100) : 0;
      },
      drillDownLevels: ['Organization %', 'Department %', 'Endpoint Details'],
      type: 'percentage' as const
    },
    {
      id: 'compliance_percentage',
      title: 'Compliance %',
      icon: <Shield className="h-6 w-6" />,
      getValue: () => {
        const configPercentage = hardwareInventory.length > 0 ? 
          Math.round((hardwareInventory.filter(hw => hw.status === 'Active').length / hardwareInventory.length) * 100) : 0;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const patchPercentage = hardwareInventory.length > 0 ? 
          Math.round((hardwareInventory.filter(hw => hw.updated_at && new Date(hw.updated_at) >= thirtyDaysAgo).length / hardwareInventory.length) * 100) : 0;
        return Math.round((configPercentage + patchPercentage) / 2);
      },
      drillDownLevels: ['Organization %', 'Department %', 'Compliance Details'],
      type: 'percentage' as const
    },
    {
      id: 'account_inventory_overdue',
      title: 'Account Inventory Overdue Reviews',
      icon: <Users className="h-6 w-6" />,
      getValue: () => accountInventory.filter(account => account.approval_status === 'Not submitted').length,
      drillDownLevels: ['Organization', 'Department', 'Account Details'],
      type: 'count' as const
    },
    {
      id: 'hardware_inventory_overdue',
      title: 'Hardware Inventory Overdue Reviews',
      icon: <Shield className="h-6 w-6" />,
      getValue: () => hardwareInventory.filter(hw => hw.approval_status === 'Not submitted').length,
      drillDownLevels: ['Organization', 'Department', 'Hardware Details'],
      type: 'count' as const
    }
  ];

  // Readiness metrics (placeholder for now)
  const readinessMetrics: any[] = [];

  const handleMetricClick = (metricId: string) => {
    console.log('Metric clicked:', metricId, 'profiles:', profiles.length);
    setSelectedMetric(metricId);
    setDrillDownPath([{
      level: 1,
      title: 'Organization Level',
      data: profiles,
      type: 'org'
    }]);
  };

  const handleDrillDown = (level: number, data: any[], title: string, type: 'org' | 'location' | 'department' | 'staff', value?: number) => {
    const newLevel: DrillDownLevel = { level, title, data, type, value };
    setDrillDownPath(prev => [...prev.slice(0, level - 1), newLevel]);
  };

  const formatValue = (value: number, type: string) => {
    if (type === 'percentage') return `${value}%`;
    if (type === 'score') return `${value}/100`;
    return value.toString();
  };

  const getColorClass = (type: string, value: number) => {
    if (type === 'percentage' || type === 'score') {
      if (value >= 80) return 'text-green-600';
      if (value >= 60) return 'text-yellow-600';
      return 'text-red-600';
    }
    return 'text-primary';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 800) return { label: 'Very Low Risk', color: 'text-green-600' };
    if (score >= 740) return { label: 'Low Risk', color: 'text-green-500' };
    if (score >= 670) return { label: 'Moderate Risk', color: 'text-orange-600' };
    if (score >= 580) return { label: 'High Risk', color: 'text-yellow-600' };
    return { label: 'Critical Risk', color: 'text-red-600' };
  };

  const handleAddNewAsset = () => {
    console.log('Add new asset clicked');
    if (onNavigateToAssets) {
      onNavigateToAssets();
    } else {
      alert('Navigate to Assets Management to add new assets');
    }
  };

  if (selectedMetric) {
    const metric = [...educationMetrics, ...protectionMetrics, ...readinessMetrics].find(m => m.id === selectedMetric);
    if (!metric) return null;

    return (
      <div className="w-full space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedMetric(null)} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">{metric.title}</h1>
        </div>
        
        <MetricDrillDown
          metric={metric}
          profiles={profiles}
          drillDownPath={drillDownPath}
          onDrillDown={handleDrillDown}
          locations={locations}
          departments={departments}
          userDeptMap={userDeptMap}
          hardwareInventory={hardwareInventory}
          softwareInventory={softwareInventory}
          softwareAssignments={softwareAssignments}
          physicalLocationAccess={physicalLocationAccess}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">


      {/* Overall Score and Category Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="text-center">
            <CardTitle className="text-lg font-medium">Cybersecurity Score</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-6xl font-bold text-gray-900 mb-1">{overallScore}<span className="text-2xl text-gray-600">/850</span></div>
            <div className={`text-lg font-semibold ${getRiskLevel(overallScore).color}`}>
              {getRiskLevel(overallScore).label}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              {overallScore >= 800 ? 'Mature cybersecurity program; strong controls in place' :
               overallScore >= 740 ? 'Good security posture; minor gaps may exist' :
               overallScore >= 670 ? 'Basic security controls in place; moderate exposure' :
               overallScore >= 580 ? 'Weak security hygiene; multiple vulnerabilities likely' :
               'Severely lacking security defenses; major gaps may be unmitigated'}
            </div>
            <div className="text-sm text-gray-500">Score Range: 300-850</div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-between items-center p-4 bg-white rounded-lg border">
              <span className="text-sm font-medium text-gray-700">Education</span>
              <span className="text-2xl font-bold text-gray-900">{educationScore}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white rounded-lg border">
              <span className="text-sm font-medium text-gray-700">Protection</span>
              <span className="text-2xl font-bold text-gray-900">{protectionScore}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white rounded-lg border">
              <span className="text-sm font-medium text-gray-700">Readiness</span>
              <span className="text-2xl font-bold text-gray-900">{readinessScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Metrics */}
      <Tabs defaultValue="education" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="protection">Protection</TabsTrigger>
          <TabsTrigger value="readiness">Readiness</TabsTrigger>
        </TabsList>
        
        <TabsContent value="education" className="space-y-6">
          {/* Cybersecurity Behaviour Assessment Insights */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Cybersecurity Behaviour Assessment Insights</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-center">Average Score by Domain</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cybersecurityAssessmentData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                                          <XAxis 
                      dataKey="domain" 
                      height={100}
                      tick={{ fontSize: 9 }}
                      interval={0}
                      allowDataOverflow={false}
                      angle={-45}
                      textAnchor="end"
                    />
                      <YAxis 
                        domain={[0, 5]}
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Average Score', angle: -90, position: 'center', fontSize: 10 }}
                      />
                      <Tooltip 
                        formatter={(value: any) => [`${value}`, 'Score']}
                        labelFormatter={(label: string) => `Domain: ${label}`}
                      />
                      <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        {cybersecurityAssessmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="#3b82f6" />
                        ))}
                        <LabelList dataKey="score" position="top" style={{ fontSize: '10px', fill: '#374151' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Heat Map */}
              <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm text-center">Domain Priority Heat Map</CardTitle>
              </CardHeader>
                <CardContent className="pt-3 pb-2">
                  <div className="space-y-2">
                    {priorityData.map((item, index) => {
                      const isPositive = item.priority > 0;
                      const barWidth = Math.min(Math.abs(item.priority) / 50 * 100, 100);
                      
                      return (
                        <div key={index} className="flex items-center justify-between py-2">
                          <span className="text-xs text-gray-700 min-w-0 flex-1 pr-6">{item.domain}</span>
                          <div className="flex items-center gap-6 w-48">
                            <div className="w-32 h-4 bg-gray-200 overflow-hidden">
                              <div 
                                className={`h-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{ 
                                  width: `${barWidth}%`,
                                  marginLeft: isPositive ? '0' : 'auto'
                                }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600 min-w-0">
                              {item.priority.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Key Insights and Areas of Improvement Tables */}
          <div className="space-y-6">
            {/* Key Insights Table - Compact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/3 text-xs">Insight</TableHead>
                      <TableHead className="w-2/3 text-xs">Domain</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keyInsightsData.map((insight: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs font-medium py-2">{insight.insight || 'N/A'}</TableCell>
                        <TableCell className="text-xs py-2">{insight.domain || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                    {keyInsightsData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                          No key insights available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Top 3 Areas of Improvement Table - Full Width */}
            <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm">Top 3 Areas of Improvement</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Domain</TableHead>
                      <TableHead className="text-xs">Question</TableHead>
                      <TableHead className="text-xs">Avg Score</TableHead>
                      <TableHead className="text-xs">Recommendation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailedInsightsData.map((area: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs font-medium">{area.domain || 'N/A'}</TableCell>
                        <TableCell className="text-xs whitespace-normal max-w-xs">{area.question || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={area.avg_score >= 3 ? "default" : "destructive"}>
                            {area.avg_score || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs whitespace-normal max-w-xs">{area.recommendation || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                    {detailedInsightsData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No improvement areas identified
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Count Metrics */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Count Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {educationMetrics.filter(metric => metric.type === 'count').map((metric) => {
                const value = metric.getValue();
                return (
                  <Card key={metric.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleMetricClick(metric.id)}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                      {metric.icon}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`text-2xl font-bold ${getColorClass(metric.type, value)}`}>
                            {formatValue(value, metric.type)}
                          </div>
                          <Badge variant="secondary" className="text-xs mt-1">
                            Click for details
                          </Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {educationMetrics.filter(metric => metric.type === 'percentage').map((metric) => {
                const value = metric.getValue();
                return (
                  <Card key={metric.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleMetricClick(metric.id)}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                      {metric.icon}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`text-2xl font-bold ${getColorClass(metric.type, value)}`}>
                            {formatValue(value, metric.type)}
                          </div>
                          <Badge variant="secondary" className="text-xs mt-1">
                            Click for details
                          </Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="protection" className="space-y-6">
          {/* Count Metrics */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Count Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {protectionMetrics.filter(metric => metric.type === 'count').map((metric) => {
                const value = metric.getValue();
                return (
                  <Card key={metric.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleMetricClick(metric.id)}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                      {metric.icon}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`text-2xl font-bold ${getColorClass(metric.type, value)}`}>
                            {formatValue(value, metric.type)}
                          </div>
                          <Badge variant="secondary" className="text-xs mt-1">
                            Click for details
                          </Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {protectionMetrics.filter(metric => metric.type === 'percentage').map((metric) => {
                const value = metric.getValue();
                return (
                  <Card key={metric.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleMetricClick(metric.id)}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                      {metric.icon}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`text-2xl font-bold ${getColorClass(metric.type, value)}`}>
                            {formatValue(value, metric.type)}
                          </div>
                          <Badge variant="secondary" className="text-xs mt-1">
                            Click for details
                          </Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="readiness" className="space-y-4">
          <ReadinessMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
