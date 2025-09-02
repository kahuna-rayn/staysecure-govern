
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import AuthPage from "@/components/auth/AuthPage";
import Navigation from "@/components/Navigation";
import PersonaProfile from "@/components/PersonaProfile";
import AdminPanel from "@/components/AdminPanel";
import InventoryPanel from "@/components/InventoryPanel";
import SettingsPanel from "@/components/SettingsPanel";
import Dashboard from "@/components/Dashboard";
import KnowledgePanel from "@/components/KnowledgePanel";
import CompliancePanel from "@/components/CompliancePanel";
import BreachManagementPanel from "@/components/BreachManagementPanel";
import UserDetailView from "@/components/admin/UserDetailView";
import NotFound from "./pages/NotFound";
import { useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [currentView, setCurrentView] = useState<'dashboard' | 'persona' | 'admin' | 'inventory' | 'certifications' | 'settings' | 'compliance' | 'breach-management'>('dashboard');

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // For non-admin users, show only their own profile
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
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
