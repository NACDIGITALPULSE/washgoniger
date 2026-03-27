import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Scale, Phone, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Order } from "@/lib/services";

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-warning" },
  accepted: { label: "Acceptée", color: "bg-primary" },
  in_progress: { label: "En cours", color: "bg-primary" },
  completed: { label: "Terminée", color: "bg-success" },
  cancelled: { label: "Annulée", color: "bg-destructive" },
};

const MyOrdersPage = () => {
  const [phone, setPhone] = useState(() => localStorage.getItem("washgo_phone") || "");
  const [searchPhone, setSearchPhone] = useState(phone);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(!!phone);

  const fetchOrders = async (phoneNumber: string) => {
    if (!phoneNumber.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("client_phone", phoneNumber.trim())
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data.map((row: any) => ({
        id: row.id,
        clientName: row.client_name,
        clientPhone: row.client_phone,
        service: { id: row.service_id, name: row.service_name, icon: row.service_icon, category: "auto" as const, description: "", options: [] },
        selectedOption: row.selected_option as any,
        quantity: Number(row.quantity),
        location: row.location,
        address: row.address || undefined,
        payment: row.payment,
        status: row.status,
        createdAt: new Date(row.created_at),
        total: Number(row.total),
      })));
    }
    setLoading(false);
    setSearched(true);
  };

  useEffect(() => {
    if (phone) fetchOrders(phone);
  }, []);

  const handleSearch = () => {
    localStorage.setItem("washgo_phone", searchPhone);
    setPhone(searchPhone);
    fetchOrders(searchPhone);
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
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
            <Button variant="hero" className="rounded-xl" onClick={handleSearch}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

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
              const status = statusLabels[order.status];
              const isKg = order.selectedOption.unit === "kg";
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
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          {order.selectedOption.name}
                          {order.quantity > 1 && (
                            <span className="font-medium">
                              × {order.quantity}{isKg ? " kg" : ""}
                            </span>
                          )}
                          {isKg && <Scale className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full text-primary-foreground ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                    <span>{new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="font-extrabold text-sm text-primary">{order.total.toLocaleString("fr-FR")} FCFA</span>
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

export default MyOrdersPage;
