
-- Agents table
CREATE TABLE public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  zone text,
  active boolean NOT NULL DEFAULT true,
  avg_eta_min integer NOT NULL DEFAULT 30,
  current_location jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active agents"
  ON public.agents FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage agents"
  ON public.agents FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add agent assignment columns to orders
ALTER TABLE public.orders
  ADD COLUMN agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  ADD COLUMN assigned_at timestamptz,
  ADD COLUMN agent_eta_min integer;

-- Enable realtime for agents
ALTER PUBLICATION supabase_realtime ADD TABLE public.agents;
