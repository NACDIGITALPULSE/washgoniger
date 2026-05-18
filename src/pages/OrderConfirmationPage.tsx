import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Home, ClipboardList, Navigation, Download, Upload, FileCheck, Send, Copy, Phone, Clock, MapPin, CreditCard, Package, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order } from "@/lib/services";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildReceiptPDF, downloadReceiptPDF } from "@/lib/receipt-pdf";

const ADMIN_WHATSAPP = "22788082987";

const OrderConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order as Order | undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [whatsappFallback, setWhatsappFallback] = useState<{ text: string; phone: string } | null>(null);

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

  // ETA: 35min estimate
  const etaMin = 35;
  const eta = new Date(Date.now() + etaMin * 60 * 1000).toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit"
  });

  const paymentLabels: Record<string, string> = { cash: "Cash", nita: "Nita", amanata: "Amanata" };

  const buildInvoicePDF = () => buildReceiptPDF(order);

  const downloadInvoicePDF = () => {
    downloadReceiptPDF(order);
    toast.success("Reçu PDF téléchargé !");
  };

  const sendReceiptWhatsApp = async () => {
    const optionsText = optionsList
      .map(({ option, quantity }) => `• ${option.name} × ${quantity}${option.unit === "kg" ? " kg" : ""} — ${(option.price * quantity).toLocaleString("fr-FR")} F`)
      .join("\n");
    const message = `🧾 *Reçu WashGo Niger*\n\n*N°* ${orderNumber}\n*Date :* ${orderDate}\n\n*Client :* ${order.clientName}\n*Tél :* ${order.clientPhone}\n\n*Service :* ${order.service.icon} ${order.service.name}\n${optionsText}\n\n*Lieu :* ${order.location === "domicile" ? "🏠 Domicile" : "🏪 Sur place"}\n*Paiement :* ${paymentLabels[order.payment] || order.payment}\n\n*TOTAL : ${order.total.toLocaleString("fr-FR")} FCFA*\n\n🎁 +10 points fidélité\nMerci pour votre confiance !`;

    try {
      const blob = buildInvoicePDF().output("blob");
      const file = new File([blob], `Facture-${orderNumber}.pdf`, { type: "application/pdf" });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: `Reçu WashGo ${orderNumber}`, text: message });
        toast.success("Reçu partagé !");
        return;
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
    }

    buildInvoicePDF().save(`Facture-${orderNumber}.pdf`);
    const phone = order.clientPhone.replace(/\D/g, "");
    const fullPhone = phone.startsWith("227") ? phone : `227${phone}`;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    const popup = window.open(url, "_blank");
    if (!popup) {
      try {
        await navigator.clipboard.writeText(message);
        setWhatsappFallback({ text: message, phone: fullPhone });
        toast.info("WhatsApp bloqué. Le message a été copié.");
      } catch {
        setWhatsappFallback({ text: message, phone: fullPhone });
        toast.info("WhatsApp bloqué. Utilisez le fallback ci-dessous.");
      }
      return;
    }
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
    await supabase.from("payment_receipts").insert({ order_id: order.id, receipt_url: receiptUrl, uploaded_by: "client" });
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
        const msg = `📍 *Position pour commande ${orderNumber}*\n${mapUrl}\n\nNom: ${order.clientName}\nTél: ${order.clientPhone}`;
        window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
      },
      () => toast.error("Impossible d'obtenir la position")
    );
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-20 w-80 h-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-40 -left-24 w-72 h-72 rounded-full bg-secondary/15 blur-3xl" />
      </div>

      <div className="relative container max-w-lg mx-auto px-5 pt-8 pb-36">
        {/* Success header */}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.05 }}
          className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl mb-5"
        >
          <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-3xl font-extrabold tracking-tight text-center text-foreground"
        >
          Commande confirmée
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-muted-foreground text-sm mt-1 mb-4"
        >
          L'admin a été notifié sur WhatsApp.
        </motion.p>

        {/* Order number chip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex items-center justify-center gap-2 mb-6"
        >
          <div className="flex items-center gap-1.5 bg-muted/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/60">
            <Hash className="w-3.5 h-3.5 text-primary" />
            <span className="text-[12px] font-bold text-foreground">{orderNumber}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary/15 px-3 py-1.5 rounded-full border border-secondary/30">
            <span className="text-[11px] font-semibold text-secondary">+10 pts fidélité 🎁</span>
          </div>
        </motion.div>

        {/* ETA Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-[28px] p-5 glass-card border border-border/60 backdrop-blur-xl mb-4 relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Arrivée prévue</p>
                <p className="text-sm font-semibold text-foreground">{eta}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">ETA</p>
              <p className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                ≈ {etaMin} min
              </p>
            </div>
          </div>
        </motion.div>

        {/* Récap Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
          className="rounded-[28px] p-5 glass-card border border-border/60 backdrop-blur-xl mb-4"
        >
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3">Récapitulatif</p>
          <Row icon={<Package className="w-4 h-4 text-primary" />} label="Service" value={`${order.service.icon} ${order.service.name}`} />
          {optionsList.map(({ option, quantity }) => (
            <Row
              key={option.id}
              icon={<span className="text-xs">•</span>}
              label={`${option.name} × ${quantity}${option.unit === "kg" ? " kg" : ""}`}
              value={`${(option.price * quantity).toLocaleString("fr-FR")} F`}
              muted
            />
          ))}
          <Row
            icon={<MapPin className="w-4 h-4 text-secondary" />}
            label="Lieu"
            value={order.location === "domicile" ? "🏠 Domicile" : "🏪 Sur place"}
          />
          <Row
            icon={<CreditCard className="w-4 h-4 text-primary" />}
            label="Paiement"
            value={paymentLabels[order.payment] || order.payment}
          />
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/40">
            <span className="text-sm font-bold text-foreground">Total</span>
            <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              {order.total.toLocaleString("fr-FR")} FCFA
            </span>
          </div>
        </motion.div>

        {/* Secondary actions */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="space-y-2.5"
        >
          {(order.payment === "nita" || order.payment === "amanata") && (
            <>
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={uploadReceipt} />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || receiptUploaded}
                variant="outline"
                className="w-full rounded-2xl h-12 backdrop-blur-md"
              >
                {receiptUploaded ? (
                  <><FileCheck className="w-4 h-4 mr-1.5" /> Reçu envoyé</>
                ) : uploading ? (
                  <><div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin mr-1.5" /> Envoi…</>
                ) : (
                  <><Upload className="w-4 h-4 mr-1.5" /> Joindre le reçu de paiement</>
                )}
              </Button>
            </>
          )}

          {order.location === "domicile" && (
            <Button variant="outline" onClick={shareLocation} className="w-full rounded-2xl h-12 backdrop-blur-md">
              <Navigation className="w-4 h-4 mr-2" /> Partager ma position
            </Button>
          )}

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <Button variant="ghost" className="rounded-2xl h-11" onClick={() => navigate("/my-orders")}>
              <ClipboardList className="w-4 h-4 mr-1" /> Suivi
            </Button>
            <Button variant="ghost" className="rounded-2xl h-11" onClick={() => navigate("/")}>
              <Home className="w-4 h-4 mr-1" /> Accueil
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Sticky bottom action bar */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-5 pt-3 bg-gradient-to-t from-background via-background/95 to-transparent backdrop-blur-md"
      >
        <div className="max-w-lg mx-auto grid grid-cols-5 gap-2">
          <Button
            onClick={downloadInvoicePDF}
            className="col-span-3 rounded-2xl h-12 bg-gradient-to-r from-primary to-secondary text-white font-bold shadow-lg active:scale-[0.98]"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Reçu PDF
          </Button>
          <Button
            onClick={sendReceiptWhatsApp}
            className="col-span-2 rounded-2xl h-12 bg-[#25D366] hover:bg-[#25D366]/90 text-white font-bold"
          >
            <Send className="w-4 h-4 mr-1.5" />
            WhatsApp
          </Button>
        </div>
      </motion.div>

      {/* WhatsApp fallback */}
      {whatsappFallback && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 left-4 right-4 z-50 bg-background rounded-3xl p-5 shadow-2xl border border-border space-y-4 max-w-sm mx-auto"
        >
          <div className="text-center">
            <div className="text-3xl mb-2">📱</div>
            <h3 className="font-bold text-foreground">WhatsApp bloqué</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Votre navigateur a bloqué l'ouverture automatique.
            </p>
          </div>

          <div className="rounded-xl bg-muted/50 p-3 space-y-2 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Numéro</span>
              <span className="text-sm font-bold text-foreground">+{whatsappFallback.phone}</span>
            </div>
            <textarea
              readOnly
              value={whatsappFallback.text}
              className="w-full bg-background rounded-lg p-2 text-[11px] text-foreground border border-border resize-none h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="rounded-xl h-11"
              onClick={() => {
                navigator.clipboard.writeText(whatsappFallback.text);
                toast.success("Texte copié !");
              }}
            >
              <Copy className="w-4 h-4 mr-1.5" /> Copier
            </Button>
            <Button
              className="rounded-xl h-11 bg-[#25D366] hover:bg-[#25D366]/90 text-white"
              onClick={() => {
                window.open(`https://wa.me/${whatsappFallback.phone}?text=${encodeURIComponent(whatsappFallback.text)}`, "_blank");
              }}
            >
              <Phone className="w-4 h-4 mr-1.5" /> WhatsApp
            </Button>
          </div>

          <Button
            variant="outline"
            className="w-full rounded-xl h-11 border-primary/30 text-primary hover:bg-primary/5"
            onClick={downloadInvoicePDF}
          >
            <Download className="w-4 h-4 mr-1.5" /> Télécharger le reçu PDF
          </Button>
          <Button variant="ghost" className="w-full rounded-xl" onClick={() => setWhatsappFallback(null)}>
            Fermer
          </Button>
        </motion.div>
      )}
    </div>
  );
};

const Row = ({
  icon, label, value, muted,
}: { icon: React.ReactNode; label: string; value: string; muted?: boolean }) => (
  <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center">{icon}</div>
      <span className={`text-sm ${muted ? "text-muted-foreground" : "text-foreground font-medium"}`}>{label}</span>
    </div>
    <span className="text-sm font-semibold text-foreground text-right">{value}</span>
  </div>
);

export default OrderConfirmationPage;
