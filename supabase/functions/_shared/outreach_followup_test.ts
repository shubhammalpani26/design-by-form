import { assert, assertEquals } from "jsr:@std/assert@1";
import { followupEmail, followupReady, petNameFrom, rawEmail, OPT_OUT_LINE } from "./outreach.ts";

const now = new Date("2026-11-24T15:00:00Z");
const base = {
  status: "sent", outcome: null, followup_status: null,
  gmail_thread_id: "t1", gmail_message_id: "m1",
  sent_at: new Date(now.getTime() - 4 * 86_400_000).toISOString(),
};

Deno.test("follow-up only after 4 full days", () => {
  assert(followupReady(base, now));
  assert(!followupReady({ ...base, sent_at: new Date(now.getTime() - 3.9 * 86_400_000).toISOString() }, now));
});

Deno.test("no follow-up to anyone who replied, said no thanks, bounced or was marked", () => {
  for (const status of ["replied", "opted_out", "bounced", "failed", "skipped"]) assert(!followupReady({ ...base, status }, now));
  assert(!followupReady({ ...base, outcome: "no" }, now));
});

Deno.test("only one follow-up per person", () => {
  for (const f of ["scheduled", "sending", "sent", "failed", "cancelled"]) assert(!followupReady({ ...base, followup_status: f }, now));
});

Deno.test("creators on the old 10% terms hear the terms improved, with 20% / 30% and 10% off", () => {
  const f = followupEmail({ subject: "A little gift for Rosebud?", body: "Hi Amy,\n\nLoved Rosebud's beach post.\n\nI'd love to send you a free sculpture of Rosebud.\n\nYou'd get 10% of every order." }, true);
  assertEquals(f.subject, "Re: A little gift for Rosebud?");
  assert(f.body.startsWith("Hi Amy,\n\nQuick update"));
  assert(f.body.includes("improved"));
  assert(f.body.includes("10% off") && f.body.includes("20% of every order") && f.body.includes("30%"));
  assert(f.body.includes("photo of Rosebud"));
  assert(f.body.includes("delivery address"));
  assertEquals(f.body.split(OPT_OUT_LINE).length, 2);
});

Deno.test("creators already offered 20% are never told the terms improved", () => {
  const f = followupEmail({ subject: "Hi", body: "Hi there,\n\nHook.\n\n20% of every order goes to you." }, true);
  assert(!f.body.includes("improved"));
});

Deno.test("shops get 5% off for customers, 20% per order and 30% on Statement, no urgency", () => {
  const f = followupEmail({ subject: "Re: A sculpture for your front desk?", body: "Hi Paws team,\n\nHook." }, false);
  assertEquals(f.subject, "Re: A sculpture for your front desk?");
  assert(f.body.includes("5% off") && f.body.includes("20% of every order") && f.body.includes("30%"));
  assert(!f.body.includes("first 30"));
});

Deno.test("pet name is only taken from a real name", () => {
  assertEquals(petNameFrom("a free sculpture of Biscuit, made"), "Biscuit");
  assertEquals(petNameFrom("a free sculpture of your pet"), null);
  assertEquals(petNameFrom("A little sculpture of Shaylee Rose?"), "Shaylee Rose");
});

Deno.test("follow-up threads under the first email", () => {
  const raw = rawEmail("a@b.com", "Re: Hi", "Hi", undefined, "<abc@mail.gmail.com>");
  const text = atob(raw.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((raw.length + 3) % 4));
  assert(text.includes("In-Reply-To: <abc@mail.gmail.com>"));
  assert(text.includes("References: <abc@mail.gmail.com>"));
});
