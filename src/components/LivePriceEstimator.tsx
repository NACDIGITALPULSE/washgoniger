import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Sparkles, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/lib/store";

type Category = "auto" | "pressing";

const LivePriceEstimator = () => {
  const { services } = useAppState();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category>("auto");
  const [optionId, setOptionId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  // Aggregate available options across services in the category
  const { availableOptions, defaults } = useMemo(() => {
    const filtered = services.filter((s) => s.category === category);
    const opts: { id: string; name: string; price: number; unit?: string; serviceId: string }[] = [];
    filtered.forEach((s) => {
      (s.options as any[])?.forEach((o: any) => {
        opts.push({ id: `${s.id}::${o.id}`, name: o.name, price: o.price, unit: o.unit, serviceId: s.id });
      });
    });
    return { availableOptions: opts.slice(0, 6), defaults: opts[0] };
  }, [services, category]);

  const selected = availableOptions.find((o) => o.id === optionId) || defaults;
  const total = selected ? selected.price * qty : 0;

  const handleCategory = (c: Category) => {
    setCategory(c);
    setOptionId(null);
    setServiceId(null);
    setQty(1);
  };

  const handleSelect = (o: typeof availableOptions[number]) => {
    setOptionId(o.id);
    setServiceId(o.serviceId);
  };

  const goOrder = () => {
    const target = serviceId || selected?.serviceId;
    if (target) navigate(`/order/${target}`);
    else navigate(`/services/${category}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
      className="mt-5 rounded-[28px] p-5 glass-card border border-border/60 backdrop-blur-xl relative overflow-hidden"
    >
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Estimation</p>
              <p className="text-[13px] font-bold text-foreground">Prix en temps réel</p>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex p-1 rounded-full bg-muted/70 border border-border/60">
            {(["auto", "pressing"] as Category[]).map((c) => (
              <button
                key={c}
                onClick={() => handleCategory(c)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                  category === c
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {c === "auto" ? "Auto" : "Pressing"}
              </button>
            ))}
          </div>
        </div>

        {/* Options chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {availableOptions.length === 0 && (
            <p className="text-xs text-muted-foreground">Chargement des tarifs…</p>
          )}
          {availableOptions.map((o) => {
            const active = (optionId ?? defaults?.id) === o.id;
            return (
              <button
                key={o.id}
                onClick={() => handleSelect(o)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-background/60 text-foreground border-border/60 hover:border-primary/50"
                }`}
              >
                {o.name}
              </button>
            );
          })}
        </div>

        {/* Qty + total */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 p-1 rounded-full bg-muted/70 border border-border/60">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-foreground active:scale-95"
              aria-label="Diminuer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="min-w-[26px] text-center text-sm font-bold text-foreground">
              {qty}
              {selected?.unit === "kg" ? " kg" : ""}
            </span>
            <button
              onClick={() => setQty((q) => Math.min(20, q + 1))}
              className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-foreground active:scale-95"
              aria-label="Augmenter"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Total</p>
            <AnimatePresence mode="wait">
              <motion.p
                key={total}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
              >
                {total.toLocaleString("fr-FR")} F
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <button
          onClick={goOrder}
          className="mt-4 w-full h-11 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform"
        >
          Commander maintenant
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default LivePriceEstimator;
