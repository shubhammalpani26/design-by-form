import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FeedPost } from "@/components/FeedPost";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const CommunityFeedPreview = () => {
  const { data: recentPosts, isLoading } = useQuery({
    queryKey: ["feed-posts-preview"],
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
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section className="container py-16">
        <div className="text-center mb-12">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="max-w-3xl mx-auto space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </section>
    );
  }

  if (!recentPosts || recentPosts.length === 0) {
    return null;
  }

  return (
    <section className="container py-16">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Creator Community</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
          Latest from Our Creators
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover launches, milestones, and achievements from our design community
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6 mb-8">
        {recentPosts.map((post) => (
          <FeedPost key={post.id} post={post} />
        ))}
      </div>

      <div className="text-center">
        <Link to="/community">
          <Button variant="hero" size="lg" className="group">
            View Full Community Feed
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </section>
  );
};
