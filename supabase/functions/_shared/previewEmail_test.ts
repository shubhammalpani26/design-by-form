import { assertEquals } from "jsr:@std/assert@1";
import { decideReminder, normalizeEmail, previewEmailSubject, reminderDueAt } from "./previewEmail.ts";

const optIn = new Date("2026-11-02T10:00:00Z");

Deno.test("the reminder is due exactly 2 days after opting in", () => {
  assertEquals(reminderDueAt(optIn).toISOString(), "2026-11-04T10:00:00.000Z");
});

Deno.test("no reminder before the 2 days are up", () => {
  const d = decideReminder({
    now: new Date("2026-11-04T09:59:00Z"),
    dueAt: reminderDueAt(optIn),
    reminderSentAt: null,
    previewExists: true,
    hasPaidOrder: false,
  });
  assertEquals(d, { send: false, reason: "not_due" });
});

Deno.test("one reminder is sent once due", () => {
  const d = decideReminder({
    now: new Date("2026-11-04T10:30:00Z"),
    dueAt: reminderDueAt(optIn),
    reminderSentAt: null,
    previewExists: true,
    hasPaidOrder: false,
  });
  assertEquals(d, { send: true });
});

Deno.test("never a second reminder", () => {
  const d = decideReminder({
    now: new Date("2026-11-10T10:00:00Z"),
    dueAt: reminderDueAt(optIn),
    reminderSentAt: new Date("2026-11-04T10:30:00Z"),
    previewExists: true,
    hasPaidOrder: false,
  });
  assertEquals(d, { send: false, reason: "already_sent" });
});

Deno.test("no reminder once they have paid", () => {
  const d = decideReminder({
    now: new Date("2026-11-04T10:30:00Z"),
    dueAt: reminderDueAt(optIn),
    reminderSentAt: null,
    previewExists: true,
    hasPaidOrder: true,
  });
  assertEquals(d, { send: false, reason: "paid" });
});

Deno.test("email addresses are checked and lower-cased", () => {
  assertEquals(normalizeEmail("  Jane.Doe@Example.com "), "jane.doe@example.com");
  assertEquals(normalizeEmail("not-an-email"), null);
  assertEquals(normalizeEmail("a@b"), null);
});

Deno.test("pet previews are emailed with the pet's name and pet wording", () => {
  assertEquals(previewEmailSubject("pet-portrait-sculpture", { heading: " Nyra " }), {
    kind: "pet", petName: "Nyra", pieceName: "",
  });
});

Deno.test("baby and wedding previews are named by the piece, never as a pet", () => {
  assertEquals(previewEmailSubject("nursery-name-date", { heading: "OLIVER" }), {
    kind: "piece", petName: "", pieceName: "Baby Name & Date Piece",
  });
  assertEquals(previewEmailSubject("wedding-coordinates", { heading: "40.7128° N, 74.0060° W" }), {
    kind: "piece", petName: "", pieceName: "Wedding Coordinates Piece",
  });
});
