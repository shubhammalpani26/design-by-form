import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../public/audio");
await fs.mkdir(outDir, { recursive: true });

const key = process.env.LOVABLE_API_KEY;
if (!key) throw new Error("LOVABLE_API_KEY missing");

const VOICE = "ash";
const INSTRUCTIONS =
  "Speak slowly, calmly, with warmth and refinement. Cinematic luxury brand narrator — quiet confidence, like a film trailer. Leave space between words.";

const LINES = [
  { name: "s1", text: "Design. Anything." },
  { name: "s2", text: "Just describe your space — in your own words." },
  { name: "s3", text: "Our AI brings your vision to life. Instantly." },
  { name: "s4", text: "Then we engineer, manufacture, and deliver it to your door." },
  { name: "s5", text: "Nyzora. Design anything. We make it real." },
];

for (const line of LINES) {
  console.log("→", line.name);
  const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini-tts",
      input: line.text,
      voice: VOICE,
      instructions: INSTRUCTIONS,
      response_format: "mp3",
      stream_format: "audio",
      speed: 0.92,
    }),
  });
  if (!res.ok) {
    throw new Error(`TTS ${line.name} failed ${res.status}: ${await res.text()}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(path.join(outDir, `${line.name}.mp3`), buf);
  console.log("  saved", buf.length, "bytes");
}
console.log("done");