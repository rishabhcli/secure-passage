import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function run(command, args, options = {}) {
  const { stdout, stderr } = await execFileAsync(command, args, options);
  return { stdout, stderr };
}

export async function ffprobeDuration(filePath) {
  const { stdout } = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);

  return Number.parseFloat(stdout.trim());
}

export function formatSrtTime(seconds) {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(totalMs / 3_600_000)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor((totalMs % 60_000) / 1000)
    .toString()
    .padStart(2, "0");
  const millis = (totalMs % 1000).toString().padStart(3, "0");

  return `${hours}:${minutes}:${secs},${millis}`;
}
