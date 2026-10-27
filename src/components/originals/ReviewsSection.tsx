import { StarRating } from "./StarRating";
import { useOriginalsReviews } from "./useOriginalsReviews";
import { BadgeCheck } from "lucide-react";

interface Props {
  skuSlug: string;
}

export const ReviewsSection = ({ skuSlug }: Props) => {
  const { reviews, count, average, isLoading } = useOriginalsReviews(skuSlug);

  // Nothing to show until real reviews exist — never announce that there are none.
  if (isLoading || count === 0) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-light tracking-tight">What buyers say</h2>
        <div className="flex items-center gap-2">
          <StarRating value={average} size={15} />
          <span className="text-sm tabular-nums">{average.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({count})</span>
        </div>
      </div>

      {(
        <ul className="mt-6 divide-y divide-border border-t border-border">
          {reviews.map((r) => (
            <li key={r.id} className="py-5">
              <div className="flex items-center gap-3">
                <StarRating value={r.rating} />
                {r.title && <p className="text-sm">{r.title}</p>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{r.body}</p>
              {r.photo_url && (
                <img
                  src={r.photo_url}
                  alt={`Piece received by ${r.author_name}`}
                  loading="lazy"
                  className="mt-3 h-28 w-28 object-cover border border-border"
                />
              )}
              <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{r.author_name}</span>
                {r.author_location && <span>· {r.author_location}</span>}
                {r.verified_purchase && (
                  <span className="inline-flex items-center gap-1 text-foreground">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified purchase
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};