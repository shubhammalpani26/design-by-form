# Conversational Design Studio

Transform `/design-studio` from a "generate 3 → pick → checkout" flow into a **chat-based design canvas** where creators pick one variation and iteratively refine it through conversation, with all existing tools (3D, AR, space preview, sketch upload, finishes, pricing) surfaced as inline action buttons.

## Core UX flow

```text
1. Creator opens /design-studio
   → empty chat with PromptInput at bottom + "New design" sidebar
2. Types prompt (or uploads sketch / space photo) → submits
   → assistant message streams in with 3 starting variations (existing generate-design)
3. Creator clicks one variation → it becomes the "active canvas" (pinned at top)
4. Creator chats: "make the legs brass", "more sculptural", "smaller scale", etc.
   → each user msg → edit-design edge fn → new image, becomes new active canvas
   → previous canvas kept in history (can revert by clicking any prior image)
5. Under each assistant image, inline action buttons:
   [✨ Apply finish] [📐 View in AR] [🧊 Generate 3D] [🏠 See in space]
   [✅ Make manufacturable & get price]
6. "Make manufacturable" → runs current pricing/MBP flow on the active canvas,
   opens existing pricing dialog → on confirm, creates the product as today.
```

## Phasing

### Phase 1 (this build) — Core chat + iterative edits
- DB schema (`design_sessions`, `design_messages`)
- New `/design-studio` page rebuilt as chat (AI Elements: Conversation, Message, MessageResponse, PromptInput, Tool)
- Sidebar: list of past sessions + "New design" button
- Initial generation: reuses existing `generate-design` edge function, returns 3 variations rendered as a 3-up grid in the first assistant message
- Pick variation → sets `active_image_url` on session
- New edge function `edit-design`: image-to-image via `google/gemini-2.5-flash-image` (Nano Banana), takes current image + edit prompt, returns new image
- Each edit becomes a new assistant message with the new image as active canvas
- "Revert to this" button on any earlier image
- Inline action buttons stub: [Apply finish] [View in AR] [Generate 3D] [See in space] [Make manufacturable]

### Phase 2 — Wire tool buttons to existing flows
- [Apply finish] → opens existing finish selector dialog, runs `generate-finish-preview`, posts result as new assistant msg
- [View in AR] → routes to existing ARViewer with active image
- [Generate 3D] → existing Meshy flow + 3D fee dialog
- [See in space] → existing `generate-space-preview` (upload space photo if not set)
- [Make manufacturable] → existing pricing/MBP + listing dialog, creates `designer_products` row

### Phase 3 — Polish
- Streaming partial images during edits (Gemini supports SSE partials)
- Slash commands as a fast path (optional later)
- Old `DesignStudio` archived (route replaced)

## Technical details (Phase 1)

**DB migration:**
- `design_sessions`: `id`, `user_id`, `title`, `active_image_url`, `category`, `created_at`, `updated_at`
- `design_messages`: `id`, `session_id`, `role` ('user'|'assistant'), `content` (text), `image_urls` (jsonb array), `metadata` (jsonb — for tool calls, variation choice, etc.), `created_at`
- RLS: user can CRUD their own sessions/messages; GRANTs for `authenticated` + `service_role`
- Trigger: `update_updated_at_column` on both

**Edge function `edit-design`:**
- Input: `{ sessionId, baseImageUrl, editPrompt, category }`
- Auth: verify JWT, verify session belongs to user
- Validate with Zod
- Call Lovable AI Gateway `/v1/images/generations` with `google/gemini-2.5-flash-image`, messages with image_url + edit prompt, modalities `["image","text"]`, `stream: false` (Phase 1 — simpler; streaming in Phase 3)
- Upload result PNG to `product-images` bucket → return public URL
- Insert assistant message into `design_messages`
- Update `design_sessions.active_image_url`
- Enforce manufacturing constraints via system prompt (solid form, flat base — pull from existing `generate-design` prompt)

**Frontend (`/design-studio` page rewrite):**
- Install AI Elements: `bun x ai-elements@latest add conversation message prompt-input shimmer`
- Layout: left sidebar (sessions) | main chat area (Conversation + PromptInput at bottom)
- Mobile (390x844): sidebar collapses to a sheet, chat full-width
- Active canvas thumbnail pinned above PromptInput (small, ~80px, with category badge)
- Initial message empty-state shows category quick-picks + "Try: 'a sculptural walnut console with brass inlay'"
- Render image messages with `object-contain` (per project mem)
- No bg on assistant messages, user messages in `bg-primary text-primary-foreground` bubble

**Action buttons (Phase 1 = visible but only wire 2):**
- [Make manufacturable & get price] — fully wired, opens existing pricing flow on the active image
- [View in AR] — routes to existing ARViewer with active image
- Others (Apply finish, Generate 3D, See in space) — visible with "Coming soon" toast, wired in Phase 2

**Replaces:**
- `src/pages/DesignStudio.tsx` — rewritten end-to-end
- Existing `generate-design` edge function — kept, called for the initial 3 variations
- Existing pricing/MBP/listing flow — reused unchanged on the active canvas

## Out of scope for Phase 1
- Masked region edits (you chose free-form chat; can layer masking later if needed)
- Streaming partial preview frames (added in Phase 3)
- Tool buttons beyond "Make manufacturable" and "View in AR" (Phase 2)
- Migrating in-flight users from old Studio (clean replace)

## Risk / unknowns
- `gemini-2.5-flash-image` quality on furniture edit prompts — we have prior success with it (used in space preview, finish preview). Should be solid.
- Cost: each edit ≈ 1 image gen call. Existing 10-credit logic should cover; we may want to decrement credits per edit (Phase 2 decision — Phase 1 will be free during dogfooding).

Approve to start Phase 1, or tell me what to adjust.