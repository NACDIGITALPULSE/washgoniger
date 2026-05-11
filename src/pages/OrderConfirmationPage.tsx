import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Home, ClipboardList, Navigation, Download, Upload, FileCheck, Send, Copy, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order } from "@/lib/services";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

const ADMIN_WHATSAPP = "22788082987";

const OrderConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order as Order | undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [receiptUploaded, setReceiptUploaded] = useState(false);

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
    cash: "Cash", nita: "Nita", amanata: "Amanata"
  };

  const buildInvoicePDF = () => {
    const doc = new jsPDF({ unit: "mm", format: "a5" });
    const w = doc.internal.pageSize.getWidth();
    let y = 15;

    doc.setFontSize(22);
    doc.setTextColor(21, 101, 192);
    doc.text("WashGo", w / 2 - 18, y);
    doc.setTextColor(46, 125, 50);
    doc.text("Niger", w / 2 + 14, y);
    doc.setFontSize(10);
    doc.setTextColor(100);
    y += 6;
    doc.text("Services de lavage auto & pressing", w / 2, y, { align: "center" });

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

    y += 10;
    doc.setFillColor(21, 101, 192);
    doc.rect(15, y - 4, w - 30, 8, "F");
    doc.setTextColor(255);
    doc.setFontSize(9);
    doc.text("Service / Option", 18, y + 1);
    doc.text("Qté", w - 50, y + 1, { align: "right" });
    doc.text("Prix", w - 18, y + 1, { align: "right" });

    y += 8;
    doc.setFillColor(248, 249, 250);
    doc.rect(15, y - 4, w - 30, 7, "F");
    doc.setTextColor(50);
    doc.setFontSize(10);
    doc.text(`${order.service.icon} ${order.service.name}`, 18, y + 1);

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

    y += 2;
    doc.setDrawColor(21, 101, 192);
    doc.setLineWidth(0.5);
    doc.line(15, y - 2, w - 15, y - 2);
    doc.setFontSize(13);
    doc.setTextColor(21, 101, 192);
    doc.text("TOTAL", 18, y + 4);
    doc.text(`${order.total.toLocaleString("fr-FR")} FCFA`, w - 18, y + 4, { align: "right" });

    y += 18;
    doc.setDrawColor(220);
    doc.line(15, y, w - 15, y);
    y += 6;
    doc.setFontSize(9);
    doc.setTextColor(130);
    doc.text("Merci pour votre confiance ! +10 points fidélité 🎁", w / 2, y, { align: "center" });
    y += 5;
    doc.setTextColor(37, 211, 102);
    doc.text("WhatsApp : +227 88 08 29 87", w / 2, y, { align: "center" });
    y += 5;
    doc.setTextColor(130);
    doc.text("WashGo Niger — Niamey, Niger", w / 2, y, { align: "center" });

    return doc;
  };

  const downloadInvoicePDF = () => {
    buildInvoicePDF().save(`Facture-${orderNumber}.pdf`);
    toast.success("Facture PDF téléchargée !");
  };

  const sendReceiptWhatsApp = async () => {
    const optionsText = optionsList
      .map(({ option, quantity }) => `• ${option.name} × ${quantity}${option.unit === "kg" ? " kg" : ""} — ${(option.price * quantity).toLocaleString("fr-FR")} F`)
      .join("\n");
    const message = `🧾 *Reçu WashGo Niger*\n\n*N°* ${orderNumber}\n*Date :* ${orderDate}\n\n*Client :* ${order.clientName}\n*Tél :* ${order.clientPhone}\n\n*Service :* ${order.service.icon} ${order.service.name}\n${optionsText}\n\n*Lieu :* ${order.location === "domicile" ? "🏠 Domicile" : "🏪 Sur place"}\n*Paiement :* ${paymentLabels[order.payment] || order.payment}\n\n*TOTAL : ${order.total.toLocaleString("fr-FR")} FCFA*\n\n🎁 +10 points fidélité\nMerci pour votre confiance !`;

    // Try native share with PDF file (mobile - opens WhatsApp with PDF attached)
    try {
      const blob = buildInvoicePDF().output("blob");
      const file = new File([blob], `Facture-${orderNumber}.pdf`, { type: "application/pdf" });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          title: `Reçu WashGo ${orderNumber}`,
          text: message,
        });
        toast.success("Reçu partagé !");
        return;
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
    }

    // Fallback: download PDF + open WhatsApp with text message
    buildInvoicePDF().save(`Facture-${orderNumber}.pdf`);
    const phone = order.clientPhone.replace(/\D/g, "");
    const fullPhone = phone.startsWith("227") ? phone : `227${phone}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, "_blank");
    toast.info("PDF téléchargé. Joignez-le manuellement dans WhatsApp.");
  };


  const uploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${order.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("receipts").upload(path, file);
    if (uploadError) {
      toast.error("Erreur lors de l'upload du reçu");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(path);
    const receiptUrl = urlData.publicUrl;

    await supabase.from("payment_receipts").insert({
      order_id: order.id,
      receipt_url: receiptUrl,
      uploaded_by: "client",
    });
    await supabase.from("orders").update({ receipt_url: receiptUrl }).eq("id", order.id);
    
    setReceiptUploaded(true);
    setUploading(false);
    toast.success("Reçu de paiement envoyé !");
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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.38 }}
        className="flex items-center gap-1.5 mb-4 bg-secondary/10 px-3 py-1.5 rounded-full"
      >
        <span className="text-xs font-semibold text-secondary">+10 points fidélité 🎁</span>
      </motion.div>

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
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={downloadInvoicePDF} variant="outline" className="rounded-2xl h-12">
            <Download className="w-4 h-4 mr-1" />
            Télécharger
          </Button>
          <Button onClick={sendReceiptWhatsApp} className="rounded-2xl h-12 bg-[#25D366] hover:bg-[#25D366]/90 text-white">
            <Send className="w-4 h-4 mr-1" />
            WhatsApp
          </Button>
        </div>

        {/* Receipt upload for Nita/Amanata */}
        {(order.payment === "nita" || order.payment === "amanata") && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={uploadReceipt}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || receiptUploaded}
              className="w-full rounded-2xl h-12 bg-primary hover:bg-primary/90"
            >
              {receiptUploaded ? (
                <><FileCheck className="w-4 h-4 mr-1.5" /> Reçu envoyé ✅</>
              ) : uploading ? (
                <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-1.5" /> Envoi...</>
              ) : (
                <><Upload className="w-4 h-4 mr-1.5" /> Joindre le reçu de paiement</>
              )}
            </Button>
          </>
        )}

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
