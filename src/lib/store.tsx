import { Order, Service, DEFAULT_SERVICES } from "@/lib/services";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AppState {
  orders: Order[];
  services: Service[];
  servicesLoading: boolean;
  ordersLoading: boolean;
  addOrder: (order: Order) => Promise<void>;
  updateOrderStatus: (id: string, status: Order["status"]) => Promise<void>;
  updateService: (service: Service) => Promise<void>;
  addService: (service: Service) => Promise<void>;
  removeService: (id: string) => Promise<void>;
  refreshServices: () => Promise<void>;
  refreshOrders: () => Promise<void>;
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

const dbRowToOrder = (row: any): Order => ({
  id: row.id,
  clientName: row.client_name,
  clientPhone: row.client_phone,
  service: { id: row.service_id, name: row.service_name, icon: row.service_icon, category: "auto", description: "", options: [] },
  selectedOption: row.selected_option as any,
  quantity: Number(row.quantity),
  location: row.location,
  address: row.address || undefined,
  payment: row.payment,
  status: row.status,
  createdAt: new Date(row.created_at),
  total: Number(row.total),
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);

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

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setOrders(data.map(dbRowToOrder));
    }
    setOrdersLoading(false);
  }, []);

  useEffect(() => {
    fetchServices();
    fetchOrders();
  }, [fetchOrders]);

  const addOrder = async (order: Order) => {
    const { error } = await supabase.from("orders").insert({
      id: order.id,
      client_name: order.clientName,
      client_phone: order.clientPhone,
      service_id: order.service.id,
      service_name: order.service.name,
      service_icon: order.service.icon,
      selected_option: order.selectedOption as any,
      quantity: order.quantity,
      location: order.location,
      address: order.address || null,
      payment: order.payment,
      status: order.status,
      total: order.total,
    });
    if (!error) {
      setOrders((prev) => [order, ...prev]);
    }
  };

  const updateOrderStatus = async (id: string, status: Order["status"]) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);
    if (!error) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    }
  };

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
    <AppContext.Provider value={{ orders, services, servicesLoading, ordersLoading, addOrder, updateOrderStatus, updateService, addService, removeService, refreshServices: fetchServices, refreshOrders: fetchOrders }}>
      {children}
    </AppContext.Provider>
  );
};
