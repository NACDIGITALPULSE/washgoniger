import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, MessageCircle, Home, ClipboardList, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order } from "@/lib/services";
import { toast } from "sonner";

const ADMIN_WHATSAPP = "22788082987";

const OrderConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order as Order | undefined;

  if (!order) {
    navigate("/");
    return null;
  }

  const optionsList = order.selectedOptions && order.selectedOptions.length > 0
    ? order.selectedOptions
    : [{ option: order.selectedOption, quantity: order.quantity }];

  const shareOnWhatsApp = () => {
    const optionsText = optionsList.map(o => `${o.option.name} ×${o.quantity}`).join(", ");
    const message = `✅ J'ai passé une commande chez *WashGo Niger* !\n\n📋 ${order.service.name} — ${optionsText}\n💰 ${order.total.toLocaleString("fr-FR")} FCFA\n📍 ${order.location === "domicile" ? "À domicile" : "Sur place"}\n\nContactez-les : wa.me/${ADMIN_WHATSAPP}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const contactAdmin = () => {
    const message = `Bonjour, je viens de passer une commande *${order.service.name}* (${order.total.toLocaleString("fr-FR")} FCFA). Mon nom est ${order.clientName}. Merci !`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const shareLocation = () => {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas disponible");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const message = `📍 Ma position pour la commande *${order.service.name}* :\n${mapUrl}\n\nNom: ${order.clientName}\nTél: ${order.clientPhone}`;
        window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank");
      },
      () => toast.error("Impossible d'obtenir la position")
    );
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
        Votre commande a été reçue. Vous recevrez une notification quand elle sera validée.
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
        {optionsList.map(({ option, quantity }) => (
          <div key={option.id} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{option.name} × {quantity}{option.unit === "kg" ? " kg" : ""}</span>
            <span className="font-semibold text-foreground">{(option.price * quantity).toLocaleString("fr-FR")} F</span>
          </div>
        ))}
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

        {order.location === "domicile" && (
          <Button
            variant="outline"
            onClick={shareLocation}
            className="w-full rounded-2xl h-12"
          >
            <Navigation className="w-4 h-4 mr-2" />
            📍 Partager ma position
          </Button>
        )}

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
