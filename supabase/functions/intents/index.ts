import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  DEMO_USER_ID,
  computePayloadHash,
  evaluatePolicy,
  getMissingIntentFields,
  type IntentRequestBody,
  resolveUserIdFromAuthHeader,
} from "../_shared/airlock.ts";

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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth: companion secret, user JWT, or demo fallback
    const companionSecret = req.headers.get("x-airlock-companion-secret");
    const authHeader = req.headers.get("Authorization");
    let userId: string;

    if (companionSecret) {
      const expectedSecret = Deno.env.get("AIRLOCK_COMPANION_SECRET") || "demo-companion-secret";
      if (companionSecret !== expectedSecret) {
        return new Response(JSON.stringify({ error: "Invalid companion secret" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const body = (await req.json()) as IntentRequestBody;
      userId = body.auth0UserSub || DEMO_USER_ID;
      return await processIntent(supabase, userId, body);
    } else if (authHeader) {
      userId = await resolveUserIdFromAuthHeader(supabase, authHeader);
      const body = (await req.json()) as IntentRequestBody;
      body.auth0UserSub = userId;
      return await processIntent(supabase, userId, body);
    } else {
      // Demo fallback - no auth required
      const body = (await req.json()) as IntentRequestBody;
      userId = body.auth0UserSub || DEMO_USER_ID;
      return await processIntent(supabase, userId, body);
    }
  } catch (err) {
    console.error("intents error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

type SupabaseClient = ReturnType<typeof createClient>;

async function processIntent(supabase: SupabaseClient, userId: string, body: IntentRequestBody) {
  const missingFields = getMissingIntentFields(body);
  if (missingFields.length > 0) {
    return new Response(JSON.stringify({ error: `Missing required field: ${missingFields[0]}` }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check idempotency
  const { data: existing } = await supabase
    .from("crossings")
    .select("id, status")
    .eq("idempotency_key", body.idempotencyKey!)
    .maybeSingle();

  if (existing) {
    return new Response(JSON.stringify({ crossingId: existing.id, status: existing.status, idempotent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const payloadHash = computePayloadHash(
    body.destinationKind!,
    body.destinationChannelId!,
    body.proposedText!,
  );

  // Insert crossing
  const { data: crossing, error: insertErr } = await supabase.from("crossings").insert({
    auth0_user_sub: userId,
    origin_type: body.originType || "companion",
    companion_id: body.companionId || null,
    idempotency_key: body.idempotencyKey!,
    demo_scenario_key: body.demoScenarioKey || null,
    source_kind: body.sourceKind!,
    source_repo_owner: body.sourceRepoOwner!,
    source_repo_name: body.sourceRepoName!,
    source_issue_number: body.sourceIssueNumber!,
    destination_kind: body.destinationKind!,
    destination_channel_id: body.destinationChannelId!,
    destination_channel_label: body.destinationChannelLabel!,
    proposed_text: body.proposedText!,
    proposed_payload_hash: payloadHash,
    status: "received",
    read_check_status: "pending",
    write_check_status: "awaiting_approval",
    policy_result: "pending",
    rationale: body.rationale || null,
  }).select().single();

  if (insertErr) throw insertErr;

  // Log intent.received
  await supabase.from("crossing_events").insert({
    crossing_id: crossing.id,
    auth0_user_sub: userId,
    event_type: "intent.received",
    actor_type: "companion",
    actor_id: body.companionId || null,
    message: "Intent received from local companion",
  });

  // Source verification (mock)
  await supabase.from("crossing_events").insert({
    crossing_id: crossing.id,
    auth0_user_sub: userId,
    event_type: "source.verification.started",
    actor_type: "system",
    message: `Verifying GitHub issue ${body.sourceRepoOwner}/${body.sourceRepoName}#${body.sourceIssueNumber}`,
  });

  // Mock verification - store source snapshot
  const sourceTitle = body.sourceTitle || `Issue #${body.sourceIssueNumber}`;
  const sourceExcerpt = body.sourceExcerpt || "Source content verified by AIRLOCK.";
  const sourceUrl = `https://github.com/${body.sourceRepoOwner}/${body.sourceRepoName}/issues/${body.sourceIssueNumber}`;

  await supabase.from("crossings").update({
    status: "verifying_source",
    source_title: sourceTitle,
    source_excerpt: sourceExcerpt,
    source_issue_url: sourceUrl,
    source_labels: body.sourceLabels || [],
  }).eq("id", crossing.id);

  // Mark verified
  const verifiedAt = new Date().toISOString();
  await supabase.from("crossings").update({
    read_check_status: "verified",
    source_verified_at: verifiedAt,
  }).eq("id", crossing.id);

  await supabase.from("crossing_events").insert({
    crossing_id: crossing.id,
    auth0_user_sub: userId,
    event_type: "source.verification.succeeded",
    actor_type: "system",
    message: "GitHub source verified through connected account",
    details_json: { issueTitle: sourceTitle },
  });

  // Policy evaluation
  const policy = evaluatePolicy(
    {
      sourceKind: body.sourceKind!,
      destinationKind: body.destinationKind!,
      destinationChannelId: body.destinationChannelId!,
      destinationChannelLabel: body.destinationChannelLabel!,
      proposedText: body.proposedText!,
    },
    {
      allowedChannelId: Deno.env.get("AIRLOCK_ALLOWED_SLACK_CHANNEL_ID") || "C0123INCIDENTS",
      maxMessageLength: parseInt(Deno.env.get("AIRLOCK_MAX_MESSAGE_LENGTH") || "2000", 10),
    },
  );

  if (policy.result === "block") {
    await supabase.from("crossings").update({
      status: "blocked_pre_review",
      write_check_status: "blocked",
      policy_result: "block",
      policy_reason_code: policy.reasonCode,
      policy_reason_text: policy.reasonText,
    }).eq("id", crossing.id);

    await supabase.from("crossing_events").insert({
      crossing_id: crossing.id,
      auth0_user_sub: userId,
      event_type: "policy.blocked",
      actor_type: "system",
      message: policy.reasonText,
      details_json: { reasonCode: policy.reasonCode },
    });

    return new Response(JSON.stringify({
      crossingId: crossing.id,
      status: "blocked_pre_review",
      policyResult: "block",
      policyReasonText: policy.reasonText,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Allow review
  await supabase.from("crossings").update({
    status: "ready_for_review",
    write_check_status: "awaiting_approval",
    policy_result: "allow_review",
  }).eq("id", crossing.id);

  await supabase.from("crossing_events").insert({
    crossing_id: crossing.id,
    auth0_user_sub: userId,
    event_type: "policy.allowed.review",
    actor_type: "system",
    message: "Policy evaluation passed. Crossing ready for human review.",
    details_json: { result: "allow_review" },
  });

  return new Response(JSON.stringify({
    crossingId: crossing.id,
    status: "ready_for_review",
    policyResult: "allow_review",
    proposedPayloadHash: payloadHash,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
