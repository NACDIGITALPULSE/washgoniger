
-- =========================================================
-- 1. PROFILES TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage profiles" ON public.profiles
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 2. ORDERS — add user_id + tighten RLS
-- =========================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

DROP POLICY IF EXISTS "Anyone can read orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;

CREATE POLICY "Users read own orders or admin" ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own pending orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND agent_id IS NULL
    AND COALESCE(discount, 0) >= 0
  );

-- Revoke anon access since policies are auth-only now
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.orders FROM anon;

-- =========================================================
-- 3. LOYALTY_POINTS — add user_id + tighten RLS
-- =========================================================
ALTER TABLE public.loyalty_points
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_loyalty_user_id ON public.loyalty_points(user_id);

DROP POLICY IF EXISTS "Anyone can read loyalty points" ON public.loyalty_points;
DROP POLICY IF EXISTS "Anyone can insert loyalty points" ON public.loyalty_points;

CREATE POLICY "Users read own loyalty" ON public.loyalty_points
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own loyalty" ON public.loyalty_points
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND points >= 0 AND points <= 100);

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.loyalty_points FROM anon;

-- =========================================================
-- 4. AGENTS — hide phone via view
-- =========================================================
DROP POLICY IF EXISTS "Anyone can read active agents" ON public.agents;

CREATE POLICY "Admins read agents" ON public.agents
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

REVOKE SELECT ON public.agents FROM anon;

CREATE OR REPLACE VIEW public.agents_public
WITH (security_invoker = on) AS
  SELECT id, name, zone, avg_eta_min, active, current_location, created_at
  FROM public.agents
  WHERE active = true;

GRANT SELECT ON public.agents_public TO anon, authenticated;

-- =========================================================
-- 5. PROMO_CODES — validate via RPC only
-- =========================================================
DROP POLICY IF EXISTS "Anyone can read active promo codes" ON public.promo_codes;
REVOKE SELECT ON public.promo_codes FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.validate_promo(_code text, _order_total numeric)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.promo_codes%ROWTYPE;
  discount numeric := 0;
BEGIN
  IF _code IS NULL OR length(trim(_code)) = 0 THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Code requis');
  END IF;

  SELECT * INTO rec FROM public.promo_codes
    WHERE upper(code) = upper(trim(_code)) LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Code invalide');
  END IF;
  IF NOT rec.active THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Code inactif');
  END IF;
  IF rec.expires_at IS NOT NULL AND rec.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Code expiré');
  END IF;
  IF rec.max_uses IS NOT NULL AND rec.used_count >= rec.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Code épuisé');
  END IF;
  IF _order_total < COALESCE(rec.min_order, 0) THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Montant minimum non atteint: ' || rec.min_order);
  END IF;

  IF rec.discount_type = 'percentage' THEN
    discount := round(_order_total * rec.discount_value / 100);
  ELSE
    discount := rec.discount_value;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'discount_type', rec.discount_type,
    'discount_value', rec.discount_value,
    'discount', discount,
    'code', rec.code,
    'message', 'Code appliqué'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.validate_promo(text, numeric) FROM public;
GRANT EXECUTE ON FUNCTION public.validate_promo(text, numeric) TO authenticated;
