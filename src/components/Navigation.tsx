import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from 'staysecure-auth';
import { useUserRole } from '@/hooks/useUserRole';
import { useProfile } from '@/hooks/useProfile';
import { useLanguages } from '@/hooks/useLanguages';
import { useClient } from '@/hooks/useClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Globe } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface NavigationProps {
  currentView: 'dashboard' | 'persona' | 'admin' | 'inventory' | 'certifications' | 'settings' | 'compliance' | 'breach-management';
  onViewChange: (view: 'dashboard' | 'persona' | 'admin' | 'inventory' | 'certifications' | 'settings' | 'compliance' | 'breach-management') => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { isAdmin, canAccessAnyAdminFeature, getRoleDisplayName, getRoleBadgeVariant } = useUserRole();
  const { profile } = useProfile();
  const { languages, getLanguageName } = useLanguages();
  const { clientConfig } = useClient();

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
    <nav className="bg-learning-surface border-b border-learning-border">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Left side - Title */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-learning-primary">StaySecure GOVERN</h1>
              {clientConfig?.displayName && (
                <Badge variant="outline" className="text-xs">
                  {clientConfig.displayName}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">Secure Business Continuity and Governance</p>
          </div>

          {/* Right side - Language, User, Logout */}
          <div className="flex items-center gap-2">
            {/* User Language Display */}
            {profile?.language && (
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                {(() => {
                  // profile.language stores display_name (e.g., 'Indonesian'), find language by display_name
                  const userLanguage = languages.find(l => l.display_name === profile.language || l.native_name === profile.language || l.name === profile.language);
                  return userLanguage?.flag_emoji ? (
                    <span>{userLanguage.flag_emoji}</span>
                  ) : (
                    <Globe className="w-4 h-4 text-muted-foreground" />
                  );
                })()}
                <span className="text-sm font-medium text-foreground">
                  {getLanguageName(profile.language)}
                </span>
              </div>
            )}
            
            {/* User Avatar */}
            {profile && (
              <div className="relative group">
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md cursor-pointer">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.full_name || 'User'} 
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-6 h-6 rounded-full text-white text-xs font-medium flex items-center justify-center ${
                      profile.role === 'client_admin' || profile.role === 'super_admin' 
                        ? 'bg-red-500' 
                        : 'bg-learning-primary'
                    }`}>
                      {profile.first_name && profile.last_name 
                        ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
                        : profile.username?.slice(0, 2).toUpperCase() || 'U'
                      }
                    </div>
                  )}
                </div>
                
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-md border shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  <div className="text-center">
                    <div className="font-medium">{profile.full_name || profile.username || 'User'}</div>
                    {profile.email && (
                      <div className="text-xs text-muted-foreground mt-1">{profile.email}</div>
                    )}
                  </div>
                  {/* Tooltip arrow */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-popover"></div>
                </div>
              </div>
            )}
            
            {/* Role Badge */}
            <Badge variant={getRoleBadgeVariant()} className="text-xs">
              {getRoleDisplayName()}
            </Badge>
            
            {/* Logout Button */}
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleSignOut}
              className="h-10 w-10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Navigation Buttons - Separate line below title, spread across full width */}
        <div className="flex items-center justify-around w-full mt-4">
          <Button
            variant={getCurrentViewFromLocation() === 'dashboard' ? 'default' : 'ghost'}
            onClick={() => handleNavigation('dashboard')}
            size="sm"
          >
            Dashboard
          </Button>
          <Button
            variant={getCurrentViewFromLocation() === 'compliance' ? 'default' : 'ghost'}
            onClick={() => handleNavigation('compliance')}
            size="sm"
          >
            Compliance
          </Button>
          {isAdmin && (
            <Button
              variant={getCurrentViewFromLocation() === 'inventory' ? 'default' : 'ghost'}
              onClick={() => handleNavigation('inventory')}
              size="sm"
            >
              Inventory
            </Button>
          )}
          {isAdmin && (
            <Button
              variant={getCurrentViewFromLocation() === 'certifications' ? 'default' : 'ghost'}
              onClick={() => handleNavigation('certifications')}
              size="sm"
            >
              Knowledge
            </Button>
          )}
          {isAdmin && (
            <Button
              variant={getCurrentViewFromLocation() === 'breach-management' ? 'default' : 'ghost'}
              onClick={() => handleNavigation('breach-management')}
              size="sm"
            >
              Breach Management
            </Button>
          )}
          {isAdmin && (
            <Button
              variant={getCurrentViewFromLocation() === 'settings' ? 'default' : 'ghost'}
              onClick={() => handleNavigation('settings')}
              size="sm"
            >
              Organisation
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
