import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, MapPin, Building, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { DrillDownLevel } from './EnhancedMetrics';

interface MetricDefinition {
  id: string;
  title: string;
  icon: React.ReactNode;
  getValue: (profiles: any[], phishingData?: any[], documentData?: any[]) => number | string;
  drillDownLevels: string[];
  type: 'count' | 'percentage' | 'score' | 'binary';
}

interface MetricDrillDownProps {
  metric: MetricDefinition;
  profiles: any[];
  drillDownPath: DrillDownLevel[];
  onDrillDown: (level: number, data: any[], title: string, type: 'org' | 'location' | 'department' | 'staff', value?: number) => void;
  locations: string[];
  departments: string[];
  userDeptMap: Map<string, any[]>;
  hardwareInventory: any[];
  softwareInventory: any[];
  softwareAssignments: any[];
  physicalLocationAccess: any[];
  phishingData?: any[];
  documentAssignments?: any[];
  documents?: any[];
  cyberLearnersSet?: Set<string>;
  dpeLearnersSet?: Set<string>;
  completedLearnSet?: Set<string>;
  completedPDPASet?: Set<string>;
}

const MetricDrillDown: React.FC<MetricDrillDownProps> = ({
  metric,
  profiles,
  drillDownPath,
  onDrillDown,
  locations,
  departments,
  userDeptMap,
  hardwareInventory,
  softwareInventory,
  softwareAssignments,
  physicalLocationAccess,
  phishingData = [],
  documentAssignments = [],
  documents = [],
  cyberLearnersSet = new Set(),
  dpeLearnersSet = new Set(),
  completedLearnSet = new Set(),
  completedPDPASet = new Set(),
}) => {
  const currentLevel = drillDownPath[drillDownPath.length - 1];
  const canDrillDown = currentLevel.level < metric.drillDownLevels.length;

  const [departmentData, setDepartmentData] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const fetchDepartmentData = async () => {
      try {
        const { data } = await supabase
          .from('user_departments')
          .select(`
            user_id,
            is_primary,
            departments (
              name
            )
          `)
          .eq('is_primary', true);
        
        const deptMap = new Map();
        data?.forEach(item => {
          deptMap.set(item.user_id, item.departments?.name || 'No Department');
        });
        setDepartmentData(deptMap);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };
    
    fetchDepartmentData();
  }, []);

  // Get relevant user IDs based on the metric
  const getRelevantUserIds = (): string[] => {
    switch (metric.id) {
      case 'total_staff':
        return profiles.map(p => p.id);
      
      case 'cyber_learners':
        return profiles.filter(p => cyberLearnersSet.has(p.id)).map(p => p.id);
      
      case 'data_protection_learners':
        return profiles.filter(p => dpeLearnersSet.has(p.id)).map(p => p.id);
      
      case 'english_learners':
        return profiles.filter(p => p.language === 'English' || p.language === '').map(p => p.id);
      
      case 'mandarin_learners':
        return profiles.filter(p => p.language === 'Mandarin').map(p => p.id);
      
      case 'staff_enrolled_learn':
        return profiles.filter(p => cyberLearnersSet.has(p.id)).map(p => p.id);
      
      case 'cyber_aware_percentage':
        // For cyber awareness, show ALL cyber learners (both completed and not completed)
        return profiles.filter(p => cyberLearnersSet.has(p.id)).map(p => p.id);
      
      case 'data_protection_aware_percentage':
        return profiles.filter(p => dpeLearnersSet.has(p.id)).map(p => p.id);
      
      case 'episode_completion':
        return profiles.filter(p => completedLearnSet.has(p.id)).map(p => p.id);
      
      case 'track_completion':
        return profiles.filter(p => cyberLearnersSet.has(p.id)).map(p => p.id);
      
      // Protection metrics
      case 'total_endpoints':
      case 'total_software':
      case 'total_physical_locations':
      case 'hw_onboarded_30d':
      case 'sw_onboarded_30d':
        // For these metrics, all users are relevant since they're inventory-based
        return profiles.map(p => p.id);
      
      case 'hardware_inventory_overdue':
        // This would need hardware data to determine relevance
        return profiles.map(p => p.id);
      
      // Readiness metrics - Phishing
      case 'staff_phished':
        return phishingData
          .filter(p => p.resource === 'click_link')
          .map(p => p.user_id);
      
      case 'phishing_emails_sent':
        return phishingData
          .filter(p => p.resource === 'sent')
          .map(p => p.user_id);
      
      case 'staff_failed_phishing':
        return phishingData
          .filter(p => p.resource === 'click_link')
          .map(p => p.user_id);
      
      // Readiness metrics - Documents
      default:
        // For document-related metrics
        if (metric.id.includes('_completion') || metric.id.includes('required_') || 
            metric.id.includes('staff_read_') || metric.id.includes('staff_required_')) {
          
          // Find the specific document for this metric
          let targetDocument = null;
          
          if (metric.id.includes('chh') || 
              metric.title.toLowerCase().includes('cyber hygiene handbook - all staff')) {
            targetDocument = documents.find(d => 
              d.title === 'Cyber Hygiene Handbook - All Staff'
            );
          } else if (metric.id.includes('irp') || metric.title.toLowerCase().includes('incident')) {
            targetDocument = documents.find(d => 
              d.title?.toLowerCase().includes('incident response') ||
              d.category?.toLowerCase().includes('incident')
            );
          } else if (metric.id.includes('isp') || metric.title.toLowerCase().includes('security')) {
            targetDocument = documents.find(d => 
              d.title?.toLowerCase().includes('information security') ||
              d.title?.toLowerCase().includes('security policy')
            );
          } else if (metric.id.includes('dpp') || metric.title.toLowerCase().includes('privacy')) {
            targetDocument = documents.find(d => 
              d.title?.toLowerCase().includes('data protection') ||
              d.title?.toLowerCase().includes('privacy policy')
            );
          }
          
          if (targetDocument) {
            // For "Staff Read" metrics, only show users who have completed reading
            // For "Staff Required to Read" metrics, show all assigned users
            const shouldFilterCompleted = metric.id.includes('staff_read_') || 
                                         metric.id.includes('_completion') ||
                                         metric.title.toLowerCase().includes('staff read');
            
            const relevantAssignments = documentAssignments.filter(a => 
              a.document_id === targetDocument.document_id &&
              (shouldFilterCompleted ? a.status === 'Completed' : true)
            );
            
            return relevantAssignments.map(a => a.user_id);
          }
        }
        return profiles.map(p => p.id);
    }
  };

  // Calculate metric value for specific users (handles education, protection, and readiness metrics)
  const calculateMetricValueForUsers = (userIds: string[], profiles: any[]): number => {
    const relevantProfiles = profiles.filter(p => userIds.includes(p.id));
    
    // For count metrics, just return the count of relevant users
    if (metric.type === 'count') {
      return relevantProfiles.length;
    }
    
    if (metric.type === 'percentage') {
      if (metric.id === 'staff_enrolled_learn') {
        const totalStaff = profiles.length;
        const enrolledStaff = relevantProfiles.length;
        return totalStaff > 0 ? Math.round((enrolledStaff / totalStaff) * 100) : 0;
      } else if (metric.id === 'cyber_aware_percentage') {
        const enrolledStaff = profiles.filter(p => cyberLearnersSet.has(p.id)).length;
        const completedStaff = relevantProfiles.length;
        return enrolledStaff > 0 ? Math.round((completedStaff / enrolledStaff) * 100) : 0;
      } else if (metric.id === 'data_protection_aware_percentage') {
        const enrolledStaff = profiles.filter(p => dpeLearnersSet.has(p.id)).length;
        const completedStaff = relevantProfiles.length;
        return enrolledStaff > 0 ? Math.round((completedStaff / enrolledStaff) * 100) : 0;
      } else if (metric.id === 'track_completion') {
        const enrolledStaff = profiles.filter(p => cyberLearnersSet.has(p.id)).length;
        const completedStaff = relevantProfiles.length;
        return enrolledStaff > 0 ? Math.round((completedStaff / enrolledStaff) * 100) : 0;
      }
    }
    
    return relevantProfiles.length;
  };

  const getFilteredProfiles = (filterType: string, filterValue: string) => {
    switch (filterType) {
      case 'location':
        return profiles.filter(p => p.location === filterValue);
      case 'department':
        return profiles.filter(p => p.primary_department === filterValue);
      default:
        return profiles;
    }
  };

  const calculateMetricValue = (profileSubset: any[]) => {
    switch (metric.id) {
      case 'total_staff':
        return profileSubset.length;
      case 'cyber_learners':
        return profileSubset.filter(p => cyberLearnersSet.has(p.id)).length;
      case 'data_protection_learners':
        return profileSubset.filter(p => dpeLearnersSet.has(p.id)).length;
      case 'english_learners':
        return profileSubset.filter(p => p.language === 'English' || p.language === '').length;
      case 'mandarin_learners':
        return profileSubset.filter(p => p.language === 'Mandarin').length;
      case 'enrolled_percentage': {
        const total = profileSubset.length;
        const enrolled = profileSubset.filter(p => cyberLearnersSet.has(p.id)).length;
        return total > 0 ? Math.round((enrolled / total) * 100) : 0;
      }
      case 'cyber_aware_percentage': {
        const cyberInSubset = profileSubset.filter(p => cyberLearnersSet.has(p.id)).length;
        const completedInSubset = profileSubset.filter(p => completedLearnSet.has(p.id)).length;
        return cyberInSubset > 0 ? Math.round((completedInSubset / cyberInSubset) * 100) : 0;
      }
      case 'data_protection_aware_percentage': {
        const dpeInSubset = profileSubset.filter(p => dpeLearnersSet.has(p.id)).length;
        const dpeCompletedInSubset = profileSubset.filter(p => completedPDPASet.has(p.id)).length;
        return dpeInSubset > 0 ? Math.round((dpeCompletedInSubset / dpeInSubset) * 100) : 0;
      }
      case 'episode_completion':
        return profileSubset.filter(p => completedLearnSet.has(p.id)).length;
      case 'track_completion': {
        const trackEnrolled = profileSubset.filter(p => cyberLearnersSet.has(p.id)).length;
        const trackCompleted = profileSubset.filter(p => completedLearnSet.has(p.id)).length;
        return trackEnrolled > 0 ? Math.round((trackCompleted / trackEnrolled) * 100) : 0;
      }
      default:
        return 0;
    }
  };

  const formatValue = (value: number | string, type: string) => {
    if (type === 'percentage') return `${value}%`;
    if (type === 'score') return `${value}/100`;
    return value.toString();
  };

  const getColorClass = (type: string, value: number | string) => {
    if (type === 'percentage' || type === 'score') {
      const num = typeof value === 'string' ? parseInt(value) : value;
      if (num >= 80) return 'text-green-600';
      if (num >= 60) return 'text-yellow-600';
      return 'text-red-600';
    }
    return 'text-primary';
  };

  const getStaffStatusBadgeProps = (profile: any, metricId: string): { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string } => {
    const statusText = getStaffStatusText(profile, metricId);
    let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
    let className = '';

    switch (statusText) {
      case 'Completed':
        variant = 'default';
        className = 'bg-green-100 text-green-700 border-green-200';
        break;
      
      case 'Enrolled':
        variant = 'default';
        className = 'bg-green-100 text-green-700 border-green-200';
        break;
      
      case 'Not Enrolled':
        variant = 'destructive';
        className = 'bg-red-100 text-red-700 border-red-200';
        break;
      
      case 'English':
      case 'Mandarin':
        variant = 'outline';
        break;
        
      case 'No Devices':
      case 'No Software':
      case 'No Access':
      case 'None Recent':
        variant = 'destructive';
        className = 'bg-red-100 text-red-700 border-red-200';
        break;
        
      default:
        if (statusText.includes('Device') || statusText.includes('App') || statusText.includes('Recent') || statusText.includes('Location')) {
          variant = 'secondary';
          className = 'bg-blue-100 text-blue-700 border-blue-200';
        } else if (statusText !== '' && !statusText.includes('No')) {
          variant = 'default';
          className = 'bg-green-100 text-green-700 border-green-200';
        } else {
          variant = 'secondary';
          className = 'bg-gray-100 text-gray-600 border-gray-200';
        }
        break;
    }

    return { text: statusText, variant, className };
  };

  const getStaffStatusText = (profile: any, metricId: string): string => {

    switch (metricId) {
      // Completion-based metrics
      case 'cyber_aware_percentage':
      case 'episode_completion':
      case 'track_completion':
        return completedLearnSet.has(profile.id) ? 'Completed' : 'Enrolled';

      case 'data_protection_aware_percentage':
        return completedPDPASet.has(profile.id) ? 'Completed' : 'Enrolled';

      // Enrollment/category-based metrics - show completion status when available
      case 'total_staff':
        return cyberLearnersSet.has(profile.id) ? 'Enrolled' : 'Not Enrolled';
      
      case 'cyber_learners':
      case 'staff_enrolled_learn':
        return completedLearnSet.has(profile.id) ? 'Completed' : 'Enrolled';

      case 'data_protection_learners':
        return completedPDPASet.has(profile.id) ? 'Completed' : 'Enrolled';

      case 'english_learners':
        return 'English';

      case 'mandarin_learners':
        return 'Mandarin';
        
      // Protection metrics - show asset counts
      case 'total_endpoints':
        // Count user's hardware devices (match by asset_owner field with user's name)
        const userHardware = hardwareInventory.filter(hw => 
          hw.asset_owner === profile.full_name || hw.asset_owner === profile.email
        );
        const deviceCount = userHardware.length;
        if (deviceCount === 0) return 'No Devices';
        if (deviceCount === 1) return '1 Device';
        return `${deviceCount} Devices`;
        
      case 'total_software':
        // Count user's software applications from the software assignment table
        const userSoftwareAssignments = softwareAssignments.filter(sw => sw.user_id === profile.id);
        const softwareCount = userSoftwareAssignments.length;
        if (softwareCount === 0) return 'No Software';
        if (softwareCount === 1) return '1 App';
        return `${softwareCount} Apps`;
        
      case 'total_physical_locations':
        // Count user's total accessible locations: primary + access locations
        const userAccessLocations = physicalLocationAccess.filter(access => 
          access.user_id === profile.id
        );
        
        // Count unique locations (primary + additional access)
        const accessibleLocations = new Set();
        
        // Add primary location if it exists
        if (profile.location) {
          accessibleLocations.add(profile.location);
        }
        
        // Add locations from physical_location_access
        userAccessLocations.forEach(access => {
          const locationName = access.locations?.name || access.location;
          if (locationName) {
            accessibleLocations.add(locationName);
          }
        });
        
        const locationCount = accessibleLocations.size;
        if (locationCount === 0) return 'No Access';
        if (locationCount === 1) return '1 Location';
        return `${locationCount} Locations`;
        
      case 'hw_onboarded_30d':
      case 'sw_onboarded_30d':
        // For onboarding metrics, show "Recent" or "None" based on 30-day activity
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        if (metricId === 'hw_onboarded_30d') {
          const recentHardware = hardwareInventory.filter(hw => 
            (hw.asset_owner === profile.full_name || hw.asset_owner === profile.email) && 
            hw.created_at && 
            new Date(hw.created_at) >= thirtyDaysAgo
          );
          return recentHardware.length > 0 ? `${recentHardware.length} Recent` : 'None Recent';
        } else {
          const recentSoftware = softwareAssignments.filter(sw => 
            sw.user_id === profile.id && 
            sw.created_at && 
            new Date(sw.created_at) >= thirtyDaysAgo
          );
          return recentSoftware.length > 0 ? `${recentSoftware.length} Recent` : 'None Recent';
        }
        
      default:
        return '';
    }
  };

  const renderBreadcrumb = () => (
    <div className="flex items-center gap-1 text-sm flex-wrap mb-6">
      {drillDownPath.map((level, index) => (
        <div key={index} className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDrillDown(level.level, level.data, level.title, level.type)}
            className={index === drillDownPath.length - 1 ? 'font-semibold text-foreground' : 'text-learning-primary'}
          >
            {level.title}
          </Button>
          {index < drillDownPath.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      ))}
    </div>
  );

  const renderLocationDrillDown = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {locations.map(location => {
        // Filter profiles for this specific location from all profiles
        const locationProfiles = profiles.filter(p => p.location === location);
        const relevantUserIds = getRelevantUserIds();
        const locationRelevantProfiles = locationProfiles.filter(p => relevantUserIds.includes(p.id));
        
        // Calculate the correct value based on metric type
        let value;
        if (metric.type === 'percentage') {
          // For percentage metrics, calculate the percentage within this location
          if (metric.id === 'staff_enrolled_learn') {
            const totalStaffInLocation = locationProfiles.length;
            const enrolledStaffInLocation = locationRelevantProfiles.length;
            value = totalStaffInLocation > 0 ? Math.round((enrolledStaffInLocation / totalStaffInLocation) * 100) : 0;
          } else {
            // Use the existing calculation logic for other percentage metrics
            value = calculateMetricValue(locationProfiles);
          }
        } else {
          // For count metrics, just show the count
          value = locationRelevantProfiles.length;
        }
        
        // Only show locations that have relevant users
        if (locationRelevantProfiles.length === 0) return null;
        
        return (
          <Card key={location} className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onDrillDown(currentLevel.level + 1, locationProfiles, location, 'location', value)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{location || 'Unknown Location'}</div>
                    <div className="text-sm text-muted-foreground">{locationRelevantProfiles.length} relevant staff</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`text-xl font-bold ${getColorClass(metric.type, value)}`}>
                    {formatValue(value, metric.type)}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderDepartmentDrillDown = () => {
    // Get the current filtered profiles (from location or organization level)
    let filteredProfiles = currentLevel.data;
    
    // Get relevant user IDs for the current metric
    const relevantUserIds = getRelevantUserIds();
    
    // Group ALL users in current location by their primary department
    const departmentGroups = new Map();
    const relevantDepartmentGroups = new Map();
    


    // First, group all users in the current location by department
    filteredProfiles.forEach(profile => {
      const deptName = departmentData.get(profile.id) || profile.department || 'No Department';
      
      if (!departmentGroups.has(deptName)) {
        departmentGroups.set(deptName, []);
      }
      departmentGroups.get(deptName).push(profile);
    });
    
    // Then, group only relevant users by department
    const uniqueRelevantUserIds = [...new Set(relevantUserIds)];
    
    uniqueRelevantUserIds.forEach(userId => {
      const userProfile = filteredProfiles.find(p => p.id === userId);
      if (userProfile) {
        const deptName = departmentData.get(userId) || userProfile.department || 'No Department';
        if (!relevantDepartmentGroups.has(deptName)) {
          relevantDepartmentGroups.set(deptName, []);
        }
        relevantDepartmentGroups.get(deptName).push(userProfile);
      }
    });
    


    // Show departments that have relevant users, including those without departments
    const availableDepartments = Array.from(relevantDepartmentGroups.keys());
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableDepartments.map(department => {
          const allProfilesInDept = departmentGroups.get(department) || [];
          const relevantProfilesInDept = relevantDepartmentGroups.get(department) || [];
          
          // Calculate percentage for this department if it's a percentage metric
          let departmentValue;
          if (metric.type === 'percentage') {
            if (metric.id === 'staff_enrolled_learn') {
              const totalStaffInDept = allProfilesInDept.length;
              const enrolledStaffInDept = relevantProfilesInDept.length;
              departmentValue = totalStaffInDept > 0 ? Math.round((enrolledStaffInDept / totalStaffInDept) * 100) : 0;
            } else {
              departmentValue = calculateMetricValue(allProfilesInDept);
            }
          } else {
            departmentValue = relevantProfilesInDept.length;
          }
          
          return (
            <Card key={department} className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => onDrillDown(currentLevel.level + 1, allProfilesInDept, department, 'department', departmentValue)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-secondary" />
                    <div>
                      <div className="font-medium">{department}</div>
                      <div className="text-sm text-muted-foreground">{relevantProfilesInDept.length} of {allProfilesInDept.length} staff</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-xl font-bold ${getColorClass(metric.type, departmentValue)}`}>
                      {formatValue(departmentValue, metric.type)}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderStaffList = () => {
    // For staff list, show all the profiles passed down from the previous level
    // These should already be filtered to relevant users
    const allProfilesInLevel = currentLevel.data;
    const relevantUserIds = getRelevantUserIds();
    const filteredProfiles = allProfilesInLevel.filter(p => relevantUserIds.includes(p.id));
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {filteredProfiles.map((profile: any) => {
            const badgeProps = getStaffStatusBadgeProps(profile, metric.id);
            return (
              <Card key={profile.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{profile.full_name || 'Unknown Name'}</div>
                        <div className="text-sm text-muted-foreground">
                          {profile.location} • {departmentData.get(profile.id) || 'No Department'} • {profile.primary_role || 'No Role'}
                        </div>
                      </div>
                    </div>
                    <Badge variant={badgeProps.variant} className={badgeProps.className}>{badgeProps.text}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const levelName = metric.drillDownLevels[currentLevel.level - 1];

    if (levelName?.toLowerCase().includes('organization')) {
      const overallValue = metric.getValue(profiles);
      const relevantUserIds = getRelevantUserIds();
      const relevantProfiles = profiles.filter(p => relevantUserIds.includes(p.id));
      const locationCount = [...new Set(relevantProfiles.map(p => p.location).filter(Boolean))].length;
      const deptCount = [...new Set(relevantProfiles.map(p => departmentData.get(p.id)).filter(Boolean))].length;

      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {metric.icon}
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${getColorClass(metric.type, overallValue)}`}>
                {formatValue(overallValue, metric.type)}
              </div>
              <p className="text-muted-foreground mt-2">
                Across {profiles.length} staff member{profiles.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onDrillDown(currentLevel.level + 1, profiles, 'By Location', 'location')}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="font-medium">View by Location</span>
                </div>
                <div className="text-2xl font-bold">{locationCount}</div>
                <p className="text-sm text-muted-foreground">location{locationCount !== 1 ? 's' : ''} with data</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onDrillDown(currentLevel.level + 1, profiles, 'By Department', 'department')}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Building className="h-5 w-5 text-secondary" />
                  <span className="font-medium">View by Department</span>
                </div>
                <div className="text-2xl font-bold">{deptCount}</div>
                <p className="text-sm text-muted-foreground">department{deptCount !== 1 ? 's' : ''} with data</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onDrillDown(currentLevel.level + 1, relevantProfiles, 'Staff List', 'staff')}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-5 w-5 text-accent" />
                  <span className="font-medium">View Staff List</span>
                </div>
                <div className="text-2xl font-bold">{relevantProfiles.length}</div>
                <p className="text-sm text-muted-foreground">staff members</p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    if (levelName?.toLowerCase().includes('location')) {
      const locationValue = currentLevel.value ?? calculateMetricValue(currentLevel.data);
      return (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{currentLevel.title}</div>
                    <div className="text-sm text-muted-foreground">Total for this location</div>
                  </div>
                </div>
                <div className={`text-3xl font-bold ${getColorClass(metric.type, locationValue)}`}>
                  {formatValue(locationValue, metric.type)}
                </div>
              </div>
            </CardContent>
          </Card>
          <h2 className="text-lg font-semibold">Departments</h2>
          {renderDepartmentDrillDown()}
        </div>
      );
    }

    if (levelName?.toLowerCase().includes('department')) {
      const departmentValue = currentLevel.value ?? calculateMetricValue(currentLevel.data);
      return (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-secondary" />
                  <div>
                    <div className="font-medium">{currentLevel.title}</div>
                    <div className="text-sm text-muted-foreground">Total for this department</div>
                  </div>
                </div>
                <div className={`text-3xl font-bold ${getColorClass(metric.type, departmentValue)}`}>
                  {formatValue(departmentValue, metric.type)}
                </div>
              </div>
            </CardContent>
          </Card>
          <h2 className="text-lg font-semibold">Staff</h2>
          {renderStaffList()}
        </div>
      );
    }
    
    return renderStaffList();
  };

  return (
    <div className="space-y-6">
      {renderBreadcrumb()}
      {renderContent()}
    </div>
  );
};

export default MetricDrillDown;