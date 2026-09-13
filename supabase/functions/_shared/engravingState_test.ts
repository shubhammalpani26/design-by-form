import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { preservedSourcePrintFile, reusableOrderPrintFile } from "./engravingState.ts";

Deno.test("legacy engraved files are never reused as engraving sources", () => {
  const row = {
    print_file_url: "https://example.test/piece-engraved.stl",
    engraved_text: "MILO",
    engraving_meta: { face: "-y" },
  };
  assertEquals(reusableOrderPrintFile(row, "MILO"), null);
});

Deno.test("only an exact verified v3 reinforced engraving is reused", () => {
  const row = {
    print_file_url: "https://example.test/piece-engraved-v2.stl",
    engraved_text: "MILO",
    engraving_meta: { placementVersion: 3, heftVersion: 1, placementVerified: true },
  };
  assertEquals(reusableOrderPrintFile(row, "MILO"), row.print_file_url);
  assertEquals(reusableOrderPrintFile(row, "TOBY"), null);
});

Deno.test("reinforced unlettered files and preserved sources remain available", () => {
  const plain = {
    print_file_url: "https://example.test/source.stl",
    engraved_text: null,
    engraving_meta: { heftVersion: 1 },
  };
  assertEquals(reusableOrderPrintFile(plain, "MILO"), plain.print_file_url);

  const engraved = {
    print_file_url: "https://example.test/engraved.stl",
    engraved_text: "MILO",
    engraving_meta: { sourcePrintFileUrl: plain.print_file_url },
  };
  assertEquals(preservedSourcePrintFile(engraved), plain.print_file_url);
});

Deno.test("legacy unreinforced files are rebuilt", () => {
  const plain = { print_file_url: "https://example.test/source.stl", engraved_text: null };
  assertEquals(reusableOrderPrintFile(plain, "MILO"), null);
  const legacy = {
    print_file_url: "https://example.test/piece-engraved-v2.stl",
    engraved_text: "MILO",
    engraving_meta: { placementVersion: 2, placementVerified: true },
  };
  assertEquals(reusableOrderPrintFile(legacy, "MILO"), null);
});