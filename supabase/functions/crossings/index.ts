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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    // Routes: GET / (list), GET /:id, POST /:id/approve-send, POST /:id/deny

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

    // Parse sub-path from query param since edge functions use flat routing
    const action = url.searchParams.get("action"); // "list", "detail", "approve-send", "deny"
    const crossingId = url.searchParams.get("id");

    // LIST crossings
    if (req.method === "GET" && (!action || action === "list")) {
      const mode = url.searchParams.get("mode"); // "pending" | "receipts" | null (all)

      let query = supabase
        .from("crossings")
        .select("id, status, read_check_status, write_check_status, source_repo_owner, source_repo_name, source_issue_number, source_title, destination_channel_label, destination_kind, policy_result, policy_reason_text, created_at, updated_at")
        .eq("auth0_user_sub", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (mode === "pending") {
        query = query.in("status", ["received", "verifying_source", "ready_for_review"]);
      } else if (mode === "receipts") {
        query = query.in("status", ["sent", "blocked_pre_review", "denied", "failed"]);
      }

      const { data, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify(data || []), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DETAIL
    if (req.method === "GET" && action === "detail" && crossingId) {
      const { data: crossing, error } = await supabase
        .from("crossings")
        .select("*")
        .eq("id", crossingId)
        .eq("auth0_user_sub", userId)
        .maybeSingle();

      if (error) throw error;
      if (!crossing) {
        return new Response(JSON.stringify({ error: "Crossing not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: events } = await supabase
        .from("crossing_events")
        .select("*")
        .eq("crossing_id", crossingId)
        .order("created_at", { ascending: true });

      return new Response(JSON.stringify({ crossing, events: events || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // APPROVE AND SEND
    if (req.method === "POST" && action === "approve-send" && crossingId) {
      const body = await req.json();
      const approvedPayloadHash = body.approvedPayloadHash;

      if (!approvedPayloadHash) {
        return new Response(JSON.stringify({ error: "approvedPayloadHash is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch crossing
      const { data: crossing, error: fetchErr } = await supabase
        .from("crossings")
        .select("*")
        .eq("id", crossingId)
        .eq("auth0_user_sub", userId)
        .maybeSingle();

      if (fetchErr) throw fetchErr;
      if (!crossing) {
        return new Response(JSON.stringify({ error: "Crossing not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (crossing.status !== "ready_for_review") {
        return new Response(JSON.stringify({ error: "Crossing is not ready for review" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (approvedPayloadHash !== crossing.proposed_payload_hash) {
        return new Response(JSON.stringify({ error: "Payload hash mismatch. The reviewed payload no longer matches." }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Log send.started
      await supabase.from("crossing_events").insert({
        crossing_id: crossingId,
        auth0_user_sub: userId,
        event_type: "send.started",
        actor_type: "user",
        actor_id: userId,
        message: "Executing outbound Slack message through connected account",
      });

      // Update status to sending
      await supabase.from("crossings").update({ status: "sending", write_check_status: "sending" }).eq("id", crossingId);

      // Mock Slack send
      const mockSlackTs = `${Math.floor(Date.now() / 1000)}.${Math.floor(Math.random() * 1000000).toString().padStart(6, "0")}`;
      const slackResponse = {
        ok: true,
        channel: crossing.destination_channel_id,
        ts: mockSlackTs,
        message: { text: crossing.proposed_text },
      };

      // Update crossing to sent
      const { error: updateErr } = await supabase.from("crossings").update({
        status: "sent",
        write_check_status: "sent",
        approved_by_sub: userId,
        approved_at: new Date().toISOString(),
        approved_payload_hash: approvedPayloadHash,
        slack_message_ts: mockSlackTs,
        slack_response_json: slackResponse,
      }).eq("id", crossingId);

      if (updateErr) throw updateErr;

      // Log send.succeeded
      await supabase.from("crossing_events").insert({
        crossing_id: crossingId,
        auth0_user_sub: userId,
        event_type: "send.succeeded",
        actor_type: "system",
        message: "Message sent to Slack through connected account",
        details_json: { ts: mockSlackTs, channel: crossing.destination_channel_id },
      });

      return new Response(JSON.stringify({
        status: "sent",
        slackMessageTs: mockSlackTs,
        channel: crossing.destination_channel_label,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DENY
    if (req.method === "POST" && action === "deny" && crossingId) {
      const { data: crossing, error: fetchErr } = await supabase
        .from("crossings")
        .select("id, status, auth0_user_sub")
        .eq("id", crossingId)
        .eq("auth0_user_sub", userId)
        .maybeSingle();

      if (fetchErr) throw fetchErr;
      if (!crossing) {
        return new Response(JSON.stringify({ error: "Crossing not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (crossing.status !== "ready_for_review") {
        return new Response(JSON.stringify({ error: "Crossing is not in a deniable state" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("crossings").update({
        status: "denied",
        write_check_status: "denied",
      }).eq("id", crossingId);

      await supabase.from("crossing_events").insert({
        crossing_id: crossingId,
        auth0_user_sub: userId,
        event_type: "crossing.denied",
        actor_type: "user",
        actor_id: userId,
        message: "Crossing denied by operator",
      });

      return new Response(JSON.stringify({ status: "denied" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("crossings error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
