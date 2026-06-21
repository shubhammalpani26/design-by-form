import { AbsoluteFill, Series, useCurrentFrame, interpolate } from "remotion";
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
        <Series.Sequence durationInFrames={150}>
          <Scene2Describe />
        </Series.Sequence>
        <Series.Sequence durationInFrames={170}>
          <Scene3Imagine />
        </Series.Sequence>
        <Series.Sequence durationInFrames={180}>
          <Scene4MakeReal />
        </Series.Sequence>
        <Series.Sequence durationInFrames={220}>
          <Scene5Logo />
        </Series.Sequence>
      </Series>
      <Grain />
    </AbsoluteFill>
  );
};