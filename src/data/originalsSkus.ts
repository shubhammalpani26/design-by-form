import petImg from "@/assets/originals-pet-silhouette.jpg";
import petPortraitImg from "@/assets/originals-pet-portrait.jpg";
import nurseryImg from "@/assets/originals-nursery-name.jpg";
import weddingImg from "@/assets/originals-wedding-coordinates.jpg";

export interface OriginalSku {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number; // USD
  image: string;
  dimensions: string;
  /** Search-facing metadata. Falls back to name/tagline when absent. */
  seo?: { title: string; description: string; keywords: string[] };
  fields: { key: string; label: string; placeholder: string; options?: string[]; maxLength?: number; hint?: string }[];
  promptTemplate: (values: Record<string, string>) => string;
  /** Size ladder shown at the moment of decision. Prices include free US shipping. */
  sizes: { key: string; label: string; size: string; price: number; note?: string }[];
  /** When set, the piece can be made from a buyer's own photo. */
  photo?: {
    label: string;
    hint: string;
    /** Prompt used with the buyer's uploaded photo as the reference image. */
    promptTemplate: (values: Record<string, string>) => string;
  };
}

/** Pet forms we sculpt in full three-dimensional relief. */
export const PET_TYPES = [
  "Dog — long snout (retriever, lab)",
  "Dog — short snout (pug, bulldog)",
  "Dog — pointed ears (shepherd, husky)",
  "Dog — floppy ears (beagle, spaniel)",
  "Cat — short hair",
  "Cat — long hair",
  "Rabbit",
  "Horse",
  "Bird / parrot",
  "Other (describe below)",
];

/** Every Original is printed as a single part inside a 220 x 220 x 220 mm envelope. */
export const MAX_ENVELOPE_MM = 220;

/** Lettering sits raised on a fixed panel, so the text has to stay short to stay legible. */
export const HEADING_MAX = 18;
export const FOOTNOTE_MAX = 24;

/**
 * Raised-lettering clause for prompt templates. When the buyer leaves both
 * heading and footnote blank, the plinth must be explicitly clean — never fall
 * back to a placeholder name, or the render shows someone else's name.
 */
const plinthLettering = (v: Record<string, string>): string => {
  const heading = (v.heading || v.petName || "").trim();
  const footnote = (v.footnote || v.date || "").trim();
  if (!heading && !footnote) {
    return "the plinth face left completely clean and unmarked — no lettering, no text, no nameplate, no monogram anywhere on the piece.";
  }
  const parts: string[] = [];
  if (heading) {
    parts.push(
      `carrying the heading "${heading.toUpperCase()}" in raised fine sans-serif capitals standing slightly proud of the plinth face, like a cast nameplate`,
    );
  }
  if (footnote) {
    parts.push(
      `with the smaller footnote line "${footnote}" raised ${heading ? "beneath it" : "on the plinth face"} in the same raised lettering`,
    );
  }
  return parts.join(", ") + ".";
};

export const ORIGINALS_SKUS: OriginalSku[] = [
  {
    slug: "pet-silhouette-keepsake",
    name: "Custom Pet Memorial Sculpture",
    tagline: "A pet memorial gift made from your photo — their head sculpted in full three dimensions, your words engraved.",
    description:
      "A personalized pet memorial made from a photo of your dog or cat: their head and shoulders modelled in full three dimensions on a weighted plinth, with their name and dates engraved into the front face — a nickname, a date, a line only the two of you understand. A dignified alternative to a pet urn or an engraved plaque, and a pet loss gift you can hold and turn: cheeks, muzzle, brow and ears shaped all the way around, not a flat cut-out. The eyes are set as deep almond sockets with defined lids and a raised iris dome, so they read as eyes in any light without any fragile or glued-in parts. The surface is a single matte colour throughout, with the fine horizontal layer lines that are the honest signature of precision 3D printing — no two-tone, no contrasting base. Made from plant-based PLA, 3D-printed as one solid part in the USA and shipped free.",
    price: 59,
    image: petImg,
    dimensions: "196 × 150 × 120 mm",
    seo: {
      title: "Custom Pet Memorial Sculpture from a Photo — Dog & Cat Memorial Gift",
      description:
        "A personalized pet memorial gift sculpted from your photo and engraved with their name and dates. A keepsake alternative to a pet urn. Made in the USA, free shipping, from $59.",
      keywords: [
        "pet memorial gifts",
        "dog memorial gift",
        "cat memorial gift",
        "pet loss gift",
        "personalized pet gift",
        "pet urn alternative",
        "custom pet statue",
        "pet memorial from photo",
      ],
    },
    fields: [
      { key: "heading", label: "Heading", placeholder: "MARLOW", maxLength: HEADING_MAX, hint: "Their name — leave blank for a clean plinth" },
      { key: "petType", label: "Kind of pet", placeholder: "Choose a pet", options: PET_TYPES },
      { key: "breed", label: "Breed or type", placeholder: "Golden retriever" },
      { key: "footnote", label: "Footnote (optional)", placeholder: "2014 — 2024", maxLength: FOOTNOTE_MAX, hint: "Their dates or a short line, engraved below" },
    ],
    sizes: [
      { key: "petite", label: "Petite", size: "120 mm tall", price: 59, note: "Desk or shelf" },
      { key: "standard", label: "Standard", size: "140 mm tall", price: 89, note: "Most loved" },
      { key: "statement", label: "Statement", size: "196 mm tall", price: 139, note: "Full presence" },
    ],
    photo: {
      label: "Upload a photo of your pet",
      hint: "One clear, well-lit photo of their face. Front or three-quarter view works best.",
      promptTemplate: (v) =>
        `Using the animal in the reference photo, sculpt a fully three-dimensional carved stone-look bust of that exact animal's head and shoulders, keeping its recognisable face, breed, ear shape, muzzle length and markings as sculpted form. Sculpt the animal only — never reproduce anything it is holding or wearing in the photo: no stick, ball, toy, flower, rope, food, leash, collar, tag, harness or bandana, and no hands, background objects or other animals. Three-quarter view, rounded modelled volume front to back — absolutely not a flat silhouette, not an extruded profile plate, not a relief panel. Surface finish is one single uniform colour across the entire piece with a soft satin sheen — a real 3D-printed PLA object photographed in a studio, with gentle broad highlights rolling over the curved surfaces and warm soft-box reflections, not a flat matte CG render — sculpture and plinth exactly the same solid colour, absolutely no two-tone, no colour banding, no stripes, no wood grain, no marbling, no contrasting base, no paint or metallic accents; only very fine even horizontal print layer lines in that same colour give the surface its texture, catching the light subtly along the curves. The expression is warm and happy: a gentle open-mouthed smile with the tongue tip just visible, relaxed lifted cheeks, ears perked up and alert, and bright uplifted brows — a joyful, alive look rather than a solemn one, all rendered as sculpted form. The eyes are sculpted, not painted: deep almond sockets carved at least 2 mm into the brow with defined upper and lower lids and a smooth raised iris dome inside each socket — no glass, no inserts, no glossy beads, no paint, no thin whiskers or fine hairs. The bust sits on a deep, heavy rectangular plinth with generously rounded corners and a soft chamfer running along every top and bottom edge — no sharp knife edges anywhere, every transition eased and hand-friendly — ${plinthLettering(v)} Monolithic and solid, single part, substantial and heavy in the hand, no thin fragile details, all outer edges softly eased, flat stable base, satin single-colour PLA, studio lighting on a clean neutral background showing depth and shadow.`,
    },
    promptTemplate: (v) =>
      `A fully three-dimensional carved sculpture of the head and shoulders of a ${v.breed || v.petType || "dog"}${v.petType ? ` (${v.petType})` : ""}, shown in a three-quarter view so the depth is obvious: rounded modelled muzzle, brow, cheeks and ears sculpted in the round with real volume front to back, absolutely not a flat silhouette, not an extruded profile plate, not a relief panel, no thick flat slab. Surface finish is one single uniform colour across the entire piece with a soft satin sheen — a real 3D-printed PLA object photographed in a studio, with gentle broad highlights rolling over the curved surfaces and warm soft-box reflections, not a flat matte CG render — sculpture and plinth exactly the same solid colour, absolutely no two-tone, no colour banding, no stripes, no wood grain, no marbling, no contrasting base, no paint or metallic accents; only very fine even horizontal print layer lines in that same colour give the surface its texture, catching the light subtly along the curves. The expression is warm and happy: a gentle open-mouthed smile with the tongue tip just visible, relaxed lifted cheeks, ears perked up and alert, and bright uplifted brows — a joyful, alive look rather than a solemn one, all rendered as sculpted form. The eyes are sculpted, not painted: deep almond eye sockets carved at least 2 mm into the brow with clearly defined upper and lower lids and a smooth raised iris dome inside each socket, catching shadow — no glass, no inserts, no glossy black beads, no painted detail, no thin whiskers or fine hairs. The sculpture sits on a deep, heavy rectangular plinth with generously rounded corners and a soft chamfer running along every top and bottom edge — no sharp knife edges anywhere, every transition eased and hand-friendly — ${plinthLettering(v)} Monolithic and solid, substantial and heavy in the hand, no thin fragile details, all outer edges softly eased, flat stable base, studio lighting showing depth and shadow.`,
  },
  {
    slug: "pet-portrait-sculpture",
    name: "Custom Pet Portrait Sculpture",
    tagline: "A personalized pet gift for the one still curled up next to you.",
    description:
      "The same sculpture, made while they're still here. A custom 3D portrait of your dog or cat's head and shoulders, modelled from your photo and set on a weighted plinth engraved with their name — a personalized pet gift for a birthday, a gotcha day, or no reason at all. Rounded, modelled volume you can hold and turn: cheeks, muzzle, brow and ears shaped all the way around, not a flat cut-out. The eyes are set as deep almond sockets with defined lids and a raised iris dome, so they read as eyes in any light. The surface is a single matte colour throughout, with the fine horizontal layer lines that are the honest signature of precision 3D printing — no two-tone, no contrasting base. Made from plant-based PLA, 3D-printed as one solid part in the USA and shipped free.",
    price: 59,
    image: petPortraitImg,
    dimensions: "196 × 150 × 120 mm",
    seo: {
      title: "Custom Pet Portrait Sculpture from a Photo — Personalized Dog & Cat Gift",
      description:
        "A personalized pet gift sculpted from your photo: a custom 3D dog or cat portrait engraved with their name. Made in the USA, free shipping, from $59.",
      keywords: [
        "personalized pet gift",
        "custom dog statue",
        "custom pet statue",
        "3d pet figurine",
        "custom pet portrait",
        "dog lover gift",
        "cat lover gift",
        "pet gift from photo",
      ],
    },
    fields: [
      { key: "heading", label: "Heading", placeholder: "BAILEY", maxLength: HEADING_MAX, hint: "Their name — leave blank for a clean plinth" },
      { key: "petType", label: "Kind of pet", placeholder: "Choose a pet", options: PET_TYPES },
      { key: "breed", label: "Breed or type", placeholder: "Golden retriever" },
      { key: "footnote", label: "Footnote (optional)", placeholder: "DAD'S BEST FRIEND", maxLength: FOOTNOTE_MAX, hint: "A nickname or short line, engraved below" },
    ],
    sizes: [
      { key: "petite", label: "Petite", size: "120 mm tall", price: 59, note: "Desk or shelf" },
      { key: "standard", label: "Standard", size: "140 mm tall", price: 89, note: "Most loved" },
      { key: "statement", label: "Statement", size: "196 mm tall", price: 139, note: "Full presence" },
    ],
    photo: {
      label: "Upload a photo of your pet",
      hint: "One clear, well-lit photo of their face. Front or three-quarter view works best.",
      promptTemplate: (v) =>
        `Using the animal in the reference photo, sculpt a fully three-dimensional carved stone-look bust of that exact animal's head and shoulders, keeping its recognisable face, breed, ear shape, muzzle length and markings as sculpted form. Sculpt the animal only — never reproduce anything it is holding or wearing in the photo: no stick, ball, toy, flower, rope, food, leash, collar, tag, harness or bandana, and no hands, background objects or other animals. Three-quarter view, rounded modelled volume front to back — absolutely not a flat silhouette, not an extruded profile plate, not a relief panel. Surface finish is one single uniform colour across the entire piece with a soft satin sheen — a real 3D-printed PLA object photographed in a studio, with gentle broad highlights rolling over the curved surfaces and warm soft-box reflections, not a flat matte CG render — sculpture and plinth exactly the same solid colour, absolutely no two-tone, no colour banding, no stripes, no wood grain, no marbling, no contrasting base, no paint or metallic accents; only very fine even horizontal print layer lines in that same colour give the surface its texture, catching the light subtly along the curves. The expression is warm and happy: a gentle open-mouthed smile with the tongue tip just visible, relaxed lifted cheeks, ears perked up and alert, and bright uplifted brows — a joyful, alive look rather than a solemn one, all rendered as sculpted form. The eyes are sculpted, not painted: deep almond sockets carved at least 2 mm into the brow with defined upper and lower lids and a smooth raised iris dome inside each socket — no glass, no inserts, no glossy beads, no paint, no thin whiskers or fine hairs. The bust sits on a deep, heavy rectangular plinth with generously rounded corners and a soft chamfer running along every top and bottom edge — no sharp knife edges anywhere, every transition eased and hand-friendly — ${plinthLettering(v)} Monolithic and solid, single part, substantial and heavy in the hand, no thin fragile details, all outer edges softly eased, flat stable base, satin single-colour PLA, studio lighting on a clean neutral background showing depth and shadow.`,
    },
    promptTemplate: (v) =>
      `A fully three-dimensional carved sculpture of the head and shoulders of a ${v.breed || v.petType || "dog"}${v.petType ? ` (${v.petType})` : ""}, shown in a three-quarter view so the depth is obvious: rounded modelled muzzle, brow, cheeks and ears sculpted in the round with real volume front to back, absolutely not a flat silhouette, not an extruded profile plate, not a relief panel, no thick flat slab. Surface finish is one single uniform colour across the entire piece with a soft satin sheen — a real 3D-printed PLA object photographed in a studio, with gentle broad highlights rolling over the curved surfaces and warm soft-box reflections, not a flat matte CG render — sculpture and plinth exactly the same solid colour, absolutely no two-tone, no colour banding, no stripes, no wood grain, no marbling, no contrasting base, no paint or metallic accents; only very fine even horizontal print layer lines in that same colour give the surface its texture, catching the light subtly along the curves. The expression is warm and happy: a gentle open-mouthed smile with the tongue tip just visible, relaxed lifted cheeks, ears perked up and alert, and bright uplifted brows — a joyful, alive look rather than a solemn one, all rendered as sculpted form. The eyes are sculpted, not painted: deep almond eye sockets carved at least 2 mm into the brow with clearly defined upper and lower lids and a smooth raised iris dome inside each socket, catching shadow — no glass, no inserts, no glossy black beads, no painted detail, no thin whiskers or fine hairs. The sculpture sits on a deep, heavy rectangular plinth with generously rounded corners and a soft chamfer running along every top and bottom edge — no sharp knife edges anywhere, every transition eased and hand-friendly — ${plinthLettering(v)} Monolithic and solid, substantial and heavy in the hand, no thin fragile details, all outer edges softly eased, flat stable base, studio lighting showing depth and shadow.`,
  },
  {
    slug: "nursery-name-date",
    name: "Baby Name & Date Piece",
    tagline: "The first thing they ever owned with their name on it.",
    description:
      "Two soft dunes rising out of a single solid block — one tall, one low — wrapped in gentle concentric contour ridges. The taller dune opens onto a clean, unbroken face where the name stands in raised fine capitals, with the date set quietly below on the lower dune. Rounded and hand-warm rather than architectural, so it reads as a sculpture first and a keepsake second. The surface is a single matte colour throughout, with the fine horizontal layer lines that are the honest signature of precision 3D printing. Made from plant-based PLA, 3D-printed as one solid part in the USA and shipped free.",
    price: 60,
    image: nurseryImg,
    dimensions: "157 × 147 × 43 mm",
    fields: [
      { key: "heading", label: "Heading", placeholder: "OLIVER", maxLength: HEADING_MAX, hint: "Engraved on the tall dune" },
      { key: "footnote", label: "Footnote", placeholder: "12.05.2024", maxLength: FOOTNOTE_MAX, hint: "Birth date or a short line" },
    ],
    sizes: [{ key: "standard", label: "Standard", size: "155 mm wide", price: 60 }],
    promptTemplate: (v) =>
      `A fully three-dimensional sculptural object with a soft satin PLA sheen, photographed as a real 3D-printed object with gentle rolling highlights and fine visible layer lines in landscape horizontal format, wider than tall: two soft overlapping dunes swelling out of one solid mass, the left dune tall and rounded, the right dune low and broad, their shoulders merging into each other with generous fillets. Gentle concentric contour ridges wrap around each dune like topographic lines, catching soft shadow, deliberate and even. The face of the tall dune is left smooth and unridged as a clean sculpted panel, carrying the heading "${(v.heading || v.childName || "OLIVER").toUpperCase()}" in raised fine widely-tracked sans-serif capitals standing slightly proud of the face, like a cast nameplate, with the smaller footnote "${v.footnote || v.date || "12.05.2024"}" engraved on the low dune beneath. Three-quarter view showing real depth front to back. Monolithic single part, thick and heavy in the hand, generous wall thickness, every edge and corner softly rounded or chamfered with no sharp knife edges, no arch, no tombstone or headstone silhouette, no lattice, no perforations, no thin unsupported spans, no separate base slab — the form flows straight into a flat stable footprint. Studio lighting, clean neutral background, minimal luxury editorial styling.`,
  },
  {
    slug: "wedding-coordinates",
    name: "Wedding Coordinates Piece",
    tagline: "The exact place it happened, made into an object.",
    description:
      "Two sculpted waves rise from one solid mass and lean into each other until they meet — a single continuous form, never two pieces. Below them, a clean flat band runs across the front carrying your coordinates and the date in raised lettering that stands proud of the surface. Everything else is left as soft, sweeping swell, so the object reads as sculpture on a console table and only reveals what it is up close. The surface is a single matte colour throughout, with the fine horizontal layer lines that are the honest signature of precision 3D printing. Made from plant-based PLA, 3D-printed as one solid part in the USA and shipped free.",
    price: 85,
    image: weddingImg,
    dimensions: "154 × 174 × 56 mm",
    fields: [
      { key: "heading", label: "Heading", placeholder: "40.7128° N, 74.0060° W", maxLength: FOOTNOTE_MAX, hint: "Coordinates, a place or two names" },
      { key: "footnote", label: "Footnote", placeholder: "06.23.24", maxLength: FOOTNOTE_MAX, hint: "The date, engraved below" },
    ],
    sizes: [{ key: "standard", label: "Standard", size: "155 mm wide", price: 85 }],
    promptTemplate: (v) =>
      `A fully three-dimensional sculptural object with a soft satin PLA sheen, photographed as a real 3D-printed object with gentle rolling highlights and fine visible layer lines in landscape horizontal format, wider than tall: two smooth sculpted waves rising out of one solid mass and leaning toward each other until their crests meet and merge into a single continuous surface, fused with a generous fillet where they touch — one unbroken piece, never two separate parts, no gap, no opening, no hole through the form. Soft sweeping surfaces with a slow carved swell, quiet and confident. Across the front, where the two waves meet, runs one flat polished horizontal band engraved with "${v.heading || v.coordinates || "40.7128° N, 74.0060° W"}" in raised fine sans-serif capitals standing slightly proud of the plinth face, like a cast nameplate and the smaller footnote "${v.footnote || v.date || "06.23.24"}" raised beneath it in the same raised lettering. Three-quarter view showing real depth front to back. Monolithic single part, thick and weighty, every edge and corner softly rounded or chamfered with no sharp knife edges, no arch, no tombstone or headstone silhouette, no lattice, no perforations, no thin unsupported spans, flat stable base. Studio lighting, clean neutral background, minimal luxury editorial styling.`,
  },
];

export const getSku = (slug?: string) => ORIGINALS_SKUS.find((s) => s.slug === slug);
