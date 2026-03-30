import { copyFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  outputRoot,
  processedFootageRoot,
  publicFootageRoot,
} from "./content.mjs";
import { ensureOutputDirs, writeJson } from "./common.mjs";
import { ffprobeDuration, run } from "./media-utils.mjs";

const captureManifestPath = join(outputRoot, "capture-manifest.json");
const processedManifestPath = join(processedFootageRoot, "manifest.json");

async function main() {
  await ensureOutputDirs();
  await mkdir(processedFootageRoot, { recursive: true });

  const captureManifest = JSON.parse(await readFile(captureManifestPath, "utf8"));
  const processedShots = [];

  for (const shot of captureManifest.shots) {
    const outputPath = join(processedFootageRoot, `${shot.id}.mp4`);
    await run("ffmpeg", [
      "-y",
      "-i",
      shot.videoPath,
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      outputPath,
    ]);

    const publicPath = join(publicFootageRoot, `${shot.id}.mp4`);
    await copyFile(outputPath, publicPath);
    const durationSec = await ffprobeDuration(outputPath);

    processedShots.push({
      ...shot,
      outputPath,
      publicPath,
      staticPath: `demo-video-assets/footage/${shot.id}.mp4`,
      durationSec,
    });
  }

  await writeJson(processedManifestPath, {
    processedAt: new Date().toISOString(),
    shots: processedShots,
  });

  console.log(`Processed footage manifest written to ${processedManifestPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
