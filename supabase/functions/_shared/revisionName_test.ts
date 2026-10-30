import { assertEquals } from "jsr:@std/assert@1";
import { nameFromRevision } from "./revisionName.ts";

Deno.test("reads the corrected name from the Hampton revision", () => {
  assertEquals(nameFromRevision("Name is Hampton"), "Hampton");
});

Deno.test("reads common ways of asking for a different name", () => {
  assertEquals(nameFromRevision("change the name to Bella please"), "Bella");
  assertEquals(nameFromRevision("his name should be Mr Biscuit."), "Mr Biscuit");
  assertEquals(nameFromRevision("spell it Maisie and turn the head left"), "Maisie");
  assertEquals(nameFromRevision("rename to Coco"), "Coco");
});

Deno.test("ignores revisions that only restyle the name", () => {
  assertEquals(nameFromRevision("make the name larger"), null);
  assertEquals(nameFromRevision("turn the head slightly to the left"), null);
  assertEquals(nameFromRevision(""), null);
});

Deno.test("never accepts a name longer than the lettering limit", () => {
  assertEquals(nameFromRevision("name is Supercalifragilisticexpialidocious"), null);
});
