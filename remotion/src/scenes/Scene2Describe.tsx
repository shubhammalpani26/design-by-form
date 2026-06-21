import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { serif, sans, colors } from "../theme";

const PROMPT = "A sculptural lounge chair, walnut and bouclé, for my reading nook…";

export const Scene2Describe: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const chars = Math.floor(interpolate(frame, [10, 95], [0, PROMPT.length], { extrapolateRight: "clamp" }));
  const text = PROMPT.slice(0, chars);
  const caret = frame % 20 < 10 ? "▎" : " ";

  const imgSpring = spring({ frame: frame - 70, fps, config: { damping: 200 }, durationInFrames: 60 });
  const imgClip = interpolate(imgSpring, [0, 1], [100, 0]);
  const imgScale = interpolate(frame, [70, 150], [1.15, 1.0]);

  const labelOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const exit = interpolate(frame, [130, 150], [1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink, opacity: exit }}>
      <AbsoluteFill style={{ flexDirection: "row" }}>
        {/* Left: prompt */}
        <div style={{ flex: 1, padding: "120px 100px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div
            style={{
              fontFamily: sans,
              color: colors.gold,
              letterSpacing: 6,
              fontSize: 14,
              textTransform: "uppercase",
              opacity: labelOpacity,
              marginBottom: 32,
            }}
          >
            01 — Describe
          </div>
          <div
            style={{
              fontFamily: serif,
              color: colors.cream,
              fontSize: 96,
              fontWeight: 300,
              lineHeight: 1.05,
              letterSpacing: -1,
              opacity: labelOpacity,
              marginBottom: 56,
            }}
          >
            Describe<br/>your space.
          </div>
          <div
            style={{
              fontFamily: sans,
              color: colors.cream,
              fontSize: 26,
              fontWeight: 300,
              lineHeight: 1.5,
              borderLeft: `2px solid ${colors.gold}`,
              paddingLeft: 24,
              minHeight: 120,
              opacity: labelOpacity,
            }}
          >
            <span style={{ opacity: 0.55, fontSize: 14, letterSpacing: 3, textTransform: "uppercase", display: "block", marginBottom: 12 }}>You</span>
            {text}<span style={{ color: colors.gold }}>{caret}</span>
          </div>
        </div>
        {/* Right: image reveal */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: `inset(0 0 0 ${imgClip}%)`,
            }}
          >
            <Img
              src={staticFile("images/room.jpg")}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${imgScale})`,
              }}
            />
            <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(10,9,8,0.6), transparent 30%)" }} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};