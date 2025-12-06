import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Bookmark, UserPlus, UserCheck, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface InstagramFeedPostProps {
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
      design_background?: string;
      follower_count?: number;
      product_count?: number;
      total_sales?: number;
    };
  };
}

export const InstagramFeedPost = ({ post }: InstagramFeedPostProps) => {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    checkAuth();
  }, [post.id, post.designer_profiles.id]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user?.id || null);

    if (user) {
      const [likeRes, saveRes, followRes] = await Promise.all([
        supabase.from("feed_post_likes").select("id").eq("post_id", post.id).eq("user_id", user.id).maybeSingle(),
        supabase.from("feed_post_saves").select("id").eq("post_id", post.id).eq("user_id", user.id).maybeSingle(),
        supabase.from("designer_follows").select("id").eq("follower_id", user.id).eq("designer_id", post.designer_profiles.id).maybeSingle(),
      ]);
      setIsLiked(!!likeRes.data);
      setIsSaved(!!saveRes.data);
      setIsFollowing(!!followRes.data);
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!isLiked) {
        handleLike();
      }
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
    }
    lastTapRef.current = now;
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }

    try {
      if (isLiked) {
        await supabase.from("feed_post_likes").delete().eq("post_id", post.id).eq("user_id", currentUser);
        setIsLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        await supabase.from("feed_post_likes").insert({ post_id: post.id, user_id: currentUser });
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }

    try {
      if (isSaved) {
        await supabase.from("feed_post_saves").delete().eq("post_id", post.id).eq("user_id", currentUser);
        setIsSaved(false);
        toast({ title: "Removed from saved" });
      } else {
        await supabase.from("feed_post_saves").insert({ post_id: post.id, user_id: currentUser });
        setIsSaved(true);
        toast({ title: "Saved to collection" });
      }
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }

    try {
      if (isFollowing) {
        await supabase.from("designer_follows").delete().eq("follower_id", currentUser).eq("designer_id", post.designer_profiles.id);
        setIsFollowing(false);
        toast({ title: `Unfollowed ${post.designer_profiles.name}` });
      } else {
        await supabase.from("designer_follows").insert({ follower_id: currentUser, designer_id: post.designer_profiles.id });
        setIsFollowing(true);
        toast({ title: `Following ${post.designer_profiles.name}` });
      }
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: post.title,
        text: post.content,
        url: window.location.origin + "/community",
      });
    } catch {
      await navigator.clipboard.writeText(window.location.origin + "/community");
      toast({ title: "Link copied!" });
    }
  };

  return (
    <Card className="overflow-hidden border-0 sm:border rounded-none sm:rounded-lg shadow-none sm:shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <Link to={`/creator/${post.designer_profiles.id}`} className="flex items-center gap-3">
          <div className="p-[2px] rounded-full bg-gradient-to-tr from-primary via-secondary to-accent">
            <Avatar className="h-8 w-8 border-2 border-background">
              <AvatarImage src={post.designer_profiles.profile_picture_url} />
              <AvatarFallback>{post.designer_profiles.name[0]}</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <span className="font-semibold text-sm hover:underline">{post.designer_profiles.name}</span>
            {post.designer_profiles.follower_count !== undefined && (
              <p className="text-xs text-muted-foreground">
                {post.designer_profiles.follower_count} followers
              </p>
            )}
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {!isFollowing && (
            <Button size="sm" variant="ghost" onClick={handleFollow} className="text-primary font-semibold text-sm">
              Follow
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Image with double-tap */}
      {post.image_url && (
        <div
          ref={imageRef}
          className="relative cursor-pointer select-none"
          onClick={handleDoubleTap}
        >
          <Link
            to={post.metadata?.product_id ? `/product/${post.metadata.product_id}` : `/creator/${post.designer_profiles.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full aspect-square object-cover"
            />
          </Link>
          {/* Heart animation */}
          {showHeartAnimation && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart className="h-24 w-24 text-white fill-white animate-ping" style={{ animationDuration: "0.5s" }} />
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="hover:opacity-70 transition-opacity">
              <Heart className={`h-6 w-6 ${isLiked ? "fill-primary text-primary" : ""}`} />
            </button>
            <button className="hover:opacity-70 transition-opacity">
              <MessageCircle className="h-6 w-6" />
            </button>
            <button onClick={handleShare} className="hover:opacity-70 transition-opacity">
              <Share2 className="h-6 w-6" />
            </button>
          </div>
          <button onClick={handleSave} className="hover:opacity-70 transition-opacity">
            <Bookmark className={`h-6 w-6 ${isSaved ? "fill-foreground" : ""}`} />
          </button>
        </div>

        {/* Likes */}
        <p className="font-semibold text-sm mb-1">{likesCount.toLocaleString()} likes</p>

        {/* Caption */}
        <div className="text-sm">
          <Link to={`/creator/${post.designer_profiles.id}`} className="font-semibold mr-2 hover:underline">
            {post.designer_profiles.name}
          </Link>
          <span className="font-medium">{post.title}</span>
          {post.content && (
            <span className="text-muted-foreground ml-1">{post.content.slice(0, 100)}{post.content.length > 100 && "..."}</span>
          )}
        </div>

        {/* View Product Link */}
        {post.metadata?.product_id && (
          <Link
            to={`/product/${post.metadata.product_id}`}
            className="inline-block mt-2 text-primary text-sm font-medium hover:underline"
          >
            View Product
          </Link>
        )}

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground mt-2">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
        </p>
      </div>
    </Card>
  );
};
