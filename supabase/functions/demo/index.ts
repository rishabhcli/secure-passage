import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_USER_ID = "demo-user-00000000-0000-0000-0000-000000000000";

function computePayloadHash(destinationKind: string, channelId: string, text: string): string {
  const input = `${destinationKind}|${channelId}|${text}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `sha256:${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

async function resolveUserId(req: Request, supabase: any): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) return user.id;
  }
  return DEMO_USER_ID;
}

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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const userId = await resolveUserId(req, supabase);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "reset") {
      const { data: crossings } = await supabase.from("crossings").select("id").eq("auth0_user_sub", userId);
      if (crossings && crossings.length > 0) {
        const ids = crossings.map((c: any) => c.id);
        await supabase.from("crossing_events").delete().in("crossing_id", ids);
        await supabase.from("crossings").delete().eq("auth0_user_sub", userId);
      }
      await supabase.from("companion_heartbeats").delete().eq("auth0_user_sub", userId);

      return new Response(JSON.stringify({ ok: true, message: "Demo state reset" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowedChannel = Deno.env.get("AIRLOCK_ALLOWED_SLACK_CHANNEL_ID") || "C0123INCIDENTS";
    const allowedLabel = Deno.env.get("AIRLOCK_ALLOWED_SLACK_CHANNEL_LABEL") || "#incidents";

    if (action === "seed-valid") {
      const proposedText = '🚨 [platform-api#342] Production database connection pool exhausted — Connection pool on prod-db-primary fully exhausted since 14:32 UTC. Immediate investigation required. https://github.com/acme-corp/platform-api/issues/342';
      const payloadHash = computePayloadHash("slack_post_message", allowedChannel, proposedText);
      const idempotencyKey = `demo-valid-${Date.now()}`;

      const { data: crossing, error: insertErr } = await supabase.from("crossings").insert({
        auth0_user_sub: userId,
        origin_type: "companion",
        companion_id: "companion-local-01",
        idempotency_key: idempotencyKey,
        demo_scenario_key: "valid_issue_alert",
        source_kind: "github_issue",
        source_repo_owner: "acme-corp",
        source_repo_name: "platform-api",
        source_issue_number: 342,
        source_issue_url: "https://github.com/acme-corp/platform-api/issues/342",
        source_title: "Production database connection pool exhausted",
        source_excerpt: "The connection pool on prod-db-primary has been fully exhausted since 14:32 UTC. All new requests are queuing. Immediate investigation required.",
        source_labels: ["severity:critical", "component:database", "env:production"],
        source_verified_at: new Date().toISOString(),
        destination_kind: "slack_post_message",
        destination_channel_id: allowedChannel,
        destination_channel_label: allowedLabel,
        proposed_text: proposedText,
        proposed_payload_hash: payloadHash,
        status: "ready_for_review",
        read_check_status: "verified",
        write_check_status: "awaiting_approval",
        policy_result: "allow_review",
        rationale: "Escalating critical database issue to incident channel for operator review.",
      }).select().single();

      if (insertErr) throw insertErr;

      const events = [
        { event_type: "intent.received", actor_type: "companion", actor_id: "companion-local-01", message: "Intent received from local companion" },
        { event_type: "source.verification.started", actor_type: "system", message: "Verifying GitHub issue acme-corp/platform-api#342" },
        { event_type: "source.verification.succeeded", actor_type: "system", message: "GitHub source verified through connected account", details_json: { issueTitle: "Production database connection pool exhausted" } },
        { event_type: "policy.allowed.review", actor_type: "system", message: "Policy evaluation passed. Crossing ready for human review.", details_json: { result: "allow_review" } },
      ];

      for (const evt of events) {
        await supabase.from("crossing_events").insert({
          crossing_id: crossing.id,
          auth0_user_sub: userId,
          ...evt,
        });
      }

      await supabase.from("companion_heartbeats").upsert({
        companion_id: "companion-local-01",
        auth0_user_sub: userId,
        origin_type: "local",
        sandboxed: true,
        version: "1.0.0",
        last_seen_at: new Date().toISOString(),
      }, { onConflict: "companion_id,auth0_user_sub" });

      return new Response(JSON.stringify({ ok: true, crossingId: crossing.id, status: "ready_for_review" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "seed-blocked") {
      const proposedText = 'README update needed for platform-api. See issue #340.';
      const wrongChannel = "C9999RANDOM";
      const payloadHash = computePayloadHash("slack_post_message", wrongChannel, proposedText);
      const idempotencyKey = `demo-blocked-${Date.now()}`;

      const { data: crossing, error: insertErr } = await supabase.from("crossings").insert({
        auth0_user_sub: userId,
        origin_type: "companion",
        companion_id: "companion-local-01",
        idempotency_key: idempotencyKey,
        demo_scenario_key: "blocked_wrong_channel",
        source_kind: "github_issue",
        source_repo_owner: "acme-corp",
        source_repo_name: "platform-api",
        source_issue_number: 340,
        source_issue_url: "https://github.com/acme-corp/platform-api/issues/340",
        source_title: "Update README with new deployment steps",
        source_excerpt: "The deployment documentation needs updating to reflect the new CI/CD pipeline changes.",
        source_labels: ["docs", "low-priority"],
        source_verified_at: new Date().toISOString(),
        destination_kind: "slack_post_message",
        destination_channel_id: wrongChannel,
        destination_channel_label: "#random",
        proposed_text: proposedText,
        proposed_payload_hash: payloadHash,
        status: "blocked_pre_review",
        read_check_status: "verified",
        write_check_status: "blocked",
        policy_result: "block",
        policy_reason_code: "destination_channel_not_allowed",
        policy_reason_text: "Blocked: destination channel #random is not allowed. Only #incidents is permitted.",
        rationale: "Attempting alternate routing.",
      }).select().single();

      if (insertErr) throw insertErr;

      const events = [
        { event_type: "intent.received", actor_type: "companion", actor_id: "companion-local-01", message: "Intent received from local companion" },
        { event_type: "source.verification.started", actor_type: "system", message: "Verifying GitHub issue acme-corp/platform-api#340" },
        { event_type: "source.verification.succeeded", actor_type: "system", message: "GitHub source verified through connected account" },
        { event_type: "policy.blocked", actor_type: "system", message: "Blocked: destination channel #random is not allowed. Only #incidents is permitted.", details_json: { reasonCode: "destination_channel_not_allowed" } },
      ];

      for (const evt of events) {
        await supabase.from("crossing_events").insert({
          crossing_id: crossing.id,
          auth0_user_sub: userId,
          ...evt,
        });
      }

      return new Response(JSON.stringify({ ok: true, crossingId: crossing.id, status: "blocked_pre_review" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use: reset, seed-valid, seed-blocked" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("demo error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
