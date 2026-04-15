
import debug from '@/utils/debug';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from 'staysecure-auth';
import { LoginForm } from 'staysecure-auth';
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import InventoryPanel from "@/components/InventoryPanel";
import SettingsPanel from "@/components/SettingsPanel";
import Dashboard from "@/components/Dashboard";
import CompliancePanel from "@/components/CompliancePanel";
import BreachManagementPanel from "@/components/BreachManagementPanel";
import NotFound from "./pages/NotFound";
import UserDetail from "./pages/UserDetail";
import { PersonaProfileWrapper } from "@/components/PersonaProfileWrapper";
import AuthCallbackPage from "@/components/auth/AuthCallbackPage";
import { useState, useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useClient } from "@/hooks/useClient";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => {
      const msg = (error?.message ?? '').toLowerCase();
      const isAuthError =
        error?.code === 'PGRST301' ||
        error?.status === 401 ||
        msg.includes('jwt') ||
        msg.includes('not authenticated') ||
        msg.includes('invalid token');
      if (isAuthError) {
        sessionStorage.setItem('auth_session_expired', '1');
        supabase.auth.signOut();
      }
    },
  }),
});

// Redirect component for /admin route
const AdminRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Redirect to home with settings view (which contains OrganisationPanel)
    // The OrganisationPanel will handle the activeTab state internally
    navigate('/', { 
      state: { 
        activeTab: 'settings'
      },
      replace: true 
    });
  }, [navigate, location.state]);
  
  return null;
};

const AppContentRouter = () => {
  const location = useLocation();
  const [currentView, setCurrentView] = useState<'dashboard' | 'persona' | 'inventory' | 'settings' | 'compliance' | 'breach-management'>('dashboard');

  // Update currentView from navigation state when location changes
  useEffect(() => {
    if (location.state?.activeTab) {
      setCurrentView(location.state.activeTab);
    }
  }, [location]);

  const dashboardContent = (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'persona' && <PersonaProfileWrapper />}
      {currentView === 'compliance' && <CompliancePanel />}
      {currentView === 'inventory' && <InventoryPanel />}
      {currentView === 'breach-management' && <BreachManagementPanel />}
      {currentView === 'settings' && <SettingsPanel />}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      
      <Routes>
        <Route path="/" element={dashboardContent} />
        <Route path="/:client" element={dashboardContent} />
        <Route path="/admin/users/:userId" element={<UserDetail />} />
        <Route path="/:client/admin/users/:userId" element={<UserDetail />} />
        <Route path="/admin" element={<AdminRedirect />} />
        <Route path="/:client/admin" element={<AdminRedirect />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { clientConfig } = useClient();

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    debug.log('[AppContent] Rendering LoginForm with displayName:', clientConfig?.displayName, 'clientConfig:', clientConfig);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md relative">
          <LoginForm displayName={clientConfig?.displayName} />
        </div>
      </div>
    );
  }

  // For users without admin permissions, show only their own profile
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-6 px-4 max-w-6xl">
          <PersonaProfileWrapper />
        </div>
      </div>
    );
  }

  // For admin users, show full navigation and all features
  return <AppContentRouter />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider config={{
        supabaseClient: supabase,
        edgeFunctions: {
          updatePassword: 'update-user-password',
          sendEmail: 'send-email',
          sendPasswordReset: 'send-password-reset'
        },
        onActivation: async (userId) => {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .update({ status: 'Active' })
              .eq('id', userId)
              .select();
            
            if (error) {
              return false;
            }
            
            return true;
          } catch (err) {
            return false;
          }
        }
      }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/:client/auth/callback" element={<AuthCallbackPage />} />
              <Route path="*" element={<AppContent />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
