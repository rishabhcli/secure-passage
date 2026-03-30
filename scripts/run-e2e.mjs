import {
  createLocalTestEnv,
  ensureLocalSupabaseStarted,
  resetLocalDatabase,
  runCommandSync,
  startFunctionsServer,
  stopProcess,
  waitForHttp,
} from "./lib/local-supabase.mjs";

ensureLocalSupabaseStarted();
resetLocalDatabase();

const env = createLocalTestEnv();
const functionsServer = startFunctionsServer(env);

try {
  await waitForHttp(`${env.LOCAL_SUPABASE_API_URL}/functions/v1/status`);
  runCommandSync("npx", ["playwright", "test"], {
    env: { ...process.env, ...env },
    stdio: "inherit",
  });
} finally {
  await stopProcess(functionsServer);
}
