import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FeedPost } from "@/components/FeedPost";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, TrendingUp, Award, Users, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { CommunitySidebar } from "@/components/community/CommunitySidebar";
import { CreatePostDialog } from "@/components/community/CreatePostDialog";
import { WeeklyThemes } from "@/components/community/WeeklyThemes";
import { Link } from "react-router-dom";

const Community = () => {
  const [filter, setFilter] = useState<string>("all");

  const { data: feedPosts, isLoading } = useQuery({
    queryKey: ["feed-posts", filter],
    queryFn: async () => {
      let query = supabase
        .from("feed_posts")
        .select(`
          *,
          designer_profiles (
            id,
            name,
            profile_picture_url,
            design_background
          )
        `)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(50);

      if (filter !== "all") {
        query = query.eq("post_type", filter);
      }

      const { data: posts, error } = await query;
      if (error) throw error;

      // Fetch additional metrics for each designer
      const postsWithMetrics = await Promise.all(
        posts.map(async (post) => {
          const designerId = post.designer_profiles.id;

          // Get follower count
          const { count: followerCount } = await supabase
            .from("designer_follows")
            .select("*", { count: "exact", head: true })
            .eq("designer_id", designerId);

          // Get product count and total sales
          const { data: products } = await supabase
            .from("designer_products")
            .select("total_sales")
            .eq("designer_id", designerId)
            .eq("status", "approved");

          const productCount = products?.length || 0;
          const totalSales = products?.reduce((sum, p) => sum + (p.total_sales || 0), 0) || 0;

          return {
            ...post,
            designer_profiles: {
              ...post.designer_profiles,
              follower_count: followerCount || 0,
              product_count: productCount,
              total_sales: totalSales,
            },
          };
        })
      );

      return postsWithMetrics;
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent py-12 border-b">
          <div className="container">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full mb-3">
                  <Flame className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">What's Happening</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
                  Creator Community
                </h1>
                <p className="text-muted-foreground">
                  Connect with furniture designers and follow their creative journey
                </p>
              </div>
              <CreatePostDialog />
            </div>
          </div>
        </section>

        {/* Feed Section with Sidebar */}
        <section className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            {/* Main Feed */}
            <div>
              <Tabs defaultValue="all" className="space-y-6" onValueChange={setFilter}>
                <TabsList className="grid w-full grid-cols-4 sticky top-20 z-10 bg-background">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline">All</span>
                  </TabsTrigger>
                  <TabsTrigger value="product_launch" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline">Launches</span>
                  </TabsTrigger>
                  <TabsTrigger value="milestone" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="hidden sm:inline">Milestones</span>
                  </TabsTrigger>
                  <TabsTrigger value="achievement" className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    <span className="hidden sm:inline">Achievements</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={filter} className="space-y-6">
                  {isLoading ? (
                    <div className="space-y-6">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="border rounded-lg p-6 space-y-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                          <Skeleton className="h-20 w-full" />
                          <Skeleton className="h-64 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : feedPosts && feedPosts.length > 0 ? (
                    <div className="space-y-6">
                      {feedPosts.map((post) => (
                        <FeedPost key={post.id} post={post} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 border rounded-lg">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
              <WeeklyThemes />
              <CommunitySidebar />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Community;
