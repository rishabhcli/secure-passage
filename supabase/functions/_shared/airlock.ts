export const DEMO_USER_ID = "demo-user-00000000-0000-0000-0000-000000000000";

export interface AuthUser {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}

export interface SupabaseAuthClient {
  auth: {
    getUser: (token: string) => Promise<{
      data: { user: AuthUser | null };
      error: unknown;
    }>;
  };
}

export interface StatusUser {
  userId: string;
  email: string;
  displayName: string;
}

export interface IntentRequestBody {
  auth0UserSub?: string;
  companionId?: string | null;
  demoScenarioKey?: string | null;
  destinationChannelId?: string;
  destinationChannelLabel?: string;
  destinationKind?: string;
  idempotencyKey?: string;
  originType?: string;
  proposedText?: string;
  rationale?: string | null;
  sourceExcerpt?: string | null;
  sourceIssueNumber?: number;
  sourceKind?: string;
  sourceLabels?: string[];
  sourceRepoName?: string;
  sourceRepoOwner?: string;
  sourceTitle?: string | null;
}

export interface PolicyInput {
  destinationChannelId: string;
  destinationChannelLabel: string;
  destinationKind: string;
  proposedText: string;
  sourceKind: string;
}

export interface PolicyEvaluationResult {
  result: "allow_review" | "block";
  reasonCode: string | null;
  reasonText: string | null;
}

export interface PolicyEvaluationOptions {
  allowedChannelId?: string;
  maxMessageLength?: number;
}

export function computePayloadHash(destinationKind: string, channelId: string, text: string): string {
  const input = `${destinationKind}|${channelId}|${text}`;
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    const char = input.charCodeAt(index);
    hash = (hash << 5) - hash + char;
    hash &= hash;
  }

  return `sha256:${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

export function evaluatePolicy(
  input: PolicyInput,
  options: PolicyEvaluationOptions = {},
): PolicyEvaluationResult {
  const allowedChannelId = options.allowedChannelId ?? "C0123INCIDENTS";
  const maxMessageLength = options.maxMessageLength ?? 2000;

  if (input.sourceKind !== "github_issue") {
    return {
      result: "block",
      reasonCode: "invalid_source_kind",
      reasonText: "Source kind must be github_issue",
    };
  }

  if (input.destinationKind !== "slack_post_message") {
    return {
      result: "block",
      reasonCode: "invalid_destination_kind",
      reasonText: "Destination kind must be slack_post_message",
    };
  }

  if (input.destinationChannelId !== allowedChannelId) {
    return {
      result: "block",
      reasonCode: "destination_channel_not_allowed",
      reasonText: `Blocked: destination channel ${input.destinationChannelLabel} is not allowed. Only the configured incident channel is permitted.`,
    };
  }

  if (input.proposedText.length > maxMessageLength) {
    return {
      result: "block",
      reasonCode: "proposed_text_too_long",
      reasonText: `Proposed text exceeds maximum length of ${maxMessageLength} characters`,
    };
  }

  return {
    result: "allow_review",
    reasonCode: null,
    reasonText: null,
  };
}

export function getMissingIntentFields(body: IntentRequestBody): string[] {
  const requiredFields: Array<keyof IntentRequestBody> = [
    "idempotencyKey",
    "sourceKind",
    "sourceRepoOwner",
    "sourceRepoName",
    "sourceIssueNumber",
    "destinationKind",
    "destinationChannelId",
    "destinationChannelLabel",
    "proposedText",
  ];

  return requiredFields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || value === "";
  }) as string[];
}

export function isCompanionOnline(
  lastSeenAt: string | null | undefined,
  now = Date.now(),
  heartbeatWindowMs = 60_000,
): boolean {
  if (!lastSeenAt) {
    return false;
  }

  return now - new Date(lastSeenAt).getTime() < heartbeatWindowMs;
}

export async function resolveUserIdFromAuthHeader(
  supabase: SupabaseAuthClient,
  authHeader: string | null,
  fallbackUserId = DEMO_USER_ID,
): Promise<string> {
  if (!authHeader) {
    return fallbackUserId;
  }

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (!error && user) {
    return user.id;
  }

  return fallbackUserId;
}

export async function resolveStatusUserFromAuthHeader(
  supabase: SupabaseAuthClient,
  authHeader: string | null,
): Promise<StatusUser> {
  if (!authHeader) {
    return {
      userId: DEMO_USER_ID,
      email: "operator@airlock.dev",
      displayName: "Demo Operator",
    };
  }

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (!error && user) {
    const email = user.email || "user@airlock.dev";
    const displayName =
      typeof user.user_metadata?.display_name === "string"
        ? user.user_metadata.display_name
        : email || "Operator";

    return {
      userId: user.id,
      email,
      displayName,
    };
  }

  return {
    userId: DEMO_USER_ID,
    email: "operator@airlock.dev",
    displayName: "Demo Operator",
  };
}
