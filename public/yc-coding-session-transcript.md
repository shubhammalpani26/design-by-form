# Lovable Coding Agent Session — Manufacturing Constraints for AI Design Pipeline

**Platform:** Lovable (AI coding agent)  
**Date:** February 9, 2026  
**Project:** Formo — Software that turns custom furniture ideas into factory-ready outputs  
**Session focus:** Identifying and fixing a gap between our YC application claims and actual system behavior

---

## Context

Formo uses Google Gemini to generate photorealistic furniture designs from text prompts and sketches. These designs must be **manufacturable via large-format 3D printing** — meaning solid, monolithic forms with no lattice, mesh, or structurally unsound features.

Our YC application states: *"the AI is constrained to generate only forms that are structurally sound and manufacturable."*

During demo preparation, I audited the edge function that powers design generation and discovered the manufacturing constraints were only loosely enforced. This session shows the identification, fix, deployment, and live verification.

---

## Session Transcript

### Step 1: Audit — Identifying the Gap

**Me:** Does this also add manufacturing constraints?

*[I was reviewing `supabase/functions/generate-design/index.ts` — a 421-line Deno edge function that orchestrates:]*
- *Text/sketch → Gemini 2.5 Flash Image → photorealistic furniture design*
- *AI pricing analysis (complexity, materials, manufacturing base price)*
- *Meshy.ai image-to-3D model conversion*

**Lovable (AI Agent):**

> Looking at your `generate-design` edge function, the manufacturing constraints are **partially** there but could be stronger. Here's what exists vs. what's missing:
>
> **What's there:**
> - The prompt says "elegant and manufacturable with advanced fabrication techniques"
> - The "Surprise Me" feature (client-side) constrains to solid/monolithic forms
> - Pricing analysis considers manufacturing complexity
>
> **What's missing from the edge function itself:**
> - No explicit constraints against lattice, mesh, perforations, voronoi patterns
> - No mention of "solid, continuous, monolithic" in the generation prompt
> - No structural integrity requirements (stable base, no thin unsupported elements)
> - The constraint logic lives in the client-side Surprise Me feature but **not** in the actual image generation prompt
>
> Your YC application says *"the AI is constrained to generate only forms that are structurally sound and manufacturable."* Right now, that's only loosely enforced in the edge function.

**Key insight:** The AI agent correctly identified that our manufacturing constraints existed in the wrong layer — they were in the client-side "Surprise Me" prompt generator, but NOT in the actual server-side generation function that every design goes through.

---

### Step 2: Implementation — Adding Manufacturing Constraints

**Me:** Sure, do that.

**Lovable:** Modified `supabase/functions/generate-design/index.ts` — added a `manufacturingConstraints` constant injected into all three generation paths:

```typescript
// Manufacturing constraints applied to EVERY generation
const manufacturingConstraints = `
CRITICAL MANUFACTURING CONSTRAINTS — every design MUST follow these rules:
- SOLID, CONTINUOUS, MONOLITHIC form only — no hollow shells, no thin walls
- NO lattice, mesh, voronoi, perforated, or honeycomb patterns
- NO holes, cutouts, or openings in structural surfaces
- Single material (resin/composite) and single color/finish
- Stable, flat base that can stand on its own without support
- No thin unsupported cantilevers or fragile overhangs
- Minimum wall thickness throughout — designed for 3D printing at furniture scale
- Smooth, continuous surfaces suitable for post-processing and finishing
- Structurally sound: the piece must support its intended load (seating, tabletop, etc.)
The design must be manufacturable via large-format 3D printing and hand-finishing.`;
```

**Three generation paths updated:**
1. **Standard text-to-design** — user types a prompt
2. **Sketch-to-design** — user uploads a hand-drawn sketch
3. **Room-aware generation** — user provides a room photo for spatial context

Each path now includes `${manufacturingConstraints}` in the prompt sent to Gemini.

**Deployment:** Edge function auto-deployed to production.

---

### Step 3: Live Verification — Browser Testing

**Me:** Generate a design in the Design Studio to verify the new manufacturing constraints produce solid, monolithic furniture forms without lattice or mesh patterns.

**Lovable:** Opened the Design Studio in a browser session, selected "Benches" category, entered the prompt:

> *"A flowing bench inspired by ocean waves, with a continuous curve seat and sculptural legs"*

Clicked Generate → waited ~35 seconds → **all 3 variations generated successfully.**

**Result:** All three designs showed solid, continuous, monolithic bench forms with flowing wave-inspired curves. No lattice, mesh, voronoi, or perforated patterns appeared.

**Edge function logs confirmed** all 3 variations went through the standard prompt path with manufacturing constraints applied.

---

## Why This Session Matters

### Technical depth
This isn't a UI change — it's modifying the **core AI pipeline** that defines what the product can and cannot produce. The constraint system means Gemini generates within manufacturing boundaries, not just aesthetic ones.

### Architecture awareness
The AI agent identified that constraints were in the wrong architectural layer (client-side vs. server-side) and moved them to where they're enforced for every generation, regardless of entry point.

### Full-stack execution
Single session covered: code audit → edge function modification → prompt engineering → deployment → live browser testing → log verification.

### Domain-specific AI
The manufacturing constraints aren't generic software rules — they encode real knowledge about 3D printing at furniture scale: wall thickness, structural loads, base stability, material limitations. This is the kind of domain encoding that makes AI outputs actually useful for production.

---

## System Architecture (for context)

```
User Prompt/Sketch
       ↓
[generate-design edge function]  ← Manufacturing constraints injected here
       ↓
Google Gemini 2.5 Flash Image → Photorealistic furniture design
       ↓
Google Gemini 2.5 Flash → AI pricing analysis (complexity, MBP)
       ↓
Meshy.ai → Image-to-3D model conversion
       ↓
Admin Review → Marketplace + Community Feed
```

**Tech stack:** React/TypeScript, Supabase (PostgreSQL + Edge Functions), Google Gemini, Meshy.ai, Three.js/Model-Viewer for 3D/AR — entire product built with Lovable AI coding platform.
