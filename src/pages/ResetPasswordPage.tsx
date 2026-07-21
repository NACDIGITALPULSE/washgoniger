import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone as PhoneIcon, ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";

const normalize = (raw: string) => raw.replace(/\D/g, "");
const passwordSchema = z.string().min(8, "Au moins 8 caractères").max(72);

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const p = params.get("phone");
    const c = params.get("code");
    if (p) setPhone(p);
    if (c && /^\d{6}$/.test(c)) setCode(c);
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = normalize(phone);
    if (digits.length < 8) return toast.error("Numéro invalide");
    if (!/^\d{6}$/.test(code.trim())) return toast.error("Le code doit faire 6 chiffres");
    const pRes = passwordSchema.safeParse(newPwd);
    if (!pRes.success) return toast.error(pRes.error.issues[0].message);
    if (newPwd !== confirmPwd) return toast.error("Les mots de passe ne correspondent pas");

    setLoading(true);
    const { data, error } = await supabase.functions.invoke("confirm-password-reset", {
      body: { phone: digits, code: code.trim(), newPassword: newPwd },
    });
    setLoading(false);

    if (error || !data?.success) {
      toast.error(data?.message || "Erreur, réessayez");
      return;
    }
    toast.success("Mot de passe réinitialisé ✅ Connectez-vous");
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="Réinitialiser le mot de passe — WashGo Niger" description="Définissez un nouveau mot de passe avec votre code de vérification." path="/reset-password" />
      <div className="hero-gradient px-4 pt-12 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.18),transparent_60%)]" />
        <div className="relative container max-w-lg mx-auto">
          <Link to="/forgot-password" className="flex items-center gap-1.5 text-primary-foreground/70 text-sm font-medium hover:text-primary-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-2xl bg-primary-foreground/15 backdrop-blur mx-auto mb-4 flex items-center justify-center shadow-xl"
            >
              <ShieldCheck className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <h1 className="text-2xl font-extrabold text-primary-foreground">Nouveau mot de passe</h1>
            <p className="text-primary-foreground/70 text-sm mt-1">Saisissez votre code à 6 chiffres</p>
          </div>
        </div>
      </div>

      <div className="container max-w-lg mx-auto px-4 -mt-10 relative z-10 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rphone">Téléphone</Label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="rphone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="88082987" className="pl-10 rounded-xl h-12" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rcode">Code de vérification (6 chiffres)</Label>
              <Input id="rcode" type="text" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="123456" className="rounded-xl h-12 tracking-widest text-center text-lg font-bold" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rpwd">Nouveau mot de passe (8+ caractères)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="rpwd" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="pl-10 rounded-xl h-12" required minLength={8} autoComplete="new-password" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rcfm">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="rcfm" type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} className="pl-10 rounded-xl h-12" required minLength={8} autoComplete="new-password" />
              </div>
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full rounded-xl h-12 font-bold" disabled={loading}>
              {loading ? "Validation..." : "Réinitialiser le mot de passe"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
