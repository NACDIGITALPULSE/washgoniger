
CREATE TABLE public.services (
  id text PRIMARY KEY,
  category text NOT NULL CHECK (category IN ('auto', 'pressing')),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '🆕',
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Everyone can read services (public catalog)
CREATE POLICY "Anyone can read services" ON public.services FOR SELECT USING (true);

-- Only admins can modify services
CREATE POLICY "Admins can insert services" ON public.services FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update services" ON public.services FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete services" ON public.services FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed default services
INSERT INTO public.services (id, category, name, description, icon, options) VALUES
('vidange', 'auto', 'Vidange', 'Changement d''huile moteur avec filtre', '🔧', '[{"id":"vidange-petite","name":"Petite voiture","price":10000,"unit":"piece"},{"id":"vidange-suv","name":"SUV / 4x4","price":15000,"unit":"piece"}]'::jsonb),
('lavage', 'auto', 'Lavage Auto', 'Lavage extérieur complet de votre véhicule', '🚗', '[{"id":"lavage-standard","name":"Standard","price":3000,"unit":"piece"},{"id":"lavage-premium","name":"Premium","price":5000,"unit":"piece","description":"Avec cire et polish"}]'::jsonb),
('nettoyage-interieur', 'auto', 'Nettoyage Intérieur', 'Aspiration, nettoyage sièges et tableau de bord', '✨', '[{"id":"nettoyage-standard","name":"Standard","price":4000,"unit":"piece"},{"id":"nettoyage-complet","name":"Complet","price":7000,"unit":"piece","description":"Avec shampoing sièges"}]'::jsonb),
('lavage-vetements', 'pressing', 'Lavage Vêtements', 'Lavage professionnel de vos vêtements', '👕', '[{"id":"chemise","name":"Chemise","price":1000,"unit":"piece"},{"id":"pantalon","name":"Pantalon","price":1500,"unit":"piece"},{"id":"costume","name":"Costume complet","price":3500,"unit":"piece"},{"id":"lavage-kg","name":"Au kilogramme","price":1500,"unit":"kg","description":"Prix par kg"}]'::jsonb),
('repassage', 'pressing', 'Repassage', 'Repassage soigné de vos vêtements', '👔', '[{"id":"repassage-chemise","name":"Chemise","price":500,"unit":"piece"},{"id":"repassage-pantalon","name":"Pantalon","price":750,"unit":"piece"},{"id":"repassage-costume","name":"Costume","price":2000,"unit":"piece"},{"id":"repassage-kg","name":"Au kilogramme","price":1000,"unit":"kg","description":"Prix par kg"}]'::jsonb),
('livraison-pressing', 'pressing', 'Livraison / Récupération', 'On vient chercher et on vous livre', '🚚', '[{"id":"livraison-aller","name":"Récupération seule","price":1000,"unit":"piece"},{"id":"livraison-retour","name":"Livraison seule","price":1000,"unit":"piece"},{"id":"livraison-ar","name":"Aller-retour","price":1500,"unit":"piece"}]'::jsonb);
