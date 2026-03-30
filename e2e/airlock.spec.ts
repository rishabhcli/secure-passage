import { expect, test, type Page } from "@playwright/test";
import {
  ensureUser,
  resetDemoState,
  seedBlockedCrossing,
  seedValidCrossing,
  signInAndGetToken,
} from "../tests/helpers/local-supabase";

const primaryUser = {
  email: process.env.E2E_TEST_EMAIL || "operator-e2e@example.com",
  password: process.env.E2E_TEST_PASSWORD || "OperatorPass123!",
  displayName: "Operator One",
};

let primaryToken = "";

async function login(page: Page) {
  await page.goto("/airlock");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email").fill(primaryUser.email);
  await page.getByLabel("Password").fill(primaryUser.password);
  await page.getByRole("button", { name: /enter airlock/i }).click();
  await expect(page).toHaveURL(/\/airlock$/);
}

test.beforeAll(async () => {
  await ensureUser(primaryUser);
  primaryToken = await signInAndGetToken(primaryUser);
});

test.beforeEach(async () => {
  await resetDemoState(primaryToken);
});

test("redirects unauthenticated users, logs in, and processes a valid crossing end-to-end", async ({
  page,
}) => {
  await login(page);

  await seedValidCrossing(primaryToken);

  const seededCrossing = page
    .getByRole("button", {
      name: /production database connection pool exhausted/i,
    })
    .first();
  await expect(seededCrossing).toBeVisible();
  await expect(
    page.getByText(/policy evaluation passed\. crossing ready for human review\./i),
  ).toBeVisible();

  await seededCrossing.click();
  await page.getByRole("button", { name: /approve & send/i }).click();

  await expect(page.getByText(/message sent/i)).toBeVisible();
  await expect(page.getByText("Receipts")).toBeVisible();
  await expect(page.getByText("Sent").first()).toBeVisible();
});

test("shows blocked crossings in the detail flow", async ({ page }) => {
  await login(page);

  await seedBlockedCrossing(primaryToken);

  const blockedReceipt = page
    .getByRole("button", {
      name: /update readme with new deployment steps/i,
    })
    .first();

  await expect(blockedReceipt).toBeVisible();
  await blockedReceipt.click();

  await expect(page).toHaveURL(/\/airlock\/crossings\//);
  await expect(page.getByText("Policy Blocked")).toBeVisible();
  await expect(
    page.getByText(/destination channel #random is not allowed/i),
  ).toBeVisible();
});

test("updates companion status from the demo page heartbeat flow", async ({ page }) => {
  await login(page);
  await page.goto("/demo");

  await page.getByRole("button", { name: /send heartbeat/i }).click();

  await expect(page.getByText(/heartbeat sent successfully/i)).toBeVisible();
  await expect(page.getByText("Online")).toBeVisible();
});
