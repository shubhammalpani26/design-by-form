import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { serif, sans, colors } from "../theme";

const WORDS = [
  { t: "Engineered.", at: 20 },
  { t: "Manufactured.", at: 55 },
  { t: "Delivered.", at: 95 },
  { t: "Yours.", at: 135 },
];

export const Scene4MakeReal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoom = interpolate(frame, [0, 210], [1.15, 1.32]);
  const pan = interpolate(frame, [0, 210], [0, -50]);
  const imgOpacity = interpolate(frame, [0, 20, 190, 210], [0, 1, 1, 0]);

  const labelOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const exit = interpolate(frame, [190, 210], [1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink, opacity: exit }}>
      <AbsoluteFill style={{ opacity: imgOpacity }}>
        <Img
          src={staticFile("images/room-console.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${zoom}) translateX(${pan}px)`,
          }}
        />
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(180deg, rgba(10,9,8,0.5) 0%, rgba(10,9,8,0.2) 40%, rgba(10,9,8,0.9) 100%)",
          }}
        />
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          top: 80,
          left: 100,
          fontFamily: sans,
          color: colors.gold,
          letterSpacing: 6,
          fontSize: 14,
          textTransform: "uppercase",
          opacity: labelOpacity,
        }}
      >
        03 — Materialize
      </div>

      <div
        style={{
          position: "absolute",
          left: 100,
          bottom: 220,
          fontFamily: serif,
          color: colors.cream,
          fontSize: 130,
          fontWeight: 300,
          letterSpacing: -2,
          lineHeight: 1,
          opacity: labelOpacity,
        }}
      >
        We make it<br/>
        <span style={{ fontStyle: "italic", color: colors.gold }}>real.</span>
      </div>

      <div
        style={{
          position: "absolute",
          right: 100,
          bottom: 140,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 12,
        }}
      >
        {WORDS.map((w, i) => {
          const s = spring({ frame: frame - w.at, fps, config: { damping: 200 }, durationInFrames: 25 });
          const tx = interpolate(s, [0, 1], [40, 0]);
          const op = interpolate(s, [0, 1], [0, 1]);
          return (
            <div
              key={i}
              style={{
                fontFamily: sans,
                fontSize: 28,
                color: colors.cream,
                fontWeight: 300,
                letterSpacing: 2,
                transform: `translateX(${tx}px)`,
                opacity: op,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <span style={{ color: colors.gold, fontSize: 14 }}>✓</span>
              {w.t}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};