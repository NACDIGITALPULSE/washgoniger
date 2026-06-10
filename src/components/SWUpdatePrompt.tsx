import { RefreshCw, X } from "lucide-react";
import { useSWUpdate } from "@/pwa/useSWUpdate";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SWUpdatePrompt() {
  const { needRefresh, updateServiceWorker } = useSWUpdate();
  const [dismissed, setDismissed] = useState(false);

  if (!needRefresh || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9998] mx-auto max-w-md rounded-2xl border border-border/60 bg-card/95 p-4 shadow-lg backdrop-blur-xl animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <RefreshCw className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            Mise à jour disponible
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Une nouvelle version de WashGo Niger est prête. Rechargez pour bénéficier des dernières améliorations.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={updateServiceWorker} className="h-8 text-xs">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Recharger l’app
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
              className="h-8 text-xs"
            >
              Plus tard
            </Button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
