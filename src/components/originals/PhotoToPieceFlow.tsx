import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { OriginalSku } from "@/data/originalsSkus";
import { Camera, Loader2, RefreshCw, ShieldCheck, Truck, Factory, ArrowRight } from "lucide-react";
import { StarRating } from "./StarRating";
import { useOriginalsReviews } from "./useOriginalsReviews";
import { EXPERIMENTS, getVariant, trackExperiment } from "@/lib/experiments";

const MAX_BYTES = 8 * 1024 * 1024;

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
  const [loading, setLoading] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const [preview, setPreview] = useState<{ url: string; id: string | null; remaining: number } | null>(null);
  const [sizeKey, setSizeKey] = useState(sku.sizes[1]?.key ?? sku.sizes[0].key);
  const [checkingOut, setCheckingOut] = useState(false);

  const selectedSize = sku.sizes.find((s) => s.key === sizeKey) ?? sku.sizes[0];

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

  const generate = async () => {
    if (!sku.photo || !photo) return;
    setLoading(true);
    setPreview(null);
    const startedAt = Date.now();
    trackExperiment("render_progress", progressVariant, "generate_start", { skuSlug: sku.slug });
    try {
      const values = { petName, date };
      const { data, error } = await supabase.functions.invoke("originals-preview", {
        body: {
          skuSlug: sku.slug,
          prompt: sku.photo.promptTemplate(values),
          personalization: values,
          sourceImage: photo.dataUrl,
        },
      });
      if (error) throw new Error(await readFnError(error, "We couldn't render that one. Try a clearer photo."));
      setPreview({ url: data.previewUrl, id: data.previewId ?? null, remaining: data.remaining ?? 0 });
      trackExperiment("render_progress", progressVariant, "generate_success", {
        skuSlug: sku.slug,
        metadata: { seconds: Math.round((Date.now() - startedAt) / 1000) },
      });
      trackExperiment("reveal_screen", revealVariant, "reveal_view", { skuSlug: sku.slug });
      setTimeout(() => revealRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (e) {
      trackExperiment("render_progress", progressVariant, "generate_error", { skuSlug: sku.slug });
      toast({ title: "Couldn't make that one", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const checkout = async () => {
    setCheckingOut(true);
    trackExperiment("reveal_screen", revealVariant, "checkout_click", {
      skuSlug: sku.slug,
      metadata: { sizeKey, price: selectedSize.price },
    });
    try {
      const { data, error } = await supabase.functions.invoke("originals-checkout", {
        body: {
          skuSlug: sku.slug,
          sizeKey,
          previewId: preview?.id ?? null,
          returnUrl: `${window.location.origin}/originals/${sku.slug}`,
          environment: getStripeEnvironment(),
        },
      });
      if (error) throw new Error(await readFnError(error, "Checkout is temporarily unavailable."));
      if (!data?.url) throw new Error("Checkout is temporarily unavailable.");
      trackExperiment("reveal_screen", revealVariant, "checkout_opened", { skuSlug: sku.slug });
      window.location.href = data.url;
    } catch (e) {
      toast({ title: "Checkout didn't open", description: (e as Error).message, variant: "destructive" });
      setCheckingOut(false);
    }
  };

  if (!sku.photo) return null;

  return (
    <div className="border border-foreground/15 bg-muted/10">
      {/* ---- Step 1: the photo ---- */}
      {!preview && (
        <div className="p-5 md:p-6">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">Make it from your photo</p>
          <h2 className="mt-2 text-xl md:text-2xl font-light tracking-tight">
            Upload one photo. See them carved in stone.
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

          <Button
            size="lg"
            className="mt-5 w-full rounded-none h-12"
            disabled={!photo || loading}
            onClick={generate}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {waitingLines[lineIndex]}</>
            ) : (
              <>See {petName.trim() || "them"} in stone — free <ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
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
            {reveal.headline(petName.trim() || "your piece")}
          </h2>

          <div className="mt-4 grid grid-cols-[80px_1fr] gap-3 items-start">
            {photo && (
              <img src={photo.dataUrl} alt="Your photo" className="w-20 h-20 object-cover border border-border" />
            )}
            <div className="border border-border bg-muted/20">
              <img src={preview.url} alt="Your personalized piece" className="w-full object-contain" />
            </div>
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

          <Button size="lg" className="mt-5 w-full rounded-none h-12" disabled={checkingOut} onClick={checkout}>
            {checkingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {reveal.cta(selectedSize.price)}
          </Button>
          <p className="mt-2 text-xs text-center text-muted-foreground">
            Free US shipping · Made to order in the USA · Ships in 3–5 days
          </p>

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
            Try another photo{preview.remaining > 0 ? ` · ${preview.remaining} free left today` : ""}
          </button>

          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5 text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
            <div className="flex flex-col gap-1.5"><Factory className="h-4 w-4" /> Made in USA</div>
            <div className="flex flex-col gap-1.5"><Truck className="h-4 w-4" /> 3–5 day ship</div>
            <div className="flex flex-col gap-1.5"><ShieldCheck className="h-4 w-4" /> 2-year warranty</div>
          </div>
        </div>
      )}
    </div>
  );
};
