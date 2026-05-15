import Hero from "@/components/Hero";
import BottomNav from "@/components/BottomNav";
import SEO from "@/components/SEO";

const Index = () => {
  return (
    <div className="min-h-screen pb-20">
      <SEO
        title="WashGo Niger — Lavage auto, vidange & pressing à Niamey"
        description="Service de lavage auto, vidange et pressing à domicile ou sur place à Niamey. Commande rapide, paiement Cash, Nita ou Amanata."
        path="/"
      />
      <Hero />
      <BottomNav />
    </div>
  );
};

export default Index;
