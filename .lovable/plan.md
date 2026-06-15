# Multi-Agent Orchestration — Invisible Upgrade

User-facing UX **does not change**. Same Design Studio, same "Generate" button, same "Get a Quote" mode. Behind the scenes, each generation now runs through a coordinated agent pipeline instead of a single model call. The user just sees better results, fewer manufacturability rejections, and tighter pricing.

## Pipeline (server-side)

```text
User prompt
   │
   ▼
[1] Design Agent          → generates concept image + dims (existing: generate-design)
   │
   ▼
[2] Engineering Agent     → NEW: AI manufacturability check
   │   (wall thickness, base stability, overhangs, joinery fit per maker)
   │   ├─ PASS → continue
   │   └─ FAIL → auto-revise once via Design Agent with engineering notes, then continue
   │
   ▼
[3] Material/Maker Agent  → routes to Cyanique / Beni / U.G. Agawane
   │   (existing: suggest-maker, with intelligence learnings)
   │
   ▼
[4] Costing Agent         → MBP from dims + category + maker tier
       (existing: recalculate-pricing, already Beni-aware)
   │
   ▼
Final result returned to UI (image + dims + maker + price)
```

## What's new

1. **`engineering-check` edge function** (new)
   - Inputs: design image URL, dimensions, category, target maker
   - Uses `google/gemini-3.1-pro-preview` (vision + reasoning) to assess:
     - Wall thickness / structural integrity
     - Base stability for stated dims
     - Process feasibility (FGF print envelope, wood joinery feasibility, canvas size)
     - Material-form fit (e.g. organic curves → resin, not solid wood)
   - Returns `{ pass: bool, issues: string[], revision_prompt?: string, confidence }`

2. **`orchestrate-design` edge function** (new, thin coordinator)
   - Single entrypoint the frontend can call
   - Sequentially invokes: generate-design → engineering-check → (revise if needed) → suggest-maker → recalculate-pricing
   - Returns one consolidated payload + a hidden `agent_trace` (logged to `manufacturing_intelligence` for the flywheel; not shown in UI)

3. **Wire into existing surfaces (no UI change)**
   - `DesignStudio.tsx` and `DesignStudioChat.tsx` continue calling what looks like one function; the orchestrator replaces the direct `generate-design` call
   - Loading state messaging stays generic ("Generating your design…")
   - Optional: tiny `data-agent-step` attribute streamed for future telemetry, invisible to users

## What's NOT in this pass
- No new page, no "agent thinking" transcript UI, no chat surface
- No real-time maker inventory lookup (Material Agent stays rule-based + learnings)
- No costing feedback loop (if over-budget, we don't re-run Design — that's the "full loop" scope)

## Files

**New:**
- `supabase/functions/engineering-check/index.ts`
- `supabase/functions/orchestrate-design/index.ts`
- `supabase/config.toml` — register both with `verify_jwt = false` (matches existing generate-design)

**Edit:**
- `src/pages/DesignStudio.tsx` — swap `supabase.functions.invoke('generate-design', …)` for `'orchestrate-design'` at the single call site
- `src/pages/DesignStudioChat.tsx` — same swap
- Keep payload shape backward-compatible so callers don't change

**Unchanged:**
- `generate-design`, `recalculate-pricing`, `suggest-maker`, `calculate-weight` — reused as-is

## Models
- Design Agent: existing (Gemini 3 Pro Image)
- Engineering Agent: `google/gemini-3.1-pro-preview` (highest reasoning, vision-capable)
- Maker/Costing Agents: existing (Gemini 2.5 Flash — fast structured output)

## Verification
1. Curl `orchestrate-design` with a known prompt → confirm all 4 steps run and final payload matches current `generate-design` shape
2. Force an engineering fail (tiny wall-thickness brief) → confirm one revision pass happens
3. Open Design Studio in preview, generate one design → confirm UI is unchanged and result lands as before
4. Check `manufacturing_intelligence` for new trace row

Ready to build on approval.