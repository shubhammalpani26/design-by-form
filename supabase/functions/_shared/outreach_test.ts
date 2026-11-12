import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  classifyReply, etToUtc, finalizeBody, nextSendSlot, normalizeEmail, OPT_OUT_LINE, remainingToday,
  splitBatch, waveTimes,
} from "./outreach.ts";

const etHour = (d: Date) =>
  Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", hourCycle: "h23" }).format(d));

Deno.test("100 a day splits by category share", () => {
  const out = splitBatch([
    { slug: "petfluencers", share: 40, available: 500 },
    { slug: "pet_boutiques", share: 20, available: 500 },
    { slug: "vet_groomers", share: 20, available: 500 },
    { slug: "memorial_stores", share: 20, available: 500 },
  ], 100);
  assertEquals(out, { petfluencers: 40, pet_boutiques: 20, vet_groomers: 20, memorial_stores: 20 });
});

Deno.test("a category that runs out hands its places to the others", () => {
  const out = splitBatch([
    { slug: "petfluencers", share: 10, available: 3 },
    { slug: "pet_boutiques", share: 5, available: 50 },
    { slug: "vet_groomers", share: 5, available: 50 },
  ], 20);
  assertEquals(out.petfluencers, 3);
  assertEquals(out.pet_boutiques + out.vet_groomers, 17);
});

Deno.test("never takes more people than are waiting", () => {
  const out = splitBatch([{ slug: "a", share: 1, available: 4 }, { slug: "b", share: 1, available: 2 }], 25);
  assertEquals(out, { a: 4, b: 2 });
});

Deno.test("daily total is respected and hard-capped at 150", () => {
  assertEquals(remainingToday(25, 20), 5);
  assertEquals(remainingToday(25, 30), 0);
  assertEquals(remainingToday(500, 0), 150);
});

Deno.test("waves of 20 go two hours apart, only 9am–6pm Eastern", () => {
  const now = etToUtc(2026, 11, 12, 10, 0); // 10:00 ET
  const t = waveTimes(now, 100, 20);
  assertEquals(t.length, 100);
  assertEquals(etHour(t[0]), 10);
  assertEquals(etHour(t[20]), 12);
  assertEquals(etHour(t[40]), 14);
  assertEquals(etHour(t[60]), 16);
  // 18:00 is outside the window, so wave 5 rolls to the next morning at 9.
  assertEquals(etHour(t[80]), 9);
  assert(t[80].getTime() - t[0].getTime() > 20 * 3_600_000);
  for (const d of t) { const h = etHour(d); assert(h >= 9 && h < 18, `hour ${h}`); }
});

Deno.test("clicking at night schedules the first wave for 9am Eastern", () => {
  const night = etToUtc(2026, 11, 12, 23, 30);
  assertEquals(etHour(nextSendSlot(night)), 9);
  const early = etToUtc(2026, 11, 12, 6, 0);
  assertEquals(nextSendSlot(early).getTime(), etToUtc(2026, 11, 12, 9).getTime());
});

Deno.test("every email ends with the signature and the opt-out line exactly once", () => {
  const out = finalizeBody("Hi Liz,\n\nLovely post.\n\nWarmly,\nShubham\n\nReply \"no thanks\" and I won't email again.");
  assertEquals(out.split(OPT_OUT_LINE).length - 1, 1);
  assert(out.endsWith(`Founder, Nyzora\n\n${OPT_OUT_LINE}`));
  assertEquals(out.split("Shubham").length - 1, 1);
  const plain = finalizeBody("Hi there,\n\nShort note.");
  assert(plain.includes(OPT_OUT_LINE));
});

Deno.test("replies are sorted into bounce, opt-out, reply", () => {
  assertEquals(classifyReply("Mail Delivery Subsystem <mailer-daemon@googlemail.com>", "Delivery Status Notification (Failure)", ""), "bounced");
  assertEquals(classifyReply("Jen <jen@shop.com>", "Re: hi", "No thanks, we're all set"), "opted_out");
  assertEquals(classifyReply("Jen <jen@shop.com>", "Re: hi", "Sounds lovely! Here is a photo"), "replied");
});

Deno.test("emails are validated and lower-cased", () => {
  assertEquals(normalizeEmail("  Jill@HealingWithAnimals.com "), "jill@healingwithanimals.com");
  assertEquals(normalizeEmail("not an email"), null);
});
