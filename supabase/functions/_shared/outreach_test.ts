import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  classifyReply, emailHtml, rawEmail, splitForPhoto, ensureFirst30, ensureBusinessShare, ensurePartnerShare, BUSINESS_SHARE_LINE, CREATOR_SHARE_LINE, etToUtc, finalizeBody, FIRST30_LINE, nextSendSlot, normalizeEmail, OPT_OUT_LINE,
  remainingToday, splitBatch, waveTimes, findTargets, isCheckableUrl, emailOnPage,
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
  // A whole wave is due at once, so tapping Send sends the first 20 right away.
  assertEquals(t[19].getTime(), t[0].getTime());
  assertEquals(t[0].getTime(), now.getTime());
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

Deno.test("creator emails always carry the first-30 line; businesses never do", () => {
  const creator = ensureFirst30("Hi Liz,\n\nLovely post about Rosebud.", true);
  assert(creator.includes(FIRST30_LINE));
  const already = ensureFirst30(`Hi Liz,\n\n${FIRST30_LINE}`, true);
  assertEquals(already.split("first 30").length - 1, 1);
  const biz = ensureFirst30("Hi team,\n\nA free display piece for your shop.", false);
  assert(!biz.includes("first 30"));
});

Deno.test("business emails offer 5% off for customers, 20% per order to the shop and 30% on Statement — once", () => {
  const biz = ensureBusinessShare("Hi team,\n\nA free display piece for your shop.", true);
  assert(biz.includes("they get 5% off"));
  assert(biz.includes("20% of every order goes to you"));
  assert(biz.includes("30% on our largest Statement piece"));
  assertEquals(ensureBusinessShare(biz, true).split("30%").length - 1, 1);
  // A vague or wrong figure from the writer is replaced, never left beside ours.
  const vague = ensureBusinessShare("Hi team,\n\nA free piece.\n\nYou'd earn 20-30% on sales.", true);
  assert(!vague.includes("20-30%"));
  assertEquals(vague.split("20%").length - 1, 1);
});

Deno.test("creator emails offer followers 10% off, 20% per order to the creator and 30% on Statement — once", () => {
  const c = ensurePartnerShare("Hi Liz,\n\nLovely post about Rosebud.", true);
  assert(c.includes("your followers get 10% off"));
  assert(c.includes("20% of every order goes to you"));
  assert(c.includes("30% on our largest Statement piece"));
  assert(!c.includes("5% off"));
  assertEquals(ensurePartnerShare(c, true), c);
  // The old 10% commission offer is replaced, never sent beside the new one.
  const old = ensurePartnerShare("Hi Liz,\n\nA gift.\n\nYou'd get 10% off for followers and 10% commission on every order.", true);
  assert(!/commission/i.test(old));
  assertEquals(old.split("20%").length - 1, 1);
  assert(CREATOR_SHARE_LINE.includes("20%") && BUSINESS_SHARE_LINE.includes("5% off"));
});

Deno.test("emails are validated and lower-cased", () => {
  assertEquals(normalizeEmail("  Jill@HealingWithAnimals.com "), "jill@healingwithanimals.com");
  assertEquals(normalizeEmail("not an email"), null);
});

Deno.test("finding people tops each category up to its share of the batch", () => {
  const cats = [{ slug: "petfluencers", share: 10 }, { slug: "pet_boutiques", share: 5 }, { slug: "vet_groomers", share: 5 }, { slug: "memorial_stores", share: 5 }];
  const t = findTargets(cats, 25, { petfluencers: 4, pet_boutiques: 9 });
  assertEquals(t, { petfluencers: 6, pet_boutiques: 0, vet_groomers: 5, memorial_stores: 5 });
});

Deno.test("only public web pages can prove an email; social sites and internal hosts can't", () => {
  assert(isCheckableUrl("https://www.pinkpoodlespa.com/contact"));
  assert(isCheckableUrl("https://linktr.ee/gusthedachshund"));
  assertEquals(isCheckableUrl("https://www.instagram.com/gus/"), null);
  assertEquals(isCheckableUrl("http://169.254.169.254/latest"), null);
  assertEquals(isCheckableUrl("http://localhost:54321/"), null);
  assertEquals(isCheckableUrl("ftp://shop.com/x"), null);
  assertEquals(isCheckableUrl("not a url"), null);
});

Deno.test("an email counts only if the page really shows it", () => {
  assert(emailOnPage('<a href="mailto:Hello@Shop.com">Email us</a>', "hello@shop.com"));
  assert(emailOnPage("write to hello [at] shop [dot] com", "hello@shop.com"));
  assert(emailOnPage("hello&#64;shop&#46;com", "hello@shop.com"));
  assertEquals(emailOnPage("contact info@shop.com", "hello@shop.com"), false);
  assertEquals(emailOnPage("hello@shop.co", "hello@shop.com"), false);
});

Deno.test("100 a day in waves of 25 all go out the same day when prepared by 10am Eastern", () => {
  const now = etToUtc(2026, 11, 17, 10, 0);
  const t = waveTimes(now, 100, 25);
  const hours = [...new Set(t.map(etHour))];
  assertEquals(hours, [10, 12, 14, 16]);
  assert(t[99].getTime() - t[0].getTime() < 7 * 3_600_000);
  assertEquals(remainingToday(100, 0), 100);
});

Deno.test("outreach photo sits right after the hook, not after the greeting", () => {
  const { before, after } = splitForPhoto("Hi Liz,\n\nLovely post about Rosebud.\n\nI'd love to send you a free sculpture.\n\nMore pieces:\nhttps://nyzora.ai/x");
  assertEquals(before, "Hi Liz,\n\nLovely post about Rosebud.");
  assert(after.startsWith("I'd love"));
});

Deno.test("outreach email carries plain text plus HTML with one inline photo", () => {
  const photo = { cid: "pieces", jpegBase64: "AAAA", alt: "Nyra and Nalaa", caption: "Two real pieces." };
  const raw = rawEmail("a@b.com", "Hi", "Hi Liz,\n\nLovely post.\n\nOffer here.", photo);
  const msg = atob(raw.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(raw.length / 4) * 4, "="));
  assert(msg.includes("multipart/alternative") && msg.includes("text/plain") && msg.includes("text/html"));
  assert(msg.includes("Content-ID: <pieces>") && msg.includes("Content-Type: image/jpeg"));
  const html = emailHtml("Hi Liz,\n\nLovely post.\n\nOffer here.", photo);
  assert(html.indexOf("Lovely post") < html.indexOf("cid:pieces") && html.indexOf("cid:pieces") < html.indexOf("Offer here"));
  assertEquals((html.match(/<img/g) ?? []).length, 1);
});

Deno.test("real outreach photo stays small", async () => {
  const { PIECES_PHOTO_JPEG_B64 } = await import("./outreachPhoto.ts");
  assert(PIECES_PHOTO_JPEG_B64.length * 0.75 < 100_000);
});
