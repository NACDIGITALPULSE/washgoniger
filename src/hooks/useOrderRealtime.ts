import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STATUS_TOASTS: Record<string, { msg: string; emoji: string }> = {
  accepted: { msg: "Commande acceptée par WashGo", emoji: "✅" },
  in_progress: { msg: "Prestation en cours…", emoji: "🧼" },
  ready: { msg: "Votre commande est prête !", emoji: "📦" },
  delivered: { msg: "Livrée — bon usage !", emoji: "🚚" },
  completed: { msg: "Commande terminée — merci !", emoji: "🎉" },
  cancelled: { msg: "Commande annulée", emoji: "❌" },
};

export function useOrderRealtime(orderId: string | undefined, onUpdate?: (row: any) => void) {
  const lastStatus = useRef<string | null>(null);
  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel("order-rt-" + orderId)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          const row = payload.new as any;
          const status = row.status;
          if (status && status !== lastStatus.current) {
            const t = STATUS_TOASTS[status];
            if (t && lastStatus.current !== null) {
              toast.success(`${t.emoji} ${t.msg}`);
            }
            lastStatus.current = status;
          }
          onUpdate?.(row);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);
}
