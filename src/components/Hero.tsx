import { motion } from "framer-motion";
import { Car, Shirt, ArrowRight, MapPin, Star, Zap, Phone, Shield, Clock, Award, ChevronRight, Bell, Moon, Sun, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/lib/store";
import { useTheme } from "@/hooks/use-theme";
import logo from "@/assets/logo.png";

const Hero = () => {
  const navigate = useNavigate();
  const { services } = useAppState();
  const { theme, toggleTheme } = useTheme();

  const autoServices = services.filter((s) => s.category === "auto");
  const pressingServices = services.filter((s) => s.category === "pressing");

  return (
    <section className="relative overflow-hidden bg-background min-h-screen">
      <div className="relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-secondary/15 blur-3xl" />

        <div className="relative container max-w-lg mx-auto px-5 pt-5 pb-8">
          {/* Top bar - Logo enlarged, no small text */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <motion.img
                src={logo}
                alt="WashGo Niger"
                className="w-16 h-16 rounded-2xl object-contain shadow-xl bg-card p-1.5 border-2 border-primary/20"
                whileHover={{ rotate: [0, -5, 5, 0] }}
              />
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center border border-border"
              >
                {theme === "dark" ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4 text-foreground" />}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/notifications")}
                className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center border border-border relative"
              >
                <Bell className="w-4 h-4 text-foreground" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary animate-pulse border-2 border-background" />
              </motion.button>
              <div className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 border border-border">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">Niamey</span>
              </div>
            </div>
          </motion.div>

          {/* Brand name - large and visible */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-5"
          >
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight leading-none">
              WashGo <span className="text-primary">Niger</span>
            </h1>
            <p className="text-base font-semibold text-muted-foreground mt-1">Lavage · Vidange · Pressing</p>
          </motion.div>

          {/* Loyalty bar */}
          {savedPhone && loyaltyPoints > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-5">
              <button
                onClick={() => setShowRewards(!showRewards)}
                className="w-full flex items-center gap-2.5 bg-accent rounded-2xl px-4 py-3 border border-border"
              >
                <div className="w-8 h-8 rounded-xl hero-gradient flex items-center justify-center">
                  <Gift className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-sm font-bold text-foreground">{loyaltyPoints} pts</span>
                <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" /> Échanger
                </span>
              </button>
              <AnimatePresence>
                {showRewards && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="mt-2 space-y-2">
                      {REWARDS.map((r) => {
                        const canRedeem = loyaltyPoints >= r.points;
                        return (
                          <div key={r.points} className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${canRedeem ? "bg-card border-border" : "bg-muted border-transparent opacity-50"}`}>
                            <span className="text-sm">{r.type === "free_service" ? "🎁" : "💰"}</span>
                            <div className="flex-1">
                              <div className="text-xs font-bold text-foreground">{r.label}</div>
                              <div className="text-[10px] text-muted-foreground">{r.points} points</div>
                            </div>
                            <button
                              disabled={!canRedeem || redeeming}
                              onClick={() => redeemReward(r)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg ${canRedeem ? "hero-gradient text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                            >
                              {canRedeem ? <Check className="w-3.5 h-3.5 inline" /> : "🔒"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Hero card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="hero-gradient rounded-3xl p-6 mb-6 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="relative text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-14 h-14 rounded-2xl bg-primary-foreground/20 backdrop-blur flex items-center justify-center mx-auto mb-3"
              >
                <Sparkles className="w-7 h-7 text-primary-foreground" />
              </motion.div>
              <h2 className="text-primary-foreground font-bold text-xl leading-tight mb-2">
                Votre véhicule mérite<br />le meilleur soin
              </h2>
              <p className="text-primary-foreground/70 text-sm mb-5">
                Lavage auto & pressing à domicile
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  size="lg"
                  className="rounded-2xl h-12 px-6 text-sm font-bold bg-primary-foreground text-foreground hover:bg-primary-foreground/90 shadow-lg flex-1 max-w-[150px] group"
                  onClick={() => navigate("/services/auto")}
                >
                  <Car className="w-4 h-4" />
                  Auto
                  <ArrowRight className="w-3.5 h-3.5 ml-auto group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  className="rounded-2xl h-12 px-6 text-sm font-bold border-2 border-primary-foreground/30 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20 shadow-lg flex-1 max-w-[150px] group"
                  onClick={() => navigate("/services/pressing")}
                >
                  <Shirt className="w-4 h-4" />
                  Pressing
                  <ArrowRight className="w-3.5 h-3.5 ml-auto group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            {[
              { icon: Star, value: "4.8", label: "Avis", color: "text-warning" },
              { icon: Zap, value: "30min", label: "Délai", color: "text-primary" },
              { icon: Phone, value: "500+", label: "Clients", color: "text-secondary" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="glass-card rounded-2xl p-3 text-center"
              >
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center mx-auto mb-1.5">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className="text-base font-bold text-foreground leading-none">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="container max-w-lg mx-auto px-5 -mt-2 mb-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex gap-2 justify-center flex-wrap">
          {[
            { icon: Shield, text: "Paiement sécurisé" },
            { icon: Clock, text: "Service rapide" },
            { icon: Award, text: "Qualité garantie" },
          ].map((badge) => (
            <div key={badge.text} className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5 border border-border">
              <badge.icon className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-semibold text-foreground">{badge.text}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Services */}
      <div className="container max-w-lg mx-auto px-5 space-y-6 pb-6">
        <ServiceSection
          title="Services Auto"
          emoji="🚗"
          services={autoServices}
          onSeeAll={() => navigate("/services/auto")}
          onServiceClick={(id) => navigate(`/order/${id}`)}
          delay={0.45}
        />
        <ServiceSection
          title="Pressing"
          emoji="👕"
          services={pressingServices}
          onSeeAll={() => navigate("/services/pressing")}
          onServiceClick={(id) => navigate(`/order/${id}`)}
          delay={0.55}
        />

        {/* Promo banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="rounded-3xl p-5 relative overflow-hidden bg-secondary"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
          <div className="relative flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Trophy className="w-4 h-4 text-secondary-foreground/80" />
                <span className="text-[10px] font-bold text-secondary-foreground/70 uppercase tracking-wider">Fidélité</span>
              </div>
              <p className="text-secondary-foreground font-bold text-base leading-snug">
                Échangez vos points contre des cadeaux !
              </p>
              <p className="text-secondary-foreground/60 text-xs mt-1">50 pts = 500 F • 200 pts = Service gratuit</p>
            </div>
            <div className="text-4xl">🏆</div>
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <h2 className="font-bold text-foreground text-base mb-3 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl hero-gradient flex items-center justify-center text-sm">📋</span>
            Comment ça marche ?
          </h2>
          <div className="space-y-2.5">
            {[
              { step: "1", title: "Choisissez", desc: "Sélectionnez vos services et options", emoji: "👆" },
              { step: "2", title: "Commandez", desc: "Remplissez vos infos et confirmez", emoji: "📝" },
              { step: "3", title: "Suivez", desc: "Trackez votre commande en temps réel", emoji: "📍" },
              { step: "4", title: "Profitez", desc: "Récupérez votre véhicule impeccable", emoji: "✅" },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.85 + i * 0.1 }}
                className="glass-card rounded-2xl p-4 flex items-center gap-3"
              >
                <div className="w-11 h-11 rounded-xl hero-gradient flex items-center justify-center text-lg shrink-0">
                  {item.emoji}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-foreground text-sm">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
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
          className="glass-card rounded-2xl p-4 cursor-pointer hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 group"
          onClick={() => onServiceClick(service.id)}
        >
          <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
            {service.icon}
          </div>
          <h3 className="font-bold text-foreground text-sm mb-1 leading-tight">{service.name}</h3>
          <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 mb-2">{service.description}</p>
          {service.options && (service.options as any[]).length > 0 && (
            <p className="text-xs font-bold text-primary">
              {Math.min(...(service.options as any[]).map((o: any) => o.price)).toLocaleString("fr-FR")} F
            </p>
          )}
        </motion.div>
      ))}
    </div>
  </motion.div>
);

export default Hero;
