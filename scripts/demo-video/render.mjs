import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { finalRoot, outputRoot, repoRoot } from "./content.mjs";
import { ffprobeDuration } from "./media-utils.mjs";

const timelinePath = join(outputRoot, "timeline.json");
const finalVideoPath = join(finalRoot, "airlock-demo-5min.mp4");
const summaryPath = join(finalRoot, "render-summary.json");

async function runStreaming(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: process.env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      const exitMessage =
        signal != null
          ? `${command} exited with signal ${signal}`
          : `${command} exited with code ${code}`;
      reject(new Error(exitMessage));
    });
  });
}

async function main() {
  await mkdir(finalRoot, { recursive: true });
  const timeline = JSON.parse(await readFile(timelinePath, "utf8"));
  const props = JSON.stringify({ timeline });

  await runStreaming(
    "npx",
    [
      "remotion",
      "render",
      "demo-video/index.ts",
      "DemoVideo",
      finalVideoPath,
      "--props",
      props,
      "--codec",
      "h264",
      "--crf",
      "18",
      "--audio-codec",
      "aac",
    ],
    { cwd: repoRoot },
  );

  const durationSec = await ffprobeDuration(finalVideoPath);
  const summary = {
    renderedAt: new Date().toISOString(),
    finalVideoPath,
    durationSec,
  };

  await writeFile(summaryPath, JSON.stringify(summary, null, 2));

  console.log(`Final video: ${finalVideoPath}`);
  console.log(`Runtime: ${durationSec.toFixed(2)}s`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
