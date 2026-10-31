// Pure helpers that organise the admin Social schedule into sections.
// Kept free of React/Supabase so it can be unit tested with Deno.

export interface SchedulablePost {
  id: string;
  scheduled_at: string;
  status: string;
  fb_status?: string | null;
}

export interface OrganizedSchedule<T extends SchedulablePost> {
  /** Failed, held for review, or past their time without publishing. */
  attention: T[];
  /** The very next post that will go out. */
  next: T | null;
  /** Everything after `next`, soonest first. */
  upcoming: T[];
  /** Published posts, newest first. */
  posted: T[];
  /** Skipped posts, newest first. */
  skipped: T[];
}

/** A post this many minutes late without publishing needs attention. */
export const OVERDUE_GRACE_MINUTES = 30;

const time = (p: SchedulablePost) => new Date(p.scheduled_at).getTime();

export function organizeSchedule<T extends SchedulablePost>(posts: T[], now: Date = new Date()): OrganizedSchedule<T> {
  const nowMs = now.getTime();
  const attention: T[] = [];
  const pending: T[] = [];
  const posted: T[] = [];
  const skipped: T[] = [];

  for (const p of posts) {
    if (p.status === "published") {
      posted.push(p);
      if (p.fb_status === "failed") attention.push(p);
    } else if (p.status === "cancelled") {
      skipped.push(p);
    } else if (
      p.status === "failed" ||
      p.status === "needs_review" ||
      time(p) < nowMs - OVERDUE_GRACE_MINUTES * 60_000
    ) {
      attention.push(p);
    } else {
      pending.push(p);
    }
  }

  pending.sort((a, b) => time(a) - time(b));
  attention.sort((a, b) => time(a) - time(b));
  posted.sort((a, b) => time(b) - time(a));
  skipped.sort((a, b) => time(b) - time(a));

  const [next = null, ...upcoming] = pending;
  return { attention, next, upcoming, posted, skipped };
}

/** "in 3 h 20 min", "in 12 min", "now". */
export function countdown(iso: string, now: Date = new Date()): string {
  const mins = Math.round((new Date(iso).getTime() - now.getTime()) / 60_000);
  if (mins <= 0) return "now";
  if (mins < 60) return `in ${mins} min`;
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const rest = mins % 60;
  if (days > 0) return hours ? `in ${days} d ${hours} h` : `in ${days} d`;
  return rest ? `in ${hours} h ${rest} min` : `in ${hours} h`;
}

/** Groups posts by calendar day in the given time zone, keeping input order. */
export function groupByDay<T extends SchedulablePost>(posts: T[], timeZone?: string): Array<{ key: string; posts: T[] }> {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const groups: Array<{ key: string; posts: T[] }> = [];
  for (const p of posts) {
    const key = fmt.format(new Date(p.scheduled_at));
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.posts.push(p);
    else groups.push({ key, posts: [p] });
  }
  return groups;
}

export const isVideoUrl = (url: string | null | undefined) => !!url && /\.(mp4|mov|m4v|webm)(\?|#|$)/i.test(url);
