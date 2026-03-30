import { copyFile, mkdir, rename } from "node:fs/promises";
import { join } from "node:path";
import { KokoroTTS } from "kokoro-js";
import {
  auditionRoot,
  auditionVoices,
  audioRoot,
  audioSegmentsRoot,
  narrationSegments,
  publicAudioRoot,
  repoRoot,
  selectedVoice,
} from "./content.mjs";
import { ensureOutputDirs, writeJson } from "./common.mjs";
import { ffprobeDuration, run } from "./media-utils.mjs";

const modelId = "onnx-community/Kokoro-82M-v1.0-ONNX";
const manifestPath = join(audioRoot, "manifest.json");

async function normalizeWav(sourcePath) {
  const tempPath = `${sourcePath}.normalized.wav`;
  await run("ffmpeg", [
    "-y",
    "-i",
    sourcePath,
    "-af",
    "loudnorm=I=-16:TP=-1.5:LRA=11",
    "-ar",
    "48000",
    tempPath,
  ]);
  await rename(tempPath, sourcePath);
}

async function generateToFile(tts, voice, text, filePath) {
  const audio = await tts.generate(text, { voice });
  await audio.save(filePath);
  await normalizeWav(filePath);
  return ffprobeDuration(filePath);
}

async function main() {
  await ensureOutputDirs();
  await mkdir(auditionRoot, { recursive: true });
  await mkdir(audioSegmentsRoot, { recursive: true });

  const tts = await KokoroTTS.from_pretrained(modelId, {
    dtype: "q8",
    device: "cpu",
  });

  const auditionText = [
    "AIRLOCK stops an agent action at the border, verifies the source, checks policy, and only then hands the decision to a human operator.",
    "That is the difference between a fast AI workflow and a governed AI workflow.",
  ].join(" ");

  for (const voice of auditionVoices) {
    const target = join(auditionRoot, `${voice}.wav`);
    await generateToFile(tts, voice, auditionText, target);
  }

  const segmentManifest = [];

  for (const [index, segment] of narrationSegments.entries()) {
    const fileName = `${String(index + 1).padStart(2, "0")}-${segment.id}.wav`;
    const outputPath = join(audioSegmentsRoot, fileName);
    const durationSec = await generateToFile(
      tts,
      selectedVoice,
      segment.text,
      outputPath,
    );
    const publicPath = join(publicAudioRoot, fileName);
    await copyFile(outputPath, publicPath);

    segmentManifest.push({
      ...segment,
      fileName,
      outputPath,
      publicPath,
      staticPath: `demo-video-assets/audio/${fileName}`,
      durationSec,
    });
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    modelId,
    voice: selectedVoice,
    repoRoot,
    segments: segmentManifest,
    totalDurationSec: segmentManifest.reduce(
      (total, segment) => total + segment.durationSec,
      0,
    ),
  };

  await writeJson(manifestPath, manifest);
  console.log(`Narration manifest written to ${manifestPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
