import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Clock, Images, Play, RefreshCw } from "lucide-react";
import { countdown, groupByDay, isVideoUrl, organizeSchedule } from "@/lib/socialSchedule";

interface ScheduledPost {
  id: string;
  scheduled_at: string;
  slot_type: "feed" | "story" | "reel" | "carousel";
  day_index: number;
  theme: string | null;
  caption: string;
  image_prompt: string;
  image_url: string | null;
  media_urls: string[] | null;
  engineering: { pass?: boolean; confidence?: number; issues?: string[] } | null;
  engineering_status: string;
  status: string;
  last_error: string | null;
  fb_status: string | null;
  fb_scheduled_at: string | null;
  fb_post_id: string | null;
  fb_caption: string | null;
  fb_error: string | null;
  published_at?: string | null;
}

interface SchedulerState {
  paused: boolean;
  pause_reason: string | null;
  last_run_at: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  ready: "Ready",
  scheduled: "Waiting for image",
  publishing: "Publishing",
  published: "Posted",
  needs_review: "Needs review",
  failed: "Failed",
  cancelled: "Skipped",
};

const statusTone: Record<string, string> = {
  published: "default",
  ready: "secondary",
  scheduled: "outline",
  needs_review: "destructive",
  failed: "destructive",
  cancelled: "outline",
  publishing: "secondary",
};

const TYPE_LABEL: Record<ScheduledPost["slot_type"], string> = {
  feed: "Photo",
  reel: "Reel",
  carousel: "Carousel",
  story: "Story",
};

const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

const localTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const etTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" });

const fullDate = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const dayKey = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: LOCAL_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

const dayHeading = (iso: string, now: Date) => {
  const key = dayKey(new Date(iso));
  const label = new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  if (key === dayKey(now)) return `Today · ${label}`;
  if (key === dayKey(new Date(now.getTime() + 86_400_000))) return `Tomorrow · ${label}`;
  if (key === dayKey(new Date(now.getTime() - 86_400_000))) return `Yesterday · ${label}`;
  return label;
};

const isAiCreditPause = (reason: string | null | undefined) =>
  reason?.startsWith("AI gateway 402:") === true || reason?.startsWith("AI gateway 403:") === true;

const slidesOf = (p: ScheduledPost) =>
  p.slot_type === "carousel" && p.media_urls?.length ? p.media_urls : p.image_url ? [p.image_url] : [];

const POSTED_PAGE = 20;

/* ---------- Media ---------- */

function PostMedia({ post, size }: { post: ScheduledPost; size: "hero" | "thumb" }) {
  const url = post.image_url;
  const hero = size === "hero";
  const box = hero ? "mx-auto aspect-[4/5] w-full max-w-[17rem] sm:mx-0 sm:w-72" : "h-28 w-[5.6rem]";

  if (!url) {
    return (
      <div className={`${box} flex shrink-0 items-center justify-center border border-border bg-muted text-[10px] text-muted-foreground`}>
        Image not made yet
      </div>
    );
  }

  if (url.startsWith("storage://")) {
    return (
      <div className={`${box} flex shrink-0 flex-col items-center justify-center gap-1 border border-border bg-muted text-[10px] text-muted-foreground`}>
        <Play className="h-5 w-5" />
        Video
      </div>
    );
  }

  if (isVideoUrl(url)) {
    return hero ? (
      <video
        src={`${url}#t=0.1`}
        controls
        playsInline
        preload="metadata"
        className={`${box} shrink-0 border border-border bg-muted object-contain`}
      />
    ) : (
      <a href={url} target="_blank" rel="noreferrer" className={`${box} relative block shrink-0 border border-border bg-muted`} title="Play video">
        <video src={`${url}#t=0.1`} muted playsInline preload="metadata" className="h-full w-full object-cover" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-background/80 p-1.5">
            <Play className="h-4 w-4 text-foreground" />
          </span>
        </span>
      </a>
    );
  }

  const slides = slidesOf(post);
  if (hero && slides.length > 1) {
    return (
      <div className="mx-auto w-full max-w-[17rem] shrink-0 sm:mx-0 sm:w-72">
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto">
          {slides.map((s, i) => (
            <a key={s + i} href={s} target="_blank" rel="noreferrer" className="relative block aspect-[4/5] w-[88%] shrink-0 snap-start border border-border bg-muted sm:w-full">
              <img src={s} alt={`Slide ${i + 1}`} className="h-full w-full object-contain" loading="lazy" />
              <span className="absolute right-1.5 top-1.5 bg-background/85 px-1.5 py-0.5 text-[10px] text-foreground">
                {i + 1}/{slides.length}
              </span>
            </a>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">Swipe to see all {slides.length} slides</p>
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className={`${box} relative block shrink-0 border border-border bg-muted`} title="Open full size">
      <img src={url} alt={post.theme ?? "Scheduled post"} className="h-full w-full object-contain" loading="lazy" />
      {slides.length > 1 && (
        <span className="absolute right-1 top-1 flex items-center gap-0.5 bg-background/85 px-1 py-0.5 text-[10px] text-foreground">
          <Images className="h-3 w-3" />
          {slides.length}
        </span>
      )}
    </a>
  );
}

/* ---------- Page ---------- */

export const SocialScheduleManagement = () => {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [state, setState] = useState<SchedulerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [openingVideo, setOpeningVideo] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [postedShown, setPostedShown] = useState(POSTED_PAGE);
  const [now, setNow] = useState(() => new Date());
  const { toast } = useToast();
  const aiRenderingPaused = state?.paused === true && isAiCreditPause(state.pause_reason);
  const isPaused = state?.paused === true && !aiRenderingPaused;

  const load = useCallback(async () => {
    const [{ data: rows }, { data: st }] = await Promise.all([
      supabase
        .from("social_scheduled_posts" as any)
        .select(
          "id, scheduled_at, slot_type, day_index, theme, caption, image_prompt, image_url, media_urls, engineering, engineering_status, status, last_error, fb_status, fb_scheduled_at, fb_post_id, fb_caption, fb_error, published_at",
        )
        .order("scheduled_at", { ascending: true }),
      supabase.from("social_scheduler_state" as any).select("paused, pause_reason, last_run_at").eq("id", "default").maybeSingle(),
    ]);
    setPosts(((rows as unknown) as ScheduledPost[]) ?? []);
    setState(((st as unknown) as SchedulerState) ?? null);
    setNow(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the countdowns fresh.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const schedule = useMemo(() => organizeSchedule(posts, now), [posts, now]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const setPaused = async (paused: boolean) => {
    await supabase
      .from("social_scheduler_state" as any)
      .update({ paused, pause_reason: paused ? "Paused by admin" : null })
      .eq("id", "default");
    toast({ title: paused ? "Auto-posting paused" : "Auto-posting resumed" });
    load();
  };

  const update = async (id: string, patch: Record<string, unknown>) => {
    await supabase.from("social_scheduled_posts" as any).update(patch).eq("id", id);
    load();
  };

  const openStorageVideo = async (post: ScheduledPost) => {
    if (!post.image_url?.startsWith("storage://")) return;
    setOpeningVideo(post.id);
    try {
      const [bucket, ...rest] = post.image_url.slice("storage://".length).split("/");
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(rest.join("/"), 60 * 60);
      if (error || !data?.signedUrl) throw error ?? new Error("No signed URL");
      window.open(data.signedUrl, "_blank", "noreferrer");
    } catch {
      toast({ title: "Could not open video", description: "Failed to create a temporary video link.", variant: "destructive" });
    } finally {
      setOpeningVideo(null);
    }
  };

  const publishNow = async (id: string) => {
    setPublishing(id);
    const { data, error } = await supabase.functions.invoke("social-scheduler", {
      body: { action: "publish_now", postId: id },
    });
    setPublishing(null);
    const message = (data as { error?: string } | null)?.error ?? error?.message;
    if (message) toast({ title: "Could not publish", description: message, variant: "destructive" });
    else toast({ title: "Published to @nyzora.ai" });
    load();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  /* ---------- Pieces ---------- */

  const TimeLine = ({ p }: { p: ScheduledPost }) => (
    <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
      <span className="font-medium text-foreground">{localTime(p.scheduled_at)}</span>
      <span className="text-muted-foreground">US {etTime(p.scheduled_at)} ET</span>
      {p.status !== "published" && p.status !== "cancelled" && new Date(p.scheduled_at) > now && (
        <span className="text-muted-foreground">· {countdown(p.scheduled_at, now)}</span>
      )}
    </div>
  );

  const Badges = ({ p }: { p: ScheduledPost }) => (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant="outline" className="rounded-none">
        {TYPE_LABEL[p.slot_type]}
        {p.slot_type === "carousel" && p.media_urls?.length ? ` · ${p.media_urls.length}` : ""}
      </Badge>
      <Badge variant={(statusTone[p.status] ?? "outline") as never} className="rounded-none">
        {STATUS_LABEL[p.status] ?? p.status}
      </Badge>
      {p.fb_status && p.fb_status !== "skip" && (
        <Badge
          variant={(p.fb_status === "published" ? "default" : p.fb_status === "failed" ? "destructive" : "outline") as never}
          className="rounded-none"
        >
          Facebook: {p.fb_status === "pending" ? "after Instagram" : p.fb_status === "published" ? "posted" : p.fb_status}
        </Badge>
      )}
      {p.engineering_status === "fail" && (
        <Badge variant="destructive" className="rounded-none">
          needs a new image
        </Badge>
      )}
    </div>
  );

  const Caption = ({ p, clamp }: { p: ScheduledPost; clamp: boolean }) => {
    const open = expanded[p.id] || !clamp;
    if (!p.caption) return <p className="text-sm text-muted-foreground">Story — no caption</p>;
    return (
      <div>
        <p className={`whitespace-pre-line text-sm ${open ? "" : "line-clamp-2"}`}>{p.caption}</p>
        {clamp && p.caption.length > 90 && (
          <button
            type="button"
            className="mt-0.5 text-xs text-muted-foreground underline"
            onClick={() => setExpanded((e) => ({ ...e, [p.id]: !e[p.id] }))}
          >
            {open ? "Show less" : "Show full caption"}
          </button>
        )}
      </div>
    );
  };

  const Errors = ({ p }: { p: ScheduledPost }) => (
    <>
      {p.last_error && p.status !== "published" && <p className="text-xs text-destructive">{p.last_error}</p>}
      {p.fb_error && p.fb_status !== "published" && <p className="text-xs text-destructive">Facebook: {p.fb_error}</p>}
      {p.engineering_status === "fail" && p.engineering?.issues?.length ? (
        <p className="text-xs text-destructive">{p.engineering.issues.join(" · ")}</p>
      ) : null}
    </>
  );

  const Actions = ({ p }: { p: ScheduledPost }) => {
    const open = p.status !== "published" && p.status !== "cancelled";
    const isPublic = p.image_url && !p.image_url.startsWith("storage://");
    return (
      <div className="flex flex-wrap gap-1.5 [&_button]:h-8 [&_button]:px-3 [&_button]:text-xs">
        {p.status === "published" && p.fb_post_id && (
          <a href={`https://www.facebook.com/${p.fb_post_id}`} target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline">View on Facebook</Button>
          </a>
        )}
        {isPublic && (
          <a href={p.image_url!} target="_blank" rel="noreferrer" download>
            <Button size="sm" variant="outline">{isVideoUrl(p.image_url) ? "Open video" : "Download"}</Button>
          </a>
        )}
        {p.image_url?.startsWith("storage://") && (
          <Button size="sm" variant="outline" disabled={openingVideo === p.id} onClick={() => openStorageVideo(p)}>
            {openingVideo === p.id ? "Opening…" : "Open video"}
          </Button>
        )}
        {open && p.image_url && p.slot_type !== "story" && (
          <Button size="sm" disabled={publishing === p.id} onClick={() => publishNow(p.id)}>
            {publishing === p.id ? "Publishing…" : "Post now"}
          </Button>
        )}
        {(p.status === "needs_review" || p.status === "failed") && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => update(p.id, { image_url: null, status: "scheduled", attempts: 0, engineering_status: "pending", last_error: null })}
          >
            Make new image
          </Button>
        )}
        {open && (
          <Button size="sm" variant="ghost" onClick={() => update(p.id, { status: "cancelled" })}>
            Skip
          </Button>
        )}
        {p.status === "cancelled" && new Date(p.scheduled_at) > now && (
          <Button size="sm" variant="ghost" onClick={() => update(p.id, { status: p.image_url ? "ready" : "scheduled" })}>
            Restore
          </Button>
        )}
      </div>
    );
  };

  const PostRow = ({ p }: { p: ScheduledPost }) => (
    <Card className="rounded-none">
      <CardContent className="flex gap-3 p-3">
        <PostMedia post={p} size="thumb" />
        <div className="min-w-0 flex-1 space-y-1.5">
          {TimeLine({ p: p })}
          {p.theme && <p className="truncate text-sm font-medium">{p.theme}</p>}
          {Badges({ p: p })}
          {Caption({ p: p, clamp: true })}
          {Errors({ p: p })}
          {Actions({ p: p })}
        </div>
      </CardContent>
    </Card>
  );

  const DayList = ({ items }: { items: ScheduledPost[] }) => (
    <div className="space-y-6">
      {groupByDay(items, LOCAL_TZ).map((g) => (
        <section key={g.key} className="space-y-2">
          <h3 className="border-b border-border py-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {dayHeading(g.posts[0].scheduled_at, now)}
            <span className="ml-2 normal-case tracking-normal">
              · {g.posts.length} post{g.posts.length === 1 ? "" : "s"}
            </span>
          </h3>
          {g.posts.map((p) => (
            <div key={p.id}>{PostRow({ p })}</div>
          ))}
        </section>
      ))}
    </div>
  );

  const { attention, next, upcoming, posted, skipped } = schedule;
  const comingCount = (next ? 1 : 0) + upcoming.length;
  const lastDay = upcoming.length ? upcoming[upcoming.length - 1] : next;

  return (
    <div className="space-y-5">
      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border border-border p-3 sm:p-4">
        <div className="min-w-0 text-sm">
          <div className="font-medium">
            Auto-posting to @nyzora.ai · {isPaused ? "paused" : "on"}
          </div>
          <div className="text-xs text-muted-foreground">
            {aiRenderingPaused
              ? "Posting approved posts; making new images is paused by the AI credit limit"
              : isPaused
                ? state?.pause_reason ?? "Paused"
                : `${comingCount} post${comingCount === 1 ? "" : "s"} queued${
                    lastDay ? ` through ${new Date(lastDay.scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""
                  } · last checked ${state?.last_run_at ? fullDate(state.last_run_at) : "never"}`}
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={refresh} disabled={refreshing} aria-label="Refresh">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" variant={isPaused ? "default" : "outline"} onClick={() => setPaused(!isPaused)}>
            {isPaused ? "Resume" : "Pause"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="coming">
        <TabsList className="grid w-full grid-cols-3 rounded-none">
          <TabsTrigger value="coming" className="rounded-none">Coming up ({comingCount + attention.length})</TabsTrigger>
          <TabsTrigger value="posted" className="rounded-none">Posted ({posted.length})</TabsTrigger>
          <TabsTrigger value="skipped" className="rounded-none">Skipped ({skipped.length})</TabsTrigger>
        </TabsList>

        {/* Coming up */}
        <TabsContent value="coming" className="mt-5 space-y-6">
          {attention.length > 0 && (
            <section className="space-y-2 border border-destructive/50 p-3">
              <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" /> Needs your attention ({attention.length})
              </h3>
              {attention.map((p) => (
                <div key={p.id}>{PostRow({ p })}</div>
              ))}
            </section>
          )}

          {next ? (
            <section className="space-y-2">
              <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Up next
              </h3>
              <Card className="rounded-none border-foreground">
                <CardContent className="space-y-3 p-3 sm:p-4">
                  <div>
                    <div className="text-2xl font-semibold tracking-tight">Posts {countdown(next.scheduled_at, now)}</div>
                    <div className="text-sm text-muted-foreground">
                      {dayHeading(next.scheduled_at, now)} · {localTime(next.scheduled_at)} (US {etTime(next.scheduled_at)} ET)
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <PostMedia post={next} size="hero" />
                    <div className="min-w-0 flex-1 space-y-2">
                      {next.theme && <p className="font-medium">{next.theme}</p>}
                      {Badges({ p: next })}
                      {Caption({ p: next, clamp: false })}
                      {Errors({ p: next })}
                      {Actions({ p: next })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          ) : (
            attention.length === 0 && (
              <p className="border border-border p-6 text-center text-sm text-muted-foreground">Nothing is queued to post.</p>
            )
          )}

          {upcoming.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">After that</h3>
              {DayList({ items: upcoming })}
            </div>
          )}
        </TabsContent>

        {/* Posted */}
        <TabsContent value="posted" className="mt-5 space-y-4">
          {posted.length === 0 ? (
            <p className="border border-border p-6 text-center text-sm text-muted-foreground">Nothing posted yet.</p>
          ) : (
            <>
              {DayList({ items: posted.slice(0, postedShown) })}
              {postedShown < posted.length && (
                <Button variant="outline" className="w-full" onClick={() => setPostedShown((n) => n + POSTED_PAGE)}>
                  Show older posts ({posted.length - postedShown} more)
                </Button>
              )}
            </>
          )}
        </TabsContent>

        {/* Skipped */}
        <TabsContent value="skipped" className="mt-5">
          {skipped.length === 0 ? (
            <p className="border border-border p-6 text-center text-sm text-muted-foreground">No skipped posts.</p>
          ) : (
            DayList({ items: skipped })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
