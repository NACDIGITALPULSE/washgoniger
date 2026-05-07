import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ServiceOption, Order, SelectedOptionWithQty, PromoCode } from "@/lib/services";
import { useAppState } from "@/lib/store";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, User, CheckCircle2, Minus, Plus, Scale, Navigation, Tag, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_WHATSAPP = "22788082987";

type GeoPos = { lat: number; lng: number };

const OrderPage = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { addOrder, services } = useAppState();
  const service = services.find((s) => s.id === serviceId);

  const [selectedOptions, setSelectedOptions] = useState<Map<string, SelectedOptionWithQty>>(new Map());
  const [location, setLocation] = useState<"sur_place" | "domicile">("sur_place");
  const [payment, setPayment] = useState<"cash" | "nita" | "amanata">("cash");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [savedLocation, setSavedLocation] = useState<GeoPos | null>(null);
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
      promoCode: appliedPromo?.code,
      discount,
    };

    await addOrder(order);

    if (appliedPromo) {
      await supabase.from("promo_codes").update({ used_count: appliedPromo.used_count + 1 }).eq("id", appliedPromo.id);
    }

    localStorage.setItem("washgo_phone", phone);

    // WhatsApp notification to admin
    const optionsText = optionsArray.map(o => `${o.option.name} ×${o.quantity}`).join(", ");
    const locationText = location === "domicile" ? `🏠 Domicile${address ? ` — ${address}` : ""}` : "🏪 Sur place";
    const payLabel = paymentMethods.find(p => p.id === payment)?.label || payment;
    const adminMsg = `🧾 *Nouvelle commande WashGo Niger*\n\n📋 N° ${orderNumber}\n👤 ${name}\n📞 ${phone}\n\n🔧 ${service.icon} ${service.name}\n${optionsText}\n💰 *${total.toLocaleString("fr-FR")} FCFA*\n📍 ${locationText}\n💳 ${payLabel}`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(adminMsg)}`, "_blank");

    // If domicile, also share location
    if (location === "domicile" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
          const locMsg = `📍 *Position pour commande ${orderNumber}*\n${mapUrl}\n\nNom: ${name}\nTél: ${phone}`;
          setTimeout(() => {
            window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(locMsg)}`, "_blank");
          }, 1500);
        },
        () => {}
      );
    }

    toast.success("Commande envoyée ! 🎉");
    navigate("/order-confirmation", { state: { order } });
  };

  const paymentMethods = [
    { id: "cash" as const, label: "Cash", emoji: "💵", desc: "Paiement en espèces" },
    { id: "nita" as const, label: "Nita", emoji: "📱", desc: "Mobile Money" },
    { id: "amanata" as const, label: "Amanata", emoji: "📱", desc: "Mobile Money" },
  ];

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Custom header */}
      <div className="hero-gradient px-5 pt-6 pb-8 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="relative container max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="text-primary-foreground/70 hover:text-primary-foreground mb-3 flex items-center gap-1 text-sm font-medium">
            ← Retour
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-foreground/20 backdrop-blur flex items-center justify-center text-3xl">
              {service.icon}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-primary-foreground leading-tight">{service.name}</h1>
              <p className="text-sm text-primary-foreground/60">{service.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-lg mx-auto px-5 -mt-4 relative z-10 space-y-5">
        {/* Options */}
        <section className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-1 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" /> Choisir vos options
          </h3>
          <p className="text-[11px] text-muted-foreground mb-4">Sélectionnez une ou plusieurs options</p>
          <div className="space-y-2.5">
            {service.options.map((opt) => {
              const selected = selectedOptions.has(opt.id);
              const item = selectedOptions.get(opt.id);
              return (
                <div key={opt.id}>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => toggleOption(opt)}
                    className={`w-full rounded-xl p-4 text-left transition-all border-2 ${
                      selected ? "border-primary bg-primary/5 shadow-md" : "border-border bg-muted/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {selected ? (
                          <div className="w-6 h-6 rounded-full hero-gradient flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                        )}
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            {opt.name}
                            {opt.unit === "kg" && <Scale className="w-3.5 h-3.5 text-secondary" />}
                          </div>
                          {opt.description && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">{opt.description}</div>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-primary text-sm whitespace-nowrap">
                        {opt.price.toLocaleString("fr-FR")} F
                        {opt.unit === "kg" && <span className="text-muted-foreground font-normal text-xs">/kg</span>}
                      </span>
                    </div>
                  </motion.button>

                  <AnimatePresence>
                    {selected && item && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1.5 mb-1"
                      >
                        <div className="rounded-xl p-3 flex items-center justify-between ml-9 bg-muted/40 border border-border">
                          <button
                            onClick={(e) => { e.stopPropagation(); updateQty(opt.id, -1); }}
                            className="w-9 h-9 rounded-lg bg-background flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors border border-border"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <div className="text-center">
                            <div className="text-2xl font-extrabold text-foreground">{item.quantity}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {opt.unit === "kg" ? "kg" : `pièce${item.quantity > 1 ? "s" : ""}`}
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); updateQty(opt.id, 1); }}
                            className="w-9 h-9 rounded-lg bg-background flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors border border-border"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <div className="text-right ml-4">
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
        <section className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-3 text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Lieu d'intervention
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {(["sur_place", "domicile"] as const).map((loc) => (
              <button
                key={loc}
                onClick={() => setLocation(loc)}
                className={`rounded-2xl p-4 text-center transition-all border-2 ${
                  location === loc ? "border-primary bg-primary/5 shadow-md" : "border-border bg-muted/30 hover:bg-muted/50"
                }`}
              >
                <div className="text-3xl mb-2">{loc === "sur_place" ? "🏪" : "🏠"}</div>
                <div className="text-sm font-bold text-foreground">
                  {loc === "sur_place" ? "Sur place" : "À domicile"}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {loc === "sur_place" ? "Venez chez nous" : "On vient chez vous"}
                </div>
              </button>
            ))}
          </div>

          {/* Location sharing - available for both sur_place and domicile */}
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

          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-xl text-xs mt-3 gap-2"
            onClick={shareLocation}
            disabled={gettingLocation}
          >
            <Share2 className="w-3.5 h-3.5" />
            {gettingLocation ? "Récupération..." : "📍 Partager ma position par WhatsApp"}
          </Button>
        </section>

        {/* Payment */}
        <section className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-2 text-sm flex items-center gap-2">
            💳 Mode de paiement
          </h3>
          <p className="text-[11px] text-muted-foreground mb-3">
            Nita & Amanata via le <span className="font-bold text-primary">+227 88 08 29 87</span>
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {paymentMethods.map((p) => (
              <button
                key={p.id}
                onClick={() => setPayment(p.id)}
                className={`rounded-2xl p-4 text-center transition-all border-2 ${
                  payment === p.id ? "border-primary bg-primary/5 shadow-md" : "border-border bg-muted/30 hover:bg-muted/50"
                }`}
              >
                <div className="text-2xl mb-1">{p.emoji}</div>
                <div className="text-xs font-bold text-foreground">{p.label}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Client info */}
        <section className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-3 text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Vos informations
          </h3>
          <div className="space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Votre nom complet" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 rounded-xl h-12" />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Numéro de téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 rounded-xl h-12" />
            </div>
          </div>
        </section>

        {/* Promo Code */}
        <section className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-3 text-sm flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" /> Code promo
          </h3>
          {appliedPromo ? (
            <div className="rounded-xl p-3 flex items-center justify-between bg-success/10 border border-success/20">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-success" />
                <span className="font-bold text-success text-sm">{appliedPromo.code}</span>
                <span className="text-xs text-muted-foreground">
                  (-{appliedPromo.discount_type === "percentage" ? `${appliedPromo.discount_value}%` : `${appliedPromo.discount_value.toLocaleString("fr-FR")} F`})
                </span>
              </div>
              <button onClick={removePromo} className="text-xs text-destructive font-semibold">Retirer</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Entrer un code promo"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  className="pl-10 rounded-xl uppercase h-12"
                  onKeyDown={(e) => e.key === "Enter" && applyPromoCode()}
                />
              </div>
              <Button variant="outline" className="rounded-xl h-12 px-5 font-bold" onClick={applyPromoCode} disabled={promoLoading}>
                {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Appliquer"}
              </Button>
            </div>
          )}
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
                {discount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Sous-total</span>
                      <span>{subtotal.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                    <div className="flex justify-between text-sm text-success font-semibold">
                      <span>🏷️ Réduction ({appliedPromo?.code})</span>
                      <span>-{discount.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-extrabold text-lg text-foreground pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-gradient">{total.toLocaleString("fr-FR")} FCFA</span>
                </div>
              </div>
              <Button variant="hero" size="lg" className="w-full rounded-2xl h-14 text-base font-bold" onClick={handleSubmit}>
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
