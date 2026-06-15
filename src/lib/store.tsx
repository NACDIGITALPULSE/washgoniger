import { Order, Service, DEFAULT_SERVICES, SelectedOptionWithQty, Agent } from "@/lib/services";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AppState {
  orders: Order[];
  services: Service[];
  agents: Agent[];
  servicesLoading: boolean;
  ordersLoading: boolean;
  addOrder: (order: Order) => Promise<void>;
  updateOrderStatus: (id: string, status: Order["status"]) => Promise<void>;
  assignAgent: (orderId: string, agentId: string | null) => Promise<void>;
  updateService: (service: Service) => Promise<void>;
  addService: (service: Service) => Promise<void>;
  removeService: (id: string) => Promise<void>;
  addAgent: (a: Omit<Agent, "id" | "created_at">) => Promise<void>;
  updateAgent: (a: Agent) => Promise<void>;
  removeAgent: (id: string) => Promise<void>;
  refreshServices: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshAgents: () => Promise<void>;
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
  orderNumber: row.order_number || undefined,
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
  agentId: row.agent_id || undefined,
  agentEtaMin: row.agent_eta_min ?? undefined,
  assignedAt: row.assigned_at ? new Date(row.assigned_at) : undefined,
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [agents, setAgents] = useState<Agent[]>([]);
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

  const fetchAgents = useCallback(async () => {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .order("created_at");
    if (!error && data) setAgents(data as any);
  }, []);

  useEffect(() => {
    fetchServices();
    fetchOrders();
    fetchAgents();
  }, [fetchOrders, fetchAgents]);

  // Realtime sync for agents
  useEffect(() => {
    const ch = supabase
      .channel("agents-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "agents" }, () => fetchAgents())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchAgents]);

  const addOrder = async (order: Order) => {
    const selectedOptionData = order.selectedOptions && order.selectedOptions.length > 0
      ? { ...order.selectedOption, options: order.selectedOptions }
      : order.selectedOption;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Vous devez être connecté pour commander");

    const orderRow = {
      id: order.id,
      user_id: user.id,
      order_number: order.orderNumber || null,
      client_name: order.clientName,
      client_phone: order.clientPhone,
      service_id: order.service.id,
      service_name: order.service.name,
      service_icon: order.service.icon,
      selected_option: selectedOptionData as any,
      quantity: order.quantity,
      location: order.location,
      address: order.address || null,
      payment: order.payment,
      status: "pending",
      total: order.total,
      promo_code: order.promoCode || null,
      discount: order.discount || 0,
    };

    const loyaltyRow = {
      user_id: user.id,
      user_phone: order.clientPhone,
      points: 10,
      source: "order",
      order_id: order.id,
    };

    // Offline → queue locally and sync automatically when connectivity returns.
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      const { enqueueOrder } = await import("@/lib/offlineQueue");
      enqueueOrder({
        orderRow,
        loyaltyRow,
        queuedAt: new Date().toISOString(),
        orderNumber: order.orderNumber,
      });
      setOrders((prev) => [order, ...prev]);
      return;
    }

    const { error } = await supabase.from("orders").insert(orderRow as any);
    if (!error) {
      setOrders((prev) => [order, ...prev]);
      await supabase.from("loyalty_points").insert(loyaltyRow as any);
    } else {
      // Network/DB failure → fall back to the offline queue so user never loses the order.
      const { enqueueOrder } = await import("@/lib/offlineQueue");
      enqueueOrder({
        orderRow,
        loyaltyRow,
        queuedAt: new Date().toISOString(),
        orderNumber: order.orderNumber,
      });
      setOrders((prev) => [order, ...prev]);
    }
  };


  const updateOrderStatus = async (id: string, status: Order["status"]) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (!error) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    }
  };

  const assignAgent = async (orderId: string, agentId: string | null) => {
    const agent = agentId ? agents.find((a) => a.id === agentId) : null;
    const etaMin = agent?.avg_eta_min ?? null;
    const patch: any = {
      agent_id: agentId,
      assigned_at: agentId ? new Date().toISOString() : null,
      agent_eta_min: etaMin,
    };
    if (agentId) patch.status = "accepted";
    const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
    if (!error) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, agentId: agentId || undefined, agentEtaMin: etaMin ?? undefined, status: agentId ? "accepted" : o.status }
            : o
        )
      );
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
    if (!error) setServices((prev) => [...prev, service]);
  };

  const removeService = async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (!error) setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const addAgent = async (a: Omit<Agent, "id" | "created_at">) => {
    const { data, error } = await supabase.from("agents").insert({
      name: a.name, phone: a.phone, zone: a.zone || null, active: a.active, avg_eta_min: a.avg_eta_min,
    }).select().single();
    if (!error && data) setAgents((prev) => [...prev, data as any]);
  };

  const updateAgent = async (a: Agent) => {
    const { error } = await supabase.from("agents").update({
      name: a.name, phone: a.phone, zone: a.zone, active: a.active, avg_eta_min: a.avg_eta_min,
    }).eq("id", a.id);
    if (!error) setAgents((prev) => prev.map((x) => (x.id === a.id ? a : x)));
  };

  const removeAgent = async (id: string) => {
    const { error } = await supabase.from("agents").delete().eq("id", id);
    if (!error) setAgents((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <AppContext.Provider value={{
      orders, services, agents, servicesLoading, ordersLoading,
      addOrder, updateOrderStatus, assignAgent,
      updateService, addService, removeService,
      addAgent, updateAgent, removeAgent,
      refreshServices: fetchServices, refreshOrders: fetchOrders, refreshAgents: fetchAgents,
    }}>
      {children}
    </AppContext.Provider>
  );
};
