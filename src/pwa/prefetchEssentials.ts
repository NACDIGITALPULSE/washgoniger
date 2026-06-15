// Warm the SW cache for essential MVP pages: services list, order page (services),
// and admin dashboard (orders + agents). Runs once on app boot, only when online.
import { supabase } from "@/integrations/supabase/client";

let started = false;

export function prefetchEssentials() {
  if (started) return;
  started = true;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;

  // Defer to idle so we don't compete with initial render.
  const run = async () => {
    try {
      await Promise.allSettled([
        supabase.from("services").select("*").order("created_at"),
        supabase.from("agents").select("*").order("created_at"),
      ]);
    } catch {
      /* offline or network error – ignore, SW will retry on next visit */
    }
  };

  const ric: any = (window as any).requestIdleCallback;
  if (typeof ric === "function") ric(run, { timeout: 4000 });
  else setTimeout(run, 1500);
}
