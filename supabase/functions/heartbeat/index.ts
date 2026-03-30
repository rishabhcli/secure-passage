import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-airlock-companion-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const companionSecret = req.headers.get("x-airlock-companion-secret");
    const expectedSecret = Deno.env.get("AIRLOCK_COMPANION_SECRET") || "demo-companion-secret";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let userId: string;

    if (companionSecret && companionSecret === expectedSecret) {
      const body = await req.json();
      userId = body.auth0UserSub;
      if (!userId) {
        return new Response(JSON.stringify({ error: "auth0UserSub required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase.from("companion_heartbeats").upsert({
        companion_id: body.companionId || "companion-local-01",
        auth0_user_sub: userId,
        origin_type: body.originType || "local",
        sandboxed: body.sandboxed ?? true,
        version: body.version || "1.0.0",
        last_seen_at: new Date().toISOString(),
      }, { onConflict: "companion_id,auth0_user_sub" });

      if (error) throw error;

      return new Response(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Also accept user JWT for demo page heartbeat
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      const { error } = await supabase.from("companion_heartbeats").upsert({
        companion_id: body.companionId || "demo-companion",
        auth0_user_sub: user.id,
        origin_type: body.originType || "demo",
        sandboxed: body.sandboxed ?? true,
        version: body.version || "1.0.0",
        last_seen_at: new Date().toISOString(),
      }, { onConflict: "companion_id,auth0_user_sub" });

      if (error) throw error;

      return new Response(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("heartbeat error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
