import { useAppState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, ShoppingBag, TrendingUp, CheckCircle2, Clock, XCircle, Settings,
  Plus, Trash2, Save, ArrowLeft, LogOut, Bell, MessageCircle, Search, Filter,
  Users, DollarSign, Send, UserCheck, Eye, EyeOff, Key, Mail, Calendar,
  Activity, Target, Percent, Archive, FileImage, Download, PackageCheck, Home as HomeIcon, AlertTriangle, Database,
  Calculator, FileText, FileSpreadsheet, File
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Order, Service, ServiceOption } from "@/lib/services";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, AreaChart, Area, Line
} from "recharts";
import logo from "@/assets/logo.png";

const statusActions: Record<string, { next: Order["status"]; label: string }> = {
  pending: { next: "accepted", label: "Accepter" },
  accepted: { next: "in_progress", label: "Démarrer" },
  in_progress: { next: "ready", label: "Prêt" },
  ready: { next: "delivered", label: "Livrer" },
  delivered: { next: "completed", label: "Terminer" },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-warning" },
  accepted: { label: "Acceptée", color: "bg-primary" },
  in_progress: { label: "En cours", color: "bg-primary" },
  ready: { label: "Prête", color: "bg-secondary" },
  delivered: { label: "Livrée", color: "bg-secondary" },
  completed: { label: "Terminée", color: "bg-success" },
  cancelled: { label: "Annulée", color: "bg-destructive" },
};

const ADMIN_WHATSAPP = "22788082987";
const CHART_COLORS = ["hsl(215, 80%, 48%)", "hsl(155, 60%, 42%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(270, 60%, 50%)", "hsl(190, 70%, 45%)"];

type TabKey = "dashboard" | "orders" | "users" | "notifications" | "receipts" | "accounting" | "services" | "promos" | "data";

const AdminPage = () => {
  const { orders, updateOrderStatus, services, updateService, addService, removeService } = useAppState();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("dashboard");

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

  useEffect(() => {
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const n = payload.new as any;
        toast.success(`🔔 Nouvelle commande !`, {
          description: `${n.service_name} — ${n.client_name} (${Number(n.total).toLocaleString("fr-FR")} FCFA)`,
          duration: 15000,
        });
        try { new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczJj+QxN3LdUMtQYC02NZ+TDM+eLHX2YlVODx0rNPXkFw7OnSu1deMYDs5c7DV2JRgPDlxr9bZlWI9OXKw1tqVYj45c7HX25ViPjp1s9nclmM/O3i22d2YZD87d7bZ3pllQDt4t9remWVAO3i42d+ZZUA8eLna35plQDx5utremGVAPHm62t+ZZUA8ebrb35plQDx5u9vfmmZAPXm729+aZkA9ebzc4JtmQD15vNzgm2ZAPnm83OCbZ0A+eb3d4JxnQD55vd3gnGdAPnm93eCcZ0A+eb3d4JxnQD55vd3gnGdAPnm93eCcaEA=").play().catch(() => {}); } catch {}
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

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: "dashboard", label: "Stats", icon: "📊" },
    { key: "orders", label: "Cmd", icon: "📋" },
    { key: "users", label: "Users", icon: "👥" },
    { key: "notifications", label: "Notifs", icon: "🔔" },
    { key: "receipts", label: "Reçus", icon: "🧾" },
    { key: "accounting", label: "Compta", icon: "📈" },
    { key: "services", label: "Svcs", icon: "⚙️" },
    { key: "promos", label: "Promos", icon: "🏷️" },
    { key: "data", label: "Data", icon: "🗑️" },
  ];

  return (
    <div className="min-h-screen pb-8 bg-background">
      {/* Header */}
      <div className="hero-gradient px-4 pt-5 pb-8 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="container max-w-4xl mx-auto relative">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="WashGo" className="w-8 h-8 rounded-lg object-contain" />
              <div>
                <h1 className="text-lg font-extrabold text-primary-foreground leading-none">Admin</h1>
                <p className="text-[10px] text-primary-foreground/50">WashGo Niger</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate("/")} className="text-primary-foreground/60 text-xs font-medium hover:text-primary-foreground flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Retour
              </button>
              <button onClick={handleLogout} className="text-primary-foreground/60 hover:text-primary-foreground ml-1">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: TrendingUp, label: "Revenus", value: `${(totalRevenue / 1000).toFixed(0)}k` },
              { icon: Clock, label: "Attente", value: pendingCount.toString() },
              { icon: CheckCircle2, label: "Terminé", value: completedCount.toString() },
              { icon: Users, label: "Clients", value: uniqueClients.toString() },
            ].map((stat) => (
              <div key={stat.label} className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-2 text-center border border-primary-foreground/10">
                <stat.icon className="w-3.5 h-3.5 mx-auto mb-0.5 text-primary-foreground/60" />
                <div className="text-sm font-extrabold text-primary-foreground leading-none">{stat.value}</div>
                <div className="text-[8px] text-primary-foreground/40 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container max-w-4xl mx-auto px-4 -mt-4 relative z-10">
        <div className="glass-card rounded-2xl p-1 flex shadow-lg overflow-x-auto scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 min-w-[55px] py-2 rounded-xl text-[10px] font-semibold transition-all whitespace-nowrap text-center ${
                tab === t.key ? "hero-gradient text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="mt-5">
          <AnimatePresence mode="wait">
            {tab === "dashboard" && <DashboardTab key="dash" orders={orders} totalRevenue={totalRevenue} />}
            {tab === "orders" && <OrdersTab key="ord" orders={orders} updateOrderStatus={updateOrderStatus} />}
            {tab === "users" && <UsersTab key="usr" />}
            {tab === "notifications" && <NotificationsTab key="notif" orders={orders} />}
            {tab === "receipts" && <ReceiptsTab key="rcpt" orders={orders} />}
            {tab === "accounting" && <AccountingTab key="acct" orders={orders} />}
            {tab === "services" && <ServicesTab key="svc" services={services} updateService={updateService} addService={addService} removeService={removeService} />}
            {tab === "promos" && <PromosTab key="promo" />}
            {tab === "data" && <DataTab key="data" />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// ── Dashboard Tab ──
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
    return Object.entries(map).map(([name, d]) => ({ name: name.length > 12 ? name.slice(0, 12) + "…" : name, commandes: d.count, revenus: d.revenue }));
  }, [orders]);

  const dailyData = useMemo(() => {
    const map: Record<string, { revenue: number; orders: number }> = {};
    orders.forEach((o) => {
      const d = new Date(o.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
      map[d] = map[d] || { revenue: 0, orders: 0 };
      map[d].orders += 1;
      if (o.status === "completed") map[d].revenue += o.total;
    });
    return Object.entries(map).slice(-14).map(([date, d]) => ({ date, revenus: d.revenue, commandes: d.orders }));
  }, [orders]);

  const paymentData = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => {
      const p = o.payment === "cash" ? "Cash" : o.payment.charAt(0).toUpperCase() + o.payment.slice(1);
      map[p] = (map[p] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const avgOrderValue = orders.length > 0 ? Math.round(orders.reduce((s, o) => s + o.total, 0) / orders.length) : 0;
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString()).length;
  const todayRevenue = orders.filter((o) => o.status === "completed" && new Date(o.createdAt).toDateString() === new Date().toDateString()).reduce((s, o) => s + o.total, 0);
  const conversionRate = orders.length > 0 ? Math.round((orders.filter(o => o.status === "completed").length / orders.length) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      {/* KPI cards - responsive grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Commandes", value: orders.length, icon: ShoppingBag, color: "text-primary", sub: `${todayOrders} aujourd'hui` },
          { label: "Chiffre d'affaires", value: `${totalRevenue.toLocaleString("fr-FR")} F`, icon: DollarSign, color: "text-success", sub: `${todayRevenue.toLocaleString("fr-FR")} F aujourd'hui` },
          { label: "Panier moyen", value: `${avgOrderValue.toLocaleString("fr-FR")} F`, icon: Target, color: "text-primary" },
          { label: "Taux conversion", value: `${conversionRate}%`, icon: Percent, color: "text-secondary" },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
              </div>
            </div>
            <div className="text-lg font-extrabold text-foreground leading-tight">{kpi.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</div>
            {kpi.sub && <div className="text-[9px] text-muted-foreground/60 mt-0.5">{kpi.sub}</div>}
          </div>
        ))}
      </div>

      {/* Charts - responsive layout */}
      <div className="grid md:grid-cols-2 gap-4">
        {dailyData.length > 1 && (
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-bold text-foreground mb-3 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Tendance revenus
            </h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRevenu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(215, 80%, 48%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(215, 80%, 48%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 90%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(v: number) => `${v.toLocaleString("fr-FR")} F`} />
                  <Area type="monotone" dataKey="revenus" stroke="hsl(215, 80%, 48%)" strokeWidth={2} fill="url(#colorRevenu)" />
                  <Line type="monotone" dataKey="commandes" stroke="hsl(155, 60%, 42%)" strokeWidth={1.5} dot={false} yAxisId={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {serviceData.length > 0 && (
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-bold text-foreground mb-3 text-sm">💰 Revenus par service</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 90%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(v: number) => `${v.toLocaleString("fr-FR")} F`} />
                  <Bar dataKey="revenus" fill="hsl(215, 80%, 48%)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="commandes" fill="hsl(155, 60%, 42%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Pie charts */}
      <div className="grid grid-cols-2 gap-3">
        {statusData.length > 0 && (
          <div className="glass-card rounded-2xl p-4">
            <h3 className="font-bold text-foreground mb-2 text-xs">Statuts</h3>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={20} outerRadius={42} dataKey="value" paddingAngle={3}>
                    {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 mt-2">
              {statusData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-[10px]">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-muted-foreground flex-1 truncate">{d.name}</span>
                  <span className="font-bold text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {paymentData.length > 0 && (
          <div className="glass-card rounded-2xl p-4">
            <h3 className="font-bold text-foreground mb-2 text-xs">Paiements</h3>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" innerRadius={20} outerRadius={42} dataKey="value" paddingAngle={3}>
                    {paymentData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 mt-2">
              {paymentData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-[10px]">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[(i + 2) % CHART_COLORS.length] }} />
                  <span className="text-muted-foreground flex-1 truncate">{d.name}</span>
                  <span className="font-bold text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
          ).sort(([, a], [, b]) => b.total - a.total).slice(0, 5).map(([phone, c], i) => (
            <div key={phone} className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 rounded-full hero-gradient flex items-center justify-center text-[10px] font-bold text-primary-foreground">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-foreground truncate block">{c.name}</span>
                <span className="text-[10px] text-muted-foreground">{c.count} cmd • {c.phone}</span>
              </div>
              <span className="font-bold text-primary text-xs">{c.total.toLocaleString("fr-FR")} F</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ── Orders Tab with archive ──
const OrdersTab = ({ orders, updateOrderStatus }: { orders: Order[]; updateOrderStatus: (id: string, status: Order["status"]) => void }) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const deleteOrder = async (id: string) => {
    if (!confirm("Supprimer cette commande ?")) return;
    await supabase.from("orders").delete().eq("id", id);
    toast.success("Commande supprimée");
    window.location.reload();
  };

  const openWhatsApp = (order: Order) => {
    const p = order.clientPhone.replace(/\D/g, "");
    const fullPhone = p.startsWith("227") ? p : `227${p}`;
    const statusMsg: Record<string, string> = { pending: "en attente", accepted: "acceptée ✅", in_progress: "en cours 🔄", ready: "prête 📦", delivered: "livrée 🚚", completed: "terminée ✅🎉", cancelled: "annulée" };
    const message = `Bonjour *${order.clientName}*,\n\nVotre commande *${order.service.name}* ${order.orderNumber ? `(${order.orderNumber})` : ""} est *${statusMsg[order.status]}*.\n\n💰 Total: *${order.total.toLocaleString("fr-FR")} FCFA*\n\nMerci !\n🚗✨ *WashGo Niger*`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const archivedStatuses = ["completed", "cancelled"];
  const allFiltered = orders.filter((o) => {
    const isArchived = archivedStatuses.includes(o.status);
    if (showArchived !== isArchived) return false;
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchSearch = !searchQuery || o.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || o.clientPhone.includes(searchQuery) || (o.orderNumber || "").includes(searchQuery.toUpperCase());
    return matchStatus && matchSearch;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher (nom, tél, n°)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl text-sm h-9" />
        </div>
        <Button
          variant={showArchived ? "default" : "outline"}
          size="sm"
          className="rounded-xl h-9 text-xs"
          onClick={() => setShowArchived(!showArchived)}
        >
          <Archive className="w-3.5 h-3.5 mr-1" />
          {showArchived ? "Actives" : "Archives"}
        </Button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: "all", label: "Toutes" },
          ...(showArchived
            ? [{ key: "completed", label: "Terminées" }, { key: "cancelled", label: "Annulées" }]
            : [{ key: "pending", label: "Attente" }, { key: "accepted", label: "Acceptées" }, { key: "in_progress", label: "En cours" }, { key: "ready", label: "Prêtes" }, { key: "delivered", label: "Livrées" }]
          ),
        ].map((f) => (
          <button key={f.key} onClick={() => setStatusFilter(f.key)} className={`whitespace-nowrap text-[10px] font-semibold px-3 py-1.5 rounded-full transition-all ${statusFilter === f.key ? "hero-gradient text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {f.label}
            {f.key !== "all" && <span className="ml-1 opacity-70">{orders.filter((o) => o.status === f.key).length}</span>}
          </button>
        ))}
      </div>

      {allFiltered.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-muted-foreground text-sm">Aucune commande</p>
        </div>
      ) : (
        allFiltered.map((order, i) => {
          const status = statusLabels[order.status];
          const action = statusActions[order.status];
          return (
            <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-card rounded-2xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-foreground text-sm">
                    {order.service.icon} {order.service.name} — {order.selectedOption.name}
                    {order.quantity > 1 && <span className="text-muted-foreground font-normal ml-1">× {order.quantity}</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{order.clientName} • {order.clientPhone}</div>
                  {order.orderNumber && <div className="text-[10px] text-primary font-semibold">#{order.orderNumber}</div>}
                  <div className="text-[10px] text-muted-foreground">
                    {order.location === "domicile" ? `📍 ${order.address}` : "🏪 Sur place"} • {order.payment === "cash" ? "💵 Cash" : `💳 ${order.payment}`}
                  </div>
                </div>
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full text-primary-foreground ${status?.color || "bg-muted"}`}>{status?.label || order.status}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm font-extrabold text-primary">{order.total.toLocaleString("fr-FR")} F</span>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="rounded-xl h-7 px-2 text-success border-success/20" onClick={() => openWhatsApp(order)}>
                    <MessageCircle className="w-3.5 h-3.5" />
                  </Button>
                  {order.status === "pending" && (
                    <Button variant="outline" size="sm" className="rounded-xl h-7 px-2 text-xs" onClick={() => updateOrderStatus(order.id, "cancelled")}>Refuser</Button>
                  )}
                  {action && (
                    <Button variant="success" size="sm" className="rounded-xl h-7 px-2 text-xs" onClick={() => updateOrderStatus(order.id, action.next)}>
                      {action.label}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="rounded-xl h-7 px-2 text-xs text-destructive" onClick={() => deleteOrder(order.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })
      )}
    </motion.div>
  );
};

// ── Users Tab ──
const UsersTab = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      const res = await supabase.functions.invoke("manage-users", { body: { action: "list" } });
      if (res.data) { setUsers(res.data.users || []); setRoles(res.data.roles || []); }
    } catch { toast.error("Erreur chargement utilisateurs"); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const deleteUser = async (userId: string) => {
    if (!confirm("Supprimer ce compte ?")) return;
    const res = await supabase.functions.invoke("manage-users", { body: { action: "delete", userId } });
    if (res.data?.success) { toast.success("Compte supprimé"); fetchUsers(); } else toast.error("Erreur");
  };

  const updatePassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) { toast.error("Min 6 caractères"); return; }
    const res = await supabase.functions.invoke("manage-users", { body: { action: "update_password", userId, password: newPassword } });
    if (res.data?.success) { toast.success("Mot de passe mis à jour"); setEditingUser(null); setNewPassword(""); } else toast.error("Erreur");
  };

  const getUserRole = (userId: string) => roles.find((r: any) => r.user_id === userId)?.role || "user";
  const filteredUsers = users.filter((u) => !searchQuery || u.email?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Utilisateurs ({users.length})
        </h3>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher par email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl text-sm h-9" />
      </div>
      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12"><Users className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" /><p className="text-muted-foreground text-sm">Aucun utilisateur</p></div>
      ) : (
        filteredUsers.map((user) => {
          const role = getUserRole(user.id);
          const isEditing = editingUser === user.id;
          return (
            <motion.div key={user.id} className="glass-card rounded-2xl overflow-hidden" layout>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 ${role === "admin" ? "hero-gradient text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {role === "admin" ? "👑" : "👤"}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-foreground text-sm truncate flex items-center gap-2">
                        {user.email}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${role === "admin" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>{role}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{new Date(user.created_at).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => { setEditingUser(isEditing ? null : user.id); setNewPassword(""); }} className="p-1.5 rounded-lg hover:bg-muted"><Key className="w-3.5 h-3.5 text-primary" /></button>
                    <button onClick={() => deleteUser(user.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                  </div>
                </div>
                <AnimatePresence>
                  {isEditing && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="mt-3 pt-3 border-t border-border flex gap-2">
                        <div className="relative flex-1">
                          <Input type={showPassword ? "text" : "password"} placeholder="Nouveau mot de passe" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-xl text-sm h-8 pr-8" />
                          <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1.5">
                            {showPassword ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
                          </button>
                        </div>
                        <Button variant="hero" size="sm" className="rounded-xl h-8 text-xs" onClick={() => updatePassword(user.id)}><Save className="w-3 h-3" /> OK</Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })
      )}
    </motion.div>
  );
};

// ── Notifications Tab ──
const NotificationsTab = ({ orders }: { orders: Order[] }) => {
  const [message, setMessage] = useState("");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const uniqueClients = useMemo(() => {
    const map: Record<string, { name: string; phone: string }> = {};
    orders.forEach((o) => { if (!map[o.clientPhone]) map[o.clientPhone] = { name: o.clientName, phone: o.clientPhone }; });
    return Object.values(map);
  }, [orders]);

  const toggleClient = (phone: string) => setSelectedClients((prev) => prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]);
  const toggleAll = () => { if (selectAll) setSelectedClients([]); else setSelectedClients(uniqueClients.map((c) => c.phone)); setSelectAll(!selectAll); };

  const buildMsg = (name: string) => `Bonjour *${name}*,\n\n${message}\n\n🚗✨ *WashGo Niger*\n📞 +227 88 08 29 87`;
  const sendTo = (client: { name: string; phone: string }) => {
    const p = client.phone.replace(/\D/g, "");
    window.open(`https://wa.me/${p.startsWith("227") ? p : `227${p}`}?text=${encodeURIComponent(buildMsg(client.name))}`, "_blank");
  };

  const sendToSelected = () => {
    if (!message.trim()) { toast.error("Écrivez un message"); return; }
    if (selectedClients.length === 0) { toast.error("Sélectionnez des clients"); return; }
    const clients = uniqueClients.filter((c) => selectedClients.includes(c.phone));
    if (clients.length > 0) sendTo(clients[0]);
    clients.slice(1).forEach((c, i) => setTimeout(() => sendTo(c), (i + 1) * 2000));
    toast.success(`Envoi vers ${clients.length} client(s)...`);
  };

  const activeOrders = orders.filter((o) => !["completed", "cancelled"].includes(o.status));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-bold text-foreground mb-3 text-sm flex items-center gap-2">
          <Send className="w-4 h-4 text-primary" /> Envoyer une notification
        </h3>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Écrivez votre message..." className="w-full rounded-xl border border-border bg-background p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/20" />
        <Button variant="hero" size="sm" className="rounded-xl w-full mt-3" onClick={sendToSelected}>
          <Send className="w-4 h-4" /> Envoyer ({selectedClients.length})
        </Button>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-foreground text-sm">👥 Clients ({uniqueClients.length})</h3>
          <button onClick={toggleAll} className="text-xs font-semibold text-primary">{selectAll ? "Désélectionner" : "Tout sélectionner"}</button>
        </div>
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {uniqueClients.map((client) => (
            <div key={client.phone} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50">
              <input type="checkbox" checked={selectedClients.includes(client.phone)} onChange={() => toggleClient(client.phone)} className="w-4 h-4 rounded accent-primary" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground text-sm truncate">{client.name}</div>
                <div className="text-[10px] text-muted-foreground">{client.phone}</div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { if (!message.trim()) { toast.error("Écrivez un message"); return; } sendTo(client); }}>
                <MessageCircle className="w-3.5 h-3.5 text-success" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {activeOrders.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-3 text-sm flex items-center gap-2">
            <Bell className="w-4 h-4 text-warning" /> Notifications de statut
          </h3>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {activeOrders.map((order) => {
              const status = statusLabels[order.status];
              return (
                <div key={order.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm truncate">{order.clientName}</div>
                    <div className="text-[10px] text-muted-foreground">{order.service.name} • <span className={`${status?.color || "bg-muted"} text-primary-foreground px-1.5 py-0.5 rounded-full text-[9px] font-semibold`}>{status?.label || order.status}</span></div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl text-xs shrink-0" onClick={() => {
                    const p = order.clientPhone.replace(/\D/g, "");
                    const fullPhone = p.startsWith("227") ? p : `227${p}`;
                    const statusMsg: Record<string, string> = { pending: "en attente", accepted: "acceptée ✅", in_progress: "en cours 🔄", ready: "prête 📦", delivered: "livrée 🚚", completed: "terminée ✅🎉", cancelled: "annulée ❌" };
                    const msg = `Bonjour *${order.clientName}*,\n\nVotre commande *${order.service.name}* (${order.orderNumber || ""}) est *${statusMsg[order.status] || order.status}*.\n\n💰 Total: *${order.total.toLocaleString("fr-FR")} FCFA*\n\nMerci !\n🚗✨ *WashGo Niger*`;
                    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, "_blank");
                  }}>
                    <MessageCircle className="w-3 h-3 text-success" /> WA
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

// ── Receipts Tab ──
const ReceiptsTab = ({ orders }: { orders: Order[] }) => {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "cash" | "nita" | "amanata">("all");

  useEffect(() => {
    const fetchReceipts = async () => {
      const { data } = await supabase.from("payment_receipts").select("*").order("created_at", { ascending: false });
      setReceipts(data || []);
      setLoading(false);
    };
    fetchReceipts();
  }, []);

  const cashOrders = orders.filter(o => o.payment === "cash" && o.status !== "cancelled");

  const downloadReceipt = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = name;
    link.click();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
        {(["all", "cash", "nita", "amanata"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`whitespace-nowrap text-[10px] font-semibold px-3 py-1.5 rounded-full transition-all ${filter === f ? "hero-gradient text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {f === "all" ? "Tous" : f === "cash" ? "💵 Cash" : `💳 ${f.charAt(0).toUpperCase() + f.slice(1)}`}
          </button>
        ))}
      </div>

      {/* Cash receipts */}
      {(filter === "all" || filter === "cash") && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-3 text-sm">💵 Reçus Cash ({cashOrders.length})</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {cashOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun paiement cash</p>
            ) : cashOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground text-sm truncate">{order.clientName}</div>
                  <div className="text-[10px] text-muted-foreground">{order.service.name} • {order.total.toLocaleString("fr-FR")} F</div>
                  {order.orderNumber && <div className="text-[10px] text-primary font-semibold">#{order.orderNumber}</div>}
                </div>
                <div className="text-[10px] text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("fr-FR")}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Client-uploaded receipts */}
      {(filter === "all" || filter === "nita" || filter === "amanata") && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-3 text-sm">📎 Reçus clients ({receipts.length})</h3>
          {loading ? (
            <div className="text-center py-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : receipts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun reçu envoyé</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {receipts.map((receipt) => {
                const order = orders.find(o => o.id === receipt.order_id);
                return (
                  <div key={receipt.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <FileImage className="w-8 h-8 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground text-sm truncate">{order?.clientName || "Client"}</div>
                      <div className="text-[10px] text-muted-foreground">{order?.service.name || ""} • {order?.total.toLocaleString("fr-FR") || 0} F • {receipt.uploaded_by}</div>
                      <div className="text-[10px] text-muted-foreground">{new Date(receipt.created_at).toLocaleDateString("fr-FR")}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <a href={receipt.receipt_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-muted">
                        <Eye className="w-4 h-4 text-primary" />
                      </a>
                      <button onClick={() => downloadReceipt(receipt.receipt_url, `recu-${order?.orderNumber || receipt.id}.jpg`)} className="p-1.5 rounded-lg hover:bg-muted">
                        <Download className="w-4 h-4 text-success" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

// ── Services Tab ──
const ServicesTab = ({ services, updateService, addService, removeService }: { services: Service[]; updateService: (s: Service) => void; addService: (s: Service) => void; removeService: (id: string) => void }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-foreground">Services</h3>
        <Button variant="hero" size="sm" className="rounded-xl" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Ajouter</Button>
      </div>
      <AnimatePresence>
        {showAdd && <AddServiceForm onAdd={async (s) => { await addService(s); setShowAdd(false); toast.success("Service ajouté !"); }} onCancel={() => setShowAdd(false)} />}
      </AnimatePresence>
      {services.map((service) => (
        <div key={service.id} className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setEditingId(editingId === service.id ? null : service.id)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl hero-gradient flex items-center justify-center text-lg">{service.icon}</div>
              <div>
                <div className="font-bold text-foreground text-sm">{service.name}</div>
                <div className="text-[10px] text-muted-foreground">{service.options.length} options • {service.category}</div>
              </div>
            </div>
            <Settings className={`w-4 h-4 text-muted-foreground transition-transform ${editingId === service.id ? "rotate-90" : ""}`} />
          </div>
          <AnimatePresence>
            {editingId === service.id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <ServiceEditor service={service} onSave={async (s) => { await updateService(s); toast.success("Mis à jour !"); }} onDelete={async () => { await removeService(service.id); toast.success("Supprimé"); setEditingId(null); }} />
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
        <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" placeholder="Nom" />
      </div>
      <Input value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl" placeholder="Description" />
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Options & Prix</span>
          <button onClick={() => setOptions([...options, { id: crypto.randomUUID(), name: "", price: 0, unit: "piece" }])} className="text-xs font-semibold text-primary flex items-center gap-1"><Plus className="w-3 h-3" /> Ajouter</button>
        </div>
        {options.map((opt, idx) => (
          <div key={opt.id} className="flex gap-2 items-center">
            <Input value={opt.name} onChange={(e) => updateOption(idx, "name", e.target.value)} className="rounded-xl text-sm flex-1" placeholder="Nom" />
            <Input type="number" value={opt.price} onChange={(e) => updateOption(idx, "price", parseInt(e.target.value) || 0)} className="rounded-xl text-sm w-20" placeholder="Prix" />
            <select value={opt.unit || "piece"} onChange={(e) => updateOption(idx, "unit", e.target.value)} className="rounded-xl text-sm bg-muted text-foreground px-2 py-2 border border-border">
              <option value="piece">Pièce</option>
              <option value="kg">Kg</option>
            </select>
            <button onClick={() => setOptions(options.filter((_, i) => i !== idx))} className="text-destructive p-1"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="hero" size="sm" className="flex-1 rounded-xl" onClick={() => onSave({ ...service, name, description, icon, options })}><Save className="w-4 h-4" /> Enregistrer</Button>
        <Button variant="destructive" size="sm" className="rounded-xl" onClick={onDelete}><Trash2 className="w-4 h-4" /></Button>
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
        <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" placeholder="Nom" />
      </div>
      <Input value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl" placeholder="Description" />
      <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full rounded-xl text-sm bg-muted text-foreground px-3 py-2.5 border border-border">
        <option value="auto">🚗 Auto</option>
        <option value="pressing">👕 Pressing</option>
      </select>
      <div className="flex gap-2">
        <Button variant="hero" size="sm" className="flex-1 rounded-xl" onClick={() => { if (!name) { toast.error("Nom requis"); return; } onAdd({ id: crypto.randomUUID(), name, description, icon, category, options: [] }); }}>
          <Plus className="w-4 h-4" /> Créer
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={onCancel}>Annuler</Button>
      </div>
    </motion.div>
  );
};

// ── Promos Tab ──
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
    if (error) { toast.error(error.message.includes("duplicate") ? "Code existant" : "Erreur"); return; }
    toast.success("Code créé !");
    setShowAdd(false);
    setCode(""); setDiscountValue(""); setMinOrder(""); setMaxUses("");
    fetchPromos();
  };

  const toggleActive = async (id: string, active: boolean) => { await supabase.from("promo_codes").update({ active: !active }).eq("id", id); fetchPromos(); };
  const deletePromo = async (id: string) => { await supabase.from("promo_codes").delete().eq("id", id); toast.success("Supprimé"); fetchPromos(); };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-foreground">Codes promo</h3>
        <Button variant="hero" size="sm" className="rounded-xl" onClick={() => setShowAdd(!showAdd)}><Plus className="w-4 h-4" /> Ajouter</Button>
      </div>
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="glass-card rounded-2xl p-4 space-y-3">
            <Input placeholder="CODE (ex: WASH20)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="rounded-xl uppercase font-bold" />
            <div className="grid grid-cols-2 gap-2">
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)} className="rounded-xl text-sm bg-muted text-foreground px-3 py-2.5 border border-border">
                <option value="percentage">% Pourcentage</option>
                <option value="fixed">FCFA Fixe</option>
              </select>
              <Input placeholder={discountType === "percentage" ? "Ex: 20" : "Ex: 1000"} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="rounded-xl" type="number" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Min commande" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} className="rounded-xl" type="number" />
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
        <div className="text-center py-12"><div className="text-4xl mb-3">🏷️</div><p className="text-muted-foreground text-sm">Aucun code promo</p></div>
      ) : (
        promos.map((p) => (
          <div key={p.id} className="glass-card rounded-2xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-bold text-foreground text-sm flex items-center gap-2">
                  🏷️ {p.code}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${p.active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>{p.active ? "Actif" : "Inactif"}</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  -{p.discount_type === "percentage" ? `${p.discount_value}%` : `${Number(p.discount_value).toLocaleString("fr-FR")} F`}
                  {p.min_order > 0 && ` • Min ${Number(p.min_order).toLocaleString("fr-FR")} F`}
                  {p.max_uses && ` • ${p.used_count}/${p.max_uses}`}
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

// ── Data Management Tab ──
const DataTab = () => {
  const [purging, setPurging] = useState(false);

  const purgeAll = async (table: string, label: string) => {
    if (!confirm(`⚠️ Supprimer TOUTES les données de "${label}" ? Cette action est irréversible !`)) return;
    if (!confirm(`Êtes-vous VRAIMENT sûr ? Toutes les ${label} seront supprimées définitivement.`)) return;
    setPurging(true);
    const { error } = await supabase.from(table as any).delete().gte("created_at", "1970-01-01");
    if (!error) { toast.success(`${label} supprimées`); } else { toast.error("Erreur: " + error.message); }
    setPurging(false);
  };

  const purgeEverything = async () => {
    if (!confirm("⚠️ ATTENTION: Supprimer TOUTES les données (commandes, reçus, points fidélité, codes promo) ?")) return;
    if (!confirm("Dernière confirmation: cette action est IRRÉVERSIBLE. Continuer ?")) return;
    setPurging(true);
    await supabase.from("payment_receipts").delete().gte("created_at", "1970-01-01");
    await supabase.from("loyalty_points").delete().gte("created_at", "1970-01-01");
    await supabase.from("orders").delete().gte("created_at", "1970-01-01");
    await supabase.from("promo_codes").delete().gte("created_at", "1970-01-01");
    toast.success("Toutes les données ont été supprimées");
    setPurging(false);
    window.location.reload();
  };

  const tables = [
    { table: "orders", label: "Commandes", icon: "📋", color: "text-primary" },
    { table: "payment_receipts", label: "Reçus de paiement", icon: "🧾", color: "text-secondary" },
    { table: "loyalty_points", label: "Points de fidélité", icon: "🎁", color: "text-warning" },
    { table: "promo_codes", label: "Codes promo", icon: "🏷️", color: "text-success" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-bold text-foreground mb-1 text-sm flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" /> Gestion des données
        </h3>
        <p className="text-[11px] text-muted-foreground mb-4">Supprimez les données enregistrées par catégorie ou tout en une fois.</p>

        <div className="space-y-2">
          {tables.map((t) => (
            <div key={t.table} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
              <span className="text-lg">{t.icon}</span>
              <span className="flex-1 font-medium text-foreground text-sm">{t.label}</span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs text-destructive border-destructive/20"
                disabled={purging}
                onClick={() => purgeAll(t.table, t.label)}
              >
                <Trash2 className="w-3 h-3 mr-1" /> Supprimer tout
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 border-2 border-destructive/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-destructive text-sm mb-1">Zone dangereuse</h3>
            <p className="text-[11px] text-muted-foreground mb-3">Supprime toutes les commandes, reçus, points de fidélité et codes promo en une seule action.</p>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-xl w-full"
              disabled={purging}
              onClick={purgeEverything}
            >
              <Trash2 className="w-4 h-4" /> {purging ? "Suppression en cours..." : "Supprimer TOUTES les données"}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPage;
