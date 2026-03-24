import { motion } from "framer-motion";
import { Car, Shirt, Sparkles, ArrowRight, MapPin, Star, Zap, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/lib/store";

const Hero = () => {
  const navigate = useNavigate();
  const { services } = useAppState();

  const autoServices = services.filter((s) => s.category === "auto");
  const pressingServices = services.filter((s) => s.category === "pressing");

  return (
    <section className="relative overflow-hidden bg-background min-h-screen">
      {/* Top status bar area */}
      <div className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,0,0,0.15),transparent_60%)]" />

        <div className="relative container max-w-lg mx-auto px-5 pt-12 pb-20">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <p className="text-primary-foreground/60 text-sm font-medium">Bienvenue sur</p>
              <h1 className="text-3xl font-extrabold text-primary-foreground tracking-tight">
                CleanCar <span className="text-primary-foreground/70 font-semibold text-lg">Niger</span>
              </h1>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="flex items-center gap-1.5 rounded-full bg-primary-foreground/15 backdrop-blur-sm px-3 py-1.5 border border-primary-foreground/20"
            >
              <MapPin className="w-3.5 h-3.5 text-primary-foreground/80" />
              <span className="text-xs font-semibold text-primary-foreground/90">Niamey</span>
            </motion.div>
          </motion.div>

          {/* Main CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-center"
          >
            <p className="text-primary-foreground/75 text-sm mb-6 leading-relaxed max-w-[280px] mx-auto">
              Lavage auto & pressing à domicile ou sur place. Rapide, fiable, abordable.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="secondary"
                size="lg"
                className="rounded-2xl h-13 px-5 text-sm font-bold shadow-xl hover:shadow-2xl transition-all flex-1 max-w-[160px]"
                onClick={() => navigate("/services/auto")}
              >
                <Car className="w-4 h-4" />
                Auto
                <ArrowRight className="w-3.5 h-3.5 ml-auto" />
              </Button>
              <Button
                size="lg"
                className="rounded-2xl h-13 px-5 text-sm font-bold border-2 border-primary-foreground/25 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20 shadow-xl flex-1 max-w-[160px]"
                onClick={() => navigate("/services/pressing")}
              >
                <Shirt className="w-4 h-4" />
                Pressing
                <ArrowRight className="w-3.5 h-3.5 ml-auto" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating stats bar */}
      <div className="container max-w-lg mx-auto px-4 -mt-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="glass-card rounded-2xl p-4 flex items-center justify-around"
        >
          {[
            { icon: Star, value: "4.8", label: "Avis", color: "text-yellow-500" },
            { icon: Zap, value: "30min", label: "Délai", color: "text-primary" },
            { icon: Phone, value: "500+", label: "Clients", color: "text-secondary" },
          ].map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-2">
              {i > 0 && <div className="w-px h-8 bg-border -ml-1 mr-1" />}
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <div>
                <div className="text-sm font-extrabold text-foreground leading-none">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Services populaires */}
      <div className="container max-w-lg mx-auto px-4 mt-7 space-y-6 pb-8">
        {/* Auto section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-foreground text-base flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg hero-gradient flex items-center justify-center text-xs">🚗</span>
              Services Auto
            </h2>
            <button
              onClick={() => navigate("/services/auto")}
              className="text-xs font-semibold text-primary flex items-center gap-1"
            >
              Tout voir <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {autoServices.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.08 }}
                className="glass-card rounded-2xl p-4 min-w-[140px] flex-shrink-0 cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-transform"
                onClick={() => navigate(`/order/${service.id}`)}
              >
                <div className="text-2xl mb-2">{service.icon}</div>
                <div className="font-semibold text-foreground text-sm leading-tight">{service.name}</div>
                <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{service.description}</div>
                <div className="text-xs text-primary font-bold mt-2">
                  dès {service.options[0]?.price.toLocaleString("fr-FR") || "—"} F
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pressing section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-foreground text-base flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg hero-gradient flex items-center justify-center text-xs">👕</span>
              Pressing
            </h2>
            <button
              onClick={() => navigate("/services/pressing")}
              className="text-xs font-semibold text-primary flex items-center gap-1"
            >
              Tout voir <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {pressingServices.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.75 + i * 0.08 }}
                className="glass-card rounded-2xl p-4 min-w-[140px] flex-shrink-0 cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-transform"
                onClick={() => navigate(`/order/${service.id}`)}
              >
                <div className="text-2xl mb-2">{service.icon}</div>
                <div className="font-semibold text-foreground text-sm leading-tight">{service.name}</div>
                <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{service.description}</div>
                <div className="text-xs text-primary font-bold mt-2">
                  dès {service.options[0]?.price.toLocaleString("fr-FR") || "—"} F
                  {service.options[0]?.unit === "kg" ? "/kg" : ""}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Promo banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.85 }}
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
      </div>
    </section>
  );
};

export default Hero;
