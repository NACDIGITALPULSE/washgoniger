import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import SEO from "@/components/SEO";
import { motion } from "framer-motion";
import { Package, Scale, Bell, Edit3, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order } from "@/lib/services";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const statusLabels: Record<string, { label: string; color: string; emoji: string }> = {
  pending: { label: "En attente", color: "bg-warning", emoji: "⏳" },
  accepted: { label: "Acceptée", color: "bg-primary", emoji: "✅" },
  in_progress: { label: "En cours", color: "bg-primary", emoji: "🔄" },
  ready: { label: "Prête", color: "bg-secondary", emoji: "📦" },
  delivered: { label: "Livrée", color: "bg-secondary", emoji: "🚚" },
  completed: { label: "Terminée", color: "bg-success", emoji: "🎉" },
  cancelled: { label: "Annulée", color: "bg-destructive", emoji: "❌" },
};

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const parseOrder = (row: any): Order => ({
    id: row.id,
    orderNumber: row.order_number || undefined,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    service: { id: row.service_id, name: row.service_name, icon: row.service_icon, category: "auto" as const, description: "", options: [] },
    selectedOption: row.selected_option as any,
    selectedOptions: (row.selected_option as any)?.options || undefined,
    quantity: Number(row.quantity),
    location: row.location,
    address: row.address || undefined,
    payment: row.payment,
    status: row.status,
    createdAt: new Date(row.created_at),
    total: Number(row.total),
  });

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setOrders(data.map(parseOrder));
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  // Realtime updates on own orders (RLS filters)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("client-orders-" + user.id)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as any;
          const oldStatus = (payload.old as any)?.status;
          const newStatus = updated.status;
          if (oldStatus !== newStatus) {
            const s = statusLabels[newStatus] || { label: newStatus, emoji: "📋" };
            toast.success(`${s.emoji} ${updated.service_name} — ${s.label}`, { duration: 8000 });
          }
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? parseOrder(updated) : o)));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const canModify = (order: Order) => order.status === "pending";

  const handleCancelOrder = async (orderId: string) => {
    const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
    if (!error) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "cancelled" as const } : o));
      toast.success("Commande annulée");
    } else {
      toast.error("Impossible d'annuler (seul l'admin peut modifier après acceptation).");
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <SEO title="Mes commandes — WashGo Niger" description="Historique de vos commandes WashGo Niger." path="/my-orders" />
      <PageHeader title="📋 Mes Commandes" />
      <div className="container max-w-lg mx-auto px-4 py-6">
        {/* Profile card */}
        <div className="glass-card rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-foreground">{profile?.full_name || "Mon compte"}</p>
            <p className="text-xs text-muted-foreground">{profile?.phone || user?.email}</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={async () => { await signOut(); navigate("/"); }}>
            <LogOut className="w-3.5 h-3.5 mr-1" /> Déconnexion
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Chargement...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-14 h-14 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground font-medium">Aucune commande</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Passez votre première commande depuis l'accueil</p>
            <Button variant="hero" className="rounded-xl mt-4" onClick={() => navigate("/")}>Découvrir les services</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
              <Bell className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-xs text-muted-foreground">Vous recevez les mises à jour en temps réel</p>
            </div>
            {orders.map((order, i) => {
              const status = statusLabels[order.status] || { label: order.status, color: "bg-muted", emoji: "" };
              const optionsList = order.selectedOptions && order.selectedOptions.length > 0
                ? order.selectedOptions
                : [{ option: order.selectedOption, quantity: order.quantity }];
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl hero-gradient flex items-center justify-center text-lg">
                        {order.service.icon}
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-sm">{order.service.name}</div>
                        {optionsList.map(({ option, quantity }) => (
                          <div key={option.id} className="text-xs text-muted-foreground flex items-center gap-1">
                            {option.name}
                            {quantity > 1 && (<span className="font-medium">× {quantity}{option.unit === "kg" ? " kg" : ""}</span>)}
                            {option.unit === "kg" && <Scale className="w-3 h-3" />}
                          </div>
                        ))}
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full text-primary-foreground ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border">
                    <span>{new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="font-extrabold text-sm text-primary">{order.total.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  {canModify(order) && (
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="rounded-xl flex-1 text-xs" onClick={() => navigate(`/order/${order.service.id}`)}>
                        <Edit3 className="w-3.5 h-3.5 mr-1" /> Nouvelle
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl flex-1 text-xs text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => handleCancelOrder(order.id)}>
                        Annuler
                      </Button>
                    </div>
                  )}
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

export default MyOrdersPage;
