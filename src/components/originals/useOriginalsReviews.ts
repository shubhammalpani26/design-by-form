import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OriginalReview {
  id: string;
  author_name: string;
  author_location: string | null;
  rating: number;
  title: string | null;
  body: string;
  photo_url: string | null;
  verified_purchase: boolean;
  created_at: string;
}

/** Approved reviews for one Originals SKU, newest first. */
export const useOriginalsReviews = (skuSlug: string) => {
  const query = useQuery({
    queryKey: ["originals-reviews", skuSlug],
    queryFn: async (): Promise<OriginalReview[]> => {
      const { data, error } = await supabase
        .from("originals_reviews")
        .select("id, author_name, author_location, rating, title, body, photo_url, verified_purchase, created_at")
        .eq("sku_slug", skuSlug)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const reviews = query.data ?? [];
  const count = reviews.length;
  const average = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

  return { ...query, reviews, count, average };
};