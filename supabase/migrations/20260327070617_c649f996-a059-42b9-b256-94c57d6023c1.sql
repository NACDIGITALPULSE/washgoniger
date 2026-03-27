
CREATE TABLE public.orders (
  id text PRIMARY KEY,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  service_id text NOT NULL,
  service_name text NOT NULL,
  service_icon text NOT NULL DEFAULT '',
  selected_option jsonb NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  location text NOT NULL DEFAULT 'sur_place',
  address text,
  payment text NOT NULL DEFAULT 'cash',
  status text NOT NULL DEFAULT 'pending',
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Anyone can insert orders (public ordering)
CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT WITH CHECK (true);

-- Anyone can read their own orders by phone (no auth required for clients)
CREATE POLICY "Anyone can read orders" ON public.orders FOR SELECT USING (true);

-- Only admins can update orders (status changes)
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete orders
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
