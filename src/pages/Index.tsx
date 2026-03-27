import Hero from "@/components/Hero";
import BottomNav from "@/components/BottomNav";
import WhatsAppFloat from "@/components/WhatsAppFloat";

const Index = () => {
  return (
    <div className="min-h-screen pb-20">
      <Hero />
      <WhatsAppFloat />
      <BottomNav />
    </div>
  );
};

export default Index;
