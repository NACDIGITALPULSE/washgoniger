## Plan — 3 améliorations

### 1. Lien de téléchargement PDF dans le fallback WhatsApp
Quand l'ouverture auto de WhatsApp échoue, l'utilisateur voit déjà un panneau avec le numéro et un bouton "Copier le texte". J'ajoute un bouton **« Télécharger le reçu PDF »** directement dans ce panneau, pour qu'il puisse le joindre manuellement à la conversation WhatsApp.

- Fichier `src/pages/OrderConfirmationPage.tsx` : le PDF est déjà généré (`generateReceiptPDF`). Ajout d'un bouton dans l'overlay fallback qui appelle la fonction de téléchargement existante.
- Fichier `src/pages/OrderPage.tsx` : génération du PDF du reçu juste après création de la commande (nouvelle commande → on a déjà l'ID), stockage du blob URL dans l'état `whatsappFallback`, et bouton « Télécharger le reçu » dans le panneau fallback.

### 2. Nouveau thème premium aux couleurs du logo
Direction : palette inspirée du logo WashGo (bleu profond + vert clean + blanc), version premium « tech raffiné ».

**Tokens HSL (`src/index.css` + `tailwind.config.ts`)** :
- `--background` : `220 30% 98%` (clair) / `222 47% 8%` (sombre)
- `--foreground` : `222 47% 11%` / `210 20% 98%`
- `--primary` (bleu logo profond) : `215 85% 32%`
- `--primary-glow` : `210 95% 55%`
- `--secondary` (vert clean logo) : `158 64% 42%`
- `--accent` (or doux pour touches premium) : `38 92% 58%`
- `--card` glassmorphism : `0 0% 100% / 0.7` avec `backdrop-blur-xl`
- Gradients : `--gradient-primary: linear-gradient(135deg, hsl(215 85% 32%), hsl(210 95% 55%))`, `--gradient-hero`, `--gradient-shine` (effet brillance)
- Shadows premium : `--shadow-elegant: 0 20px 60px -15px hsl(215 85% 32% / 0.35)`, `--shadow-glow`

**Typographie** : Space Grotesk (titres) + DM Sans (corps) via `@fontsource/space-grotesk` et `@fontsource/dm-sans`, import dans `src/main.tsx`, mapping dans `tailwind.config.ts` (`font-display`, `font-sans`).

**Composants impactés** : Hero (gradient mesh + halo lumineux subtil), boutons (variant `premium` avec gradient + shine au hover), cards (glass + bordure dégradée), header (bordure dorée fine en dark mode).

### 3. Logo agrandi (96px)
- `src/components/PageHeader.tsx` (ou équivalent header) : taille logo passe de ~40-48px à **96px** (h-24), avec léger glow autour en utilisant `--shadow-glow`.
- Ajustement du padding du header pour accommoder la nouvelle hauteur.
- Vérification responsive : sur mobile, garder 96px mais réduire les éléments adjacents si besoin.

### Vérifications
- Build TS sans erreur
- Contrôle visuel light + dark mode
- Test du flux : commande → blocage WhatsApp simulé → bouton PDF visible et fonctionnel
