import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { PLINTH_SHAPE } from "./plinthPrompt.ts";

Deno.test("render prompts describe the printed base, never a filleted one", () => {
  for (const f of ["../originals-preview/index.ts", "../admin-regenerate-render/index.ts"]) {
    const src = Deno.readTextFileSync(new URL(f, import.meta.url));
    assert(src.includes("PLINTH_SHAPE"), f);
    assert(!/softly filleted|filleted transition/i.test(src), f);
  }
  assert(/straight vertical sides/.test(PLINTH_SHAPE) && /straight-sloped shoulder/.test(PLINTH_SHAPE));
});
