import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface AngleView {
  angle: string;
  url: string;
}

interface AngleRotatorProps {
  images: AngleView[];
}

export const AngleRotator = ({ images }: AngleRotatorProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || images.length <= 1) return;
    
    const deltaX = e.clientX - startX.current;
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      } else {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      }
      startX.current = e.clientX;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  if (images.length === 0) {
    return (
      <div className="w-full h-[500px] bg-accent rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">No angle views available</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className="w-full h-[500px] bg-accent rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={images[currentIndex].url}
          alt={images[currentIndex].angle}
          className="w-full h-full object-contain select-none"
          draggable={false}
        />
      </div>

      {images.length > 1 && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
            onClick={prevImage}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
            onClick={nextImage}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-full">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-primary w-8' : 'bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              {images[currentIndex].angle} ({currentIndex + 1} of {images.length})
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Drag left/right to rotate • Click arrows to navigate
            </p>
          </div>
        </>
      )}
    </div>
  );
};
