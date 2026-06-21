import { AbsoluteFill, Audio, Sequence, Series, staticFile, useCurrentFrame, interpolate } from "remotion";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Describe } from "./scenes/Scene2Describe";
import { Scene3Imagine } from "./scenes/Scene3Imagine";
import { Scene4MakeReal } from "./scenes/Scene4MakeReal";
import { Scene5Logo } from "./scenes/Scene5Logo";
import { colors } from "./theme";

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const y = interpolate(frame % 60, [0, 60], [0, -10]);
  return (
    <AbsoluteFill
      style={{
        opacity: 0.06,
        mixBlendMode: "overlay",
        pointerEvents: "none",
        transform: `translateY(${y}px)`,
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
        backgroundSize: "3px 3px",
      }}
    />
  );
};

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <Series>
        <Series.Sequence durationInFrames={120}>
          <Scene1Hook />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <Scene2Describe />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <Scene3Imagine />
        </Series.Sequence>
        <Series.Sequence durationInFrames={210}>
          <Scene4MakeReal />
        </Series.Sequence>
        <Series.Sequence durationInFrames={270}>
          <Scene5Logo />
        </Series.Sequence>
      </Series>
      {/* Voiceover */}
      <Sequence from={15}><Audio src={staticFile("audio/s1.mp3")} volume={0.95} /></Sequence>
      <Sequence from={135}><Audio src={staticFile("audio/s2.mp3")} volume={0.95} /></Sequence>
      <Sequence from={310}><Audio src={staticFile("audio/s3.mp3")} volume={0.95} /></Sequence>
      <Sequence from={490}><Audio src={staticFile("audio/s4.mp3")} volume={0.95} /></Sequence>
      <Sequence from={720}><Audio src={staticFile("audio/s5.mp3")} volume={0.95} /></Sequence>
      <Grain />
    </AbsoluteFill>
  );
};