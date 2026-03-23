import { useAppState } from "@/lib/store";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";
import { Package } from "lucide-react";

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
    <div className="min-h-screen pb-20">
      <PageHeader title="📋 Mes Commandes" />
      <div className="container max-w-lg mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Aucune commande pour le moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => {
              const status = statusLabels[order.status];
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-xl p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{order.service.icon}</span>
                      <div>
                        <div className="font-semibold text-foreground text-sm">{order.service.name}</div>
                        <div className="text-xs text-muted-foreground">{order.selectedOption.name}</div>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full text-primary-foreground ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                    <span>{new Date(order.createdAt).toLocaleDateString("fr-FR")}</span>
                    <span className="font-bold text-primary">{order.total.toLocaleString("fr-FR")} FCFA</span>
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
