import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from 'staysecure-auth';
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
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { isAdmin, role } = useUserRole();

  // Determine current view from location
  const getCurrentViewFromLocation = (): typeof currentView => {
    if (location.pathname.startsWith('/admin/users/')) {
      return 'admin'; // User detail view is part of admin
    }
    // Default to dashboard if on root
    return currentView;
  };

  const handleNavigation = (view: typeof currentView) => {
    // Navigate to root and update view state
    navigate('/', { state: { activeTab: view } });
    onViewChange(view);
  };

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
              variant={getCurrentViewFromLocation() === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => handleNavigation('dashboard')}
              className="flex items-center space-x-2"
            >
              <span>Dashboard</span>
            </Button>
            <Button
              variant={getCurrentViewFromLocation() === 'compliance' ? 'default' : 'ghost'}
              onClick={() => handleNavigation('compliance')}
              className="flex items-center space-x-2"
            >
              <span>Compliance</span>
            </Button>
            {isAdmin && (
              <Button
                variant={getCurrentViewFromLocation() === 'inventory' ? 'default' : 'ghost'}
                onClick={() => handleNavigation('inventory')}
                className="flex items-center space-x-2"
              >
                <span>Inventory</span>
              </Button>
            )}
             {isAdmin && (<Button
              variant={getCurrentViewFromLocation() === 'certifications' ? 'default' : 'ghost'}
              onClick={() => handleNavigation('certifications')}
              className="flex items-center space-x-2"
            >
              <span>Knowledge</span>
            </Button>
            )}
            {isAdmin && (
              <Button
                variant={getCurrentViewFromLocation() === 'breach-management' ? 'default' : 'ghost'}
                onClick={() => handleNavigation('breach-management')}
                className="flex items-center space-x-2"
              >
                <span>Breach Management</span>
              </Button>
            )}
            {isAdmin && (
              <Button
                variant={getCurrentViewFromLocation() === 'settings' ? 'default' : 'ghost'}
                onClick={() => handleNavigation('settings')}
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
