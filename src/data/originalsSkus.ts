import petImg from "@/assets/originals-pet-silhouette.jpg";
import nurseryImg from "@/assets/originals-nursery-name.jpg";
import weddingImg from "@/assets/originals-wedding-coordinates.jpg";

export interface OriginalSku {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number; // USD
  image: string;
  finish: string;
  dimensions: string;
  fields: { key: string; label: string; placeholder: string; options?: string[] }[];
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

export const ORIGINALS_SKUS: OriginalSku[] = [
  {
    slug: "pet-silhouette-keepsake",
    name: "Pet Sculpture Piece",
    tagline: "Their head sculpted in full three dimensions — name and date engraved.",
    description:
      "A fully three-dimensional sculpture of your pet's head and shoulders on a weighted plinth, with their name and date engraved into the front face. Rounded, carved volume you can hold and turn — cheeks, muzzle, brow and ears modelled all the way around, not a flat cut-out. The eyes are carved as deep almond sockets with defined lids and a raised iris dome, so they read as eyes in any light without any fragile or glued-in parts. Fine horizontal strata run across the form like layered stone.",
    price: 59,
    image: petImg,
    finish: "Matte bone / sand / charcoal",
    dimensions: "196 × 150 × 120 mm",
    fields: [
      { key: "petName", label: "Pet's name", placeholder: "Milo" },
      { key: "petType", label: "Kind of pet", placeholder: "Choose a pet", options: PET_TYPES },
      { key: "breed", label: "Breed or type", placeholder: "Golden retriever" },
      { key: "date", label: "Date to engrave (optional)", placeholder: "03.14.2019" },
    ],
    sizes: [
      { key: "petite", label: "Petite", size: "120 mm", price: 59, note: "Desk or shelf" },
      { key: "standard", label: "Standard", size: "140 mm", price: 89, note: "Most loved" },
      { key: "statement", label: "Statement", size: "196 mm", price: 139, note: "Full presence" },
    ],
    photo: {
      label: "Upload a photo of your pet",
      hint: "One clear, well-lit photo of their face. Front or three-quarter view works best.",
      promptTemplate: (v) =>
        `Using the animal in the reference photo, sculpt a fully three-dimensional carved stone bust of that exact animal's head and shoulders, keeping its recognisable face, breed, ear shape, muzzle length and markings as sculpted form. Three-quarter view, rounded modelled volume front to back — absolutely not a flat silhouette, not an extruded profile plate, not a relief panel. Surface finish is layered banded stone: fine continuous horizontal strata wrapping the whole form like sedimentary rock, deliberate and even. The eyes are sculpted, not painted: deep almond sockets carved at least 2 mm into the brow with defined upper and lower lids and a smooth raised iris dome inside each socket — no glass, no inserts, no glossy beads, no paint, no thin whiskers or fine hairs. The bust sits on a heavy rectangular plinth engraved with "${(v.petName || "MILO").toUpperCase()}"${v.date ? ` and "${v.date}"` : ""} in fine thin sans-serif capitals. Monolithic and solid, single part, no thin fragile details, flat stable base, matte bone-coloured composite, studio lighting on a clean neutral background showing depth and shadow.`,
    },
    promptTemplate: (v) =>
      `A fully three-dimensional carved sculpture of the head and shoulders of a ${v.breed || v.petType || "dog"}${v.petType ? ` (${v.petType})` : ""} named ${v.petName || "my pet"}, shown in a three-quarter view so the depth is obvious: rounded modelled muzzle, brow, cheeks and ears sculpted in the round with real volume front to back, absolutely not a flat silhouette, not an extruded profile plate, not a relief panel, no thick flat slab. Surface finish is layered banded stone: fine continuous horizontal strata wrapping the whole form like sedimentary rock or a contour model, deliberate and even, reading as an intentional material texture. The eyes are sculpted, not painted: deep almond eye sockets carved at least 2 mm into the brow with clearly defined upper and lower lids and a smooth raised iris dome inside each socket, catching shadow — no glass, no inserts, no glossy black beads, no painted detail, no thin whiskers or fine hairs. The sculpture sits on a heavy rectangular plinth engraved with "${(v.petName || "MILO").toUpperCase()}" and "${v.date || "03.14.2019"}" in fine thin sans-serif capitals. Monolithic and solid, no thin fragile details, flat stable base, studio lighting showing depth and shadow.`,
  },
  {
    slug: "nursery-name-date",
    name: "Baby Name & Date Piece",
    tagline: "The first thing they ever owned with their name on it.",
    description:
      "A low, landscape-format sculpture with a soft rising wave crest and fine vertical fluting, opening onto a smooth polished panel where the baby's name and birth date are engraved. Sits on a shelf, a dresser, or a changing table — quietly, for years.",
    price: 54,
    image: nurseryImg,
    finish: "Matte sand / bone",
    dimensions: "210 × 118 × 55 mm",
    fields: [
      { key: "childName", label: "Baby's name", placeholder: "Oliver" },
      { key: "date", label: "Birth date", placeholder: "12.05.2024" },
    ],
    sizes: [{ key: "standard", label: "Standard", size: "210 mm", price: 54 }],
    promptTemplate: (v) =>
      `A solid matte sand-coloured personal piece in landscape horizontal format, wider than tall, with a soft asymmetric rising wave crest silhouette and fine vertical fluting carved across its face, opening onto a smooth polished inset panel engraved with the name "${(v.childName || "OLIVER").toUpperCase()}" and the date "${v.date || "12.05.2024"}" in fine thin sans-serif capitals, sitting on a low chamfered rectangular plinth, no arch, no rounded tombstone top, no perforations, no thin unsupported spans, flat stable base, minimal luxury editorial styling.`,
  },
  {
    slug: "wedding-coordinates",
    name: "Wedding Coordinates Piece",
    tagline: "The exact place it happened, made into an object.",
    description:
      "A low charcoal landscape block carved into stepped topographic terraces that descend diagonally, split by a smooth band engraved with your latitude, longitude and date. A first-anniversary gift that doesn't end up in a drawer.",
    price: 79,
    image: weddingImg,
    finish: "Matte charcoal / bone",
    dimensions: "215 × 105 × 60 mm",
    fields: [
      { key: "coordinates", label: "Coordinates", placeholder: "40.7128° N, 74.0060° W" },
      { key: "date", label: "Date", placeholder: "06.23.24" },
    ],
    sizes: [{ key: "standard", label: "Standard", size: "215 mm", price: 79 }],
    promptTemplate: (v) =>
      `A solid matte charcoal sculptural personal piece in landscape horizontal format, wider than tall, shaped like a stepped topographic landscape section with smooth horizontal contour terraces descending diagonally, interrupted by one flat polished band engraved with the coordinates "${v.coordinates || "40.7128° N, 74.0060° W"}" in fine serif type and the date "${v.date || "06.23.24"}" below, low chamfered rectangular base, angular and monolithic, no arch, no rounded tombstone top, no lattice, no perforations, no thin unsupported spans, flat stable base.`,
  },
];

export const getSku = (slug?: string) => ORIGINALS_SKUS.find((s) => s.slug === slug);
