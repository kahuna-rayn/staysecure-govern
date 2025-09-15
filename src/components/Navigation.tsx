import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { LogOut, Shield } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { RoleBadge } from '@/components/ui/role-badge';

interface NavigationProps {
  currentView: 'dashboard' | 'persona' | 'admin' | 'inventory' | 'certifications' | 'settings' | 'compliance' | 'breach-management';
  onViewChange: (view: 'dashboard' | 'persona' | 'admin' | 'inventory' | 'certifications' | 'settings' | 'compliance' | 'breach-management') => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const { signOut } = useAuth();
  const { isAdmin, role } = useUserRole();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
          <div className="flex space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-learning-primary">StaySecure GOVERN</h1>
              <p className="text-muted-foreground mt-1">Secure Business Continuity and Governance</p>
            </div><div className="flex items-center justify-between h-16"> <Button
              variant={currentView === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => onViewChange('dashboard')}
              className="flex items-center space-x-2"
            >
              <span>Dashboard</span>
            </Button>
            <Button
              variant={currentView === 'compliance' ? 'default' : 'ghost'}
              onClick={() => onViewChange('compliance')}
              className="flex items-center space-x-2"
            >
              <span>Compliance</span>
            </Button>
            {isAdmin && (
              <Button
                variant={currentView === 'inventory' ? 'default' : 'ghost'}
                onClick={() => onViewChange('inventory')}
                className="flex items-center space-x-2"
              >
                <span>Inventory</span>
              </Button>
            )}
             {isAdmin && (<Button
              variant={currentView === 'certifications' ? 'default' : 'ghost'}
              onClick={() => onViewChange('certifications')}
              className="flex items-center space-x-2"
            >
              <span>Knowledge</span>
            </Button>
            )}
            {isAdmin && (
              <Button
                variant={currentView === 'breach-management' ? 'default' : 'ghost'}
                onClick={() => onViewChange('breach-management')}
                className="flex items-center space-x-2"
              >
                <span>Breach Management</span>
              </Button>
            )}
            {isAdmin && (
              <Button
                variant={currentView === 'settings' ? 'default' : 'ghost'}
                onClick={() => onViewChange('settings')}
                className="flex items-center space-x-2"
              >
                <span>Organisation</span>
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <RoleBadge role={role} />
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
