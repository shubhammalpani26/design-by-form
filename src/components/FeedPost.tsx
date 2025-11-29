import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Sparkles, TrendingUp, Award, UserPlus, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface FeedPostProps {
  post: {
    id: string;
    title: string;
    content: string;
    post_type: string;
    image_url?: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    metadata: any;
    designer_profiles: {
      id: string;
      name: string;
      profile_picture_url?: string;
    };
  };
}

const postTypeIcons = {
  product_launch: Sparkles,
  milestone: TrendingUp,
  achievement: Award,
  behind_scenes: MessageCircle,
};

const postTypeColors = {
  product_launch: "text-primary",
  milestone: "text-secondary",
  achievement: "text-accent",
  behind_scenes: "text-muted-foreground",
};

export const FeedPost = ({ post }: FeedPostProps) => {
  const Icon = postTypeIcons[post.post_type as keyof typeof postTypeIcons] || Sparkles;
  const iconColor = postTypeColors[post.post_type as keyof typeof postTypeColors] || "text-primary";
  const { toast } = useToast();
  
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user?.id || null);

      if (user) {
        // Check if user has liked this post
        const { data: like } = await supabase
          .from("feed_post_likes")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .maybeSingle();
        
        setIsLiked(!!like);

        // Check if user is following this designer
        const { data: follow } = await supabase
          .from("designer_follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("designer_id", post.designer_profiles.id)
          .maybeSingle();
        
        setIsFollowing(!!follow);
      }
    };

    checkAuth();
  }, [post.id, post.designer_profiles.id]);

  const handleLike = async () => {
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from("feed_post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUser);
        
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase
          .from("feed_post_likes")
          .insert({ post_id: post.id, user_id: currentUser });
        
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow creators",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isFollowing) {
        await supabase
          .from("designer_follows")
          .delete()
          .eq("follower_id", currentUser)
          .eq("designer_id", post.designer_profiles.id);
        
        setIsFollowing(false);
        toast({
          title: "Unfollowed",
          description: `You unfollowed ${post.designer_profiles.name}`,
        });
      } else {
        await supabase
          .from("designer_follows")
          .insert({ follower_id: currentUser, designer_id: post.designer_profiles.id });
        
        setIsFollowing(true);
        toast({
          title: "Following",
          description: `You're now following ${post.designer_profiles.name}`,
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/creator/${post.designer_profiles.id}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.designer_profiles.profile_picture_url} />
                <AvatarFallback>{post.designer_profiles.name[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link
                to={`/creator/${post.designer_profiles.id}`}
                className="font-semibold hover:underline"
              >
                {post.designer_profiles.name}
              </Link>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${iconColor}`} />
            <Button
              size="sm"
              variant={isFollowing ? "secondary" : "default"}
              onClick={handleFollow}
              className="gap-2"
            >
              {isFollowing ? (
                <>
                  <UserCheck className="h-4 w-4" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Follow
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <h3 className="font-bold text-lg mb-1">{post.title}</h3>
          <p className="text-muted-foreground">{post.content}</p>
        </div>

        {post.image_url && (
          <Link
            to={
              post.metadata?.product_id
                ? `/product/${post.metadata.product_id}`
                : `/creator/${post.designer_profiles.id}`
            }
          >
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full rounded-lg object-cover max-h-96 hover:opacity-90 transition-opacity"
            />
          </Link>
        )}

        {post.metadata?.product_id && (
          <Link
            to={`/product/${post.metadata.product_id}`}
            className="inline-block px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-full text-sm font-medium transition-colors"
          >
            View Product →
          </Link>
        )}

        <div className="flex items-center gap-6 pt-2 text-sm text-muted-foreground">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 transition-colors ${
              isLiked ? 'text-primary' : 'hover:text-primary'
            }`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>{likesCount}</span>
          </button>
          <button className="flex items-center gap-2 hover:text-primary transition-colors">
            <MessageCircle className="h-4 w-4" />
            <span>{post.comments_count}</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
