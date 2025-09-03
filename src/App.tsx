import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { MainLayout } from "@/components/layout/MainLayout";

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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="medical-lab-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <MainLayout>
                <Dashboard />
              </MainLayout>
            } />
            <Route path="/medical-records" element={
              <MainLayout>
                <MedicalRecords />
              </MainLayout>
            } />
            <Route path="/patient-registration" element={
              <MainLayout>
                <PatientRegistration />
              </MainLayout>
            } />
            <Route path="/visit-management" element={
              <MainLayout>
                <VisitManagement />
              </MainLayout>
            } />
            <Route path="/lab-orders" element={
              <MainLayout>
                <LabOrders />
              </MainLayout>
            } />
            <Route path="/lab-results" element={
              <MainLayout>
                <LabResults />
              </MainLayout>
            } />
            <Route path="/reports" element={
              <MainLayout>
                <Reports />
              </MainLayout>
            } />
            <Route path="/settings" element={
              <MainLayout>
                <Settings />
              </MainLayout>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
