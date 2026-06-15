// Offline order queue — persists orders in localStorage when the device is
// offline and flushes them to Supabase as soon as connectivity returns.
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const KEY = "washgo_pending_orders";

export type PendingOrder = {
  orderRow: Record<string, any>;
  loyaltyRow: Record<string, any> | null;
  queuedAt: string;
  orderNumber?: string;
};

export function getPending(): PendingOrder[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function savePending(list: PendingOrder[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("washgo:pending-changed", { detail: list.length }));
}

export function enqueueOrder(p: PendingOrder) {
  const list = getPending();
  list.push(p);
  savePending(list);
}

export function pendingCount(): number {
  return getPending().length;
}

let flushing = false;

export async function flushPending(): Promise<number> {
  if (flushing) return 0;
  flushing = true;
  try {
    const list = getPending();
    if (list.length === 0) return 0;
    const remaining: PendingOrder[] = [];
    let synced = 0;
    for (const p of list) {
      const { error } = await supabase.from("orders").insert(p.orderRow as any);
      if (error) {
        remaining.push(p);
        continue;
      }
      if (p.loyaltyRow) {
        await supabase.from("loyalty_points").insert(p.loyaltyRow as any);
      }
      synced++;
    }
    savePending(remaining);
    return synced;
  } finally {
    flushing = false;
  }
}

let initialized = false;

export function initOfflineSync() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const trySync = async () => {
    if (!navigator.onLine) return;
    if (pendingCount() === 0) return;
    const n = await flushPending();
    if (n > 0) {
      toast.success(
        `🔄 ${n} commande${n > 1 ? "s" : ""} synchronisée${n > 1 ? "s" : ""} avec succès`
      );
    }
  };

  window.addEventListener("online", trySync);
  // Attempt once at startup in case we already have a queue.
  setTimeout(trySync, 1500);
}
