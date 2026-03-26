import { useAppState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, ShoppingBag, TrendingUp, CheckCircle2, Clock, XCircle, Settings, Plus, Trash2, Save, ArrowLeft, LogOut } from "lucide-react";
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
  const [tab, setTab] = useState<"dashboard" | "orders" | "services">("dashboard");

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
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
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

const OrdersTab = ({ orders, updateOrderStatus }: { orders: Order[]; updateOrderStatus: (id: string, status: Order["status"]) => void }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
    {orders.length === 0 ? (
      <div className="text-center py-16">
        <ShoppingBag className="w-14 h-14 mx-auto text-muted-foreground/20 mb-3" />
        <p className="text-muted-foreground text-sm">Aucune commande</p>
      </div>
    ) : (
      orders.map((order, i) => {
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
            onAdd={(s) => { addService(s); setShowAdd(false); toast.success("Service ajouté !"); }}
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
                  onSave={(s) => { updateService(s); toast.success("Service mis à jour !"); }}
                  onDelete={() => { removeService(service.id); toast.success("Service supprimé"); setEditingId(null); }}
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

export default AdminPage;
