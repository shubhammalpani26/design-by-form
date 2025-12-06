import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, ImagePlus, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export const CreatePostDialog = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("behind_scenes");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (designerId: string): Promise<string | null> => {
    if (!imageFile) return null;

    setIsUploadingImage(true);
    try {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${designerId}/post-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("creator-profiles")
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("creator-profiles")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Image upload error:", error);
      throw error;
    } finally {
      setIsUploadingImage(false);
    }
  };

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

      // Upload image if present
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage(profile.id);
      }

      // Create post
      const { error } = await supabase.from("feed_posts").insert({
        designer_id: profile.id,
        title,
        content,
        post_type: postType,
        visibility: "public",
        image_url: imageUrl,
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
      setImageFile(null);
      setImagePreview(null);
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
              rows={4}
              required
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Image (optional)</Label>
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm">Click to add an image</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploadingImage}>
              {isSubmitting || isUploadingImage ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isUploadingImage ? "Uploading..." : "Posting..."}
                </>
              ) : (
                "Share Post"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
