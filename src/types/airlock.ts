// Crossing statuses
export const CROSSING_STATUSES = [
  'received',
  'verifying_source',
  'ready_for_review',
  'blocked_pre_review',
  'sending',
  'sent',
  'denied',
  'failed',
] as const;

export type CrossingStatus = typeof CROSSING_STATUSES[number];

export const READ_CHECK_STATUSES = ['pending', 'verified', 'failed'] as const;
export type ReadCheckStatus = typeof READ_CHECK_STATUSES[number];

export const WRITE_CHECK_STATUSES = ['awaiting_approval', 'blocked', 'sending', 'sent', 'failed', 'denied'] as const;
export type WriteCheckStatus = typeof WRITE_CHECK_STATUSES[number];

export const EVENT_TYPES = [
  'intent.received',
  'source.verification.started',
  'source.verification.succeeded',
  'source.verification.failed',
  'policy.allowed.review',
  'policy.blocked',
  'review.opened',
  'approval.requested',
  'send.started',
  'send.succeeded',
  'send.failed',
  'crossing.denied',
] as const;
export type EventType = typeof EVENT_TYPES[number];

// Crossing list item (lightweight)
export interface CrossingListItem {
  id: string;
  status: CrossingStatus;
  read_check_status: ReadCheckStatus;
  write_check_status: WriteCheckStatus;
  source_repo_owner: string;
  source_repo_name: string;
  source_issue_number: number;
  source_title: string | null;
  destination_channel_label: string;
  destination_kind: string;
  policy_result: string;
  policy_reason_text: string | null;
  created_at: string;
  updated_at: string;
}

// Full crossing detail
export interface CrossingDetail {
  id: string;
  auth0_user_sub: string;
  origin_type: string;
  companion_id: string | null;
  idempotency_key: string;
  demo_scenario_key: string | null;
  source_kind: string;
  source_repo_owner: string;
  source_repo_name: string;
  source_issue_number: number;
  source_issue_url: string | null;
  source_title: string | null;
  source_excerpt: string | null;
  source_labels: string[] | null;
  source_verified_at: string | null;
  destination_kind: string;
  destination_channel_id: string;
  destination_channel_label: string;
  proposed_text: string;
  proposed_payload_hash: string;
  status: CrossingStatus;
  read_check_status: ReadCheckStatus;
  write_check_status: WriteCheckStatus;
  policy_result: string;
  policy_reason_code: string | null;
  policy_reason_text: string | null;
  approved_by_sub: string | null;
  approved_at: string | null;
  approved_payload_hash: string | null;
  slack_message_ts: string | null;
  slack_response_json: Record<string, unknown> | null;
  execution_error_code: string | null;
  execution_error_text: string | null;
  rationale: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrossingEvent {
  id: string;
  crossing_id: string;
  auth0_user_sub: string;
  event_type: string;
  actor_type: string;
  actor_id: string | null;
  message: string;
  details_json: Record<string, unknown> | null;
  created_at: string;
}

export interface StatusResponse {
  github: { connected: boolean; username?: string };
  slack: { connected: boolean; workspace?: string };
  companion: { online: boolean; lastSeen?: string; companionId?: string };
  user: { id: string; email?: string; displayName?: string };
}

export interface CompanionHeartbeat {
  companion_id: string;
  auth0_user_sub: string;
  origin_type: string;
  sandboxed: boolean | null;
  version: string | null;
  last_seen_at: string;
}

export interface PolicyEvaluation {
  result: 'allow_review' | 'block';
  reasonCode: string | null;
  reasonText: string | null;
  evaluatedAt: string;
}

export interface ReceiptSummary {
  crossingId: string;
  outcome: 'sent' | 'blocked' | 'denied' | 'failed';
  sourceRef: string;
  destinationLabel: string;
  reasonText: string | null;
  timestamp: string;
}
