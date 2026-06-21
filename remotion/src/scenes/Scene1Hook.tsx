import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { serif, sans, colors } from "../theme";

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 50 });
  const titleY = interpolate(enter, [0, 1], [40, 0]);
  const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });

  const lineWidth = interpolate(frame, [25, 75], [0, 320], { extrapolateRight: "clamp" });
  const subOpacity = interpolate(frame, [55, 80], [0, 1], { extrapolateRight: "clamp" });

  const exitOpacity = interpolate(frame, [100, 120], [1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.ink,
        opacity: exitOpacity,
      }}
    >
      {/* faint vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(201,169,97,0.08), transparent 60%)",
        }}
      />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontFamily: sans,
            color: colors.gold,
            letterSpacing: 8,
            fontSize: 18,
            textTransform: "uppercase",
            fontWeight: 400,
            opacity: subOpacity,
            marginBottom: 36,
          }}
        >
          Nyzora &nbsp;·&nbsp; Manufacturing Intelligence
        </div>
        <div
          style={{
            fontFamily: serif,
            color: colors.cream,
            fontSize: 220,
            fontWeight: 300,
            lineHeight: 1,
            letterSpacing: -4,
            transform: `translateY(${titleY}px)`,
            opacity: titleOpacity,
            fontStyle: "italic",
          }}
        >
          Design Anything.
        </div>
        <div
          style={{
            height: 1,
            width: lineWidth,
            backgroundColor: colors.gold,
            marginTop: 48,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};