import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export const CreatePostDialog = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("behind_scenes");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to create posts",
          variant: "destructive",
        });
        return;
      }

      // Get designer profile
      const { data: profile } = await supabase
        .from("designer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        toast({
          title: "Designer profile required",
          description: "Only designers can create posts",
          variant: "destructive",
        });
        return;
      }

      // Create post
      const { error } = await supabase.from("feed_posts").insert({
        designer_id: profile.id,
        title,
        content,
        post_type: postType,
        visibility: "public",
      });

      if (error) throw error;

      toast({
        title: "Post created!",
        description: "Your post has been shared with the community",
      });

      // Reset form and close dialog
      setTitle("");
      setContent("");
      setPostType("behind_scenes");
      setOpen(false);

      // Refresh feed
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 w-full sm:w-auto">
          <PlusCircle className="h-4 w-4" />
          Share Update
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Share with the Community</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="post-type">Post Type</Label>
            <Select value={postType} onValueChange={setPostType}>
              <SelectTrigger id="post-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="behind_scenes">Behind the Scenes</SelectItem>
                <SelectItem value="achievement">Achievement</SelectItem>
                <SelectItem value="milestone">Milestone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Give your post a catchy title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Share your story, insights, or update..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Posting..." : "Share Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
