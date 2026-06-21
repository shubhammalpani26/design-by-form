import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { serif, sans, colors } from "../theme";

const TILES = [
  { src: "images/chair-hero.jpg", label: "Lounge 01" },
  { src: "images/console.jpg", label: "Console 02" },
  { src: "images/sofa.jpg", label: "Sofa 03" },
  { src: "images/vase.jpg", label: "Vessel 04" },
  { src: "images/table.jpg", label: "Table 05" },
  { src: "images/bench.jpg", label: "Bench 06" },
];

export const Scene3Imagine: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelOpacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const exit = interpolate(frame, [160, 180], [1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink, opacity: exit }}>
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 100,
          right: 100,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          opacity: labelOpacity,
        }}
      >
        <div>
          <div style={{ fontFamily: sans, color: colors.gold, letterSpacing: 6, fontSize: 14, textTransform: "uppercase", marginBottom: 16 }}>
            02 — Imagine
          </div>
          <div style={{ fontFamily: serif, color: colors.cream, fontSize: 84, fontWeight: 300, letterSpacing: -1, lineHeight: 1 }}>
            AI renders, <span style={{ fontStyle: "italic", color: colors.gold }}>instantly.</span>
          </div>
        </div>
        <div style={{ fontFamily: sans, color: colors.mute, fontSize: 14, letterSpacing: 4, textTransform: "uppercase", textAlign: "right" }}>
          Generated · Just now<br/>
          <span style={{ color: colors.cream }}>6 variations</span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 320,
          left: 100,
          right: 100,
          bottom: 80,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(2, 1fr)",
          gap: 18,
        }}
      >
        {TILES.map((tile, i) => {
          const delay = 30 + i * 8;
          const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 120 }, durationInFrames: 40 });
          const ty = interpolate(s, [0, 1], [60, 0]);
          const op = interpolate(s, [0, 1], [0, 1]);
          const scanY = interpolate(frame, [delay, delay + 20], [0, 100], { extrapolateRight: "clamp" });
          const scanOp = interpolate(frame, [delay, delay + 15, delay + 25], [0, 0.8, 0], { extrapolateRight: "clamp" });
          return (
            <div
              key={i}
              style={{
                position: "relative",
                overflow: "hidden",
                transform: `translateY(${ty}px)`,
                opacity: op,
                border: `1px solid ${colors.charcoal}`,
              }}
            >
              <Img src={staticFile(tile.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {/* scan line */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: `${scanY}%`,
                  height: 2,
                  background: colors.gold,
                  opacity: scanOp,
                  boxShadow: `0 0 24px ${colors.gold}`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "16px 18px",
                  background: "linear-gradient(transparent, rgba(10,9,8,0.85))",
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: sans,
                  fontSize: 12,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: colors.cream,
                }}
              >
                <span>{tile.label}</span>
                <span style={{ color: colors.gold }}>● AI</span>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};