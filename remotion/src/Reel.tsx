import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: display } = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: body } = loadInter("normal", { weights: ["600"], subsets: ["latin"] });

const CREAM = "#F5F0E8";
const CHARCOAL = "#1C1B1A";
const CLAY = "#C4703F";

const Caption: React.FC<{ words: string[]; start: number; y: number; size?: number }> = ({
  words,
  start,
  y,
  size = 92,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        gap: 22,
        flexWrap: "wrap",
        padding: "0 60px",
      }}
    >
      {words.map((w, i) => {
        const s = spring({ frame: frame - start - i * 5, fps, config: { damping: 14, stiffness: 220 } });
        const scale = interpolate(s, [0, 1], [1.8, 1]);
        return (
          <div
            key={i}
            style={{
              fontFamily: display,
              fontSize: size,
              color: CREAM,
              backgroundColor: CHARCOAL,
              padding: "8px 26px",
              letterSpacing: 1,
              textTransform: "uppercase",
              opacity: s,
              transform: `scale(${scale})`,
              boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
            }}
          >
            {w}
          </div>
        );
      })}
    </div>
  );
};

const ClipScene: React.FC<{
  src: string;
  step: string;
  children?: React.ReactNode;
  punchIn?: boolean;
}> = ({ src, step, children, punchIn = true }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 150], [punchIn ? 1.12 : 1.05, 1.22], {
    extrapolateRight: "clamp",
  });
  const enter = spring({ frame, fps: 30, config: { damping: 200 } });
  // Clips are pre-baked to JPEG sequences (sandbox compositor can't decode mp4)
  const seqName = src.replace("clips/", "").replace(".mp4", "");
  const frameFile = String(Math.min(frame, 150) + 1).padStart(4, "0");
  return (
    <AbsoluteFill style={{ backgroundColor: CHARCOAL }}>
      <AbsoluteFill style={{ opacity: enter, transform: `scale(${scale})` }}>
        <Img
          src={staticFile(`seq/${seqName}/${frameFile}.jpg`)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      {/* vignette */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(to bottom, rgba(28,27,26,0.55) 0%, transparent 22%, transparent 68%, rgba(28,27,26,0.75) 100%)",
        }}
      />
      {/* step chip */}
      <div
        style={{
          position: "absolute",
          top: 90,
          left: 64,
          fontFamily: body,
          fontWeight: 600,
          fontSize: 34,
          color: CHARCOAL,
          backgroundColor: CREAM,
          padding: "10px 22px",
          letterSpacing: 4,
          opacity: enter,
        }}
      >
        {step}
      </div>
      {children}
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const pulse = 1 + Math.sin(frame / 9) * 0.012;
  return (
    <AbsoluteFill style={{ backgroundColor: CREAM, justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          fontFamily: display,
          fontSize: 150,
          color: CHARCOAL,
          letterSpacing: 2,
          transform: `scale(${interpolate(s, [0, 1], [0.6, 1]) * pulse})`,
          opacity: s,
          textTransform: "uppercase",
        }}
      >
        Nyzora
      </div>
      <div
        style={{
          fontFamily: body,
          fontWeight: 600,
          fontSize: 44,
          color: CLAY,
          marginTop: 26,
          letterSpacing: 6,
          opacity: spring({ frame: frame - 14, fps, config: { damping: 200 } }),
          textTransform: "uppercase",
        }}
      >
        nyzora.ai
      </div>
      <div
        style={{
          fontFamily: body,
          fontSize: 36,
          color: CHARCOAL,
          marginTop: 60,
          letterSpacing: 2,
          opacity: spring({ frame: frame - 26, fps, config: { damping: 200 } }),
        }}
      >
        Your pet. Made real.
      </div>
    </AbsoluteFill>
  );
};

// 30fps. Cuts land near the 124bpm beat grid (~14.5f/beat).
export const Reel: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: CHARCOAL }}>
      <Audio src={staticFile("audio/reel-beat.wav")} />
      <Sequence from={0} durationInFrames={132}>
        <ClipScene src="clips/step1-photo.mp4" step="01 — SNAP">
          <Caption words={["It", "starts"]} start={14} y={1330} />
          <Caption words={["with", "a", "photo"]} start={44} y={1490} />
        </ClipScene>
      </Sequence>
      <Sequence from={132} durationInFrames={146}>
        <ClipScene src="clips/step2-sculpt.mp4" step="02 — SCULPT">
          <Caption words={["AI", "sculpts"]} start={10} y={1330} />
          <Caption words={["their", "likeness"]} start={40} y={1490} />
        </ClipScene>
      </Sequence>
      <Sequence from={278} durationInFrames={146}>
        <ClipScene src="clips/step3-print.mp4" step="03 — PRINT">
          <Caption words={["Printed"]} start={10} y={1330} />
          <Caption words={["layer", "by", "layer"]} start={38} y={1490} />
        </ClipScene>
      </Sequence>
      <Sequence from={424} durationInFrames={116}>
        <ClipScene src="clips/step4-home.mp4" step="04 — HOME">
          <Caption words={["Their", "name."]} start={10} y={1330} />
          <Caption words={["Made", "real."]} start={40} y={1490} size={110} />
        </ClipScene>
      </Sequence>
      <Sequence from={540} durationInFrames={60}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
