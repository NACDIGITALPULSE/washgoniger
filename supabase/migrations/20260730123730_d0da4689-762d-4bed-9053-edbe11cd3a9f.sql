CREATE POLICY "Users can cancel own unpaid pending orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending' AND COALESCE(payment_status,'unpaid') <> 'paid')
WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

CREATE INDEX IF NOT EXISTS orders_payment_ref_idx ON public.orders (payment_ref);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON public.orders (payment_status);