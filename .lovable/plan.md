
# Plan — 3 améliorations majeures

## 1. Workflow dispatch admin avec agents & ETA live

### Base de données (nouvelle migration)
- Table `agents` : `id`, `name`, `phone`, `zone`, `active`, `avg_eta_min` (défaut 30), `current_location` (jsonb {lat, lon, updated_at}), `created_at`.
- Colonnes ajoutées à `orders` : `agent_id` (uuid, nullable, fk agents), `assigned_at`, `agent_eta_min` (int).
- RLS : admins gèrent les agents, lecture publique des `agents.name/zone/avg_eta_min` (anonyme) pour permettre l'affichage de l'ETA côté client.

### Admin UI
- Nouveau **tab "Agents"** dans `AdminPage.tsx` : liste, création (nom, tel, zone), activation/désactivation.
- Dans **OrdersTab** : pour chaque commande en `pending`/`accepted`, dropdown "Assigner à un agent" → met à jour `agent_id`, passe la commande en `accepted`, calcule `agent_eta_min` selon la zone agent.
- Badge agent visible sur la carte commande (nom + ETA).

### Côté client
- `TrackingPage` et `OrderConfirmationPage` lisent `agent_id` + agent associé + ETA → affichent **"Agent : Moussa · ≈ 22 min"** dans la carte ETA, mise à jour realtime quand l'admin change.

## 2. Partage reçu WhatsApp fiable

Refonte de `sendReceiptWhatsApp` dans `OrderConfirmationPage.tsx` :

1. **Toujours** uploader le PDF sur Supabase Storage bucket `receipts` (déjà existant) → URL publique.
2. Inclure cette URL **dans le message WhatsApp** (`📎 Reçu : https://...`).
3. Tenter `navigator.share({ files })` si supporté.
4. Si échec/non-supporté : ouvrir `wa.me` avec le message incluant le lien PDF + déclencher téléchargement local.
5. Le **fallback modal** affiche maintenant :
   - Lien direct cliquable vers le PDF hébergé (utilisable pour l'envoyer depuis WhatsApp Web).
   - Bouton "Copier le lien PDF" séparé du "Copier le message".
   - Bouton "Télécharger PDF" (déjà là).
6. Petit composant réutilisable `WhatsAppShareFallback` pour clarifier le code.

## 3. Suivi temps réel client (renforcement)

Le `TrackingPage` reçoit déjà des updates realtime. Améliorations :

- **Subscription élargie** : réagir à `INSERT/UPDATE` (pas seulement UPDATE) + écouter `payment_receipts` pour notifier "Reçu reçu ✓".
- **Notifications toast in-app** sur changement de statut : "Votre commande est acceptée", "Agent en route", "Commande terminée" (sons légers).
- **Carte agent live** sous le timeline quand `agent_id` existe : nom + téléphone (lien `tel:`) + bouton WhatsApp + ETA mis à jour.
- **OrderConfirmationPage** : ajoute la même subscription realtime pour que le client voie son statut changer sans recharger (carte statut animée).
- **MyOrdersPage** : badge "● Live" qui clignote quand une commande est en cours, refresh auto.

## Fichiers modifiés / créés

- `supabase/migrations/...` (nouvelle) — table agents + colonnes orders + RLS
- `src/lib/services.ts` — type `Agent`, extension `Order` (agent_id, agent_eta_min)
- `src/lib/store.tsx` — fetch agents, assignAgent
- `src/pages/AdminPage.tsx` — tab Agents + dropdown assignation dans OrdersTab
- `src/pages/OrderConfirmationPage.tsx` — refonte partage WhatsApp + realtime statut + carte agent
- `src/pages/TrackingPage.tsx` — carte agent + toasts realtime
- `src/pages/MyOrdersPage.tsx` — badge live
- `src/components/WhatsAppShareFallback.tsx` (nouveau)
- `src/hooks/useOrderRealtime.ts` (nouveau) — hook partagé

## Hors scope
- Pas de tracking GPS continu de l'agent (juste ETA basé sur zone). Ajoutable plus tard avec une edge function.
- Pas de notifications push web (besoin de service worker complet).
- Pas de connexion login dédiée pour agents (admin gère depuis le dashboard).
