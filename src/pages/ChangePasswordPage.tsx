import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import SEO from "@/components/SEO";

const passwordSchema = z.string().min(8, "Au moins 8 caractères").max(72);

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) {
      toast.error("Session invalide. Reconnectez-vous.");
      return;
    }
    const newRes = passwordSchema.safeParse(newPwd);
    if (!newRes.success) {
      toast.error(newRes.error.issues[0].message);
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPwd === currentPwd) {
      toast.error("Le nouveau mot de passe doit être différent de l'ancien");
      return;
    }

    setLoading(true);
    // Re-vérifier le mot de passe actuel
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPwd,
    });
    if (signInErr) {
      setLoading(false);
      toast.error("Mot de passe actuel incorrect");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("password")) {
        toast.error("Mot de passe trop faible ou compromis. Choisissez-en un autre.");
      } else {
        toast.error("Erreur : " + error.message);
      }
      return;
    }
    toast.success("Mot de passe modifié avec succès ✅");
    navigate("/my-orders");
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      <SEO title="Modifier le mot de passe — WashGo Niger" description="Changez votre mot de passe WashGo Niger en toute sécurité." path="/change-password" />
      <PageHeader title="🔒 Mot de passe" />
      <div className="container max-w-lg mx-auto px-4 py-6">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour
        </Button>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6"
        >
          <h2 className="text-lg font-bold mb-1">Modifier le mot de passe</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Saisissez votre mot de passe actuel puis votre nouveau mot de passe.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cur">Mot de passe actuel</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="cur" type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} className="pl-10 rounded-xl h-12" required autoComplete="current-password" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">Nouveau mot de passe (8+ caractères)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="new" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="pl-10 rounded-xl h-12" required minLength={8} autoComplete="new-password" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cfm">Confirmer le nouveau mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="cfm" type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} className="pl-10 rounded-xl h-12" required minLength={8} autoComplete="new-password" />
              </div>
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full rounded-xl h-12 font-bold" disabled={loading}>
              {loading ? "Mise à jour..." : "Enregistrer"}
            </Button>
          </form>
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
};

export default ChangePasswordPage;
