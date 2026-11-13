import { useCallback, useEffect, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Loader2, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea, type PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { Shimmer } from "@/components/ai-elements/shimmer";
import socialIcon from "@/assets/helper-social.png";
import adsIcon from "@/assets/helper-ads.png";

type Helper = "social" | "ads";
type Note = { id: string; note: string };

const CONFIG: Record<Helper, { name: string; icon: string; blurb: string; placeholder: string; starters: string[] }> = {
  social: {
    name: "Social helper",
    icon: socialIcon,
    blurb: "Edits, skips or restores upcoming posts, drafts new ones from our real photos for your OK, and remembers what you like.",
    placeholder: "e.g. Move tomorrow's Reel to 6 PM",
    starters: ["What's posting in the next 2 days?", "How did this week's posts do?", "Draft a carousel about how it works", "No more posts with text on the photo"],
  },
  ads: {
    name: "Ads helper",
    icon: adsIcon,
    blurb: "Explains the ad numbers in plain words and pauses ads when you ask. It can't turn ads on or raise spend.",
    placeholder: "e.g. Which ad is wasting money?",
    starters: ["How are the ads doing this week?", "Which ad should I pause?", "Who is clicking — ages and states?", "Why aren't previews turning into sales?"],
  },
};

const TOOL_TITLES: Record<string, string> = {
  list_posts: "Looked at posts", edit_post: "Changed a post", skip_post: "Skipped a post", restore_post: "Restored a post",
  list_media: "Looked at our photos & videos", draft_post: "Drafted a post", instagram_stats: "Read Instagram stats",
  ads_report: "Pulled the ads report", pause: "Paused", remember: "Remembered", forget: "Forgot a rule",
};

type ToolOut = {
  posts?: unknown[]; media?: unknown[]; when?: string; status?: string; name?: string;
  already_paused?: boolean; now?: string; days?: number;
};
type ToolPart = { type: string; state?: string; input?: unknown; output?: ToolOut | null; errorText?: string };

async function call(helper: Helper, action: string) {
  const { data, error } = await supabase.functions.invoke("admin-helper", { body: { helper, action } });
  if (error) {
    let msg = error.message;
    const ctx = (error as unknown as { context?: { text?: () => Promise<string> } }).context;
    if (ctx?.text) {
      try { msg = (JSON.parse(await ctx.text()) as { error?: string }).error ?? msg; } catch { /* keep */ }
    }
    throw new Error(msg);
  }
  return data;
}

/** One-line result for a finished tool, so the chat stays readable on a phone. */
function toolSummary(name: string, output: ToolOut | null | undefined): string {
  if (!output || typeof output !== "object") return String(output ?? "");
  if (name === "list_posts") return `${output.posts?.length ?? 0} posts`;
  if (name === "list_media") return `${output.media?.length ?? 0} photos/videos`;
  if (name === "draft_post") return `Draft for ${output.when} — approve it below in Coming up`;
  if (name === "edit_post" || name === "restore_post") return `${output.when ?? ""} · ${output.status ?? ""}`;
  if (name === "pause") return output.already_paused ? `${output.name} was already paused` : `${output.name}: ${output.now ?? "paused"}`;
  if (name === "ads_report") return `Last ${output.days ?? "?"} days`;
  if (name === "remember") return "Saved";
  return "Done";
}

function ChatWindow({ helper, initial, onCleared, onNotesChanged }: {
  helper: Helper; initial: UIMessage[]; onCleared: () => void; onNotesChanged: () => void;
}) {
  const { toast } = useToast();
  const cfg = CONFIG[helper];
  const [text, setText] = useState("");
  const transport = useMemo(() => new DefaultChatTransport({
    api: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-helper`,
    headers: async (): Promise<Record<string, string>> => {
      const { data } = await supabase.auth.getSession();
      return {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${data.session?.access_token ?? ""}`,
      };
    },
    body: { helper },
  }), [helper]);

  const { messages, sendMessage, status, stop, error } = useChat({
    id: `admin-helper-${helper}`,
    messages: initial,
    transport,
    onError: (e) => {
      const m = e.message || "";
      const desc = /429/.test(m) ? "Too many requests right now — try again in a minute."
        : /402/.test(m) ? "Lovable AI credits have run out. Top up in Settings → Plans & credits."
        : m.slice(0, 200) || "Network problem — check your connection.";
      toast({ title: `${cfg.name} couldn't answer`, description: desc, variant: "destructive" });
    },
    onFinish: ({ message }) => {
      if (message.parts.some((p) => p.type === "tool-remember" || p.type === "tool-forget")) onNotesChanged();
    },
  });
  const busy = status === "submitted" || status === "streaming";

  const send = (value: string) => {
    const t = value.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setText("");
  };

  return (
    <div className="flex h-[65vh] min-h-[420px] flex-col border border-border">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-5 p-3 sm:p-4">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<img src={cfg.icon} alt="" width={48} height={48} className="h-12 w-12 dark:invert" />}
              title={`Ask the ${cfg.name.toLowerCase()}`}
              description={cfg.blurb}
            >
              <img src={cfg.icon} alt="" width={48} height={48} className="h-12 w-12 dark:invert" />
              <p className="max-w-sm text-sm text-muted-foreground">{cfg.blurb}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {cfg.starters.map((s) => (
                  <Button key={s} size="sm" variant="outline" className="h-auto whitespace-normal py-1.5 text-xs" onClick={() => send(s)}>{s}</Button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent className={m.role === "user" ? "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground" : ""}>
                  {m.parts.map((part, i) => {
                    if (part.type === "text") {
                      return m.role === "user"
                        ? <p key={i} className="whitespace-pre-wrap">{part.text}</p>
                        : <MessageResponse key={i}>{part.text}</MessageResponse>;
                    }
                    if (part.type.startsWith("tool-")) {
                      const p = part as any;
                      const name = part.type.slice(5);
                      return (
                        <Tool key={i} defaultOpen={false} className="w-full">
                          <ToolHeader type={p.type} state={p.state} title={TOOL_TITLES[name] ?? name} />
                          <ToolContent>
                            <ToolInput input={p.input} />
                            <ToolOutput
                              output={p.state === "output-available" ? <span className="text-xs">{toolSummary(name, p.output)}</span> : undefined}
                              errorText={p.errorText}
                            />
                          </ToolContent>
                        </Tool>
                      );
                    }
                    return null;
                  })}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && (
            <Message from="assistant"><MessageContent><Shimmer>Thinking…</Shimmer></MessageContent></Message>
          )}
          {error && !busy && <p className="text-xs text-destructive">Something went wrong. Your message is saved; try sending again.</p>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="border-t border-border p-2">
        <PromptInput onSubmit={(msg: PromptInputMessage) => send(msg.text)}>
          <PromptInputTextarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={cfg.placeholder}
            className="min-h-12 text-sm"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} disabled={!busy && !text.trim()} />
          </PromptInputFooter>
        </PromptInput>
        <div className="mt-1 flex justify-end">
          <Button size="xs" variant="ghost" className="text-muted-foreground" disabled={busy || messages.length === 0}
            onClick={async () => {
              if (!confirm(`Clear the ${cfg.name.toLowerCase()} chat? Saved preferences stay.`)) return;
              try { await call(helper, "clear"); onCleared(); } catch (e) {
                toast({ title: "Couldn't clear", description: (e as Error).message, variant: "destructive" });
              }
            }}>
            <Trash2 className="mr-1 h-3 w-3" /> Clear chat
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminHelperChat({ helper }: { helper: Helper }) {
  const { toast } = useToast();
  const [state, setState] = useState<{ messages: UIMessage[]; notes: Note[]; key: number } | null>(null);
  const cfg = CONFIG[helper];

  const load = useCallback(async (bump = false) => {
    try {
      const d = await call(helper, "history");
      setState((s) => ({ messages: d.messages ?? [], notes: d.notes ?? [], key: bump ? (s?.key ?? 0) + 1 : s?.key ?? 0 }));
    } catch (e) {
      toast({ title: `Couldn't open the ${cfg.name.toLowerCase()}`, description: (e as Error).message, variant: "destructive" });
    }
  }, [helper, cfg.name, toast]);

  useEffect(() => { load(); }, [load]);

  const refreshNotes = useCallback(async () => {
    try { const d = await call(helper, "history"); setState((s) => s && { ...s, notes: d.notes ?? [] }); } catch { /* ignore */ }
  }, [helper]);

  const forget = async (id: string) => {
    const { error } = await supabase.from("admin_agent_notes").update({ active: false }).eq("id", id);
    if (error) toast({ title: "Couldn't remove", description: error.message, variant: "destructive" });
    else setState((s) => s && { ...s, notes: s.notes.filter((n) => n.id !== id) });
  };

  if (!state) return <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Opening {cfg.name.toLowerCase()}…</div>;

  return (
    <div className="space-y-2">
      <ChatWindow key={state.key} helper={helper} initial={state.messages}
        onCleared={() => load(true)} onNotesChanged={refreshNotes} />
      {state.notes.length > 0 && (
        <details className="border border-border p-2 text-xs">
          <summary className="cursor-pointer text-muted-foreground">Remembered rules ({state.notes.length})</summary>
          <ul className="mt-2 space-y-1">
            {state.notes.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-2">
                <span className="text-foreground">{n.note}</span>
                <button type="button" aria-label="Forget this rule" onClick={() => forget(n.id)} className="shrink-0 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export default AdminHelperChat;
