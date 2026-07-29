import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/lib/store";
import { AuthProvider } from "@/hooks/useAuth";
import { RequireAuth } from "@/components/RequireAuth";
import { ThemeProvider } from "@/hooks/use-theme";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { SWUpdatePrompt } from "@/components/SWUpdatePrompt";
import { IPayReturnHandler } from "@/components/IPayReturnHandler";

import Index from "./pages/Index";
import ServicesPage from "./pages/ServicesPage";
import OrderPage from "./pages/OrderPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminPage from "./pages/AdminPage";
import TrackingPage from "./pages/TrackingPage";
import NotificationsPage from "./pages/NotificationsPage";
import AuthPage from "./pages/AuthPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Sonner />
        <OfflineIndicator />
        <SWUpdatePrompt />
        <BrowserRouter>
          <AuthProvider>
            <AppProvider>
              <IPayReturnHandler />
              <Routes>
                <Route path="/" element={<Index />} />

                <Route path="/auth" element={<AuthPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/services/:category" element={<ServicesPage />} />
                <Route path="/order/:serviceId" element={<RequireAuth><OrderPage /></RequireAuth>} />
                <Route path="/order-confirmation" element={<RequireAuth><OrderConfirmationPage /></RequireAuth>} />
                <Route path="/my-orders" element={<RequireAuth><MyOrdersPage /></RequireAuth>} />
                <Route path="/change-password" element={<RequireAuth><ChangePasswordPage /></RequireAuth>} />
                <Route path="/tracking" element={<RequireAuth><TrackingPage /></RequireAuth>} />
                <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
                <Route path="/login" element={<AdminLoginPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
