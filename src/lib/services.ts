export interface Service {
  id: string;
  category: "auto" | "pressing";
  name: string;
  description: string;
  icon: string;
  options: ServiceOption[];
}

export interface ServiceOption {
  id: string;
  name: string;
  price: number;
  unit?: "piece" | "kg";
  description?: string;
}

export interface SelectedOptionWithQty {
  option: ServiceOption;
  quantity: number;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order: number;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  clientName: string;
  clientPhone: string;
  service: Service;
  selectedOption: ServiceOption;
  selectedOptions?: SelectedOptionWithQty[];
  quantity: number;
  location: "sur_place" | "domicile";
  address?: string;
  payment: "cash" | "nita" | "amanata";
  status: "pending" | "accepted" | "in_progress" | "ready" | "delivered" | "completed" | "cancelled";
  createdAt: Date;
  total: number;
  promoCode?: string;
  discount?: number;
  receiptUrl?: string;
  agentId?: string;
  agentEtaMin?: number;
  assignedAt?: Date;
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  zone?: string | null;
  active: boolean;
  avg_eta_min: number;
  created_at: string;
}

export interface LoyaltyPoint {
  id: string;
  user_phone: string;
  points: number;
  source: string;
  order_id?: string;
  created_at: string;
}

export const DEFAULT_SERVICES: Service[] = [
  {
    id: "vidange",
    category: "auto",
    name: "Vidange",
    description: "Changement d'huile moteur avec filtre",
    icon: "🔧",
    options: [
      { id: "vidange-petite", name: "Petite voiture", price: 10000, unit: "piece" },
      { id: "vidange-suv", name: "SUV / 4x4", price: 15000, unit: "piece" },
    ],
  },
  {
    id: "lavage",
    category: "auto",
    name: "Lavage Auto",
    description: "Lavage extérieur complet de votre véhicule",
    icon: "🚗",
    options: [
      { id: "lavage-standard", name: "Standard", price: 3000, unit: "piece" },
      { id: "lavage-premium", name: "Premium", price: 5000, unit: "piece", description: "Avec cire et polish" },
    ],
  },
  {
    id: "nettoyage-interieur",
    category: "auto",
    name: "Nettoyage Intérieur",
    description: "Aspiration, nettoyage sièges et tableau de bord",
    icon: "✨",
    options: [
      { id: "nettoyage-standard", name: "Standard", price: 4000, unit: "piece" },
      { id: "nettoyage-complet", name: "Complet", price: 7000, unit: "piece", description: "Avec shampoing sièges" },
    ],
  },
  {
    id: "lavage-vetements",
    category: "pressing",
    name: "Lavage Vêtements",
    description: "Lavage professionnel de vos vêtements",
    icon: "👕",
    options: [
      { id: "chemise", name: "Chemise", price: 1000, unit: "piece" },
      { id: "pantalon", name: "Pantalon", price: 1500, unit: "piece" },
      { id: "costume", name: "Costume complet", price: 3500, unit: "piece" },
      { id: "lavage-kg", name: "Au kilogramme", price: 1500, unit: "kg", description: "Prix par kg" },
    ],
  },
  {
    id: "repassage",
    category: "pressing",
    name: "Repassage",
    description: "Repassage soigné de vos vêtements",
    icon: "👔",
    options: [
      { id: "repassage-chemise", name: "Chemise", price: 500, unit: "piece" },
      { id: "repassage-pantalon", name: "Pantalon", price: 750, unit: "piece" },
      { id: "repassage-costume", name: "Costume", price: 2000, unit: "piece" },
      { id: "repassage-kg", name: "Au kilogramme", price: 1000, unit: "kg", description: "Prix par kg" },
    ],
  },
  {
    id: "livraison-pressing",
    category: "pressing",
    name: "Livraison / Récupération",
    description: "On vient chercher et on vous livre",
    icon: "🚚",
    options: [
      { id: "livraison-aller", name: "Récupération seule", price: 1000, unit: "piece" },
      { id: "livraison-retour", name: "Livraison seule", price: 1000, unit: "piece" },
      { id: "livraison-ar", name: "Aller-retour", price: 1500, unit: "piece" },
    ],
  },
];
