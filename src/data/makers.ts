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
  categoryMatch: string[]; // product categories this maker handles
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
    categoryMatch: ["vases", "decor", "sculptures", "accent-furniture", "outdoor"],
  },
  {
    id: "2",
    slug: "teakworks-studio",
    name: "TeakWorks Studio",
    location: "Jodhpur",
    shortDescription: "15+ years in solid wood craftsmanship, specializing in hand-finished premium furniture.",
    expertise: "Known for intricate joinery techniques and sustainable sourcing of premium hardwoods. Every piece undergoes a 12-step finishing process for lasting beauty.",
    process: "Starting with carefully selected and seasoned hardwoods, each piece is hand-cut and shaped using traditional joinery methods. The wood is assembled, sanded through multiple grits, and finished with natural oils and lacquers in a meticulous 12-step process that ensures durability and a warm, tactile finish.",
    tags: ["Verified by Nyzora", "Solid Wood Specialist"],
    yearsActive: "15+",
    specialties: ["Dining Tables", "Benches", "Consoles"],
    categoryMatch: ["tables", "dining-tables", "benches", "consoles", "wood-furniture"],
  },
  {
    id: "3",
    slug: "formcraft-industries",
    name: "FormCraft Industries",
    location: "Pune",
    shortDescription: "Expert metal fabricators creating sculptural furniture with industrial precision and artistic flair.",
    expertise: "Combining CNC precision with artisan welding to produce furniture that blurs the line between art and function. Specialists in powder-coated and brushed metal finishes.",
    process: "Designs are translated into precise CNC cutting files. Raw metal is laser-cut, bent, and welded by skilled artisans. Surfaces are treated with anti-corrosion primers before being powder-coated or hand-brushed to achieve the desired texture. Each weld is inspected for structural integrity.",
    tags: ["Verified by Nyzora", "Metal Fabrication"],
    yearsActive: "12+",
    specialties: ["Coffee Tables", "Installations", "Shelving"],
    categoryMatch: ["coffee-tables", "shelving", "metal-furniture", "installations"],
  },
  {
    id: "4",
    slug: "artisan-resin-co",
    name: "Artisan Resin Co.",
    location: "Bengaluru",
    shortDescription: "Pioneers in composite and resin-based furniture, blending modern materials with timeless design.",
    expertise: "Innovators in high-grade resin and composite fibre construction. Each piece is cast, cured, and hand-finished to achieve museum-quality surfaces.",
    process: "The process starts with mold creation from the digital design. High-grade resin is mixed with pigments and poured into precision molds, then slow-cured under controlled conditions. After demolding, each piece is hand-sanded, polished, and sealed to reveal deep, luminous surfaces with exceptional clarity.",
    tags: ["Verified by Nyzora", "Composite & Resin"],
    yearsActive: "8+",
    specialties: ["Vases", "Decor", "Statement Pieces"],
    categoryMatch: ["vases", "decor", "statement-pieces", "resin-furniture"],
  },
  {
    id: "5",
    slug: "heritage-upholstery-works",
    name: "Heritage Upholstery Works",
    location: "Jaipur",
    shortDescription: "Third-generation upholstery craftsmen delivering world-class comfort with artisanal precision.",
    expertise: "From hand-tied springs to precision-cut foam and premium fabric selection, every seat is built for decades of comfort and elegance.",
    process: "Frames are built from kiln-dried hardwood and fitted with hand-tied eight-way spring systems. High-resilience foam is precision-cut and layered for optimal comfort. Premium fabrics are carefully pattern-matched and upholstered by master craftsmen who ensure every seam, tuft, and pleat is flawless.",
    tags: ["Verified by Nyzora", "Upholstery"],
    yearsActive: "20+",
    specialties: ["Chairs", "Lounge Seating", "Cushioned Benches"],
    categoryMatch: ["chairs", "seating", "lounge", "upholstered-furniture"],
  },
];

export const getMakerBySlug = (slug: string): Maker | undefined => {
  return makers.find((m) => m.slug === slug);
};

export const getMakerById = (id: string): Maker | undefined => {
  return makers.find((m) => m.id === id);
};

// Default maker for products that don't have a specific assignment
export const getDefaultMaker = (): Maker => {
  return makers[0]; // Cyanique as default
};
