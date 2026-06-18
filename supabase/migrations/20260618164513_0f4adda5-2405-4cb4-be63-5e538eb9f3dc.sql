
UPDATE public.services
SET name = 'Repassage et lavage des vêtements',
    description = 'Lavage, repassage, récupération et livraison de vos vêtements',
    options = '[
      {"id":"service-complet","name":"Service complet","price":3000,"unit":"piece","description":"Repassage et lavage des vêtements inclus"},
      {"id":"chemise","name":"Chemise (lavage)","price":500,"unit":"piece"},
      {"id":"pantalon","name":"Pantalon (lavage)","price":500,"unit":"piece"},
      {"id":"costume","name":"Costume complet (lavage)","price":1500,"unit":"piece"},
      {"id":"lavage-kg","name":"Lavage au kilogramme","price":1500,"unit":"kg","description":"Prix par kg"},
      {"id":"repassage-chemise","name":"Repassage chemise","price":500,"unit":"piece"},
      {"id":"repassage-pantalon","name":"Repassage pantalon","price":750,"unit":"piece"},
      {"id":"repassage-costume","name":"Repassage costume","price":2000,"unit":"piece"},
      {"id":"repassage-kg","name":"Repassage au kilogramme","price":1000,"unit":"kg","description":"Prix par kg"},
      {"id":"livraison-aller","name":"Récupération seule","price":1000,"unit":"piece"},
      {"id":"livraison-retour","name":"Livraison seule","price":1000,"unit":"piece"},
      {"id":"livraison-ar","name":"Récupération + Livraison","price":1500,"unit":"piece"}
    ]'::jsonb
WHERE id = 'lavage-vetements';

DELETE FROM public.services WHERE id IN ('livraison-pressing','repassage');
