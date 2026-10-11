import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Download, Link2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PreviewShareButtonProps {
  previewUrl: string;
  pieceName: string;
  skuSlug: string;
  onShared?: () => void;
}

/**
 * Lets a shopper send their render to the person they're gifting it to.
 * On phones it shares the actual render image via the native share sheet;
 * everywhere else it offers WhatsApp, a copyable link and a download.
 * The shared link always points at the product page — the render URL itself
 * is a private, expiring link that wouldn't work for a recipient.
 */
export const PreviewShareButton = ({ previewUrl, pieceName, skuSlug, onShared }: PreviewShareButtonProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const pageUrl = `${window.location.origin}/originals/${skuSlug}`;
  const shareText = pieceName
    ? `A keepsake sculpture of ${pieceName}, sculpted from a photo — I'm thinking of it as a gift.`
    : `A keepsake sculpture sculpted from a photo — I'm thinking of it as a gift.`;

  const fetchImage = async (): Promise<File> => {
    const res = await fetch(previewUrl);
    if (!res.ok) throw new Error("Could not load the preview");
    const blob = await res.blob();
    const ext = blob.type.includes("png") ? "png" : "jpg";
    return new File([blob], `nyzora-keepsake.${ext}`, { type: blob.type || "image/jpeg" });
  };

  const handleNativeShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (typeof navigator !== "undefined" && navigator.canShare) {
        try {
          const file = await fetchImage();
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: pieceName || "Nyzora keepsake", text: shareText });
            onShared?.();
            return;
          }
        } catch (err) {
          // User closed the sheet — don't fall through to a second prompt.
          if ((err as DOMException)?.name === "AbortError") return;
        }
      }
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: pieceName || "Nyzora keepsake", text: shareText, url: pageUrl });
        onShared?.();
        return;
      }
      toast({ title: "Share from your phone", description: "Pick WhatsApp or copy the link below." });
    } catch {
      toast({ title: "Couldn't share", description: "Please try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${pageUrl}`)}`, "_blank", "width=600,height=500");
    onShared?.();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      toast({ title: "Link copied", description: "Paste it in a chat with the person you'd gift this to." });
      onShared?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy", description: "Please try again.", variant: "destructive" });
    }
  };

  const handleDownload = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const file = await fetchImage();
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Preview saved", description: "You can send it from your gallery or files." });
      onShared?.();
    } catch {
      toast({ title: "Couldn't save the preview", description: "Please try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-none" disabled={busy}>
          <Share2 className="mr-2 h-3.5 w-3.5" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {canNativeShare && (
          <DropdownMenuItem onClick={() => void handleNativeShare()}>
            <Share2 className="mr-2 h-4 w-4" />
            Share the preview…
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleWhatsApp}>
          <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handleCopyLink()}>
          {copied ? <CheckCircle className="mr-2 h-4 w-4" /> : <Link2 className="mr-2 h-4 w-4" />}
          {copied ? "Copied!" : "Copy link"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handleDownload()}>
          <Download className="mr-2 h-4 w-4" />
          Save the preview
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
