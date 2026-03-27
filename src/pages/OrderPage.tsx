import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ServiceOption, Order } from "@/lib/services";
import { useAppState } from "@/lib/store";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, User, CheckCircle2, Minus, Plus, Scale } from "lucide-react";
import { toast } from "sonner";

const OrderPage = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { addOrder, services } = useAppState();
  const service = services.find((s) => s.id === serviceId);

  const [selectedOption, setSelectedOption] = useState<ServiceOption | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState<"sur_place" | "domicile">("sur_place");
  const [payment, setPayment] = useState<Order["payment"]>("cash");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  if (!service) return <div className="p-8 text-center text-muted-foreground">Service introuvable</div>;

  const isKg = selectedOption?.unit === "kg";
  const total = selectedOption ? selectedOption.price * quantity : 0;

  const handleSelectOption = (opt: ServiceOption) => {
    setSelectedOption(opt);
    setQuantity(opt.unit === "kg" ? 1 : 1);
  };

  const handleSubmit = async () => {
    if (!selectedOption || !name || !phone) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (quantity <= 0) {
      toast.error("La quantité doit être supérieure à 0");
      return;
    }

    const order: Order = {
      id: crypto.randomUUID(),
      clientName: name,
      clientPhone: phone,
      service,
      selectedOption,
      quantity,
      location,
      address: location === "domicile" ? address : undefined,
      payment,
      status: "pending",
      createdAt: new Date(),
      total,
    };

    await addOrder(order);
    toast.success("Commande envoyée ! 🎉");
    navigate("/my-orders");
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      <PageHeader title={`${service.icon} ${service.name}`} subtitle={service.description} />
      <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Options */}
        <section>
          <h3 className="font-bold text-foreground mb-3 text-sm uppercase tracking-wide">Choisir une option</h3>
          <div className="space-y-2">
            {service.options.map((opt) => (
              <motion.button
                key={opt.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelectOption(opt)}
                className={`w-full rounded-2xl p-4 text-left transition-all border-2 ${
                  selectedOption?.id === opt.id
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-transparent glass-card"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {selectedOption?.id === opt.id ? (
                      <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        {opt.name}
                        {opt.unit === "kg" && <Scale className="w-3.5 h-3.5 text-secondary" />}
                      </div>
                      {opt.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">{opt.description}</div>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-primary text-sm">
                    {opt.price.toLocaleString("fr-FR")} FCFA
                    {opt.unit === "kg" && <span className="text-muted-foreground font-normal">/kg</span>}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Quantity for kg */}
        <AnimatePresence>
          {selectedOption && isKg && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h3 className="font-bold text-foreground mb-3 text-sm uppercase tracking-wide">⚖️ Poids (kg)</h3>
              <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
                <button
                  onClick={() => setQuantity(Math.max(0.5, quantity - 0.5))}
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-foreground">{quantity}</div>
                  <div className="text-xs text-muted-foreground">kilogramme{quantity > 1 ? "s" : ""}</div>
                </div>
                <button
                  onClick={() => setQuantity(quantity + 0.5)}
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Quantity for pieces */}
        <AnimatePresence>
          {selectedOption && !isKg && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h3 className="font-bold text-foreground mb-3 text-sm uppercase tracking-wide">🔢 Quantité</h3>
              <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-foreground">{quantity}</div>
                  <div className="text-xs text-muted-foreground">pièce{quantity > 1 ? "s" : ""}</div>
                </div>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Location */}
        <section>
          <h3 className="font-bold text-foreground mb-3 text-sm uppercase tracking-wide">📍 Lieu</h3>
          <div className="grid grid-cols-2 gap-3">
            {(["sur_place", "domicile"] as const).map((loc) => (
              <button
                key={loc}
                onClick={() => setLocation(loc)}
                className={`rounded-2xl p-4 text-center transition-all border-2 ${
                  location === loc ? "border-primary bg-primary/5 shadow-md" : "border-transparent glass-card"
                }`}
              >
                <div className="text-2xl mb-2">{loc === "sur_place" ? "🏪" : "🏠"}</div>
                <div className="text-sm font-semibold text-foreground">
                  {loc === "sur_place" ? "Sur place" : "À domicile"}
                </div>
              </button>
            ))}
          </div>
          <AnimatePresence>
            {location === "domicile" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3">
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Votre adresse à Niamey" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-10 rounded-xl" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Payment */}
        <section>
          <h3 className="font-bold text-foreground mb-3 text-sm uppercase tracking-wide">💳 Paiement</h3>
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
                className={`rounded-2xl p-4 text-center transition-all border-2 ${
                  payment === p.id ? "border-primary bg-primary/5 shadow-md" : "border-transparent glass-card"
                }`}
              >
                <div className="text-xl mb-1">{p.emoji}</div>
                <div className="text-xs font-semibold text-foreground">{p.label}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Client info */}
        <section>
          <h3 className="font-bold text-foreground mb-3 text-sm uppercase tracking-wide">👤 Vos informations</h3>
          <div className="space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Votre nom complet" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 rounded-xl" />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Numéro de téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 rounded-xl" />
            </div>
          </div>
        </section>

        {/* Submit */}
        <AnimatePresence>
          {selectedOption && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="glass-card rounded-2xl p-5 mb-4 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{selectedOption.name} × {quantity}{isKg ? " kg" : ""}</span>
                  <span>{selectedOption.price.toLocaleString("fr-FR")} FCFA{isKg ? "/kg" : ""}</span>
                </div>
                <div className="flex justify-between font-extrabold text-lg text-foreground pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-gradient">{total.toLocaleString("fr-FR")} FCFA</span>
                </div>
              </div>
              <Button variant="hero" size="lg" className="w-full rounded-2xl h-14 text-base" onClick={handleSubmit}>
                Commander maintenant 🚀
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
};

export default OrderPage;
