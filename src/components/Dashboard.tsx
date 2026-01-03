
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useInventory } from '@/hooks/useInventory';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Users, Shield, FileText, TrendingUp, ChevronRight, Globe, Mail, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import MetricDrillDown from './dashboard/MetricDrillDown';
import type { DrillDownLevel } from './dashboard/EnhancedMetrics';

interface DashboardProps {
  onNavigateToImport?: () => void;
  onNavigateToAssets?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigateToImport, onNavigateToAssets }) => {
  const navigate = useNavigate();
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
        score: Math.round((item.domain_avg || 0) * 10) / 10, // Round to 1 decimal place
        color: '#3b82f6'
      }));
    },
  });

  // Fetch data protection assessment data from dpba_domain_score_view (if it exists)
 // const { data: dataProtectionAssessmentData = [] } = useQuery({
 //   queryKey: ['data-protection-assessment'],
   // queryFn: async () => {
 //     const { data, error } = await supabase
 //       .from('dpba_domain_score_view' as any)
   //     .select('domain, domain_avg')
 //       .not('domain_avg', 'is', null);
      
      // Transform data to include colors and rename score field
 //     return (data || []).map((item: any) => ({
 //       domain: item.domain,
 //       score: Math.round((item.domain_avg || 0) * 10) / 10, // Round to 1 decimal place
 //       color: '#3b82f6'
 //     }));
 //   },
 // });

  // Fetch priority data for heat map using the existing priority column - COMMENTED OUT (moved to commented section below)
  // const { data: priorityData = [] } = useQuery({
  //   queryKey: ['cybersecurity-priority'],
  //   queryFn: async () => {
  //     const { data, error } = await supabase
  //       .from('csba_domain_score_view' as any)
  //       .select('domain, priority')
  //       .not('priority', 'is', null);
  //     
  //     if (error) throw error;
  //     
  //     return (data || []).map((item: any) => ({
  //       domain: item.domain,
  //       priority: item.priority
  //     })).sort((a, b) => {
  //       // Sort positive priorities (best to worst) at top, then negative priorities (worst to best) below
  //       if (a.priority >= 0 && b.priority >= 0) {
  //         return b.priority - a.priority; // Positive: best to worst
  //       } else if (a.priority < 0 && b.priority < 0) {
  //         return a.priority - b.priority; // Negative: worst to best
  //       } else {
  //         return b.priority - a.priority; // Positive before negative
  //       }
  //     });
  //   },
  // });

  // Fetch key insights data - COMMENTED OUT (moved to commented section below)
  // const { data: keyInsightsData = [] } = useQuery({
  //   queryKey: ['key-insights'],
  //   queryFn: async () => {
  //     const { data, error } = await supabase
  //       .from('csba_key_insights_view' as any)
  //       .select('*');
  //     
  //     if (error) throw error;
  //     return data || [];
  //   },
  // });

  // Fetch detailed insights data for top 3 areas of improvement - COMMENTED OUT (moved to commented section below)
  // const { data: detailedInsightsData = [] } = useQuery({
  //   queryKey: ['detailed-insights'],
  //   queryFn: async () => {
  //     const { data, error } = await supabase
  //       .from('csba_detailed_insights_view' as any)
  //       .select('*')
  //       .limit(3); // Limit to top 3 areas
  //     
  //     if (error) throw error;
  //     return data || [];
  //   },
  // });

  // Fetch breach management team data for DBIMT score calculation
  const { data: breachTeamData } = useQuery<{
    rolesWithMembers: number;
    totalRoles: number;
    dbimtScore: number;
  }>({
    queryKey: ['breach-management-team'],
    queryFn: async () => {
      // Get all breach management team roles, excluding 'Insurance Rep' and 'Incident Manager' (with or without trailing space)
      const { data: teamRoles, error: teamError } = await supabase
        .from('breach_management_team')
        .select('id, team_role')
        .not('team_role', 'is', null);
      
      if (teamError) throw teamError;
      
      // Filter out 'Insurance Rep' and 'Incident Manager' (handle trailing space)
      const filteredRoles = (teamRoles || []).filter(role => {
        const roleName = role.team_role?.trim() || '';
        return roleName !== 'Insurance Rep' && 
               roleName !== 'Incident Manager' &&
               roleName !== '';
      });
      
      // Get all breach team members
      const { data: teamMembers, error: membersError } = await supabase
        .from('breach_team_members')
        .select('breach_team_id');
      
      if (membersError) throw membersError;
      
      // Count how many roles have at least one member
      const rolesWithMembers = filteredRoles.filter(role => 
        (teamMembers || []).some(member => member.breach_team_id === role.id)
      ).length;
      
      // Calculate score: roles with members / 7 (total possible roles)
      const totalRoles = 7;
      const dbimtScore = totalRoles > 0 ? (rolesWithMembers / totalRoles) * 100 : 0;
      
      return {
        rolesWithMembers,
        totalRoles,
        dbimtScore: Math.round(dbimtScore)
      };
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
  // Phishing exercise pass% (80 points max): Phishing Simulation Pass % * 40%
  // DBIMT Identified (100 points max): IRT Score * 20%
  // Document completion rates: IRP, ISP, DPP, CHH each * 10%
  const calculateWeightedReadinessScore = () => {
    // Phishing pass rate
    const totalSent = phishingData?.filter(p => p.resource === 'sent').length || 0;
    const totalClicked = phishingData?.filter(p => p.resource === 'click_link').length || 0;
    const phishingPassRate = totalSent > 0 ? ((totalSent - totalClicked) / totalSent) * 100 : 0;
    const phishingScore = (phishingPassRate * 0.4);

    // DBIMT Score
    const irtScore = breachTeamData?.dbimtScore || 0;
    const irtWeightedScore = (irtScore * 0.2);

    // Document completion rates helper
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

  // Calculate education score using the formula from the table:
  // 20% * (% Staff enrolled in Learn)
  // 20% * (% Staff enrolled in Data Protection Training)
  // 30% * (% Completed Cyber Security Training)
  // 30% * (% Completed Data Protection Training)
  const calculateEducationScore = () => {
    // 1. % Staff enrolled in Learn (20%)
    const staffEnrolledInLearn = totalStaff > 0 ? (cyberLearners / totalStaff) * 100 : 0;
    const enrolledLearnScore = 0.20 * staffEnrolledInLearn;

    // 2. % Staff enrolled in Data Protection Training (20%)
    const staffEnrolledInDataProtection = totalStaff > 0 ? (dataProtectionLearners / totalStaff) * 100 : 0;
    const enrolledDataProtectionScore = 0.20 * staffEnrolledInDataProtection;

    // 3. % Completed Cyber Security Training (30%)
    const completedCyberSecurityTraining = cyberLearners > 0 ? (completedLearn / cyberLearners) * 100 : 0;
    const completedCyberSecurityScore = 0.30 * completedCyberSecurityTraining;

    // 4. % Completed Data Protection Training (30%)
    const completedDataProtectionTraining = dataProtectionLearners > 0 ? (completedPDPA / dataProtectionLearners) * 100 : 0;
    const completedDataProtectionScore = 0.30 * completedDataProtectionTraining;

    // Total weighted score
    const totalScore = enrolledLearnScore + enrolledDataProtectionScore + 
                       completedCyberSecurityScore + completedDataProtectionScore;
    
    return Math.round(totalScore);
  };

  // Calculate protection-related values once (used in both score calculation and metrics)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const configPercentage = hardwareInventory.length > 0 ? 
    (hardwareInventory.filter(hw => hw.status === 'Active').length / hardwareInventory.length) * 100 : 0;
  
  const patchPercentage = hardwareInventory.length > 0 ? 
    (hardwareInventory.filter(hw => hw.updated_at && new Date(hw.updated_at) >= thirtyDaysAgo).length / hardwareInventory.length) * 100 : 0;
  
  const compliancePercentage = (configPercentage + patchPercentage) / 2;
  
  const accountInventoryOverdue = accountInventory.filter(account => account.approval_status === 'Not submitted').length;
  const updatedAccountInventory = accountInventory.length > 0 ?
    ((accountInventory.length - accountInventoryOverdue) / accountInventory.length) * 100 : 0;
  
  const hardwareInventoryOverdue = hardwareInventory.filter(hw => hw.approval_status === 'Not submitted').length;
  const updatedHardwareInventory = hardwareInventory.length > 0 ?
    ((hardwareInventory.length - hardwareInventoryOverdue) / hardwareInventory.length) * 100 : 0;

  // Calculate protection score: Compliance % (40%) + Updated Account Inventory % (30%) + Updated Hardware Inventory % (30%)
  const calculateProtectionScore = () => {
    const complianceScore = compliancePercentage * 0.4;
    const accountInventoryScore = updatedAccountInventory * 0.3;
    const hardwareInventoryScore = updatedHardwareInventory * 0.3;

    // Total weighted score
    const totalScore = complianceScore + accountInventoryScore + hardwareInventoryScore;
    
    return Math.round(totalScore);
  };

  // Calculate category scores
  const educationScore = calculateEducationScore();
  const protectionScore = calculateProtectionScore();
  const readinessScore = calculateWeightedReadinessScore();
  
  // Calculate overall score using weighted formula: Education (40%), Protection (45%), Readiness (15%)
  const overallScore = Math.round(educationScore * 0.40 + protectionScore * 0.45 + readinessScore * 0.15);

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
    // {
    //   id: 'english_learners',
    //   title: 'English Learners',
    //   icon: <Globe className="h-6 w-6" />,
    //   getValue: () => profiles.filter(p => p.language === 'English' || p.language === '').length,
    //   drillDownLevels: ['Organization', 'Location', 'Department'],
    //   type: 'count' as const
    // },
    // {
    //   id: 'chinese_learners',
    //   title: 'Chinese Learners',
    //   icon: <Globe className="h-6 w-6" />,
    //   getValue: () => profiles.filter(p => p.language === 'Chinese').length,
    //   drillDownLevels: ['Organization', 'Location', 'Department'],
    //   type: 'count' as const
    // },
    // Performance/percentage metrics
    {
      id: 'staff_enrolled_learn',
      title: '% staff enrolled in Learn',
      icon: <Shield size={24} className="h-6 w-6" />,
      getValue: () => totalStaff > 0 ? Math.round((cyberLearners / totalStaff) * 100) : 0,
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'percentage' as const
    },
    {
      id: 'staff_enrolled_data_protection',
      title: '% staff enrolled in Data Protection',
      icon: <FileText size={24} className="h-6 w-6" />,
      getValue: () => totalStaff > 0 ? Math.round((dataProtectionLearners / totalStaff) * 100) : 0,
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'percentage' as const
    },
    {
      id: 'cyber_aware_percentage',
      title: '% staff cyber security aware',
      icon: <Shield size={24} className="h-6 w-6" />,
      getValue: () => cyberLearners > 0 ? Math.round((profiles.filter(p => p.learn_complete === true).length / cyberLearners) * 100) : 0,
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'percentage' as const
    },
    {
      id: 'data_protection_aware_percentage',
      title: '% staff data protection aware',
      icon: <FileText size={24} className="h-6 w-6" />,
      getValue: () => dataProtectionLearners > 0 ? Math.round((profiles.filter(p => p.dpe_complete === true).length / dataProtectionLearners) * 100) : 0,
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'percentage' as const
    },
    {
      id: 'episode_completion',
      title: 'Staff who completed learn',
      icon: <TrendingUp size={24} className="h-6 w-6" />,
      getValue: () => profiles.filter(p => p.learn_complete === true).length,
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count' as const
    },
    {
      id: 'data_protection_completion',
      title: 'Staff who completed data protection',
      icon: <TrendingUp size={24} className="h-6 w-6" />,
      getValue: () => profiles.filter(p => p.dpe_complete === true).length,
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count' as const
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
      getValue: () => hardwareInventory.filter(hw => 
        hw.created_at && new Date(hw.created_at) >= thirtyDaysAgo
      ).length,
      drillDownLevels: ['Organization', 'Location', 'Department'],
      type: 'count' as const
    },
    {
      id: 'sw_onboarded_30d',
      title: 'SW Onboarded (30 days)',
      icon: <TrendingUp className="h-6 w-6" />,
      getValue: () => softwareInventory.filter(sw => 
        sw.created_at && new Date(sw.created_at) >= thirtyDaysAgo
      ).length,
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
      getValue: () => Math.round(configPercentage),
      drillDownLevels: ['Organization %', 'Department %', 'Endpoint Details'],
      type: 'percentage' as const
    },
    {
      id: 'hw_patched_updated',
      title: '% HW Patched & Updated',
      icon: <TrendingUp className="h-6 w-6" />,
      getValue: () => Math.round(patchPercentage),
      drillDownLevels: ['Organization %', 'Department %', 'Endpoint Details'],
      type: 'percentage' as const
    },
    {
      id: 'compliance_percentage',
      title: 'Compliance %',
      icon: <Shield className="h-6 w-6" />,
      getValue: () => Math.round(compliancePercentage),
      drillDownLevels: ['Organization %', 'Department %', 'Compliance Details'],
      type: 'percentage' as const
    },
    {
      id: 'account_inventory_overdue',
      title: 'Account Inventory Overdue Reviews',
      icon: <Users className="h-6 w-6" />,
      getValue: () => accountInventoryOverdue,
      drillDownLevels: ['Organization', 'Department', 'Account Details'],
      type: 'count' as const
    },
    {
      id: 'hardware_inventory_overdue',
      title: 'Hardware Inventory Overdue Reviews',
      icon: <Shield className="h-6 w-6" />,
      getValue: () => hardwareInventoryOverdue,
      drillDownLevels: ['Organization', 'Department', 'Hardware Details'],
      type: 'count' as const
    }
  ];

  // Readiness metrics
  const readinessMetrics: any[] = [
    // Phishing Metrics
    {
      id: 'phishing_emails_sent',
      title: 'Phishing Emails Sent',
      icon: <Mail className="h-6 w-6" />,
      getValue: () => phishingData?.filter(p => p.resource === 'sent').length || 0,
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count' as const
    },
    {
      id: 'staff_phished',
      title: 'Staff Phished',
      icon: <Mail className="h-6 w-6" />,
      getValue: () => {
        const uniquePhishedUsers = new Set(
          phishingData?.filter(p => p.resource === 'click_link').map(p => p.user_id) || []
        );
        return uniquePhishedUsers.size;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count' as const
    },
    {
      id: 'incident_response_team',
      title: 'Data Breach Incident Management Team Identified',
      icon: <Shield className="h-6 w-6" />,
      getValue: () => {
        // Use DBIMT score calculation: roles with members / 7 * 100
        // Team is "Identified" only if all 7 roles have members (score === 100)
        const dbimtScore = breachTeamData?.dbimtScore || 0;
        return dbimtScore === 100 ? 'Identified' : 'Not Identified';
      },
      drillDownLevels: ['Status'],
      type: 'binary' as const
    },
    // Document Reading Requirements
    {
      id: 'staff_required_irp',
      title: 'Staff Required to Read Incident Response Plan',
      icon: <FileText className="h-6 w-6" />,
      getValue: () => {
        const irpDoc = documents.find(d => 
          d.title?.toLowerCase().includes('incident response') ||
          d.category?.toLowerCase().includes('incident')
        );
        if (!irpDoc) return 0;
        return documentAssignments.filter(a => a.document_id === irpDoc.document_id).length;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count' as const
    },
    {
      id: 'staff_required_isp',
      title: 'Staff Required to Read Information Security Policy',
      icon: <FileText className="h-6 w-6" />,
      getValue: () => {
        const ispDoc = documents.find(d => 
          d.title?.toLowerCase().includes('information security') ||
          d.title?.toLowerCase().includes('security policy')
        );
        if (!ispDoc) return 0;
        return documentAssignments.filter(a => a.document_id === ispDoc.document_id).length;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count' as const
    },
    {
      id: 'staff_required_dpp',
      title: 'Staff Required to Read Data Protection Policy',
      icon: <FileText className="h-6 w-6" />,
      getValue: () => {
        const dppDoc = documents.find(d => 
          d.title?.toLowerCase().includes('data protection') ||
          d.title?.toLowerCase().includes('privacy policy')
        );
        if (!dppDoc) return 0;
        return documentAssignments.filter(a => a.document_id === dppDoc.document_id).length;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count' as const
    },
    {
      id: 'staff_required_chh',
      title: 'Staff Required to Read Cyber Hygiene Handbook - All Staff',
      icon: <FileText className="h-6 w-6" />,
      getValue: () => {
        const chhDoc = documents.find(d => 
          d.title === 'Cyber Hygiene Handbook - All Staff'
        );
        if (!chhDoc) return 0;
        return documentAssignments.filter(a => a.document_id === chhDoc.document_id).length;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count' as const
    },
    // Document Reading Completion
    {
      id: 'staff_read_irp',
      title: 'Staff Read Incident Response Plan',
      icon: <CheckCircle className="h-6 w-6" />,
      getValue: () => {
        const irpDoc = documents.find(d => 
          d.title?.toLowerCase().includes('incident response') ||
          d.category?.toLowerCase().includes('incident')
        );
        if (!irpDoc) return 0;
        return documentAssignments.filter(a => 
          a.document_id === irpDoc.document_id && a.status === 'Completed'
        ).length;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count' as const
    },
    {
      id: 'staff_read_isp',
      title: 'Staff Read Information Security Policy',
      icon: <CheckCircle className="h-6 w-6" />,
      getValue: () => {
        const ispDoc = documents.find(d => 
          d.title?.toLowerCase().includes('information security') ||
          d.title?.toLowerCase().includes('security policy')
        );
        if (!ispDoc) return 0;
        return documentAssignments.filter(a => 
          a.document_id === ispDoc.document_id && a.status === 'Completed'
        ).length;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count' as const
    },
    {
      id: 'staff_read_dpp',
      title: 'Staff Read Data Protection Policy',
      icon: <CheckCircle className="h-6 w-6" />,
      getValue: () => {
        const dppDoc = documents.find(d => 
          d.title?.toLowerCase().includes('data protection') ||
          d.title?.toLowerCase().includes('privacy policy')
        );
        if (!dppDoc) return 0;
        return documentAssignments.filter(a => 
          a.document_id === dppDoc.document_id && a.status === 'Completed'
        ).length;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count' as const
    },
    {
      id: 'staff_read_chh',
      title: 'Staff Read Cyber Hygiene Handbook - All Staff',
      icon: <CheckCircle className="h-6 w-6" />,
      getValue: () => {
        const chhDoc = documents.find(d => 
          d.title === 'Cyber Hygiene Handbook - All Staff'
        );
        if (!chhDoc) return 0;
        return documentAssignments.filter(a => 
          a.document_id === chhDoc.document_id && a.status === 'Completed'
        ).length;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count' as const
    }
  ];

  // Performance metrics for readiness
  const readinessPerformanceMetrics: any[] = [
    {
      id: 'staff_failed_phishing',
      title: 'Staff Failed Phishing Simulation',
      icon: <TrendingUp className="h-6 w-6" />,
      getValue: () => {
        const totalSent = phishingData?.filter(p => p.resource === 'sent').length || 0;
        const totalClicked = phishingData?.filter(p => p.resource === 'click_link').length || 0;
        return totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'percentage' as const
    },
    {
      id: 'irp_read_completion',
      title: 'Incident Response Plan Read',
      icon: <FileText className="h-6 w-6" />,
      getValue: () => {
        const irpDoc = documents.find(d => 
          d.title?.toLowerCase().includes('incident response') ||
          d.category?.toLowerCase().includes('incident')
        );
        if (!irpDoc) return 0;
        const totalAssigned = documentAssignments.filter(a => a.document_id === irpDoc.document_id).length;
        const totalCompleted = documentAssignments.filter(a => 
          a.document_id === irpDoc.document_id && a.status === 'Completed'
        ).length;
        return totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'percentage' as const
    },
    {
      id: 'isp_read_completion',
      title: 'Information Security Policy Read',
      icon: <Shield className="h-6 w-6" />,
      getValue: () => {
        const ispDoc = documents.find(d => 
          d.title?.toLowerCase().includes('information security') ||
          d.title?.toLowerCase().includes('security policy')
        );
        if (!ispDoc) return 0;
        const totalAssigned = documentAssignments.filter(a => a.document_id === ispDoc.document_id).length;
        const totalCompleted = documentAssignments.filter(a => 
          a.document_id === ispDoc.document_id && a.status === 'Completed'
        ).length;
        return totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'percentage' as const
    },
    {
      id: 'dpp_read_completion',
      title: 'Data Protection Policy Read',
      icon: <FileText className="h-6 w-6" />,
      getValue: () => {
        const dppDoc = documents.find(d => 
          d.title?.toLowerCase().includes('data protection') ||
          d.title?.toLowerCase().includes('privacy policy')
        );
        if (!dppDoc) return 0;
        const totalAssigned = documentAssignments.filter(a => a.document_id === dppDoc.document_id).length;
        const totalCompleted = documentAssignments.filter(a => 
          a.document_id === dppDoc.document_id && a.status === 'Completed'
        ).length;
        return totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'percentage' as const
    },
    {
      id: 'chh_read_completion',
      title: 'Cyber Hygiene Handbook Read - All Staff',
      icon: <FileText className="h-6 w-6" />,
      getValue: () => {
        const chhDoc = documents.find(d => 
          d.title === 'Cyber Hygiene Handbook - All Staff'
        );
        if (!chhDoc) return 0;
        const totalAssigned = documentAssignments.filter(a => a.document_id === chhDoc.document_id).length;
        const totalCompleted = documentAssignments.filter(a => 
          a.document_id === chhDoc.document_id && a.status === 'Completed'
        ).length;
        return totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'percentage' as const
    }
  ];

  const handleMetricClick = (metricId: string) => {
    // If clicking on DBIMT metric, navigate to breach management page
    if (metricId === 'incident_response_team') {
      navigate('/', { state: { activeTab: 'breach-management' } });
      return;
    }
    
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

  const formatValue = (value: number | string, type: string) => {
    if (type === 'binary') {
      return value === 'Identified' ? 'Green' : 'Red';
    }
    if (type === 'percentage') return `${value}%`;
    if (type === 'score') return `${value}/100`;
    return value.toString();
  };

  const getColorClass = (type: string, value: number | string) => {
    if (type === 'binary') {
      return value === 'Identified' ? 'text-green-600' : 'text-red-600';
    }
    if (type === 'percentage' || type === 'score') {
      const num = typeof value === 'string' ? parseInt(value) : value;
      if (num >= 80) return 'text-green-600';
      if (num >= 60) return 'text-yellow-600';
      return 'text-red-600';
    }
    return 'text-primary';
  };

  const getBinaryIcon = (value: string) => {
    return value === 'Identified' ? 
      <CheckCircle className="h-6 w-6 text-green-600" /> : 
      <AlertTriangle className="h-6 w-6 text-red-600" />;
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
    const metric = [...educationMetrics, ...protectionMetrics, ...readinessMetrics, ...readinessPerformanceMetrics].find(m => m.id === selectedMetric);
    if (!metric) return null;

    return (
      <div className="w-full space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedMetric(null)} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 rotate-180" />
            
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
          phishingData={phishingData}
          documentAssignments={documentAssignments}
          documents={documents}
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
          {/* Cybersecurity Behaviour Assessment Insights - HIDDEN
          
          Note: The following queries are also commented out and related to this section:
          - priorityData query (lines 153-178)
          - keyInsightsData query (lines 180-191)
          - detailedInsightsData query (lines 193-205)
          
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Cybersecurity Behaviour Assessment Insights</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        formatter={(value: any) => [`${Number(value).toFixed(1)}`, 'Score']}
                        labelFormatter={(label: string) => `Domain: ${label}`}
                      />
                      <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        {cybersecurityAssessmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="#3b82f6" />
                        ))}
                        <LabelList 
                          dataKey="score" 
                          position="top" 
                          style={{ fontSize: '10px', fill: '#374151' }}
                          formatter={(value: any) => Number(value).toFixed(1)}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

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

          <div className="space-y-6">
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
          */}

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
        
        <TabsContent value="readiness" className="space-y-8">
          <div>
          <h3 className="text-lg font-semibold text-foreground">Count Metrics</h3>
          {/* First row: DBIMT, Phishing Emails Sent, Staff Phished */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-6">
              {[
                readinessMetrics.find(m => m.id === 'incident_response_team'),
                readinessMetrics.find(m => m.id === 'phishing_emails_sent'),
                readinessMetrics.find(m => m.id === 'staff_phished')
              ].filter(Boolean).map((metric) => {
                const value = metric.getValue();
                return (
                  <Card key={metric.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleMetricClick(metric.id)}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                      {metric.type === 'binary' ? getBinaryIcon(value as string) : metric.icon}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`text-2xl font-bold ${getColorClass(metric.type, value)}`}>{formatValue(value, metric.type)}</div>
                          <Badge variant="secondary" className="text-xs mt-1">{metric.drillDownLevels.length} levels</Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {/* Second row: Staff Required to Read ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {[
                readinessMetrics.find(m => m.id === 'staff_required_irp'),
                readinessMetrics.find(m => m.id === 'staff_required_isp'),
                readinessMetrics.find(m => m.id === 'staff_required_dpp'),
                readinessMetrics.find(m => m.id === 'staff_required_chh'),
              ].filter(Boolean).map((metric) => {
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
                          <div className={`text-2xl font-bold ${getColorClass(metric.type, value)}`}>{formatValue(value, metric.type)}</div>
                          <Badge variant="secondary" className="text-xs mt-1">{metric.drillDownLevels.length} levels</Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {/* Third row: Staff Read ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                readinessMetrics.find(m => m.id === 'staff_read_irp'),
                readinessMetrics.find(m => m.id === 'staff_read_isp'),
                readinessMetrics.find(m => m.id === 'staff_read_dpp'),
                readinessMetrics.find(m => m.id === 'staff_read_chh'),
              ].filter(Boolean).map((metric) => {
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
                          <div className={`text-2xl font-bold ${getColorClass(metric.type, value)}`}>{formatValue(value, metric.type)}</div>
                          <Badge variant="secondary" className="text-xs mt-1">{metric.drillDownLevels.length} levels</Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div>
          <h3 className="text-lg font-semibold text-foreground">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {readinessPerformanceMetrics.map((metric) => {
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
                          <div className={`text-2xl font-bold ${getColorClass(metric.type, value)}`}>{formatValue(value, metric.type)}</div>
                          <Badge variant="secondary" className="text-xs mt-1">{metric.drillDownLevels.length} levels</Badge>
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
      </Tabs>
    </div>
  );
};

export default Dashboard;
