import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Send, Plus, Sparkles, ImageIcon, Box, Eye, Tag, Wand2, Loader2, RotateCcw, Menu, X, Home, Pencil, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";

type Role = "user" | "assistant";

interface DBMessage {
  id: string;
  session_id: string;
  role: Role;
  content: string | null;
  image_urls: string[];
  metadata: Record<string, unknown>;
  created_at: string;
}

interface DBSession {
  id: string;
  title: string;
  active_image_url: string | null;
  category: string | null;
  updated_at: string;
}

const CATEGORIES = ["Chair", "Sofa", "Table", "Console", "Lamp", "Shelving", "Bed", "Decor"];

const STARTER_PROMPTS = [
  "A sculptural walnut accent chair with brass legs",
  "A sinuous travertine console, all in one tonal cream",
  "A monolithic blackened-oak dining table, six seats",
  "A pebble-form lamp in matte bone ceramic",
];

type AttachmentKind = "space" | "sketch" | "model";
interface Attachment {
  kind: AttachmentKind;
  name: string;
  previewUrl?: string; // object URL for images
  base64?: string;     // data URL for images sent to edge fn
  fileUrl?: string;    // public URL for 3d models (after upload)
  uploading?: boolean;
}

export default function DesignStudioChat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<DBSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("Chair");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const spaceInputRef = useRef<HTMLInputElement>(null);
  const sketchInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  // Auth gate
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate("/auth?redirect=/studio");
      } else {
        setUserId(data.user.id);
      }
    });
  }, [navigate]);

  // Load sessions
  useEffect(() => {
    if (!userId) return;
    void refreshSessions();
  }, [userId]);

  async function refreshSessions() {
    const { data, error } = await supabase
      .from("design_sessions")
      .select("id,title,active_image_url,category,updated_at")
      .order("updated_at", { ascending: false });
    if (!error && data) setSessions(data as DBSession[]);
  }

  // Load messages for active session
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      setActiveImage(null);
      return;
    }
    void loadMessages(activeSessionId);
  }, [activeSessionId]);

  async function loadMessages(sid: string) {
    const { data, error } = await supabase
      .from("design_messages")
      .select("id,session_id,role,content,image_urls,metadata,created_at")
      .eq("session_id", sid)
      .order("created_at", { ascending: true });
    if (!error && data) {
      const msgs = (data as any[]).map((m) => ({
        ...m,
        image_urls: Array.isArray(m.image_urls) ? m.image_urls : [],
        metadata: m.metadata ?? {},
      })) as DBMessage[];
      setMessages(msgs);
      const sess = sessions.find((s) => s.id === sid);
      setActiveImage(sess?.active_image_url ?? null);
      if (sess?.category) setCategory(sess.category);
    }
  }

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, busy]);

  // Keep textarea focused
  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy, activeSessionId]);

  async function startNewSession(initialPrompt?: string) {
    if (!userId) return null;
    const title = (initialPrompt ?? "Untitled design").slice(0, 80);
    const { data, error } = await supabase
      .from("design_sessions")
      .insert([{ user_id: userId, title, category }])
      .select("id,title,active_image_url,category,updated_at")
      .single();
    if (error || !data) {
      toast({ title: "Could not start session", description: error?.message, variant: "destructive" });
      return null;
    }
    setSessions((prev) => [data as DBSession, ...prev]);
    setActiveSessionId(data.id);
    setMessages([]);
    setActiveImage(null);
    return data.id;
  }

  async function insertMessage(sid: string, role: Role, content: string | null, image_urls: string[] = [], metadata: Record<string, unknown> = {}) {
    const { data, error } = await supabase
      .from("design_messages")
      .insert([{ session_id: sid, role, content, image_urls: image_urls as any, metadata: metadata as any }])
      .select("id,session_id,role,content,image_urls,metadata,created_at")
      .single();
    if (error || !data) {
      console.error("insertMessage error", error);
      return null;
    }
    const msg: DBMessage = {
      ...(data as any),
      image_urls: Array.isArray((data as any).image_urls) ? (data as any).image_urls : [],
      metadata: (data as any).metadata ?? {},
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }

  async function updateSessionActiveImage(sid: string, imageUrl: string, titleHint?: string) {
    setActiveImage(imageUrl);
    const patch: Record<string, unknown> = { active_image_url: imageUrl };
    if (titleHint) patch.title = titleHint.slice(0, 80);
    await supabase.from("design_sessions").update(patch).eq("id", sid);
    void refreshSessions();
  }

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
  }

  async function handleAttachFile(kind: AttachmentKind, file: File) {
    // Drop existing of same kind
    setAttachments((prev) => prev.filter((a) => a.kind !== kind));

    if (kind === "model") {
      // Upload to 3d-models bucket
      const placeholder: Attachment = { kind, name: file.name, uploading: true };
      setAttachments((prev) => [...prev, placeholder]);
      try {
        if (!userId) throw new Error("Sign in required");
        const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("3d-models").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("3d-models").getPublicUrl(path);
        setAttachments((prev) => prev.map((a) => a.kind === kind ? { ...a, uploading: false, fileUrl: pub.publicUrl } : a));
      } catch (e) {
        setAttachments((prev) => prev.filter((a) => a.kind !== kind));
        toast({ title: "Upload failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
      }
      return;
    }

    // space / sketch: keep as base64 + object URL preview
    try {
      const dataUrl = await fileToDataUrl(file);
      const previewUrl = URL.createObjectURL(file);
      setAttachments((prev) => [...prev, { kind, name: file.name, base64: dataUrl, previewUrl }]);
    } catch (e) {
      toast({ title: "Couldn't read file", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    }
  }

  function removeAttachment(kind: AttachmentKind) {
    setAttachments((prev) => {
      const found = prev.find((a) => a.kind === kind);
      if (found?.previewUrl) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((a) => a.kind !== kind);
    });
  }

  async function handleSend() {
    const text = input.trim();
    if ((!text && attachments.length === 0) || busy) return;
    setInput("");
    setBusy(true);
    const sent = attachments;
    setAttachments([]);

    try {
      let sid = activeSessionId;
      const isFirstMessage = !sid || messages.length === 0;

      if (!sid) {
        sid = await startNewSession(text);
        if (!sid) return;
      }

      const userAttachmentMeta = sent.map((a) => ({ kind: a.kind, name: a.name, fileUrl: a.fileUrl }));
      await insertMessage(sid, "user", text || (sent.length ? "(attachments)" : ""), [], { attachments: userAttachmentMeta });

      if (isFirstMessage || !activeImage) {
        // Generate 3 starting variations in parallel
        const placeholderMsg = await insertMessage(sid, "assistant", "Generating three starting directions…", [], { kind: "initial-variations", status: "pending" });

        const space = sent.find((a) => a.kind === "space");
        const sketch = sent.find((a) => a.kind === "sketch");
        const model = sent.find((a) => a.kind === "model");
        const promptWithModel = model?.fileUrl
          ? `${text}\n\n[Reference 3D model uploaded by user: ${model.fileUrl}]`
          : text;

        const results = await Promise.allSettled(
          [1, 2, 3].map((n) =>
            supabase.functions.invoke("generate-design", {
              body: {
                prompt: promptWithModel,
                variationNumber: n,
                generate3D: false,
                roomImageBase64: space?.base64,
                sketchImageBase64: sketch?.base64,
              },
            })
          )
        );

        const imageUrls: string[] = [];
        for (const r of results) {
          if (r.status === "fulfilled" && !r.value.error) {
            const url = (r.value.data as any)?.imageUrl;
            if (url) imageUrls.push(url);
          }
        }

        if (imageUrls.length === 0) {
          if (placeholderMsg) {
            await supabase.from("design_messages").update({
              content: "I couldn't generate any variations. Please try a different prompt or try again in a moment.",
              metadata: { kind: "initial-variations", status: "failed" },
            }).eq("id", placeholderMsg.id);
          }
          await loadMessages(sid);
          toast({ title: "Generation failed", description: "Try again or refine your prompt.", variant: "destructive" });
          return;
        }

        if (placeholderMsg) {
          await supabase.from("design_messages").update({
            content: "Here are three directions. Pick the one closest to what you're after — then we'll refine it together.",
            image_urls: imageUrls,
            metadata: { kind: "initial-variations", status: "ready" },
          }).eq("id", placeholderMsg.id);
        }
        await loadMessages(sid);
      } else {
        // Iterative edit — generate 3 alternatives so the creator can choose
        const placeholderMsg = await insertMessage(sid, "assistant", "Exploring three takes on that edit…", [], { kind: "edit-variations", status: "pending", basedOn: activeImage });

        const results = await Promise.allSettled(
          [1, 2, 3].map(() =>
            supabase.functions.invoke("edit-design", {
              body: { sessionId: sid, baseImageUrl: activeImage, editPrompt: text, category },
            })
          )
        );

        const editUrls: string[] = [];
        let lastErr = "";
        for (const r of results) {
          if (r.status === "fulfilled" && !r.value.error) {
            const url = (r.value.data as any)?.imageUrl;
            if (url) editUrls.push(url);
          } else if (r.status === "fulfilled") {
            lastErr = (r.value.error as any)?.message ?? "";
          }
        }

        if (editUrls.length === 0) {
          const msg = lastErr || "Edit failed";
          if (placeholderMsg) {
            await supabase.from("design_messages").update({
              content: `Couldn't apply that edit: ${msg}`,
              metadata: { kind: "edit-variations", status: "failed" },
            }).eq("id", placeholderMsg.id);
          }
          await loadMessages(sid);
          toast({ title: "Edit failed", description: msg, variant: "destructive" });
          return;
        }

        if (placeholderMsg) {
          await supabase.from("design_messages").update({
            content: editUrls.length === 1
              ? "Here's an option. Tap to make it the working version, or describe another change."
              : `Here ${editUrls.length === 2 ? "are two takes" : "are three takes"} on that change. Tap the one you want to keep building from.`,
            image_urls: editUrls,
            metadata: { kind: "edit-variations", status: "ready", basedOn: activeImage },
          }).eq("id", placeholderMsg.id);
        }
        await loadMessages(sid);
      }
    } catch (e) {
      console.error("handleSend error", e);
      toast({ title: "Something went wrong", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  async function pickVariation(imageUrl: string) {
    if (!activeSessionId) return;
    await updateSessionActiveImage(activeSessionId, imageUrl);
    toast({ title: "Variation selected", description: "Now describe what to change — material, color, proportions, anything." });
  }

  async function revertToImage(imageUrl: string) {
    if (!activeSessionId) return;
    await updateSessionActiveImage(activeSessionId, imageUrl);
    toast({ title: "Reverted", description: "Continue editing from this version." });
  }

  async function handleMakeManufacturable() {
    if (!activeImage) return;
    try {
      sessionStorage.setItem("studio-handoff-image", activeImage);
      sessionStorage.setItem("studio-handoff-category", category);
    } catch {}
    navigate(`/design-studio?fromStudio=1`);
  }

  function handleViewInAR() {
    if (!activeImage) return;
    try {
      sessionStorage.setItem("ar-product-image", activeImage);
    } catch {}
    navigate("/ar-viewer");
  }

  function comingSoon(name: string) {
    toast({ title: `${name} — coming soon`, description: "Wiring this in next. Your design is saved." });
  }

  const hasMessages = messages.length > 0;

  const Sidebar = (
    <div className="h-full flex flex-col bg-background border-r border-border">
      <div className="p-4 border-b border-border">
        <Button
          onClick={() => { setActiveSessionId(null); setSidebarOpen(false); inputRef.current?.focus(); }}
          className="w-full gap-2"
          variant="default"
        >
          <Plus className="w-4 h-4" /> New design
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-4 text-center">No designs yet. Start one above.</p>
          )}
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => { setActiveSessionId(s.id); setSidebarOpen(false); }}
              className={`w-full text-left rounded-md px-3 py-2 transition-colors flex items-center gap-2 ${
                activeSessionId === s.id ? "bg-accent text-foreground" : "hover:bg-accent/50 text-muted-foreground"
              }`}
            >
              {s.active_image_url ? (
                <img src={s.active_image_url} alt="" className="w-8 h-8 object-contain rounded bg-muted shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded bg-muted shrink-0 flex items-center justify-center">
                  <Wand2 className="w-3.5 h-3.5 text-muted-foreground/60" />
                </div>
              )}
              <span className="text-xs truncate flex-1">{s.title}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Design Studio — Nyzora"
        description="Conversational AI design canvas. Describe furniture, edit iteratively, and make it manufacturable."
      />
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 shrink-0">{Sidebar}</aside>

        {/* Mobile sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-72">
            {Sidebar}
          </SheetContent>
        </Sheet>

        {/* Main chat */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Top bar (mobile + active image badge) */}
          <div className="flex items-center justify-between gap-2 px-3 md:px-6 py-2 border-b border-border">
            <div className="flex items-center gap-2 min-w-0">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-4 h-4" />
              </Button>
              <Wand2 className="w-4 h-4 text-primary shrink-0" />
              <h1 className="text-sm font-medium truncate">Design Studio</h1>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full whitespace-nowrap transition-colors ${
                    category === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-3 md:px-6 py-6 space-y-6">
              {!hasMessages && (
                <div className="py-12 text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent">
                    <Wand2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl md:text-4xl font-light tracking-tight">
                      What are we <span className="italic font-serif">making real</span> today?
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                      Describe it, sketch it, or drop a photo of your space. We'll iterate together until it feels right — then lock it in and price it for production.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
                    {STARTER_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => setInput(p)}
                        className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  activeImage={activeImage}
                  onPickVariation={pickVariation}
                  onRevert={revertToImage}
                  onApplyFinish={() => comingSoon("Apply finish")}
                  onViewAR={handleViewInAR}
                  onGen3D={() => comingSoon("Generate 3D")}
                  onSeeInSpace={() => comingSoon("See in your space")}
                  onMakeManufacturable={handleMakeManufacturable}
                />
              ))}

              {busy && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking…</span>
                </div>
              )}
            </div>
          </div>

          {/* Active canvas + composer */}
          <div className="border-t border-border bg-background">
            <div className="max-w-3xl mx-auto px-3 md:px-6 py-3 space-y-2">
              {activeImage && (
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <img src={activeImage} alt="" className="w-10 h-10 object-contain rounded bg-muted" />
                  <span>Editing this design — describe the change</span>
                </div>
              )}

              {/* Attachment chips */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((a) => (
                    <div key={a.kind} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-border bg-accent/40 text-[11px]">
                      {a.previewUrl ? (
                        <img src={a.previewUrl} alt="" className="w-6 h-6 object-cover rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                          {a.kind === "model" ? <Box className="w-3 h-3" /> : a.kind === "sketch" ? <Pencil className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                        </div>
                      )}
                      <span className="capitalize">{a.kind === "model" ? "3D model" : a.kind}</span>
                      {a.uploading && <Loader2 className="w-3 h-3 animate-spin" />}
                      <button onClick={() => removeAttachment(a.kind)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Attach buttons row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <input ref={spaceInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleAttachFile("space", f); e.target.value = ""; }} />
                <input ref={sketchInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleAttachFile("sketch", f); e.target.value = ""; }} />
                <input ref={modelInputRef} type="file" accept=".glb,.gltf,.obj,.stl,.fbx,.usdz" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleAttachFile("model", f); e.target.value = ""; }} />
                <AttachButton icon={<Home className="w-3 h-3" />} label="Attach space" onClick={() => spaceInputRef.current?.click()} active={!!attachments.find(a=>a.kind==="space")} />
                <AttachButton icon={<Pencil className="w-3 h-3" />} label="Attach sketch" onClick={() => sketchInputRef.current?.click()} active={!!attachments.find(a=>a.kind==="sketch")} />
                <AttachButton icon={<Box className="w-3 h-3" />} label="Attach 3D model" onClick={() => modelInputRef.current?.click()} active={!!attachments.find(a=>a.kind==="model")} />
              </div>

              <div className="flex items-end gap-2">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    activeImage
                      ? "e.g. make the legs brushed brass, slightly taller, deeper seat"
                      : "Describe what you want to bring into the physical world…"
                  }
                  rows={2}
                  className="resize-none min-h-[56px]"
                  disabled={busy}
                />
                <Button
                  onClick={handleSend}
                  disabled={(!input.trim() && attachments.length === 0) || busy}
                  size="icon"
                  className="h-[56px] w-[56px] shrink-0"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function AttachButton({ icon, label, onClick, active }: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-full border transition-colors ${
        active
          ? "border-primary text-primary bg-primary/5"
          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
      }`}
    >
      <Paperclip className="w-3 h-3 opacity-60" />
      {icon}
      {label}
    </button>
  );
}

function MessageBubble({
  message,
  activeImage,
  onPickVariation,
  onRevert,
  onApplyFinish,
  onViewAR,
  onGen3D,
  onSeeInSpace,
  onMakeManufacturable,
}: {
  message: DBMessage;
  activeImage: string | null;
  onPickVariation: (url: string) => void;
  onRevert: (url: string) => void;
  onApplyFinish: () => void;
  onViewAR: () => void;
  onGen3D: () => void;
  onSeeInSpace: () => void;
  onMakeManufacturable: () => void;
}) {
  const isUser = message.role === "user";
  const kind = (message.metadata?.kind as string) ?? "";
  const status = (message.metadata?.status as string) ?? "ready";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] px-3.5 py-2 rounded-2xl rounded-br-sm bg-primary text-primary-foreground text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant
  const isInitialVariations = kind === "initial-variations";
  const isEdit = kind === "edit";
  const images = message.image_urls ?? [];
  const singleImage = images.length === 1 ? images[0] : null;
  const isActive = singleImage && singleImage === activeImage;

  return (
    <div className="space-y-3">
      {message.content && (
        <p className="text-sm text-foreground/90 leading-relaxed">{message.content}</p>
      )}

      {status === "pending" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> generating…
        </div>
      )}

      {/* Initial 3-variation grid */}
      {isInitialVariations && images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => onPickVariation(url)}
              className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                url === activeImage ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
              }`}
            >
              <img src={url} alt={`Variation ${i + 1}`} className="w-full h-full object-contain bg-muted" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity text-center">
                {url === activeImage ? "Selected" : "Pick this"}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Edit result — single image */}
      {isEdit && singleImage && (
        <div className="space-y-2">
          <div className={`relative rounded-lg overflow-hidden border-2 ${isActive ? "border-primary" : "border-border"}`}>
            <img src={singleImage} alt="Edited design" className="w-full max-h-[420px] object-contain bg-muted" />
          </div>
          {!isActive && (
            <Button variant="outline" size="sm" onClick={() => onRevert(singleImage)} className="gap-1.5">
              <RotateCcw className="w-3 h-3" /> Revert to this version
            </Button>
          )}
        </div>
      )}

      {/* Action toolbar — shown under any assistant message that has a singleImage OR when this is the latest with images */}
      {(singleImage || (isInitialVariations && activeImage)) && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          <ActionChip icon={<Sparkles className="w-3 h-3" />} label="Apply finish" onClick={onApplyFinish} />
          <ActionChip icon={<Eye className="w-3 h-3" />} label="View in AR" onClick={onViewAR} />
          <ActionChip icon={<Box className="w-3 h-3" />} label="Generate 3D" onClick={onGen3D} />
          <ActionChip icon={<ImageIcon className="w-3 h-3" />} label="See in your space" onClick={onSeeInSpace} />
          <ActionChip
            icon={<Tag className="w-3 h-3" />}
            label="Make manufacturable & price"
            onClick={onMakeManufacturable}
            primary
          />
        </div>
      )}
    </div>
  );
}

function ActionChip({ icon, label, onClick, primary }: { icon: React.ReactNode; label: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-full border transition-colors ${
        primary
          ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}