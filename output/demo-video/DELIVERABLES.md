# AIRLOCK Demo Video Deliverables

## 1. Product understanding
- AIRLOCK is a control plane between a sandboxed local AI companion and external systems.
- Core workflow: a GitHub issue becomes a proposed Slack message, then AIRLOCK verifies source, applies policy, and routes the action through human review before send or block.
- The strongest proof points are the dashboard, review drawer, crossing detail page, demo controls, and connections page.
- Important constraint: the current demo runtime uses deterministic mocked provider behavior for GitHub verification and Slack delivery. The control flow, state transitions, and receipts shown in the demo are real application behavior.

## 2. Best demo strategy
- Lead with the border-control framing instead of a feature list.
- Primary journey: pending crossing -> review drawer -> detail page -> approve/send -> sent receipt.
- Secondary proof points: blocked policy path, companion heartbeat, and the read-side/write-side connection model.

## 3. 5-minute storyboard with timestamps
- `0:00-0:15` Hook: landing page to pending crossing and drawer.
- `0:15-0:40` Problem and product framing on the dashboard.
- `0:40-1:35` Review drawer and detail page walkthrough.
- `1:35-2:20` Approve and send path with deterministic provider mode called out.
- `2:20-3:00` Blocked path and policy explanation.
- `3:00-3:35` Demo controls and heartbeat.
- `3:35-4:10` Connections and architecture.
- `4:10-5:00` Dashboard payoff and close.

## 4. Shot-by-shot walkthrough
- `landing_hook`
- `dashboard_intro`
- `review_drawer`
- `detail_page`
- `demo_seed`
- `approve_send`
- `sent_detail`
- `blocked_detail`
- `heartbeat_ops`
- `connections_architecture`
- `closing_payoff`

## 5. Narration script
- Stored as the `text` fields in [`audio/manifest.json`](./audio/manifest.json), aligned to the shot timeline in [`timeline.json`](./timeline.json).
- Generated voice selected from Kokoro auditions: `af_heart`.

## 6. Tooling and capture plan
- Playwright for deterministic real-app footage capture.
- Kokoro for open-source narration.
- Remotion for composition and render.
- FFmpeg for transcoding, normalization, QC frame extraction, and final media inspection.

## 7. Editing plan
- Minimal, modern overlay treatment.
- Slow zooms for emphasis.
- Hold frames to fit narration rather than rushing UI.
- No background music added by default.

## 8. Risk log
- Local Supabase Docker startup was blocked by Docker Hub image pull limits during this run.
- Final capture therefore used the configured remote Supabase project plus a local browser session shim for protected UI access.
- Demo narration explicitly states that provider steps are deterministic and mocked in this environment.

## 9. Execution steps
- Capture scripts: [`../scripts/demo-video/capture.mjs`](../scripts/demo-video/capture.mjs)
- Narration generation: [`../scripts/demo-video/generate-narration.mjs`](../scripts/demo-video/generate-narration.mjs)
- Footage processing: [`../scripts/demo-video/process-footage.mjs`](../scripts/demo-video/process-footage.mjs)
- Timeline build: [`../scripts/demo-video/build-timeline.mjs`](../scripts/demo-video/build-timeline.mjs)
- Final render: [`../scripts/demo-video/render.mjs`](../scripts/demo-video/render.mjs)

## 10. Final rendered video output summary
- Final video: [`final/airlock-demo-5min.mp4`](./final/airlock-demo-5min.mp4)
- Runtime summary: [`final/render-summary.json`](./final/render-summary.json)
- Capture manifest: [`capture-manifest.json`](./capture-manifest.json)
- Narration manifest: [`audio/manifest.json`](./audio/manifest.json)
- Processed footage manifest: [`footage/processed/manifest.json`](./footage/processed/manifest.json)
- Subtitles: [`subtitles/airlock-demo.srt`](./subtitles/airlock-demo.srt)
- QC stills: [`qc/hook.png`](./qc/hook.png), [`qc/mid.png`](./qc/mid.png), [`qc/close.png`](./qc/close.png)
