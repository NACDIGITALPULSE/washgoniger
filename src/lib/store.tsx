import { Order, Service, DEFAULT_SERVICES } from "@/lib/services";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AppState {
  orders: Order[];
  services: Service[];
  servicesLoading: boolean;
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  updateService: (service: Service) => Promise<void>;
  addService: (service: Service) => Promise<void>;
  removeService: (id: string) => Promise<void>;
  refreshServices: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export const useAppState = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be inside AppProvider");
  return ctx;
};

const dbRowToService = (row: any): Service => ({
  id: row.id,
  category: row.category,
  name: row.name,
  description: row.description,
  icon: row.icon,
  options: (row.options as any[]) || [],
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [servicesLoading, setServicesLoading] = useState(true);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("created_at");
    if (!error && data && data.length > 0) {
      setServices(data.map(dbRowToService));
    }
    setServicesLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const addOrder = (order: Order) => setOrders((prev) => [order, ...prev]);

  const updateOrderStatus = (id: string, status: Order["status"]) =>
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));

  const updateService = async (service: Service) => {
    const { error } = await supabase
      .from("services")
      .update({
        name: service.name,
        description: service.description,
        icon: service.icon,
        options: service.options as any,
        category: service.category,
      })
      .eq("id", service.id);
    if (!error) {
      setServices((prev) => prev.map((s) => (s.id === service.id ? service : s)));
    }
  };

  const addService = async (service: Service) => {
    const { error } = await supabase.from("services").insert({
      id: service.id,
      name: service.name,
      description: service.description,
      icon: service.icon,
      category: service.category,
      options: service.options as any,
    });
    if (!error) {
      setServices((prev) => [...prev, service]);
    }
  };

  const removeService = async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (!error) {
      setServices((prev) => prev.filter((s) => s.id !== id));
    }
  };

  return (
    <AppContext.Provider value={{ orders, services, servicesLoading, addOrder, updateOrderStatus, updateService, addService, removeService, refreshServices: fetchServices }}>
      {children}
    </AppContext.Provider>
  );
};
