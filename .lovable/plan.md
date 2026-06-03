# Plan de correction des problèmes de sécurité

Tu as choisi : **exiger un login client**, **garder le bucket receipts public**, **valider les codes promo via RPC**. Voici ce que je vais faire.

## 1. Authentification client (nouveau)

- Activer email/mot de passe + Google sign-in pour les clients (auto-confirmation email activée pour fluidité), HIBP activé.
- Créer table `profiles` (user_id, full_name, phone) avec trigger d'auto-création à l'inscription.
- Créer pages `/auth/login`, `/auth/signup`, `/auth/reset-password`.
- Bloquer `/order`, `/order/confirmation`, `/my-orders`, `/notifications`, `/tracking` derrière le login (composant `<RequireAuth>`).
- Pré-remplir `clientName` / `clientPhone` depuis le profil (modifiables à la commande).

## 2. Migration BDD — RLS et schéma

### Table `orders`
- Ajouter colonne `user_id uuid references auth.users`.
- Remplacer la policy SELECT publique par : `auth.uid() = user_id OR has_role(auth.uid(), 'admin')`.
- INSERT : `auth.uid() = user_id AND status = 'pending' AND agent_id IS NULL AND discount >= 0`.
- UPDATE/DELETE : admin uniquement.

### Table `loyalty_points`
- Ajouter colonne `user_id uuid references auth.users`.
- SELECT/INSERT restreints à `auth.uid() = user_id` (+ admin).
- Stop d'utiliser `user_phone` comme identifiant côté frontend.

### Table `agents`
- Retirer la policy publique. Créer vue `public.agents_public` (id, name, zone, avg_eta_min, active, current_location) sans `phone`, avec `security_invoker=on`.
- Base table SELECT restreinte aux admins ; vue accessible à tous (pour ETA en temps réel).
- Mettre à jour `store.tsx` pour lire `agents_public`.

### Table `promo_codes`
- Retirer la policy SELECT publique (admin only).
- Créer fonction `public.validate_promo(_code text, _order_total numeric)` SECURITY DEFINER qui renvoie `{ valid, discount_type, discount_value, message }`.
- Mettre à jour `OrderPage.tsx` pour appeler `supabase.rpc('validate_promo', ...)`.

## 3. Findings ignorés (justifiés)

- **`SECURITY DEFINER` exécutable par anon/auth** : la fonction `has_role` est le pattern recommandé pour éviter la récursion RLS sur `user_roles`. Je documenterai dans la mémoire sécurité.
- **Realtime broadcasts** : `realtime.messages` est géré par Supabase et les nouvelles policies orders/loyalty filtreront déjà les payloads.
- **Public bucket allows listing** (receipts) : choisi par toi, gardé public pour le partage WhatsApp.

## 4. Code frontend impacté

- Nouveaux fichiers : `src/pages/AuthLoginPage.tsx`, `AuthSignupPage.tsx`, `ResetPasswordPage.tsx`, `src/components/RequireAuth.tsx`, `src/hooks/useAuth.tsx`.
- Modifs : `App.tsx` (routes + provider auth), `store.tsx` (filtrage par user_id, lecture `agents_public`), `OrderPage.tsx` (RPC promo + user_id), `MyOrdersPage.tsx`, `TrackingPage.tsx`, `OrderConfirmationPage.tsx`, `Hero.tsx` (bouton login si non connecté), `BottomNav.tsx`.
- Backfill : les commandes existantes (sans `user_id`) deviendront visibles uniquement par les admins. Je peux ajouter un mécanisme de réclamation par téléphone après login si tu le souhaites (à confirmer après le plan).

## Ordre d'exécution

1. Migration SQL (auth schéma + RLS + vue + RPC + trigger profil).
2. Activer HIBP + Google OAuth.
3. Implémenter auth UI + RequireAuth.
4. Adapter store, OrderPage, MyOrders, Tracking, Confirmation.
5. Vérifier build + parcours complet.

Confirme et je lance.
