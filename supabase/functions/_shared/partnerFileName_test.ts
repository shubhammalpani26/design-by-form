import { assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { partnerFileName } from "./slant3d.ts";

// Slant overwrites a file in place when the same name is re-uploaded, so a
// corrected file must never reuse the name of the file on an earlier order.
Deno.test("different file contents get different partner file names", () => {
  const before = partnerFileName("pet-portrait-sculpture-15029302.stl", "44051850bb6d0b7daadc");
  const after = partnerFileName("pet-portrait-sculpture-15029302.stl", "5c6c629e67e7907484db");
  assertNotEquals(before, after);
  assertEquals(after, "pet-portrait-sculpture-15029302-5c6c629e67.stl");
});

Deno.test("same contents keep a stable name", () => {
  assertEquals(
    partnerFileName("piece.stl", "abcdef0123456789"),
    partnerFileName("piece", "abcdef0123456789"),
  );
});
