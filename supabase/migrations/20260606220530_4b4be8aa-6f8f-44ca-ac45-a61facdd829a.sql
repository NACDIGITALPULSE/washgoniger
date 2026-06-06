
DROP POLICY IF EXISTS "Anyone can insert receipts" ON public.payment_receipts;
DROP POLICY IF EXISTS "Anyone can read receipts" ON public.payment_receipts;

CREATE POLICY "Users insert receipts for own orders"
ON public.payment_receipts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = payment_receipts.order_id
      AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Users read receipts for own orders or admin"
ON public.payment_receipts
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = payment_receipts.order_id
      AND o.user_id = auth.uid()
  )
);
