

# Studio-Lite on Homepage: Enhanced Design Preview

## Overview

Transform the existing `InstantDesignPreview` component into a more powerful "Studio-Lite" experience that gives users a richer taste of the AI Design Studio capabilities without leaving the homepage. This creates an immediate "wow" moment while naturally funneling engaged users to the full studio for advanced features.

## Current State Analysis

The `InstantDesignPreview` component currently offers:
- Category selection dropdown
- Text prompt input
- Single "Generate Design" button
- Background gallery rotation of approved designs
- Basic expand/download for generated images
- "Continue in Full Design Studio" button after generation

## Proposed Enhancements

### 1. Add "Surprise Me" Button
Bring the popular `handleSurpriseMe` functionality from the full Design Studio to the homepage.

**Implementation:**
- Add a "Surprise Me" button (with Shuffle icon) next to the Generate button
- Reuse the same AI prompt generation logic from `DesignStudio.tsx`
- When clicked, auto-fill the prompt field with a creative AI-generated design idea
- Visual feedback with loading state during generation

### 2. Generate 3 Variations Instead of 1
Show users the power of AI by generating multiple options simultaneously.

**Implementation:**
- Instead of a single image, generate 3 design variations
- Display them in a horizontal row with selection capability
- Show a compact variation selector (thumbnails or dots)
- Selected variation becomes the main preview
- Each variation can be expanded/downloaded

### 3. Quick-Sell Flow (For Authenticated Users)
Enable a streamlined path to list designs for sale without going to the full studio.

**Implementation:**
- After generation, show a "List This Design" button for authenticated users
- Opens a compact submission dialog with:
  - Product name field
  - Category (pre-filled)
  - Dimensions with smart defaults (using `suggestDimensionsForDesign`)
  - Auto-calculated price preview
  - "Submit for Review" button
- For guests, show "Sign up to sell your design" nudge

### 4. Visual & UX Improvements

**Compact Generation Cards:**
- Show variations as smaller preview cards in a row
- Main selected image remains large
- Hover states with expand/download actions

**Progress States:**
- Animated sparkles during generation (existing)
- Progress bar for multi-variation generation
- Clear "Your creation" badge on user-generated content

**Trust Indicators:**
- "X designs generated today" live counter
- Subtle animation on the existing trust badges

## Technical Implementation

### Files to Modify

#### 1. `src/components/InstantDesignPreview.tsx`

**New State Variables:**
```text
- isGeneratingSurprise: boolean
- generatedVariations: Array<{ imageUrl: string; index: number }>
- selectedVariationIndex: number
- showQuickSellDialog: boolean
- quickSellData: { name, category, dimensions, price }
```

**New Functions:**
```text
- handleSurpriseMe(): Generate random creative prompt
- handleGenerateVariations(): Call generate-design 3 times in parallel
- handleSelectVariation(index): Set selected variation
- handleQuickSell(): Open quick-sell dialog
- calculateQuickPrice(): Use dimension-based pricing logic
```

**UI Changes:**
```text
- Add Surprise Me button next to Generate
- Replace single image display with variation grid + main preview
- Add "List for Sale" button after generation (auth check)
- Add QuickSellDialog component inline
```

#### 2. `src/components/QuickSellDialog.tsx` (New File)

A streamlined version of the submission form from DesignStudio:
- Product name input
- Category display (from homepage selection)
- Dimension inputs with smart defaults
- Price preview (read-only, auto-calculated)
- Terms checkbox
- Submit button

#### 3. `src/pages/Home.tsx`

Minor adjustments:
- Update section heading if needed
- Possibly adjust spacing for the enhanced preview

### Component Structure

```text
InstantDesignPreview
├── Header (title, subtitle)
├── Input Section
│   ├── Category Select
│   ├── Prompt Input
│   └── Button Row
│       ├── [Surprise Me] (Shuffle icon)
│       └── [Generate Design] (Sparkles icon)
├── Preview Section
│   ├── Main Image (selected variation or gallery)
│   │   ├── Expand/Download overlay
│   │   └── Info overlay (prompt, designer)
│   ├── Variation Thumbnails (3 small previews)
│   │   └── Selection indicator
│   └── Action Buttons
│       ├── [List for Sale] (authenticated)
│       ├── [Continue in Full Studio]
│       └── [Sign up to sell] (guest)
├── Trust Indicators
└── QuickSellDialog (modal)
```

### API Calls

**Surprise Me Prompt:**
```text
POST /functions/v1/generate-product-description
body: { type: 'surprise_prompt', category }
Returns: Creative design prompt text
```

**Generate Variations (3 parallel calls):**
```text
POST /functions/v1/generate-design (x3)
body: { prompt, variationNumber: 1|2|3, generate3D: false }
Returns: { imageUrl }
```

**Quick Submit:**
```text
Reuse existing designer_products insert logic
INSERT INTO designer_products
```

### User Flow

```text
Homepage → InstantDesignPreview
    │
    ├── [Surprise Me] → Fills prompt field
    │
    ├── [Generate Design] → Shows loading
    │       │
    │       └── 3 Variations appear
    │           │
    │           ├── Click variation → Selects it
    │           │
    │           ├── [List for Sale] (if logged in)
    │           │       │
    │           │       └── QuickSellDialog
    │           │               │
    │           │               └── Submit → Product created
    │           │
    │           ├── [Full Studio] → Navigate with design
    │           │
    │           └── [Sign up] (if guest) → Auth page
    │
    └── Gallery rotation (when no generation)
```

## Guest Mode Considerations

- First generation is free (existing localStorage check)
- After generation, show signup nudge for selling
- "Continue in Full Studio" works for guests (studio handles auth flow)
- Quick-sell button only visible to authenticated users

## Estimated Effort

| Task | Complexity |
|------|------------|
| Surprise Me button | Low |
| 3-variation generation | Medium |
| Variation UI with thumbnails | Medium |
| QuickSellDialog component | Medium |
| Auth-aware button states | Low |
| Testing & polish | Medium |

## Benefits

1. **Higher Engagement**: Users experience more AI magic immediately
2. **Lower Friction**: Quick-sell path removes unnecessary studio navigation
3. **Better Conversion**: Multiple variations increase likelihood of finding a loved design
4. **Trust Building**: Surprise Me demonstrates AI creativity without user effort

