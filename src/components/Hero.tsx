import { motion } from "framer-motion";
import { Car, Shirt, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="hero-gradient px-4 pt-16 pb-24 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.1),transparent_50%)]" />

        <div className="relative container max-w-lg mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, type: "spring" }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-primary-foreground mb-6 border border-primary-foreground/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Disponible à Niamey
            </motion.div>

            <h1 className="text-5xl font-extrabold tracking-tight mb-3 text-primary-foreground">
              CleanCar
            </h1>
            <p className="text-xl font-semibold text-primary-foreground/90 mb-2">Niger</p>

            <p className="text-primary-foreground/70 text-base mb-8 leading-relaxed max-w-xs mx-auto">
              Services auto & pressing à portée de main. Commandez, on s'occupe du reste.
            </p>

            <div className="flex gap-3 justify-center">
              <Button
                variant="secondary"
                size="lg"
                className="rounded-2xl h-14 px-6 text-base font-bold shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate("/services/auto")}
              >
                <Car className="w-5 h-5" />
                Auto
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-2xl h-14 px-6 text-base font-bold border-primary-foreground/30 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20 shadow-lg"
                onClick={() => navigate("/services/pressing")}
              >
                <Shirt className="w-5 h-5" />
                Pressing
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats overlapping the gradient */}
      <div className="container max-w-lg mx-auto px-4 -mt-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { value: "500+", label: "Clients satisfaits", emoji: "👥" },
            { value: "4.8★", label: "Note moyenne", emoji: "⭐" },
            { value: "30min", label: "Délai moyen", emoji: "⚡" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-2xl p-4 text-center">
              <div className="text-lg mb-1">{stat.emoji}</div>
              <div className="text-xl font-extrabold text-foreground">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground leading-tight mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Quick services section */}
      <div className="container max-w-lg mx-auto px-4 mt-8 pb-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="font-bold text-foreground text-lg mb-4">Services populaires</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "🚗", name: "Lavage Auto", price: "3 000", path: "/order/lavage" },
              { icon: "🔧", name: "Vidange", price: "10 000", path: "/order/vidange" },
              { icon: "👕", name: "Pressing", price: "1 000", path: "/order/lavage-vetements" },
              { icon: "🚚", name: "Livraison", price: "1 000", path: "/order/livraison-pressing" },
            ].map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.08 }}
                className="glass-card rounded-2xl p-4 cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-transform"
                onClick={() => navigate(item.path)}
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="font-semibold text-foreground text-sm">{item.name}</div>
                <div className="text-xs text-primary font-bold mt-1">dès {item.price} F</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
