import {
  callFunction,
  ensureUser,
  findCrossingById,
  findCrossingEvents,
  getLocalSupabaseConfig,
  resetDemoState,
  seedBlockedCrossing,
  seedValidCrossing,
  signInAndGetToken,
  upsertHeartbeat,
} from "../helpers/local-supabase";

const primaryUser = {
  email: process.env.E2E_TEST_EMAIL || "operator-e2e@example.com",
  password: process.env.E2E_TEST_PASSWORD || "OperatorPass123!",
  displayName: "Operator One",
};

const secondaryUser = {
  email: process.env.SECONDARY_TEST_EMAIL || "operator-secondary@example.com",
  password: process.env.SECONDARY_TEST_PASSWORD || "OperatorPass123!",
  displayName: "Operator Two",
};

let primaryUserId = "";
let primaryToken = "";
let secondaryToken = "";

describe("local edge function contracts", () => {
  beforeAll(async () => {
    primaryUserId = await ensureUser(primaryUser);
    await ensureUser(secondaryUser);
    primaryToken = await signInAndGetToken(primaryUser);
    secondaryToken = await signInAndGetToken(secondaryUser);
  });

  beforeEach(async () => {
    await resetDemoState(primaryToken);
    await resetDemoState(secondaryToken);
  });

  it("rejects invalid methods", async () => {
    const { apiUrl, anonKey } = getLocalSupabaseConfig();
    const response = await fetch(`${apiUrl}/functions/v1/demo`, {
      method: "GET",
      headers: {
        apikey: anonKey,
      },
    });

    expect(response.status).toBe(405);
  });

  it("validates required intent fields and supports idempotent replays", async () => {
    const missing = await callFunction("intents", {
      method: "POST",
      token: primaryToken,
      body: {
        sourceKind: "github_issue",
      },
    });

    expect(missing.response.status).toBe(400);
    expect(missing.json).toEqual(
      expect.objectContaining({
        error: "Missing required field: idempotencyKey",
      }),
    );

    const body = {
      idempotencyKey: "intent-1",
      sourceKind: "github_issue",
      sourceRepoOwner: "acme-corp",
      sourceRepoName: "platform-api",
      sourceIssueNumber: 500,
      destinationKind: "slack_post_message",
      destinationChannelId: "C0123INCIDENTS",
      destinationChannelLabel: "#incidents",
      proposedText: "Escalate issue 500",
    };

    const first = await callFunction("intents", {
      method: "POST",
      token: primaryToken,
      body,
    });
    const second = await callFunction("intents", {
      method: "POST",
      token: primaryToken,
      body,
    });

    expect(first.response.status).toBe(200);
    expect(second.json).toEqual(
      expect.objectContaining({
        idempotent: true,
      }),
    );
  });

  it("blocks disallowed channels and allows valid review crossings", async () => {
    const blocked = await callFunction("intents", {
      method: "POST",
      token: primaryToken,
      body: {
        idempotencyKey: "intent-blocked",
        sourceKind: "github_issue",
        sourceRepoOwner: "acme-corp",
        sourceRepoName: "platform-api",
        sourceIssueNumber: 501,
        destinationKind: "slack_post_message",
        destinationChannelId: "C9999RANDOM",
        destinationChannelLabel: "#random",
        proposedText: "Escalate blocked issue",
      },
    });

    const allowed = await callFunction("intents", {
      method: "POST",
      token: primaryToken,
      body: {
        idempotencyKey: "intent-allowed",
        sourceKind: "github_issue",
        sourceRepoOwner: "acme-corp",
        sourceRepoName: "platform-api",
        sourceIssueNumber: 502,
        destinationKind: "slack_post_message",
        destinationChannelId: "C0123INCIDENTS",
        destinationChannelLabel: "#incidents",
        proposedText: "Escalate allowed issue",
      },
    });

    expect(blocked.json).toEqual(
      expect.objectContaining({
        status: "blocked_pre_review",
      }),
    );
    expect(allowed.json).toEqual(
      expect.objectContaining({
        status: "ready_for_review",
      }),
    );
  });

  it("handles approve-send mismatches and deny conflicts", async () => {
    const seeded = await seedValidCrossing(primaryToken);
    const seededCrossingId = (seeded.json as { crossingId: string }).crossingId;

    const mismatch = await callFunction("crossings", {
      method: "POST",
      token: primaryToken,
      searchParams: {
        action: "approve-send",
        id: seededCrossingId,
      },
      body: {
        approvedPayloadHash: "sha256:wrong",
      },
    });

    expect(mismatch.response.status).toBe(409);

    const detail = await findCrossingById(seededCrossingId);
    const approved = await callFunction("crossings", {
      method: "POST",
      token: primaryToken,
      searchParams: {
        action: "approve-send",
        id: seededCrossingId,
      },
      body: {
        approvedPayloadHash: detail.proposed_payload_hash,
      },
    });

    expect(approved.json).toEqual(
      expect.objectContaining({
        status: "sent",
      }),
    );

    const denyAfterSend = await callFunction("crossings", {
      method: "POST",
      token: primaryToken,
      searchParams: {
        action: "deny",
        id: seededCrossingId,
      },
    });

    expect(denyAfterSend.response.status).toBe(409);
  });

  it("enforces list and detail ownership per authenticated user", async () => {
    const seeded = await seedValidCrossing(primaryToken);
    const crossingId = (seeded.json as { crossingId: string }).crossingId;

    const ownList = await callFunction("crossings", {
      token: primaryToken,
    });
    const foreignDetail = await callFunction("crossings", {
      token: secondaryToken,
      searchParams: {
        action: "detail",
        id: crossingId,
      },
    });

    expect((ownList.json as Array<unknown>).length).toBeGreaterThan(0);
    expect(foreignDetail.response.status).toBe(404);
  });

  it("seeds and resets demo scenarios while persisting event history", async () => {
    const seeded = await seedBlockedCrossing(primaryToken);
    const crossingId = (seeded.json as { crossingId: string }).crossingId;
    const events = await findCrossingEvents(crossingId);

    expect(events).toHaveLength(4);

    await resetDemoState(primaryToken);

    const listAfterReset = await callFunction("crossings", {
      token: primaryToken,
    });
    expect(listAfterReset.json).toEqual([]);
  });

  it("supports heartbeat auth modes and status online/offline calculation", async () => {
    await upsertHeartbeat(primaryUserId, "2026-03-30T16:58:00.000Z");

    const offlineStatus = await callFunction("status", {
      token: primaryToken,
    });
    expect(offlineStatus.json).toEqual(
      expect.objectContaining({
        companion: expect.objectContaining({
          online: false,
        }),
      }),
    );

    const secretHeartbeat = await callFunction("heartbeat", {
      method: "POST",
      headers: {
        "x-airlock-companion-secret": process.env.AIRLOCK_COMPANION_SECRET || "demo-companion-secret",
      },
      body: {
        auth0UserSub: primaryUserId,
        companionId: "companion-local-01",
        originType: "local",
      },
    });

    expect(secretHeartbeat.response.status).toBe(200);

    const statusAfterSecret = await callFunction("status", {
      token: primaryToken,
    });
    expect(statusAfterSecret.json).toEqual(
      expect.objectContaining({
        companion: expect.objectContaining({
          online: true,
        }),
      }),
    );

    const jwtHeartbeat = await callFunction("heartbeat", {
      method: "POST",
      token: primaryToken,
      body: {
        companionId: "companion-local-01",
        originType: "local",
      },
    });
    const demoHeartbeat = await callFunction("heartbeat", {
      method: "POST",
      body: {
        companionId: "companion-local-01",
        originType: "demo",
      },
    });

    expect(jwtHeartbeat.response.status).toBe(200);
    expect(demoHeartbeat.response.status).toBe(200);
  });
});
