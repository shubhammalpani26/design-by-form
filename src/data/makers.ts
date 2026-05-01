export interface Maker {
  id: string;
  slug: string;
  name: string;
  location: string;
  shortDescription: string;
  expertise: string;
  process: string;
  tags: string[];
  yearsActive: string;
  specialties: string[];
  categoryMatch: string[];
}

export const makers: Maker[] = [
  {
    id: "1",
    slug: "cyanique",
    name: "Cyanique",
    location: "India",
    shortDescription: "Premium additive manufacturing fabricator excelling in statement accent furniture pieces for indoor as well as outdoor spaces.",
    expertise: "Specializing in advanced additive manufacturing techniques to produce bold, sculptural furniture that pushes the boundaries of form and function. Every piece is engineered for structural integrity and finished to gallery-grade standards.",
    process: "Our process begins with precision digital modeling, followed by layer-by-layer additive fabrication using high-grade composite materials. Each piece undergoes a multi-stage post-processing workflow including sanding, priming, and hand-finishing to achieve a flawless surface. Final quality inspection ensures every product meets exacting standards before delivery.",
    tags: ["Verified by Nyzora", "Additive Manufacturing", "Premium Fabrication"],
    yearsActive: "5+",
    specialties: ["Statement Pieces", "Accent Furniture", "Indoor & Outdoor", "Sculptural Decor"],
    categoryMatch: ["vases", "decor", "sculptures", "accent-furniture", "outdoor", "installations", "home-decor", "resin-furniture", "statement-pieces"],
  },
  {
    id: "6",
    slug: "sach-creations",
    name: "Sach Creations",
    location: "Vapi, India",
    shortDescription: "Artisan textile studio crafting premium tote bags and linen fabric goods with meticulous attention to material quality and finish.",
    expertise: "Specializing in hand-finished textile products using sustainably sourced linen and cotton blends. Known for clean construction, durable stitching, and refined minimalist aesthetics.",
    process: "Each product begins with carefully selected natural fabrics that are pre-washed and inspected for consistency. Patterns are precision-cut and assembled using reinforced stitching techniques. Every bag and textile piece undergoes quality checks for seam strength, alignment, and finish before final packaging.",
    tags: ["Verified by Nyzora", "Textile Specialist"],
    yearsActive: "6+",
    specialties: ["Tote Bags", "Linen Fabrics", "Textile Accessories"],
    categoryMatch: ["bags", "tote-bags", "textiles", "fabric-goods", "accessories"],
  },
  {
    id: "7",
    slug: "beni-enterprise",
    name: "Beni Enterprise",
    location: "Mumbai, India",
    shortDescription: "Premium woodwork studio crafting refined, design-forward furniture with an emphasis on detail and lasting elegance.",
    expertise: "Specializing in high-end solid wood furniture with intricate detailing and contemporary silhouettes. Known for blending traditional craftsmanship with modern design sensibilities to create statement pieces for discerning interiors.",
    process: "Each piece begins with hand-selected premium hardwoods, seasoned and acclimatized for stability. Designs are translated through precision carpentry, detailed hand-carving where required, and a multi-coat finishing process that enhances natural grain while ensuring lasting protection. Every product undergoes rigorous quality inspection before dispatch.",
    tags: ["Verified by Nyzora", "Premium Woodwork", "Design-Forward"],
    yearsActive: "10+",
    specialties: ["Designer Furniture", "Wood Detailing", "Statement Tables", "Custom Woodwork"],
    categoryMatch: ["tables", "dining-tables", "consoles", "wood-furniture", "shelving", "benches", "chairs", "seating", "coffee-tables"],
  },
];

// Per-product maker overrides (used for hand-curated traction products
// where the maker doesn't match the default category routing).
const PRODUCT_MAKER_OVERRIDES: Record<string, string> = {
  // Raina Jain - Atelier Designer Sofa → Beni Enterprise (woodwork + upholstery)
  "22222222-2222-2222-2222-000000000005": "beni-enterprise",
};

export const getMakerBySlug = (slug: string): Maker | undefined => {
  return makers.find((m) => m.slug === slug);
};

export const getMakerById = (id: string): Maker | undefined => {
  return makers.find((m) => m.id === id);
};

// Assign maker based on product category when possible, otherwise default to Cyanique
export const getMakerForProduct = (productId: string, category?: string): Maker => {
  // Hand-curated overrides win
  const overrideSlug = PRODUCT_MAKER_OVERRIDES[productId];
  if (overrideSlug) {
    const override = makers.find((m) => m.slug === overrideSlug);
    if (override) return override;
  }

  const cat = (category || "").toLowerCase();

  // Wood / traditional furniture → Benni Enterprises (limited to specific categories)
  const woodCategories = ["dining-tables", "consoles", "coffee-tables"];
  if (woodCategories.some((w) => cat === w)) return makers[2]; // Benni

  // Textile / bags → Sach Creations
  const textileCategories = ["bags", "tote-bags", "textiles", "fabric-goods", "accessories"];
  if (textileCategories.some((t) => cat.includes(t))) return makers[1]; // Sach

  // Everything else → Cyanique
  return makers[0];
};
