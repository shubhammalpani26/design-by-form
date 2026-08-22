import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Camera } from "lucide-react";

interface BuyerMedia {
  id: string;
  author_name: string;
  author_location: string | null;
  photo_url: string | null;
  video_url: string | null;
}

/**
 * Real photos/videos sent in by buyers (approved brand reviews). Renders
 * nothing until actual customer media exists, so the page never shows
 * an empty "social proof" shell before launch.
 */
export const BuyerPhotoStrip = ({ className }: { className?: string }) => {
  const { data } = useQuery({
    queryKey: ["buyer-media"],
    queryFn: async (): Promise<BuyerMedia[]> => {
      const { data, error } = await supabase
        .from("brand_reviews")
        .select("id, author_name, author_location, photo_url, video_url")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []).filter((r) => r.photo_url || r.video_url);
    },
    staleTime: 5 * 60 * 1000,
  });

  const media = data ?? [];
  if (media.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-light tracking-tight">Real pieces, in real homes</h2>
        <Link to="/reviews" className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground">
          All reviews
        </Link>
      </div>
      <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Camera className="h-3.5 w-3.5" /> Photos sent in by people who received one.
      </p>

      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-px p-px bg-border">
        {media.map((m) => (
          <div key={m.id} className="bg-background">
            {m.photo_url ? (
              <img
                src={m.photo_url}
                alt={`Nyzora piece received by ${m.author_name}`}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
            ) : (
              <video src={m.video_url!} muted loop playsInline controls className="aspect-square w-full object-cover" />
            )}
            <p className="px-3 py-2 text-[11px] text-muted-foreground">
              {m.author_name}
              {m.author_location ? ` · ${m.author_location}` : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
