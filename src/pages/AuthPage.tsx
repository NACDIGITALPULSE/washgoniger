import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User as UserIcon, Phone as PhoneIcon, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";

const emailSchema = z.string().trim().email("Email invalide").max(255);
const passwordSchema = z.string().min(8, "Au moins 8 caractères").max(72);
const nameSchema = z.string().trim().min(2, "Nom requis").max(80);
const phoneSchema = z.string().trim().min(8, "Téléphone requis").max(20);

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const from = (location.state as any)?.from || "/";

  const [tab, setTab] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (session) navigate(from, { replace: true });
  }, [session, from, navigate]);

  const handleGoogle = async () => {
    setLoading(true);
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (r.error) {
      toast.error("Connexion Google échouée");
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const eRes = emailSchema.safeParse(email);
    const pRes = passwordSchema.safeParse(password);
    if (!eRes.success || !pRes.success) {
      toast.error(eRes.success ? pRes.error.issues[0].message : eRes.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: eRes.data, password: pRes.data });
    setLoading(false);
    if (error) {
      toast.error("Email ou mot de passe incorrect");
      return;
    }
    toast.success("Bienvenue !");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const checks = [
      emailSchema.safeParse(email),
      passwordSchema.safeParse(password),
      nameSchema.safeParse(fullName),
      phoneSchema.safeParse(phone),
    ];
    const failed = checks.find((c) => !c.success);
    if (failed && !failed.success) {
      toast.error(failed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/",
        data: { full_name: fullName, phone },
      },
    });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("registered")) {
        toast.error("Cet email est déjà utilisé");
      } else if (error.message.toLowerCase().includes("password")) {
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
            <p className="text-primary-foreground/70 text-sm mt-1">Connectez-vous pour commander</p>
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

            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl h-12 mb-4"
              onClick={handleGoogle}
              disabled={loading}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
              Continuer avec Google
            </Button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">ou</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <TabsContent value="login" className="space-y-4 mt-0">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lemail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="lemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 rounded-xl h-12" required />
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
                    <Input id="sphone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="88082987" className="pl-10 rounded-xl h-12" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="semail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 rounded-xl h-12" required />
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
