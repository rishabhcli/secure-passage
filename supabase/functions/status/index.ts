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

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Check companion heartbeat (within last 60s)
    const { data: heartbeat } = await supabase
      .from("companion_heartbeats")
      .select("*")
      .eq("auth0_user_sub", userId)
      .order("last_seen_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const companionOnline = heartbeat
      ? (Date.now() - new Date(heartbeat.last_seen_at).getTime()) < 60000
      : false;

    // For now, github/slack are mock-connected for demo
    const status = {
      github: { connected: true, username: user.email?.split("@")[0] || "user" },
      slack: { connected: true, workspace: "Connected" },
      companion: {
        online: companionOnline,
        lastSeen: heartbeat?.last_seen_at || null,
        companionId: heartbeat?.companion_id || null,
      },
      user: {
        id: userId,
        email: user.email,
        displayName: user.user_metadata?.display_name || user.email,
      },
    };

    return new Response(JSON.stringify(status), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("status error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
