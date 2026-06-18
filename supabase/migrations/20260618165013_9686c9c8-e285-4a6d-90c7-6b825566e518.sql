
CREATE TABLE IF NOT EXISTS public.password_reset_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  used boolean NOT NULL DEFAULT false,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prc_phone ON public.password_reset_codes(phone);
CREATE INDEX IF NOT EXISTS idx_prc_expires ON public.password_reset_codes(expires_at);

GRANT ALL ON public.password_reset_codes TO service_role;
GRANT SELECT ON public.password_reset_codes TO authenticated;

ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Admins (via has_role) can read pending codes from the admin panel
CREATE POLICY "Admins can view reset codes"
ON public.password_reset_codes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
