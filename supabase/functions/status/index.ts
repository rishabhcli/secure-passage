import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-airlock-companion-secret",
};

const DEMO_USER_ID = "demo-user-00000000-0000-0000-0000-000000000000";

async function resolveUserId(req: Request, supabase: any): Promise<{ userId: string; email: string; displayName: string }> {
  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      return {
        userId: user.id,
        email: user.email || "user@airlock.dev",
        displayName: user.user_metadata?.display_name || user.email || "Operator",
      };
    }
  }
  return { userId: DEMO_USER_ID, email: "operator@airlock.dev", displayName: "Demo Operator" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { userId, email, displayName } = await resolveUserId(req, supabase);

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

    const status = {
      github: { connected: true, username: email.split("@")[0] },
      slack: { connected: true, workspace: "Demo Workspace" },
      companion: {
        online: companionOnline,
        lastSeen: heartbeat?.last_seen_at || null,
        companionId: heartbeat?.companion_id || null,
      },
      user: {
        id: userId,
        email,
        displayName,
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
