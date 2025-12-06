import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Bookmark, Share2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Post {
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
  };
}

interface PostModalProps {
  post: Post | null;
  open: boolean;
  onClose: () => void;
}

export const PostModal = ({ post, open, onClose }: PostModalProps) => {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    if (post) {
      setLikesCount(post.likes_count);
      checkAuthAndStatus();
    }
  }, [post]);

  const checkAuthAndStatus = async () => {
    if (!post) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user?.id || null);

    if (user) {
      // Check like status
      const { data: like } = await supabase
        .from("feed_post_likes")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", user.id)
        .maybeSingle();
      setIsLiked(!!like);

      // Check save status
      const { data: save } = await supabase
        .from("feed_post_saves")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", user.id)
        .maybeSingle();
      setIsSaved(!!save);
    }
  };

  const handleLike = async () => {
    if (!currentUser || !post) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }

    try {
      if (isLiked) {
        await supabase.from("feed_post_likes").delete()
          .eq("post_id", post.id).eq("user_id", currentUser);
        setIsLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        await supabase.from("feed_post_likes").insert({ post_id: post.id, user_id: currentUser });
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update like", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!currentUser || !post) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }

    try {
      if (isSaved) {
        await supabase.from("feed_post_saves").delete()
          .eq("post_id", post.id).eq("user_id", currentUser);
        setIsSaved(false);
        toast({ title: "Removed from saved" });
      } else {
        await supabase.from("feed_post_saves").insert({ post_id: post.id, user_id: currentUser });
        setIsSaved(true);
        toast({ title: "Saved to collection" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    if (!post) return;
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

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-background">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-50 rounded-full bg-background/80 p-2 hover:bg-background"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr]">
          {/* Image Section */}
          <div className="relative bg-black flex items-center justify-center min-h-[300px] md:min-h-[500px]">
            {post.image_url ? (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-full object-contain max-h-[70vh]"
              />
            ) : (
              <div className="text-muted-foreground">No image</div>
            )}
          </div>

          {/* Details Section */}
          <div className="flex flex-col max-h-[70vh]">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b">
              <Link to={`/creator/${post.designer_profiles.id}`}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.designer_profiles.profile_picture_url} />
                  <AvatarFallback>{post.designer_profiles.name[0]}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="font-bold text-lg mb-2">{post.title}</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{post.content}</p>
              
              {post.metadata?.product_id && (
                <Link
                  to={`/product/${post.metadata.product_id}`}
                  className="inline-block mt-4 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-full text-sm font-medium transition-colors"
                >
                  View Product →
                </Link>
              )}
            </div>

            {/* Actions */}
            <div className="border-t p-4">
              <div className="flex items-center justify-between mb-3">
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
              <p className="font-semibold text-sm">{likesCount} likes</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
