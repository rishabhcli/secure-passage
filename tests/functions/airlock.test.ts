import {
  computePayloadHash,
  evaluatePolicy,
  getMissingIntentFields,
  isCompanionOnline,
} from "@functions/_shared/airlock";

describe("airlock shared helpers", () => {
  it("computes deterministic payload hashes", () => {
    expect(
      computePayloadHash("slack_post_message", "C0123INCIDENTS", "Escalate"),
    ).toBe(
      computePayloadHash("slack_post_message", "C0123INCIDENTS", "Escalate"),
    );
  });

  it("evaluates allow and block policy branches", () => {
    expect(
      evaluatePolicy({
        sourceKind: "github_issue",
        destinationKind: "slack_post_message",
        destinationChannelId: "C0123INCIDENTS",
        destinationChannelLabel: "#incidents",
        proposedText: "Escalate now",
      }),
    ).toEqual({
      result: "allow_review",
      reasonCode: null,
      reasonText: null,
    });

    expect(
      evaluatePolicy({
        sourceKind: "github_issue",
        destinationKind: "slack_post_message",
        destinationChannelId: "C9999RANDOM",
        destinationChannelLabel: "#random",
        proposedText: "Escalate now",
      }),
    ).toEqual(
      expect.objectContaining({
        result: "block",
        reasonCode: "destination_channel_not_allowed",
      }),
    );
  });

  it("reports missing intent fields", () => {
    expect(
      getMissingIntentFields({
        sourceKind: "github_issue",
      }),
    ).toContain("idempotencyKey");
  });

  it("determines companion online state from the heartbeat timestamp", () => {
    expect(
      isCompanionOnline("2026-03-30T17:00:00.000Z", Date.parse("2026-03-30T17:00:30.000Z")),
    ).toBe(true);
    expect(
      isCompanionOnline("2026-03-30T17:00:00.000Z", Date.parse("2026-03-30T17:02:00.000Z")),
    ).toBe(false);
  });
});
