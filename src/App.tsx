
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from 'staysecure-auth';
import { LoginForm } from 'staysecure-auth';
import { OrganisationProvider, PersonaProfile } from 'staysecure-organisation';
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import AdminPanel from "@/components/AdminPanel";
import InventoryPanel from "@/components/InventoryPanel";
import SettingsPanel from "@/components/SettingsPanel";
import Dashboard from "@/components/Dashboard";
import KnowledgePanel from "@/components/KnowledgePanel";
import CompliancePanel from "@/components/CompliancePanel";
import BreachManagementPanel from "@/components/BreachManagementPanel";
import NotFound from "./pages/NotFound";
import UserDetail from "./pages/UserDetail";
import { useState, useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { Component, ErrorInfo, ReactNode } from 'react';

const queryClient = new QueryClient();

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
  const [currentView, setCurrentView] = useState<'dashboard' | 'persona' | 'admin' | 'inventory' | 'certifications' | 'settings' | 'compliance' | 'breach-management'>('dashboard');

  // Update currentView from navigation state when location changes
  useEffect(() => {
    if (location.state?.activeTab) {
      setCurrentView(location.state.activeTab);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      
      <Routes>
        <Route path="/" element={
          <div className="container mx-auto py-6 px-4 max-w-6xl">
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'persona' && <PersonaProfile />}
            {currentView === 'admin' && <AdminPanel />}
            {currentView === 'compliance' && <CompliancePanel />}
            {currentView === 'inventory' && <InventoryPanel />}
            {currentView === 'certifications' && <KnowledgePanel />}
            {currentView === 'breach-management' && <BreachManagementPanel />}
            {currentView === 'settings' && <SettingsPanel />}
          </div>
        } />
        <Route path="/admin/users/:userId" element={<UserDetail />} />
        <Route path="/admin" element={<AdminRedirect />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    );
  }

  // For users without admin permissions, show only their own profile
  if (!isAdmin) {
    return (
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto py-6 px-4 max-w-6xl">
            <PersonaProfile />
          </div>
        </div>
      </BrowserRouter>
    );
  }

  // For admin users, show full navigation and all features
  return (
    <BrowserRouter>
      <AppContentRouter />
    </BrowserRouter>
  );
};

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null; errorString: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorString: '' };
  }

  static getDerivedStateFromError(error: Error | unknown) {
    // Try to extract error information even if it's not a standard Error object
    let errorString = 'Unknown error';
    let errorObj: Error | null = null;
    
    if (error instanceof Error) {
      errorObj = error;
      errorString = error.message || 'Error without message';
    } else if (typeof error === 'string') {
      errorString = error;
    } else if (error && typeof error === 'object') {
      try {
        errorString = JSON.stringify(error, null, 2);
      } catch {
        errorString = String(error);
      }
    } else {
      errorString = String(error);
    }
    
    return { hasError: true, error: errorObj, errorString };
  }

  componentDidCatch(error: Error | unknown, errorInfo: ErrorInfo) {
    console.error('[Error Boundary] Caught error:', error);
    console.error('[Error Boundary] Error type:', typeof error);
    console.error('[Error Boundary] Error constructor:', error?.constructor?.name);
    
    if (error instanceof Error) {
      console.error('[Error Boundary] Error message:', error.message);
      console.error('[Error Boundary] Error name:', error.name);
      console.error('[Error Boundary] Error stack:', error.stack);
    } else {
      console.error('[Error Boundary] Non-Error object:', error);
      try {
        console.error('[Error Boundary] Error as JSON:', JSON.stringify(error, null, 2));
      } catch {
        console.error('[Error Boundary] Error as string:', String(error));
      }
    }
    
    console.error('[Error Boundary] Error info:', errorInfo);
    console.error('[Error Boundary] Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="text-center max-w-4xl">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <div className="text-left bg-white p-4 rounded shadow-lg mb-4">
              <p className="font-semibold mb-2">Error Details:</p>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96 mb-4 whitespace-pre-wrap">
                {this.state.errorString}
              </pre>
              {this.state.error?.stack && (
                <>
                  <p className="font-semibold mb-2">Stack Trace:</p>
                  <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96 whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                </>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  const organisationConfig = {
    supabaseClient: supabase,
    // Add other config as needed
  };

  return (
    <ErrorBoundary>
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
                console.error('[App] onActivation error:', error);
                return false;
              }
              
              return true;
            } catch (err: any) {
              console.error('[App] onActivation exception:', err);
              return false;
            }
          }
        }}>
          <OrganisationProvider config={organisationConfig}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AppContent />
            </TooltipProvider>
          </OrganisationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
