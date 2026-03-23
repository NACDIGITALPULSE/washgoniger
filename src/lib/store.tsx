import { Order, Service, DEFAULT_SERVICES } from "@/lib/services";
import { createContext, useContext, useState, ReactNode } from "react";

interface AppState {
  orders: Order[];
  services: Service[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  updateService: (service: Service) => void;
  addService: (service: Service) => void;
  removeService: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export const useAppState = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be inside AppProvider");
  return ctx;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);

  const addOrder = (order: Order) => setOrders((prev) => [order, ...prev]);

  const updateOrderStatus = (id: string, status: Order["status"]) =>
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));

  const updateService = (service: Service) =>
    setServices((prev) => prev.map((s) => (s.id === service.id ? service : s)));

  const addService = (service: Service) =>
    setServices((prev) => [...prev, service]);

  const removeService = (id: string) =>
    setServices((prev) => prev.filter((s) => s.id !== id));

  return (
    <AppContext.Provider value={{ orders, services, addOrder, updateOrderStatus, updateService, addService, removeService }}>
      {children}
    </AppContext.Provider>
  );
};
