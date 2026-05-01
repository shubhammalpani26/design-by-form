import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Link2, CheckCircle, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { buildReferralUrl } from "@/lib/referrals";

interface ShareCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  productImageUrl: string;
  productPath: string; // e.g. /product/<slug>
  creatorName: string;
  creatorSlug?: string | null; // referrer slug (the creator who made the design)
  isOwnDesign?: boolean; // if viewer is the creator, frame copy differently
}

const WA_ICON = (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
);

const X_ICON = (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);

/**
 * Renders the design as a 4:5 editorial poster on a hidden DOM node, then uses
 * html-to-image-style canvas painting (built-in Canvas + crossOrigin <img>) to
 * produce a downloadable PNG. We avoid extra deps by hand-painting on canvas.
 */
export const ShareCardDialog = ({
  open,
  onOpenChange,
  productName,
  productImageUrl,
  productPath,
  creatorName,
  creatorSlug,
  isOwnDesign = false,
}: ShareCardDialogProps) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imgReady, setImgReady] = useState(false);
  const [posterDataUrl, setPosterDataUrl] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralUrl = buildReferralUrl(productPath, creatorSlug);
  const shareCaption = isOwnDesign
    ? `Just made this on Nyzora — "${productName}". You can custom-make yours too ✨`
    : `Check out "${productName}" by ${creatorName} on Nyzora ✨`;

  // Generate poster whenever dialog opens
  useEffect(() => {
    if (!open) {
      setImgReady(false);
      setPosterDataUrl("");
      return;
    }
    void renderPoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, productImageUrl, productName, creatorName]);

  const renderPoster = async () => {
    setGenerating(true);
    try {
      const W = 1080;
      const H = 1350; // 4:5 IG/WhatsApp friendly
      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unsupported");

      // Background — soft warm off-white
      ctx.fillStyle = "#F5F2EC";
      ctx.fillRect(0, 0, W, H);

      // Subtle grain via dots (very light)
      ctx.fillStyle = "rgba(0,0,0,0.025)";
      for (let i = 0; i < 1500; i++) {
        ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
      }

      // Top label "NYZORA · CUSTOM MADE"
      ctx.fillStyle = "#0F0F0F";
      ctx.font = "600 22px 'Inter', system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("NYZORA  ·  CUSTOM MADE", 70, 90);

      // Top right: ✨
      ctx.textAlign = "right";
      ctx.font = "28px serif";
      ctx.fillText("✦", W - 70, 90);

      // Load product image
      const img = await loadImage(productImageUrl);

      // Image frame
      const frameX = 70;
      const frameY = 140;
      const frameW = W - 140; // 940
      const frameH = 940;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(frameX, frameY, frameW, frameH);

      // Contain image inside frame
      const pad = 40;
      const innerW = frameW - pad * 2;
      const innerH = frameH - pad * 2;
      const ratio = Math.min(innerW / img.width, innerH / img.height);
      const drawW = img.width * ratio;
      const drawH = img.height * ratio;
      const drawX = frameX + (frameW - drawW) / 2;
      const drawY = frameY + (frameH - drawH) / 2;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // Hairline border on frame
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.lineWidth = 1;
      ctx.strokeRect(frameX + 0.5, frameY + 0.5, frameW - 1, frameH - 1);

      // Product name (large editorial)
      ctx.fillStyle = "#0F0F0F";
      ctx.textAlign = "left";
      ctx.font = "700 56px 'Inter', system-ui, sans-serif";
      const nameLines = wrapText(ctx, productName, W - 140, 56);
      let nameY = frameY + frameH + 90;
      nameLines.slice(0, 2).forEach((line, i) => {
        ctx.fillText(line, 70, nameY + i * 64);
      });

      // Creator attribution
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.font = "400 26px 'Inter', system-ui, sans-serif";
      const attribY = nameY + Math.min(nameLines.length, 2) * 64 + 14;
      ctx.fillText(`Designed by ${creatorName}`, 70, attribY);

      // Bottom-right CTA pill: nyzora.ai
      ctx.textAlign = "right";
      ctx.fillStyle = "#0F0F0F";
      ctx.font = "600 24px 'Inter', system-ui, sans-serif";
      ctx.fillText("nyzora.ai", W - 70, H - 60);

      const dataUrl = canvas.toDataURL("image/png", 0.95);
      setPosterDataUrl(dataUrl);
      setImgReady(true);
    } catch (err) {
      console.error("[share-card] render failed", err);
      toast({
        title: "Couldn't generate share card",
        description: "We'll still share the link — try downloading later.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!posterDataUrl) return;
    const a = document.createElement("a");
    a.href = posterDataUrl;
    a.download = `${slugifyForFile(productName)}-nyzora.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "Image downloaded", description: "Now share it to Instagram or WhatsApp ✨" });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast({ title: "Link copied!", description: "Paste it anywhere to share." });
    setTimeout(() => setCopied(false), 2000);
  };

  const openShare = (platform: "whatsapp" | "x" | "facebook") => {
    const text = encodeURIComponent(`${shareCaption} ${referralUrl}`);
    const u = encodeURIComponent(referralUrl);
    const links = {
      whatsapp: `https://wa.me/?text=${text}`,
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareCaption)}&url=${u}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    };
    window.open(links[platform], "_blank", "width=600,height=600");
  };

  const handleNativeShare = async () => {
    if (typeof navigator === "undefined" || !navigator.share) return;
    try {
      // Try sharing the image file if possible
      if (posterDataUrl && navigator.canShare) {
        const blob = await (await fetch(posterDataUrl)).blob();
        const file = new File([blob], `${slugifyForFile(productName)}-nyzora.png`, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: productName, text: shareCaption, url: referralUrl });
          return;
        }
      }
      await navigator.share({ title: productName, text: shareCaption, url: referralUrl });
    } catch (err) {
      // user cancelled
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            {isOwnDesign ? "Share your design" : "Share this design"}
          </DialogTitle>
          <DialogDescription>
            {isOwnDesign
              ? "A free Nyzora-branded poster — every signup through your link earns you 30 free credits when they get a design approved."
              : "Send this beautiful card to friends — every share helps the creator."}
          </DialogDescription>
        </DialogHeader>

        {/* Poster preview */}
        <div className="relative w-full bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center min-h-[320px]">
          {generating && !posterDataUrl && (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Generating poster…</p>
            </div>
          )}
          {posterDataUrl && (
            <img
              src={posterDataUrl}
              alt={`${productName} share card`}
              className="w-full max-w-sm mx-auto"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleDownload} disabled={!imgReady} className="rounded-full">
              <Download className="h-4 w-4 mr-2" />
              Download image
            </Button>
            <Button onClick={handleCopy} variant="outline" className="rounded-full">
              {copied ? <CheckCircle className="h-4 w-4 mr-2 text-green-600" /> : <Link2 className="h-4 w-4 mr-2" />}
              {copied ? "Copied!" : "Copy link"}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button onClick={() => openShare("whatsapp")} variant="outline" className="rounded-full">
              {WA_ICON}
              <span className="ml-2 hidden sm:inline">WhatsApp</span>
            </Button>
            <Button onClick={() => openShare("x")} variant="outline" className="rounded-full">
              {X_ICON}
              <span className="ml-2 hidden sm:inline">X</span>
            </Button>
            <Button onClick={() => openShare("facebook")} variant="outline" className="rounded-full">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              <span className="ml-2 hidden sm:inline">Facebook</span>
            </Button>
          </div>

          {typeof navigator !== "undefined" && navigator.share && (
            <Button onClick={handleNativeShare} variant="ghost" className="w-full">
              More share options…
            </Button>
          )}

          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Link: <span className="font-mono break-all">{referralUrl}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helpers
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, _fontSize: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function slugifyForFile(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "design";
}