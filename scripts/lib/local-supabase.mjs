import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

export const repoRoot = resolve(new URL("../..", import.meta.url).pathname);

const DEFAULT_TEST_ENV = {
  AIRLOCK_ALLOWED_SLACK_CHANNEL_ID: "C0123INCIDENTS",
  AIRLOCK_ALLOWED_SLACK_CHANNEL_LABEL: "#incidents",
  AIRLOCK_COMPANION_SECRET: "demo-companion-secret",
  E2E_TEST_EMAIL: "operator-e2e@example.com",
  E2E_TEST_PASSWORD: "OperatorPass123!",
  SECONDARY_TEST_EMAIL: "operator-secondary@example.com",
  SECONDARY_TEST_PASSWORD: "OperatorPass123!",
};

function commandError(command, args, result) {
  return new Error(
    [
      `Command failed: ${command} ${args.join(" ")}`,
      result.stdout?.trim(),
      result.stderr?.trim(),
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

export function runCommandSync(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    ...options,
  });

  if (result.status !== 0) {
    throw commandError(command, args, result);
  }

  return result.stdout?.trim() ?? "";
}

export function runCommand(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: repoRoot,
    env: { ...process.env, ...options.env },
    stdio: options.stdio ?? "inherit",
  });

  return child;
}

function parseStatusEnv(output) {
  return output
    .split("\n")
    .filter(Boolean)
    .reduce((env, line) => {
      const separator = line.indexOf("=");
      if (separator === -1) {
        return env;
      }

      const key = line.slice(0, separator);
      const value = line.slice(separator + 1);
      env[key] = value;
      return env;
    }, {});
}

export function getLocalSupabaseStatusEnv() {
  const output = runCommandSync("supabase", ["status", "-o", "env"], {
    stdio: "pipe",
  });

  return parseStatusEnv(output);
}

export function ensureLocalSupabaseStarted() {
  try {
    return getLocalSupabaseStatusEnv();
  } catch {
    runCommandSync("supabase", ["start"], { stdio: "inherit" });
    return getLocalSupabaseStatusEnv();
  }
}

export function resetLocalDatabase() {
  runCommandSync("supabase", ["db", "reset", "--local", "--no-seed"], {
    stdio: "inherit",
  });
}

export function createLocalTestEnv() {
  const statusEnv = getLocalSupabaseStatusEnv();

  return {
    ...DEFAULT_TEST_ENV,
    LOCAL_SUPABASE_API_URL: statusEnv.API_URL,
    LOCAL_SUPABASE_ANON_KEY: statusEnv.ANON_KEY,
    LOCAL_SUPABASE_DB_URL: statusEnv.DB_URL,
    LOCAL_SUPABASE_SERVICE_ROLE_KEY: statusEnv.SERVICE_ROLE_KEY,
    LOCAL_SUPABASE_STUDIO_URL: statusEnv.STUDIO_URL,
    LOCAL_SUPABASE_INBUCKET_URL: statusEnv.INBUCKET_URL,
    SUPABASE_URL: statusEnv.API_URL,
    SUPABASE_ANON_KEY: statusEnv.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: statusEnv.SERVICE_ROLE_KEY,
    VITE_SUPABASE_URL: statusEnv.API_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: statusEnv.ANON_KEY,
  };
}

export function startFunctionsServer(env) {
  const tempDir = mkdtempSync(join(tmpdir(), "secure-passage-functions-"));
  const envFilePath = join(tempDir, "functions.env");

  writeFileSync(
    envFilePath,
    [
      `AIRLOCK_ALLOWED_SLACK_CHANNEL_ID=${env.AIRLOCK_ALLOWED_SLACK_CHANNEL_ID}`,
      `AIRLOCK_ALLOWED_SLACK_CHANNEL_LABEL=${env.AIRLOCK_ALLOWED_SLACK_CHANNEL_LABEL}`,
      `AIRLOCK_COMPANION_SECRET=${env.AIRLOCK_COMPANION_SECRET}`,
      `SUPABASE_URL=${env.LOCAL_SUPABASE_API_URL}`,
      `SUPABASE_SERVICE_ROLE_KEY=${env.LOCAL_SUPABASE_SERVICE_ROLE_KEY}`,
    ].join("\n"),
  );

  const child = runCommand(
    "supabase",
    ["functions", "serve", "--no-verify-jwt", "--env-file", envFilePath],
    { env },
  );

  child.once("exit", () => {
    rmSync(tempDir, { force: true, recursive: true });
  });

  return child;
}

export async function waitForHttp(url, timeoutMs = 60_000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.status < 500) {
        return;
      }
    } catch {
      // Retry until the timeout is reached.
    }

    await new Promise((resolvePromise) => setTimeout(resolvePromise, 1_000));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

export async function stopProcess(child) {
  if (!child || child.exitCode !== null) {
    return;
  }

  child.kill("SIGTERM");

  const forceKillTimeout = setTimeout(() => {
    if (child.exitCode === null) {
      child.kill("SIGKILL");
    }
  }, 5_000);

  try {
    await once(child, "exit");
  } finally {
    clearTimeout(forceKillTimeout);
  }
}
