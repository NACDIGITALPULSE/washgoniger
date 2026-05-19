import { useAppState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, ShoppingBag, TrendingUp, CheckCircle2, Clock, XCircle, Settings,
  Plus, Trash2, Save, ArrowLeft, LogOut, Bell, MessageCircle, Search, Filter,
  Users, DollarSign, Send, UserCheck, Eye, EyeOff, Key, Mail, Calendar,
  Activity, Target, Percent, Archive, FileImage, Download, PackageCheck, Home as HomeIcon, AlertTriangle, Database,
  Calculator, FileText, FileSpreadsheet, File, Phone, Printer
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Order, Service, ServiceOption, Agent } from "@/lib/services";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, AreaChart, Area, Line
} from "recharts";
import logo from "@/assets/logo.png";
import jsPDF from "jspdf";

const generateOrderInvoicePDF = (order: Order) => {
  const orderNumber = order.orderNumber || order.id.slice(0, 8).toUpperCase();
  const orderDate = new Date(order.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
  const paymentLabels: Record<string, string> = { cash: "Cash", nita: "Nita", amanata: "Amanata" };
  const optionsList = order.selectedOptions && order.selectedOptions.length > 0
    ? order.selectedOptions
    : [{ option: order.selectedOption, quantity: order.quantity }];

  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const w = doc.internal.pageSize.getWidth();
  let y = 15;

  doc.setFontSize(22);
  doc.setTextColor(21, 101, 192);
  doc.text("WashGo", w / 2 - 18, y);
  doc.setTextColor(46, 125, 50);
  doc.text("Niger", w / 2 + 14, y);
  doc.setFontSize(10);
  doc.setTextColor(100);
  y += 6;
  doc.text("Services de lavage auto & pressing", w / 2, y, { align: "center" });

  y += 10;
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(20, y - 4, w - 40, 18, 3, 3, "F");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("FACTURE N°", w / 2, y + 1, { align: "center" });
  doc.setFontSize(16);
  doc.setTextColor(21, 101, 192);
  doc.text(orderNumber, w / 2, y + 9, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(orderDate, w / 2, y + 14, { align: "center" });

  y += 24;
  doc.setFontSize(10);
  doc.setTextColor(50);
  doc.text(`Client : ${order.clientName}`, 15, y);
  y += 6;
  doc.text(`Téléphone : ${order.clientPhone}`, 15, y);
  y += 6;
  doc.text(`Lieu : ${order.location === "domicile" ? "À domicile" + (order.address ? " — " + order.address : "") : "Sur place"}`, 15, y);
  y += 6;
  doc.text(`Paiement : ${paymentLabels[order.payment] || order.payment}`, 15, y);

  y += 10;
  doc.setFillColor(21, 101, 192);
  doc.rect(15, y - 4, w - 30, 8, "F");
  doc.setTextColor(255);
  doc.setFontSize(9);
  doc.text("Service / Option", 18, y + 1);
  doc.text("Qté", w - 50, y + 1, { align: "right" });
  doc.text("Prix", w - 18, y + 1, { align: "right" });

  y += 8;
  doc.setFillColor(248, 249, 250);
  doc.rect(15, y - 4, w - 30, 7, "F");
  doc.setTextColor(50);
  doc.setFontSize(10);
  doc.text(`${order.service.icon} ${order.service.name}`, 18, y + 1);

  y += 7;
  doc.setFontSize(9);
  doc.setTextColor(60);
  optionsList.forEach(({ option, quantity }) => {
    doc.text(option.name, 20, y + 1);
    const qtyStr = `${quantity}${option.unit === "kg" ? " kg" : ""}`;
    doc.text(qtyStr, w - 50, y + 1, { align: "right" });
    doc.text(`${(option.price * quantity).toLocaleString("fr-FR")} F`, w - 18, y + 1, { align: "right" });
    doc.setDrawColor(230);
    doc.line(15, y + 4, w - 15, y + 4);
    y += 8;
  });

  y += 2;
  doc.setDrawColor(21, 101, 192);
  doc.setLineWidth(0.5);
  doc.line(15, y - 2, w - 15, y - 2);
  doc.setFontSize(13);
  doc.setTextColor(21, 101, 192);
  doc.text("TOTAL", 18, y + 4);
  doc.text(`${order.total.toLocaleString("fr-FR")} FCFA`, w - 18, y + 4, { align: "right" });

  y += 18;
  doc.setDrawColor(220);
  doc.line(15, y, w - 15, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(130);
  doc.text("Merci pour votre confiance !", w / 2, y, { align: "center" });
  y += 5;
  doc.setTextColor(37, 211, 102);
  doc.text("WhatsApp : +227 88 08 29 87", w / 2, y, { align: "center" });
  y += 5;
  doc.setTextColor(130);
  doc.text("WashGo Niger — Niamey, Niger", w / 2, y, { align: "center" });

  return doc;
};

const downloadOrderPDF = (order: Order) => {
  const doc = generateOrderInvoicePDF(order);
  const orderNumber = order.orderNumber || order.id.slice(0, 8).toUpperCase();
  doc.save(`Facture-${orderNumber}.pdf`);
};

const printOrderPDF = (order: Order) => {
  const doc = generateOrderInvoicePDF(order);
  const url = doc.output("bloburl");
  const win = window.open(url as unknown as string, "_blank");
  if (win) {
    win.addEventListener("load", () => {
      try { win.focus(); win.print(); } catch {}
    });
  }
};

const sendOrderPDFWhatsApp = async (order: Order) => {
  const doc = generateOrderInvoicePDF(order);
  const orderNumber = order.orderNumber || order.id.slice(0, 8).toUpperCase();
  const blob = doc.output("blob");
  const file = new (window as any).File([blob], `Facture-${orderNumber}.pdf`, { type: "application/pdf" });
  const p = order.clientPhone.replace(/\D/g, "");
  const fullPhone = p.startsWith("227") ? p : `227${p}`;
  const message = `🧾 *Reçu WashGo Niger*\nN° ${orderNumber}\nClient: ${order.clientName}\nService: ${order.service.name}\nTotal: ${order.total.toLocaleString("fr-FR")} FCFA\n\nMerci pour votre confiance ! 🚗✨`;
  const nav: any = navigator;
  try {
    if (nav.canShare && nav.canShare({ files: [file] })) {
      await nav.share({ files: [file], title: `Reçu ${orderNumber}`, text: message });
      return;
    }
  } catch {}
  doc.save(`Facture-${orderNumber}.pdf`);
  window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, "_blank");
};

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

type TabKey = "dashboard" | "orders" | "agents" | "clients" | "users" | "notifications" | "receipts" | "accounting" | "services" | "promos" | "data";

const AdminPage = () => {
  const { orders, updateOrderStatus, assignAgent, agents, addAgent, updateAgent, removeAgent, services, updateService, addService, removeService } = useAppState();
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
    { key: "agents", label: "Agents", icon: "🧑‍🔧" },
    { key: "clients", label: "Clients", icon: "📞" },
    { key: "users", label: "Comptes", icon: "👥" },
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
        <div className="glass-card rounded-2xl p-1.5 flex shadow-xl overflow-x-auto scrollbar-none gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-shrink-0 min-w-[68px] py-2.5 px-3 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap text-center flex flex-col items-center gap-0.5 ${
                tab === t.key
                  ? "hero-gradient text-primary-foreground shadow-md scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <span className="text-base leading-none">{t.icon}</span>
              <span className="leading-none">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-5">
          <AnimatePresence mode="wait">
            {tab === "dashboard" && <DashboardTab key="dash" orders={orders} totalRevenue={totalRevenue} />}
            {tab === "orders" && <OrdersTab key="ord" orders={orders} updateOrderStatus={updateOrderStatus} agents={agents} assignAgent={assignAgent} />}
            {tab === "agents" && <AgentsTab key="agt" agents={agents} addAgent={addAgent} updateAgent={updateAgent} removeAgent={removeAgent} />}
            {tab === "clients" && <ClientsTab key="cli" orders={orders} />}
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

// ── Clients Tab (all phone numbers from orders) ──
const ClientsTab = ({ orders }: { orders: Order[] }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPhone, setEditingPhone] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editNewPhone, setEditNewPhone] = useState("");

  const clients = useMemo(() => {
    const map: Record<string, { name: string; phone: string; count: number; total: number; lastOrder: Date; points: number }> = {};
    orders.forEach((o) => {
      if (!map[o.clientPhone]) {
        map[o.clientPhone] = { name: o.clientName, phone: o.clientPhone, count: 0, total: 0, lastOrder: o.createdAt, points: 0 };
      }
      map[o.clientPhone].count += 1;
      map[o.clientPhone].total += o.total;
      if (o.createdAt > map[o.clientPhone].lastOrder) map[o.clientPhone].lastOrder = o.createdAt;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [orders]);

  const [pointsByPhone, setPointsByPhone] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchPoints = async () => {
      const { data } = await supabase.from("loyalty_points").select("user_phone, points");
      if (data) {
        const m: Record<string, number> = {};
        data.forEach((r: any) => { m[r.user_phone] = (m[r.user_phone] || 0) + r.points; });
        setPointsByPhone(m);
      }
    };
    fetchPoints();
  }, [orders]);

  const filtered = clients.filter((c) =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)
  );

  const deleteClientOrders = async (phone: string, name: string) => {
    if (!confirm(`Supprimer TOUTES les commandes de ${name} (${phone}) ? Cette action est irréversible.`)) return;
    const { error } = await supabase.from("orders").delete().eq("client_phone", phone);
    if (error) { toast.error("Erreur de suppression"); return; }
    await supabase.from("loyalty_points").delete().eq("user_phone", phone);
    toast.success(`Toutes les commandes de ${name} supprimées`);
    setTimeout(() => window.location.reload(), 600);
  };

  const updateClient = async (oldPhone: string) => {
    if (!editName.trim() || !editNewPhone.trim()) { toast.error("Nom et téléphone requis"); return; }
    const { error } = await supabase
      .from("orders")
      .update({ client_name: editName.trim(), client_phone: editNewPhone.trim() })
      .eq("client_phone", oldPhone);
    if (error) { toast.error("Erreur"); return; }
    if (editNewPhone.trim() !== oldPhone) {
      await supabase.from("loyalty_points").update({ user_phone: editNewPhone.trim() }).eq("user_phone", oldPhone);
    }
    toast.success("Client mis à jour");
    setEditingPhone(null);
    setTimeout(() => window.location.reload(), 600);
  };

  const sendWA = (phone: string, name: string) => {
    const p = phone.replace(/\D/g, "");
    const fullPhone = p.startsWith("227") ? p : `227${p}`;
    const msg = `Bonjour *${name}*,\n\nMerci d'être client chez WashGo Niger !\n\n🚗✨ *WashGo Niger*\n📞 +227 88 08 29 87`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="glass-card rounded-2xl p-4">
        <h3 className="font-bold text-foreground text-sm flex items-center gap-2 mb-3">
          <Phone className="w-4 h-4 text-primary" /> Tous les clients ({clients.length})
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher par nom ou téléphone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl text-sm h-9" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-muted-foreground text-sm">Aucun client</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c, i) => {
            const isEditing = editingPhone === c.phone;
            const points = pointsByPhone[c.phone] || 0;
            return (
              <motion.div
                key={c.phone}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="glass-card rounded-2xl p-4"
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-xl text-sm h-9" placeholder="Nom" />
                    <Input value={editNewPhone} onChange={(e) => setEditNewPhone(e.target.value)} className="rounded-xl text-sm h-9" placeholder="Téléphone" />
                    <div className="flex gap-2">
                      <Button variant="hero" size="sm" className="flex-1 rounded-xl h-8" onClick={() => updateClient(c.phone)}>
                        <Save className="w-3.5 h-3.5" /> Enregistrer
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl h-8" onClick={() => setEditingPhone(null)}>Annuler</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl hero-gradient flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-foreground text-sm truncate">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {c.phone}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{c.count} cmd</span>
                          <span className="text-[10px] font-semibold bg-success/10 text-success px-2 py-0.5 rounded-full">{c.total.toLocaleString("fr-FR")} F</span>
                          {points > 0 && <span className="text-[10px] font-semibold bg-warning/10 text-warning px-2 py-0.5 rounded-full">⭐ {points} pts</span>}
                        </div>
                        <div className="text-[9px] text-muted-foreground mt-1">Dernière: {new Date(c.lastOrder).toLocaleDateString("fr-FR")}</div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 mt-3 pt-2 border-t border-border">
                      <Button variant="outline" size="sm" className="flex-1 rounded-xl h-7 text-[10px] text-success border-success/20" onClick={() => sendWA(c.phone, c.name)}>
                        <MessageCircle className="w-3 h-3" /> WhatsApp
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 rounded-xl h-7 text-[10px]" onClick={() => { setEditingPhone(c.phone); setEditName(c.name); setEditNewPhone(c.phone); }}>
                        <Settings className="w-3 h-3" /> Modifier
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl h-7 px-2 text-destructive border-destructive/20" onClick={() => deleteClientOrders(c.phone, c.name)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

// ── Orders Tab with archive ──
const OrdersTab = ({ orders, updateOrderStatus, agents, assignAgent }: { orders: Order[]; updateOrderStatus: (id: string, status: Order["status"]) => void; agents: Agent[]; assignAgent: (orderId: string, agentId: string | null) => Promise<void> }) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const downloadSelected = async () => {
    const list = orders.filter((o) => selectedIds.has(o.id));
    if (list.length === 0) { toast.error("Aucune commande sélectionnée"); return; }
    for (const o of list) {
      downloadOrderPDF(o);
      await new Promise((r) => setTimeout(r, 300));
    }
    toast.success(`${list.length} reçu(s) téléchargé(s)`);
  };

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

      {selectedIds.size > 0 && (
        <div className="glass-card rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">{selectedIds.size} sélectionnée(s)</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs" onClick={() => setSelectedIds(new Set())}>Annuler</Button>
            <Button size="sm" variant="hero" className="rounded-xl h-8 text-xs gap-1" onClick={downloadSelected}>
              <Download className="w-3.5 h-3.5" /> Télécharger les reçus
            </Button>
          </div>
        </div>
      )}

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
            <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`glass-card rounded-2xl p-4 ${selectedIds.has(order.id) ? "ring-2 ring-primary" : ""}`}>
              <div className="flex items-start justify-between mb-2 gap-2">
                <input
                  type="checkbox"
                  checked={selectedIds.has(order.id)}
                  onChange={() => toggleSelect(order.id)}
                  className="mt-1 w-4 h-4 accent-primary cursor-pointer"
                  title="Sélectionner"
                />
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
              {/* Agent assignment */}
              <div className="flex items-center gap-2 py-2 border-t border-border/40">
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Agent</span>
                <select
                  value={order.agentId || ""}
                  onChange={(e) => assignAgent(order.id, e.target.value || null)}
                  className="flex-1 text-xs rounded-lg bg-muted px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">— Non assigné —</option>
                  {agents.filter((a) => a.active).map((a) => (
                    <option key={a.id} value={a.id}>{a.name} {a.zone ? `· ${a.zone}` : ""} (≈{a.avg_eta_min}min)</option>
                  ))}
                </select>
                {order.agentEtaMin != null && (
                  <span className="text-[10px] font-bold text-primary">≈ {order.agentEtaMin} min</span>
                )}
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full text-primary-foreground ${status?.color || "bg-muted"}`}>{status?.label || order.status}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm font-extrabold text-primary">{order.total.toLocaleString("fr-FR")} F</span>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  <Button variant="outline" size="sm" className="rounded-xl h-7 px-2 text-success border-success/20" onClick={() => openWhatsApp(order)} title="Message WhatsApp">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl h-7 px-2 text-primary border-primary/20" onClick={() => { downloadOrderPDF(order); toast.success("Reçu PDF téléchargé"); }} title="Télécharger reçu PDF">
                    <FileText className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl h-7 px-2 text-foreground" onClick={() => printOrderPDF(order)} title="Imprimer le reçu">
                    <Printer className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl h-7 px-2 text-success border-success/20" onClick={() => sendOrderPDFWhatsApp(order)} title="Envoyer reçu PDF via WhatsApp">
                    <Send className="w-3.5 h-3.5" />
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

  const downloadReceipt = async (url: string, name: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success("Reçu téléchargé");
    } catch {
      window.open(url, "_blank");
      toast.info("Téléchargement direct ouvert");
    }
  };

  const generateCashReceipt = (order: Order) => {
    const date = new Date(order.createdAt).toLocaleString("fr-FR");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reçu ${order.orderNumber || order.id}</title>
<style>
body{font-family:Arial,sans-serif;max-width:400px;margin:20px auto;padding:20px;color:#222}
.header{text-align:center;border-bottom:2px dashed #333;padding-bottom:15px;margin-bottom:15px}
.header h1{margin:0;color:#0a8f6e}
.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee}
.label{color:#666;font-size:12px}
.value{font-weight:bold;font-size:13px}
.total{margin-top:15px;padding:12px;background:#0a8f6e;color:#fff;border-radius:8px;text-align:center;font-size:18px;font-weight:bold}
.footer{margin-top:20px;text-align:center;font-size:11px;color:#888;border-top:2px dashed #333;padding-top:15px}
</style></head><body>
<div class="header">
  <h1>WashGo Niger</h1>
  <p style="margin:4px 0;font-size:12px">Lavage · Vidange · Pressing</p>
  <p style="margin:0;font-size:11px;color:#666">Niamey · +227 88 08 29 87</p>
</div>
<h2 style="text-align:center;font-size:14px;margin:10px 0">REÇU DE PAIEMENT CASH</h2>
<div class="row"><span class="label">N° Commande</span><span class="value">#${order.orderNumber || order.id.slice(0,8)}</span></div>
<div class="row"><span class="label">Date</span><span class="value">${date}</span></div>
<div class="row"><span class="label">Client</span><span class="value">${order.clientName}</span></div>
<div class="row"><span class="label">Téléphone</span><span class="value">${order.clientPhone}</span></div>
<div class="row"><span class="label">Service</span><span class="value">${order.service.name}</span></div>
<div class="row"><span class="label">Quantité</span><span class="value">${order.quantity}</span></div>
<div class="row"><span class="label">Lieu</span><span class="value">${order.location === "domicile" ? "À domicile" : "Sur place"}</span></div>
<div class="row"><span class="label">Paiement</span><span class="value">💵 Cash</span></div>
<div class="row"><span class="label">Statut</span><span class="value">${order.status}</span></div>
<div class="total">TOTAL : ${order.total.toLocaleString("fr-FR")} FCFA</div>
<div class="footer">
  <p>Merci pour votre confiance ! 🙏</p>
  <p>Reçu généré le ${new Date().toLocaleString("fr-FR")}</p>
</div>
<script>window.onload=()=>setTimeout(()=>window.print(),300);</script>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `recu-cash-${order.orderNumber || order.id.slice(0,8)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    toast.success("Reçu Cash téléchargé");
  };

  const printCashReceipt = (order: Order) => {
    const date = new Date(order.createdAt).toLocaleString("fr-FR");
    const w = window.open("", "_blank");
    if (!w) { toast.error("Popup bloqué"); return; }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reçu ${order.orderNumber || order.id}</title>
<style>body{font-family:Arial;max-width:400px;margin:20px auto;padding:20px}
.h{text-align:center;border-bottom:2px dashed #333;padding-bottom:10px;margin-bottom:10px}
.h h1{margin:0;color:#0a8f6e}
.r{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee;font-size:13px}
.t{margin-top:12px;padding:10px;background:#0a8f6e;color:#fff;border-radius:6px;text-align:center;font-weight:bold;font-size:16px}
.f{margin-top:15px;text-align:center;font-size:11px;color:#666}</style></head><body>
<div class="h"><h1>WashGo Niger</h1><p style="margin:4px 0;font-size:11px">Niamey · +227 88 08 29 87</p></div>
<h3 style="text-align:center;font-size:13px">REÇU CASH #${order.orderNumber || order.id.slice(0,8)}</h3>
<div class="r"><span>Date</span><b>${date}</b></div>
<div class="r"><span>Client</span><b>${order.clientName}</b></div>
<div class="r"><span>Téléphone</span><b>${order.clientPhone}</b></div>
<div class="r"><span>Service</span><b>${order.service.name}</b></div>
<div class="r"><span>Quantité</span><b>${order.quantity}</b></div>
<div class="r"><span>Lieu</span><b>${order.location === "domicile" ? "Domicile" : "Sur place"}</b></div>
<div class="t">TOTAL : ${order.total.toLocaleString("fr-FR")} FCFA</div>
<div class="f">Merci pour votre confiance !</div>
<script>setTimeout(()=>window.print(),400);</script></body></html>`);
    w.document.close();
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
                  <div className="text-[10px] text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("fr-FR")}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => printCashReceipt(order)} title="Imprimer" className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20">
                    <Eye className="w-4 h-4 text-primary" />
                  </button>
                  <button onClick={() => generateCashReceipt(order)} title="Télécharger" className="p-2 rounded-lg bg-success/10 hover:bg-success/20">
                    <Download className="w-4 h-4 text-success" />
                  </button>
                </div>
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

// ── Accounting Tab ──
const AccountingTab = ({ orders }: { orders: Order[] }) => {
  const [period, setPeriod] = useState<"daily" | "monthly" | "global">("daily");
  const [exporting, setExporting] = useState(false);

  const today = new Date();

  // Daily revenue data
  const dailyData = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    const totalMap: Record<string, number> = {};
    orders.filter(o => o.status === "completed").forEach((o) => {
      const d = new Date(o.createdAt).toLocaleDateString("fr-FR");
      if (!map[d]) map[d] = {};
      const svc = o.service.name;
      map[d][svc] = (map[d][svc] || 0) + o.total;
      totalMap[d] = (totalMap[d] || 0) + o.total;
    });
    return Object.entries(totalMap)
      .map(([date, total]) => ({ date, total, details: map[date] }))
      .sort((a, b) => {
        const [da, ma, ya] = a.date.split("/").map(Number);
        const [db, mb, yb] = b.date.split("/").map(Number);
        return new Date(yb, mb - 1, db).getTime() - new Date(ya, ma - 1, da).getTime();
      });
  }, [orders]);

  // Monthly revenue data
  const monthlyData = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    const totalMap: Record<string, number> = {};
    orders.filter(o => o.status === "completed").forEach((o) => {
      const d = new Date(o.createdAt);
      const key = `${d.toLocaleDateString("fr-FR", { month: "long" })} ${d.getFullYear()}`;
      if (!map[key]) map[key] = {};
      const svc = o.service.name;
      map[key][svc] = (map[key][svc] || 0) + o.total;
      totalMap[key] = (totalMap[key] || 0) + o.total;
    });
    return Object.entries(totalMap).map(([month, total]) => ({ month, total, details: map[month] }));
  }, [orders]);

  // By service
  const serviceData = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    orders.filter(o => o.status === "completed").forEach((o) => {
      const k = o.service.name;
      if (!map[k]) map[k] = { count: 0, revenue: 0 };
      map[k].count += 1;
      map[k].revenue += o.total;
    });
    return Object.entries(map).sort(([, a], [, b]) => b.revenue - a.revenue);
  }, [orders]);

  const totalRevenue = orders.filter(o => o.status === "completed").reduce((s, o) => s + o.total, 0);
  const todayStr = today.toLocaleDateString("fr-FR");
  const todayRevenue = dailyData.find(d => d.date === todayStr)?.total || 0;
  const thisMonth = `${today.toLocaleDateString("fr-FR", { month: "long" })} ${today.getFullYear()}`;
  const monthRevenue = monthlyData.find(d => d.month === thisMonth)?.total || 0;

  const exportCSV = () => {
    setExporting(true);
    let csv = "Date,Service,Montant (FCFA)\n";
    orders.filter(o => o.status === "completed").forEach(o => {
      const d = new Date(o.createdAt).toLocaleDateString("fr-FR");
      csv += `${d},${o.service.name},${o.total}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `washgo-comptabilite-${today.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Rapport CSV téléchargé !");
    setExporting(false);
  };

  const exportJSON = () => {
    const report = {
      generated: today.toISOString(),
      totalRevenue,
      todayRevenue,
      monthRevenue,
      dailyBreakdown: dailyData,
      monthlyBreakdown: monthlyData,
      byService: serviceData.map(([name, d]) => ({ name, ...d })),
      orders: orders.filter(o => o.status === "completed").map(o => ({
        orderNumber: o.orderNumber,
        date: new Date(o.createdAt).toLocaleDateString("fr-FR"),
        client: o.clientName,
        phone: o.clientPhone,
        service: o.service.name,
        payment: o.payment,
        total: o.total,
      })),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `washgo-rapport-${today.toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Rapport JSON téléchargé !");
  };

  const exportText = () => {
    let text = `═══════════════════════════════════════\n`;
    text += `   RAPPORT COMPTABLE — WASHGO NIGER\n`;
    text += `   Généré le ${today.toLocaleDateString("fr-FR")} à ${today.toLocaleTimeString("fr-FR")}\n`;
    text += `═══════════════════════════════════════\n\n`;
    text += `RÉSUMÉ GLOBAL\n`;
    text += `─────────────────────────────────────\n`;
    text += `  Chiffre d'affaires total : ${totalRevenue.toLocaleString("fr-FR")} FCFA\n`;
    text += `  Recettes aujourd'hui     : ${todayRevenue.toLocaleString("fr-FR")} FCFA\n`;
    text += `  Recettes ce mois         : ${monthRevenue.toLocaleString("fr-FR")} FCFA\n`;
    text += `  Commandes complétées     : ${orders.filter(o => o.status === "completed").length}\n\n`;

    text += `REVENUS PAR SERVICE\n`;
    text += `─────────────────────────────────────\n`;
    serviceData.forEach(([name, d]) => {
      text += `  ${name.padEnd(25)} ${d.revenue.toLocaleString("fr-FR").padStart(10)} FCFA (${d.count} cmd)\n`;
    });
    text += `\n`;

    text += `REVENUS MENSUELS\n`;
    text += `─────────────────────────────────────\n`;
    monthlyData.forEach(({ month, total, details }) => {
      text += `\n  📅 ${month} — ${total.toLocaleString("fr-FR")} FCFA\n`;
      Object.entries(details).forEach(([svc, amt]) => {
        text += `     ${svc.padEnd(22)} ${amt.toLocaleString("fr-FR").padStart(10)} FCFA\n`;
      });
    });
    text += `\n`;

    text += `REVENUS JOURNALIERS (14 derniers jours)\n`;
    text += `─────────────────────────────────────\n`;
    dailyData.slice(0, 14).forEach(({ date, total }) => {
      text += `  ${date}  ${total.toLocaleString("fr-FR").padStart(10)} FCFA\n`;
    });

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `washgo-rapport-${today.toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Rapport texte téléchargé !");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-2xl p-4 text-center">
          <div className="text-lg font-extrabold text-foreground">{todayRevenue.toLocaleString("fr-FR")}</div>
          <div className="text-[10px] text-muted-foreground">Aujourd'hui (FCFA)</div>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <div className="text-lg font-extrabold text-primary">{monthRevenue.toLocaleString("fr-FR")}</div>
          <div className="text-[10px] text-muted-foreground">Ce mois (FCFA)</div>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <div className="text-lg font-extrabold text-secondary">{totalRevenue.toLocaleString("fr-FR")}</div>
          <div className="text-[10px] text-muted-foreground">Total (FCFA)</div>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-1.5">
        {([
          { key: "daily" as const, label: "Journalier" },
          { key: "monthly" as const, label: "Mensuel" },
          { key: "global" as const, label: "Par service" },
        ]).map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)} className={`flex-1 text-[11px] font-semibold py-2 rounded-xl transition-all ${period === p.key ? "hero-gradient text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Data */}
      {period === "daily" && (
        <div className="glass-card rounded-2xl p-5 space-y-2">
          <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Recettes journalières
          </h3>
          {dailyData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucune donnée</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {dailyData.slice(0, 30).map(({ date, total, details }) => (
                <div key={date} className="p-3 rounded-xl bg-muted/30">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-foreground">{date}</span>
                    <span className="text-sm font-extrabold text-primary">{total.toLocaleString("fr-FR")} F</span>
                  </div>
                  <div className="space-y-0.5">
                    {Object.entries(details).map(([svc, amt]) => (
                      <div key={svc} className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{svc}</span>
                        <span>{amt.toLocaleString("fr-FR")} F</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {period === "monthly" && (
        <div className="glass-card rounded-2xl p-5 space-y-2">
          <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Recettes mensuelles
          </h3>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucune donnée</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {monthlyData.map(({ month, total, details }) => (
                <div key={month} className="p-3 rounded-xl bg-muted/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-foreground">📅 {month}</span>
                    <span className="text-sm font-extrabold text-primary">{total.toLocaleString("fr-FR")} F</span>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(details).map(([svc, amt]) => (
                      <div key={svc} className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">{svc}</span>
                        <span className="font-semibold text-foreground">{amt.toLocaleString("fr-FR")} F</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {period === "global" && (
        <div className="glass-card rounded-2xl p-5 space-y-2">
          <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" /> Revenus par service
          </h3>
          {serviceData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucune donnée</p>
          ) : (
            <div className="space-y-2">
              {serviceData.map(([name, d], i) => {
                const pct = totalRevenue > 0 ? Math.round((d.revenue / totalRevenue) * 100) : 0;
                return (
                  <div key={name} className="p-3 rounded-xl bg-muted/30">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-bold text-foreground">{name}</span>
                      <span className="text-sm font-extrabold text-primary">{d.revenue.toLocaleString("fr-FR")} F</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full hero-gradient rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground">{pct}%</span>
                      <span className="text-[10px] text-muted-foreground">{d.count} cmd</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Export buttons */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
          <Download className="w-4 h-4 text-primary" /> Télécharger un rapport
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" className="rounded-xl text-xs flex flex-col items-center gap-1 h-auto py-3" onClick={exportCSV} disabled={exporting}>
            <FileSpreadsheet className="w-5 h-5 text-success" />
            Excel/CSV
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl text-xs flex flex-col items-center gap-1 h-auto py-3" onClick={exportJSON} disabled={exporting}>
            <FileText className="w-5 h-5 text-primary" />
            JSON
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl text-xs flex flex-col items-center gap-1 h-auto py-3" onClick={exportText} disabled={exporting}>
            <File className="w-5 h-5 text-secondary" />
            Texte/PDF
          </Button>
        </div>
      </div>
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
