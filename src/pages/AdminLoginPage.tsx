import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Lock, Mail, ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error("Email ou mot de passe incorrect");
        setLoading(false);
        return;
      }

      // Check admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        toast.error("Accès non autorisé");
        setLoading(false);
        return;
      }

      toast.success("Connexion réussie !");
      navigate("/admin");
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="hero-gradient px-4 pt-12 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.18),transparent_60%)]" />
        <div className="relative container max-w-lg mx-auto">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-primary-foreground/70 text-sm font-medium hover:text-primary-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-2xl hero-gradient mx-auto mb-4 flex items-center justify-center shadow-xl"
            >
              <ShieldCheck className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <h1 className="text-2xl font-extrabold text-primary-foreground">Administration</h1>
            <p className="text-primary-foreground/60 text-sm mt-1">CleanCar Niger</p>
          </div>
        </div>
      </div>

      <div className="container max-w-lg mx-auto px-4 -mt-10 relative z-10 flex-1">
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleLogin}
          className="glass-card rounded-2xl p-6 space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-foreground">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="pl-10 rounded-xl h-12"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-foreground">
              Mot de passe
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 rounded-xl h-12"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="hero"
            size="lg"
            className="w-full rounded-xl h-13 text-base font-bold"
            disabled={loading}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </motion.form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
