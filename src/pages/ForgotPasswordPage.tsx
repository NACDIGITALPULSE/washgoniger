import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone as PhoneIcon, ArrowLeft, KeyRound, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";

const normalize = (raw: string) => raw.replace(/\D/g, "");

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [adminWhatsapp, setAdminWhatsapp] = useState("22788082987");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = normalize(phone);
    if (digits.length < 8) {
      toast.error("Numéro invalide");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("request-password-reset", {
      body: { phone: digits },
    });
    setLoading(false);
    if (error || !data?.success) {
      toast.error(data?.message || "Erreur, réessayez");
      return;
    }
    setAdminWhatsapp(data.admin_whatsapp || "22788082987");
    setSent(true);
    toast.success("Demande envoyée !");
  };

  const openSupport = () => {
    const digits = normalize(phone);
    const msg = `Bonjour, j'ai oublié mon mot de passe WashGo Niger. Mon numéro : +${digits.startsWith("227") ? digits : "227" + digits}. Merci de m'envoyer mon code de vérification.`;
    window.open(`https://wa.me/${adminWhatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="Mot de passe oublié — WashGo Niger" description="Réinitialisez votre mot de passe WashGo Niger via un code envoyé par notre support WhatsApp." path="/forgot-password" />
      <div className="hero-gradient px-4 pt-12 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.18),transparent_60%)]" />
        <div className="relative container max-w-lg mx-auto">
          <Link to="/auth" className="flex items-center gap-1.5 text-primary-foreground/70 text-sm font-medium hover:text-primary-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Retour à la connexion
          </Link>
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-2xl bg-primary-foreground/15 backdrop-blur mx-auto mb-4 flex items-center justify-center shadow-xl"
            >
              <KeyRound className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <h1 className="text-2xl font-extrabold text-primary-foreground">Mot de passe oublié</h1>
            <p className="text-primary-foreground/70 text-sm mt-1">Recevez un code par WhatsApp</p>
          </div>
        </div>
      </div>

      <div className="container max-w-lg mx-auto px-4 -mt-10 relative z-10 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6"
        >
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Entrez le numéro de téléphone associé à votre compte. Un code de vérification à 6 chiffres vous sera transmis par notre support WhatsApp.
              </p>
              <div className="space-y-2">
                <Label htmlFor="fphone">Téléphone</Label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="fphone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="88082987" className="pl-10 rounded-xl h-12" required />
                </div>
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full rounded-xl h-12 font-bold" disabled={loading}>
                {loading ? "Envoi..." : "Recevoir mon code"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-success/10 border border-success/30 p-4 text-sm text-foreground">
                ✅ Demande enregistrée. Contactez notre support WhatsApp pour recevoir votre code de vérification à 6 chiffres (valable 15 minutes).
              </div>
              <Button onClick={openSupport} variant="hero" size="lg" className="w-full rounded-xl h-12 font-bold">
                <MessageCircle className="w-4 h-4 mr-2" /> Contacter le support WhatsApp
              </Button>
              <Button onClick={() => navigate(`/reset-password?phone=${encodeURIComponent(normalize(phone))}`)} variant="outline" size="lg" className="w-full rounded-xl h-12 font-bold">
                J'ai reçu mon code → Continuer
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
