
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from 'staysecure-auth';
import { LoginForm } from 'staysecure-auth';
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import PersonaProfile from "@/modules/organisation/components/PersonaProfile";
import AdminPanel from "@/components/AdminPanel";
import InventoryPanel from "@/components/InventoryPanel";
import SettingsPanel from "@/components/SettingsPanel";
import Dashboard from "@/components/Dashboard";
import KnowledgePanel from "@/components/KnowledgePanel";
import CompliancePanel from "@/components/CompliancePanel";
import BreachManagementPanel from "@/components/BreachManagementPanel";
import UserDetailView from "@/components/admin/UserDetailView";
import NotFound from "./pages/NotFound";
import { useState, useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";

const queryClient = new QueryClient();

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
        <Route path="/admin/users/:userId" element={<UserDetailView />} />
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

const App = () => (
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
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
