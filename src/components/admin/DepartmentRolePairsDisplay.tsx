import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star } from 'lucide-react';

interface DepartmentRolePairsDisplayProps {
  userId: string;
}

interface DepartmentRolePair {
  id: string;
  department?: {
    name: string;
    isPrimary: boolean;
  };
  role?: {
    name: string;
    isPrimary: boolean;
  };
}

export const DepartmentRolePairsDisplay: React.FC<DepartmentRolePairsDisplayProps> = ({ userId }) => {
  // Fetch user departments with pairing_id
  const { data: userDepartments = [] } = useQuery({
    queryKey: ['user-departments-pairs', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_departments')
        .select(`
          id,
          is_primary,
          pairing_id,
          departments!user_departments_department_id_fkey(name)
        `)
        .eq('user_id', userId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // Fetch user profile roles with pairing_id
  const { data: userRoles = [] } = useQuery({
    queryKey: ['user-profile-roles-pairs', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profile_roles')
        .select(`
          id, 
          role_id, 
          is_primary, 
          pairing_id,
          roles (
            name
          )
        `)
        .eq('user_id', userId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      
      // Transform data to match expected interface
      const transformedData = (data || []).map(item => ({
        id: item.id,
        role_name: item.roles?.name || '',
        is_primary: item.is_primary,
        pairing_id: item.pairing_id,
      }));
      
      return transformedData;
    },
    enabled: !!userId,
  });

  // Create pairs using the same logic as the card view
  const createPairs = (): DepartmentRolePair[] => {
    const pairs: DepartmentRolePair[] = [];
    const usedPairingIds = new Set<string>();
    
    // First, find paired assignments (departments and roles with matching pairing_id)
    userDepartments.forEach(dept => {
      if (dept.pairing_id) {
        const matchingRole = userRoles.find(role => role.pairing_id === dept.pairing_id);
        if (matchingRole) {
          pairs.push({
            id: `pair-${dept.pairing_id}`,
            department: {
              name: dept.departments?.name || 'Unknown',
              isPrimary: dept.is_primary
            },
            role: {
              name: matchingRole.role_name,
              isPrimary: matchingRole.is_primary
            }
          });
          usedPairingIds.add(dept.pairing_id);
        }
      }
    });
    
    // Add standalone departments (no pairing_id or no matching role)
    userDepartments.forEach(dept => {
      if (!dept.pairing_id || !usedPairingIds.has(dept.pairing_id)) {
        pairs.push({
          id: `dept-${dept.id}`,
          department: {
            name: dept.departments?.name || 'Unknown',
            isPrimary: dept.is_primary
          }
        });
      }
    });
    
    // Add standalone roles (no pairing_id or no matching department)
    userRoles.forEach(role => {
      if (!role.pairing_id || !usedPairingIds.has(role.pairing_id)) {
        pairs.push({
          id: `role-${role.id}`,
          role: {
            name: role.role_name,
            isPrimary: role.is_primary
          }
        });
      }
    });
    
    // Sort to show primary assignments first
    pairs.sort((a, b) => {
      const aPrimary = a.department?.isPrimary || a.role?.isPrimary;
      const bPrimary = b.department?.isPrimary || b.role?.isPrimary;
      if (aPrimary && !bPrimary) return -1;
      if (!aPrimary && bPrimary) return 1;
      return 0;
    });

    return pairs;
  };

  const pairs = createPairs();

  if (pairs.length === 0) {
    return <span className="text-muted-foreground text-sm">No assignments</span>;
  }

  return (
    <div className="space-y-2">
      {pairs.map((pair) => (
        <div key={pair.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-md">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {pair.department ? (
              <div className="flex items-center gap-1">
                <Badge 
                  variant={pair.department.isPrimary ? "default" : "outline"} 
                  className="text-xs"
                >
                  {pair.department.name}
                </Badge>
                {pair.department.isPrimary && (
                  <Star className="h-3 w-3 fill-current text-yellow-500" />
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">No department</span>
            )}
          </div>
          
          <div className="text-muted-foreground">→</div>
          
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {pair.role ? (
              <div className="flex items-center gap-1">
                <Badge 
                  variant={pair.role.isPrimary ? "default" : "secondary"} 
                  className="text-xs"
                >
                  {pair.role.name}
                </Badge>
                {pair.role.isPrimary && (
                  <Star className="h-3 w-3 fill-current text-yellow-500" />
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">No role</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};