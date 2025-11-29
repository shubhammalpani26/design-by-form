import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FeedPost } from "@/components/FeedPost";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, TrendingUp, Award, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent py-16">
          <div className="container text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Creator Community</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Design Stories & Milestones
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Follow the journey of our creators as they launch products, hit milestones,
              and build their design careers on Forma
            </p>
          </div>
        </section>

        {/* Feed Section */}
        <section className="container py-12">
          <Tabs defaultValue="all" className="space-y-8" onValueChange={setFilter}>
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                All
              </TabsTrigger>
              <TabsTrigger value="product_launch" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Launches
              </TabsTrigger>
              <TabsTrigger value="milestone" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Milestones
              </TabsTrigger>
              <TabsTrigger value="achievement" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Achievements
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="space-y-6">
              {isLoading ? (
                <div className="max-w-3xl mx-auto space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border rounded-lg p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-48 w-full" />
                    </div>
                  ))}
                </div>
              ) : feedPosts && feedPosts.length > 0 ? (
                <div className="max-w-3xl mx-auto space-y-6">
                  {feedPosts.map((post) => (
                    <FeedPost key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">No posts yet. Be the first to create!</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-16">
          <div className="container text-center">
            <h2 className="text-3xl font-bold mb-4">Join Our Creator Community</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start your design journey and share your milestones with a supportive community
            </p>
            <Button asChild size="lg" variant="hero">
              <a href="/designer-signup">Become a Creator</a>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Community;
