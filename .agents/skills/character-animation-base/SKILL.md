---
name: character-animation-base
description: Hand-painted 2D character animations rendered with code (p5.js + p5.brush) — brush strokes, flat 2D, boiling linework. Use when the user wants a short cartoon/animated clip with a character, a storyboarded hand-drawn-looking video, or an animated mascot piece. Based on the Claude Animation Base starter kit (MIT).
---

# Character Animation Base

A starter kit for animating a character in p5.js and p5.brush, from the music video "I'm Upping My P(doom)".

## How to use

1. Read `ANIMATION_GUIDE.md` in this folder first — it holds the rules: handmade, alive, one piece, no text, transitions always, something happens in every scene.
2. Storyboard before coding. Build shot by shot, render contact sheets to check the work, then write the final `out/video.mp4`.
3. Swap in your own character or reference images when the brand needs it (for Nyzora: a pet sculpture, the wordmark, or a maker's hands — never the Claude mascot in customer-facing content).

## Running

Needs Node.js, Chrome/Chromium and ffmpeg (all available in this sandbox).

```bash
cd <this skill folder>
npm install
node render.mjs --clip --out=out/video.mp4
```

On this headless sandbox add `--soft-gl` if WebGL fails; watercolour fills are slow without a GPU — prefer flat fills for speed. Open `studio.html` in a browser to scrub the timeline.

## Notes

- Render times are seconds per frame with watercolour fills; keep clips short (10–15 s).
- License: MIT (see LICENSE).
