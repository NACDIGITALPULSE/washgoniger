import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, User as UserIcon, Phone as PhoneIcon, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const passwordSchema = z.string().min(8, "Au moins 8 caractères").max(72);
const nameSchema = z.string().trim().min(2, "Nom requis").max(80);
const phoneSchema = z.string().trim().min(8, "Numéro invalide").max(20);

// Normalise le numéro en chiffres uniquement et construit un email interne
// (Lovable Cloud exige un email pour les comptes password — invisible pour l'utilisateur)
const normalizePhone = (raw: string) => raw.replace(/\D/g, "");
const phoneToEmail = (phone: string) => `${normalizePhone(phone)}@phone.washgo.local`;

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const from = (location.state as any)?.from || "/";

  const [tab, setTab] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (session) navigate(from, { replace: true });
  }, [session, from, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const phRes = phoneSchema.safeParse(phone);
    const pRes = passwordSchema.safeParse(password);
    if (!phRes.success || !pRes.success) {
      toast.error(phRes.success ? pRes.error.issues[0].message : phRes.error.issues[0].message);
      return;
    }
    setLoading(true);
    const normalized = normalizePhone(phRes.data);

    // Résout l'email réel (couvre les comptes legacy créés en email/mot de passe)
    let emailToUse = phoneToEmail(normalized);
    try {
      const { data } = await supabase.functions.invoke("resolve-phone-login", {
        body: { phone: normalized },
      });
      if (data?.email) emailToUse = data.email;
    } catch {
      /* fallback to internal email */
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password: pRes.data,
    });
    setLoading(false);
    if (error) {
      toast.error("Numéro ou mot de passe incorrect");
      return;
    }
    toast.success("Bienvenue !");
  };

  const sendWelcomeWhatsApp = (phoneDigits: string, name: string) => {
    const intl = phoneDigits.startsWith("227") ? phoneDigits : `227${phoneDigits}`;
    const msg =
      `Bonjour ${name} 👋\n\n` +
      `Votre compte WashGo Niger a bien été créé avec le numéro +${intl}. ✅\n\n` +
      `Pour passer une commande :\n` +
      `1️⃣ Ouvrez l'application WashGo\n` +
      `2️⃣ Choisissez un service (Auto ou Pressing)\n` +
      `3️⃣ Sélectionnez vos options et la livraison\n` +
      `4️⃣ Validez le paiement (Cash, Nita ou Amanata)\n\n` +
      `Besoin d'aide ? Répondez à ce message.`;
    const url = `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const checks = [
      phoneSchema.safeParse(phone),
      passwordSchema.safeParse(password),
      nameSchema.safeParse(fullName),
    ];
    const failed = checks.find((c) => !c.success);
    if (failed && !failed.success) {
      toast.error(failed.error.issues[0].message);
      return;
    }
    const normalized = normalizePhone(phone);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: phoneToEmail(normalized),
      password,
      options: {
        emailRedirectTo: window.location.origin + "/",
        data: { full_name: fullName, phone: normalized },
      },
    });
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("registered") || msg.includes("already")) {
        toast.error("Ce numéro est déjà utilisé");
      } else if (msg.includes("password")) {
        toast.error("Mot de passe trop faible ou compromis. Choisissez-en un autre.");
      } else {
        toast.error("Erreur : " + error.message);
      }
      return;
    }
    toast.success("Compte créé ! 🎉");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="hero-gradient px-4 pt-12 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.18),transparent_60%)]" />
        <div className="relative container max-w-lg mx-auto">
          <Link to="/" className="flex items-center gap-1.5 text-primary-foreground/70 text-sm font-medium hover:text-primary-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-2xl bg-primary-foreground/15 backdrop-blur mx-auto mb-4 flex items-center justify-center shadow-xl"
            >
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <h1 className="text-2xl font-extrabold text-primary-foreground">WashGo Niger</h1>
            <p className="text-primary-foreground/70 text-sm mt-1">Connectez-vous avec votre numéro</p>
          </div>
        </div>
      </div>

      <div className="container max-w-lg mx-auto px-4 -mt-10 relative z-10 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6"
        >
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-2 mb-5 rounded-xl">
              <TabsTrigger value="login" className="rounded-lg">Connexion</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-0">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lphone">Téléphone</Label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="lphone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="88082987" className="pl-10 rounded-xl h-12" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lpwd">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="lpwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 rounded-xl h-12" required />
                  </div>
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full rounded-xl h-12 font-bold" disabled={loading}>
                  {loading ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-0">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sname">Nom complet</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="sname" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10 rounded-xl h-12" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sphone">Téléphone</Label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="sphone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="88082987" className="pl-10 rounded-xl h-12" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spwd">Mot de passe (8+ caractères)</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="spwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 rounded-xl h-12" required minLength={8} />
                  </div>
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full rounded-xl h-12 font-bold" disabled={loading}>
                  {loading ? "Création..." : "Créer mon compte"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
