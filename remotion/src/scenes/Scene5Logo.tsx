import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { serif, sans, colors } from "../theme";

export const Scene5Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Letters of NYZORA enter staggered
  const letters = "NYZORA".split("");
  const taglineOp = interpolate(frame, [80, 110], [0, 1], { extrapolateRight: "clamp" });
  const lineW = interpolate(frame, [70, 130], [0, 600], { extrapolateRight: "clamp" });
  const urlOp = interpolate(frame, [120, 150], [0, 1], { extrapolateRight: "clamp" });

  // ambient gold glow drift
  const glowX = interpolate(frame, [0, 220], [-100, 100]);
  const glowOp = interpolate(frame, [0, 40, 180, 220], [0, 0.7, 0.7, 0.3]);

  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${50 + glowX / 5}% 50%, rgba(201,169,97,0.18), transparent 55%)`,
          opacity: glowOp,
        }}
      />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", overflow: "hidden", padding: "20px 0" }}>
          {letters.map((c, i) => {
            const s = spring({ frame: frame - i * 5, fps, config: { damping: 200 }, durationInFrames: 50 });
            const y = interpolate(s, [0, 1], [180, 0]);
            const op = interpolate(s, [0, 1], [0, 1]);
            return (
              <span
                key={i}
                style={{
                  fontFamily: serif,
                  color: colors.cream,
                  fontSize: 280,
                  fontWeight: 400,
                  lineHeight: 1,
                  letterSpacing: 12,
                  transform: `translateY(${y}px)`,
                  opacity: op,
                  display: "inline-block",
                }}
              >
                {c}
              </span>
            );
          })}
        </div>

        <div
          style={{
            width: lineW,
            height: 1,
            background: colors.gold,
            marginTop: 24,
            marginBottom: 36,
          }}
        />

        <div
          style={{
            fontFamily: serif,
            fontStyle: "italic",
            color: colors.cream,
            fontSize: 56,
            fontWeight: 300,
            letterSpacing: 1,
            opacity: taglineOp,
            textAlign: "center",
          }}
        >
          Design Anything. <span style={{ color: colors.gold }}>We Make It Real.</span>
        </div>

        <div
          style={{
            marginTop: 64,
            fontFamily: sans,
            fontSize: 18,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: colors.mute,
            opacity: urlOp,
          }}
        >
          nyzora.ai
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};