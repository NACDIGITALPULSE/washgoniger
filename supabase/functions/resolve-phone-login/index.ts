// Resolves a phone number to the corresponding auth email so users can log in
// with their phone whether their account was created via phone (internal email
// <digits>@phone.washgo.local) or with a real email earlier.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const normalize = (raw: string) => (raw || "").replace(/\D/g, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { phone } = await req.json();
    const digits = normalize(phone);
    if (digits.length < 6 || digits.length > 20) {
      return new Response(JSON.stringify({ email: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1) try direct internal email
    const internalEmail = `${digits}@phone.washgo.local`;

    // 2) look up via profiles table by phone (covers legacy email/password users)
    const { data: profile } = await admin
      .from("profiles")
      .select("user_id")
      .eq("phone", digits)
      .maybeSingle();

    let realEmail: string | null = null;
    if (profile?.user_id) {
      const { data: userRes } = await admin.auth.admin.getUserById(profile.user_id);
      realEmail = userRes?.user?.email ?? null;
    }

    return new Response(
      JSON.stringify({ email: realEmail || internalEmail }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ email: null, error: String(e) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
