// Run: deno test --no-check tests/socialSchedule_test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { countdown, groupByDay, organizeSchedule } from "../src/lib/socialSchedule.ts";

const now = new Date("2026-10-31T10:00:00Z");
const post = (id: string, scheduled_at: string, status = "ready", fb_status: string | null = "pending") => ({
  id,
  scheduled_at,
  status,
  fb_status,
});

Deno.test("the soonest unpublished post is 'up next', the rest follow soonest first", () => {
  const s = organizeSchedule(
    [
      post("nov2", "2026-11-02T13:00:00Z"),
      post("today16", "2026-10-31T16:00:00Z"),
      post("today13", "2026-10-31T13:00:00Z"),
      post("nov1", "2026-11-01T13:00:00Z"),
    ],
    now,
  );
  assertEquals(s.next?.id, "today13");
  assertEquals(s.upcoming.map((p) => p.id), ["today16", "nov1", "nov2"]);
});

Deno.test("published posts are listed newest first and never count as upcoming", () => {
  const s = organizeSchedule(
    [
      post("oldest", "2026-08-17T13:00:00Z", "published", "published"),
      post("newest", "2026-10-30T16:00:00Z", "published", "published"),
      post("middle", "2026-09-20T13:00:00Z", "published", "published"),
    ],
    now,
  );
  assertEquals(s.posted.map((p) => p.id), ["newest", "middle", "oldest"]);
  assertEquals(s.next, null);
  assertEquals(s.upcoming.length, 0);
});

Deno.test("failed, held and overdue posts need attention instead of sitting in the queue", () => {
  const s = organizeSchedule(
    [
      post("failed", "2026-11-01T13:00:00Z", "failed"),
      post("held", "2026-11-01T16:00:00Z", "needs_review"),
      post("overdue", "2026-10-31T09:00:00Z", "ready"),
      post("fbFailed", "2026-10-30T13:00:00Z", "published", "failed"),
      post("justDue", "2026-10-31T09:45:00Z", "ready"),
    ],
    now,
  );
  assertEquals(s.attention.map((p) => p.id), ["fbFailed", "overdue", "failed", "held"]);
  assertEquals(s.next?.id, "justDue");
});

Deno.test("skipped posts are kept apart", () => {
  const s = organizeSchedule([post("skip", "2026-11-03T13:00:00Z", "cancelled")], now);
  assertEquals(s.skipped.map((p) => p.id), ["skip"]);
  assertEquals(s.next, null);
});

Deno.test("countdown reads naturally", () => {
  assertEquals(countdown("2026-10-31T10:12:00Z", now), "in 12 min");
  assertEquals(countdown("2026-10-31T13:20:00Z", now), "in 3 h 20 min");
  assertEquals(countdown("2026-11-02T13:00:00Z", now), "in 2 d 3 h");
  assertEquals(countdown("2026-10-31T09:00:00Z", now), "now");
});

Deno.test("posts group by the calendar day of the chosen time zone", () => {
  // 00:00 UTC Nov 1 is still Oct 31 in New York but Nov 1 in India.
  const posts = [post("a", "2026-10-31T16:00:00Z"), post("b", "2026-11-01T00:00:00Z")];
  assertEquals(groupByDay(posts, "America/New_York").length, 1);
  assertEquals(groupByDay(posts, "Asia/Kolkata").length, 2);
});
