import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";

export const StoriesBar = () => {
  const { data: creators, isLoading } = useQuery({
    queryKey: ["stories-creators"],
    queryFn: async () => {
      // Get creators who posted recently (within last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentPosts } = await supabase
        .from("feed_posts")
        .select(`
          designer_id,
          created_at,
          designer_profiles (
            id,
            name,
            profile_picture_url
          )
        `)
        .eq("visibility", "public")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(20);

      // Deduplicate by designer_id and get unique creators
      const uniqueCreators = new Map();
      recentPosts?.forEach((post) => {
        if (post.designer_profiles && !uniqueCreators.has(post.designer_id)) {
          uniqueCreators.set(post.designer_id, {
            ...post.designer_profiles,
            hasNewPost: true,
          });
        }
      });

      return Array.from(uniqueCreators.values()).slice(0, 15);
    },
  });

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="w-12 h-3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {/* Your Story / Create */}
      <Link
        to="/creator/dashboard"
        className="flex flex-col items-center gap-2 flex-shrink-0 group"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30 group-hover:border-primary transition-colors">
            <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
        <span className="text-xs text-muted-foreground text-center w-16 truncate">
          Your Story
        </span>
      </Link>

      {/* Creator Stories */}
      {creators?.map((creator) => (
        <Link
          key={creator.id}
          to={`/designer/${creator.id}`}
          className="flex flex-col items-center gap-2 flex-shrink-0 group"
        >
          <div className="relative">
            <div
              className={`p-[3px] rounded-full bg-gradient-to-tr ${
                creator.hasNewPost
                  ? "from-primary via-secondary to-accent"
                  : "from-muted-foreground/20 to-muted-foreground/20"
              }`}
            >
              <Avatar className="w-14 h-14 border-2 border-background">
                <AvatarImage src={creator.profile_picture_url} />
                <AvatarFallback className="text-lg">
                  {creator.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <span className="text-xs text-center w-16 truncate group-hover:text-primary transition-colors">
            {creator.name?.split(" ")[0]}
          </span>
        </Link>
      ))}
    </div>
  );
};
