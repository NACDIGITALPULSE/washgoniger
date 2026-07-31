import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Home, ClipboardList, Navigation, Download, Upload, FileCheck, Send, Phone, Clock, MapPin, CreditCard, Package, Hash, UserCheck, MessageCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order, Agent } from "@/lib/services";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildReceiptPDF, downloadReceiptPDF } from "@/lib/receipt-pdf";
import { WhatsAppShareFallback } from "@/components/WhatsAppShareFallback";
import { useOrderRealtime } from "@/hooks/useOrderRealtime";

const ADMIN_WHATSAPP = "22788082987";
const IPAY_CHECKOUT_URL = "https://i-pay.money/merchant_payment_desks/489661832415";


const paymentBadge: Record<string, { label: string; color: string }> = {
  unpaid: { label: "Non payé", color: "bg-muted text-muted-foreground border-border" },
  pending: { label: "Paiement en attente", color: "bg-warning/15 text-warning border-warning/30" },
  paid: { label: "Payé", color: "bg-success/15 text-success border-success/30" },
  failed: { label: "Paiement échoué", color: "bg-destructive/15 text-destructive border-destructive/30" },
};

const statusBadge: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-warning/15 text-warning border-warning/30" },
  accepted: { label: "Acceptée", color: "bg-primary/15 text-primary border-primary/30" },
  in_progress: { label: "En cours", color: "bg-primary/15 text-primary border-primary/30" },
  ready: { label: "Prête", color: "bg-secondary/15 text-secondary border-secondary/30" },
  delivered: { label: "Livrée", color: "bg-secondary/15 text-secondary border-secondary/30" },
  completed: { label: "Terminée", color: "bg-success/15 text-success border-success/30" },
  cancelled: { label: "Annulée", color: "bg-destructive/15 text-destructive border-destructive/30" },
};

const OrderConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initial = location.state?.order as Order | undefined;
  const adminWA = location.state?.adminWhatsApp as { phone: string; message: string } | undefined;
  const clientWAInit = location.state?.clientWhatsApp as { phone: string; message: string } | undefined;
  const [order, setOrder] = useState<Order | undefined>(initial);
  const [agent, setAgent] = useState<Agent | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [whatsappFallback, setWhatsappFallback] = useState<{ text: string; phone: string; pdfUrl?: string } | null>(null);
  const [sharing, setSharing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Realtime updates on this order
  useOrderRealtime(order?.id, (row) => {
    setOrder((prev) =>
      prev
        ? {
            ...prev,
            status: row.status,
            paymentStatus: row.payment_status || "unpaid",
            paymentRef: row.payment_ref || undefined,
            agentId: row.agent_id || undefined,
            agentEtaMin: row.agent_eta_min ?? undefined,
          }
        : prev
    );
  });

  // Load agent (public view — no phone)
  useEffect(() => {
    if (!order?.agentId) {
      setAgent(null);
      return;
    }
    (supabase as any).from("agents_public").select("*").eq("id", order.agentId).maybeSingle().then(({ data }: any) => {
      if (data) setAgent({ ...data, phone: "" } as any);
    });
  }, [order?.agentId]);

  // Pull the authoritative status/payment state (e.g. after coming back from iPay)
  const refreshOrder = async (silent = true) => {
    if (!order?.id) return;
    if (!silent) setCheckingPayment(true);
    const { data } = await supabase
      .from("orders")
      .select("status,payment_status,payment_ref,agent_id,agent_eta_min")
      .eq("id", order.id)
      .maybeSingle();
    if (data) {
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status: data.status as Order["status"],
              paymentStatus: (data.payment_status as Order["paymentStatus"]) || "unpaid",
              paymentRef: data.payment_ref || undefined,
              agentId: data.agent_id || undefined,
              agentEtaMin: data.agent_eta_min ?? undefined,
            }
          : prev
      );
      if (!silent) {
        if (data.payment_status === "paid") toast.success("Paiement confirmé ✅");
        else toast.info("Paiement pas encore confirmé");
      }
    }
    setCheckingPayment(false);
  };

  useEffect(() => {
    refreshOrder(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id]);

  const cancelOrder = async () => {
    if (!order || cancelling) return;
    setCancelling(true);
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", order.id);
    setCancelling(false);
    if (error) {
      toast.error("Impossible d'annuler cette commande");
      return;
    }
    setOrder((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
    toast.success("Commande annulée");
  };

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

  const etaMin = order.agentEtaMin ?? 35;
  const eta = new Date(Date.now() + etaMin * 60 * 1000).toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit"
  });

  const paymentLabels: Record<string, string> = { cash: "Cash", nita: "Nita", amanata: "Amanata" };

  const buildInvoicePDF = () => buildReceiptPDF(order);

  const downloadInvoicePDF = () => {
    downloadReceiptPDF(order);
    toast.success("Reçu PDF téléchargé !");
  };

  // Upload PDF to Supabase storage, return public URL
  const uploadPdfToStorage = async (): Promise<string | null> => {
    try {
      const blob = buildInvoicePDF().output("blob");
      const path = `${order.id}/receipt-${Date.now()}.pdf`;
      const { error } = await supabase.storage.from("receipts").upload(path, blob, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (error) return null;
      const { data } = supabase.storage.from("receipts").getPublicUrl(path);
      return data.publicUrl;
    } catch {
      return null;
    }
  };

  const sendReceiptWhatsApp = async () => {
    if (sharing) return;
    setSharing(true);

    const optionsText = optionsList
      .map(({ option, quantity }) => `• ${option.name} × ${quantity}${option.unit === "kg" ? " kg" : ""} — ${(option.price * quantity).toLocaleString("fr-FR")} F`)
      .join("\n");

    // Upload PDF first → URL is the most reliable channel
    toast.info("Préparation du reçu…");
    const pdfUrl = await uploadPdfToStorage();

    const messageBase = `🧾 *Reçu WashGo Niger*\n\n*N°* ${orderNumber}\n*Date :* ${orderDate}\n\n*Client :* ${order.clientName}\n*Tél :* ${order.clientPhone}\n\n*Service :* ${order.service.icon} ${order.service.name}\n${optionsText}\n\n*Lieu :* ${order.location === "domicile" ? "🏠 Domicile" : "🏪 Sur place"}\n*Paiement :* ${paymentLabels[order.payment] || order.payment}\n\n*TOTAL : ${order.total.toLocaleString("fr-FR")} FCFA*\n\n🎁 +10 points fidélité\nMerci pour votre confiance !`;
    const message = pdfUrl ? `${messageBase}\n\n📎 Reçu PDF : ${pdfUrl}` : messageBase;

    const phone = order.clientPhone.replace(/\D/g, "");
    const fullPhone = phone.startsWith("227") ? phone : `227${phone}`;

    // Try native share (mobile)
    try {
      const blob = buildInvoicePDF().output("blob");
      const file = new File([blob], `Facture-${orderNumber}.pdf`, { type: "application/pdf" });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: `Reçu WashGo ${orderNumber}`, text: message });
        toast.success("Reçu partagé !");
        setSharing(false);
        return;
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setSharing(false);
        return;
      }
    }

    // Open WhatsApp with the message (containing the PDF link)
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    const popup = window.open(url, "_blank");

    // Always show fallback to give the user a reliable PDF link to share
    setWhatsappFallback({ text: message, phone: fullPhone, pdfUrl: pdfUrl || undefined });
    if (!popup) {
      toast.info("WhatsApp bloqué — utilisez le panneau ci-dessous.");
    } else if (pdfUrl) {
      toast.success("WhatsApp ouvert. Le lien PDF est inclus dans le message.");
    }
    setSharing(false);
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

  const sBadge = statusBadge[order.status];
  const payStatus = order.paymentStatus || "unpaid";
  const pBadge = paymentBadge[payStatus] || paymentBadge.unpaid;

  return (
    <div className="min-h-screen bg-background relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-20 w-80 h-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-40 -left-24 w-72 h-72 rounded-full bg-secondary/15 blur-3xl" />
      </div>

      <div className="relative container max-w-lg mx-auto px-5 pt-8 pb-36">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.05 }}
          className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl mb-5"
        >
          <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="text-3xl font-extrabold tracking-tight text-center text-foreground"
        >
          Commande confirmée
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-center text-muted-foreground text-sm mt-1 mb-4"
        >
          Notifiez l'admin sur WhatsApp pour valider votre commande.
        </motion.p>

        {adminWA && (
          <motion.a
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            href={`https://wa.me/${adminWA.phone}?text=${encodeURIComponent(adminWA.message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-5 mx-auto max-w-sm flex items-center justify-center gap-2 h-12 px-5 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold shadow-lg active:scale-[0.98] transition-transform"
          >
            <MessageCircle className="w-5 h-5" />
            Notifier l'admin sur WhatsApp
          </motion.a>
        )}

        {clientWAInit && (() => {
          const statusLine = `📡 *Statut actuel:* ${statusBadge[order.status]?.label || order.status}`;
          // Rebuild the client message with the live status (sync from admin → client)
          const updatedMsg = clientWAInit.message.replace(
            /📡 \*Statut actuel:\*[^\n]*/,
            statusLine
          );
          return (
            <motion.a
              key={order.status}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              href={`https://wa.me/${clientWAInit.phone}?text=${encodeURIComponent(updatedMsg)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-5 mx-auto max-w-sm flex items-center justify-center gap-2 h-12 px-5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg active:scale-[0.98] transition-transform"
            >
              <MessageCircle className="w-5 h-5" />
              Recevoir ma confirmation WhatsApp
            </motion.a>
          );
        })()}




        {/* Order number + live status chip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="flex items-center justify-center gap-2 mb-6 flex-wrap"
        >
          <div className="flex items-center gap-1.5 bg-muted/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/60">
            <Hash className="w-3.5 h-3.5 text-primary" />
            <span className="text-[12px] font-bold text-foreground">{orderNumber}</span>
          </div>
          <motion.div
            key={order.status}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${sBadge.color}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            <span className="text-[11px] font-bold">{sBadge.label}</span>
          </motion.div>
          <motion.div
            key={payStatus}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${pBadge.color}`}
          >
            <CreditCard className="w-3 h-3" />
            <span className="text-[11px] font-bold">{pBadge.label}</span>
          </motion.div>
        </motion.div>

        {/* Paiement non confirmé → vérifier ou annuler */}
        {order.payment === "ipaymoney" && payStatus !== "paid" && order.status !== "cancelled" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-[24px] p-4 glass-card border border-warning/40 backdrop-blur-xl mb-4"
          >
            <p className="text-sm font-semibold text-foreground mb-1">Paiement non confirmé</p>
            <p className="text-[12px] text-muted-foreground mb-3">
              Si vous avez déjà payé sur iPay Money, actualisez le statut. Sinon, vous pouvez annuler cette commande.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="rounded-2xl h-11" disabled={checkingPayment} onClick={() => refreshOrder(false)}>
                {checkingPayment ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
                Vérifier
              </Button>
              <Button variant="outline" className="rounded-2xl h-11 text-destructive border-destructive/30" disabled={cancelling} onClick={cancelOrder}>
                {cancelling ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <XCircle className="w-4 h-4 mr-1.5" />}
                Annuler
              </Button>
            </div>
          </motion.div>
        )}

        {/* ETA Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
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

        {/* Agent Card */}
        {agent && (
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-[28px] p-5 glass-card border border-secondary/40 backdrop-blur-xl mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-lg">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Agent assigné</p>
                <p className="text-base font-bold text-foreground">{agent.name}</p>
                {agent.zone && <p className="text-[11px] text-muted-foreground">Zone {agent.zone}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <a href={`tel:${agent.phone}`} className="w-9 h-9 rounded-xl bg-primary/10 hover:bg-primary/15 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-primary" />
                </a>
                <a
                  href={`https://wa.me/${agent.phone.replace(/\D/g, "").replace(/^227?/, "227")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 flex items-center justify-center"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* Récap Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
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

        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
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
            <Button variant="ghost" className="rounded-2xl h-11" onClick={() => navigate("/tracking")}>
              <ClipboardList className="w-4 h-4 mr-1" /> Suivi
            </Button>
            <Button variant="ghost" className="rounded-2xl h-11" onClick={() => navigate("/")}>
              <Home className="w-4 h-4 mr-1" /> Accueil
            </Button>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
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
            disabled={sharing}
            className="col-span-2 rounded-2xl h-12 bg-[#25D366] hover:bg-[#25D366]/90 text-white font-bold"
          >
            <Send className="w-4 h-4 mr-1.5" />
            {sharing ? "..." : "WhatsApp"}
          </Button>
        </div>
      </motion.div>

      {whatsappFallback && (
        <WhatsAppShareFallback
          phone={whatsappFallback.phone}
          text={whatsappFallback.text}
          pdfUrl={whatsappFallback.pdfUrl}
          onDownload={downloadInvoicePDF}
          onClose={() => setWhatsappFallback(null)}
        />
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
