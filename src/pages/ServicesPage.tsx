import PageHeader from "@/components/PageHeader";
import ServiceList from "@/components/ServiceList";
import BottomNav from "@/components/BottomNav";
import { useParams } from "react-router-dom";

const ServicesPage = () => {
  const { category } = useParams<{ category: "auto" | "pressing" }>();
  const title = category === "auto" ? "🚗 Services Auto" : "👕 Pressing";

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title={title} />
      <div className="container max-w-lg mx-auto px-4 py-6">
        <ServiceList category={category as "auto" | "pressing"} />
      </div>
      <BottomNav />
    </div>
  );
};

export default ServicesPage;
