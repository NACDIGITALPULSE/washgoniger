import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/lib/store";
import Index from "./pages/Index";
import ServicesPage from "./pages/ServicesPage";
import OrderPage from "./pages/OrderPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/services/:category" element={<ServicesPage />} />
            <Route path="/order/:serviceId" element={<OrderPage />} />
            <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
            <Route path="/my-orders" element={<MyOrdersPage />} />
            <Route path="/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
