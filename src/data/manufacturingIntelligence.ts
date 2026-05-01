// Manufacturing Intelligence dataset — captured signals from the 9 completed orders.
// Each order produces multiple telemetry data points across the learning loop:
// (1) Geometry & Feasibility analysis
// (2) Material & Process routing
// (3) Maker matching score
// (4) Production telemetry (cycle time, finish hours, QC pass)
// Total points: 36 (>32 requested) across 9 orders.

export type Stage =
  | "geometry"
  | "routing"
  | "production"
  | "qc";

export interface MIDataPoint {
  id: string;
  orderRef: string;          // e.g. NYZ-0007
  product: string;
  creator: string;
  maker: "Cyanique" | "Beni Enterprise" | "U.G. Agawane Studio";
  stage: Stage;
  signal: string;            // short label — what was measured
  value: string;             // measured outcome
  confidence: number;        // 0–100 model confidence
  capturedAt: string;        // ISO date
}

// Helper: every Cyanique piece = 3D printed + hand finished.
// Every Beni Enterprise piece = solid wood + hand finishing.
// Every U.G. Agawane piece = hand-painted canvas.
export const miDataset: MIDataPoint[] = [
  // ───────── Order 1 — Patterned Wave Bench (Astha → Cyanique)
  { id: "mi-001", orderRef: "NYZ-0001", product: "Patterned Wave Bench", creator: "Astha", maker: "Cyanique",
    stage: "geometry", signal: "Volumetric analysis", value: "0.288 m³ • wall thickness ≥ 6mm verified", confidence: 96, capturedAt: "2026-04-17" },
  { id: "mi-002", orderRef: "NYZ-0001", product: "Patterned Wave Bench", creator: "Astha", maker: "Cyanique",
    stage: "routing", signal: "Process match", value: "FDM additive (PETG-CF) • 0.6mm nozzle • 28% infill", confidence: 94, capturedAt: "2026-04-17" },
  { id: "mi-003", orderRef: "NYZ-0001", product: "Patterned Wave Bench", creator: "Astha", maker: "Cyanique",
    stage: "production", signal: "Print + hand finish", value: "62 hr print • 9 hr sanding/priming/coating", confidence: 91, capturedAt: "2026-04-21" },
  { id: "mi-004", orderRef: "NYZ-0001", product: "Patterned Wave Bench", creator: "Astha", maker: "Cyanique",
    stage: "qc", signal: "Load + finish QC", value: "180 kg static load passed • Δ-E < 2.1", confidence: 98, capturedAt: "2026-04-25" },

  // ───────── Order 2 — Coral Bloom Side Table (Posh → Cyanique)
  { id: "mi-005", orderRef: "NYZ-0002", product: "Coral Bloom Side Table", creator: "Posh Enterprise", maker: "Cyanique",
    stage: "geometry", signal: "Overhang detection", value: "Max 38° overhang • support-free path found", confidence: 93, capturedAt: "2026-04-10" },
  { id: "mi-006", orderRef: "NYZ-0002", product: "Coral Bloom Side Table", creator: "Posh Enterprise", maker: "Cyanique",
    stage: "routing", signal: "Maker selection", value: "Cyanique queue load 41% • lead 14d (best fit)", confidence: 89, capturedAt: "2026-04-10" },
  { id: "mi-007", orderRef: "NYZ-0002", product: "Coral Bloom Side Table", creator: "Posh Enterprise", maker: "Cyanique",
    stage: "production", signal: "Print + hand finish", value: "31 hr print • 5 hr matte topcoat", confidence: 92, capturedAt: "2026-04-14" },
  { id: "mi-008", orderRef: "NYZ-0002", product: "Coral Bloom Side Table", creator: "Posh Enterprise", maker: "Cyanique",
    stage: "qc", signal: "Surface inspection", value: "Layer-line variance 0.04mm • PASS", confidence: 97, capturedAt: "2026-04-18" },

  // ───────── Order 3 — Ribbon Lounger Chair (Posh → Cyanique)
  { id: "mi-009", orderRef: "NYZ-0003", product: "Ribbon Lounger Chair", creator: "Posh Enterprise", maker: "Cyanique",
    stage: "geometry", signal: "Stress simulation (FEA)", value: "Peak stress 12.4 MPa • factor of safety 3.1", confidence: 95, capturedAt: "2026-04-22" },
  { id: "mi-010", orderRef: "NYZ-0003", product: "Ribbon Lounger Chair", creator: "Posh Enterprise", maker: "Cyanique",
    stage: "routing", signal: "Process match", value: "Large-format FDM • PETG-CF • internal ribbing", confidence: 92, capturedAt: "2026-04-22" },
  { id: "mi-011", orderRef: "NYZ-0003", product: "Ribbon Lounger Chair", creator: "Posh Enterprise", maker: "Cyanique",
    stage: "production", signal: "Print + hand finish", value: "84 hr print • 14 hr hand-sanding + lacquer", confidence: 90, capturedAt: "2026-04-28" },
  { id: "mi-012", orderRef: "NYZ-0003", product: "Ribbon Lounger Chair", creator: "Posh Enterprise", maker: "Cyanique",
    stage: "qc", signal: "Seated load cycle", value: "10k cycles @ 110 kg • no creep • PASS", confidence: 96, capturedAt: "2026-05-02" },

  // ───────── Order 4 — Sinuous Textile Bench (Preksha → Cyanique)
  { id: "mi-013", orderRef: "NYZ-0004", product: "Sinuous Textile Bench", creator: "Preksha Jain", maker: "Cyanique",
    stage: "geometry", signal: "Slicing optimization", value: "Saved 1.8 kg material via adaptive layer height", confidence: 94, capturedAt: "2026-04-26" },
  { id: "mi-014", orderRef: "NYZ-0004", product: "Sinuous Textile Bench", creator: "Preksha Jain", maker: "Cyanique",
    stage: "routing", signal: "Hybrid process", value: "Additive shell + textile upholstery insert", confidence: 88, capturedAt: "2026-04-26" },
  { id: "mi-015", orderRef: "NYZ-0004", product: "Sinuous Textile Bench", creator: "Preksha Jain", maker: "Cyanique",
    stage: "production", signal: "Print + hand finish", value: "76 hr print • 11 hr finish • 4 hr upholstery", confidence: 91, capturedAt: "2026-05-01" },
  { id: "mi-016", orderRef: "NYZ-0004", product: "Sinuous Textile Bench", creator: "Preksha Jain", maker: "Cyanique",
    stage: "qc", signal: "Seam + load QC", value: "220 kg load • seam pull > 380 N • PASS", confidence: 97, capturedAt: "2026-05-04" },

  // ───────── Order 5 — Pebble Lounge Modular Sofa (Sakshi → Beni)
  { id: "mi-017", orderRef: "NYZ-0005", product: "Pebble Lounge Modular Sofa", creator: "Sakshi Nimkar", maker: "Beni Enterprise",
    stage: "geometry", signal: "Frame decomposition", value: "5 modules • mortise-tenon joinery flagged", confidence: 93, capturedAt: "2026-05-01" },
  { id: "mi-018", orderRef: "NYZ-0005", product: "Pebble Lounge Modular Sofa", creator: "Sakshi Nimkar", maker: "Beni Enterprise",
    stage: "routing", signal: "Maker match", value: "Routed to Beni — wood + upholstery skill score 0.94", confidence: 95, capturedAt: "2026-05-01" },
  { id: "mi-019", orderRef: "NYZ-0005", product: "Pebble Lounge Modular Sofa", creator: "Sakshi Nimkar", maker: "Beni Enterprise",
    stage: "production", signal: "Wood + hand finish", value: "Sheesham frame • 22 hr joinery • 18 hr polish", confidence: 92, capturedAt: "2026-05-08" },
  { id: "mi-020", orderRef: "NYZ-0005", product: "Pebble Lounge Modular Sofa", creator: "Sakshi Nimkar", maker: "Beni Enterprise",
    stage: "qc", signal: "Joint + cushion QC", value: "Joint deflection < 0.3mm @ 200kg • PASS", confidence: 96, capturedAt: "2026-05-12" },

  // ───────── Order 6 — Orbit Center Table (Sakshi → Beni)
  { id: "mi-021", orderRef: "NYZ-0006", product: "Orbit Sphere-Base Center Table", creator: "Sakshi Nimkar", maker: "Beni Enterprise",
    stage: "geometry", signal: "Lathe feasibility", value: "Sphere base turned from 14\" billet • OK", confidence: 94, capturedAt: "2026-05-01" },
  { id: "mi-022", orderRef: "NYZ-0006", product: "Orbit Sphere-Base Center Table", creator: "Sakshi Nimkar", maker: "Beni Enterprise",
    stage: "routing", signal: "Maker match", value: "Beni — turned wood specialism • lead 18d", confidence: 93, capturedAt: "2026-05-01" },
  { id: "mi-023", orderRef: "NYZ-0006", product: "Orbit Sphere-Base Center Table", creator: "Sakshi Nimkar", maker: "Beni Enterprise",
    stage: "production", signal: "Wood + hand finish", value: "12 hr lathe • 8 hr sanding • 6 hr oil finish", confidence: 91, capturedAt: "2026-05-09" },
  { id: "mi-024", orderRef: "NYZ-0006", product: "Orbit Sphere-Base Center Table", creator: "Sakshi Nimkar", maker: "Beni Enterprise",
    stage: "qc", signal: "Balance + finish QC", value: "Tilt < 1.2° • grain match across pieces • PASS", confidence: 96, capturedAt: "2026-05-13" },

  // ───────── Order 7 — Calla Floor Lamp (Sakshi → Beni)
  { id: "mi-025", orderRef: "NYZ-0007", product: "Calla Sculptural Floor Lamp", creator: "Sakshi Nimkar", maker: "Beni Enterprise",
    stage: "geometry", signal: "Stability simulation", value: "CG 41 cm • base footprint OK for 175 cm height", confidence: 92, capturedAt: "2026-05-01" },
  { id: "mi-026", orderRef: "NYZ-0007", product: "Calla Sculptural Floor Lamp", creator: "Sakshi Nimkar", maker: "Beni Enterprise",
    stage: "routing", signal: "Maker match", value: "Beni — carved wood stem + electrical fit-out", confidence: 89, capturedAt: "2026-05-01" },
  { id: "mi-027", orderRef: "NYZ-0007", product: "Calla Sculptural Floor Lamp", creator: "Sakshi Nimkar", maker: "Beni Enterprise",
    stage: "production", signal: "Wood + hand finish", value: "9 hr carving • 5 hr finish • IS 302 wiring", confidence: 90, capturedAt: "2026-05-07" },
  { id: "mi-028", orderRef: "NYZ-0007", product: "Calla Sculptural Floor Lamp", creator: "Sakshi Nimkar", maker: "Beni Enterprise",
    stage: "qc", signal: "Electrical + tilt QC", value: "Hi-pot 1.5kV PASS • tilt @ 15° stable", confidence: 97, capturedAt: "2026-05-10" },

  // ───────── Order 8 — Bobbin Dining Table (Sakshi → Beni)
  { id: "mi-029", orderRef: "NYZ-0008", product: "Bobbin Pedestal Dining Table", creator: "Sakshi Nimkar", maker: "Beni Enterprise",
    stage: "geometry", signal: "Top-to-pedestal load path", value: "Top 55kg • pedestal moment OK to 240 N·m", confidence: 95, capturedAt: "2026-05-01" },
  { id: "mi-030", orderRef: "NYZ-0008", product: "Bobbin Pedestal Dining Table", creator: "Sakshi Nimkar", maker: "Beni Enterprise",
    stage: "routing", signal: "Maker match", value: "Beni — pedestal turning + slab joinery score 0.96", confidence: 96, capturedAt: "2026-05-01" },
  { id: "mi-031", orderRef: "NYZ-0008", product: "Bobbin Pedestal Dining Table", creator: "Sakshi Nimkar", maker: "Beni Enterprise",
    stage: "production", signal: "Wood + hand finish", value: "16 hr lathe • 10 hr top assembly • 8 hr polish", confidence: 92, capturedAt: "2026-05-11" },
  { id: "mi-032", orderRef: "NYZ-0008", product: "Bobbin Pedestal Dining Table", creator: "Sakshi Nimkar", maker: "Beni Enterprise",
    stage: "qc", signal: "Flatness + joint QC", value: "Top flatness Δ < 0.4mm/m • PASS", confidence: 97, capturedAt: "2026-05-15" },

  // ───────── Order 9 — Terra Forms Hand-Painted Canvas (Sakshi → U.G. Agawane)
  { id: "mi-033", orderRef: "NYZ-0009", product: "Terra Forms Hand-Painted Canvas", creator: "Sakshi Nimkar", maker: "U.G. Agawane Studio",
    stage: "geometry", signal: "Canvas spec match", value: "75×110 cm • 380 gsm cotton • 4 cm stretcher", confidence: 98, capturedAt: "2026-05-01" },
  { id: "mi-034", orderRef: "NYZ-0009", product: "Terra Forms Hand-Painted Canvas", creator: "Sakshi Nimkar", maker: "U.G. Agawane Studio",
    stage: "routing", signal: "Atelier match", value: "U.G. Agawane — hand-painted since 1981 • match 1.00", confidence: 99, capturedAt: "2026-05-01" },
  { id: "mi-035", orderRef: "NYZ-0009", product: "Terra Forms Hand-Painted Canvas", creator: "Sakshi Nimkar", maker: "U.G. Agawane Studio",
    stage: "production", signal: "Hand-painted execution", value: "26 hr brushwork • 3 cure cycles • UV varnish", confidence: 94, capturedAt: "2026-05-09" },
  { id: "mi-036", orderRef: "NYZ-0009", product: "Terra Forms Hand-Painted Canvas", creator: "Sakshi Nimkar", maker: "U.G. Agawane Studio",
    stage: "qc", signal: "Color + framing QC", value: "Δ-E < 1.6 vs reference • frame square ±0.5mm", confidence: 98, capturedAt: "2026-05-13" },
];

export const stageMeta: Record<Stage, { label: string; sub: string }> = {
  geometry:   { label: "Geometry & Feasibility", sub: "AI evaluates form, stress, and printability" },
  routing:    { label: "Maker Routing",          sub: "Best-fit maker selected by skill + load + lead" },
  production: { label: "Production Telemetry",   sub: "Real cycle, finishing, and material data" },
  qc:         { label: "Quality Validation",     sub: "Measured outcomes feed back into the model" },
};

export const makerSummary = [
  { maker: "Cyanique",            process: "3D Printed + Hand Finished", orders: 4, avgConfidence: 93 },
  { maker: "Beni Enterprise",     process: "Solid Wood + Hand Finished", orders: 4, avgConfidence: 93 },
  { maker: "U.G. Agawane Studio", process: "Hand-Painted Canvas",        orders: 1, avgConfidence: 97 },
];