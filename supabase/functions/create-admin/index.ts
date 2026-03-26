import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Create admin user
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email: "nouredinchekaraou@live.fr",
    password: "Admin2026!",
    email_confirm: true,
  });

  if (userError && !userError.message.includes("already been registered")) {
    return new Response(JSON.stringify({ error: userError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Get user id
  let userId = userData?.user?.id;
  if (!userId) {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const admin = users?.users?.find((u: any) => u.email === "nouredinchekaraou@live.fr");
    userId = admin?.id;
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: "Could not find admin user" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Assign admin role
  const { error: roleError } = await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

  if (roleError) {
    return new Response(JSON.stringify({ error: roleError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, userId }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
