import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, MessageCircle, Home, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order } from "@/lib/services";

const ADMIN_WHATSAPP = "22788082987";

const OrderConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order as Order | undefined;

  if (!order) {
    navigate("/");
    return null;
  }

  const shareOnWhatsApp = () => {
    const message = `✅ J'ai passé une commande chez *WashGo Niger* !\n\n📋 ${order.service.name} — ${order.selectedOption.name}\n💰 ${order.total.toLocaleString("fr-FR")} FCFA\n📍 ${order.location === "domicile" ? "À domicile" : "Sur place"}\n\nContactez-les : wa.me/${ADMIN_WHATSAPP}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const contactAdmin = () => {
    const message = `Bonjour, je viens de passer une commande *${order.service.name}* (${order.total.toLocaleString("fr-FR")} FCFA). Mon nom est ${order.clientName}. Merci !`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6"
      >
        <CheckCircle2 className="w-10 h-10 text-success" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-extrabold text-foreground mb-2 text-center"
      >
        Commande envoyée ! 🎉
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground text-center text-sm mb-8 max-w-xs"
      >
        Votre commande a été reçue avec succès. Nous vous contacterons très bientôt.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl p-5 w-full max-w-sm mb-6 space-y-3"
      >
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Service</span>
          <span className="font-semibold text-foreground">{order.service.icon} {order.service.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Option</span>
          <span className="font-semibold text-foreground">{order.selectedOption.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Quantité</span>
          <span className="font-semibold text-foreground">{order.quantity}{order.selectedOption.unit === "kg" ? " kg" : ""}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Lieu</span>
          <span className="font-semibold text-foreground">{order.location === "domicile" ? "🏠 Domicile" : "🏪 Sur place"}</span>
        </div>
        <div className="flex justify-between text-sm pt-2 border-t border-border">
          <span className="font-bold text-foreground">Total</span>
          <span className="font-extrabold text-gradient text-lg">{order.total.toLocaleString("fr-FR")} FCFA</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-sm space-y-3"
      >
        <Button
          onClick={contactAdmin}
          className="w-full rounded-2xl h-12 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Contacter sur WhatsApp
        </Button>

        <Button
          variant="outline"
          onClick={shareOnWhatsApp}
          className="w-full rounded-2xl h-12"
        >
          Partager ma commande
        </Button>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="ghost" className="rounded-2xl" onClick={() => navigate("/my-orders")}>
            <ClipboardList className="w-4 h-4 mr-1" /> Mes commandes
          </Button>
          <Button variant="ghost" className="rounded-2xl" onClick={() => navigate("/")}>
            <Home className="w-4 h-4 mr-1" /> Accueil
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderConfirmationPage;
