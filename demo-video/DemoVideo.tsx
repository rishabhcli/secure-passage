import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { DemoVideoProps, TimelineShot } from "./Root";

const frameFor = (seconds: number, fps: number) => Math.round(seconds * fps);

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at top, rgba(42,159,112,0.18), transparent 40%), #0c1210",
        color: "#f3f4f6",
        fontFamily: '"Avenir Next", "Helvetica Neue", sans-serif',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Callout: React.FC<{ shot: TimelineShot }> = ({ shot }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        top: 48,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxWidth: 760,
      }}
    >
      <div
        style={{
          alignSelf: "flex-start",
          border: "1px solid rgba(162, 236, 204, 0.28)",
          background: "rgba(11, 25, 20, 0.72)",
          color: "#a2eccc",
          borderRadius: 999,
          padding: "10px 16px",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {shot.callout}
      </div>
      <div
        style={{
          alignSelf: "flex-start",
          background: "rgba(7, 11, 10, 0.74)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 22,
          padding: "16px 20px",
          fontSize: 34,
          fontWeight: 650,
          lineHeight: 1.12,
          letterSpacing: "-0.03em",
          maxWidth: 720,
        }}
      >
        {shot.label}
      </div>
    </div>
  );
};

const ShotSequence: React.FC<{ shot: TimelineShot }> = ({ shot }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const displayFrames = frameFor(shot.displayDurationSec, fps);
  const clipFrames = frameFor(shot.clipDurationSec, fps);
  const [zoomStart, zoomEnd] = shot.zoom;

  const scale = interpolate(frame, [0, displayFrames], [zoomStart, zoomEnd], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      <AbsoluteFill
        style={{
          backgroundColor: "#060908",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Img
          src={staticFile(shot.still)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>
      <Sequence from={0} durationInFrames={clipFrames}>
        <OffthreadVideo
          src={staticFile(shot.video)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </Sequence>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(4,8,7,0.38) 0%, rgba(4,8,7,0.02) 36%, rgba(4,8,7,0.26) 100%)",
        }}
      />
      <Callout shot={shot} />
    </AbsoluteFill>
  );
};

export const DemoVideo: React.FC<DemoVideoProps> = ({ timeline }) => {
  const { fps } = useVideoConfig();

  return (
    <Shell>
      {timeline.shots.map((shot) => (
        <Sequence
          key={shot.id}
          from={frameFor(shot.startSec, fps)}
          durationInFrames={frameFor(shot.displayDurationSec, fps)}
        >
          <ShotSequence shot={shot} />
        </Sequence>
      ))}
      {timeline.shots.map((shot) => (
        <Sequence
          key={`${shot.id}-audio`}
          from={frameFor(shot.startSec, fps)}
          durationInFrames={frameFor(shot.audioDurationSec, fps) + 1}
        >
          <Audio src={staticFile(shot.audio)} />
        </Sequence>
      ))}
    </Shell>
  );
};
