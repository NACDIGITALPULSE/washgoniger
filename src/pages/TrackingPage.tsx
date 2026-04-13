import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { motion } from "framer-motion";
import { Search, Phone, MapPin, Clock, CheckCircle2, Truck, Package, XCircle, PackageCheck, Home } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Order } from "@/lib/services";

const trackingSteps = [
  { status: "pending", label: "En attente", icon: Clock, desc: "Votre commande a été reçue" },
  { status: "accepted", label: "Acceptée", icon: CheckCircle2, desc: "Commande confirmée par notre équipe" },
  { status: "in_progress", label: "En cours", icon: Truck, desc: "Votre prestation est en cours" },
  { status: "ready", label: "Prête", icon: PackageCheck, desc: "Prête pour récupération / livraison" },
  { status: "delivered", label: "Livrée", icon: Home, desc: "Renvoyée chez le client" },
  { status: "completed", label: "Terminée", icon: Package, desc: "Prestation terminée avec succès" },
];

const statusIndex: Record<string, number> = { pending: 0, accepted: 1, in_progress: 2, ready: 3, delivered: 4, completed: 5, cancelled: -1 };

const TrackingPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const parseOrder = (row: any): Order => ({
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
  });

  const search = async () => {
    if (!searchInput.trim()) return;
    setLoading(true);
    setSearched(true);
    const q = searchInput.trim();
    
    // Search by order number, id, or phone number
    const { data } = await supabase
      .from("orders")
      .select("*")
      .or(`order_number.eq.${q.toUpperCase()},id.eq.${q.toUpperCase()},client_phone.eq.${q}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setOrder(data ? parseOrder(data) : null);
    setLoading(false);
  };

  // Realtime updates
  useEffect(() => {
    if (!order) return;
    const channel = supabase
      .channel("tracking-" + order.id)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${order.id}` }, (payload) => {
        setOrder(parseOrder(payload.new));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [order?.id]);

  const currentStep = order ? statusIndex[order.status] : -1;
  const isCancelled = order?.status === "cancelled";

  return (
    <div className="min-h-screen pb-20 bg-background">
      <PageHeader title="📍 Suivi de commande" />
      <div className="container max-w-lg mx-auto px-4 py-6">
        {/* Search */}
        <div className="glass-card rounded-2xl p-5 mb-6">
          <h3 className="font-bold text-foreground text-sm mb-1">Suivez votre commande</h3>
          <p className="text-xs text-muted-foreground mb-4">Entrez votre n° de commande ou numéro de téléphone</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="N° commande ou téléphone"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                className="pl-10 rounded-xl font-mono text-sm"
              />
            </div>
            <Button variant="hero" className="rounded-xl" onClick={search}>
              Suivre
            </Button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          </div>
        )}

        {!loading && searched && !order && (
          <div className="text-center py-16">
            <Package className="w-14 h-14 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground font-medium">Commande introuvable</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Vérifiez le numéro et réessayez</p>
          </div>
        )}

        {order && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Order info */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl hero-gradient flex items-center justify-center text-xl">{order.service.icon}</div>
                <div className="flex-1">
                  <div className="font-bold text-foreground">{order.service.name}</div>
                  <div className="text-xs text-muted-foreground">{order.selectedOption.name} {order.quantity > 1 ? `× ${order.quantity}` : ""}</div>
                  {order.orderNumber && <div className="text-xs text-primary font-bold mt-0.5">#{order.orderNumber}</div>}
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-primary text-sm">{order.total.toLocaleString("fr-FR")} F</div>
                  <div className="text-[10px] text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("fr-FR")}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {order.clientName}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {order.location === "domicile" ? order.address || "Domicile" : "Sur place"}</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-bold text-foreground text-sm mb-5">Progression</h3>
              {isCancelled ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10">
                  <XCircle className="w-6 h-6 text-destructive" />
                  <div>
                    <div className="font-bold text-destructive text-sm">Commande annulée</div>
                    <div className="text-xs text-muted-foreground">Cette commande a été annulée</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-0">
                  {trackingSteps.map((step, i) => {
                    const isCompleted = currentStep >= i;
                    const isCurrent = currentStep === i;
                    const Icon = step.icon;
                    return (
                      <div key={step.status} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.12 }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                              isCurrent ? "hero-gradient shadow-lg" : isCompleted ? "bg-success" : "bg-muted"
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${isCompleted || isCurrent ? "text-primary-foreground" : "text-muted-foreground"}`} />
                          </motion.div>
                          {i < trackingSteps.length - 1 && (
                            <div className={`w-0.5 h-8 ${isCompleted && currentStep > i ? "bg-success" : "bg-muted"}`} />
                          )}
                        </div>
                        <div className="pb-4">
                          <div className={`font-bold text-sm ${isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                            {step.label}
                          </div>
                          <div className="text-xs text-muted-foreground">{step.desc}</div>
                          {isCurrent && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              En cours
                            </motion.div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* WhatsApp contact */}
            <Button
              variant="outline"
              className="w-full rounded-2xl h-12 border-success/30 text-success hover:bg-success/5"
              onClick={() => {
                const msg = `Bonjour, j'aimerais avoir des nouvelles de ma commande ${order.orderNumber || order.id}. Merci !`;
                window.open(`https://wa.me/22788082987?text=${encodeURIComponent(msg)}`, "_blank");
              }}
            >
              💬 Contacter WashGo par WhatsApp
            </Button>
          </motion.div>
        )}
      </div>
      <WhatsAppFloat />
      <BottomNav />
    </div>
  );
};

export default TrackingPage;
