import { useAppState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BarChart3, ShoppingBag, Users, TrendingUp, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Order } from "@/lib/services";

const statusActions: Record<string, { next: Order["status"]; label: string }> = {
  pending: { next: "accepted", label: "Accepter" },
  accepted: { next: "in_progress", label: "Démarrer" },
  in_progress: { next: "completed", label: "Terminer" },
};

const statusLabels: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "En attente", color: "bg-warning", icon: Clock },
  accepted: { label: "Acceptée", color: "bg-primary", icon: CheckCircle2 },
  in_progress: { label: "En cours", color: "bg-primary", icon: TrendingUp },
  completed: { label: "Terminée", color: "bg-success", icon: CheckCircle2 },
  cancelled: { label: "Annulée", color: "bg-destructive", icon: XCircle },
};

const AdminPage = () => {
  const { orders, updateOrderStatus } = useAppState();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"dashboard" | "orders">("dashboard");

  const totalRevenue = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.total, 0);

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const completedCount = orders.filter((o) => o.status === "completed").length;

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="hero-gradient px-4 py-6 pb-8">
        <div className="container max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">Admin Panel</h1>
              <p className="text-sm text-primary-foreground/70">CleanCar Niger</p>
            </div>
            <button onClick={() => navigate("/")} className="text-primary-foreground/70 text-sm">
              ← Retour
            </button>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: TrendingUp, label: "Revenus", value: `${totalRevenue.toLocaleString("fr-FR")}` },
              { icon: ShoppingBag, label: "En attente", value: pendingCount.toString() },
              { icon: CheckCircle2, label: "Terminées", value: completedCount.toString() },
            ].map((stat) => (
              <div key={stat.label} className="bg-primary-foreground/10 backdrop-blur rounded-xl p-3 text-center">
                <stat.icon className="w-5 h-5 mx-auto mb-1 text-primary-foreground/80" />
                <div className="text-lg font-bold text-primary-foreground">{stat.value}</div>
                <div className="text-[10px] text-primary-foreground/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container max-w-lg mx-auto px-4 -mt-4">
        <div className="glass-card rounded-xl p-1 flex mb-6">
          {(["dashboard", "orders"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t === "dashboard" ? "📊 Stats" : "📋 Commandes"}
            </button>
          ))}
        </div>

        {tab === "dashboard" ? (
          <div className="space-y-4">
            <div className="glass-card rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Résumé
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total commandes</span>
                  <span className="font-semibold text-foreground">{orders.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Chiffre d'affaires</span>
                  <span className="font-semibold text-secondary">{totalRevenue.toLocaleString("fr-FR")} FCFA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Clients uniques</span>
                  <span className="font-semibold text-foreground">
                    {new Set(orders.map((o) => o.clientPhone)).size}
                  </span>
                </div>
              </div>
            </div>

            {/* Services breakdown */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Par service
              </h3>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune donnée</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(
                    orders.reduce<Record<string, number>>((acc, o) => {
                      acc[o.service.name] = (acc[o.service.name] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([name, count]) => (
                    <div key={name} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-medium text-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
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
                    transition={{ delay: i * 0.05 }}
                    className="glass-card rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-foreground text-sm">
                          {order.service.icon} {order.service.name} — {order.selectedOption.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {order.clientName} • {order.clientPhone}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.location === "domicile" ? `📍 ${order.address}` : "🏪 Sur place"} •{" "}
                          {order.payment === "cash" ? "💵 Cash" : `📱 ${order.payment}`}
                        </div>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-1 rounded-full text-primary-foreground ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-sm font-bold text-primary">
                        {order.total.toLocaleString("fr-FR")} FCFA
                      </span>
                      <div className="flex gap-2">
                        {order.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, "cancelled")}
                          >
                            Refuser
                          </Button>
                        )}
                        {action && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, action.next)}
                          >
                            {action.label}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
