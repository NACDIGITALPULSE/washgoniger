import { motion, AnimatePresence } from "framer-motion";
import { Car, Shirt, ArrowRight, MapPin, Star, Zap, Phone, Sparkles, Shield, Clock, Award, ChevronRight, Bell, Moon, Sun, Gift, Trophy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/lib/store";
import { useTheme } from "@/hooks/use-theme";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const REWARDS = [
  { points: 50, label: "500 F de réduction", value: 500, type: "discount" as const },
  { points: 100, label: "1 000 F de réduction", value: 1000, type: "discount" as const },
  { points: 200, label: "Lavage Standard gratuit", value: 3000, type: "free_service" as const },
  { points: 350, label: "Nettoyage Complet gratuit", value: 7000, type: "free_service" as const },
  { points: 500, label: "Vidange gratuite", value: 10000, type: "free_service" as const },
];

const Hero = () => {
  const navigate = useNavigate();
  const { services } = useAppState();
  const { theme, toggleTheme } = useTheme();
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  const autoServices = services.filter((s) => s.category === "auto");
  const pressingServices = services.filter((s) => s.category === "pressing");

  const savedPhone = localStorage.getItem("washgo_phone");

  useEffect(() => {
    if (!savedPhone) return;
    const fetchPoints = async () => {
      const { data } = await supabase
        .from("loyalty_points")
        .select("points")
        .eq("user_phone", savedPhone);
      if (data) setLoyaltyPoints(data.reduce((s, r) => s + r.points, 0));
    };
    fetchPoints();
  }, [savedPhone]);

  const redeemReward = async (reward: typeof REWARDS[0]) => {
    if (loyaltyPoints < reward.points) { toast.error("Points insuffisants"); return; }
    if (!savedPhone) return;
    setRedeeming(true);
    const { error } = await supabase.from("loyalty_points").insert({
      user_phone: savedPhone,
      points: -reward.points,
      source: `reward:${reward.label}`,
    });
    if (!error) {
      setLoyaltyPoints((prev) => prev - reward.points);
      toast.success(`🎁 ${reward.label} débloqué !`, { description: "Applicable à votre prochaine commande" });
    } else { toast.error("Erreur lors de l'échange"); }
    setRedeeming(false);
  };

  return (
    <section className="relative overflow-hidden bg-background min-h-screen">
      {/* Hero Header */}
      <div className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,0,0,0.12),transparent_60%)]" />

        <div className="relative container max-w-lg mx-auto px-5 pt-5 pb-14">
          {/* Top bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-5"
          >
            <div className="flex items-center gap-2.5">
              <motion.img
                src={logo}
                alt="WashGo Niger"
                className="w-10 h-10 rounded-xl object-contain shadow-lg bg-white/10 p-0.5"
                whileHover={{ rotate: [0, -5, 5, 0] }}
              />
              <div>
                <h1 className="text-lg font-extrabold text-primary-foreground tracking-tight leading-none">
                  WashGo <span className="text-primary-foreground/60 font-medium text-xs ml-0.5">Niger</span>
                </h1>
                <p className="text-primary-foreground/40 text-[10px] font-medium">Lavage · Vidange · Pressing</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Dark mode toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="w-8 h-8 rounded-full bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center border border-primary-foreground/15"
              >
                {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-primary-foreground/80" /> : <Moon className="w-3.5 h-3.5 text-primary-foreground/80" />}
              </motion.button>

              {/* Notification bell */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/notifications")}
                className="w-8 h-8 rounded-full bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center border border-primary-foreground/15 relative"
              >
                <Bell className="w-3.5 h-3.5 text-primary-foreground/80" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
              </motion.button>

              {/* Location badge */}
              <div className="flex items-center gap-1 rounded-full bg-primary-foreground/15 backdrop-blur-sm px-2.5 py-1.5 border border-primary-foreground/15">
                <MapPin className="w-3 h-3 text-primary-foreground/70" />
                <span className="text-[11px] font-semibold text-primary-foreground/80">Niamey</span>
              </div>
            </div>
          </motion.div>

          {/* Loyalty points bar */}
          {savedPhone && loyaltyPoints > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4"
            >
              <button
                onClick={() => setShowRewards(!showRewards)}
                className="w-full flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-primary-foreground/10"
              >
                <Gift className="w-4 h-4 text-yellow-300" />
                <span className="text-xs font-semibold text-primary-foreground/80">
                  {loyaltyPoints} points fidélité
                </span>
                <span className="text-[10px] text-primary-foreground/50 ml-auto flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> Échanger
                </span>
              </button>
              <AnimatePresence>
                {showRewards && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 space-y-1.5">
                      {REWARDS.map((r) => {
                        const canRedeem = loyaltyPoints >= r.points;
                        return (
                          <div key={r.points} className={`flex items-center gap-2 rounded-lg px-3 py-2 ${canRedeem ? "bg-primary-foreground/10" : "bg-primary-foreground/5 opacity-50"}`}>
                            <span className="text-xs">{r.type === "free_service" ? "🎁" : "💰"}</span>
                            <div className="flex-1">
                              <div className="text-[11px] font-semibold text-primary-foreground/90">{r.label}</div>
                              <div className="text-[9px] text-primary-foreground/50">{r.points} points</div>
                            </div>
                            <button
                              disabled={!canRedeem || redeeming}
                              onClick={() => redeemReward(r)}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${canRedeem ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30" : "bg-primary-foreground/5 text-primary-foreground/30"}`}
                            >
                              {canRedeem ? <Check className="w-3 h-3 inline" /> : "🔒"}
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

          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-center mb-5"
          >
            <h2 className="text-primary-foreground font-extrabold text-[22px] leading-tight mb-2">
              Votre véhicule mérite le meilleur soin ✨
            </h2>
            <p className="text-primary-foreground/60 text-sm leading-relaxed max-w-[280px] mx-auto">
              Lavage auto & pressing à domicile.<br />Rapide, fiable, abordable.
            </p>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex gap-3 justify-center max-w-[320px] mx-auto"
          >
            <Button
              variant="secondary"
              size="lg"
              className="rounded-2xl h-12 px-5 text-sm font-bold shadow-lg flex-1 group"
              onClick={() => navigate("/services/auto")}
            >
              <Car className="w-4.5 h-4.5" />
              Auto
              <ArrowRight className="w-3.5 h-3.5 ml-auto group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              className="rounded-2xl h-12 px-5 text-sm font-bold border-2 border-primary-foreground/20 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20 shadow-lg flex-1 group"
              onClick={() => navigate("/services/pressing")}
            >
              <Shirt className="w-4.5 h-4.5" />
              Pressing
              <ArrowRight className="w-3.5 h-3.5 ml-auto group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Floating stats bar */}
      <div className="container max-w-lg mx-auto px-4 -mt-7 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card rounded-2xl p-3.5 flex items-center justify-around shadow-lg"
        >
          {[
            { icon: Star, value: "4.8", label: "Avis", color: "text-yellow-500" },
            { icon: Zap, value: "30min", label: "Délai", color: "text-primary" },
            { icon: Phone, value: "500+", label: "Clients", color: "text-secondary" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              {i > 0 && <div className="w-px h-7 bg-border -ml-1 mr-1" />}
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              </div>
              <div>
                <div className="text-sm font-extrabold text-foreground leading-none">{stat.value}</div>
                <div className="text-[9px] text-muted-foreground">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Trust badges */}
      <div className="container max-w-lg mx-auto px-4 mt-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex gap-2 justify-center flex-wrap">
          {[
            { icon: Shield, text: "Paiement sécurisé", bg: "bg-primary/8 text-primary" },
            { icon: Clock, text: "Service rapide", bg: "bg-secondary/8 text-secondary" },
            { icon: Award, text: "Qualité garantie", bg: "bg-warning/10 text-warning" },
          ].map((badge) => (
            <div key={badge.text} className={`flex items-center gap-1.5 ${badge.bg} rounded-full px-3 py-1.5`}>
              <badge.icon className="w-3 h-3" />
              <span className="text-[10px] font-semibold">{badge.text}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Services */}
      <div className="container max-w-lg mx-auto px-4 mt-6 space-y-5 pb-6">
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
          className="hero-gradient rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
          <div className="relative flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-4 h-4 text-primary-foreground/80" />
                <span className="text-[10px] font-bold text-primary-foreground/70 uppercase tracking-wider">Programme fidélité</span>
              </div>
              <p className="text-primary-foreground font-bold text-base leading-snug">
                Gagnez des points à chaque commande !
              </p>
              <p className="text-primary-foreground/50 text-xs mt-1">1 commande = 10 points • 100 pts = 500 FCFA</p>
            </div>
            <div className="text-4xl">🎁</div>
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h2 className="font-bold text-foreground text-base mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg hero-gradient flex items-center justify-center text-xs">📋</span>
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
                className="glass-card rounded-xl p-3.5 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl hero-gradient flex items-center justify-center text-lg font-extrabold text-primary-foreground shrink-0">
                  {item.emoji}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-foreground text-sm">{item.title}</div>
                  <div className="text-[11px] text-muted-foreground">{item.desc}</div>
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
        <span className="w-7 h-7 rounded-lg hero-gradient flex items-center justify-center text-xs">{emoji}</span>
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
          <div className="w-11 h-11 rounded-xl hero-gradient flex items-center justify-center text-lg mb-2.5 shadow-sm group-hover:shadow-md transition-shadow">
            {service.icon}
          </div>
          <div className="font-semibold text-foreground text-sm leading-tight">{service.name}</div>
          <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{service.description}</div>
          <div className="text-xs text-primary font-bold mt-2 flex items-center gap-1">
            dès {service.options[0]?.price.toLocaleString("fr-FR") || "—"} F
            {service.options[0]?.unit === "kg" ? "/kg" : ""}
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

export default Hero;
