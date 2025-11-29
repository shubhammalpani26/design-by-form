import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Sparkles, Award } from "lucide-react";
import { Link } from "react-router-dom";

export const CommunitySidebar = () => {
  // Fetch new creators (recently joined)
  const { data: newCreators } = useQuery({
    queryKey: ["new-creators"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("designer_profiles")
        .select("id, name, profile_picture_url, design_background, created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!profiles) return [];

      // Get product count for each
      const creatorsWithData = await Promise.all(
        profiles.map(async (profile) => {
          const { data: products } = await supabase
            .from("designer_products")
            .select("id")
            .eq("designer_id", profile.id)
            .eq("status", "approved");

          return {
            ...profile,
            product_count: products?.length || 0,
          };
        })
      );

      return creatorsWithData;
    },
  });

  // Fetch trending creators (most followers)
  const { data: trendingCreators } = useQuery({
    queryKey: ["trending-creators"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("designer_profiles")
        .select("id, name, profile_picture_url, design_background")
        .eq("status", "approved")
        .limit(20);

      if (!profiles) return [];

      // Get follower counts for each creator
      const creatorsWithFollowers = await Promise.all(
        profiles.map(async (profile) => {
          const { count: followerCount } = await supabase
            .from("designer_follows")
            .select("*", { count: "exact", head: true })
            .eq("designer_id", profile.id);

          const { data: products } = await supabase
            .from("designer_products")
            .select("total_sales")
            .eq("designer_id", profile.id)
            .eq("status", "approved");

          return {
            ...profile,
            follower_count: followerCount || 0,
            total_sales: products?.reduce((sum, p) => sum + (p.total_sales || 0), 0) || 0,
          };
        })
      );

      return creatorsWithFollowers
        .sort((a, b) => b.follower_count - a.follower_count)
        .slice(0, 5);
    },
  });

  // Fetch recent activity highlights
  const { data: recentHighlights } = useQuery({
    queryKey: ["recent-highlights"],
    queryFn: async () => {
      const { data } = await supabase
        .from("feed_posts")
        .select(`
          id,
          title,
          post_type,
          created_at,
          designer_profiles (name, profile_picture_url)
        `)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(5);

      return data;
    },
  });

  return (
    <div className="space-y-6">
      {/* New Creator Spotlight */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            New Creator Spotlight
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {newCreators?.map((creator) => (
            <Link
              key={creator.id}
              to={`/creator/${creator.id}`}
              className="flex items-center gap-3 hover:bg-accent/50 p-2 rounded-lg transition-colors"
            >
              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                <AvatarImage src={creator.profile_picture_url || undefined} />
                <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{creator.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">New</Badge>
                  {creator.product_count > 0 && (
                    <span>{creator.product_count} designs</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
          <p className="text-xs text-muted-foreground/70 pt-2 border-t">
            Early creators get priority homepage exposure and algorithm boost 🚀
          </p>
        </CardContent>
      </Card>

      {/* Trending Creators */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trending Creators
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {trendingCreators?.map((creator, index) => (
            <Link
              key={creator.id}
              to={`/creator/${creator.id}`}
              className="flex items-center gap-3 hover:bg-accent/50 p-2 rounded-lg transition-colors"
            >
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={creator.profile_picture_url || undefined} />
                  <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {index < 3 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {index + 1}
                  </Badge>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{creator.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {creator.follower_count}
                  </span>
                  {creator.total_sales > 0 && (
                    <span>• {creator.total_sales} sales</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentHighlights?.map((highlight) => (
            <div
              key={highlight.id}
              className="flex items-start gap-2 text-sm p-2 hover:bg-accent/50 rounded-lg transition-colors"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={highlight.designer_profiles?.profile_picture_url || undefined} />
                <AvatarFallback>
                  {highlight.designer_profiles?.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  <span className="font-semibold text-foreground">
                    {highlight.designer_profiles?.name}
                  </span>{" "}
                  {highlight.title.toLowerCase()}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Community Stats */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Award className="h-12 w-12 mx-auto text-primary" />
            <div>
              <h3 className="font-bold text-xl mb-1">Join the Movement</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start earning from your furniture designs
              </p>
              <Button asChild size="sm" className="w-full">
                <Link to="/designer-signup">Become a Creator</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
