import type {
  CrossingDetail,
  CrossingEvent,
  CrossingListItem,
  StatusResponse,
} from "@/types/airlock";

const FIXED_TIMESTAMP = "2026-03-30T17:00:00.000Z";

export function makeStatusResponse(
  overrides: Partial<StatusResponse> = {},
): StatusResponse {
  return {
    github: { connected: true, username: "operator-dev" },
    slack: { connected: true, workspace: "AcmeCorp" },
    companion: {
      online: true,
      lastSeen: FIXED_TIMESTAMP,
      companionId: "companion-local-01",
    },
    user: {
      id: "user-001",
      email: "operator@example.com",
      displayName: "Alex Chen",
    },
    ...overrides,
  };
}

export function makeCrossingListItem(
  overrides: Partial<CrossingListItem> = {},
): CrossingListItem {
  return {
    id: "cx-001",
    status: "ready_for_review",
    read_check_status: "verified",
    write_check_status: "awaiting_approval",
    source_repo_owner: "acme-corp",
    source_repo_name: "platform-api",
    source_issue_number: 342,
    source_title: "Production database connection pool exhausted",
    destination_channel_label: "#incidents",
    destination_kind: "slack_post_message",
    policy_result: "allow_review",
    policy_reason_text: null,
    created_at: FIXED_TIMESTAMP,
    updated_at: FIXED_TIMESTAMP,
    ...overrides,
  };
}

export function makeCrossingDetail(
  overrides: Partial<CrossingDetail> = {},
): CrossingDetail {
  const listItem = makeCrossingListItem(overrides);
  return {
    ...listItem,
    auth0_user_sub: "user-001",
    origin_type: "companion",
    companion_id: "companion-local-01",
    idempotency_key: "idempotency-key-1",
    demo_scenario_key: "valid_issue_alert",
    source_kind: "github_issue",
    source_issue_url: "https://github.com/acme-corp/platform-api/issues/342",
    source_excerpt:
      "The connection pool on prod-db-primary has been fully exhausted.",
    source_labels: ["severity:critical", "env:production"],
    source_verified_at: FIXED_TIMESTAMP,
    destination_channel_id: "C0123INCIDENTS",
    proposed_text: "Escalate issue to #incidents immediately.",
    proposed_payload_hash: "sha256:deadbeef",
    policy_reason_code: null,
    approved_by_sub: null,
    approved_at: null,
    approved_payload_hash: null,
    slack_message_ts: null,
    slack_response_json: null,
    execution_error_code: null,
    execution_error_text: null,
    rationale: "Escalating critical issue to incident responders.",
    ...overrides,
  };
}

export function makeCrossingEvents(
  overrides: Partial<CrossingEvent>[] = [],
): CrossingEvent[] {
  return [
    {
      id: "evt-1",
      crossing_id: "cx-001",
      auth0_user_sub: "user-001",
      event_type: "intent.received",
      actor_type: "companion",
      actor_id: "companion-local-01",
      message: "Intent received from local companion",
      details_json: null,
      created_at: FIXED_TIMESTAMP,
      ...overrides[0],
    },
    {
      id: "evt-2",
      crossing_id: "cx-001",
      auth0_user_sub: "user-001",
      event_type: "policy.allowed.review",
      actor_type: "system",
      actor_id: null,
      message: "Policy evaluation passed. Crossing ready for human review.",
      details_json: { result: "allow_review" },
      created_at: FIXED_TIMESTAMP,
      ...overrides[1],
    },
  ];
}
