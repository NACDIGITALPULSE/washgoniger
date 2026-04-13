
-- Loyalty points table
CREATE TABLE public.loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'order',
  order_id text REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read loyalty points" ON public.loyalty_points FOR SELECT USING (true);
CREATE POLICY "Anyone can insert loyalty points" ON public.loyalty_points FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage loyalty points" ON public.loyalty_points FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Payment receipts table
CREATE TABLE public.payment_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  receipt_url text NOT NULL,
  uploaded_by text NOT NULL DEFAULT 'client',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read receipts" ON public.payment_receipts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert receipts" ON public.payment_receipts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage receipts" ON public.payment_receipts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Add receipt_url column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_url text;

-- Storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Anyone can upload receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts');
CREATE POLICY "Anyone can view receipts" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
