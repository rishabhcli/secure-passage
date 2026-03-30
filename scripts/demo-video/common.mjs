import { copyFile, mkdir, rename, rm, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { chromium } from "playwright";
import {
  baseUrl,
  demoSession,
  outputRoot,
  publicAudioRoot,
  publicFootageRoot,
  publicStillsRoot,
  rawFootageRoot,
  stillsRoot,
  subtitlesRoot,
  viewport,
} from "./content.mjs";

function parseEnv(text) {
  return Object.fromEntries(
    text
      .trim()
      .split(/\n+/)
      .map((line) => {
        const separator = line.indexOf("=");
        const key = line.slice(0, separator);
        const value = line.slice(separator + 1).replace(/^"|"$/g, "");
        return [key, value];
      }),
  );
}

export async function loadEnv(repoRoot) {
  const envText = await import("node:fs/promises").then((fs) =>
    fs.readFile(join(repoRoot, ".env"), "utf8"),
  );
  return parseEnv(envText);
}

export async function ensureOutputDirs() {
  await Promise.all(
    [
      outputRoot,
      rawFootageRoot,
      stillsRoot,
      subtitlesRoot,
      publicAudioRoot,
      publicFootageRoot,
      publicStillsRoot,
    ].map((dir) =>
      mkdir(dir, { recursive: true }),
    ),
  );
}

export async function ensureParentDir(filePath) {
  await mkdir(dirname(filePath), { recursive: true });
}

export async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function postFunction(env, name, params = {}, body) {
  const url = new URL(`${env.VITE_SUPABASE_URL}/functions/v1/${name}`);
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, String(value)),
  );

  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(`${name} failed: ${response.status} ${JSON.stringify(json)}`);
  }

  return json;
}

export async function getFunction(env, name, params = {}) {
  const url = new URL(`${env.VITE_SUPABASE_URL}/functions/v1/${name}`);
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, String(value)),
  );

  const response = await fetch(url, {
    headers: {
      apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
    },
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(`${name} failed: ${response.status} ${JSON.stringify(json)}`);
  }

  return json;
}

export async function resetDemo(env) {
  await postFunction(env, "demo", { action: "reset" });
}

export async function seedValid(env) {
  return postFunction(env, "demo", { action: "seed-valid" });
}

export async function seedBlocked(env) {
  return postFunction(env, "demo", { action: "seed-blocked" });
}

export async function installDemoSession(page) {
  const fakeJwt = (() => {
    const encode = (value) =>
      Buffer.from(JSON.stringify(value)).toString("base64url");

    return `${encode({
      alg: "HS256",
      typ: "JWT",
    })}.${encode({
      sub: demoSession.userId,
      email: demoSession.email,
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: "authenticated",
    })}.sig`;
  })();

  const fakeSession = {
    access_token: fakeJwt,
    refresh_token: "demo-refresh-token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: {
      id: demoSession.userId,
      aud: "authenticated",
      role: "authenticated",
      email: demoSession.email,
      user_metadata: { display_name: demoSession.displayName },
      app_metadata: {},
      identities: [],
      created_at: new Date().toISOString(),
    },
  };

  await page.addInitScript(
    ([storageKey, session]) => {
      window.localStorage.setItem(storageKey, JSON.stringify(session));
      window.localStorage.setItem(
        `${storageKey}-user`,
        JSON.stringify(session.user),
      );
    },
    [demoSession.storageKey, fakeSession],
  );
}

export async function launchBrowser() {
  return chromium.launch({ headless: true });
}

export async function createRecordedContext(browser, shotId) {
  const shotDir = join(rawFootageRoot, `${shotId}-tmp`);
  await rm(shotDir, { recursive: true, force: true });
  await mkdir(shotDir, { recursive: true });

  const context = await browser.newContext({
    viewport,
    recordVideo: {
      dir: shotDir,
      size: viewport,
    },
    colorScheme: "light",
  });

  const page = await context.newPage();
  return { context, page, shotDir };
}

export async function finalizeVideo(context, page, shotDir, shotId) {
  const video = page.video();
  await context.close();

  const files = await readdir(shotDir);
  const source = join(shotDir, files[0]);
  const target = join(rawFootageRoot, `${shotId}.webm`);

  await rename(source, target);
  await rm(shotDir, { recursive: true, force: true });

  return target;
}

export async function saveStill(page, shotId) {
  const target = join(stillsRoot, `${shotId}.png`);
  const publicTarget = join(publicStillsRoot, `${shotId}.png`);
  await ensureParentDir(target);
  await page.screenshot({ path: target, fullPage: false });
  await copyFile(target, publicTarget);
  return target;
}

export async function writeJson(filePath, value) {
  await ensureParentDir(filePath);
  await writeFile(filePath, JSON.stringify(value, null, 2));
}

export async function gotoProtected(page, pathName) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.goto(`${baseUrl}${pathName}`, { waitUntil: "networkidle" });
}
