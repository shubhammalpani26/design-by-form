/**
 * Pure rules for the founder outreach panel (cold emails from Shubham's Gmail).
 * Kept free of I/O so they can be tested: daily split per category, US-daytime
 * send waves, the fixed signature + opt-out line, and reply classification.
 */

export const US_TZ = "America/New_York";
export const SEND_START_HOUR = 9; // first wave, Eastern time
export const SEND_END_HOUR = 18; // no wave starts at or after this hour
export const WAVE_GAP_HOURS = 2;
export const MAX_DAILY_TOTAL = 150; // hard ceiling regardless of settings
export const SIGNATURE = "Shubham\nFounder, Nyzora";
export const OPT_OUT_LINE = `Reply "no thanks" and I won't email again.`;
// Real, expandable cap — stated only in creator emails, never to businesses.
export const FIRST30_LINE = "We're choosing our first 30 creator partners this month.";

/** Creator emails must carry the first-30 line; add it if the writer forgot. */
export function ensureFirst30(body: string, isCreator: boolean): string {
  if (!isCreator || body.toLowerCase().includes("first 30")) return body;
  return `${body.trim()}\n\n${FIRST30_LINE}`;
}
// One partner program: creators and businesses both earn a fixed share of every
// order placed with their own code (more on Statement), and their buyers get a
// discount (creators' followers 10%, shops' customers 5%). Both tiers are stated
// up front so there's no "what's the catch" and nothing changes after they reply.
export const PARTNER_SHARE_PCT = 20;
export const PARTNER_STATEMENT_SHARE_PCT = 30;
export const CREATOR_FOLLOWER_DISCOUNT_PCT = 10;
export const BUSINESS_CUSTOMER_DISCOUNT_PCT = 5;
// Kept for existing imports.
export const BUSINESS_SHARE_PCT = PARTNER_SHARE_PCT;
export const BUSINESS_STATEMENT_SHARE_PCT = PARTNER_STATEMENT_SHARE_PCT;

export const BUSINESS_SHARE_LINE =
  `If your customers would like one too, you'd get your own code: they get ${BUSINESS_CUSTOMER_DISCOUNT_PCT}% off, and ${PARTNER_SHARE_PCT}% of every order goes to you, or ${PARTNER_STATEMENT_SHARE_PCT}% on our largest Statement piece, paid monthly by bank transfer or PayPal for delivered orders. No cost, no minimums.`;
export const CREATOR_SHARE_LINE =
  `You'd also get your own code: your followers get ${CREATOR_FOLLOWER_DISCOUNT_PCT}% off, and ${PARTNER_SHARE_PCT}% of every order goes to you, or ${PARTNER_STATEMENT_SHARE_PCT}% on our largest Statement piece.`;

/** Every outreach email states its group's partner terms exactly once, replacing any garbled version. */
export function ensurePartnerShare(body: string, isCreator: boolean): string {
  const discount = isCreator ? CREATOR_FOLLOWER_DISCOUNT_PCT : BUSINESS_CUSTOMER_DISCOUNT_PCT;
  const line = isCreator ? CREATOR_SHARE_LINE : BUSINESS_SHARE_LINE;
  const paras = body.split(/\n{2,}/);
  const isTerms = (p: string) => /\d+\s*%/.test(p);
  const terms = paras.filter(isTerms);
  const exact = terms.length === 1 && terms[0].includes(`${discount}% off`) &&
    terms[0].includes(`${PARTNER_SHARE_PCT}% of every order`) && terms[0].includes(`${PARTNER_STATEMENT_SHARE_PCT}%`) &&
    !/commission/i.test(terms[0]);
  if (exact) return body;
  // Drop any partial/old/wrong version the writer produced, then add ours.
  return `${paras.filter((p) => !isTerms(p)).join("\n\n").trim()}\n\n${line}`;
}

/** @deprecated use ensurePartnerShare */
export function ensureBusinessShare(body: string, isBusiness: boolean): string {
  return isBusiness ? ensurePartnerShare(body, false) : body;
}
export const PET_PAGE = "https://nyzora.ai/originals/pet-portrait-sculpture";

const EMAIL_RE = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[a-z]{2,}$/i;

export function normalizeEmail(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const e = v.trim().toLowerCase();
  return e.length <= 254 && EMAIL_RE.test(e) ? e : null;
}

export function trackedLink(categorySlug: string): string {
  return `${PET_PAGE}?utm_source=email&utm_medium=outreach&utm_campaign=${encodeURIComponent(categorySlug)}`;
}

// ---------------------------------------------------------------- time (ET)

function etParts(d: Date) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: US_TZ, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p: Record<string, number> = {};
  for (const x of f.formatToParts(d)) if (x.type !== "literal") p[x.type] = Number(x.value);
  return { y: p.year, m: p.month, d: p.day, h: p.hour, min: p.minute, s: p.second };
}

/** UTC instant for a wall-clock time in Eastern time (handles DST). */
export function etToUtc(y: number, m: number, d: number, h: number, min = 0): Date {
  let guess = Date.UTC(y, m - 1, d, h, min);
  for (let i = 0; i < 2; i++) {
    const p = etParts(new Date(guess));
    const shown = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min);
    guess += Date.UTC(y, m - 1, d, h, min) - shown;
  }
  return new Date(guess);
}

/** Start of the current Eastern-time day, as a UTC instant. */
export function etDayStart(now: Date): Date {
  const p = etParts(now);
  return etToUtc(p.y, p.m, p.d, 0, 0);
}

function nextEtMorning(from: Date): Date {
  const p = etParts(from);
  const tomorrowNoonUtc = etToUtc(p.y, p.m, p.d, 12).getTime() + 86_400_000;
  const t = etParts(new Date(tomorrowNoonUtc));
  return etToUtc(t.y, t.m, t.d, SEND_START_HOUR);
}

/** The next moment emails may go out: now if inside US daytime, else next 9am ET. */
export function nextSendSlot(now: Date): Date {
  const p = etParts(now);
  if (p.h < SEND_START_HOUR) return etToUtc(p.y, p.m, p.d, SEND_START_HOUR);
  if (p.h >= SEND_END_HOUR) return nextEtMorning(now);
  return now;
}

/**
 * Send time for each of `count` emails: waves of `waveSize`, two hours apart,
 * only between 9am and 6pm Eastern, rolling into the next day when needed.
 */
export function waveTimes(now: Date, count: number, waveSize: number): Date[] {
  const size = Math.max(1, Math.floor(waveSize));
  const out: Date[] = [];
  let slot = nextSendSlot(now);
  let inWave = 0;
  for (let i = 0; i < count; i++) {
    if (inWave === size) {
      inWave = 0;
      slot = nextSendSlot(new Date(slot.getTime() + WAVE_GAP_HOURS * 3_600_000));
    }
    // The whole wave is due together; the sender spaces each email a few seconds apart.
    out.push(new Date(slot.getTime()));
    inWave++;
  }
  return out;
}

// ---------------------------------------------------------------- batching

export interface CategoryShare { slug: string; share: number; available: number }

/**
 * How many new contacts to take from each category for one batch of `total`.
 * Follows each category's share; when one runs out, the rest is shared among
 * those that still have people waiting.
 */
export function splitBatch(cats: CategoryShare[], total: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of cats) out[c.slug] = 0;
  let left = Math.max(0, Math.floor(total));
  const shareSum = cats.reduce((s, c) => s + Math.max(0, c.share), 0);
  if (shareSum > 0) {
    for (const c of cats) {
      const want = Math.floor((Math.max(0, c.share) / shareSum) * left);
      out[c.slug] = Math.min(want, c.available);
    }
  }
  let used = Object.values(out).reduce((a, b) => a + b, 0);
  // Hand out remaining places one at a time, biggest share first.
  const order = [...cats].sort((a, b) => b.share - a.share);
  let progress = true;
  while (used < left && progress) {
    progress = false;
    for (const c of order) {
      if (used >= left) break;
      if (out[c.slug] < c.available && (c.share > 0 || shareSum === 0 || order.every((o) => o.share <= 0 || out[o.slug] >= o.available))) {
        out[c.slug]++;
        used++;
        progress = true;
      }
    }
  }
  return out;
}

/** How many more emails may still go out today under the daily total. */
export function remainingToday(dailyTotal: number, sentToday: number): number {
  const cap = Math.min(Math.max(0, Math.floor(dailyTotal)), MAX_DAILY_TOTAL);
  return Math.max(0, cap - sentToday);
}

// ---------------------------------------------------------------- email text

/** Body as sent: the written message, then the fixed signature and opt-out line. */
export function finalizeBody(body: string): string {
  let text = body.replace(/\r\n/g, "\n").trim();
  // Drop any sign-off/opt-out the writer added so ours appears exactly once.
  text = text.replace(/\n+\s*(warmly|best|cheers|thanks|thank you|regards|kind regards)[,!]?\s*\n[\s\S]*$/i, "");
  text = text.replace(/\n+.*no thanks.*$/gim, "");
  text = text.replace(/\n+\s*(—|-)?\s*(shubham|the nyzora team)[\s\S]*$/i, "");
  return `${text.trim()}\n\nWarmly,\n${SIGNATURE}\n\n${OPT_OUT_LINE}`;
}

function b64(s: string): string {
  return btoa(Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join(""));
}
const header = (v: string) => (/^[\x00-\x7F]*$/.test(v) ? v : `=?UTF-8?B?${b64(v)}?=`);

const GREETING = /^(hi|hello|hey|dear)\b[^\n]*,\s*$/i;

/** Where the real-piece photo goes: right after the hook (the first paragraph that isn't just "Hi X,"). */
export function splitForPhoto(body: string): { before: string; after: string } {
  const paras = body.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  let i = 0;
  while (i < paras.length - 1 && GREETING.test(paras[i].trim())) i++;
  return { before: paras.slice(0, i + 1).join("\n\n"), after: paras.slice(i + 1).join("\n\n") };
}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function htmlParas(text: string): string {
  return text.split(/\n{2,}/).filter((p) => p.trim()).map((p) =>
    `<p style="margin:0 0 14px">${esc(p.trim()).replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}">${u}</a>`).replace(/\n/g, "<br>")}</p>`
  ).join("");
}

export type InlinePhoto = { cid: string; jpegBase64: string; alt: string; caption: string };

/** Simple HTML version of the body with the inline photo placed after the hook. */
export function emailHtml(body: string, photo: InlinePhoto): string {
  const { before, after } = splitForPhoto(body);
  return `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#222">` +
    htmlParas(before) +
    `<p style="margin:0 0 6px"><img src="cid:${photo.cid}" alt="${esc(photo.alt)}" width="420" style="width:100%;max-width:420px;height:auto;border-radius:6px;display:block"></p>` +
    `<p style="margin:0 0 14px;font-size:13px;color:#666">${esc(photo.caption)}</p>` +
    htmlParas(after) + `</body></html>`;
}

const wrap = (b: string) => b.replace(/(.{76})/g, "$1\r\n");

/** RFC 2822 message, base64url-encoded for Gmail's send endpoint. With a photo:
 *  multipart/alternative (plain text + HTML with the photo inline by cid). */
export function rawEmail(to: string, subject: string, body: string, photo?: InlinePhoto, inReplyTo?: string | null): string {
  const safeSubject = subject.replace(/[\r\n]+/g, " ").trim();
  const head = [`To: ${to}`, `Subject: ${header(safeSubject)}`, "MIME-Version: 1.0"];
  // Threads the follow-up under the first email in the recipient's inbox too, not just ours.
  const ref = (inReplyTo ?? "").replace(/[\r\n<>\s]/g, "");
  if (ref) head.push(`In-Reply-To: <${ref}>`, `References: <${ref}>`);
  let msg: string;
  if (!photo) {
    msg = [...head, 'Content-Type: text/plain; charset="UTF-8"', "Content-Transfer-Encoding: base64", "", wrap(b64(body))].join("\r\n");
  } else {
    const alt = "nyz-alt-" + crypto.randomUUID(), rel = "nyz-rel-" + crypto.randomUUID();
    msg = [
      ...head, `Content-Type: multipart/alternative; boundary="${alt}"`, "",
      `--${alt}`, 'Content-Type: text/plain; charset="UTF-8"', "Content-Transfer-Encoding: base64", "", wrap(b64(body)),
      `--${alt}`, `Content-Type: multipart/related; boundary="${rel}"`, "",
      `--${rel}`, 'Content-Type: text/html; charset="UTF-8"', "Content-Transfer-Encoding: base64", "", wrap(b64(emailHtml(body, photo))),
      `--${rel}`, 'Content-Type: image/jpeg; name="nyra-and-nalaa.jpg"', "Content-Transfer-Encoding: base64",
      `Content-ID: <${photo.cid}>`, 'Content-Disposition: inline; filename="nyra-and-nalaa.jpg"', "", wrap(photo.jpegBase64),
      `--${rel}--`, `--${alt}--`, "",
    ].join("\r\n");
  }
  return b64(msg).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ---------------------------------------------------------------- replies

export type ReplyKind = "bounced" | "opted_out" | "replied";

export function classifyReply(from: string, subject: string, snippet: string): ReplyKind {
  const f = from.toLowerCase();
  if (/mailer-daemon|postmaster|mail delivery/.test(f) || /delivery status notification|undeliverable|address not found/i.test(subject)) {
    return "bounced";
  }
  if (/\b(no thanks|no, thanks|not interested|unsubscribe|remove me|stop emailing|do not contact|don't contact)\b/i.test(snippet)) {
    return "opted_out";
  }
  return "replied";
}

// ------------------------------------------------------------ finding people

/**
 * How many new people to find per category so the next batch can be full:
 * the category's share of `total`, minus whoever is already waiting there.
 */
export function findTargets(
  cats: { slug: string; share: number }[], total: number, waiting: Record<string, number>,
): Record<string, number> {
  const split = splitBatch(cats.map((c) => ({ ...c, available: total })), total);
  const out: Record<string, number> = {};
  for (const c of cats) out[c.slug] = Math.max(0, (split[c.slug] ?? 0) - (waiting[c.slug] ?? 0));
  return out;
}

/** Social sites hide emails behind logins, so a page there can never prove an address. */
const UNFETCHABLE = /(^|\.)(instagram|facebook|tiktok|x|twitter|threads|linkedin|youtube)\.com$/i;

/** Only public http(s) pages on real domain names (no IPs, localhost or internal hosts). */
export function isCheckableUrl(raw: unknown): URL | null {
  if (typeof raw !== "string") return null;
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const h = u.hostname.toLowerCase();
  if (!h.includes(".") || h.endsWith(".local") || h.endsWith(".internal") || h === "localhost") return null;
  if (/^[\d.]+$/.test(h) || h.includes(":")) return null; // bare IPv4 / IPv6
  if (UNFETCHABLE.test(h)) return null;
  return u;
}

/**
 * True when `email` is genuinely published on the page, including common
 * spellings like "name [at] shop [dot] com" and HTML-escaped characters.
 */
export function emailOnPage(html: string, email: string): boolean {
  const target = email.toLowerCase();
  const text = html
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&commat;/gi, "@").replace(/&period;/gi, ".").replace(/&amp;/gi, "&")
    .toLowerCase();
  if (text.includes(target)) return true;
  if (text.includes(encodeURIComponent(target).toLowerCase())) return true;
  const [local, domain] = target.split("@");
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const dot = String.raw`\s*(?:\.|\[\s*dot\s*\]|\(\s*dot\s*\)|\s+dot\s+)\s*`;
  const at = String.raw`\s*(?:@|\[\s*at\s*\]|\(\s*at\s*\)|\s+at\s+)\s*`;
  const re = new RegExp(esc(local) + at + domain.split(".").map(esc).join(dot));
  return re.test(text);
}

// ------------------------------------------------------------- follow-ups

/** One follow-up per person, only after the first email has had this long to land. */
export const FOLLOWUP_AFTER_DAYS = 4;

export type FollowupCandidate = {
  status: string; outcome?: string | null; sent_at: string | null;
  gmail_thread_id: string | null; gmail_message_id: string | null; followup_status?: string | null;
};

/** Sent, no reply/opt-out/bounce, no outcome marked, never followed up, first email 4+ days old. */
export function followupReady(c: FollowupCandidate, now: Date): boolean {
  if (c.status !== "sent" || c.outcome || c.followup_status) return false;
  if (!c.gmail_thread_id || !c.gmail_message_id || !c.sent_at) return false;
  return now.getTime() - new Date(c.sent_at).getTime() >= FOLLOWUP_AFTER_DAYS * 86_400_000;
}

const NOT_A_NAME = /^(your|their|them|him|her|it|the|a|an)$/i;

/** The pet's name as the first email used it ("a free sculpture of Rosebud"), if any. */
export function petNameFrom(body: string | null): string | null {
  const m = (body ?? "").match(/sculpture of ([A-Z][A-Za-z'’-]{1,24}(?: [A-Z][A-Za-z'’-]{1,24})?)/);
  return m && !NOT_A_NAME.test(m[1].split(" ")[0]) ? m[1] : null;
}

/** Short reply in the same thread: hook, (photo goes here), current terms, the ask. Same Re: subject. */
export function followupEmail(
  first: { subject: string | null; body: string | null }, isCreator: boolean,
): { subject: string; body: string } {
  const original = (first.body ?? "").replace(/\r\n/g, "\n").trim();
  const firstPara = original.split(/\n{2,}/)[0]?.trim() ?? "";
  const greeting = GREETING.test(firstPara) ? firstPara : "Hi there,";
  const subj = (first.subject ?? "").trim() || "A little gift for you";
  const subject = /^re:/i.test(subj) ? subj : `Re: ${subj}`;
  let paras: string[];
  if (isCreator) {
    const pet = petNameFrom(original);
    // Older creator emails offered 10% + 10%; the better terms are a real reason to write again.
    const hadCurrentTerms = original.includes(`${PARTNER_SHARE_PCT}% of every order`);
    paras = [
      hadCurrentTerms
        ? "Just floating my note from last week back to the top of your inbox."
        : "Quick update on my note from last week: we've improved our partner terms.",
      `The free sculpture of ${pet ?? "your pet"} still stands. ${CREATOR_SHARE_LINE}`,
      `If you'd like one, just reply with a favourite photo of ${pet ?? "your pet"}, the name you'd like on it and your delivery address.`,
    ];
  } else {
    paras = [
      "Just following up on my note from last week about a free display piece for your front desk.",
      BUSINESS_SHARE_LINE,
      "If you'd like one, just reply with a photo of a pet you'd like made, its name and the delivery address for your shop.",
    ];
  }
  return { subject, body: finalizeBody([greeting, ...paras].join("\n\n")) };
}
