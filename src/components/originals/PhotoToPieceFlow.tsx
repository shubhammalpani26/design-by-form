import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { OriginalSku } from "@/data/originalsSkus";
import { Camera, Loader2, RefreshCw, ShieldCheck, Truck, Factory, ArrowRight, Undo2, Wand2 } from "lucide-react";
import { StarRating } from "./StarRating";
import { useOriginalsReviews } from "./useOriginalsReviews";
import { PhotoPrivacyNotice } from "./PhotoPrivacyNotice";
import { OriginalsCheckout } from "./OriginalsCheckout";
import { EXPERIMENTS, getVariant, trackExperiment } from "@/lib/experiments";
import { useOriginalsCart } from "@/lib/originalsCart";

const MAX_BYTES = 8 * 1024 * 1024;

/** One-tap corrections buyers ask for most, per flow. */
/** Single-material colours — the piece is printed in one filament, never two-tone. */
const COLORS = [
  { key: "bone", label: "Bone White", swatch: "#EDE7DC", prompt: "warm bone white" },
  { key: "charcoal", label: "Charcoal Black", swatch: "#2A2A2A", prompt: "deep charcoal black" },
  { key: "sand", label: "Sand", swatch: "#CDB89A", prompt: "soft sand beige" },
  { key: "slate", label: "Slate Grey", swatch: "#7C848C", prompt: "cool slate grey" },
  { key: "terracotta", label: "Terracotta", swatch: "#B4653F", prompt: "muted terracotta" },
] as const;

const colorClause = (key: string) => {
  const c = COLORS.find((x) => x.key === key) ?? COLORS[0];
  return ` The entire piece is a single uniform ${c.prompt} matte colour — one solid material throughout, sculpture and plinth exactly the same colour, no two-tone, no colour gradient, no contrasting base, no painted or metallic accents; the engraving reads through carved shadow only.`;
};

const TWEAK_CHIPS: Record<"photo" | "template", string[]> = {
  photo: [
    "Turn the head slightly toward the camera.",
    "Make the ears and muzzle more like my photo.",
    "Make the engraved name larger and deeper.",
  ],
  template: [
    "Make the engraving larger and deeper.",
    "Give the form a softer, more sculptural curve.",
    "Shift the angle so the front face reads straight on.",
  ],
};

async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.readAsDataURL(file);
  });
}

async function readFnError(error: unknown, fallback: string) {
  const ctx = (error as { context?: Response })?.context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const body = await ctx.json();
      if (body?.error) return String(body.error);
    } catch { /* ignore */ }
  }
  return fallback;
}

interface Props {
  sku: OriginalSku;
}

export const PhotoToPieceFlow = ({ sku }: Props) => {
  const { toast } = useToast();
  const cart = useOriginalsCart();
  const fileRef = useRef<HTMLInputElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const { reviews, count: reviewCount, average: reviewAverage } = useOriginalsReviews(sku.slug);
  const topReview = reviews[0];

  const progressVariant = useMemo(() => getVariant("render_progress"), []);
  const revealVariant = useMemo(() => getVariant("reveal_screen"), []);
  const waitingLines = EXPERIMENTS.render_progress[progressVariant];
  const reveal = EXPERIMENTS.reveal_screen[revealVariant];

  const [photo, setPhoto] = useState<{ dataUrl: string; name: string } | null>(null);
  const [petName, setPetName] = useState("");
  const [date, setDate] = useState("");
  const [mode, setMode] = useState<"photo" | "template">(sku.photo ? "photo" : "template");
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const [preview, setPreview] = useState<{ url: string; id: string | null; remaining: number } | null>(null);
  const [prevPreview, setPrevPreview] = useState<{ url: string; id: string | null; remaining: number } | null>(null);
  const [showTweak, setShowTweak] = useState(false);
  const [tweak, setTweak] = useState("");
  const [refining, setRefining] = useState(false);
  const [colorKey, setColorKey] = useState<string>(COLORS[0].key);
  const [sizeKey, setSizeKey] = useState(sku.sizes[1]?.key ?? sku.sizes[0].key);
  const [checkingOut, setCheckingOut] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const checkoutRef = useRef<HTMLDivElement | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  const selectedSize = sku.sizes.find((s) => s.key === sizeKey) ?? sku.sizes[0];

  const displayName =
    mode === "photo"
      ? petName.trim()
      : (values.petName || values.childName || values.coordinates || "").trim();

  useEffect(() => {
    trackExperiment("render_progress", progressVariant, "flow_view", { skuSlug: sku.slug });
    trackExperiment("reveal_screen", revealVariant, "flow_view", { skuSlug: sku.slug });
  }, [progressVariant, revealVariant, sku.slug]);

  useEffect(() => {
    if (!loading) return;
    setLineIndex(0);
    const id = setInterval(() => setLineIndex((i) => Math.min(i + 1, waitingLines.length - 1)), 4500);
    return () => clearInterval(id);
  }, [loading, waitingLines.length]);

  // A session is priced for one size/preview — drop it if either changes.
  useEffect(() => {
    setClientSecret(null);
  }, [sizeKey, preview?.id, cart.count, cart.total]);

  const pickFile = useCallback(async (file?: File | null) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      toast({ title: "Use a JPG, PNG or WebP photo", variant: "destructive" });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ title: "That photo is over 8 MB", description: "Try a smaller one.", variant: "destructive" });
      return;
    }
    setPhoto({ dataUrl: await fileToDataUrl(file), name: file.name });
    trackExperiment("render_progress", progressVariant, "photo_selected", { skuSlug: sku.slug });
  }, [toast]);

  const generate = async (tweakText = "", overrideColor?: string) => {
    if (mode === "photo" && (!sku.photo || !photo)) return;
    const activeColor = overrideColor ?? colorKey;
    const isTweak = Boolean(tweakText.trim());
    const isRefine = isTweak || Boolean(overrideColor);
    if (isRefine) {
      setRefining(true);
      setPrevPreview(preview);
    } else {
      setLoading(true);
      setPreview(null);
    }
    const startedAt = Date.now();
    setErrorMsg(null);
    trackExperiment("render_progress", progressVariant, "generate_start", { skuSlug: sku.slug });
    try {
      const personalization = mode === "photo" ? { petName, date } : values;
      const basePrompt =
        mode === "photo" && sku.photo
          ? sku.photo.promptTemplate({ petName, date })
          : sku.promptTemplate(values);
      const withColor = `${basePrompt}${colorClause(activeColor)}`;
      const prompt = isTweak
        ? `${withColor} Revision requested by the customer — keep everything else identical, apply only this change: ${tweakText.trim()}`
        : withColor;
      const { data, error } = await supabase.functions.invoke("originals-preview", {
        body: {
          skuSlug: sku.slug,
          prompt,
          personalization: {
            ...personalization,
            color: activeColor,
            ...(isTweak ? { tweak: tweakText.trim() } : {}),
          },
          ...(mode === "photo" && photo ? { sourceImage: photo.dataUrl } : {}),
        },
      });
      if (error) throw new Error(await readFnError(error, "We couldn't render that one. Try a clearer photo."));
      setPreview({ url: data.previewUrl, id: data.previewId ?? null, remaining: data.remaining ?? 0 });
      if (isTweak) {
        setShowTweak(false);
        setTweak("");
        trackExperiment("reveal_screen", revealVariant, "tweak_success", { skuSlug: sku.slug });
      }
      trackExperiment("render_progress", progressVariant, "generate_success", {
        skuSlug: sku.slug,
        metadata: { seconds: Math.round((Date.now() - startedAt) / 1000) },
      });
      trackExperiment("reveal_screen", revealVariant, "reveal_view", { skuSlug: sku.slug });
      setTimeout(() => revealRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (e) {
      trackExperiment("render_progress", progressVariant, "generate_error", { skuSlug: sku.slug });
      const raw = (e as Error).message || "";
      const isLimit = /limit|429|too many/i.test(raw);
      setLimitReached(isLimit);
      setErrorMsg(
        isLimit
          ? "You've used your free previews for today. They reset in 24 hours — or order now and we'll send your render for approval before anything is printed."
          : raw || "We couldn't render that one. Try a clearer, well-lit photo of their face."
      );
      toast({ title: "Couldn't make that one", description: raw, variant: "destructive" });
      if (isTweak && prevPreview === null) setPrevPreview(null);
    } finally {
      setLoading(false);
      setRefining(false);
    }
  };

  const currentLine = () => ({
    skuSlug: sku.slug,
    sizeKey,
    sizeLabel: selectedSize.label,
    price: selectedSize.price,
    productName: sku.name ?? "Nyzora Original",
    previewId: preview?.id ?? null,
    previewUrl: preview?.url ?? null,
    personName: displayName || undefined,
  });

  const resetForAnother = () => {
    setPreview(null);
    setPrevPreview(null);
    setClientSecret(null);
    setPhoto(null);
    setPetName("");
    setDate("");
    setValues({});
    setShowTweak(false);
    setTweak("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addAnother = () => {
    cart.add(currentLine());
    toast({ title: "Saved to your order", description: "Make another piece — you'll pay for everything at once." });
    trackExperiment("reveal_screen", revealVariant, "add_to_cart", { skuSlug: sku.slug });
    resetForAnother();
  };

  const basketLines = [
    ...cart.items.map((i) => ({ skuSlug: i.skuSlug, sizeKey: i.sizeKey, previewId: i.previewId, quantity: i.quantity })),
    { skuSlug: sku.slug, sizeKey, previewId: preview?.id ?? null, quantity: 1 },
  ];
  const basketCount = cart.count + 1;
  const basketTotal = cart.total + selectedSize.price;

  const checkout = async () => {
    setCheckingOut(true);
    trackExperiment("reveal_screen", revealVariant, "checkout_click", {
      skuSlug: sku.slug,
      metadata: { sizeKey, price: selectedSize.price, pieces: basketCount },
    });
    try {
      const { data, error } = await supabase.functions.invoke("originals-checkout", {
        body: {
          items: basketLines,
          returnUrl: `${window.location.origin}/originals/checkout/return`,
          environment: getStripeEnvironment(),
        },
      });
      if (error) throw new Error(await readFnError(error, "Checkout is temporarily unavailable."));
      if (!data?.clientSecret) throw new Error("Checkout is temporarily unavailable.");
      trackExperiment("reveal_screen", revealVariant, "checkout_opened", { skuSlug: sku.slug });
      setClientSecret(data.clientSecret);
      setCheckingOut(false);
      requestAnimationFrame(() =>
        checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    } catch (e) {
      toast({ title: "Checkout didn't open", description: (e as Error).message, variant: "destructive" });
      setCheckingOut(false);
    }
  };

  return (
    <div className="border border-foreground/15 bg-muted/10">
      {/* ---- Step 1: the photo ---- */}
      {!preview && (
        <div className="p-5 md:p-6">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">
            {mode === "photo" ? "Make it from your photo" : "Make it from a template"}
          </p>
          <h2 className="mt-2 text-xl md:text-2xl font-light tracking-tight">
            {mode === "photo" ? "Upload one photo. See them sculpted." : "Fill in the details. See it sculpted."}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Free, in about a minute. No account, no card — you only pay if you love it.
          </p>

          {reviewCount > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <StarRating value={reviewAverage} size={15} />
              <span className="tabular-nums">{reviewAverage.toFixed(1)}</span>
              <span className="text-muted-foreground">
                from {reviewCount} {reviewCount === 1 ? "buyer" : "buyers"}
              </span>
            </div>
          )}

          {mode === "photo" && sku.photo && (
          <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); void pickFile(e.dataTransfer.files?.[0]); }}
            className="mt-5 w-full border border-dashed border-foreground/25 bg-background hover:border-foreground/50 transition-colors"
          >
            {photo ? (
              <div className="flex items-center gap-4 p-4 text-left">
                <img src={photo.dataUrl} alt="Your uploaded photo" className="h-20 w-20 object-cover" />
                <div className="min-w-0">
                  <p className="text-sm truncate">{photo.name}</p>
                  <p className="text-xs text-muted-foreground">Tap to choose a different photo</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 px-4 py-10">
                <Camera className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{sku.photo.label}</span>
                <span className="text-xs text-muted-foreground text-center max-w-[18rem]">{sku.photo.hint}</span>
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => void pickFile(e.target.files?.[0])}
          />

          <PhotoPrivacyNotice className="mt-3" />
          </>
          )}

          {mode === "photo" ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="petName" className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
                Their name
              </Label>
              <Input id="petName" className="mt-2 rounded-none" placeholder="Milo" value={petName}
                onChange={(e) => setPetName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="engDate" className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
                Date (optional)
              </Label>
              <Input id="engDate" className="mt-2 rounded-none" placeholder="03.14.2019" value={date}
                onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          ) : (
          <div className="mt-4 space-y-3">
            {sku.fields.map((f) => (
              <div key={f.key}>
                <Label htmlFor={f.key} className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
                  {f.label}
                </Label>
                {f.options ? (
                  <select
                    id={f.key}
                    className="mt-2 h-10 w-full rounded-none border border-input bg-background px-3 text-sm"
                    value={values[f.key] || ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  >
                    <option value="">{f.placeholder}</option>
                    {f.options.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={f.key}
                    className="mt-2 rounded-none"
                    placeholder={f.placeholder}
                    value={values[f.key] || ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          )}

          <div className="mt-4">
            <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">Colour</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {COLORS.map((c) => {
                const active = c.key === colorKey;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setColorKey(c.key)}
                    aria-pressed={active}
                    className={`flex items-center gap-2 border px-2.5 py-1.5 text-xs transition-colors ${active ? "border-foreground" : "border-border hover:border-foreground/40"}`}
                  >
                    <span
                      className="h-4 w-4 border border-foreground/20"
                      style={{ backgroundColor: c.swatch }}
                      aria-hidden
                    />
                    {c.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Made in one solid colour — pick the one that suits your space.
            </p>
          </div>

          <Button
            size="lg"
            className="mt-5 w-full rounded-none h-12"
            disabled={loading || (mode === "photo" && !photo)}
            onClick={() => void generate()}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {waitingLines[lineIndex]}</>
            ) : (
              <>See {displayName || "it"} sculpted — free <ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
          {errorMsg && (
            <div className="mt-3 border border-foreground/20 bg-muted/40 p-3 text-xs leading-relaxed text-foreground">
              {errorMsg}
              {limitReached && (
                <a
                  href="#collection"
                  className="mt-2 block underline underline-offset-4 text-muted-foreground hover:text-foreground"
                >
                  See the finished pieces in the meantime
                </a>
              )}
            </div>
          )}
          {sku.photo && (
            <button
              type="button"
              onClick={() => setMode(mode === "photo" ? "template" : "photo")}
              className="mt-3 w-full text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              {mode === "photo" ? "No photo handy? Use a template instead" : "Use my own photo instead"}
            </button>
          )}
          {loading && (
            <div className="mt-4 aspect-square w-full animate-pulse bg-muted/40" aria-hidden />
          )}
        </div>
      )}

      {/* ---- Step 2: the reveal ---- */}
      {preview && (
        <div ref={revealRef} className="p-5 md:p-6">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">{reveal.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-light tracking-tight">
            {reveal.headline(displayName || "your piece")}
          </h2>

          <div className="mt-4 grid grid-cols-[80px_1fr] gap-3 items-start">
            {mode === "photo" && photo && (
              <img src={photo.dataUrl} alt="Your photo" className="w-20 h-20 object-cover border border-border" />
            )}
            <div className={`border border-border bg-muted/20 ${mode === "photo" && photo ? "" : "col-span-2"}`}>
              <div className="relative">
                <img
                  src={preview.url}
                  alt="Your personalized piece"
                  className={`w-full object-contain transition ${refining ? "opacity-40 blur-[2px]" : ""}`}
                />
                {refining && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Adjusting your piece…
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ---- Not quite right? inline tweaks ---- */}
          <div className="mt-5">
            <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">Colour</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {COLORS.map((c) => {
                const active = c.key === colorKey;
                return (
                  <button
                    key={c.key}
                    type="button"
                    disabled={refining}
                    onClick={() => {
                      if (c.key === colorKey) return;
                      setColorKey(c.key);
                      trackExperiment("reveal_screen", revealVariant, "color_change", { skuSlug: sku.slug });
                      void generate("", c.key);
                    }}
                    aria-pressed={active}
                    className={`flex items-center gap-2 border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50 ${active ? "border-foreground" : "border-border hover:border-foreground/40"}`}
                  >
                    <span className="h-4 w-4 border border-foreground/20" style={{ backgroundColor: c.swatch }} aria-hidden />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            {!showTweak ? (
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={refining}
                  onClick={() => {
                    setShowTweak(true);
                    trackExperiment("reveal_screen", revealVariant, "tweak_open", { skuSlug: sku.slug });
                  }}
                  className="text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground underline underline-offset-4"
                >
                  Not quite right?
                </button>
                {prevPreview && !refining && (
                  <button
                    type="button"
                    onClick={() => { setPreview(prevPreview); setPrevPreview(null); }}
                    className="inline-flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground"
                  >
                    <Undo2 className="h-3 w-3" /> Back to previous
                  </button>
                )}
              </div>
            ) : (
              <div className="border border-border p-4">
                <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
                  Tell us what to change
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TWEAK_CHIPS[mode === "photo" ? "photo" : "template"].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setTweak((t) => (t.trim() ? `${t.trim()} ${chip}` : chip))}
                      className="border border-border px-3 py-1.5 text-xs hover:border-foreground/50"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <Textarea
                  className="mt-3 rounded-none"
                  rows={2}
                  maxLength={300}
                  placeholder="e.g. turn the head slightly to the left and make the name larger"
                  value={tweak}
                  onChange={(e) => setTweak(e.target.value)}
                />
                <div className="mt-3 flex gap-2">
                  <Button
                    className="flex-1 rounded-none"
                    disabled={!tweak.trim() || refining}
                    onClick={() => void generate(tweak)}
                  >
                    {refining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    {refining ? "Adjusting…" : "Re-render with this change"}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-none"
                    disabled={refining}
                    onClick={() => { setShowTweak(false); setTweak(""); }}
                  >
                    Cancel
                  </Button>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Keeps your photo and details — only the change you describe is applied.
                </p>
              </div>
            )}
          </div>

          <div className="mt-5">
            <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">{reveal.sizePrompt}</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {sku.sizes.map((s) => {
                const active = s.key === sizeKey;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSizeKey(s.key)}
                    className={`border p-3 text-left transition-colors ${active ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/40"}`}
                  >
                    <span className="block text-sm">{s.label}</span>
                    <span className="block text-xs text-muted-foreground">{s.size}</span>
                    <span className="mt-1 block text-sm tabular-nums">${s.price}</span>
                    {s.note && <span className="mt-1 block text-[10px] tracking-[0.1em] uppercase text-muted-foreground">{s.note}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div ref={checkoutRef}>
            {clientSecret ? (
              <div className="mt-5 border-t border-border pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
                    Secure checkout · {basketCount === 1 ? selectedSize.label : `${basketCount} pieces`} · ${basketTotal}
                  </p>
                  <button
                    type="button"
                    onClick={() => setClientSecret(null)}
                    className="text-[11px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground"
                  >
                    Change
                  </button>
                </div>
                <div className="mt-4">
                  <OriginalsCheckout key={clientSecret} clientSecret={clientSecret} />
                </div>
              </div>
            ) : (
              <>
                {cart.items.length > 0 && (
                  <div className="mt-5 border border-border">
                    <p className="border-b border-border px-3 py-2 text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
                      Also in this order
                    </p>
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 border-b border-border/60 px-3 py-2 last:border-b-0">
                        {item.previewUrl && (
                          <img src={item.previewUrl} alt="" className="h-12 w-12 border border-border object-contain" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">
                            {item.productName}
                            {item.personName ? ` · ${item.personName}` : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.sizeLabel}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            className="h-7 w-7 border border-border text-sm hover:border-foreground/50"
                            onClick={() => cart.setQuantity(item.id, item.quantity - 1)}
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm tabular-nums">{item.quantity}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            className="h-7 w-7 border border-border text-sm hover:border-foreground/50"
                            onClick={() => cart.setQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <span className="w-14 text-right text-sm tabular-nums">${item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  type="button"
                  size="lg"
                  className="mt-5 w-full rounded-none h-12"
                  disabled={checkingOut}
                  onClick={(e) => {
                    e.preventDefault();
                    void checkout();
                  }}
                >
                  {checkingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {basketCount > 1
                    ? `Check out ${basketCount} pieces — $${basketTotal}`
                    : reveal.cta(selectedSize.price)}
                </Button>
                <button
                  type="button"
                  onClick={addAnother}
                  className="mt-3 w-full text-xs tracking-[0.15em] uppercase text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Save this and make another piece
                </button>
                <p className="mt-2 text-xs text-center text-muted-foreground">
                  {basketCount > 1
                    ? "One payment, one shipment · Free US shipping · Ships in 3–5 days"
                    : "Free US shipping · Made to order in the USA · Ships in 3–5 days"}
                </p>
              </>
            )}
          </div>

          {topReview ? (
            <div className="mt-5 border border-border p-4">
              <div className="flex items-center gap-2">
                <StarRating value={reviewAverage} />
                <span className="text-xs tabular-nums">{reviewAverage.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">· {reviewCount} reviews</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">"{topReview.body}"</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {topReview.author_name}
                {topReview.author_location ? ` · ${topReview.author_location}` : ""}
                {topReview.verified_purchase ? " · Verified purchase" : ""}
              </p>
            </div>
          ) : (
            <p className="mt-5 border border-border p-4 text-xs text-muted-foreground leading-relaxed">
              If it doesn't look like them when it arrives, we remake it or refund you — no return shipping to pay.
            </p>
          )}

          <button
            type="button"
            onClick={() => { setPreview(null); }}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" />
            Try another{preview.remaining > 0 ? ` · ${preview.remaining} free left today` : ""}
          </button>

          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5 text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
            <div className="flex flex-col gap-1.5"><Factory className="h-4 w-4" /> Made in USA</div>
            <div className="flex flex-col gap-1.5"><Truck className="h-4 w-4" /> 3–5 day ship</div>
            <div className="flex flex-col gap-1.5"><ShieldCheck className="h-4 w-4" /> 30-day remake or refund</div>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Made from a dense matte polymer, precision 3D-printed as one solid part in the USA — a
            stone-look finish, not natural stone. Designed by our AI, checked by our engineers, made by a
            real workshop and shipped to your door.
          </p>
        </div>
      )}
    </div>
  );
};
