// iPay Money server-to-server webhook.
// iPay POSTs the transaction result here; we verify it and update the order.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let payload: Record<string, any>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  // Optional shared-secret check (header set in the iPay dashboard)
  const expected = Deno.env.get("IPAYMONEY_WEBHOOK_SECRET");
  if (expected) {
    const got =
      req.headers.get("x-ipay-signature") ||
      req.headers.get("x-webhook-secret") ||
      "";
    if (got !== expected) return json({ error: "Unauthorized" }, 401);
  }

  // iPay payload shapes vary slightly — accept the common aliases.
  const reference = String(
    payload.state ?? payload.order_id ?? payload.reference ?? payload.external_reference ?? "",
  ).trim();
  const transactionId = String(payload.transaction_id ?? payload.reference ?? payload.external_reference ?? "");
  const rawStatus = String(payload.status ?? payload.state_status ?? "").toLowerCase();
  const amount = Number(payload.amount ?? payload.paid_amount ?? 0);

  if (!reference) return json({ error: "Missing order reference" }, 400);

  const { data: order, error } = await supabase
    .from("orders")
    .select("id,total,payment_status,status")
    .or(`id.eq.${reference},order_number.eq.${reference}`)
    .maybeSingle();

  if (error || !order) return json({ error: "Order not found" }, 404);

  const succeeded = ["succeeded", "success", "paid", "completed"].includes(rawStatus);
  const amountOk = amount <= 0 || amount >= Number(order.total);
  const paid = succeeded && amountOk;

  const patch: Record<string, unknown> = {
    payment_status: paid ? "paid" : succeeded ? "pending" : "failed",
    payment_ref: transactionId || reference,
  };
  // A confirmed payment auto-accepts a still-pending order.
  if (paid && order.status === "pending") patch.status = "accepted";

  const { error: upErr } = await supabase.from("orders").update(patch).eq("id", order.id);
  if (upErr) return json({ error: "Update failed" }, 500);

  return json({ success: true, order_id: order.id, payment_status: patch.payment_status });
});
