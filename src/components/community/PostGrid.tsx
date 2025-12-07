import { useState } from "react";
import { PostModal } from "./PostModal";

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
    follower_count?: number;
    product_count?: number;
    total_sales?: number;
  };
}

interface PostGridProps {
  posts: Post[];
}

export const PostGrid = ({ posts }: PostGridProps) => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Filter posts that have images
  const postsWithImages = posts.filter((post) => post.image_url);

  return (
    <>
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        {postsWithImages.map((post) => (
          <button
            key={post.id}
            onClick={() => setSelectedPost(post)}
            className="relative aspect-square group overflow-hidden rounded-sm sm:rounded-lg"
          >
            <img
              src={post.image_url}
              alt={post.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold">{post.likes_count}</span>
                <span className="text-xs">❤️</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold">{post.comments_count}</span>
                <span className="text-xs">💬</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Show message if no image posts */}
      {postsWithImages.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          No image posts yet
        </div>
      )}

      {/* Post Modal */}
      <PostModal
        post={selectedPost}
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
      />
    </>
  );
};
