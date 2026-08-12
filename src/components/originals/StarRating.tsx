import { Star } from "lucide-react";

interface Props {
  value: number;
  size?: number;
  className?: string;
}

/** Read-only star display. Supports halves via a clipped overlay. */
export const StarRating = ({ value, size = 14, className = "" }: Props) => {
  const rounded = Math.max(0, Math.min(5, value));
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${rounded.toFixed(1)} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, rounded - i));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }} aria-hidden>
            <Star className="absolute inset-0 text-muted-foreground/40" style={{ width: size, height: size }} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: size * fill }}>
              <Star className="text-foreground fill-current" style={{ width: size, height: size }} />
            </span>
          </span>
        );
      })}
    </span>
  );
};