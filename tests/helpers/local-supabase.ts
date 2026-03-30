import { createClient } from "@supabase/supabase-js";

export interface TestCredentials {
  displayName: string;
  email: string;
  password: string;
}

export interface FunctionCallOptions {
  body?: unknown;
  headers?: Record<string, string>;
  method?: "GET" | "POST";
  searchParams?: Record<string, string>;
  token?: string;
}

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getLocalSupabaseConfig() {
  return {
    anonKey: getEnv("LOCAL_SUPABASE_ANON_KEY"),
    apiUrl: getEnv("LOCAL_SUPABASE_API_URL"),
    serviceRoleKey: getEnv("LOCAL_SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function createServiceRoleClient() {
  const { apiUrl, serviceRoleKey } = getLocalSupabaseConfig();
  return createClient(apiUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createAnonClient() {
  const { apiUrl, anonKey } = getLocalSupabaseConfig();
  return createClient(apiUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function ensureUser(credentials: TestCredentials) {
  const admin = createServiceRoleClient();
  const {
    data: { users },
    error: listError,
  } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (listError) {
    throw listError;
  }

  const existingUser = users.find((user) => user.email === credentials.email);

  if (existingUser) {
    await admin.auth.admin.updateUserById(existingUser.id, {
      email_confirm: true,
      password: credentials.password,
      user_metadata: {
        display_name: credentials.displayName,
      },
    });

    return existingUser.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: credentials.email,
    email_confirm: true,
    password: credentials.password,
    user_metadata: {
      display_name: credentials.displayName,
    },
  });

  if (error || !data.user) {
    throw error ?? new Error("Failed to create test user");
  }

  return data.user.id;
}

export async function signInAndGetToken(credentials: TestCredentials) {
  const client = createAnonClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error || !data.session?.access_token) {
    throw error ?? new Error("Unable to sign in test user");
  }

  return data.session.access_token;
}

export function buildFunctionHeaders(token?: string, headers?: Record<string, string>) {
  const { anonKey } = getLocalSupabaseConfig();

  return {
    "Content-Type": "application/json",
    apikey: anonKey,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };
}

export async function callFunction(name: string, options: FunctionCallOptions = {}) {
  const { apiUrl } = getLocalSupabaseConfig();
  const url = new URL(`${apiUrl}/functions/v1/${name}`);

  Object.entries(options.searchParams ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: buildFunctionHeaders(options.token, options.headers),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let json: unknown = null;

  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }

  return { json, response };
}

export async function resetDemoState(token: string) {
  const { response } = await callFunction("demo", {
    method: "POST",
    searchParams: { action: "reset" },
    token,
  });

  if (!response.ok) {
    throw new Error("Failed to reset demo state");
  }
}

export async function seedValidCrossing(token: string) {
  return callFunction("demo", {
    method: "POST",
    searchParams: { action: "seed-valid" },
    token,
  });
}

export async function seedBlockedCrossing(token: string) {
  return callFunction("demo", {
    method: "POST",
    searchParams: { action: "seed-blocked" },
    token,
  });
}

export async function findCrossingById(crossingId: string) {
  const client = createServiceRoleClient();
  const { data, error } = await client
    .from("crossings")
    .select("*")
    .eq("id", crossingId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function findCrossingEvents(crossingId: string) {
  const client = createServiceRoleClient();
  const { data, error } = await client
    .from("crossing_events")
    .select("*")
    .eq("crossing_id", crossingId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertHeartbeat(userId: string, lastSeenAt: string) {
  const client = createServiceRoleClient();
  const { error } = await client.from("companion_heartbeats").upsert(
    {
      auth0_user_sub: userId,
      companion_id: "companion-local-01",
      last_seen_at: lastSeenAt,
      origin_type: "local",
      sandboxed: true,
      version: "1.0.0",
    },
    { onConflict: "companion_id,auth0_user_sub" },
  );

  if (error) {
    throw error;
  }
}
