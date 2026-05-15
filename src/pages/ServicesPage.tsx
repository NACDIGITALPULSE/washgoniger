import PageHeader from "@/components/PageHeader";
import ServiceList from "@/components/ServiceList";
import BottomNav from "@/components/BottomNav";
import SEO from "@/components/SEO";
import { useParams } from "react-router-dom";

const ServicesPage = () => {
  const { category } = useParams<{ category: "auto" | "pressing" }>();
  const isAuto = category === "auto";
  const title = isAuto ? "🚗 Services Auto" : "👕 Pressing";
  const seoTitle = isAuto
    ? "Services Auto — Lavage & Vidange à Niamey | WashGo Niger"
    : "Pressing — Lavage & Repassage à Niamey | WashGo Niger";
  const seoDesc = isAuto
    ? "Lavage auto, vidange et entretien à domicile ou sur place à Niamey. Tarifs clairs, intervention rapide."
    : "Service de pressing à Niamey : lavage et repassage de vêtements. Collecte et livraison à domicile.";

  return (
    <div className="min-h-screen pb-20">
      <SEO title={seoTitle} description={seoDesc} path={`/services/${category}`} />
      <PageHeader title={title} />
      <div className="container max-w-lg mx-auto px-4 py-6">
        <ServiceList category={category as "auto" | "pressing"} />
      </div>
      <BottomNav />
    </div>
  );
};

export default ServicesPage;
