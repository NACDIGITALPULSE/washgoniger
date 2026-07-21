// iPay Money redirect callback handler.
// iPay redirects the customer's browser here with query params after payment.
// Expected: ?external_reference=...&state=<order_id>&status=succeeded|failed&amount=...
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const APP_URL = "https://washgoniger.lovable.app";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("state") || "";
  const status = url.searchParams.get("status") || "";
  const amount = url.searchParams.get("amount") || "";
  const ref = url.searchParams.get("external_reference") || "";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const redirect = (path: string) =>
    new Response(null, { status: 302, headers: { Location: `${APP_URL}${path}` } });

  if (!orderId) return redirect(`/?ipay=missing`);

  const { data: order } = await supabase
    .from("orders")
    .select("id,total,status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return redirect(`/?ipay=notfound`);

  const paid = status === "succeeded" && Number(amount) >= Number(order.total);

  await supabase
    .from("orders")
    .update({
      payment_status: paid ? "paid" : "failed",
      payment_ref: ref,
    })
    .eq("id", orderId);

  return redirect(
    `/tracking?orderId=${orderId}&ipay=${paid ? "success" : "failed"}`,
  );
});
