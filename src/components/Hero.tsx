import { motion } from "framer-motion";
import { Car, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden px-4 pt-20 pb-16">
      {/* Background decoration */}
      <div className="absolute inset-0 hero-gradient opacity-5" />
      <div className="absolute top-20 right-0 w-72 h-72 rounded-full bg-secondary/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative container max-w-lg mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
            </span>
            Disponible maintenant à Niamey
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight mb-4">
            <span className="text-gradient">CleanCar</span>{" "}
            <span className="text-foreground">Niger</span>
          </h1>

          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            Auto • Pressing • Livraison à domicile
            <br />
            <span className="text-sm">Commandez en quelques clics 📲</span>
          </p>

          <div className="flex gap-3 justify-center">
            <Button variant="hero" size="lg" onClick={() => navigate("/services/auto")}>
              <Car className="w-5 h-5" />
              Auto
            </Button>
            <Button variant="hero" size="lg" onClick={() => navigate("/services/pressing")}>
              <Shirt className="w-5 h-5" />
              Pressing
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-3 gap-4 mt-12"
        >
          {[
            { value: "500+", label: "Clients" },
            { value: "4.8★", label: "Note" },
            { value: "30min", label: "Délai moyen" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-4">
              <div className="text-xl font-bold text-primary">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
