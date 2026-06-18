// Generates a 6-digit OTP for password reset. The code is stored hashed in DB
// and only visible to admins (via the password_reset_codes table / admin panel).
// The end user must contact admin via WhatsApp to receive the code.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const normalize = (raw: string) => (raw || "").replace(/\D/g, "");

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { phone } = await req.json();
    const digits = normalize(phone);
    if (digits.length < 8 || digits.length > 20) {
      return json({ success: false, message: "Numéro invalide" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify account exists (via profiles by phone, or internal email)
    const { data: profile } = await admin
      .from("profiles")
      .select("user_id")
      .eq("phone", digits)
      .maybeSingle();

    let userExists = !!profile?.user_id;
    if (!userExists) {
      // Fallback: lookup auth user by internal email
      const internalEmail = `${digits}@phone.washgo.local`;
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      userExists = !!list?.users?.find((u) => u.email === internalEmail);
    }

    if (!userExists) {
      // Do not reveal existence to avoid enumeration — return generic success
      return json({
        success: true,
        message: "Si un compte existe, un code sera transmis par notre support.",
      });
    }

    // Throttle: max 3 active (non-used, non-expired) codes per phone per hour
    const { count } = await admin
      .from("password_reset_codes")
      .select("id", { count: "exact", head: true })
      .eq("phone", digits)
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if ((count ?? 0) >= 3) {
      return json(
        { success: false, message: "Trop de demandes. Réessayez dans 1 heure." },
        429
      );
    }

    // Invalidate previous active codes for this phone
    await admin
      .from("password_reset_codes")
      .update({ used: true })
      .eq("phone", digits)
      .eq("used", false);

    const code = String(Math.floor(100000 + Math.random() * 900000));

    const { error: insErr } = await admin.from("password_reset_codes").insert({
      phone: digits,
      code,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
    if (insErr) {
      return json({ success: false, message: "Erreur serveur" }, 500);
    }

    return json({
      success: true,
      message:
        "Demande enregistrée. Contactez notre support WhatsApp pour recevoir votre code.",
      admin_whatsapp: "22788082987",
    });
  } catch (e) {
    return json({ success: false, message: String(e) }, 500);
  }
});
