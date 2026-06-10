import { useState, useEffect, useCallback, useRef } from "react";

type SWUpdateState = {
  needRefresh: boolean;
  offlineReady: boolean;
  updateServiceWorker: () => void;
};

export function useSWUpdate(): SWUpdateState {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let refreshing = false;

    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    const checkForUpdate = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        registrationRef.current = reg;

        // If there's a waiting worker, an update is available
        if (reg.waiting && reg.active) {
          setNeedRefresh(true);
        }

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                // New update available
                setNeedRefresh(true);
              } else {
                // First install complete (app is now offline-capable)
                setOfflineReady(true);
              }
            }
          });
        });
      } catch {
        /* noop */
      }
    };

    checkForUpdate();

    // Also poll every 60 minutes for updates
    const interval = setInterval(() => {
      registrationRef.current?.update().catch(() => {
        /* noop */
      });
    }, 60 * 60 * 1000);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      clearInterval(interval);
    };
  }, []);

  const updateServiceWorker = useCallback(() => {
    const reg = registrationRef.current;
    if (!reg?.waiting) {
      window.location.reload();
      return;
    }
    // Tell the waiting SW to skip waiting and activate
    reg.waiting.postMessage({ type: "SKIP_WAITING" });
  }, []);

  return { needRefresh, offlineReady, updateServiceWorker };
}
