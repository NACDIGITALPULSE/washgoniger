import { useAppState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, ShoppingBag, TrendingUp, CheckCircle2, Clock, XCircle, Settings, Plus, Trash2, Save, ArrowLeft, LogOut, Bell, MessageCircle, Search, Filter, Users, DollarSign, Send, UserCheck } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Order, Service, ServiceOption } from "@/lib/services";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";
import logo from "@/assets/logo.png";

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

const ADMIN_WHATSAPP = "22788082987";
const CHART_COLORS = ["hsl(215, 80%, 48%)", "hsl(155, 60%, 42%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(270, 60%, 50%)"];

const AdminPage = () => {
  const { orders, updateOrderStatus, services, updateService, addService, removeService } = useAppState();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"dashboard" | "orders" | "services" | "promos" | "notifications">("dashboard");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login", { replace: true }); return; }
      const { data: roleData } = await supabase
        .from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
      if (!roleData) { await supabase.auth.signOut(); navigate("/login", { replace: true }); }
    };
    checkAuth();
  }, [navigate]);

  // Realtime notifications
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const n = payload.new as any;
        const msg = `🔔 *Nouvelle commande WashGo !*\n\n📋 Service: *${n.service_name}*\n👤 Client: *${n.client_name}*\n📞 Tél: ${n.client_phone}\n💰 Total: *${Number(n.total).toLocaleString("fr-FR")} FCFA*`;
        toast.success(`🔔 Nouvelle commande !`, {
          description: `${n.service_name} — ${n.client_name} (${Number(n.total).toLocaleString("fr-FR")} FCFA)`,
          duration: 15000,
          action: { label: "📱 WhatsApp", onClick: () => window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank") },
        });
        try { const a = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczJj+QxN3LdUMtQYC02NZ+TDM+eLHX2YlVODx0rNPXkFw7OnSu1deMYDs5c7DV2JRgPDlxr9bZlWI9OXKw1tqVYj45c7HX25ViPjp1s9nclmM/O3i22d2YZD87d7bZ3pllQDt4t9remWVAO3i42d+ZZUA8eLna35plQDx5utremGVAPHm62t+ZZUA8ebrb35plQDx5u9vfmmZAPXm729+aZkA9ebzc4JtmQD15vNzgm2ZAPnm83OCbZ0A+eb3d4JxnQD55vd3gnGdAPnm93eCcZ0A+eb3d4JxnQD55vd3gnGdAPnm93eCcaEA="); a.volume = 0.5; a.play().catch(() => {}); } catch {}
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
    toast.success("Déconnexion réussie");
  };

  const totalRevenue = orders.filter((o) => o.status === "completed").reduce((sum, o) => sum + o.total, 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const completedCount = orders.filter((o) => o.status === "completed").length;
  const uniqueClients = new Set(orders.map((o) => o.clientPhone)).size;

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="hero-gradient px-4 pt-6 pb-10 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="container max-w-lg mx-auto relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="WashGo" className="w-9 h-9 rounded-xl object-contain" />
              <div>
                <h1 className="text-xl font-extrabold text-primary-foreground">Admin Panel</h1>
                <p className="text-sm text-primary-foreground/60">WashGo Niger</p>
              </div>
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
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: TrendingUp, label: "Revenus", value: `${(totalRevenue / 1000).toFixed(0)}k F` },
              { icon: Clock, label: "En attente", value: pendingCount.toString() },
              { icon: CheckCircle2, label: "Terminées", value: completedCount.toString() },
              { icon: Users, label: "Clients", value: uniqueClients.toString() },
            ].map((stat) => (
              <div key={stat.label} className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-2.5 text-center border border-primary-foreground/10">
                <stat.icon className="w-3.5 h-3.5 mx-auto mb-1 text-primary-foreground/70" />
                <div className="text-sm font-extrabold text-primary-foreground">{stat.value}</div>
                <div className="text-[9px] text-primary-foreground/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container max-w-lg mx-auto px-4 -mt-5 relative z-10">
        <div className="glass-card rounded-2xl p-1 flex mb-6 shadow-lg overflow-x-auto scrollbar-none">
          {([
            { key: "dashboard" as const, label: "📊 Stats" },
            { key: "orders" as const, label: "📋 Commandes" },
            { key: "notifications" as const, label: "🔔 Notifs" },
            { key: "services" as const, label: "⚙️ Services" },
            { key: "promos" as const, label: "🏷️ Promos" },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-xl text-[11px] font-semibold transition-all whitespace-nowrap px-2 ${
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
          {tab === "notifications" && <NotificationsTab key="notif" orders={orders} />}
          {tab === "services" && <ServicesTab key="svc" services={services} updateService={updateService} addService={addService} removeService={removeService} />}
          {tab === "promos" && <PromosTab key="promo" />}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ── Advanced Dashboard ──
const DashboardTab = ({ orders, totalRevenue }: { orders: Order[]; totalRevenue: number }) => {
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(statusLabels).map(([key, { label }]) => ({
      name: label, value: counts[key] || 0,
    })).filter((d) => d.value > 0);
  }, [orders]);

  const serviceData = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    orders.forEach((o) => {
      const k = o.service.name;
      map[k] = map[k] || { count: 0, revenue: 0 };
      map[k].count += 1;
      if (o.status === "completed") map[k].revenue += o.total;
    });
    return Object.entries(map).map(([name, d]) => ({ name: name.length > 10 ? name.slice(0, 10) + "…" : name, commandes: d.count, revenus: d.revenue }));
  }, [orders]);

  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    orders.filter((o) => o.status === "completed").forEach((o) => {
      const d = new Date(o.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
      map[d] = (map[d] || 0) + o.total;
    });
    return Object.entries(map).slice(-7).map(([date, total]) => ({ date, total }));
  }, [orders]);

  const avgOrderValue = orders.length > 0 ? Math.round(orders.reduce((s, o) => s + o.total, 0) / orders.length) : 0;
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString()).length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Commandes totales", value: orders.length, icon: ShoppingBag, color: "text-primary" },
          { label: "Aujourd'hui", value: todayOrders, icon: Clock, color: "text-warning" },
          { label: "Chiffre d'affaires", value: `${totalRevenue.toLocaleString("fr-FR")} F`, icon: DollarSign, color: "text-success" },
          { label: "Panier moyen", value: `${avgOrderValue.toLocaleString("fr-FR")} F`, icon: TrendingUp, color: "text-primary" },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              <span className="text-[11px] text-muted-foreground font-medium">{kpi.label}</span>
            </div>
            <div className="text-lg font-extrabold text-foreground">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Status pie chart */}
      {statusData.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-3 text-sm">📊 Répartition par statut</h3>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={25} outerRadius={50} dataKey="value" paddingAngle={3}>
                    {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {statusData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-muted-foreground flex-1">{d.name}</span>
                  <span className="font-bold text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Revenue by service */}
      {serviceData.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-3 text-sm">💰 Revenus par service</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString("fr-FR")} F`} />
                <Bar dataKey="revenus" fill="hsl(215, 80%, 48%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Daily trend */}
      {dailyData.length > 1 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-3 text-sm">📈 Tendance (7 derniers jours)</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 88%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString("fr-FR")} F`} />
                <Line type="monotone" dataKey="total" stroke="hsl(155, 60%, 42%)" strokeWidth={2} dot={{ fill: "hsl(155, 60%, 42%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top clients */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-bold text-foreground mb-3 text-sm">👥 Top clients</h3>
        <div className="space-y-2">
          {Object.entries(
            orders.reduce<Record<string, { name: string; phone: string; count: number; total: number }>>((acc, o) => {
              acc[o.clientPhone] = acc[o.clientPhone] || { name: o.clientName, phone: o.clientPhone, count: 0, total: 0 };
              acc[o.clientPhone].count += 1;
              acc[o.clientPhone].total += o.total;
              return acc;
            }, {})
          ).sort(([, a], [, b]) => b.total - a.total).slice(0, 5).map(([phone, c]) => (
            <div key={phone} className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium text-foreground">{c.name}</span>
                <span className="text-muted-foreground text-xs ml-2">{c.count} cmd</span>
              </div>
              <span className="font-bold text-primary">{c.total.toLocaleString("fr-FR")} F</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ── Notifications Tab ──
const NotificationsTab = ({ orders }: { orders: Order[] }) => {
  const [message, setMessage] = useState("");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const uniqueClients = useMemo(() => {
    const map: Record<string, { name: string; phone: string; lastOrder?: Order }> = {};
    orders.forEach((o) => {
      if (!map[o.clientPhone] || new Date(o.createdAt) > new Date(map[o.clientPhone].lastOrder?.createdAt || 0)) {
        map[o.clientPhone] = { name: o.clientName, phone: o.clientPhone, lastOrder: o };
      }
    });
    return Object.values(map);
  }, [orders]);

  const toggleClient = (phone: string) => {
    setSelectedClients((prev) => prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]);
  };

  const toggleAll = () => {
    if (selectAll) { setSelectedClients([]); } else { setSelectedClients(uniqueClients.map((c) => c.phone)); }
    setSelectAll(!selectAll);
  };

  const buildWhatsAppMessage = (clientName: string) => {
    return `Bonjour *${clientName}*,\n\n${message}\n\n🚗✨ *WashGo Niger*\n📞 +227 88 08 29 87\n🌐 washgoniger.lovable.app`;
  };

  const sendIndividual = (client: { name: string; phone: string }) => {
    const cleanPhone = client.phone.replace(/\D/g, "");
    const fullPhone = cleanPhone.startsWith("227") ? cleanPhone : `227${cleanPhone}`;
    const msg = buildWhatsAppMessage(client.name);
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const sendToSelected = () => {
    if (!message.trim()) { toast.error("Écrivez un message d'abord"); return; }
    if (selectedClients.length === 0) { toast.error("Sélectionnez au moins un client"); return; }
    const clients = uniqueClients.filter((c) => selectedClients.includes(c.phone));
    // Open first one immediately
    if (clients.length > 0) sendIndividual(clients[0]);
    // Queue rest with delays
    clients.slice(1).forEach((client, i) => {
      setTimeout(() => sendIndividual(client), (i + 1) * 2000);
    });
    toast.success(`Envoi en cours vers ${clients.length} client(s)...`);
  };

  // Notify about order status
  const sendStatusNotification = (order: Order) => {
    const cleanPhone = order.clientPhone.replace(/\D/g, "");
    const fullPhone = cleanPhone.startsWith("227") ? cleanPhone : `227${cleanPhone}`;
    const statusMsg: Record<string, string> = {
      pending: "en attente de validation",
      accepted: "acceptée ✅",
      in_progress: "en cours de traitement 🔄",
      completed: "terminée ✅🎉",
      cancelled: "annulée ❌",
    };
    const msg = `Bonjour *${order.clientName}*,\n\nVotre commande *${order.service.name}* (${order.orderNumber || ""}) est maintenant *${statusMsg[order.status] || order.status}*.\n\n💰 Total: *${order.total.toLocaleString("fr-FR")} FCFA*\n\nMerci pour votre confiance !\n\n🚗✨ *WashGo Niger*\n📞 +227 88 08 29 87`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // In-progress orders for status notifications
  const activeOrders = orders.filter((o) => o.status !== "completed" && o.status !== "cancelled");

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      {/* Compose message */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-bold text-foreground mb-3 text-sm flex items-center gap-2">
          <Send className="w-4 h-4 text-primary" /> Envoyer une notification
        </h3>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Écrivez votre message ici... (ex: Nouvelle offre spéciale !)"
          className="w-full rounded-xl border border-border bg-background p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="flex gap-2 mt-3">
          <Button variant="hero" size="sm" className="rounded-xl flex-1" onClick={sendToSelected}>
            <Send className="w-4 h-4" /> Envoyer ({selectedClients.length})
          </Button>
        </div>
      </div>

      {/* Client list */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Clients ({uniqueClients.length})
          </h3>
          <button onClick={toggleAll} className="text-xs font-semibold text-primary">
            {selectAll ? "Tout désélectionner" : "Tout sélectionner"}
          </button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {uniqueClients.map((client) => (
            <div key={client.phone} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={selectedClients.includes(client.phone)}
                onChange={() => toggleClient(client.phone)}
                className="w-4 h-4 rounded accent-primary"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground text-sm truncate">{client.name}</div>
                <div className="text-[11px] text-muted-foreground">{client.phone}</div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => {
                if (!message.trim()) { toast.error("Écrivez un message"); return; }
                sendIndividual(client);
              }}>
                <MessageCircle className="w-4 h-4 text-success" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Active order notifications */}
      {activeOrders.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-3 text-sm flex items-center gap-2">
            <Bell className="w-4 h-4 text-warning" /> Notifications de statut
          </h3>
          <p className="text-xs text-muted-foreground mb-3">Notifiez vos clients du statut de leur prestation</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {activeOrders.map((order) => {
              const status = statusLabels[order.status];
              return (
                <div key={order.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm truncate">{order.clientName}</div>
                    <div className="text-[11px] text-muted-foreground">{order.service.name} • <span className={`${status.color} text-primary-foreground px-1.5 py-0.5 rounded-full text-[9px] font-semibold`}>{status.label}</span></div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl text-xs shrink-0" onClick={() => sendStatusNotification(order)}>
                    <MessageCircle className="w-3.5 h-3.5 text-success" /> WhatsApp
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ── Orders Tab ──
const OrdersTab = ({ orders, updateOrderStatus }: { orders: Order[]; updateOrderStatus: (id: string, status: Order["status"]) => void }) => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const openWhatsApp = (order: Order) => {
    const cleanPhone = order.clientPhone.replace(/\D/g, "");
    const fullPhone = cleanPhone.startsWith("227") ? cleanPhone : `227${cleanPhone}`;
    const statusMsg: Record<string, string> = {
      pending: "en attente",
      accepted: "acceptée ✅",
      in_progress: "en cours 🔄",
      completed: "terminée ✅🎉",
      cancelled: "annulée",
    };
    const message = `Bonjour *${order.clientName}*,\n\nVotre commande *${order.service.name}* ${order.orderNumber ? `(${order.orderNumber})` : ""} est *${statusMsg[order.status]}*.\n\n💰 Total: *${order.total.toLocaleString("fr-FR")} FCFA*\n\nMerci !\n🚗✨ *WashGo Niger*`;
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
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher un client..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl text-sm h-9" />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {filterButtons.map((f) => (
          <button key={f.key} onClick={() => setStatusFilter(f.key)} className={`whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${statusFilter === f.key ? "hero-gradient text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {f.label}
            {f.key !== "all" && <span className="ml-1 opacity-70">{orders.filter((o) => o.status === f.key).length}</span>}
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
            <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass-card rounded-2xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-foreground text-sm">
                    {order.service.icon} {order.service.name} — {order.selectedOption.name}
                    {order.quantity > 1 && <span className="text-muted-foreground font-normal ml-1">× {order.quantity}{order.selectedOption.unit === "kg" ? " kg" : ""}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{order.clientName} • {order.clientPhone}</div>
                  {order.orderNumber && <div className="text-[10px] text-primary font-semibold">#{order.orderNumber}</div>}
                  <div className="text-xs text-muted-foreground">
                    {order.location === "domicile" ? `📍 ${order.address}` : "🏪 Sur place"} • {order.payment === "cash" ? "💵 Cash" : `📱 ${order.payment}`}
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full text-primary-foreground ${status.color}`}>{status.label}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-sm font-extrabold text-primary">{order.total.toLocaleString("fr-FR")} FCFA</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl text-success border-success/20 hover:bg-success/5" onClick={() => openWhatsApp(order)}>
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  {order.status === "pending" && (
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => updateOrderStatus(order.id, "cancelled")}>Refuser</Button>
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
const ServicesTab = ({ services, updateService, addService, removeService }: { services: Service[]; updateService: (s: Service) => void; addService: (s: Service) => void; removeService: (id: string) => void }) => {
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
          <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setEditingId(editingId === service.id ? null : service.id)}>
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
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <ServiceEditor service={service} onSave={async (s) => { await updateService(s); toast.success("Service mis à jour !"); }} onDelete={async () => { await removeService(service.id); toast.success("Service supprimé"); setEditingId(null); }} />
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
          <button onClick={() => setOptions([...options, { id: crypto.randomUUID(), name: "", price: 0, unit: "piece" }])} className="text-xs font-semibold text-primary flex items-center gap-1">
            <Plus className="w-3 h-3" /> Ajouter
          </button>
        </div>
        {options.map((opt, idx) => (
          <div key={opt.id} className="flex gap-2 items-center">
            <Input value={opt.name} onChange={(e) => updateOption(idx, "name", e.target.value)} className="rounded-xl text-sm flex-1" placeholder="Nom" />
            <Input type="number" value={opt.price} onChange={(e) => updateOption(idx, "price", parseInt(e.target.value) || 0)} className="rounded-xl text-sm w-24" placeholder="Prix" />
            <select value={opt.unit || "piece"} onChange={(e) => updateOption(idx, "unit", e.target.value)} className="rounded-xl text-sm bg-muted text-foreground px-2 py-2 border border-border">
              <option value="piece">Pièce</option>
              <option value="kg">Kg</option>
            </select>
            <button onClick={() => setOptions(options.filter((_, i) => i !== idx))} className="text-destructive hover:text-destructive/80 p-1">
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
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="glass-card rounded-2xl p-4 space-y-3 overflow-hidden">
      <h4 className="font-bold text-foreground text-sm">Nouveau service</h4>
      <div className="grid grid-cols-[48px_1fr] gap-2">
        <Input value={icon} onChange={(e) => setIcon(e.target.value)} className="text-center rounded-xl" />
        <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" placeholder="Nom du service" />
      </div>
      <Input value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl" placeholder="Description" />
      <select value={category} onChange={(e) => setCategory(e.target.value as "auto" | "pressing")} className="w-full rounded-xl text-sm bg-muted text-foreground px-3 py-2.5 border border-border">
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
    if (error) { toast.error(error.message.includes("duplicate") ? "Ce code existe déjà" : "Erreur"); return; }
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
              <Button variant="hero" size="sm" className="flex-1 rounded-xl" onClick={addPromo}><Plus className="w-4 h-4" /> Créer</Button>
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
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>{p.active ? "Actif" : "Inactif"}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  -{p.discount_type === "percentage" ? `${p.discount_value}%` : `${Number(p.discount_value).toLocaleString("fr-FR")} FCFA`}
                  {p.min_order > 0 && ` • Min ${Number(p.min_order).toLocaleString("fr-FR")} F`}
                  {p.max_uses && ` • ${p.used_count}/${p.max_uses} utilisations`}
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" className="rounded-xl flex-1 text-xs" onClick={() => toggleActive(p.id, p.active)}>{p.active ? "Désactiver" : "Activer"}</Button>
              <Button variant="outline" size="sm" className="rounded-xl text-xs text-destructive" onClick={() => deletePromo(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        ))
      )}
    </motion.div>
  );
};

export default AdminPage;
