import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Star, Check, X, BadgeCheck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

type ReviewStatus = "pending" | "approved" | "rejected";

interface AdminReview {
  id: string;
  author_name: string;
  author_location: string | null;
  author_email: string | null;
  rating: number;
  title: string | null;
  body: string;
  photo_url: string | null;
  video_url: string | null;
  verified_purchase: boolean;
  status: ReviewStatus;
  created_at: string;
}

const StatusBadge = ({ status }: { status: ReviewStatus }) => {
  const styles: Record<ReviewStatus, string> = {
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    rejected: "bg-red-500/10 text-red-600 border-red-500/20",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium border rounded ${styles[status]}`}
    >
      {status}
    </span>
  );
};

export const ReviewsManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ReviewStatus | "all">("pending");

  const { data: reviews, isLoading } = useQuery<AdminReview[]>({
    queryKey: ["admin-brand-reviews", filter],
    queryFn: async () => {
      let query = supabase
        .from("brand_reviews")
        .select(
          "id, author_name, author_location, author_email, rating, title, body, photo_url, video_url, verified_purchase, status, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (filter !== "all") query = query.eq("status", filter);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      verified,
    }: {
      id: string;
      status: ReviewStatus;
      verified?: boolean;
    }) => {
      const patch: Record<string, unknown> = { status };
      if (verified !== undefined) patch.verified_purchase = verified;
      const { error } = await supabase
        .from("brand_reviews")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brand-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["brand-reviews"] });
      toast({ title: "Review updated" });
    },
    onError: (err: any) =>
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      }),
  });

  const filters: (ReviewStatus | "all")[] = [
    "pending",
    "approved",
    "rejected",
    "all",
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Customer Reviews</h2>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : !reviews || reviews.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center border border-border rounded-lg">
          No {filter !== "all" ? filter : ""} reviews.
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="border border-border p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.author_name}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {r.author_location || "—"}
                    {r.author_email ? ` · ${r.author_email}` : ""}
                    {" · "}
                    {formatDistanceToNow(new Date(r.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-3.5 w-3.5 ${
                        n <= r.rating
                          ? "text-foreground fill-current"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {r.title && (
                <p className="text-sm font-medium">{r.title}</p>
              )}
              <p className="text-sm text-muted-foreground">{r.body}</p>

              {(r.photo_url || r.video_url) && (
                <div className="flex gap-3 flex-wrap">
                  {r.photo_url && (
                    <img
                      src={r.photo_url}
                      alt="Review"
                      className="h-20 w-20 object-cover border border-border"
                    />
                  )}
                  {r.video_url && (
                    <video
                      src={r.video_url}
                      controls
                      preload="metadata"
                      className="h-20 w-32 object-cover border border-border"
                    />
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {r.status !== "approved" && (
                  <Button
                    size="sm"
                    onClick={() =>
                      updateMutation.mutate({
                        id: r.id,
                        status: "approved",
                        verified: true,
                      })
                    }
                    disabled={updateMutation.isPending}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Approve
                  </Button>
                )}
                {r.status !== "rejected" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateMutation.mutate({ id: r.id, status: "rejected" })
                    }
                    disabled={updateMutation.isPending}
                  >
                    <X className="h-3.5 w-3.5 mr-1" /> Reject
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    updateMutation.mutate({
                      id: r.id,
                      status: r.status,
                      verified: !r.verified_purchase,
                    })
                  }
                  disabled={updateMutation.isPending}
                >
                  <BadgeCheck className="h-3.5 w-3.5 mr-1" />
                  {r.verified_purchase ? "Unverify" : "Mark verified"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {updateMutation.isPending && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg shadow-lg text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Updating…
        </div>
      )}
    </div>
  );
};
