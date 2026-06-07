import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Send, Plus, Sparkles, ImageIcon, Box, Eye, Tag, Wand2, Loader2, Menu, X, Home, Pencil, Paperclip, Palette, Square, Check, Link as LinkIcon, ExternalLink, Maximize2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { storeDesignImages } from "@/lib/designTransfer";
import { ModelViewer3D } from "@/components/ModelViewer3D";
import { ARViewer } from "@/components/ARViewer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

const CATEGORIES = ["General", "Chair", "Sofa", "Table", "Console", "Lamp", "Shelving", "Bed", "Decor"];

// Map free-form category labels to canonical DB categories used on /browse
const DB_CATEGORY: Record<string, string> = {
  General: "decor",
  Chair: "chairs",
  Sofa: "sofas",
  Table: "dining-tables",
  Console: "consoles",
  Lamp: "lighting",
  Shelving: "shelving",
  Bed: "beds",
  Decor: "decor",
};

const STARTER_PROMPTS_BY_CATEGORY: Record<string, string[]> = {
  General: [
    "Here's a photo of my living room — redesign the whole space in warm minimalism with custom pieces",
    "I'm a designer working on a client's bedroom — let's create a full custom set together",
    "Reimagine this dining area end-to-end: table, chairs, lighting, and a console",
    "Plan a cohesive entryway — console, mirror, bench, and accent lighting in travertine and oak",
  ],
  Chair: [
    "A sculptural travertine accent chair, all tonal cream",
    "A solid walnut lounge chair with curved arms and bouclé seat",
    "A pebble-form resin accent chair in matte bone",
    "An oak dining chair with woven cord seat",
  ],
  Sofa: [
    "A low-slung bouclé 3-seater sofa in oat tone",
    "A modular travertine-base sofa with cream linen cushions",
    "A curved cream sofa with solid walnut plinth",
    "A deep-seat leather chesterfield in cognac",
  ],
  Table: [
    "A solid teak 6-seater dining table with tapered legs",
    "A mango wood round coffee table with chunky pedestal",
    "A sculptural travertine oval dining table",
    "An oak extension dining table with breadboard ends",
  ],
  Console: [
    "A walnut slatted console with brass-tipped feet",
    "A mango wood 4-drawer console, hand-finished",
    "A sculptural plaster console with arched base",
    "A solid oak hallway console with brass pulls",
  ],
  Lamp: [
    "A pebble-form table lamp in matte bone ceramic",
    "A sculptural travertine table lamp with linen shade",
    "A solid walnut tripod floor lamp with paper shade",
    "A monolithic plaster table lamp, all tonal cream",
  ],
  Shelving: [
    "An oak open shelving unit with slim brass uprights",
    "A walnut wall-mounted shelf with rounded edges",
    "A solid mango wood bookshelf, chunky planks",
    "A travertine-base floor shelf with oak shelves",
  ],
  Bed: [
    "An upholstered bouclé bed in oat with low headboard",
    "A solid walnut platform bed with paneled headboard",
    "A curved headboard bed in cream linen on oak base",
    "A mango wood low platform bed with woven headboard",
  ],
  Decor: [
    "A pebble-form ceramic vase set in matte bone",
    "A sculptural travertine bookend pair",
    "A solid walnut hand-turned bowl, organic form",
    "A tonal cream plaster sculpture, monolithic form",
  ],
};

const FINISHES: { name: string; prompt: string }[] = [
  { name: "Matte Black", prompt: "a sleek matte black finish with no shine, deep charcoal-black color" },
  { name: "Glossy White", prompt: "a bright glossy white lacquered finish with subtle reflections" },
  { name: "Walnut", prompt: "a rich warm walnut wood grain finish with natural wood texture" },
  { name: "Brushed Brass", prompt: "a warm brushed brass metallic finish with fine directional grain" },
];

// Keyword-based category auto-detection so prompts like "a pebble lamp" route to Lamp
// even when the user forgot to switch the category chip.
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Lamp: ["lamp", "lighting", "sconce", "pendant", "chandelier", "floor light"],
  Chair: ["chair", "armchair", "lounge chair", "accent chair", "dining chair", "stool"],
  Sofa: ["sofa", "couch", "settee", "loveseat", "chesterfield", "sectional"],
  Table: ["dining table", "coffee table", "side table", "end table", "table"],
  Console: ["console", "sideboard", "credenza", "buffet"],
  Shelving: ["shelf", "shelving", "bookshelf", "bookcase", "etagere"],
  Bed: ["bed", "headboard", "bedframe"],
  Decor: ["vase", "bowl", "sculpture", "bookend", "decor", "ornament"],
  General: ["my room", "my space", "my living", "my bedroom", "my dining", "redesign the", "whole room", "whole space", "entire room", "entire space", "full set", "client's "],
};

function detectCategoryFromPrompt(text: string): string | null {
  const t = text.toLowerCase();
  // General wins if it clearly describes a whole space
  for (const kw of CATEGORY_KEYWORDS.General) {
    if (t.includes(kw)) return "General";
  }
  // Score categories by keyword hits; longer keywords win
  let best: { cat: string; score: number } | null = null;
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (cat === "General") continue;
    for (const kw of kws) {
      if (t.includes(kw) && (!best || kw.length > best.score)) {
        best = { cat, score: kw.length };
      }
    }
  }
  return best?.cat ?? null;
}

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
  const spacePreviewInputRef = useRef<HTMLInputElement>(null);
  const [arOpen, setArOpen] = useState(false);
  const [arImage, setArImage] = useState<string | null>(null);
  const runIdRef = useRef(0);
  const cancelledRunsRef = useRef<Set<number>>(new Set());
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [designerProfileId, setDesignerProfileId] = useState<string | null>(null);

  function bumpRun() {
    runIdRef.current += 1;
    return runIdRef.current;
  }
  function isStale(runId: number) {
    return runId !== runIdRef.current || cancelledRunsRef.current.has(runId);
  }
  function stopGeneration() {
    if (!busy) return;
    const stoppedId = runIdRef.current;
    cancelledRunsRef.current.add(stoppedId);
    runIdRef.current += 1; // any future state writes from in-flight handlers will see stale id
    setBusy(false);
    // Mark any currently-pending placeholder messages as stopped
    void markPendingAsStopped();
    toast({ title: "Stopped" });
  }

  async function markPendingAsStopped() {
    if (!activeSessionId) return;
    const pending = messages.filter((m) => m.role === "assistant" && (m.metadata as any)?.status === "pending");
    for (const m of pending) {
      const md = { ...(m.metadata ?? {}), status: "stopped" } as Record<string, unknown>;
      await supabase.from("design_messages").update({
        content: "Stopped.",
        metadata: md as any,
      }).eq("id", m.id);
    }
    await loadMessages(activeSessionId);
  }

  // Auth gate
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate("/auth?redirect=/studio");
      } else {
        setUserId(data.user.id);
        setUserEmail(data.user.email ?? null);
        const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
        const fullName = (meta.full_name as string) || (meta.name as string) || "";
        setUserName(fullName);
      }
    });
  }, [navigate]);

  // Load existing designer profile id once we know the user
  useEffect(() => {
    if (!userId) return;
    void (async () => {
      const { data } = await supabase
        .from("designer_profiles")
        .select("id,name")
        .eq("user_id", userId)
        .maybeSingle();
      if (data?.id) {
        setDesignerProfileId(data.id);
        if (data.name && !userName) setUserName(data.name);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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

  // Handle ?prompt= query param: prefill and auto-send once user is ready
  const autoPromptHandledRef = useRef(false);
  useEffect(() => {
    if (!userId || autoPromptHandledRef.current) return;
    const p = searchParams.get("prompt");
    if (!p) return;
    autoPromptHandledRef.current = true;
    void handleSend(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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

  function isDataImageUrl(url: string) {
    return url.startsWith("data:image/");
  }

  async function storeStudioImageUrl(imageUrl: string, sid: string) {
    if (!isDataImageUrl(imageUrl)) return imageUrl;
    if (!userId) throw new Error("Sign in required");

    const blob = await (await fetch(imageUrl)).blob();
    const match = imageUrl.match(/^data:image\/(\w+);base64,/);
    const rawExt = match?.[1] ?? "png";
    const ext = rawExt === "jpeg" ? "jpg" : rawExt;
    const filePath = `studio-sessions/${userId}/${sid}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(filePath, blob, {
      contentType: blob.type || `image/${rawExt}`,
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
    return data.publicUrl;
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

  async function handleSend(overrideText?: string) {
    const text = (overrideText ?? input).trim();
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

      // Upload image attachments (space/sketch) so they persist in chat history
      const userImageUrls: string[] = [];
      for (const a of sent) {
        if ((a.kind === "space" || a.kind === "sketch") && a.base64 && !a.fileUrl) {
          try {
            const publicUrl = await storeStudioImageUrl(a.base64, sid);
            if (publicUrl) {
              a.fileUrl = publicUrl;
              userImageUrls.push(publicUrl);
            }
          } catch (err) {
            console.error("Failed to persist attachment", err);
          }
        } else if (a.fileUrl && (a.kind === "space" || a.kind === "sketch")) {
          userImageUrls.push(a.fileUrl);
        }
      }
      const userAttachmentMeta = sent.map((a) => ({ kind: a.kind, name: a.name, fileUrl: a.fileUrl }));
      await insertMessage(sid, "user", text || (sent.length ? "(attachments)" : ""), userImageUrls, { attachments: userAttachmentMeta });

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

        const rawImageUrls: string[] = [];
        for (const r of results) {
          if (r.status === "fulfilled" && !r.value.error) {
            const url = (r.value.data as any)?.imageUrl;
            if (url) rawImageUrls.push(url);
          }
        }

        const imageUrls = (await Promise.all(
          rawImageUrls.map((url) => storeStudioImageUrl(url, sid))
        )).filter(Boolean);

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
        const baseImageUrl = await storeStudioImageUrl(activeImage, sid);
        if (baseImageUrl !== activeImage) {
          await updateSessionActiveImage(sid, baseImageUrl);
        }
        const placeholderMsg = await insertMessage(sid, "assistant", "Exploring three takes on that edit…", [], { kind: "edit-variations", status: "pending", basedOn: baseImageUrl });

        // Build session context so the editor model understands the original
        // subject and prior edits — prevents drift (e.g. lamp → chair after a
        // vague comment like "can't see the full image").
        const userTurns = messages.filter((m) => m.role === "user" && (m.content ?? "").trim().length > 0);
        const originalPrompt = userTurns[0]?.content ?? "";
        const priorEdits = userTurns.slice(1).map((m) => (m.content ?? "").trim()).filter(Boolean);
        const isGeneralMode = category === "General";

        const results = await Promise.allSettled(
          [1, 2, 3].map(() =>
            supabase.functions.invoke("edit-design", {
              body: {
                sessionId: sid,
                baseImageUrl,
                editPrompt: text,
                category,
                originalPrompt,
                priorEdits,
                mode: isGeneralMode ? "general" : "product",
              },
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
            metadata: { kind: "edit-variations", status: "ready", basedOn: baseImageUrl },
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

  async function updateAssistantMessage(messageId: string, patch: Partial<DBMessage>) {
    await supabase.from("design_messages").update(patch as any).eq("id", messageId);
    if (activeSessionId) await loadMessages(activeSessionId);
  }

  async function handleApplyFinish(finishName: string) {
    if (!activeImage || !activeSessionId || busy) return;
    const finish = FINISHES.find((f) => f.name === finishName);
    if (!finish) return;
    setBusy(true);
    try {
      const sid = activeSessionId;
      const baseImageUrl = await storeStudioImageUrl(activeImage, sid);
      if (baseImageUrl !== activeImage) await updateSessionActiveImage(sid, baseImageUrl);

      await insertMessage(sid, "user", `Apply finish: ${finishName}`, [], { kind: "finish-request" });
      const placeholder = await insertMessage(
        sid,
        "assistant",
        `Re-rendering in ${finishName}…`,
        [],
        { kind: "finish-result", status: "pending", finishName, basedOn: baseImageUrl },
      );

      const editPrompt = `Re-render this exact furniture piece with ${finish.prompt}. Keep the same shape, angle, proportions, pose, lighting and background — only change the surface finish.`;
      const { data, error } = await supabase.functions.invoke("edit-design", {
        body: { sessionId: sid, baseImageUrl, editPrompt, category },
      });

      if (error || !(data as any)?.imageUrl) {
        const msg = (error as any)?.message ?? "Finish render failed";
        if (placeholder) await updateAssistantMessage(placeholder.id, { content: `Couldn't apply ${finishName}: ${msg}`, metadata: { kind: "finish-result", status: "failed", finishName } as any });
        toast({ title: "Finish failed", description: msg, variant: "destructive" });
        return;
      }

      if (placeholder) {
        await updateAssistantMessage(placeholder.id, {
          content: `${finishName} applied. Tap to make it the working version.`,
          image_urls: [(data as any).imageUrl] as any,
          metadata: { kind: "finish-result", status: "ready", finishName, basedOn: baseImageUrl } as any,
        });
      }
    } catch (e) {
      toast({ title: "Finish failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  function triggerSeeInSpace() {
    if (!activeImage || busy) return;
    const prior = getLastUploadedSpaceUrl();
    if (prior) {
      void handleSeeInSpace({ url: prior });
    } else {
      spacePreviewInputRef.current?.click();
    }
  }

  function getLastUploadedSpaceUrl(): string | null {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role !== "user") continue;
      const atts = (m.metadata as any)?.attachments as Array<{ kind: string; fileUrl?: string }> | undefined;
      const space = atts?.find((a) => a.kind === "space" && a.fileUrl);
      if (space?.fileUrl) return space.fileUrl;
      // fallback: first image on a message that has space attachment metadata
      const hasSpaceMeta = atts?.some((a) => a.kind === "space");
      if (hasSpaceMeta && m.image_urls?.[0]) return m.image_urls[0];
    }
    return null;
  }

  async function urlToDataUrl(url: string): Promise<string> {
    const blob = await (await fetch(url)).blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  }

  async function handleSeeInSpaceFile(file: File) {
    const spaceDataUrl = await fileToDataUrl(file);
    await handleSeeInSpace({ base64: spaceDataUrl });
  }

  async function handleSeeInSpace(source: { base64?: string; url?: string }) {
    if (!activeImage || !activeSessionId) return;
    setBusy(true);
    try {
      const sid = activeSessionId;
      const spaceDataUrl = source.base64 ?? (source.url ? await urlToDataUrl(source.url) : null);
      if (!spaceDataUrl) throw new Error("No space image provided");
      const spaceDisplayUrl = source.url ?? null;
      const productImageUrl = await storeStudioImageUrl(activeImage, sid);

      await insertMessage(
        sid,
        "user",
        "Place this in my space",
        spaceDisplayUrl ? [spaceDisplayUrl] : [],
        { kind: "space-request", attachments: spaceDisplayUrl ? [{ kind: "space", name: "space", fileUrl: spaceDisplayUrl }] : [] },
      );
      const placeholder = await insertMessage(
        sid,
        "assistant",
        "Composing this into your space…",
        [],
        { kind: "space-result", status: "pending", basedOn: productImageUrl },
      );

      const { data, error } = await supabase.functions.invoke("generate-space-preview", {
        body: {
          spaceImageBase64: spaceDataUrl,
          productImageUrl,
          productName: category,
          category,
        },
      });

      if (error || !(data as any)?.imageUrl) {
        const msg = (error as any)?.message ?? "Space preview failed";
        if (placeholder) await updateAssistantMessage(placeholder.id, { content: `Couldn't place it in the space: ${msg}`, metadata: { kind: "space-result", status: "failed" } as any });
        toast({ title: "Space preview failed", description: msg, variant: "destructive" });
        return;
      }

      const storedUrl = await storeStudioImageUrl((data as any).imageUrl, sid);
      if (placeholder) {
        await updateAssistantMessage(placeholder.id, {
          content: "Here it is in your space.",
          image_urls: [storedUrl] as any,
          metadata: { kind: "space-result", status: "ready", basedOn: productImageUrl } as any,
        });
      }
    } catch (e) {
      toast({ title: "Space preview failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function poll3DTask(messageId: string, taskId: string) {
    const max = 60;
    let attempts = 0;
    const tick = async () => {
      attempts++;
      try {
        const { data } = await supabase.functions.invoke("check-3d-status", { body: { taskId } });
        const status = (data as any)?.status;
        const modelUrl = (data as any)?.modelUrl;
        const progress = (data as any)?.progress;
        if (status === "SUCCEEDED" && modelUrl) {
          await updateAssistantMessage(messageId, {
            content: "3D model ready. Drag to rotate.",
            metadata: { kind: "3d-result", status: "ready", modelUrl, taskId } as any,
          });
          toast({ title: "3D model ready" });
          return;
        }
        if (status === "FAILED") {
          await updateAssistantMessage(messageId, {
            content: "3D model generation failed. Please try again.",
            metadata: { kind: "3d-result", status: "failed", taskId } as any,
          });
          return;
        }
        if (attempts < max) {
          await updateAssistantMessage(messageId, {
            content: `Building 3D model… ${typeof progress === "number" ? progress + "%" : ""}`.trim(),
            metadata: { kind: "3d-result", status: "pending", taskId, progress } as any,
          });
          setTimeout(tick, 10000);
        } else {
          await updateAssistantMessage(messageId, {
            content: "3D model is taking longer than expected. Check back shortly.",
            metadata: { kind: "3d-result", status: "timeout", taskId } as any,
          });
        }
      } catch (e) {
        await updateAssistantMessage(messageId, {
          content: "Lost connection while building the 3D model.",
          metadata: { kind: "3d-result", status: "failed", taskId } as any,
        });
      }
    };
    setTimeout(tick, 5000);
  }

  async function handleGenerate3D() {
    if (!activeImage || !activeSessionId || busy) return;
    setBusy(true);
    try {
      const sid = activeSessionId;
      const baseImageUrl = await storeStudioImageUrl(activeImage, sid);
      if (baseImageUrl !== activeImage) await updateSessionActiveImage(sid, baseImageUrl);

      await insertMessage(sid, "user", "Generate a 3D model", [], { kind: "3d-request" });
      const placeholder = await insertMessage(
        sid,
        "assistant",
        "Starting 3D model generation…",
        [],
        { kind: "3d-result", status: "pending", basedOn: baseImageUrl },
      );

      const { data, error } = await supabase.functions.invoke("generate-design", {
        body: { generate3D: true, imageUrl: baseImageUrl },
      });

      const taskId = (data as any)?.taskId;
      if (error || !taskId) {
        const msg = (error as any)?.message ?? "Could not start 3D generation";
        if (placeholder) await updateAssistantMessage(placeholder.id, { content: msg, metadata: { kind: "3d-result", status: "failed" } as any });
        toast({ title: "3D failed", description: msg, variant: "destructive" });
        return;
      }

      if (placeholder) void poll3DTask(placeholder.id, taskId);
    } catch (e) {
      toast({ title: "3D failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function handleMakeManufacturable() {
    if (!activeImage || !activeSessionId || busy) return;
    const sid = activeSessionId;
    if (!designerProfileId) {
      await insertMessage(
        sid,
        "assistant",
        "Quick step — I just need your name to set up your creator account. Your designs will go out as you.",
        [],
        { kind: "creator-register", status: "ready", suggestedName: userName, email: userEmail },
      );
      return;
    }
    await beginPricingFlow(sid, designerProfileId);
  }

  async function handleCreatorRegister(messageId: string, name: string) {
    if (!userId || !userEmail) {
      toast({ title: "Please sign in", variant: "destructive" });
      return;
    }
    const clean = name.trim();
    if (clean.length < 2) {
      toast({ title: "Name required", description: "Please enter your full name.", variant: "destructive" });
      return;
    }
    const sid = activeSessionId!;
    setBusy(true);
    try {
      const { data: profile, error } = await supabase
        .from("designer_profiles")
        .insert({
          user_id: userId,
          name: clean,
          email: userEmail,
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          status: "approved",
        })
        .select("id")
        .single();
      if (error || !profile) throw error ?? new Error("Could not create profile");
      setDesignerProfileId(profile.id);
      setUserName(clean);
      await supabase.from("design_messages").update({
        content: `✓ Welcome, ${clean}. You're set up as a creator.`,
        metadata: { kind: "creator-register", status: "done", name: clean } as any,
      }).eq("id", messageId);
      await loadMessages(sid);
      await beginPricingFlow(sid, profile.id);
    } catch (e) {
      toast({ title: "Couldn't create profile", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function beginPricingFlow(sid: string, profileId: string) {
    if (!activeImage) return;
    setBusy(true);
    const runId = bumpRun();
    const dbCategory = DB_CATEGORY[category] ?? category.toLowerCase();
    const placeholder = await insertMessage(
      sid,
      "assistant",
      "Sizing this up and pricing it — give me a few seconds…",
      [],
      { kind: "confirm-listing", status: "pending" },
    );
    try {
      const baseImageUrl = await storeStudioImageUrl(activeImage, sid);
      if (baseImageUrl !== activeImage) await updateSessionActiveImage(sid, baseImageUrl);

      // Derive working title from the latest user prompt or session title
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
      const seedTitle = (lastUserMsg?.content || sessions.find((s) => s.id === sid)?.title || `${category} design`).slice(0, 80);

      // 1) Default dimensions per category (will be confirmed/edited by user)
      const defaults: Record<string, { length: number; breadth: number; height: number }> = {
        "dining-tables": { length: 180, breadth: 90, height: 75 },
        "coffee-tables": { length: 110, breadth: 60, height: 40 },
        "consoles": { length: 120, breadth: 35, height: 80 },
        "chairs": { length: 65, breadth: 70, height: 85 },
        "sofas": { length: 200, breadth: 90, height: 80 },
        "lighting": { length: 35, breadth: 35, height: 150 },
        "shelving": { length: 80, breadth: 35, height: 180 },
        "beds": { length: 200, breadth: 165, height: 110 },
        "decor": { length: 30, breadth: 30, height: 40 },
      };
      const dims = defaults[dbCategory] ?? { length: 80, breadth: 50, height: 60 };

      // 2) Ask AI for pricing
      let basePrice = 12000;
      let suggestedPrice = 18000;
      let pricingReasoning = "";
      try {
        const { data: priceData } = await supabase.functions.invoke("recalculate-pricing", {
          body: {
            productName: seedTitle,
            category: dbCategory,
            description: lastUserMsg?.content ?? "",
            dimensions: { width: dims.length, depth: dims.breadth, height: dims.height },
          },
        });
        if (priceData?.base_price) basePrice = Math.round(Number(priceData.base_price));
        if (priceData?.designer_price) suggestedPrice = Math.round(Number(priceData.designer_price));
        if (priceData?.reasoning) pricingReasoning = priceData.reasoning;
      } catch (e) {
        console.warn("Pricing fallback", e);
      }

      // 3) Ask AI for a polished title in background (non-blocking)
      let polishedTitle = seedTitle;
      try {
        const { data: titleData } = await supabase.functions.invoke("generate-product-title", {
          body: { prompt: lastUserMsg?.content ?? seedTitle, category: dbCategory },
        });
        if (titleData?.title) polishedTitle = String(titleData.title).slice(0, 80);
      } catch (e) { /* keep seed title */ }

      if (isStale(runId)) return;

      // 4) Render confirmation card
      if (placeholder) {
        await supabase.from("design_messages").update({
          content: "Here's everything ready to publish. Review and tweak anything — I'll list it the moment you confirm.",
          metadata: {
            kind: "confirm-listing",
            status: "ready",
            profileId,
            imageUrl: baseImageUrl,
            title: polishedTitle,
            dbCategory,
            dimensions: dims,
            basePrice,
            suggestedPrice,
            pricingReasoning,
          } as any,
        }).eq("id", placeholder.id);
      }
      await loadMessages(sid);

      // 5) Fire off production drawing (non-blocking, runs in background as a separate message)
      void generateProductionDrawing(sid, baseImageUrl, polishedTitle, dbCategory, dims);
    } catch (e) {
      if (placeholder) {
        await supabase.from("design_messages").update({
          content: "Couldn't prepare the listing. Please try again.",
          metadata: { kind: "confirm-listing", status: "failed" } as any,
        }).eq("id", placeholder.id);
      }
      toast({ title: "Pricing failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function generateProductionDrawing(
    sid: string,
    imageUrl: string,
    productName: string,
    dbCategory: string,
    dimensions: { length: number; breadth: number; height: number },
  ) {
    const placeholder = await insertMessage(
      sid,
      "assistant",
      "Drafting a production-reference drawing — front, side & top views with dimensions…",
      [],
      { kind: "production-drawing", status: "pending" },
    );
    try {
      const { data, error } = await supabase.functions.invoke("generate-production-drawing", {
        body: { imageUrl, productName, category: dbCategory, dimensions },
      });
      if (error || !data?.imageUrl) throw error ?? new Error("No drawing returned");
      if (placeholder) {
        await supabase.from("design_messages").update({
          content: "📐 AI-predicted production drawing. This is a manufacturing reference — your assigned maker will refine the final shop drawing before cutting.",
          image_urls: [data.imageUrl],
          metadata: { kind: "production-drawing", status: "ready" } as any,
        }).eq("id", placeholder.id);
      }
      await loadMessages(sid);
    } catch (e) {
      console.warn("Production drawing failed", e);
      if (placeholder) {
        await supabase.from("design_messages").update({
          content: "Couldn't generate the production drawing this time — but you can still publish; makers will draft one from the reference image.",
          metadata: { kind: "production-drawing", status: "failed" } as any,
        }).eq("id", placeholder.id);
        await loadMessages(sid);
      }
    }
  }

  async function handlePublishListing(
    messageId: string,
    edits: {
      title: string;
      dbCategory: string;
      dimensions: { length: number; breadth: number; height: number };
      basePrice: number;
      designerPrice: number;
      imageUrl: string;
      profileId: string;
    },
  ) {
    if (!activeSessionId) return;
    const sid = activeSessionId;
    setBusy(true);
    try {
      // Generate description in background
      let description = edits.title;
      try {
        const { data: descData } = await supabase.functions.invoke("generate-product-description", {
          body: {
            productName: edits.title,
            category: edits.dbCategory,
            materials: "High-grade resin reinforced with composite fibre, or solid wood with hand-finished joinery — material chosen to match the design.",
            dimensions: { width: edits.dimensions.length, depth: edits.dimensions.breadth, height: edits.dimensions.height },
          },
        });
        if (descData?.description) description = descData.description;
      } catch { /* keep title as fallback description */ }

      // Calculate weight (best-effort)
      let weight = 15;
      try {
        const { data: weightData } = await supabase.functions.invoke("calculate-weight", {
          body: {
            dimensions: { width: edits.dimensions.length, depth: edits.dimensions.breadth, height: edits.dimensions.height },
            category: edits.dbCategory,
            productName: edits.title,
          },
        });
        if (weightData?.weight) weight = Number(weightData.weight);
      } catch { /* default */ }

      const { data: newProduct, error: productError } = await supabase
        .from("designer_products")
        .insert({
          designer_id: edits.profileId,
          name: edits.title,
          description: description.length >= 10 ? description : `${edits.title} — a Nyzora-crafted piece, made on demand by our maker network.`,
          category: edits.dbCategory,
          base_price: edits.basePrice,
          designer_price: edits.designerPrice,
          original_designer_price: edits.designerPrice,
          image_url: edits.imageUrl,
          weight,
          dimensions: edits.dimensions,
          status: "approved",
        })
        .select("id, slug")
        .single();
      if (productError || !newProduct) throw productError ?? new Error("Insert failed");

      // Listing record (fee waived per current policy)
      await supabase.from("design_listings").insert({
        product_id: newProduct.id,
        listing_fee_paid: true,
        three_d_fee_paid: false,
      });

      const slugOrId = newProduct.slug || newProduct.id;
      const productPath = `/product/${slugOrId}`;

      await supabase.from("design_messages").update({
        content: `✓ Listed. Your product is live now — ${edits.title}.`,
        metadata: {
          kind: "listing-published",
          status: "done",
          productId: newProduct.id,
          productPath,
          productTitle: edits.title,
          imageUrl: edits.imageUrl,
          designerPrice: edits.designerPrice,
        } as any,
      }).eq("id", messageId);
      await loadMessages(sid);
      toast({ title: "Published", description: "Your product is live on Nyzora." });
    } catch (e) {
      toast({ title: "Couldn't publish", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  function handleViewInAR() {
    if (!activeImage) return;
    setArImage(activeImage);
    setArOpen(true);
  }

  const hasMessages = messages.length > 0;

  const Sidebar = (
    <div className="h-full w-full flex flex-col bg-background border-r border-border overflow-hidden">
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
      <div className="p-3 border-t border-border">
        <p className="text-[10px] leading-snug text-muted-foreground text-center">
          Chats are saved and synced for <span className="text-foreground font-medium">30 days</span>, then automatically deleted.
        </p>
      </div>
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
        <aside className="hidden md:flex w-64 shrink-0 overflow-hidden">{Sidebar}</aside>

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
                    {(STARTER_PROMPTS_BY_CATEGORY[category] ?? []).map((p) => (
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
                  onApplyFinish={handleApplyFinish}
                  onViewAR={handleViewInAR}
                  onGen3D={handleGenerate3D}
                  onSeeInSpace={triggerSeeInSpace}
                  onMakeManufacturable={handleMakeManufacturable}
                  onCreatorRegister={handleCreatorRegister}
                  onPublishListing={handlePublishListing}
                  onOpenProduct={(path) => navigate(path)}
                  busy={busy}
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
                <input ref={spacePreviewInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleSeeInSpaceFile(f); e.target.value = ""; }} />
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
                  onClick={busy ? stopGeneration : () => handleSend()}
                  disabled={!busy && (!input.trim() && attachments.length === 0)}
                  size="icon"
                  className="h-[56px] w-[56px] shrink-0"
                  variant={busy ? "outline" : "default"}
                  title={busy ? "Stop" : "Send"}
                >
                  {busy ? <Square className="w-4 h-4 fill-current" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Dialog open={arOpen} onOpenChange={setArOpen}>
        <DialogContent className="max-w-4xl w-[95vw] p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="text-sm font-medium">View in your space (AR)</DialogTitle>
          </DialogHeader>
          <div className="h-[70vh] w-full">
            {arImage && (
              <ARViewer
                productName="Studio design"
                imageUrl={arImage}
                isDesignStudio={true}
                category={category}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
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
  onCreatorRegister,
  onPublishListing,
  onOpenProduct,
  busy,
}: {
  message: DBMessage;
  activeImage: string | null;
  onPickVariation: (url: string) => void;
  onRevert: (url: string) => void;
  onApplyFinish: (finishName: string) => void;
  onViewAR: () => void;
  onGen3D: () => void;
  onSeeInSpace: () => void;
  onMakeManufacturable: () => void;
  onCreatorRegister: (messageId: string, name: string) => void;
  onPublishListing: (
    messageId: string,
    edits: {
      title: string;
      dbCategory: string;
      dimensions: { length: number; breadth: number; height: number };
      basePrice: number;
      designerPrice: number;
      imageUrl: string;
      profileId: string;
    },
  ) => void;
  onOpenProduct: (path: string) => void;
  busy?: boolean;
}) {
  const isUser = message.role === "user";
  const kind = (message.metadata?.kind as string) ?? "";
  const status = (message.metadata?.status as string) ?? "ready";
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (isUser) {
    const userImages = message.image_urls ?? [];
    const userAttachments = (message.metadata?.attachments as Array<{ kind: string; name: string; fileUrl?: string }> | undefined) ?? [];
    const modelAttachments = userAttachments.filter((a) => a.kind === "model");
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] flex flex-col items-end gap-1.5">
          {userImages.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-end">
              {userImages.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxUrl(url)}
                  className="block rounded-lg overflow-hidden border border-border bg-muted"
                >
                  <img src={url} alt="Uploaded reference" className="w-32 h-32 object-cover" />
                </button>
              ))}
            </div>
          )}
          {modelAttachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-end">
              {modelAttachments.map((a, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-border bg-accent/40 text-[11px] text-foreground">
                  <Box className="w-3 h-3" />
                  <span className="truncate max-w-[140px]">{a.name}</span>
                </div>
              ))}
            </div>
          )}
          {message.content && message.content !== "(attachments)" && (
            <div className="px-3.5 py-2 rounded-2xl rounded-br-sm bg-primary text-primary-foreground text-sm leading-relaxed">
              {message.content}
            </div>
          )}
          {lightboxUrl && (
            <Dialog open={!!lightboxUrl} onOpenChange={(o) => !o && setLightboxUrl(null)}>
              <DialogContent className="max-w-4xl p-2 bg-background">
                <img src={lightboxUrl} alt="Uploaded reference" className="w-full h-auto rounded" />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    );
  }

  // Assistant
  const isInitialVariations = kind === "initial-variations";
  const isEditVariations = kind === "edit-variations";
  const isVariations = isInitialVariations || isEditVariations;
  const isFinishResult = kind === "finish-result";
  const isSpaceResult = kind === "space-result";
  const is3DResult = kind === "3d-result";
  const isCreatorRegister = kind === "creator-register";
  const isConfirmListing = kind === "confirm-listing";
  const isListingPublished = kind === "listing-published";
  const isProductionDrawing = kind === "production-drawing";
  const modelUrl = (message.metadata?.modelUrl as string | undefined) ?? undefined;
  const images = message.image_urls ?? [];
  const hasActiveInGrid = isVariations && images.some((u) => u === activeImage);
  const singleResultUrl = (isFinishResult || isSpaceResult) && status === "ready" ? images[0] : null;

  return (
    <div className="space-y-3">
      {message.content && (
        <p className="text-sm text-foreground/90 leading-relaxed">{message.content}</p>
      )}

      {status === "pending" && !isConfirmListing && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> generating…
        </div>
      )}

      {/* Inline creator registration card */}
      {isCreatorRegister && status === "ready" && (
        <CreatorRegisterCard
          messageId={message.id}
          suggestedName={(message.metadata?.suggestedName as string) || ""}
          email={(message.metadata?.email as string) || ""}
          onSubmit={onCreatorRegister}
          busy={!!busy}
        />
      )}

      {/* Inline pricing & publish card */}
      {isConfirmListing && status === "pending" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> sizing &amp; pricing…
        </div>
      )}
      {isConfirmListing && status === "ready" && (
        <ConfirmListingCard
          messageId={message.id}
          metadata={message.metadata as any}
          onPublish={onPublishListing}
          busy={!!busy}
        />
      )}

      {/* Listing published success card */}
      {isListingPublished && (
        <PublishedCard metadata={message.metadata as any} onOpenProduct={onOpenProduct} />
      )}

      {/* AI-predicted production drawing */}
      {isProductionDrawing && status === "ready" && images[0] && (
        <div className="rounded-lg overflow-hidden border border-border bg-white max-w-md relative group">
          <button
            type="button"
            onClick={() => setLightboxUrl(images[0])}
            className="block w-full"
            aria-label="Preview drawing"
          >
            <img src={images[0]} alt="Production drawing" className="w-full aspect-[4/3] object-contain bg-white" />
          </button>
          <ImageOverlayActions url={images[0]} onExpand={() => setLightboxUrl(images[0])} filename="production-drawing.png" />
          <div className="px-3 py-2 border-t border-border bg-card text-[10px] uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Manufacturing Reference</span>
            <span>Nyzora · AI predicted</span>
          </div>
        </div>
      )}

      {/* Variation grid (initial OR per-edit candidates) */}
      {isVariations && images.length > 0 && (
        <div className={`grid gap-2 ${images.length === 1 ? "grid-cols-1 max-w-md" : "grid-cols-2 md:grid-cols-3"}`}>
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => onPickVariation(url)}
              className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                url === activeImage ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
              }`}
            >
              <img src={url} alt={`Option ${i + 1}`} className="w-full h-full object-contain bg-muted" />
              <ImageOverlayActions url={url} onExpand={() => setLightboxUrl(url)} filename={`variation-${i + 1}.png`} />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity text-center">
                {url === activeImage ? "Selected" : "Pick this"}
              </div>
              {url === activeImage && (
                <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded">
                  Working
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Single-result image (finish / space preview) */}
      {singleResultUrl && (
        <div className={`relative group block w-full max-w-md rounded-lg overflow-hidden border-2 transition-all ${
          singleResultUrl === activeImage ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
        }`}>
          <button onClick={() => onPickVariation(singleResultUrl)} className="block w-full">
            <img src={singleResultUrl} alt="" className="w-full aspect-square object-contain bg-muted" />
          </button>
          <ImageOverlayActions url={singleResultUrl} onExpand={() => setLightboxUrl(singleResultUrl)} filename="result.png" />
        </div>
      )}

      {/* 3D model result */}
      {is3DResult && status === "ready" && modelUrl && (
        <div className="w-full max-w-md rounded-lg overflow-hidden border border-border bg-muted">
          <div className="h-72">
            <ModelViewer3D modelUrl={modelUrl} productName="Studio design" />
          </div>
        </div>
      )}

      {/* Action toolbar — shown once a variation in this message is the working canvas */}
      {hasActiveInGrid && (
        <div className="space-y-2 pt-1">
          <div className="flex flex-wrap gap-1.5 items-center">
            <FinishMenu onPick={onApplyFinish} disabled={busy} />
            <ActionChip icon={<Home className="w-3 h-3" />} label="See in your space" onClick={onSeeInSpace} disabled={busy} />
            <ActionChip icon={<Box className="w-3 h-3" />} label="Generate 3D" onClick={onGen3D} disabled={busy} />
            <ActionChip icon={<Eye className="w-3 h-3" />} label="View in AR" onClick={onViewAR} disabled={busy} />
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            <ActionChip
              icon={<Tag className="w-3 h-3" />}
              label="Make manufacturable & price"
              onClick={onMakeManufacturable}
              primary
            />
            <span className="text-[11px] text-muted-foreground self-center pl-1">
              or just tell me the next change in chat
            </span>
          </div>
        </div>
      )}

      <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  );
}

function ImageOverlayActions({ url, onExpand, filename }: { url: string; onExpand: () => void; filename?: string }) {
  async function download(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(url, { mode: "cors" });
      const blob = await res.blob();
      const obj = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = obj;
      a.download = filename || "nyzora-image.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(obj), 1000);
    } catch {
      window.open(url, "_blank");
    }
  }
  return (
    <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-10">
      <span
        role="button"
        tabIndex={0}
        aria-label="Preview larger"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onExpand(); }}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); onExpand(); } }}
        className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-black/70 text-white hover:bg-black/90 cursor-pointer"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </span>
      <span
        role="button"
        tabIndex={0}
        aria-label="Download image"
        onClick={download}
        onKeyDown={(e) => { if (e.key === "Enter") download(e as unknown as React.MouseEvent); }}
        className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-black/70 text-white hover:bg-black/90 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
      </span>
    </div>
  );
}

function ImageLightbox({ url, onClose }: { url: string | null; onClose: () => void }) {
  async function download() {
    if (!url) return;
    try {
      const res = await fetch(url, { mode: "cors" });
      const blob = await res.blob();
      const obj = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = obj;
      a.download = "nyzora-image.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(obj), 1000);
    } catch {
      window.open(url, "_blank");
    }
  }
  return (
    <Dialog open={!!url} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-5xl p-0 bg-background border-border overflow-hidden">
        <DialogHeader className="px-4 py-2.5 border-b border-border flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-sm font-normal text-muted-foreground">Preview</DialogTitle>
          <Button size="sm" variant="outline" onClick={download} className="h-8 gap-1.5 text-xs mr-6">
            <Download className="w-3.5 h-3.5" /> Download
          </Button>
        </DialogHeader>
        {url && (
          <div className="bg-muted/30 flex items-center justify-center max-h-[80vh] overflow-auto">
            <img src={url} alt="Preview" className="max-w-full max-h-[80vh] object-contain" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ActionChip({ icon, label, onClick, primary, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-full border transition-colors ${
        primary
          ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {icon}
      {label}
    </button>
  );
}

function FinishMenu({ onPick, disabled }: { onPick: (name: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <ActionChip icon={<Palette className="w-3 h-3" />} label="Apply finish" onClick={() => setOpen((o) => !o)} disabled={disabled} />
      {open && (
        <div className="absolute z-10 mt-1 left-0 bg-popover border border-border rounded-md shadow-lg p-1 min-w-[140px]">
          {FINISHES.map((f) => (
            <button
              key={f.name}
              onClick={() => { setOpen(false); onPick(f.name); }}
              className="block w-full text-left text-[11px] px-2 py-1.5 rounded hover:bg-accent text-foreground"
            >
              {f.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CreatorRegisterCard({
  messageId,
  suggestedName,
  email,
  onSubmit,
  busy,
}: {
  messageId: string;
  suggestedName: string;
  email: string;
  onSubmit: (id: string, name: string) => void;
  busy: boolean;
}) {
  const [name, setName] = useState(suggestedName);
  return (
    <div className="rounded-lg border border-border bg-card p-3 max-w-md space-y-3">
      <div className="space-y-1.5">
        <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Your name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="h-9 text-sm" />
      </div>
      <div className="space-y-1.5">
        <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Email</label>
        <div className="text-sm text-muted-foreground">{email}</div>
      </div>
      <Button
        onClick={() => onSubmit(messageId, name)}
        disabled={busy || name.trim().length < 2}
        size="sm"
        className="w-full"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create account & continue"}
      </Button>
      <p className="text-[10px] text-muted-foreground">By continuing you accept the Nyzora creator terms. You can edit your profile anytime.</p>
    </div>
  );
}

function formatINR(n: number) {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `₹${n.toLocaleString("en-IN")}`;
  }
}

function ConfirmListingCard({
  messageId,
  metadata,
  onPublish,
  busy,
}: {
  messageId: string;
  metadata: any;
  onPublish: (id: string, edits: any) => void;
  busy: boolean;
}) {
  const [title, setTitle] = useState<string>(metadata?.title ?? "");
  const [dims, setDims] = useState<{ length: number; breadth: number; height: number }>(
    metadata?.dimensions ?? { length: 100, breadth: 50, height: 60 },
  );
  const [price, setPrice] = useState<number>(Number(metadata?.suggestedPrice ?? 0));
  const basePrice = Number(metadata?.basePrice ?? 0);
  const imageUrl = metadata?.imageUrl as string;
  const profileId = metadata?.profileId as string;
  const dbCategory = metadata?.dbCategory as string;
  const markup = Math.max(0, price - basePrice);

  return (
    <div className="rounded-lg border border-border bg-card p-3 max-w-md space-y-3">
      <div className="flex gap-3 items-start">
        {imageUrl && (
          <img src={imageUrl} alt="" className="w-20 h-20 rounded object-contain bg-muted shrink-0" />
        )}
        <div className="flex-1 space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Product name</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-sm" />
          <div className="text-[10px] text-muted-foreground capitalize">Category: {dbCategory?.replace(/-/g, " ")}</div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Dimensions (cm)</label>
        <div className="grid grid-cols-3 gap-2">
          <Input type="number" value={dims.length} onChange={(e) => setDims({ ...dims, length: Number(e.target.value) })} placeholder="W" className="h-8 text-sm" />
          <Input type="number" value={dims.breadth} onChange={(e) => setDims({ ...dims, breadth: Number(e.target.value) })} placeholder="D" className="h-8 text-sm" />
          <Input type="number" value={dims.height} onChange={(e) => setDims({ ...dims, height: Number(e.target.value) })} placeholder="H" className="h-8 text-sm" />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Selling price</label>
          <span className="text-[10px] text-muted-foreground">Your earnings: {formatINR(markup)}</span>
        </div>
        <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="h-9 text-sm" min={basePrice} />
        <div className="flex items-center justify-between rounded-md bg-muted/50 border border-border px-2.5 py-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Manufacturing Base Price</span>
          <span className="text-xs font-semibold text-foreground">{formatINR(basePrice)}</span>
        </div>
        <div className="text-[10px] text-muted-foreground">You keep 100% of the markup (Selling price − MBP). MBP is set by our maker network.</div>
      </div>

      <Button
        onClick={() =>
          onPublish(messageId, {
            title: title.trim(),
            dbCategory,
            dimensions: dims,
            basePrice,
            designerPrice: Math.max(price, basePrice),
            imageUrl,
            profileId,
          })
        }
        disabled={busy || !title.trim() || !profileId || !imageUrl}
        size="sm"
        className="w-full"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Tag className="w-3.5 h-3.5 mr-1.5" /> Publish to marketplace</>}
      </Button>
    </div>
  );
}

function PublishedCard({
  metadata,
  onOpenProduct,
}: {
  metadata: any;
  onOpenProduct: (path: string) => void;
}) {
  const path = metadata?.productPath as string;
  const title = metadata?.productTitle as string;
  const imageUrl = metadata?.imageUrl as string;
  const price = Number(metadata?.designerPrice ?? 0);
  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast({ title: "Link copied" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  }

  return (
    <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 max-w-md space-y-3">
      <div className="flex gap-3 items-center">
        {imageUrl && <img src={imageUrl} alt="" className="w-16 h-16 rounded object-contain bg-background shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary">
            <Check className="w-3 h-3" /> Live on Nyzora
          </div>
          <div className="text-sm font-medium truncate">{title}</div>
          <div className="text-xs text-muted-foreground">{formatINR(price)}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" onClick={() => onOpenProduct(path)} className="gap-1.5 h-8 text-xs">
          <ExternalLink className="w-3 h-3" /> Open product page
        </Button>
        <Button size="sm" variant="outline" onClick={copyLink} className="gap-1.5 h-8 text-xs">
          <LinkIcon className="w-3 h-3" /> Copy link
        </Button>
      </div>
    </div>
  );
}