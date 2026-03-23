import { useAppState } from "@/lib/store";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";
import { Package, Scale } from "lucide-react";

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-warning" },
  accepted: { label: "Acceptée", color: "bg-primary" },
  in_progress: { label: "En cours", color: "bg-primary" },
  completed: { label: "Terminée", color: "bg-success" },
  cancelled: { label: "Annulée", color: "bg-destructive" },
};

const MyOrdersPage = () => {
  const { orders } = useAppState();

  return (
    <div className="min-h-screen pb-20 bg-background">
      <PageHeader title="📋 Mes Commandes" />
      <div className="container max-w-lg mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-medium">Aucune commande pour le moment</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Vos commandes apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-3">
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
      <BottomNav />
    </div>
  );
};

export default MyOrdersPage;
