import { SERVICES } from "@/lib/services";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface ServiceListProps {
  category: "auto" | "pressing";
}

const ServiceList = ({ category }: ServiceListProps) => {
  const navigate = useNavigate();
  const services = SERVICES.filter((s) => s.category === category);

  return (
    <div className="space-y-3">
      {services.map((service, i) => (
        <motion.div
          key={service.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass-card rounded-xl p-4 cursor-pointer hover:scale-[1.02] transition-transform"
          onClick={() => navigate(`/order/${service.id}`)}
        >
          <div className="flex items-center gap-4">
            <div className="text-3xl">{service.icon}</div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{service.name}</h3>
              <p className="text-sm text-muted-foreground">{service.description}</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-primary">
                {Math.min(...service.options.map((o) => o.price)).toLocaleString("fr-FR")} FCFA
              </div>
              <div className="text-xs text-muted-foreground">à partir de</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ServiceList;
