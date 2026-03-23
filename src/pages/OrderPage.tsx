import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SERVICES, ServiceOption, Order } from "@/lib/services";
import { useAppState } from "@/lib/store";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { MapPin, Phone, User, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const OrderPage = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { addOrder } = useAppState();
  const service = SERVICES.find((s) => s.id === serviceId);

  const [selectedOption, setSelectedOption] = useState<ServiceOption | null>(null);
  const [location, setLocation] = useState<"sur_place" | "domicile">("sur_place");
  const [payment, setPayment] = useState<Order["payment"]>("cash");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  if (!service) return <div className="p-8 text-center text-muted-foreground">Service introuvable</div>;

  const handleSubmit = () => {
    if (!selectedOption || !name || !phone) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    const order: Order = {
      id: crypto.randomUUID(),
      clientName: name,
      clientPhone: phone,
      service,
      selectedOption,
      location,
      address: location === "domicile" ? address : undefined,
      payment,
      status: "pending",
      createdAt: new Date(),
      total: selectedOption.price,
    };

    addOrder(order);
    toast.success("Commande envoyée ! 🎉");
    navigate("/my-orders");
  };

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title={`${service.icon} ${service.name}`} subtitle={service.description} />
      <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Options */}
        <section>
          <h3 className="font-semibold text-foreground mb-3">Choisir une option</h3>
          <div className="space-y-2">
            {service.options.map((opt) => (
              <motion.button
                key={opt.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedOption(opt)}
                className={`w-full glass-card rounded-xl p-4 text-left transition-all ${
                  selectedOption?.id === opt.id
                    ? "ring-2 ring-primary bg-primary/5"
                    : ""
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-foreground">{opt.name}</div>
                    {opt.description && (
                      <div className="text-xs text-muted-foreground">{opt.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">
                      {opt.price.toLocaleString("fr-FR")} FCFA
                    </span>
                    {selectedOption?.id === opt.id && (
                      <CheckCircle2 className="w-5 h-5 text-secondary" />
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Location */}
        <section>
          <h3 className="font-semibold text-foreground mb-3">📍 Lieu</h3>
          <div className="grid grid-cols-2 gap-3">
            {(["sur_place", "domicile"] as const).map((loc) => (
              <button
                key={loc}
                onClick={() => setLocation(loc)}
                className={`glass-card rounded-xl p-3 text-center transition-all ${
                  location === loc ? "ring-2 ring-primary bg-primary/5" : ""
                }`}
              >
                <div className="text-lg mb-1">{loc === "sur_place" ? "🏪" : "🏠"}</div>
                <div className="text-sm font-medium text-foreground">
                  {loc === "sur_place" ? "Sur place" : "À domicile"}
                </div>
              </button>
            ))}
          </div>
          {location === "domicile" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Votre adresse"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-10"
                />
              </div>
            </motion.div>
          )}
        </section>

        {/* Payment */}
        <section>
          <h3 className="font-semibold text-foreground mb-3">💳 Paiement</h3>
          <div className="grid grid-cols-2 gap-3">
            {([
              { id: "cash" as const, label: "Cash", emoji: "💵" },
              { id: "airtel_money" as const, label: "Airtel Money", emoji: "📱" },
              { id: "moov" as const, label: "Moov Money", emoji: "📱" },
              { id: "zamani" as const, label: "Zamani", emoji: "📱" },
            ]).map((p) => (
              <button
                key={p.id}
                onClick={() => setPayment(p.id)}
                className={`glass-card rounded-xl p-3 text-center transition-all ${
                  payment === p.id ? "ring-2 ring-primary bg-primary/5" : ""
                }`}
              >
                <div className="text-lg mb-1">{p.emoji}</div>
                <div className="text-xs font-medium text-foreground">{p.label}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Client info */}
        <section>
          <h3 className="font-semibold text-foreground mb-3">👤 Vos informations</h3>
          <div className="space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Votre nom" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" />
            </div>
          </div>
        </section>

        {/* Submit */}
        {selectedOption && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass-card rounded-xl p-4 mb-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{selectedOption.name}</span>
                <span>{selectedOption.price.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="flex justify-between font-bold text-foreground mt-2 pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">{selectedOption.price.toLocaleString("fr-FR")} FCFA</span>
              </div>
            </div>
            <Button variant="hero" size="lg" className="w-full" onClick={handleSubmit}>
              Commander maintenant
            </Button>
          </motion.div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default OrderPage;
