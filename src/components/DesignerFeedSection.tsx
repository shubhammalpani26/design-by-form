import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FeedPost } from "@/components/FeedPost";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

interface DesignerFeedSectionProps {
  designerId: string;
}

export const DesignerFeedSection = ({ designerId }: DesignerFeedSectionProps) => {
  const { data: designerPosts, isLoading } = useQuery({
    queryKey: ["designer-feed", designerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feed_posts")
        .select(`
          *,
          designer_profiles (
            id,
            name,
            profile_picture_url
          )
        `)
        .eq("designer_id", designerId)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Activity & Achievements</h2>
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!designerPosts || designerPosts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">Activity & Achievements</h2>
      </div>
      <div className="space-y-6">
        {designerPosts.map((post) => (
          <FeedPost key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};
