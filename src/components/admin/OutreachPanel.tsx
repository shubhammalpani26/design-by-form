import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { parseCsv, toContactRow } from "@/lib/csv";
import { Loader2, Mail, PauseCircle, RefreshCw, Send, Upload } from "lucide-react";

/**
 * Admin "Outreach" tab: personal cold emails from Shubham's Gmail, split
 * across categories. Prepare a batch (each email written for that person),
 * look it over, send — it goes out in waves during US daytime. Replies,
 * opt-outs and bounces are read back from Gmail.
 */

type Contact = {
  id: string; category_slug: string; email: string; contact_name: string | null; org_name: string | null;
  instagram: string | null; city: string | null; state: string | null; followers: number | null;
  personal_detail: string | null; status: string; outcome: string | null; subject: string | null; body: string | null;
  scheduled_for: string | null; sent_at: string | null; replied_at: string | null; reply_snippet: string | null;
  last_error: string | null;
};
type Category = { slug: string; name: string; kind: string; daily_share: number; offer: string; active: boolean };
type Data = {
  settings: { daily_total: number; wave_size: number; paused: boolean; pause_reason: string | null; last_sync_at: string | null };
  categories: Category[]; counts: Record<string, Record<string, number>>;
  batch: Contact[]; scheduled: Contact[]; people: Contact[];
  sentToday: number; yesThisMonth: number; nextSlot: string;
};

const STATUS_LABEL: Record<string, string> = {
  new: "Waiting", selected: "Being written", drafted: "Ready", scheduled: "Going out", sending: "Sending",
  sent: "Sent", replied: "Replied", opted_out: "Said no thanks", bounced: "Bounced", skipped: "Skipped", failed: "Failed",
};
const STATUS_TONE: Record<string, string> = {
  replied: "bg-primary text-primary-foreground", sent: "bg-secondary text-secondary-foreground",
  opted_out: "bg-muted text-muted-foreground", bounced: "bg-destructive text-destructive-foreground",
  failed: "bg-destructive text-destructive-foreground", scheduled: "bg-accent text-accent-foreground",
};

const CREATOR_CAP = 30;

const Stat = ({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) => (
  <div className="border border-border p-3 sm:p-4">
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">{value}</div>
    {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
  </div>
);

const Section = ({ title, note, right, children }: { title: string; note?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) => (
  <section className="space-y-3 border border-border p-3 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h3>
        {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
      </div>
      {right}
    </div>
    {children}
  </section>
);

const who = (c: Contact) =>
  c.contact_name || c.org_name || (c.instagram ? `@${c.instagram}` : c.email);

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "";

const eastern = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "2-digit" }) + " ET";

async function call(action: string, extra: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("outreach-admin", { body: { action, ...extra } });
  if (error) {
    let msg = error.message;
    try { msg = JSON.parse(await (error as any).context.text())?.error ?? msg; } catch { /* keep */ }
    throw new Error(msg);
  }
  return data;
}

function DraftCard({ c, catName, onChanged }: { c: Contact; catName: string; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(c.subject ?? "");
  const [body, setBody] = useState(c.body ?? "");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  useEffect(() => { setSubject(c.subject ?? ""); setBody(c.body ?? ""); }, [c.subject, c.body]);
  const save = async () => {
    setBusy(true);
    try { await call("edit", { id: c.id, subject, body }); toast({ title: "Saved" }); onChanged(); }
    catch (e) { toast({ title: "Couldn't save", description: String((e as Error).message), variant: "destructive" }); }
    finally { setBusy(false); }
  };
  const skip = async () => { setBusy(true); try { await call("skip", { id: c.id }); onChanged(); } finally { setBusy(false); } };
  return (
    <div className="border border-border">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-start justify-between gap-3 p-3 text-left">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground">{who(c)}</div>
          <div className="truncate text-xs text-muted-foreground">{c.email} · {catName}</div>
          <div className="mt-1 truncate text-xs text-foreground">“{c.subject}”</div>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{open ? "Close" : "Read"}</span>
      </button>
      {open && (
        <div className="space-y-2 border-t border-border p-3">
          {c.personal_detail && <p className="text-xs text-muted-foreground">What we know: {c.personal_detail}</p>}
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject" />
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} className="text-sm" aria-label="Message" />
          <p className="text-[11px] text-muted-foreground">Your signature and the “no thanks” line are always added at the end.</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={save} disabled={busy}>Save changes</Button>
            <Button size="sm" variant="outline" onClick={skip} disabled={busy}>Don't send to this person</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function OutreachPanel() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [writing, setWriting] = useState<{ done: number; total: number } | null>(null);
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("sent");
  const [importCat, setImportCat] = useState("petfluencers");
  const [single, setSingle] = useState({ email: "", contact_name: "", org_name: "", personal_detail: "", category: "petfluencers" });
  const [settingsDraft, setSettingsDraft] = useState<{ daily_total: number; wave_size: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await call("overview", { category: filterCat, status: filterStatus });
      setData(d);
      setSettingsDraft((s) => s ?? { daily_total: d.settings.daily_total, wave_size: d.settings.wave_size });
    } catch (e) {
      toast({ title: "Couldn't load outreach", description: String((e as Error).message), variant: "destructive" });
    } finally { setLoading(false); }
  }, [filterCat, filterStatus, toast]);

  useEffect(() => { load(); }, [load]);

  const catName = (slug: string) => data?.categories.find((c) => c.slug === slug)?.name ?? slug;
  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try { await fn(); } catch (e) {
      toast({ title: "Something went wrong", description: String((e as Error).message), variant: "destructive" });
    } finally { setBusy(null); await load(); }
  };

  // Write the selected batch a few at a time so each step stays quick.
  const writeAll = async () => {
    let remaining = Infinity;
    let done = 0;
    const startTotal = (data?.batch.filter((c) => c.status === "selected").length ?? 0) || 1;
    setWriting({ done: 0, total: startTotal });
    try {
      while (remaining > 0) {
        const r = await call("draft");
        done += r.drafted ?? 0;
        remaining = r.remaining ?? 0;
        setWriting({ done, total: Math.max(startTotal, done + remaining) });
        if (!r.drafted && remaining > 0) throw new Error("Couldn't write the remaining emails. Try again.");
      }
    } finally { setWriting(null); }
  };

  const prepare = () => run("prepare", async () => {
    const r = await call("prepare");
    if (!r.selected && r.note) { toast({ title: r.note }); }
    if (!r.selected && !r.note) { toast({ title: "Nobody new to email", description: "Add more people below first." }); return; }
    await load();
    await writeAll();
  });

  const onFile = async (file: File) => run("import", async () => {
    const rows = parseCsv(await file.text()).map(toContactRow).filter((r) => r.email);
    if (!rows.length) throw new Error("No email addresses found in that file.");
    const r = await call("import", { rows, defaultCategory: importCat });
    toast({
      title: `Added ${r.added} ${r.added === 1 ? "person" : "people"}`,
      description: [r.alreadyHad && `${r.alreadyHad} already on the list`, r.invalid && `${r.invalid} without a valid email`, r.noCategory && `${r.noCategory} with no matching category`].filter(Boolean).join(" · ") || undefined,
    });
  });

  if (!data) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading outreach…</div>;
  }

  const s = data.settings;
  const totals = Object.values(data.counts).reduce((acc, c) => {
    for (const [k, v] of Object.entries(c)) acc[k] = (acc[k] ?? 0) + v;
    return acc;
  }, {} as Record<string, number>);
  const sentEver = (totals.sent ?? 0) + (totals.replied ?? 0) + (totals.opted_out ?? 0) + (totals.bounced ?? 0);
  const repliedEver = (totals.replied ?? 0) + (totals.opted_out ?? 0);
  const selected = data.batch.filter((c) => c.status === "selected");
  const drafted = data.batch.filter((c) => c.status === "drafted");
  const activeCats = data.categories.filter((c) => c.active);
  const shareSum = activeCats.reduce((a, c) => a + c.daily_share, 0) || 1;
  const nextIsNow = Math.abs(new Date(data.nextSlot).getTime() - Date.now()) < 120_000;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Outreach</h2>
          <p className="text-xs text-muted-foreground">Personal emails from shubham.malpani@nyzora.ai. Replies land in your Gmail.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => run("sync", async () => {
          const r = await call("sync");
          toast({ title: "Checked Gmail", description: `${r.replies ?? 0} new ${r.replies === 1 ? "reply" : "replies"}${r.sent ? ` · ${r.sent} sent` : ""}` });
        })} disabled={!!busy || loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${busy === "sync" || loading ? "animate-spin" : ""}`} /> Check replies
        </Button>
      </div>

      {s.paused && (
        <div className="flex flex-wrap items-center justify-between gap-2 border border-destructive p-3 text-sm">
          <span className="flex items-center gap-2 text-foreground"><PauseCircle className="h-4 w-4" /> Sending is paused{s.pause_reason ? ` — ${s.pause_reason}` : ""}.</span>
          <Button size="sm" onClick={() => run("resume", async () => { await call("save_settings", { ...settingsDraft, paused: false }); })}>Resume sending</Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Sent today" value={`${data.sentToday} / ${s.daily_total}`} hint="US Eastern day" />
        <Stat label="Going out" value={data.scheduled.length} hint={data.scheduled[0]?.scheduled_for ? `next ${eastern(data.scheduled[0].scheduled_for)}` : "nothing queued"} />
        <Stat label="Replied" value={repliedEver} hint={sentEver ? `${Math.round((repliedEver / sentEver) * 100)}% of ${sentEver} sent` : "—"} />
        <Stat label="Said yes this month" value={`${data.yesThisMonth} / ${CREATOR_CAP}`} hint="free pieces promised" />
        <Stat label="No thanks" value={totals.opted_out ?? 0} hint="never emailed again" />
        <Stat label="Bounced" value={totals.bounced ?? 0} hint="bad addresses" />
      </div>

      {/* ------------------------------------------------ next batch */}
      <Section
        title="Next batch"
        note={<>Each email is written for that person from what we know about them. Sends go out {s.wave_size} at a time, every 2 hours, between 9am and 6pm US Eastern{nextIsNow ? " — starting right away" : `, starting ${eastern(data.nextSlot)}`}.</>}
      >
        {writing ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Writing emails… {writing.done} of {writing.total}</div>
            <Progress value={(writing.done / writing.total) * 100} />
          </div>
        ) : selected.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-foreground">{selected.length} emails still to write.</span>
            <Button size="sm" onClick={() => run("write", writeAll)} disabled={!!busy}>Continue writing</Button>
          </div>
        ) : drafted.length > 0 ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => run("schedule", async () => {
                const r = await call("schedule");
                toast({ title: `${r.scheduled} emails queued`, description: r.firstWave?.sent ? `${r.firstWave.sent} sent just now.` : r.firstWave?.note });
              })} disabled={!!busy || s.paused}>
                {busy === "schedule" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send these {drafted.length} emails
              </Button>
              <Button variant="outline" onClick={() => run("discard", async () => { await call("discard_batch"); })} disabled={!!busy}>Discard batch</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.entries(drafted.reduce((a, c) => ({ ...a, [c.category_slug]: (a[c.category_slug] ?? 0) + 1 }), {} as Record<string, number>))
                .map(([k, v]) => `${v} ${catName(k)}`).join(" · ")}. Tap any one to read or change it.
            </p>
            <div className="grid gap-2 lg:grid-cols-2">
              {drafted.map((c) => <DraftCard key={c.id} c={c} catName={catName(c.category_slug)} onChanged={load} />)}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {activeCats.map((c) => (
                <div key={c.slug} className="border border-border p-3 text-sm">
                  <div className="font-medium text-foreground">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    ~{Math.round((c.daily_share / shareSum) * s.daily_total)} per batch · {data.counts[c.slug]?.new ?? 0} waiting
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={prepare} disabled={!!busy || !totals.new}>
              {busy === "prepare" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Prepare next {Math.min(s.daily_total, totals.new ?? 0)} emails
            </Button>
            {!totals.new && <p className="text-xs text-muted-foreground">Nobody new is waiting. Add people below.</p>}
          </div>
        )}
      </Section>

      {data.scheduled.length > 0 && (
        <Section title="Going out" note="Queued emails send on their own. Stop anytime; they'll come back as ready-to-send."
          right={<Button size="sm" variant="outline" onClick={() => run("unschedule", async () => { await call("unschedule"); })} disabled={!!busy}>Stop sending</Button>}>
          <div className="divide-y divide-border border border-border">
            {data.scheduled.slice(0, 40).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 p-2 text-sm">
                <span className="min-w-0 truncate text-foreground">{who(c)} <span className="text-muted-foreground">· {catName(c.category_slug)}</span></span>
                <span className="shrink-0 text-xs text-muted-foreground">{c.scheduled_for ? eastern(c.scheduled_for) : ""}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ------------------------------------------------ categories */}
      <Section title="Categories" note="Set how many of each batch go to each category. Turn a category off to skip it.">
        <div className="space-y-2">
          {data.categories.map((c) => {
            const n = data.counts[c.slug] ?? {};
            const sent = (n.sent ?? 0) + (n.replied ?? 0) + (n.opted_out ?? 0) + (n.bounced ?? 0);
            return (
              <details key={c.slug} className="border border-border">
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{n.new ?? 0} waiting · {sent} sent · {(n.replied ?? 0) + (n.opted_out ?? 0)} replied · {n.yes ?? 0} said yes</div>
                  </div>
                  <div className="flex items-center gap-3" onClick={(e) => e.preventDefault()}>
                    <label className="flex items-center gap-1 text-xs text-muted-foreground">
                      per batch
                      <Input type="number" min={0} max={150} defaultValue={c.daily_share} className="h-8 w-16"
                        onBlur={(e) => Number(e.target.value) !== c.daily_share && run("cat", async () => { await call("save_category", { slug: c.slug, daily_share: Number(e.target.value) }); })} />
                    </label>
                    <Switch checked={c.active} onCheckedChange={(v) => run("cat", async () => { await call("save_category", { slug: c.slug, active: v }); })} aria-label={`${c.name} on`} />
                  </div>
                </summary>
                <div className="space-y-2 border-t border-border p-3">
                  <div className="text-xs text-muted-foreground">What we offer this category (used when writing each email):</div>
                  <Textarea defaultValue={c.offer} rows={4} className="text-sm"
                    onBlur={(e) => e.target.value !== c.offer && run("cat", async () => { await call("save_category", { slug: c.slug, offer: e.target.value }); toast({ title: "Offer saved" }); })} />
                </div>
              </details>
            );
          })}
        </div>
      </Section>

      {/* ------------------------------------------------ add people */}
      <Section title="Add people" note="Upload a CSV (our research lists or an Explee export work). Anyone already on the list is skipped, so nobody is emailed twice.">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={importCat} onValueChange={setImportCat}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
            <SelectContent>{data.categories.map((c) => <SelectItem key={c.slug} value={c.slug}>If no category: {c.name}</SelectItem>)}</SelectContent>
          </Select>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={!!busy}>
            <Upload className="mr-2 h-4 w-4" /> Upload CSV
          </Button>
        </div>
        <details className="border border-border">
          <summary className="cursor-pointer p-3 text-sm text-foreground">Add one person</summary>
          <div className="grid gap-2 border-t border-border p-3 sm:grid-cols-2">
            <Input placeholder="Email" value={single.email} onChange={(e) => setSingle({ ...single, email: e.target.value })} />
            <Input placeholder="Name (optional)" value={single.contact_name} onChange={(e) => setSingle({ ...single, contact_name: e.target.value })} />
            <Input placeholder="Business or account (optional)" value={single.org_name} onChange={(e) => setSingle({ ...single, org_name: e.target.value })} />
            <Select value={single.category} onValueChange={(v) => setSingle({ ...single, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{data.categories.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea placeholder="Something personal to mention (their pet's name, a recent post, what the shop is known for)" className="sm:col-span-2"
              value={single.personal_detail} onChange={(e) => setSingle({ ...single, personal_detail: e.target.value })} />
            <Button className="sm:col-span-2" disabled={!!busy || !single.email} onClick={() => run("add", async () => {
              const r = await call("import", { rows: [single], defaultCategory: single.category });
              toast({ title: r.added ? "Added" : r.alreadyHad ? "Already on the list" : "Check the email address" });
              if (r.added) setSingle({ email: "", contact_name: "", org_name: "", personal_detail: "", category: single.category });
            })}>Add</Button>
          </div>
        </details>
      </Section>

      {/* ------------------------------------------------ people */}
      <Section title="People" note="Mark who said yes so the monthly count stays right. “No thanks” replies are spotted automatically.">
        <div className="flex flex-wrap gap-2">
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {data.categories.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {["new", "sent", "replied", "opted_out", "bounced", "failed", "skipped"].map((k) => <SelectItem key={k} value={k}>{STATUS_LABEL[k]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="divide-y divide-border border border-border">
          {data.people.length === 0 && <div className="p-3 text-sm text-muted-foreground">Nobody here yet.</div>}
          {data.people.map((c) => (
            <details key={c.id} className="group">
              <summary className="flex cursor-pointer items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">{who(c)}</div>
                  <div className="truncate text-xs text-muted-foreground">{c.email} · {catName(c.category_slug)}</div>
                  <div className="text-xs text-muted-foreground">{when(c.replied_at || c.sent_at)}</div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 text-[11px] ${STATUS_TONE[c.status] ?? "bg-muted text-muted-foreground"}`}>{STATUS_LABEL[c.status] ?? c.status}</span>
                  {c.outcome === "yes" && <span className="bg-primary px-2 py-0.5 text-[11px] text-primary-foreground">Said yes</span>}
                </div>
              </summary>
              <div className="space-y-2 border-t border-border p-3 text-sm">
                {c.reply_snippet && <p className="text-foreground">Their reply: “{c.reply_snippet}”</p>}
                {c.last_error && <p className="text-destructive">Problem: {c.last_error}</p>}
                {c.subject && <p className="text-xs text-muted-foreground">Subject: {c.subject}</p>}
                {c.body && <pre className="whitespace-pre-wrap font-sans text-xs text-muted-foreground">{c.body}</pre>}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant={c.outcome === "yes" ? "default" : "outline"} onClick={() => run("mark", async () => { await call("mark", { id: c.id, outcome: c.outcome === "yes" ? null : "yes", status: c.status === "sent" ? "replied" : undefined }); })}>Said yes</Button>
                  <Button size="sm" variant="outline" onClick={() => run("mark", async () => { await call("mark", { id: c.id, outcome: "no", status: c.status === "sent" ? "replied" : undefined }); })}>Not interested</Button>
                  <Button size="sm" variant="outline" onClick={() => run("mark", async () => { await call("mark", { id: c.id, status: "opted_out" }); })}>Don't email again</Button>
                  {c.status === "failed" && <Button size="sm" onClick={() => run("retry", async () => { await call("retry", { id: c.id }); })}>Try again</Button>}
                </div>
              </div>
            </details>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------ settings */}
      {settingsDraft && (
        <Section title="Sending limits" note="Start small and raise it as replies come in: about 25 a day this week, then 50, then 100. Hard limit 150.">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs text-muted-foreground">Emails per day
              <Input type="number" min={1} max={150} value={settingsDraft.daily_total} className="mt-1 w-28"
                onChange={(e) => setSettingsDraft({ ...settingsDraft, daily_total: Number(e.target.value) })} />
            </label>
            <label className="text-xs text-muted-foreground">Per wave (every 2 hours)
              <Input type="number" min={1} max={50} value={settingsDraft.wave_size} className="mt-1 w-28"
                onChange={(e) => setSettingsDraft({ ...settingsDraft, wave_size: Number(e.target.value) })} />
            </label>
            <Button variant="outline" onClick={() => run("settings", async () => { await call("save_settings", settingsDraft); toast({ title: "Limits saved" }); })} disabled={!!busy}>Save</Button>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Switch checked={!s.paused} onCheckedChange={(v) => run("pause", async () => { await call("save_settings", { ...settingsDraft, paused: !v }); })} aria-label="Sending on" />
              {s.paused ? "Paused" : "Sending on"}
            </div>
          </div>
          {s.last_sync_at && <p className="text-xs text-muted-foreground">Last checked Gmail {when(s.last_sync_at)}.</p>}
        </Section>
      )}
    </div>
  );
}
