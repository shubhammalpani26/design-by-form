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
  fields: { key: string; label: string; placeholder: string }[];
  promptTemplate: (values: Record<string, string>) => string;
}

/** Every Original is printed as a single part inside a 220 x 220 x 220 mm envelope. */
export const MAX_ENVELOPE_MM = 220;

export const ORIGINALS_SKUS: OriginalSku[] = [
  {
    slug: "pet-silhouette-keepsake",
    name: "Pet Silhouette Piece",
    tagline: "Their profile, sculpted in relief — name and date engraved.",
    description:
      "A dimensional, hand-feel sculpture of your pet's side profile on a weighted plinth, with their name and date engraved into the front face. Send a photo, we translate it into a clean sculpted form — solid, substantial, no fragile parts.",
    price: 68,
    image: petImg,
    finish: "Matte bone / sand / charcoal",
    dimensions: "196 × 171 × 62 mm",
    fields: [
      { key: "petName", label: "Pet's name", placeholder: "Milo" },
      { key: "breed", label: "Breed or type", placeholder: "Golden retriever" },
      { key: "date", label: "Date to engrave (optional)", placeholder: "03.14.2019" },
    ],
    promptTemplate: (v) =>
      `A solid three-dimensional sculptural side-profile personal piece of a ${v.breed || "dog"} named ${v.petName || "my pet"}, thick extruded matte stone-look form with softly chamfered edges, standing on a heavy rectangular plinth engraved with "${(v.petName || "MILO").toUpperCase()}" and "${v.date || "03.14.2019"}" in fine thin sans-serif capitals, minimal and monolithic, no thin fragile details, flat stable base.`,
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
    promptTemplate: (v) =>
      `A solid matte charcoal sculptural personal piece in landscape horizontal format, wider than tall, shaped like a stepped topographic landscape section with smooth horizontal contour terraces descending diagonally, interrupted by one flat polished band engraved with the coordinates "${v.coordinates || "40.7128° N, 74.0060° W"}" in fine serif type and the date "${v.date || "06.23.24"}" below, low chamfered rectangular base, angular and monolithic, no arch, no rounded tombstone top, no lattice, no perforations, no thin unsupported spans, flat stable base.`,
  },
];

export const getSku = (slug?: string) => ORIGINALS_SKUS.find((s) => s.slug === slug);
