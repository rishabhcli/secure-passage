import { join } from "node:path";

export const repoRoot = "/Users/rishabhbansal/Documents/GitHub/secure-passage";
export const outputRoot = join(repoRoot, "output", "demo-video");
export const footageRoot = join(outputRoot, "footage");
export const rawFootageRoot = join(footageRoot, "raw");
export const processedFootageRoot = join(footageRoot, "processed");
export const audioRoot = join(outputRoot, "audio");
export const audioSegmentsRoot = join(audioRoot, "segments");
export const auditionRoot = join(audioRoot, "auditions");
export const subtitlesRoot = join(outputRoot, "subtitles");
export const stillsRoot = join(outputRoot, "stills");
export const finalRoot = join(outputRoot, "final");
export const publicAssetRoot = join(repoRoot, "public", "demo-video-assets");
export const publicAudioRoot = join(publicAssetRoot, "audio");
export const publicFootageRoot = join(publicAssetRoot, "footage");
export const publicStillsRoot = join(publicAssetRoot, "stills");

export const baseUrl = process.env.AIRLOCK_DEMO_BASE_URL || "http://127.0.0.1:8081";
export const viewport = { width: 1600, height: 900 };
export const fps = 30;

export const selectedVoice = "af_heart";
export const auditionVoices = ["af_heart", "af_bella", "bf_emma"];

export const narrationSegments = [
  {
    id: "landing_hook",
    shotId: "landing_hook",
    callout: "The agent proposes. You decide.",
    text: "This message does not get to Slack just because an agent asked for it. AIRLOCK stops it at the border, checks where it came from, checks where it is going, and then puts a human in the loop before anything crosses over.",
  },
  {
    id: "dashboard_intro",
    shotId: "dashboard_intro",
    callout: "A visible checkpoint",
    text: "This is AIRLOCK’s control panel. The local companion can propose work, but the control plane decides whether that work is reviewable, blocked, or ready to send. On one screen, you can see system readiness, the queue of pending crossings, and the receipts that prove what already happened. That makes the product legible right away: this is not hidden agent behavior. It is supervised agent behavior.",
  },
  {
    id: "review_drawer",
    shotId: "review_drawer",
    callout: "Human review before action",
    text: "Here is the first moment that feels different from a normal AI workflow. The operator opens a pending crossing and gets the exact source, the intended destination, the full outbound message, and the companion’s rationale. You are not approving a fuzzy idea. You are approving a specific action with a specific payload.",
  },
  {
    id: "detail_page",
    shotId: "detail_page",
    callout: "Evidence, payload, receipts",
    text: "On the detail page, AIRLOCK slows the whole thing down in a good way. You can inspect the GitHub issue that triggered the crossing, read the excerpt that was verified, confirm the Slack destination, and compare that with the exact text that would be posted. It even keeps the payload hash and a timeline of events, so this becomes an auditable record instead of a blind trust exercise. If an operator needs to explain why a message was approved later, this page already has most of the answer.",
  },
  {
    id: "demo_seed",
    shotId: "demo_seed",
    callout: "Deterministic demo controls",
    text: "For the demo environment, AIRLOCK also includes operator controls to reset state and seed clean scenarios. That matters because it lets us show the same high-signal flows every time, without hand-editing data or hoping a live provider happens to return the right example on cue.",
  },
  {
    id: "approve_send",
    shotId: "approve_send",
    callout: "Approve and execute",
    text: "Now the operator approves the crossing. In this demo build, GitHub verification and Slack delivery are intentionally deterministic and mocked, but the control flow is real: AIRLOCK advances the crossing, records the send, and moves the message into receipts so the operator can prove exactly what happened. That is the distinction the demo is trying to make. The provider side is stable on purpose, but the governance path is the real product behavior.",
  },
  {
    id: "sent_detail",
    shotId: "sent_detail",
    callout: "A durable receipt",
    text: "That receipt is important. AIRLOCK does not just say the action succeeded. It preserves the evidence, the approved payload, the outcome, and the execution metadata in one place. That is the difference between a flashy demo and a system that can actually support governance.",
  },
  {
    id: "blocked_detail",
    shotId: "blocked_detail",
    callout: "Policy blocks before blast radius",
    text: "The blocked path is where the product really proves its point. This issue is valid, but the destination channel is wrong. AIRLOCK catches that before review, explains the policy decision in plain language, and leaves a visible record behind. So the operator sees why the action stopped, and the agent never gets a silent free pass into the wrong system. For a hackathon demo, this is the moment that turns the idea from clever to credible.",
  },
  {
    id: "heartbeat_ops",
    shotId: "heartbeat_ops",
    callout: "Operational companion state",
    text: "There is an operational layer too. The demo tools can simulate the local companion heartbeat, which makes the companion state visible to the operator. That small detail is useful, because the control plane is not just reviewing messages. It is also keeping track of whether the companion at the edge is actually online and behaving as expected. In other words, AIRLOCK is watching the pathway and the actor using it.",
  },
  {
    id: "connections_architecture",
    shotId: "connections_architecture",
    callout: "Read side and write side split",
    text: "The connections model is deliberately simple. GitHub is the read side for source verification. Slack is the write side for outbound execution. And the local companion does not need direct access to either one. AIRLOCK sits in the middle as the checkpoint that verifies source, evaluates policy, and mediates the final action.",
  },
  {
    id: "closing_payoff",
    shotId: "closing_payoff",
    callout: "Governed AI action",
    text: "So the payoff is straightforward. You still get fast AI-assisted action, but now it comes with review gates, policy enforcement, companion awareness, and receipts that make every crossing legible after the fact. The operator stays in control, the system stays auditable, and the agent still moves fast enough to be useful. If you want agents to do real work without giving them unchecked access to external systems, this is the shape of the product.",
  },
];

export const shotPlan = [
  { id: "landing_hook", label: "Landing hook", idealPaddingSec: 2.8, zoom: [1, 1.03] },
  { id: "dashboard_intro", label: "Dashboard intro", idealPaddingSec: 3.4, zoom: [1.01, 1.05] },
  { id: "review_drawer", label: "Review drawer", idealPaddingSec: 3.1, zoom: [1, 1.025] },
  { id: "detail_page", label: "Detail page", idealPaddingSec: 4.2, zoom: [1.01, 1.04] },
  { id: "demo_seed", label: "Demo seed controls", idealPaddingSec: 2.6, zoom: [1, 1.02] },
  { id: "approve_send", label: "Approve and send", idealPaddingSec: 2.8, zoom: [1, 1.03] },
  { id: "sent_detail", label: "Sent detail", idealPaddingSec: 2.7, zoom: [1.01, 1.035] },
  { id: "blocked_detail", label: "Blocked detail", idealPaddingSec: 3.4, zoom: [1.01, 1.04] },
  { id: "heartbeat_ops", label: "Heartbeat and ops", idealPaddingSec: 3.0, zoom: [1, 1.025] },
  { id: "connections_architecture", label: "Connections", idealPaddingSec: 3.1, zoom: [1, 1.02] },
  { id: "closing_payoff", label: "Closing payoff", idealPaddingSec: 3.8, zoom: [1.01, 1.05] },
];

export const demoSession = {
  storageKey: "sb-gidjnssofonyhhqzsxpy-auth-token",
  userId: "demo-user-00000000-0000-0000-0000-000000000000",
  email: "operator@airlock.dev",
  displayName: "Demo Operator",
};
