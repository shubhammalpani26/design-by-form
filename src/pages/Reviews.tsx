import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, BadgeCheck, Video, ImagePlus, X, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";
import { formatDistanceToNow } from "date-fns";

interface BrandReview {
  id: string;
  author_name: string;
  author_location: string | null;
  rating: number;
  title: string | null;
  body: string;
  photo_url: string | null;
  video_url: string | null;
  verified_purchase: boolean;
  created_at: string;
}

const StarPicker = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className="p-0.5"
        aria-label={`${n} star${n > 1 ? "s" : ""}`}
      >
        <Star
          className={`h-7 w-7 transition-colors ${
            n <= value ? "text-foreground fill-current" : "text-muted-foreground/30"
          }`}
        />
      </button>
    ))}
  </div>
);

const ReviewStars = ({ value, size = 14 }: { value: number; size?: number }) => (
  <span className="inline-flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        className={
          n <= Math.round(value)
            ? "text-foreground fill-current"
            : "text-muted-foreground/30"
        }
        style={{ width: size, height: size }}
      />
    ))}
  </span>
);

const Reviews = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["brand-reviews"],
    queryFn: async (): Promise<BrandReview[]> => {
      const { data, error } = await supabase
        .from("brand_reviews")
        .select(
          "id, author_name, author_location, rating, title, body, photo_url, video_url, verified_purchase, created_at"
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as BrandReview[];
    },
  });

  const count = reviews?.length ?? 0;
  const average = count
    ? reviews!.reduce((s, r) => s + r.rating, 0) / count
    : 0;

  const uploadMedia = async (file: File, kind: "photo" | "video") => {
    const ext = file.name.split(".").pop() || kind;
    const path = `reviews/${kind}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let photo_url: string | null = null;
      let video_url: string | null = null;
      if (photoFile) photo_url = await uploadMedia(photoFile, "photo");
      if (videoFile) video_url = await uploadMedia(videoFile, "video");

      const { error } = await supabase.from("brand_reviews").insert({
        author_name: name.trim(),
        author_location: location.trim() || null,
        rating,
        title: title.trim() || null,
        body: body.trim(),
        photo_url,
        video_url,
        verified_purchase: false,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Thanks! Your review will appear once approved.",
      });
      setShowForm(false);
      setRating(5);
      setName("");
      setLocation("");
      setTitle("");
      setBody("");
      setPhotoFile(null);
      setVideoFile(null);
      queryClient.invalidateQueries({ queryKey: ["brand-reviews"] });
    },
    onError: (err: any) => {
      toast({
        title: "Could not submit",
        description: err.message || "Please sign in to leave a review.",
        variant: "destructive",
      });
    },
    onSettled: () => setUploading(false),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Customer Reviews | Nyzora"
        description="Real reviews from Nyzora customers — see what people say about their keepsakes, unboxing videos, and more."
      />
      <Header />

      <main className="flex-1">
        <section className="container py-10 sm:py-16">
          {/* Header */}
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight mb-3">
              Customer Reviews
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Real stories from people who turned a photo into a keepsake. No
              paid placements, no filters — just honest reviews, unboxing photos
              and videos.
            </p>

            {count > 0 && (
              <div className="mt-5 flex items-center gap-3">
                <ReviewStars value={average} size={18} />
                <span className="text-sm tabular-nums font-medium">
                  {average.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                  · {count} review{count !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            <Button
              className="mt-6"
              onClick={() => setShowForm((s) => !s)}
            >
              {showForm ? "Cancel" : "Write a review"}
            </Button>
          </div>

          {/* Submission form */}
          {showForm && (
            <div className="mt-8 max-w-2xl border border-border p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your rating
                </label>
                <StarPicker value={rating} onChange={setRating} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Name *
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Location
                  </label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, State (optional)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Sum up your experience (optional)"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Your review *
                </label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Tell us about your experience, the quality, the unboxing…"
                  rows={5}
                  maxLength={2000}
                />
              </div>

              {/* Media uploads */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Photo
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-foreground/40 transition-colors">
                    <ImagePlus className="h-4 w-4" />
                    {photoFile ? photoFile.name : "Add a photo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setPhotoFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                  {photoFile && (
                    <button
                      onClick={() => setPhotoFile(null)}
                      className="mt-1 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      <X className="h-3 w-3" /> Remove
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Video
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-foreground/40 transition-colors">
                    <Video className="h-4 w-4" />
                    {videoFile ? videoFile.name : "Add a video (max 30s)"}
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) =>
                        setVideoFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                  {videoFile && (
                    <button
                      onClick={() => setVideoFile(null)}
                      className="mt-1 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      <X className="h-3 w-3" /> Remove
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                You'll need to be signed in to submit. Reviews are reviewed by
                our team before they appear publicly.
              </p>

              <Button
                onClick={() => submitMutation.mutate()}
                disabled={
                  uploading || !name.trim() || !body.trim()
                }
                className="w-full sm:w-auto"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  "Submit review"
                )}
              </Button>
            </div>
          )}

          {/* Reviews list */}
          <div className="mt-10 max-w-3xl">
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="border border-border p-5 space-y-3 animate-pulse"
                  >
                    <div className="h-4 w-32 bg-muted-foreground/10 rounded" />
                    <div className="h-20 w-full bg-muted-foreground/10 rounded" />
                  </div>
                ))}
              </div>
            ) : count === 0 ? (
              <div className="border border-border p-8 text-center">
                <p className="text-muted-foreground">
                  No reviews yet — be the first to share your experience.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border border-t border-border">
                {reviews!.map((r) => (
                  <li key={r.id} className="py-6">
                    <div className="flex items-center gap-3 mb-2">
                      <ReviewStars value={r.rating} />
                      {r.title && (
                        <p className="text-sm font-medium">{r.title}</p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {r.body}
                    </p>

                    {r.photo_url && (
                      <img
                        src={r.photo_url}
                        alt={`Review photo from ${r.author_name}`}
                        loading="lazy"
                        className="mt-3 h-32 w-32 object-cover border border-border"
                      />
                    )}

                    {r.video_url && (
                      <video
                        src={r.video_url}
                        controls
                        preload="metadata"
                        className="mt-3 w-full max-w-sm border border-border"
                      />
                    )}

                    <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {r.author_name}
                      </span>
                      {r.author_location && (
                        <span>· {r.author_location}</span>
                      )}
                      {r.verified_purchase && (
                        <span className="inline-flex items-center gap-1 text-foreground">
                          <BadgeCheck className="h-3.5 w-3.5" /> Verified purchase
                        </span>
                      )}
                      <span>
                        ·{" "}
                        {formatDistanceToNow(new Date(r.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Reviews;
