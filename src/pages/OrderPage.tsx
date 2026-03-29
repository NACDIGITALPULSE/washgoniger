import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ServiceOption, Order, SelectedOptionWithQty, PromoCode } from "@/lib/services";
import { useAppState } from "@/lib/store";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, User, CheckCircle2, Minus, Plus, Scale, Navigation, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_WHATSAPP = "22788082987";

const OrderPage = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { addOrder, services } = useAppState();
  const service = services.find((s) => s.id === serviceId);

  const [selectedOptions, setSelectedOptions] = useState<Map<string, SelectedOptionWithQty>>(new Map());
  const [location, setLocation] = useState<"sur_place" | "domicile">("sur_place");
  const [payment, setPayment] = useState<Order["payment"]>("cash");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  if (!service) return <div className="p-8 text-center text-muted-foreground">Service introuvable</div>;

  const toggleOption = (opt: ServiceOption) => {
    setSelectedOptions((prev) => {
      const next = new Map(prev);
      if (next.has(opt.id)) {
        next.delete(opt.id);
      } else {
        next.set(opt.id, { option: opt, quantity: opt.unit === "kg" ? 1 : 1 });
      }
      return next;
    });
  };

  const updateQty = (optId: string, delta: number) => {
    setSelectedOptions((prev) => {
      const next = new Map(prev);
      const item = next.get(optId);
      if (!item) return prev;
      const isKg = item.option.unit === "kg";
      const step = isKg ? 0.5 : 1;
      const min = isKg ? 0.5 : 1;
      const newQty = Math.max(min, item.quantity + delta * step);
      next.set(optId, { ...item, quantity: newQty });
      return next;
    });
  };

  const subtotal = Array.from(selectedOptions.values()).reduce(
    (sum, { option, quantity }) => sum + option.price * quantity, 0
  );

  const discount = appliedPromo
    ? appliedPromo.discount_type === "percentage"
      ? Math.round(subtotal * appliedPromo.discount_value / 100)
      : Math.min(appliedPromo.discount_value, subtotal)
    : 0;

  const total = subtotal - discount;

  const applyPromoCode = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", promoInput.trim().toUpperCase())
      .eq("active", true)
      .maybeSingle();

    if (error || !data) {
      toast.error("Code promo invalide");
      setAppliedPromo(null);
      setPromoLoading(false);
      return;
    }

    if (data.max_uses && data.used_count >= data.max_uses) {
      toast.error("Ce code promo a expiré (utilisation max atteinte)");
      setPromoLoading(false);
      return;
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      toast.error("Ce code promo a expiré");
      setPromoLoading(false);
      return;
    }

    if (data.min_order > subtotal) {
      toast.error(`Commande minimum de ${data.min_order.toLocaleString("fr-FR")} FCFA requise`);
      setPromoLoading(false);
      return;
    }

    setAppliedPromo(data as PromoCode);
    toast.success(`Code promo appliqué ! -${data.discount_type === "percentage" ? data.discount_value + "%" : data.discount_value.toLocaleString("fr-FR") + " FCFA"}`);
    setPromoLoading(false);
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
  };

  const shareLocation = () => {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas disponible");
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const message = `📍 Voici ma position pour la commande *WashGo Niger* :\n${mapUrl}\n\nNom: ${name || "Client"}\nTél: ${phone}`;
        window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank");
        setGettingLocation(false);
      },
      () => {
        toast.error("Impossible d'obtenir la position");
        setGettingLocation(false);
      }
    );
  };

  const handleSubmit = async () => {
    if (selectedOptions.size === 0 || !name || !phone) {
      toast.error("Veuillez remplir tous les champs et choisir au moins une option");
      return;
    }

    const optionsArray = Array.from(selectedOptions.values());
    const firstOpt = optionsArray[0];

    // Generate order number: WG-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const seq = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `WG-${dateStr}-${seq}`;

    const order: Order = {
      id: crypto.randomUUID(),
      orderNumber,
      clientName: name,
      clientPhone: phone,
      service,
      selectedOption: firstOpt.option,
      selectedOptions: optionsArray,
      quantity: firstOpt.quantity,
      location,
      address: location === "domicile" ? address : undefined,
      payment,
      status: "pending",
      createdAt: now,
      total,
    };

    await addOrder(order);
    localStorage.setItem("washgo_phone", phone);

    // Auto-send WhatsApp notification to admin
    const optionsText = optionsArray.map(o => `${o.option.name} ×${o.quantity}`).join(", ");
    const locationText = location === "domicile" ? `🏠 Domicile${address ? ` — ${address}` : ""}` : "🏪 Sur place";
    const payLabel = paymentMethods.find(p => p.id === payment)?.label || payment;
    const adminMsg = `🧾 *Nouvelle commande WashGo Niger*\n\n📋 N° ${orderNumber}\n👤 ${name}\n📞 ${phone}\n\n🔧 ${service.icon} ${service.name}\n${optionsText}\n💰 *${total.toLocaleString("fr-FR")} FCFA*\n📍 ${locationText}\n💳 ${payLabel}`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(adminMsg)}`, "_blank");

    // If domicile, also share location automatically
    if (location === "domicile" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
          const locMsg = `📍 *Position pour commande ${orderNumber}*\n${mapUrl}\n\nNom: ${name}\nTél: ${phone}`;
          // Small delay to avoid popup blocker
          setTimeout(() => {
            window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(locMsg)}`, "_blank");
          }, 1500);
        },
        () => {} // silent fail
      );
    }

    toast.success("Commande envoyée ! 🎉");
    navigate("/order-confirmation", { state: { order } });
  };

  const paymentMethods = [
    { id: "cash" as const, label: "Cash", emoji: "💵" },
    { id: "airtel_money" as const, label: "Airtel Money", emoji: "📱" },
    { id: "moov" as const, label: "Moov Money", emoji: "📱" },
    { id: "zamani" as const, label: "Zamani", emoji: "📱" },
    { id: "nita" as const, label: "Nita", emoji: "💳" },
    { id: "amanata" as const, label: "Amanata", emoji: "💳" },
  ];

  return (
    <div className="min-h-screen pb-24 bg-background">
      <PageHeader title={`${service.icon} ${service.name}`} subtitle={service.description} />
      <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Options - Multi select */}
        <section>
          <h3 className="font-bold text-foreground mb-1 text-sm uppercase tracking-wide">Choisir vos options</h3>
          <p className="text-xs text-muted-foreground mb-3">Vous pouvez sélectionner plusieurs options</p>
          <div className="space-y-2">
            {service.options.map((opt) => {
              const selected = selectedOptions.has(opt.id);
              const item = selectedOptions.get(opt.id);
              return (
                <div key={opt.id}>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => toggleOption(opt)}
                    className={`w-full rounded-2xl p-4 text-left transition-all border-2 ${
                      selected ? "border-primary bg-primary/5 shadow-md" : "border-transparent glass-card"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {selected ? (
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

                  {/* Quantity for selected option */}
                  <AnimatePresence>
                    {selected && item && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1 mb-2"
                      >
                        <div className="glass-card rounded-xl p-3 flex items-center justify-between ml-8">
                          <button
                            onClick={(e) => { e.stopPropagation(); updateQty(opt.id, -1); }}
                            className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <div className="text-center">
                            <div className="text-xl font-extrabold text-foreground">{item.quantity}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {opt.unit === "kg" ? "kg" : `pièce${item.quantity > 1 ? "s" : ""}`}
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); updateQty(opt.id, 1); }}
                            className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <div className="text-right ml-3">
                            <div className="text-sm font-bold text-primary">
                              {(opt.price * item.quantity).toLocaleString("fr-FR")} F
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

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
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-2">
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Votre adresse à Niamey" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-10 rounded-xl" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl text-xs"
                  onClick={shareLocation}
                  disabled={gettingLocation}
                >
                  <Navigation className="w-3.5 h-3.5 mr-1.5" />
                  {gettingLocation ? "Récupération..." : "📍 Partager ma position par WhatsApp"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Payment */}
        <section>
          <h3 className="font-bold text-foreground mb-3 text-sm uppercase tracking-wide">💳 Paiement</h3>
          <p className="text-xs text-muted-foreground mb-2">Nita & Amanata via le <span className="font-semibold">+227 88 08 29 87</span></p>
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.map((p) => (
              <button
                key={p.id}
                onClick={() => setPayment(p.id)}
                className={`rounded-2xl p-3 text-center transition-all border-2 ${
                  payment === p.id ? "border-primary bg-primary/5 shadow-md" : "border-transparent glass-card"
                }`}
              >
                <div className="text-lg mb-0.5">{p.emoji}</div>
                <div className="text-[10px] font-semibold text-foreground">{p.label}</div>
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
          {selectedOptions.size > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="glass-card rounded-2xl p-5 mb-4 space-y-2">
                {Array.from(selectedOptions.values()).map(({ option, quantity }) => (
                  <div key={option.id} className="flex justify-between text-sm text-muted-foreground">
                    <span>{option.name} × {quantity}{option.unit === "kg" ? " kg" : ""}</span>
                    <span>{(option.price * quantity).toLocaleString("fr-FR")} FCFA</span>
                  </div>
                ))}
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
