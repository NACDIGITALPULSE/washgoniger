import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, MessageCircle, Home, ClipboardList, Navigation, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order } from "@/lib/services";
import { toast } from "sonner";
import jsPDF from "jspdf";

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

  const orderNumber = order.orderNumber || order.id.slice(0, 8).toUpperCase();
  const orderDate = new Date(order.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  const paymentLabels: Record<string, string> = {
    cash: "Cash", airtel_money: "Airtel Money", moov: "Moov Money",
    zamani: "Zamani", nita: "Nita", amanata: "Amanata"
  };

  const downloadInvoicePDF = () => {
    const doc = new jsPDF({ unit: "mm", format: "a5" });
    const w = doc.internal.pageSize.getWidth();
    let y = 15;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(21, 101, 192);
    doc.text("WashGo", w / 2 - 18, y);
    doc.setTextColor(46, 125, 50);
    doc.text("Niger", w / 2 + 14, y);
    doc.setFontSize(10);
    doc.setTextColor(100);
    y += 6;
    doc.text("Services de lavage auto & pressing", w / 2, y, { align: "center" });

    // Invoice number box
    y += 10;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(20, y - 4, w - 40, 18, 3, 3, "F");
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("FACTURE N°", w / 2, y + 1, { align: "center" });
    doc.setFontSize(16);
    doc.setTextColor(21, 101, 192);
    doc.text(orderNumber, w / 2, y + 9, { align: "center" });
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(orderDate, w / 2, y + 14, { align: "center" });

    // Client info
    y += 24;
    doc.setFontSize(10);
    doc.setTextColor(50);
    doc.text(`Client : ${order.clientName}`, 15, y);
    y += 6;
    doc.text(`Téléphone : ${order.clientPhone}`, 15, y);
    y += 6;
    const lieuText = order.location === "domicile"
      ? "À domicile" + (order.address ? " — " + order.address : "")
      : "Sur place";
    doc.text(`Lieu : ${lieuText}`, 15, y);
    y += 6;
    doc.text(`Paiement : ${paymentLabels[order.payment] || order.payment}`, 15, y);

    // Table header
    y += 10;
    doc.setFillColor(21, 101, 192);
    doc.rect(15, y - 4, w - 30, 8, "F");
    doc.setTextColor(255);
    doc.setFontSize(9);
    doc.text("Service / Option", 18, y + 1);
    doc.text("Qté", w - 50, y + 1, { align: "right" });
    doc.text("Prix", w - 18, y + 1, { align: "right" });

    // Service name
    y += 8;
    doc.setFillColor(248, 249, 250);
    doc.rect(15, y - 4, w - 30, 7, "F");
    doc.setTextColor(50);
    doc.setFontSize(10);
    doc.text(`${order.service.icon} ${order.service.name}`, 18, y + 1);

    // Options
    y += 7;
    doc.setFontSize(9);
    doc.setTextColor(60);
    optionsList.forEach(({ option, quantity }) => {
      doc.text(option.name, 20, y + 1);
      const qtyStr = `${quantity}${option.unit === "kg" ? " kg" : ""}`;
      doc.text(qtyStr, w - 50, y + 1, { align: "right" });
      doc.text(`${(option.price * quantity).toLocaleString("fr-FR")} F`, w - 18, y + 1, { align: "right" });
      doc.setDrawColor(230);
      doc.line(15, y + 4, w - 15, y + 4);
      y += 8;
    });

    // Total
    y += 2;
    doc.setDrawColor(21, 101, 192);
    doc.setLineWidth(0.5);
    doc.line(15, y - 2, w - 15, y - 2);
    doc.setFontSize(13);
    doc.setTextColor(21, 101, 192);
    doc.text("TOTAL", 18, y + 4);
    doc.text(`${order.total.toLocaleString("fr-FR")} FCFA`, w - 18, y + 4, { align: "right" });

    // Footer
    y += 18;
    doc.setDrawColor(220);
    doc.line(15, y, w - 15, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(130);
    doc.text("Merci pour votre confiance !", w / 2, y, { align: "center" });
    y += 5;
    doc.setTextColor(37, 211, 102);
    doc.text("WhatsApp : +227 88 08 29 87", w / 2, y, { align: "center" });
    y += 5;
    doc.setTextColor(130);
    doc.text("WashGo Niger — Niamey, Niger", w / 2, y, { align: "center" });

    doc.save(`Facture-${orderNumber}.pdf`);
    toast.success("Facture PDF téléchargée !");
  };

  const contactAdmin = () => {
    const invoiceText = `🧾 *FACTURE WashGo Niger*\n\n📋 N° *${orderNumber}*\n📅 ${orderDate}\n\n👤 ${order.clientName}\n📞 ${order.clientPhone}\n\n🔧 *${order.service.icon} ${order.service.name}*\n${optionsList.map(o => `  • ${o.option.name} ×${o.quantity} — ${(o.option.price * o.quantity).toLocaleString("fr-FR")} F`).join("\n")}\n\n💰 *TOTAL : ${order.total.toLocaleString("fr-FR")} FCFA*\n📍 ${order.location === "domicile" ? "À domicile" : "Sur place"}\n💳 ${paymentLabels[order.payment] || order.payment}\n\n─────────────────\n🚗 *WashGo Niger*\n📱 +227 88 08 29 87\nMerci pour votre confiance ! 🙏`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(invoiceText)}`, "_blank");
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
        <Button onClick={downloadInvoicePDF} variant="outline" className="w-full rounded-2xl h-12">
          <Download className="w-4 h-4 mr-1.5" />
          Télécharger la facture PDF
        </Button>

        <Button
          onClick={contactAdmin}
          className="w-full rounded-2xl h-12 bg-[#25D366] hover:bg-[#20BD5A] text-white"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Envoyer la facture par WhatsApp
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
