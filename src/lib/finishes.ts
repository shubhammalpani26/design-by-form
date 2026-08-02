export interface FinishOption {
  name: string;
  filament: string;
  hex?: string;
}

/**
 * Normalizes the `available_finishes` JSONB column so it always returns a list
 * of `{ name, filament, hex? }` objects. Legacy string entries are mapped to
 * the product's default filament.
 */
export function normalizeFinishes(
  finishes: unknown,
  defaultFilament = "PLA BLACK",
): FinishOption[] {
  if (!Array.isArray(finishes)) return [];
  return finishes
    .map((f: unknown) => {
      if (typeof f === "string") {
        return { name: f, filament: defaultFilament };
      }
      if (f && typeof f === "object") {
        const obj = f as Record<string, unknown>;
        return {
          name: String(obj.name || obj.finish || "Finish"),
          filament: String(obj.filament || obj.color || defaultFilament),
          hex: obj.hex ? String(obj.hex) : undefined,
        };
      }
      return { name: "Finish", filament: defaultFilament };
    })
    .filter((f) => f.name && f.filament);
}

export function findFinishByName(
  finishes: FinishOption[],
  name: string,
): FinishOption | undefined {
  return finishes.find((f) => f.name === name);
}
