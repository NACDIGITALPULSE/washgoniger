import { motion } from "framer-motion";
import { Car, Shirt, ArrowRight, MapPin, Star, Zap, Phone, Sparkles, Shield, Clock, Award, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/lib/store";
import logo from "@/assets/logo.png";

const Hero = () => {
  const navigate = useNavigate();
  const { services } = useAppState();

  const autoServices = services.filter((s) => s.category === "auto");
  const pressingServices = services.filter((s) => s.category === "pressing");

  return (
    <section className="relative overflow-hidden bg-background min-h-screen">
      {/* Header */}
      <div className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,0,0,0.15),transparent_60%)]" />
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-10 -left-16 w-40 h-40 rounded-full bg-white/5 blur-2xl" />

        <div className="relative container max-w-lg mx-auto px-5 pt-8 pb-20">
          {/* Logo + Location */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-3">
              <motion.img
                src={logo}
                alt="WashGo Niger"
                className="w-14 h-14 rounded-2xl p-0.5 object-contain shadow-lg"
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
              />
              <div>
                <h1 className="text-2xl font-extrabold text-primary-foreground tracking-tight leading-none">
                  WashGo <span className="text-primary-foreground/70 font-semibold text-sm">Niger</span>
                </h1>
                <p className="text-primary-foreground/50 text-[11px] font-medium mt-0.5">Lavage · Vidange · Pressing</p>
              </div>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="flex items-center gap-1 rounded-full bg-primary-foreground/15 backdrop-blur-sm px-3 py-1.5 border border-primary-foreground/20"
            >
              <MapPin className="w-3 h-3 text-primary-foreground/80" />
              <span className="text-[11px] font-semibold text-primary-foreground/90">Niamey</span>
            </motion.div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-center"
          >
            <motion.h2
              className="text-primary-foreground font-extrabold text-xl leading-tight mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Votre véhicule mérite le meilleur soin ✨
            </motion.h2>
            <p className="text-primary-foreground/70 text-sm mb-6 leading-relaxed max-w-[280px] mx-auto">
              Lavage auto & pressing à domicile. Rapide, fiable, abordable.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="secondary"
                size="lg"
                className="rounded-2xl h-13 px-6 text-sm font-bold shadow-lg flex-1 max-w-[160px] group"
                onClick={() => navigate("/services/auto")}
              >
                <Car className="w-5 h-5" />
                Auto
                <ArrowRight className="w-3.5 h-3.5 ml-auto group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                className="rounded-2xl h-13 px-6 text-sm font-bold border-2 border-primary-foreground/25 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20 shadow-lg flex-1 max-w-[160px] group"
                onClick={() => navigate("/services/pressing")}
              >
                <Shirt className="w-5 h-5" />
                Pressing
                <ArrowRight className="w-3.5 h-3.5 ml-auto group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating stats */}
      <div className="container max-w-lg mx-auto px-4 -mt-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="glass-card rounded-2xl p-4 flex items-center justify-around shadow-lg"
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
              {i > 0 && <div className="w-px h-8 bg-border -ml-1 mr-1" />}
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <div className="text-sm font-extrabold text-foreground leading-none">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Trust badges */}
      <div className="container max-w-lg mx-auto px-4 mt-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-2 overflow-x-auto scrollbar-none pb-1"
        >
          {[
            { icon: Shield, text: "Paiement sécurisé", bg: "bg-primary/10 text-primary" },
            { icon: Clock, text: "Service rapide", bg: "bg-secondary/10 text-secondary" },
            { icon: Award, text: "Qualité garantie", bg: "bg-warning/10 text-warning" },
          ].map((badge) => (
            <div key={badge.text} className={`flex items-center gap-1.5 ${badge.bg} rounded-full px-3 py-1.5 whitespace-nowrap`}>
              <badge.icon className="w-3 h-3" />
              <span className="text-[11px] font-semibold">{badge.text}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Services */}
      <div className="container max-w-lg mx-auto px-4 mt-6 space-y-5 pb-6">
        {/* Auto */}
        <ServiceSection
          title="Services Auto"
          emoji="🚗"
          services={autoServices}
          onSeeAll={() => navigate("/services/auto")}
          onServiceClick={(id) => navigate(`/order/${id}`)}
          delay={0.45}
        />

        {/* Pressing */}
        <ServiceSection
          title="Pressing"
          emoji="👕"
          services={pressingServices}
          onSeeAll={() => navigate("/services/pressing")}
          onServiceClick={(id) => navigate(`/order/${id}`)}
          delay={0.55}
        />

        {/* Promo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="hero-gradient rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="relative flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-4 h-4 text-primary-foreground/80" />
                <span className="text-xs font-bold text-primary-foreground/80 uppercase tracking-wider">Offre spéciale</span>
              </div>
              <p className="text-primary-foreground font-bold text-base leading-snug">
                -20% sur votre 1ère commande pressing
              </p>
              <p className="text-primary-foreground/60 text-xs mt-1">Utilisez le code BIENVENUE</p>
            </div>
            <div className="text-4xl">🎉</div>
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
              { step: "3", title: "Profitez", desc: "On s'occupe de tout, chez vous ou sur place", emoji: "✅" },
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

/* ── Extracted sub-component ── */

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
          className="glass-card rounded-2xl p-4 cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 group"
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
