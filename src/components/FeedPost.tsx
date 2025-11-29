import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Sparkles, TrendingUp, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

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
          <Icon className={`h-5 w-5 ${iconColor}`} />
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
          <button className="flex items-center gap-2 hover:text-primary transition-colors">
            <Heart className="h-4 w-4" />
            <span>{post.likes_count}</span>
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
