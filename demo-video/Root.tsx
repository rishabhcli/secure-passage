import { Composition } from "remotion";
import { DemoVideo } from "./DemoVideo";

const fps = 30;

export interface TimelineShot {
  id: string;
  label: string;
  callout: string;
  narrationText: string;
  startSec: number;
  displayDurationSec: number;
  clipDurationSec: number;
  holdAfterSec: number;
  zoom: [number, number];
  video: string;
  still: string;
  audio: string;
  audioDurationSec: number;
}

export interface DemoVideoProps {
  timeline: {
    totalDurationSec: number;
    shots: TimelineShot[];
  };
}

export const Root = () => {
  return (
    <Composition<DemoVideoProps>
      id="DemoVideo"
      component={DemoVideo}
      width={1920}
      height={1080}
      fps={fps}
      durationInFrames={fps * 300}
      defaultProps={{ timeline: { totalDurationSec: 300, shots: [] } }}
      calculateMetadata={({ props }) => ({
        durationInFrames: Math.ceil(props.timeline.totalDurationSec * fps),
      })}
    />
  );
};
