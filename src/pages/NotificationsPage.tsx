import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { motion } from "framer-motion";
import { Bell, Package, CheckCircle2, Clock, Truck, PackageCheck, Home, XCircle } from "lucide-react";

const statusInfo: Record<string, { label: string; emoji: string; color: string }> = {
  pending: { label: "En attente", emoji: "⏳", color: "text-warning" },
  accepted: { label: "Acceptée", emoji: "✅", color: "text-primary" },
  in_progress: { label: "En cours", emoji: "🔄", color: "text-primary" },
  ready: { label: "Prête", emoji: "📦", color: "text-secondary" },
  delivered: { label: "Livrée", emoji: "🚚", color: "text-secondary" },
  completed: { label: "Terminée", emoji: "🎉", color: "text-success" },
  cancelled: { label: "Annulée", emoji: "❌", color: "text-destructive" },
};

interface OrderNotification {
  id: string;
  serviceName: string;
  serviceIcon: string;
  status: string;
  orderNumber?: string;
  total: number;
  createdAt: Date;
}

const NotificationsPage = () => {
  const [orders, setOrders] = useState<OrderNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const savedPhone = localStorage.getItem("washgo_phone") || "";

  useEffect(() => {
    if (!savedPhone) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, service_name, service_icon, status, order_number, total, created_at")
        .eq("client_phone", savedPhone)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) {
        setOrders(data.map((r: any) => ({
          id: r.id,
          serviceName: r.service_name,
          serviceIcon: r.service_icon,
          status: r.status,
          orderNumber: r.order_number,
          total: Number(r.total),
          createdAt: new Date(r.created_at),
        })));
      }
      setLoading(false);
    };
    fetch();

    // Realtime updates
    const channel = supabase
      .channel("notif-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        const row = payload.new as any;
        if (row?.client_phone === savedPhone) {
          fetch();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [savedPhone]);

  return (
    <div className="min-h-screen pb-20 bg-background">
      <PageHeader title="🔔 Notifications" />
      <div className="container max-w-lg mx-auto px-4 py-6">
        {!savedPhone ? (
          <div className="text-center py-16">
            <Bell className="w-14 h-14 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground font-medium">Aucun numéro enregistré</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Passez une commande pour recevoir des notifications</p>
          </div>
        ) : loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-14 h-14 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground font-medium">Aucune notification</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground mb-2">{orders.length} notification(s)</p>
            {orders.map((order, i) => {
              const info = statusInfo[order.status] || { label: order.status, emoji: "📋", color: "text-muted-foreground" };
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-card rounded-2xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl hero-gradient flex items-center justify-center text-lg shrink-0">
                      {order.serviceIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-foreground text-sm">{order.serviceName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-semibold ${info.color}`}>{info.emoji} {info.label}</span>
                        {order.orderNumber && <span className="text-[10px] text-primary font-mono">#{order.orderNumber}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-primary text-sm">{order.total.toLocaleString("fr-FR")} F</div>
                      <div className="text-[10px] text-muted-foreground">
                        {order.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <WhatsAppFloat />
      <BottomNav />
    </div>
  );
};

export default NotificationsPage;
