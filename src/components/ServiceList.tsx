import { useAppState } from "@/lib/store";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Scale } from "lucide-react";

interface ServiceListProps {
  category: "auto" | "pressing";
}

const ServiceList = ({ category }: ServiceListProps) => {
  const navigate = useNavigate();
  const { services } = useAppState();
  const filtered = services.filter((s) => s.category === category);

  return (
    <div className="space-y-3">
      {filtered.map((service, i) => {
        const hasKg = service.options.some((o) => o.unit === "kg");
        return (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 24 }}
            className="glass-card rounded-2xl p-5 cursor-pointer group hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            onClick={() => navigate(`/order/${service.id}`)}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl hero-gradient flex items-center justify-center text-2xl shadow-md">
                {service.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  {service.name}
                  {hasKg && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full">
                      <Scale className="w-3 h-3" /> KG
                    </span>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground truncate">{service.description}</p>
                <p className="text-xs font-semibold text-primary mt-1">
                  à partir de {Math.min(...service.options.map((o) => o.price)).toLocaleString("fr-FR")} FCFA
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ServiceList;
