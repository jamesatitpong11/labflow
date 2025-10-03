import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MedicalRecords from "./pages/MedicalRecords";
import PatientRegistration from "./pages/PatientRegistration";
import VisitManagement from "./pages/VisitManagement";
import LabOrders from "./pages/LabOrders";
import LabResults from "./pages/LabResults";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import PrinterTest from "./pages/PrinterTest";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="medical-lab-theme">
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/medical-records" element={
                <ProtectedRoute>
                  <MainLayout>
                    <MedicalRecords />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/patient-registration" element={
                <ProtectedRoute>
                  <MainLayout>
                    <PatientRegistration />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/visit-management" element={
                <ProtectedRoute>
                  <MainLayout>
                    <VisitManagement />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/lab-orders" element={
                <ProtectedRoute>
                  <MainLayout>
                    <LabOrders />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/lab-results" element={
                <ProtectedRoute>
                  <MainLayout>
                    <LabResults />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Reports />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Settings />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/printer-test" element={
                <ProtectedRoute>
                  <MainLayout>
                    <PrinterTest />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
