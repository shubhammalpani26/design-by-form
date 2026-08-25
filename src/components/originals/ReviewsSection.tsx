import { StarRating } from "./StarRating";
import { useOriginalsReviews } from "./useOriginalsReviews";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCheck, ShieldCheck } from "lucide-react";

interface Props {
  skuSlug: string;
}

export const ReviewsSection = ({ skuSlug }: Props) => {
  const { reviews, count, average, isLoading } = useOriginalsReviews(skuSlug);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-light tracking-tight">What buyers say</h2>
        {count > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={average} size={15} />
            <span className="text-sm tabular-nums">{average.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({count})</span>
          </div>
        )}
      </div>

      {count === 0 ? (
        <div className="mt-5 border border-border p-5">
          <p className="text-sm text-muted-foreground">
            This piece is newly released, so there are no customer reviews yet — we only publish reviews from
            people who actually received one.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>You approve the sculpture before we make anything — nothing is charged until you do.</span>
            </div>
            <div className="flex items-start gap-2">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>If the piece that arrives doesn't look like them, we remake it and reship it free.</span>
            </div>
          </div>
        </div>
      ) : (
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