import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { outputRoot, subtitlesRoot } from "./content.mjs";
import { ensureOutputDirs, writeJson } from "./common.mjs";
import { formatSrtTime } from "./media-utils.mjs";

const audioManifestPath = join(outputRoot, "audio", "manifest.json");
const footageManifestPath = join(outputRoot, "footage", "processed", "manifest.json");
const timelinePath = join(outputRoot, "timeline.json");
const subtitlesPath = join(subtitlesRoot, "airlock-demo.srt");

function wrapSubtitle(text, width = 52) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= width) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  if (lines.length <= 2) {
    return lines.join("\n");
  }

  const midpoint = Math.ceil(lines.length / 2);
  return [lines.slice(0, midpoint).join(" "), lines.slice(midpoint).join(" ")].join(
    "\n",
  );
}

async function main() {
  await ensureOutputDirs();
  const audioManifest = JSON.parse(await readFile(audioManifestPath, "utf8"));
  const footageManifest = JSON.parse(await readFile(footageManifestPath, "utf8"));
  const transitionBufferSec = 0.3;

  const shots = [];
  let cursorSec = 0;

  for (const audioSegment of audioManifest.segments) {
    const shot = footageManifest.shots.find((entry) => entry.id === audioSegment.shotId);
    if (!shot) {
      throw new Error(`Missing processed footage for shot ${audioSegment.shotId}`);
    }

    const displayDurationSec =
      audioSegment.durationSec + shot.idealPaddingSec + transitionBufferSec;
    const clipDurationSec = Math.min(displayDurationSec, shot.durationSec);
    const holdAfterSec = Math.max(0, displayDurationSec - shot.durationSec);

    shots.push({
      id: shot.id,
      label: shot.label,
      callout: audioSegment.callout,
      narrationText: audioSegment.text,
      startSec: cursorSec,
      displayDurationSec,
      clipDurationSec,
      holdAfterSec,
      zoom: shot.zoom,
      video: shot.staticPath,
      still: `demo-video-assets/stills/${shot.id}.png`,
      audio: audioSegment.staticPath,
      audioDurationSec: audioSegment.durationSec,
    });

    cursorSec += displayDurationSec;
  }

  const timeline = {
    generatedAt: new Date().toISOString(),
    totalDurationSec: cursorSec,
    shots,
  };

  await writeJson(timelinePath, timeline);

  const subtitles = shots
    .map((shot, index) => {
      const start = shot.startSec + 0.1;
      const end = shot.startSec + shot.audioDurationSec;
      return `${index + 1}\n${formatSrtTime(start)} --> ${formatSrtTime(
        end,
      )}\n${wrapSubtitle(shot.narrationText)}\n`;
    })
    .join("\n");

  await writeFile(subtitlesPath, subtitles);

  console.log(`Timeline written to ${timelinePath}`);
  console.log(`Subtitles written to ${subtitlesPath}`);
  console.log(`Total duration: ${cursorSec.toFixed(2)}s`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
