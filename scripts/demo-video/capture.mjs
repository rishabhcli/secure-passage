import { access } from "node:fs/promises";
import { join } from "node:path";
import {
  baseUrl,
  outputRoot,
  rawFootageRoot,
  repoRoot,
  shotPlan,
  stillsRoot,
} from "./content.mjs";
import {
  createRecordedContext,
  ensureOutputDirs,
  finalizeVideo,
  getFunction,
  gotoProtected,
  installDemoSession,
  launchBrowser,
  loadEnv,
  postFunction,
  resetDemo,
  saveStill,
  seedBlocked,
  seedValid,
  wait,
  writeJson,
} from "./common.mjs";

const manifestPath = join(outputRoot, "capture-manifest.json");

async function getLatestCrossingId(env) {
  const items = await getFunction(env, "crossings");
  if (!items[0]?.id) {
    throw new Error("No crossings returned for demo user");
  }
  return items[0].id;
}

async function getCrossingDetail(env, id) {
  const detail = await getFunction(env, "crossings", { action: "detail", id });
  return detail.crossing;
}

async function recordShot(browser, shotId, performer) {
  const existingVideoPath = join(rawFootageRoot, `${shotId}.webm`);
  const existingStillPath = join(stillsRoot, `${shotId}.png`);

  try {
    await access(existingVideoPath);
    await access(existingStillPath);
    return {
      id: shotId,
      videoPath: existingVideoPath,
      stillPath: existingStillPath,
      description: "Reused existing capture",
    };
  } catch {
    // Capture the shot.
  }

  const { context, page, shotDir } = await createRecordedContext(browser, shotId);
  await installDemoSession(page);
  const result = await performer(page);
  const stillPath = await saveStill(page, shotId);
  const videoPath = await finalizeVideo(context, page, shotDir, shotId);

  return {
    id: shotId,
    videoPath,
    stillPath,
    ...result,
  };
}

async function captureLanding() {
  return recordShot(browser, "landing_hook", async (page) => {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await wait(2500);
    await page.getByRole("button", { name: /enter airlock/i }).hover();
    await wait(4500);
    return { description: "Landing hero with CTA hover" };
  });
}

async function captureDashboardIntro(env) {
  await resetDemo(env);
  await seedValid(env);

  return recordShot(browser, "dashboard_intro", async (page) => {
    await gotoProtected(page, "/airlock");
    await wait(2500);
    await page.locator("text=GitHub").first().hover();
    await wait(2000);
    await page.getByRole("button", {
      name: /production database connection pool exhausted/i,
    }).hover();
    await wait(4500);
    await page.getByRole("heading", { name: /receipts/i }).hover();
    await wait(2500);
    await page.getByRole("heading", { name: /pending crossings/i }).hover();
    await wait(4500);
    return { description: "Dashboard with one pending crossing" };
  });
}

async function captureReviewDrawer(env) {
  await resetDemo(env);
  await seedValid(env);

  return recordShot(browser, "review_drawer", async (page) => {
    await gotoProtected(page, "/airlock");
    await wait(2000);
    await page.getByRole("button", {
      name: /production database connection pool exhausted/i,
    }).click();
    await page.getByRole("button", { name: /approve & send/i }).waitFor();
    await wait(5000);
    await page.locator("text=Source").hover();
    await wait(3500);
    await page.locator("text=Outbound").hover();
    await wait(4500);
    await page.locator("text=Rationale").hover();
    await wait(4500);
    return { description: "Review drawer slide-in and pause" };
  });
}

async function captureDetailPage(env) {
  await resetDemo(env);
  const seeded = await seedValid(env);

  return recordShot(browser, "detail_page", async (page) => {
    await gotoProtected(page, `/airlock/crossings/${seeded.crossingId}`);
    await wait(3500);
    await page.mouse.wheel(0, 350);
    await wait(5000);
    await page.mouse.wheel(0, 300);
    await wait(5000);
    await page.mouse.wheel(0, -250);
    await wait(5000);
    await page.mouse.wheel(0, 450);
    await wait(5000);
    await page.mouse.wheel(0, -600);
    await wait(4500);
    return { description: "Detail page with slow scrolls" };
  });
}

async function captureDemoSeed(env) {
  await resetDemo(env);

  return recordShot(browser, "demo_seed", async (page) => {
    await gotoProtected(page, "/demo");
    await wait(1800);
    await page.getByRole("button", { name: /seed valid crossing/i }).click();
    await page.getByText(/seeded valid crossing/i).waitFor();
    await wait(2500);
    await page.getByRole("button", { name: /reset demo state/i }).click();
    await page.getByText(/demo state reset successfully/i).waitFor();
    await wait(2500);
    await page.getByRole("button", { name: /seed valid crossing/i }).click();
    await page.getByText(/seeded valid crossing/i).waitFor();
    await wait(2500);
    await page.goto(`${baseUrl}/airlock`, { waitUntil: "networkidle" });
    await wait(6000);
    return { description: "Demo controls resetting and reseeding" };
  });
}

async function captureApproveSend(env) {
  await resetDemo(env);
  await seedValid(env);

  return recordShot(browser, "approve_send", async (page) => {
    await gotoProtected(page, "/airlock");
    await wait(2000);
    await page.getByRole("button", {
      name: /production database connection pool exhausted/i,
    }).click();
    await page.getByRole("button", { name: /approve & send/i }).waitFor();
    await wait(2000);
    await page.getByRole("button", { name: /approve & send/i }).click();
    await page.getByText("Message sent", { exact: true }).waitFor();
    await wait(8000);
    return { description: "Approve crossing and show receipt state" };
  });
}

async function captureSentDetail(env) {
  await resetDemo(env);
  const seeded = await seedValid(env);
  const detail = await getCrossingDetail(env, seeded.crossingId);
  await postFunction(
    env,
    "crossings",
    { action: "approve-send", id: seeded.crossingId },
    { approvedPayloadHash: detail.proposed_payload_hash },
  );

  return recordShot(browser, "sent_detail", async (page) => {
    await gotoProtected(page, `/airlock/crossings/${seeded.crossingId}`);
    await wait(4500);
    await page.mouse.wheel(0, 320);
    await wait(4500);
    await page.mouse.wheel(0, -220);
    await wait(5500);
    return { description: "Sent detail receipt page" };
  });
}

async function captureBlockedDetail(env) {
  await resetDemo(env);
  const seeded = await seedBlocked(env);

  return recordShot(browser, "blocked_detail", async (page) => {
    await gotoProtected(page, "/airlock");
    await wait(2200);
    await page.getByRole("button", {
      name: /update readme with new deployment steps/i,
    }).click();
    await page.goto(`${baseUrl}/airlock/crossings/${seeded.crossingId}`, {
      waitUntil: "networkidle",
    });
    await wait(5000);
    await page.mouse.wheel(0, 250);
    await wait(5000);
    await page.mouse.wheel(0, -250);
    await wait(7000);
    return { description: "Blocked detail page with policy reason" };
  });
}

async function captureHeartbeatOps(env) {
  await resetDemo(env);

  return recordShot(browser, "heartbeat_ops", async (page) => {
    await gotoProtected(page, "/demo");
    await wait(1800);
    await page.getByRole("button", { name: /send heartbeat/i }).click();
    await page.getByText(/heartbeat sent successfully/i).waitFor();
    await wait(3000);
    await page.reload({ waitUntil: "networkidle" });
    await wait(7000);
    return { description: "Demo heartbeat and refreshed online state" };
  });
}

async function captureConnections() {
  return recordShot(browser, "connections_architecture", async (page) => {
    await gotoProtected(page, "/connect");
    await wait(3000);
    await page.locator("text=GitHub").first().hover();
    await wait(4500);
    await page.locator("text=Slack").first().hover();
    await wait(7000);
    return { description: "Connections overview" };
  });
}

async function captureClosing(env) {
  await resetDemo(env);
  await seedBlocked(env);
  const seeded = await seedValid(env);
  const detail = await getCrossingDetail(env, seeded.crossingId);
  await postFunction(
    env,
    "crossings",
    { action: "approve-send", id: seeded.crossingId },
    { approvedPayloadHash: detail.proposed_payload_hash },
  );

  return recordShot(browser, "closing_payoff", async (page) => {
    await gotoProtected(page, "/airlock");
    await wait(3500);
    await page.locator("text=Receipts").hover();
    await wait(3000);
    await page.getByRole("button", {
      name: /production database connection pool exhausted/i,
    }).hover();
    await wait(4500);
    await page.getByRole("button", {
      name: /update readme with new deployment steps/i,
    }).hover();
    await wait(6500);
    return { description: "Closing dashboard with sent and blocked receipts" };
  });
}

let browser;

async function main() {
  await ensureOutputDirs();
  const env = await loadEnv(repoRoot);

  browser = await launchBrowser();

  const captures = [];
  captures.push(await captureLanding());
  captures.push(await captureDashboardIntro(env));
  captures.push(await captureReviewDrawer(env));
  captures.push(await captureDetailPage(env));
  captures.push(await captureDemoSeed(env));
  captures.push(await captureApproveSend(env));
  captures.push(await captureSentDetail(env));
  captures.push(await captureBlockedDetail(env));
  captures.push(await captureHeartbeatOps(env));
  captures.push(await captureConnections());
  captures.push(await captureClosing(env));

  const manifest = {
    baseUrl,
    capturedAt: new Date().toISOString(),
    shots: shotPlan.map((shot) => ({
      ...shot,
      ...captures.find((capture) => capture.id === shot.id),
    })),
  };

  await writeJson(manifestPath, manifest);
  console.log(`Capture manifest written to ${manifestPath}`);
  console.log(`Raw footage stored in ${rawFootageRoot}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close().catch(() => {});
  });
