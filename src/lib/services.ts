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
  description?: string;
}

export interface Order {
  id: string;
  clientName: string;
  clientPhone: string;
  service: Service;
  selectedOption: ServiceOption;
  location: "sur_place" | "domicile";
  address?: string;
  payment: "cash" | "airtel_money" | "moov" | "zamani";
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  createdAt: Date;
  total: number;
}

export const SERVICES: Service[] = [
  {
    id: "vidange",
    category: "auto",
    name: "Vidange",
    description: "Changement d'huile moteur avec filtre",
    icon: "🔧",
    options: [
      { id: "vidange-petite", name: "Petite voiture", price: 10000 },
      { id: "vidange-suv", name: "SUV / 4x4", price: 15000 },
    ],
  },
  {
    id: "lavage",
    category: "auto",
    name: "Lavage Auto",
    description: "Lavage extérieur complet de votre véhicule",
    icon: "🚗",
    options: [
      { id: "lavage-standard", name: "Standard", price: 3000 },
      { id: "lavage-premium", name: "Premium", price: 5000, description: "Avec cire et polish" },
    ],
  },
  {
    id: "nettoyage-interieur",
    category: "auto",
    name: "Nettoyage Intérieur",
    description: "Aspiration, nettoyage sièges et tableau de bord",
    icon: "✨",
    options: [
      { id: "nettoyage-standard", name: "Standard", price: 4000 },
      { id: "nettoyage-complet", name: "Complet", price: 7000, description: "Avec shampoing sièges" },
    ],
  },
  {
    id: "lavage-vetements",
    category: "pressing",
    name: "Lavage Vêtements",
    description: "Lavage professionnel de vos vêtements",
    icon: "👕",
    options: [
      { id: "chemise", name: "Chemise", price: 1000 },
      { id: "pantalon", name: "Pantalon", price: 1500 },
      { id: "costume", name: "Costume complet", price: 3500 },
    ],
  },
  {
    id: "repassage",
    category: "pressing",
    name: "Repassage",
    description: "Repassage soigné de vos vêtements",
    icon: "👔",
    options: [
      { id: "repassage-chemise", name: "Chemise", price: 500 },
      { id: "repassage-pantalon", name: "Pantalon", price: 750 },
      { id: "repassage-costume", name: "Costume", price: 2000 },
    ],
  },
  {
    id: "livraison-pressing",
    category: "pressing",
    name: "Livraison / Récupération",
    description: "On vient chercher et on vous livre",
    icon: "🚚",
    options: [
      { id: "livraison-aller", name: "Récupération seule", price: 1000 },
      { id: "livraison-retour", name: "Livraison seule", price: 1000 },
      { id: "livraison-ar", name: "Aller-retour", price: 1500 },
    ],
  },
];
