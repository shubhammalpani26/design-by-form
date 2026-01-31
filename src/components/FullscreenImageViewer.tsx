import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FullscreenImageViewerProps {
  imageUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
  alt?: string;
}

export const FullscreenImageViewer = ({ imageUrl, isOpen, onClose, alt = "Fullscreen image" }: FullscreenImageViewerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageUrl) return;
    
    setIsDownloading(true);
    try {
      // Handle base64 images
      if (imageUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `design-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Image downloaded!");
      } else {
        // Handle regular URLs - fetch and create blob
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `design-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Image downloaded!");
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download image");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 bg-black/95 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      {/* Top controls */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          disabled={isDownloading}
          className="rounded-full bg-white/10 hover:bg-white/20 text-white"
          aria-label="Download image"
        >
          <Download className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="rounded-full bg-white/10 hover:bg-white/20 text-white"
          aria-label="Close fullscreen view"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <img
          src={imageUrl}
          alt={alt}
          className="max-w-full max-h-full object-contain cursor-zoom-out"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        Click anywhere to close • Use download button to save
      </p>
    </div>
  );
};
