import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import SEO from "@/components/SEO";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Scale, Phone, Search, Bell, Edit3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Order } from "@/lib/services";
import { toast } from "sonner";

const statusLabels: Record<string, { label: string; color: string; emoji: string }> = {
  pending: { label: "En attente", color: "bg-warning", emoji: "⏳" },
  accepted: { label: "Acceptée", color: "bg-primary", emoji: "✅" },
  in_progress: { label: "En cours", color: "bg-primary", emoji: "🔄" },
  completed: { label: "Terminée", color: "bg-success", emoji: "🎉" },
  cancelled: { label: "Annulée", color: "bg-destructive", emoji: "❌" },
};

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState(() => localStorage.getItem("washgo_phone") || "");
  const [searchPhone, setSearchPhone] = useState(phone);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(!!phone);

  const parseOrder = (row: any): Order => ({
    id: row.id,
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

  const fetchOrders = async (phoneNumber: string) => {
    if (!phoneNumber.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("client_phone", phoneNumber.trim())
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data.map(parseOrder));
    }
    setLoading(false);
    setSearched(true);
  };

  useEffect(() => {
    if (phone) fetchOrders(phone);
  }, []);

  // Realtime notifications for status changes
  useEffect(() => {
    if (!phone) return;
    const channel = supabase
      .channel('client-orders')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const updated = payload.new as any;
          if (updated.client_phone !== phone.trim()) return;
          
          const oldStatus = (payload.old as any)?.status;
          const newStatus = updated.status;
          if (oldStatus !== newStatus) {
            const statusInfo = statusLabels[newStatus] || { label: newStatus, emoji: "📋" };
            toast.success(`${statusInfo.emoji} Commande mise à jour !`, {
              description: `${updated.service_name} — ${statusInfo.label}`,
              duration: 10000,
            });
            // Play notification sound
            try {
              const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczJj+QxN3LdUMtQYC02NZ+TDM+eLHX2YlVODx0rNPXkFw7OnSu1deMYDs5c7DV2JRgPDlxr9bZlWI9OXKw1tqVYj45c7HX25ViPjp1s9nclmM/O3i22d2YZD87d7bZ3pllQDt4t9remWVAO3i42d+ZZUA8eLna35plQDx5utremGVAPHm62t+ZZUA8ebrb35plQDx5u9vfmmZAPXm729+aZkA9ebzc4JtmQD15vNzgm2ZAPnm83OCbZ0A+eb3d4JxnQD55vd3gnGdAPnm93eCcZ0A+eb3d4JxnQD55vd3gnGdAPnm93eCcaEA=");
              audio.volume = 0.4;
              audio.play().catch(() => {});
            } catch {}
          }

          setOrders((prev) => prev.map((o) =>
            o.id === updated.id ? parseOrder(updated) : o
          ));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [phone]);

  const handleSearch = () => {
    localStorage.setItem("washgo_phone", searchPhone);
    setPhone(searchPhone);
    fetchOrders(searchPhone);
  };

  const canModify = (order: Order) => order.status === "pending";

  const handleCancelOrder = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId);
    if (!error) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "cancelled" as const } : o));
      toast.success("Commande annulée");
    } else {
      toast.error("Erreur lors de l'annulation");
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <SEO
        title="Mes commandes — WashGo Niger"
        description="Retrouvez et suivez l'historique de vos commandes WashGo Niger avec votre numéro de téléphone."
        path="/my-orders"
      />
      <PageHeader title="📋 Mes Commandes" />
      <div className="container max-w-lg mx-auto px-4 py-6">
        {/* Phone search */}
        <div className="glass-card rounded-2xl p-4 mb-6">
          <p className="text-sm text-muted-foreground mb-3">Entrez votre numéro pour retrouver vos commandes</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Ex: 88082987"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 rounded-xl"
              />
            </div>
            <Button variant="hero" className="rounded-xl" onClick={handleSearch} aria-label="Rechercher">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Notification hint */}
        {searched && orders.length > 0 && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
            <Bell className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Restez sur cette page pour recevoir les notifications en temps réel
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Recherche en cours...</p>
          </div>
        ) : !searched ? (
          <div className="text-center py-16">
            <Phone className="w-14 h-14 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground font-medium">Entrez votre numéro de téléphone</p>
            <p className="text-sm text-muted-foreground/60 mt-1">pour retrouver vos commandes</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-14 h-14 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground font-medium">Aucune commande trouvée</p>
            <p className="text-sm text-muted-foreground/60 mt-1">pour ce numéro de téléphone</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{orders.length} commande{orders.length > 1 ? "s" : ""} trouvée{orders.length > 1 ? "s" : ""}</p>
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
                            {quantity > 1 && (
                              <span className="font-medium">× {quantity}{option.unit === "kg" ? " kg" : ""}</span>
                            )}
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl flex-1 text-xs"
                        onClick={() => navigate(`/order/${order.service.id}`)}
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" /> Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl flex-1 text-xs text-destructive border-destructive/20 hover:bg-destructive/5"
                        onClick={() => handleCancelOrder(order.id)}
                      >
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
