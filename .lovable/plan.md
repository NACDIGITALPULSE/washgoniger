
# Plan — 3 améliorations UX premium

## 1. Écran de confirmation iOS glass (`OrderConfirmationPage.tsx`)

Refonte visuelle en glassmorphism cohérent avec le Hero :
- **Header succès** : icône check animée dans un cercle gradient (primary→secondary), titre "Commande confirmée" en `font-extrabold tracking-tight`, n° commande WG-XXX en chip glass.
- **Carte ETA glass** : `glass-card` avec icône `Clock`, temps estimé en gros (ex. "≈ 35 min"), label "Arrivée prévue" + heure calculée.
- **Carte récap clair** : service, options sélectionnées, adresse, mode paiement — chaque ligne avec icône + valeur à droite, séparateurs `border-border/40`.
- **Carte total** : montant FCFA en `text-3xl font-bold`, badge promo si applicable.
- **Boutons d'action sticky bas** :
  - Bouton principal **"Télécharger le reçu PDF"** (toujours visible, pas seulement dans le fallback) — gradient primary, icône `Download`.
  - Bouton secondaire "Partager sur WhatsApp" (ouvre wa.me avec lien PDF).
  - Lien tertiaire "Suivre ma commande".

## 2. Estimation de prix en temps réel sur l'accueil

Nouveau composant `LivePriceEstimator` affiché sous les 2 grandes cartes CTA du Hero :
- **Sélecteur de service** : tabs glass "Auto" / "Pressing".
- **Si Auto** : chips de sélection type véhicule (Petite voiture, Berline, SUV, Utilitaire) → chaque type a un multiplicateur de prix.
- **Si Pressing** : chips type vêtement (Chemise, Pantalon, Costume, Robe, Veste) + sélecteur quantité (−/+).
- **Affichage live** : carte glass avec "Estimation" + montant FCFA mis à jour à chaque clic, animation `motion` sur le changement de prix.
- **CTA** "Commander maintenant" qui pré-remplit la page commande avec les choix.

Prix calculés côté front depuis une table de tarifs (`src/lib/pricing.ts`) — pas de modif backend.

## 3. Géolocalisation pour ETA personnalisé dans le bandeau livraison

- Hook `useGeoETA()` qui :
  - Au montage, appelle `navigator.geolocation.getCurrentPosition()` avec timeout 5s.
  - Calcule distance Haversine entre user et base WashGo (Niamey centre, coords en constante).
  - Renvoie un ETA : `< 3km → 25 min`, `3–7km → 40 min`, `> 7km → 55 min`.
  - Fallback si refus/erreur → "Moins de 45 minutes" (texte actuel).
- Bandeau "Livraison garantie" affiche dynamiquement le texte personnalisé + un petit indicateur de zone (ex. "Zone Plateau · 25 min").
- Gestion gracieuse : pas de blocage, pas de popup intrusive, ETA générique tant que la géoloc n'a pas répondu.

## Détails techniques

- **Fichiers modifiés** :
  - `src/pages/OrderConfirmationPage.tsx` — refonte UI glass + bouton PDF permanent
  - `src/components/Hero.tsx` — intégration du composant estimateur
  - `src/components/LivePriceEstimator.tsx` (nouveau)
  - `src/lib/pricing.ts` (nouveau) — table tarifs auto/pressing
  - `src/hooks/useGeoETA.ts` (nouveau) — géoloc + calcul ETA
- **Pas de migration DB**, pas de nouveau secret, pas d'edge function.
- **Tokens sémantiques** uniquement (`primary`, `secondary`, `glass-card`, `muted`) — aucune couleur en dur.
- **Animations** : `framer-motion` déjà installé, transitions douces sur changement de prix et apparition ETA.
- **PDF reçu** : réutilise `src/lib/receipt-pdf.ts` existant.

## Hors scope
- Pas de changement de logique de paiement ni de schéma commande.
- Pas de carte interactive (Mapbox) — juste calcul Haversine local.
