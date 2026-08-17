import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface ScheduledPost {
  id: string;
  scheduled_at: string;
  slot_type: "feed" | "story";
  day_index: number;
  theme: string | null;
  caption: string;
  image_prompt: string;
  image_url: string | null;
  engineering: { pass?: boolean; confidence?: number; issues?: string[] } | null;
  engineering_status: string;
  status: string;
  last_error: string | null;
}

interface SchedulerState {
  paused: boolean;
  pause_reason: string | null;
  last_run_at: string | null;
}

const statusTone: Record<string, string> = {
  published: "default",
  ready: "secondary",
  scheduled: "outline",
  needs_review: "destructive",
  failed: "destructive",
  cancelled: "outline",
  publishing: "secondary",
};

const et = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const SocialScheduleManagement = () => {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [state, setState] = useState<SchedulerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const [{ data: rows }, { data: st }] = await Promise.all([
      supabase
        .from("social_scheduled_posts" as any)
        .select(
          "id, scheduled_at, slot_type, day_index, theme, caption, image_prompt, image_url, engineering, engineering_status, status, last_error",
        )
        .order("scheduled_at", { ascending: true }),
      supabase
        .from("social_scheduler_state" as any)
        .select("paused, pause_reason, last_run_at")
        .eq("id", "default")
        .maybeSingle(),
    ]);
    setPosts(((rows as unknown) as ScheduledPost[]) ?? []);
    setState(((st as unknown) as SchedulerState) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setPaused = async (paused: boolean) => {
    await supabase
      .from("social_scheduler_state" as any)
      .update({ paused, pause_reason: paused ? "Paused by admin" : null })
      .eq("id", "default");
    toast({ title: paused ? "Auto-publishing paused" : "Auto-publishing resumed" });
    load();
  };

  const update = async (id: string, patch: Record<string, unknown>) => {
    await supabase.from("social_scheduled_posts" as any).update(patch).eq("id", id);
    load();
  };

  const publishNow = async (id: string) => {
    setPublishing(id);
    const { data, error } = await supabase.functions.invoke("social-scheduler", {
      body: { action: "publish_now", postId: id },
    });
    setPublishing(null);
    const message = (data as { error?: string } | null)?.error ?? error?.message;
    if (message) {
      toast({ title: "Could not publish", description: message, variant: "destructive" });
    } else {
      toast({ title: "Published to @nyzora.ai" });
    }
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

  const grouped = posts.reduce<Record<number, ScheduledPost[]>>((acc, p) => {
    (acc[p.day_index] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-border p-4">
        <div className="text-sm">
          <div className="font-medium">
            Auto-publishing to @nyzora.ai — {state?.paused ? "paused" : "live"}
          </div>
          <div className="text-muted-foreground">
            {state?.pause_reason ?? `Last checked ${state?.last_run_at ? et(state.last_run_at) : "never"} ET`}
          </div>
        </div>
        <Button variant={state?.paused ? "default" : "outline"} onClick={() => setPaused(!state?.paused)}>
          {state?.paused ? "Resume" : "Pause"}
        </Button>
      </div>

      {Object.entries(grouped).map(([day, items]) => (
        <div key={day} className="space-y-3">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Day {day}</h3>
          {items.map((p) => (
            <Card key={p.id} className="rounded-none">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
                <div className="h-28 w-28 shrink-0 border border-border bg-muted">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.theme ?? "Scheduled post creative"}
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                      Not rendered
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={(statusTone[p.status] ?? "outline") as never}>{p.status}</Badge>
                    <Badge variant="outline">{p.slot_type}</Badge>
                    {p.engineering_status === "fail" ? (
                      <Badge variant="destructive">engineering: needs a new render</Badge>
                    ) : p.engineering_status === "pass" ? (
                      <Badge variant="outline">✓ printable</Badge>
                    ) : null}
                    <span className="text-xs text-muted-foreground">{et(p.scheduled_at)} ET</span>
                  </div>
                  <p className="whitespace-pre-line text-sm">
                    {p.caption || <span className="text-muted-foreground">Story — no caption</span>}
                  </p>
                  {p.engineering_status === "fail" && p.engineering?.issues?.length ? (
                    <p className="text-xs text-destructive">{p.engineering.issues.join(" · ")}</p>
                  ) : null}
                  {p.last_error && p.status !== "published" && (
                    <p className="text-xs text-destructive">{p.last_error}</p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {p.image_url && p.slot_type === "feed" && p.status !== "published" && p.status !== "cancelled" && (
                      <Button size="sm" disabled={publishing === p.id} onClick={() => publishNow(p.id)}>
                        {publishing === p.id ? "Publishing…" : "Publish now"}
                      </Button>
                    )}
                    {(p.status === "needs_review" || p.status === "failed") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => update(p.id, { image_url: null, status: "scheduled", attempts: 0, engineering_status: "pending", last_error: null })}
                      >
                        Re-render
                      </Button>
                    )}
                    {p.status !== "published" && p.status !== "cancelled" && (
                      <Button size="sm" variant="ghost" onClick={() => update(p.id, { status: "cancelled" })}>
                        Skip
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
};
