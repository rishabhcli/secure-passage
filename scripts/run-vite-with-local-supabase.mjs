import {
  createLocalTestEnv,
  runCommand,
} from "./lib/local-supabase.mjs";

const child = runCommand(
  "npm",
  ["run", "dev", "--", "--host", "127.0.0.1", "--port", "8080"],
  { env: createLocalTestEnv() },
);

const shutdown = () => {
  if (child.exitCode === null) {
    child.kill("SIGTERM");
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
