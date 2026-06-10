import { Wifi, WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useEffect, useState } from "react";

export function OfflineIndicator() {
  const isOnline = useNetworkStatus();
  const [visible, setVisible] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setVisible(true);
      setWasOffline(true);
    } else if (wasOffline) {
      // Keep visible briefly when coming back online
      const t = setTimeout(() => setVisible(false), 2500);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [isOnline, wasOffline]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-300 ${
        isOnline
          ? "bg-emerald-500/95 text-white"
          : "bg-amber-500/95 text-white"
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Connexion rétablie</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Vous êtes hors connexion — certaines fonctionnalités peuvent être limitées</span>
        </>
      )}
    </div>
  );
}
