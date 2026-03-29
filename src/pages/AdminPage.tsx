import { useAppState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, ShoppingBag, TrendingUp, CheckCircle2, Clock, XCircle, Settings, Plus, Trash2, Save, ArrowLeft, LogOut, Bell, MessageCircle, Search, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Order, Service, ServiceOption } from "@/lib/services";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const statusActions: Record<string, { next: Order["status"]; label: string }> = {
  pending: { next: "accepted", label: "Accepter" },
  accepted: { next: "in_progress", label: "Démarrer" },
  in_progress: { next: "completed", label: "Terminer" },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-warning" },
  accepted: { label: "Acceptée", color: "bg-primary" },
  in_progress: { label: "En cours", color: "bg-primary" },
  completed: { label: "Terminée", color: "bg-success" },
  cancelled: { label: "Annulée", color: "bg-destructive" },
};

const AdminPage = () => {
  const { orders, updateOrderStatus, services, updateService, addService, removeService } = useAppState();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"dashboard" | "orders" | "services" | "promos">("dashboard");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleData) {
        await supabase.auth.signOut();
        navigate("/login", { replace: true });
      }
    };
    checkAuth();
  }, [navigate]);

  const ADMIN_WHATSAPP = "22788082987";

  const buildAdminWhatsAppUrl = (serviceName: string, clientName: string, clientPhone: string, total: number, location: string) => {
    const message = `🔔 *Nouvelle commande WashGo !*\n\n📋 Service: *${serviceName}*\n👤 Client: *${clientName}*\n📞 Tél: ${clientPhone}\n📍 Lieu: ${location === "domicile" ? "À domicile" : "Sur place"}\n💰 Total: *${total.toLocaleString("fr-FR")} FCFA*\n\n⏰ ${new Date().toLocaleString("fr-FR")}`;
    return `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
  };

  const buildClientWhatsAppUrl = (clientPhone: string, clientName: string, serviceName: string, total: number) => {
    const cleanPhone = clientPhone.replace(/\D/g, "");
    const fullPhone = cleanPhone.startsWith("227") ? cleanPhone : `227${cleanPhone}`;
    const message = `Bonjour ${clientName}, votre commande *${serviceName}* d'un montant de *${total.toLocaleString("fr-FR")} FCFA* a bien été reçue. Merci pour votre confiance ! 🚗✨ — WashGo Niger`;
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
  };

  // Realtime notifications for new orders
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new as any;
          const whatsappUrl = buildAdminWhatsAppUrl(newOrder.service_name, newOrder.client_name, newOrder.client_phone, Number(newOrder.total), newOrder.location);
          toast.success(`🔔 Nouvelle commande !`, {
            description: `${newOrder.service_name} — ${newOrder.client_name} (${Number(newOrder.total).toLocaleString("fr-FR")} FCFA)`,
            duration: 15000,
            action: {
              label: "📱 WhatsApp",
              onClick: () => window.open(whatsappUrl, "_blank"),
            },
          });
          try {
            const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczJj+QxN3LdUMtQYC02NZ+TDM+eLHX2YlVODx0rNPXkFw7OnSu1deMYDs5c7DV2JRgPDlxr9bZlWI9OXKw1tqVYj45c7HX25ViPjp1s9nclmM/O3i22d2YZD87d7bZ3pllQDt4t9remWVAO3i42d+ZZUA8eLna35plQDx5utremGVAPHm62t+ZZUA8ebrb35plQDx5u9vfmmZAPXm729+aZkA9ebzc4JtmQD15vNzgm2ZAPnm83OCbZ0A+eb3d4JxnQD55vd3gnGdAPnm93eCcZ0A+eb3d4JxnQD55vd3gnGdAPnm93eCcaEA=");
            audio.volume = 0.5;
            audio.play().catch(() => {});
          } catch {}
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
    toast.success("Déconnexion réussie");
  };

  const totalRevenue = orders.filter((o) => o.status === "completed").reduce((sum, o) => sum + o.total, 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const completedCount = orders.filter((o) => o.status === "completed").length;

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="hero-gradient px-4 pt-6 pb-10 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="container max-w-lg mx-auto relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-extrabold text-primary-foreground">Admin Panel</h1>
              <p className="text-sm text-primary-foreground/60">CleanCar Niger</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate("/")} className="flex items-center gap-1 text-primary-foreground/70 text-sm font-medium hover:text-primary-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Retour
              </button>
              <button onClick={handleLogout} className="flex items-center gap-1 text-primary-foreground/70 text-sm font-medium hover:text-primary-foreground transition-colors ml-2">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: TrendingUp, label: "Revenus", value: `${totalRevenue.toLocaleString("fr-FR")} F` },
              { icon: Clock, label: "En attente", value: pendingCount.toString() },
              { icon: CheckCircle2, label: "Terminées", value: completedCount.toString() },
            ].map((stat) => (
              <div key={stat.label} className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-primary-foreground/10">
                <stat.icon className="w-4 h-4 mx-auto mb-1 text-primary-foreground/70" />
                <div className="text-base font-extrabold text-primary-foreground">{stat.value}</div>
                <div className="text-[10px] text-primary-foreground/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container max-w-lg mx-auto px-4 -mt-5 relative z-10">
        <div className="glass-card rounded-2xl p-1 flex mb-6 shadow-lg">
          {([
            { key: "dashboard" as const, label: "📊 Stats" },
            { key: "orders" as const, label: "📋 Commandes" },
            { key: "services" as const, label: "⚙️ Services" },
            { key: "promos" as const, label: "🏷️ Promos" },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                tab === t.key ? "hero-gradient text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "dashboard" && <DashboardTab key="dash" orders={orders} totalRevenue={totalRevenue} />}
          {tab === "orders" && <OrdersTab key="ord" orders={orders} updateOrderStatus={updateOrderStatus} />}
          {tab === "services" && <ServicesTab key="svc" services={services} updateService={updateService} addService={addService} removeService={removeService} />}
          {tab === "promos" && <PromosTab key="promo" />}
        </AnimatePresence>
      </div>
    </div>
  );
};

const DashboardTab = ({ orders, totalRevenue }: { orders: Order[]; totalRevenue: number }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
    <div className="glass-card rounded-2xl p-5">
      <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" /> Résumé
      </h3>
      <div className="space-y-3">
        {[
          { label: "Total commandes", value: orders.length.toString() },
          { label: "Chiffre d'affaires", value: `${totalRevenue.toLocaleString("fr-FR")} FCFA`, highlight: true },
          { label: "Clients uniques", value: new Set(orders.map((o) => o.clientPhone)).size.toString() },
        ].map((row) => (
          <div key={row.label} className="flex justify-between text-sm items-center">
            <span className="text-muted-foreground">{row.label}</span>
            <span className={`font-bold ${row.highlight ? "text-gradient text-base" : "text-foreground"}`}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>

    {orders.length > 0 && (
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-bold text-foreground mb-4">📊 Par service</h3>
        <div className="space-y-3">
          {Object.entries(
            orders.reduce<Record<string, { count: number; revenue: number }>>((acc, o) => {
              const key = o.service.name;
              acc[key] = acc[key] || { count: 0, revenue: 0 };
              acc[key].count += 1;
              if (o.status === "completed") acc[key].revenue += o.total;
              return acc;
            }, {})
          ).map(([name, data]) => (
            <div key={name} className="flex justify-between items-center text-sm">
              <span className="text-foreground font-medium">{name}</span>
              <div className="text-right">
                <span className="text-muted-foreground">{data.count} cmd</span>
                <span className="ml-3 font-bold text-primary">{data.revenue.toLocaleString("fr-FR")} F</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </motion.div>
);

const OrdersTab = ({ orders, updateOrderStatus }: { orders: Order[]; updateOrderStatus: (id: string, status: Order["status"]) => void }) => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const openWhatsApp = (order: Order) => {
    const cleanPhone = order.clientPhone.replace(/\D/g, "");
    const fullPhone = cleanPhone.startsWith("227") ? cleanPhone : `227${cleanPhone}`;
    const message = `Bonjour ${order.clientName}, votre commande *${order.service.name}* d'un montant de *${order.total.toLocaleString("fr-FR")} FCFA* a bien été reçue. Merci pour votre confiance ! 🚗✨ — WashGo Niger`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const filteredOrders = orders.filter((o) => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchSearch = !searchQuery || o.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || o.clientPhone.includes(searchQuery);
    return matchStatus && matchSearch;
  });

  const filterButtons = [
    { key: "all", label: "Toutes" },
    { key: "pending", label: "En attente" },
    { key: "accepted", label: "Acceptées" },
    { key: "in_progress", label: "En cours" },
    { key: "completed", label: "Terminées" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un client..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-xl text-sm h-9"
        />
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {filterButtons.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
              statusFilter === f.key
                ? "hero-gradient text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
            {f.key !== "all" && (
              <span className="ml-1 opacity-70">
                {orders.filter((o) => o.status === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-14 h-14 mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-muted-foreground text-sm">Aucune commande</p>
        </div>
      ) : (
        filteredOrders.map((order, i) => {
          const status = statusLabels[order.status];
          const action = statusActions[order.status];
          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card rounded-2xl p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-foreground text-sm">
                    {order.service.icon} {order.service.name} — {order.selectedOption.name}
                    {order.quantity > 1 && (
                      <span className="text-muted-foreground font-normal ml-1">
                        × {order.quantity}{order.selectedOption.unit === "kg" ? " kg" : ""}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{order.clientName} • {order.clientPhone}</div>
                  <div className="text-xs text-muted-foreground">
                    {order.location === "domicile" ? `📍 ${order.address}` : "🏪 Sur place"} • {order.payment === "cash" ? "💵 Cash" : `📱 ${order.payment}`}
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full text-primary-foreground ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-sm font-extrabold text-primary">{order.total.toLocaleString("fr-FR")} FCFA</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-success border-success/20 hover:bg-success/5"
                    onClick={() => openWhatsApp(order)}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  {order.status === "pending" && (
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => updateOrderStatus(order.id, "cancelled")}>
                      Refuser
                    </Button>
                  )}
                  {action && (
                    <Button variant="success" size="sm" className="rounded-xl" onClick={() => updateOrderStatus(order.id, action.next)}>
                      {action.label}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })
      )}
    </motion.div>
  );
};

// ── Services Management Tab ──
const ServicesTab = ({
  services,
  updateService,
  addService,
  removeService,
}: {
  services: Service[];
  updateService: (s: Service) => void;
  addService: (s: Service) => void;
  removeService: (id: string) => void;
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-foreground">Gérer les services</h3>
        <Button variant="hero" size="sm" className="rounded-xl" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Ajouter
        </Button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <AddServiceForm
            onAdd={async (s) => { await addService(s); setShowAdd(false); toast.success("Service ajouté !"); }}
            onCancel={() => setShowAdd(false)}
          />
        )}
      </AnimatePresence>

      {services.map((service) => (
        <div key={service.id} className="glass-card rounded-2xl overflow-hidden">
          <div
            className="p-4 flex items-center justify-between cursor-pointer"
            onClick={() => setEditingId(editingId === service.id ? null : service.id)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl hero-gradient flex items-center justify-center text-lg">{service.icon}</div>
              <div>
                <div className="font-bold text-foreground text-sm">{service.name}</div>
                <div className="text-xs text-muted-foreground">{service.options.length} options • {service.category}</div>
              </div>
            </div>
            <Settings className={`w-4 h-4 text-muted-foreground transition-transform ${editingId === service.id ? "rotate-90" : ""}`} />
          </div>

          <AnimatePresence>
            {editingId === service.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <ServiceEditor
                  service={service}
                  onSave={async (s) => { await updateService(s); toast.success("Service mis à jour !"); }}
                  onDelete={async () => { await removeService(service.id); toast.success("Service supprimé"); setEditingId(null); }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </motion.div>
  );
};

const ServiceEditor = ({ service, onSave, onDelete }: { service: Service; onSave: (s: Service) => void; onDelete: () => void }) => {
  const [name, setName] = useState(service.name);
  const [description, setDescription] = useState(service.description);
  const [icon, setIcon] = useState(service.icon);
  const [options, setOptions] = useState<ServiceOption[]>([...service.options]);

  const updateOption = (idx: number, field: keyof ServiceOption, value: string | number) => {
    const updated = [...options];
    updated[idx] = { ...updated[idx], [field]: value };
    setOptions(updated);
  };

  const addOption = () => {
    setOptions([...options, { id: crypto.randomUUID(), name: "", price: 0, unit: "piece" }]);
  };

  const removeOption = (idx: number) => {
    setOptions(options.filter((_, i) => i !== idx));
  };

  return (
    <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
      <div className="grid grid-cols-[48px_1fr] gap-2">
        <Input value={icon} onChange={(e) => setIcon(e.target.value)} className="text-center rounded-xl" placeholder="🔧" />
        <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" placeholder="Nom du service" />
      </div>
      <Input value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl" placeholder="Description" />

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Options & Prix</span>
          <button onClick={addOption} className="text-xs font-semibold text-primary flex items-center gap-1">
            <Plus className="w-3 h-3" /> Ajouter
          </button>
        </div>
        {options.map((opt, idx) => (
          <div key={opt.id} className="flex gap-2 items-center">
            <Input value={opt.name} onChange={(e) => updateOption(idx, "name", e.target.value)} className="rounded-xl text-sm flex-1" placeholder="Nom" />
            <Input type="number" value={opt.price} onChange={(e) => updateOption(idx, "price", parseInt(e.target.value) || 0)} className="rounded-xl text-sm w-24" placeholder="Prix" />
            <select
              value={opt.unit || "piece"}
              onChange={(e) => updateOption(idx, "unit", e.target.value)}
              className="rounded-xl text-sm bg-muted text-foreground px-2 py-2 border border-border"
            >
              <option value="piece">Pièce</option>
              <option value="kg">Kg</option>
            </select>
            <button onClick={() => removeOption(idx)} className="text-destructive hover:text-destructive/80 p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="hero" size="sm" className="flex-1 rounded-xl" onClick={() => onSave({ ...service, name, description, icon, options })}>
          <Save className="w-4 h-4" /> Enregistrer
        </Button>
        <Button variant="destructive" size="sm" className="rounded-xl" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const AddServiceForm = ({ onAdd, onCancel }: { onAdd: (s: Service) => void; onCancel: () => void }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🆕");
  const [category, setCategory] = useState<"auto" | "pressing">("auto");

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="glass-card rounded-2xl p-4 space-y-3 overflow-hidden"
    >
      <h4 className="font-bold text-foreground text-sm">Nouveau service</h4>
      <div className="grid grid-cols-[48px_1fr] gap-2">
        <Input value={icon} onChange={(e) => setIcon(e.target.value)} className="text-center rounded-xl" />
        <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" placeholder="Nom du service" />
      </div>
      <Input value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl" placeholder="Description" />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as "auto" | "pressing")}
        className="w-full rounded-xl text-sm bg-muted text-foreground px-3 py-2.5 border border-border"
      >
        <option value="auto">🚗 Auto</option>
        <option value="pressing">👕 Pressing</option>
      </select>
      <div className="flex gap-2">
        <Button variant="hero" size="sm" className="flex-1 rounded-xl" onClick={() => {
          if (!name) { toast.error("Nom requis"); return; }
          onAdd({ id: crypto.randomUUID(), name, description, icon, category, options: [] });
        }}>
          <Plus className="w-4 h-4" /> Créer
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={onCancel}>Annuler</Button>
      </div>
    </motion.div>
  );
};

// ── Promos Management Tab ──
const PromosTab = () => {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxUses, setMaxUses] = useState("");

  const fetchPromos = async () => {
    const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
    setPromos(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPromos(); }, []);

  const addPromo = async () => {
    if (!code.trim() || !discountValue) { toast.error("Code et valeur requis"); return; }
    const { error } = await supabase.from("promo_codes").insert({
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      min_order: Number(minOrder) || 0,
      max_uses: maxUses ? Number(maxUses) : null,
    });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Ce code existe déjà" : "Erreur");
      return;
    }
    toast.success("Code promo créé !");
    setShowAdd(false);
    setCode(""); setDiscountValue(""); setMinOrder(""); setMaxUses("");
    fetchPromos();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("promo_codes").update({ active: !active }).eq("id", id);
    fetchPromos();
  };

  const deletePromo = async (id: string) => {
    await supabase.from("promo_codes").delete().eq("id", id);
    toast.success("Code supprimé");
    fetchPromos();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-foreground">Codes promo</h3>
        <Button variant="hero" size="sm" className="rounded-xl" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-4 h-4" /> Ajouter
        </Button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="glass-card rounded-2xl p-4 space-y-3">
            <Input placeholder="CODE (ex: WASH20)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="rounded-xl uppercase font-bold" />
            <div className="grid grid-cols-2 gap-2">
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)} className="rounded-xl text-sm bg-muted text-foreground px-3 py-2.5 border border-border">
                <option value="percentage">% Pourcentage</option>
                <option value="fixed">FCFA Montant fixe</option>
              </select>
              <Input placeholder={discountType === "percentage" ? "Ex: 20" : "Ex: 1000"} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="rounded-xl" type="number" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Min commande (FCFA)" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} className="rounded-xl" type="number" />
              <Input placeholder="Max utilisations" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="rounded-xl" type="number" />
            </div>
            <div className="flex gap-2">
              <Button variant="hero" size="sm" className="flex-1 rounded-xl" onClick={addPromo}>
                <Plus className="w-4 h-4" /> Créer
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowAdd(false)}>Annuler</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Chargement...</div>
      ) : promos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🏷️</div>
          <p className="text-muted-foreground text-sm">Aucun code promo</p>
        </div>
      ) : (
        promos.map((p) => (
          <div key={p.id} className="glass-card rounded-2xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-bold text-foreground text-sm flex items-center gap-2">
                  🏷️ {p.code}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>
                    {p.active ? "Actif" : "Inactif"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  -{p.discount_type === "percentage" ? `${p.discount_value}%` : `${Number(p.discount_value).toLocaleString("fr-FR")} FCFA`}
                  {p.min_order > 0 && ` • Min ${Number(p.min_order).toLocaleString("fr-FR")} F`}
                  {p.max_uses && ` • ${p.used_count}/${p.max_uses} utilisations`}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" className="rounded-xl flex-1 text-xs" onClick={() => toggleActive(p.id, p.active)}>
                {p.active ? "Désactiver" : "Activer"}
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl text-xs text-destructive" onClick={() => deletePromo(p.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))
      )}
    </motion.div>
  );
};

export default AdminPage;
