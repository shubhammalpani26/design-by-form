import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface FullscreenImageViewerProps {
  imageUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
  alt?: string;
}

export const FullscreenImageViewer = ({ imageUrl, isOpen, onClose, alt = "Fullscreen image" }: FullscreenImageViewerProps) => {
  const [isVisible, setIsVisible] = useState(false);

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

  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 bg-black/95 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Close fullscreen view"
      >
        <X className="w-6 h-6 text-white" />
      </button>
      
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <img
          src={imageUrl}
          alt={alt}
          className="max-w-full max-h-full object-contain cursor-zoom-out"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        Click anywhere to close
      </p>
    </div>
  );
};
