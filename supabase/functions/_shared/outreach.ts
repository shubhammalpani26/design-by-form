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

/** RFC 2822 message, base64url-encoded for Gmail's send endpoint. */
export function rawEmail(to: string, subject: string, body: string): string {
  const safeSubject = subject.replace(/[\r\n]+/g, " ").trim();
  const msg = [
    `To: ${to}`,
    `Subject: ${header(safeSubject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    b64(body).replace(/(.{76})/g, "$1\r\n"),
  ].join("\r\n");
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
