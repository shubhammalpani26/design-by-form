import { assertEquals } from "jsr:@std/assert@1";
import { finalFileClosed, previewHoldReasons } from "./printabilityHold.ts";

const messy = { engineering: { printability: { holes: 136, nonManifoldEdges: 1150 } } };

Deno.test("raw-model report holds when the finished file is not proven closed", () => {
  assertEquals(previewHoldReasons(messy, false), ["136 holes", "1150 non-manifold edges"]);
});

Deno.test("raw-model report is ignored once the finished file is closed", () => {
  assertEquals(previewHoldReasons(messy, true), []);
});

Deno.test("unscreened photo holds even when the file is closed", () => {
  assertEquals(previewHoldReasons({ ...messy, photo_screen: "unscreened" }, true).length, 1);
});

Deno.test("small raw-model noise never holds", () => {
  assertEquals(previewHoldReasons({ engineering: { printability: { holes: 2, nonManifoldEdges: 83 } } }, false), []);
});

Deno.test("final file counts as closed only with zero open edges and a fingerprint", () => {
  assertEquals(finalFileClosed({ openEdges: 0, fileSha256: "abc" }), true);
  assertEquals(finalFileClosed({ openEdges: 3, fileSha256: "abc" }), false);
  assertEquals(finalFileClosed({ openEdges: 0 }), false);
  assertEquals(finalFileClosed({ meshyRepair: { kept: true } }), false);
  assertEquals(finalFileClosed(null), false);
});
