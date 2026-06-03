import { motion } from "framer-motion";
import { ArrowRight, MapPin, Bell, Moon, Sun, Clock, ChevronRight, Car, Shirt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/lib/store";
import { useTheme } from "@/hooks/use-theme";
import { useGeoETA } from "@/hooks/useGeoETA";
import LivePriceEstimator from "@/components/LivePriceEstimator";
import logo from "@/assets/logo.png";

const Hero = () => {
  const navigate = useNavigate();
  const { services } = useAppState();
  const { theme, toggleTheme } = useTheme();
  const geo = useGeoETA();

  const autoServices = services.filter((s) => s.category === "auto");
  const pressingServices = services.filter((s) => s.category === "pressing");

  return (
    <section className="relative bg-background min-h-screen">
      {/* Ambient background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-20 w-80 h-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-40 -left-24 w-72 h-72 rounded-full bg-secondary/15 blur-3xl" />
      </div>

      <div className="relative container max-w-lg mx-auto px-5 pt-6 pb-6">
        {/* iOS-style Header */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-7"
        >
          {/* Logo card */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-16 h-16 bg-card rounded-2xl shadow-sm border border-border/60 flex items-center justify-center overflow-hidden"
          >
            <img
              src={logo}
              alt="WashGo Niger"
              className="w-14 h-14 object-contain mix-blend-multiply dark:mix-blend-screen"
            />
          </motion.div>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-muted/70 backdrop-blur-md px-3 py-2 rounded-full border border-border/60 shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-secondary" />
              <span className="text-[12px] font-semibold text-foreground">Niamey</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              aria-label="Changer le thème"
              className="w-10 h-10 rounded-full bg-muted/70 backdrop-blur-md border border-border/60 shadow-sm flex items-center justify-center text-foreground"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4" />}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/notifications")}
              aria-label="Voir les notifications"
              className="w-10 h-10 rounded-full bg-muted/70 backdrop-blur-md border border-border/60 shadow-sm flex items-center justify-center text-foreground relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-primary border-2 border-background" />
            </motion.button>
          </div>
        </motion.header>

        {/* Sculpted headline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-7"
        >
          <h1 className="text-[34px] leading-[1.1] font-extrabold tracking-tight text-foreground">
            Que lavons-nous
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              aujourd'hui&nbsp;?
            </span>
          </h1>
          <p className="text-muted-foreground mt-2 font-medium text-[15px]">
            Commandez votre service en 60s.
          </p>
        </motion.div>

        {/* Hero CTA Cards */}
        <div className="space-y-4">
          {/* Auto */}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/services/auto")}
            className="group relative w-full overflow-hidden rounded-[32px] p-[1.5px] bg-gradient-to-br from-primary to-[hsl(215_85%_22%)] premium-shadow text-left"
          >
            <div className="relative rounded-[30px] p-6 bg-gradient-to-br from-primary to-[hsl(215_85%_22%)]">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                  <Car className="w-7 h-7 text-white" />
                </div>
                <span className="px-3 py-1 bg-accent text-accent-foreground text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg">
                  Expert
                </span>
              </div>

              <div className="mt-10">
                <h2 className="text-2xl font-bold text-white tracking-tight">Lavage Auto</h2>
                <p className="text-white/70 text-sm mt-1">Nettoyage complet & vidange express</p>
                <div className="mt-5 flex items-center gap-2">
                  <span className="text-white font-bold text-[15px]">Démarrer</span>
                  <ArrowRight className="w-5 h-5 text-white transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute top-0 right-0 w-24 h-24 bg-[hsl(210_95%_55%/0.4)] rounded-full blur-2xl" />
            </div>
          </motion.button>

          {/* Pressing */}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/services/pressing")}
            className="group relative w-full overflow-hidden rounded-[32px] p-[1.5px] bg-gradient-to-br from-secondary to-[hsl(170_70%_28%)] premium-shadow text-left"
          >
            <div className="relative rounded-[30px] p-6 bg-gradient-to-br from-secondary to-[hsl(170_70%_28%)]">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                  <Shirt className="w-7 h-7 text-white" />
                </div>
                <span className="px-3 py-1 bg-white/20 text-white text-[10px] font-bold rounded-full backdrop-blur">
                  24h Express
                </span>
              </div>

              <div className="mt-10">
                <h2 className="text-2xl font-bold text-white tracking-tight">Pressing</h2>
                <p className="text-white/80 text-sm mt-1">Soin du textile & repassage pro</p>
                <div className="mt-5 flex items-center gap-2">
                  <span className="text-white font-bold text-[15px]">Démarrer</span>
                  <ArrowRight className="w-5 h-5 text-white transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
            </div>
          </motion.button>
        </div>

        {/* Live price estimator */}
        <LivePriceEstimator />

        {/* Glass info banner with geo-aware ETA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="mt-5 flex items-center justify-between p-4 rounded-3xl bg-muted/50 border border-border/60 backdrop-blur-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                Livraison garantie
              </p>
              <p className="text-sm font-semibold text-foreground">
                {geo.loading ? "Calcul de votre délai…" : geo.label}
              </p>
              {geo.available && geo.distanceKm !== null && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Distance ≈ {geo.distanceKm.toFixed(1)} km
                </p>
              )}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </motion.div>
    </section>
  );
};


/* ── Service Section ── */
interface ServiceSectionProps {
  title: string;
  emoji: string;
  services: ReturnType<typeof import("@/lib/store").useAppState>["services"];
  onSeeAll: () => void;
  onServiceClick: (id: string) => void;
  delay: number;
}

const ServiceSection = ({ title, emoji, services, onSeeAll, onServiceClick, delay }: ServiceSectionProps) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-bold text-foreground text-base flex items-center gap-2">
        <span className="w-8 h-8 rounded-xl hero-gradient flex items-center justify-center text-sm">{emoji}</span>
        {title}
      </h2>
      <button onClick={onSeeAll} className="text-xs font-semibold text-primary flex items-center gap-1 group">
        Tout voir <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>

    <div className="grid grid-cols-2 gap-3">
      {services.slice(0, 4).map((service, i) => (
        <motion.div
          key={service.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.08 + i * 0.06 }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.97 }}
          className="glass-card rounded-2xl p-4 cursor-pointer transition-all duration-200 group relative overflow-hidden"
          onClick={() => onServiceClick(service.id)}
        >
          <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-primary/5 blur-xl group-hover:bg-primary/15 transition-colors" />
          <div className="relative">
            <h3 className="font-bold text-foreground text-sm mb-1 leading-tight">{service.name}</h3>
            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 mb-2">{service.description}</p>
            <div className="flex items-center justify-between">
              {service.options && (service.options as any[]).length > 0 && (
                <p className="text-sm font-extrabold text-primary">
                  {Math.min(...(service.options as any[]).map((o: any) => o.price)).toLocaleString("fr-FR")} F
                </p>
              )}
              <div className="w-7 h-7 rounded-full hero-gradient flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

export default Hero;
