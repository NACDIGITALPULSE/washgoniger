import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, MessageCircle, Home, ClipboardList, Navigation, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order } from "@/lib/services";
import { toast } from "sonner";
import { useRef } from "react";

const ADMIN_WHATSAPP = "22788082987";

const OrderConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order as Order | undefined;
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!order) {
    navigate("/");
    return null;
  }

  const optionsList = order.selectedOptions && order.selectedOptions.length > 0
    ? order.selectedOptions
    : [{ option: order.selectedOption, quantity: order.quantity }];

  const orderNumber = order.orderNumber || order.id.slice(0, 8).toUpperCase();
  const orderDate = new Date(order.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  const paymentLabels: Record<string, string> = {
    cash: "Cash", airtel_money: "Airtel Money", moov: "Moov Money",
    zamani: "Zamani", nita: "Nita", amanata: "Amanata"
  };

  const downloadInvoice = () => {
    const invoiceHTML = `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Facture ${orderNumber}</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; color: #1a1a2e; }
  .header { text-align: center; border-bottom: 3px solid #1565c0; padding-bottom: 15px; margin-bottom: 20px; }
  .logo { font-size: 28px; font-weight: 800; color: #1565c0; }
  .logo span { color: #2e7d32; }
  .subtitle { font-size: 11px; color: #666; margin-top: 4px; }
  .invoice-num { background: #f5f5f5; padding: 10px; border-radius: 8px; text-align: center; margin: 15px 0; }
  .invoice-num strong { font-size: 18px; color: #1565c0; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  th { background: #1565c0; color: white; padding: 8px 10px; text-align: left; font-size: 12px; }
  td { padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 13px; }
  .total-row td { font-weight: 800; font-size: 16px; border-top: 2px solid #1565c0; color: #1565c0; }
  .info { font-size: 12px; margin: 8px 0; }
  .info strong { color: #333; }
  .footer { text-align: center; margin-top: 25px; padding-top: 15px; border-top: 2px solid #eee; font-size: 11px; color: #888; }
  .whatsapp { color: #25D366; font-weight: bold; }
</style></head>
<body>
  <div class="header">
    <div class="logo">Wash<span>Go</span> Niger 🚗</div>
    <div class="subtitle">Services de lavage auto & pressing professionnel</div>
  </div>
  <div class="invoice-num">
    <div style="font-size:11px;color:#666;">FACTURE N°</div>
    <strong>${orderNumber}</strong>
    <div style="font-size:11px;color:#666;margin-top:4px;">${orderDate}</div>
  </div>
  <div class="info"><strong>Client :</strong> ${order.clientName}</div>
  <div class="info"><strong>Téléphone :</strong> ${order.clientPhone}</div>
  <div class="info"><strong>Lieu :</strong> ${order.location === "domicile" ? "🏠 À domicile" + (order.address ? " — " + order.address : "") : "🏪 Sur place"}</div>
  <div class="info"><strong>Paiement :</strong> ${paymentLabels[order.payment] || order.payment}</div>
  <table>
    <tr><th>Service / Option</th><th style="text-align:right;">Qté</th><th style="text-align:right;">Prix</th></tr>
    <tr><td colspan="3" style="font-weight:600;background:#f8f9fa;">${order.service.icon} ${order.service.name}</td></tr>
    ${optionsList.map(({ option, quantity }) => `
    <tr>
      <td>${option.name}</td>
      <td style="text-align:right;">${quantity}${option.unit === "kg" ? " kg" : ""}</td>
      <td style="text-align:right;">${(option.price * quantity).toLocaleString("fr-FR")} F</td>
    </tr>`).join("")}
    <tr class="total-row"><td colspan="2">TOTAL</td><td style="text-align:right;">${order.total.toLocaleString("fr-FR")} FCFA</td></tr>
  </table>
  <div class="footer">
    <p>Merci pour votre confiance ! 🙏</p>
    <p class="whatsapp">📱 WhatsApp : +227 88 08 29 87</p>
    <p>WashGo Niger — Niamey, Niger</p>
  </div>
</body></html>`;

    const blob = new Blob([invoiceHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Facture-${orderNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Facture téléchargée !");
  };

  const shareInvoiceWhatsApp = () => {
    const invoiceText = `🧾 *FACTURE WashGo Niger*\n\n📋 N° *${orderNumber}*\n📅 ${orderDate}\n\n👤 ${order.clientName}\n📞 ${order.clientPhone}\n\n🔧 *${order.service.icon} ${order.service.name}*\n${optionsList.map(o => `  • ${o.option.name} ×${o.quantity} — ${(o.option.price * o.quantity).toLocaleString("fr-FR")} F`).join("\n")}\n\n💰 *TOTAL : ${order.total.toLocaleString("fr-FR")} FCFA*\n📍 ${order.location === "domicile" ? "À domicile" : "Sur place"}\n💳 ${paymentLabels[order.payment] || order.payment}\n\n─────────────────\n🚗 *WashGo Niger*\n📱 +227 88 08 29 87\nMerci pour votre confiance ! 🙏`;
    window.open(`https://wa.me/?text=${encodeURIComponent(invoiceText)}`, "_blank");
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
        const message = `📍 *Position pour commande ${orderNumber}*\n${mapUrl}\n\nNom: ${order.clientName}\nTél: ${order.clientPhone}`;
        window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank");
      },
      () => toast.error("Impossible d'obtenir la position")
    );
  };

  const contactAdmin = () => {
    const message = `Bonjour, commande *N° ${orderNumber}* — ${order.service.name} (${order.total.toLocaleString("fr-FR")} FCFA). ${order.clientName}. Merci !`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
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
        className="text-2xl font-extrabold text-foreground mb-1 text-center"
      >
        Commande envoyée ! 🎉
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="text-sm font-semibold text-primary mb-1"
      >
        N° {orderNumber}
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground text-center text-sm mb-6 max-w-xs"
      >
        L'admin a été notifié automatiquement par WhatsApp.
      </motion.p>

      {/* Invoice card */}
      <motion.div
        ref={invoiceRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl p-5 w-full max-w-sm mb-6 space-y-3"
      >
        <div className="text-center mb-3">
          <div className="text-lg font-extrabold text-primary">WashGo Niger 🚗</div>
          <div className="text-[10px] text-muted-foreground">Facture N° {orderNumber}</div>
          <div className="text-[10px] text-muted-foreground">{orderDate}</div>
        </div>
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
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Paiement</span>
          <span className="font-semibold text-foreground">{paymentLabels[order.payment] || order.payment}</span>
        </div>
        <div className="flex justify-between text-sm pt-2 border-t border-border">
          <span className="font-bold text-foreground">Total</span>
          <span className="font-extrabold text-gradient text-lg">{order.total.toLocaleString("fr-FR")} FCFA</span>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-sm space-y-3"
      >
        {/* Download & share invoice */}
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={downloadInvoice} variant="outline" className="rounded-2xl h-12">
            <Download className="w-4 h-4 mr-1.5" />
            Télécharger
          </Button>
          <Button onClick={shareInvoiceWhatsApp} className="rounded-2xl h-12 bg-[#25D366] hover:bg-[#20BD5A] text-white">
            <Share2 className="w-4 h-4 mr-1.5" />
            Envoyer facture
          </Button>
        </div>

        <Button
          onClick={contactAdmin}
          variant="outline"
          className="w-full rounded-2xl h-12"
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
