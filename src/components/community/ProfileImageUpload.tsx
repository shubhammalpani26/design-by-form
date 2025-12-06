import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfileImageUploadProps {
  currentImageUrl?: string | null;
  currentCoverUrl?: string | null;
  name: string;
  onProfileUpdate: (url: string) => void;
  onCoverUpdate?: (url: string) => void;
  showCover?: boolean;
}

export const ProfileImageUpload = ({
  currentImageUrl,
  currentCoverUrl,
  name,
  onProfileUpdate,
  onCoverUpdate,
  showCover = false,
}: ProfileImageUploadProps) => {
  const { toast } = useToast();
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File, type: "profile" | "cover") => {
    const isProfile = type === "profile";
    const setLoading = isProfile ? setIsUploadingProfile : setIsUploadingCover;
    const onUpdate = isProfile ? onProfileUpdate : onCoverUpdate;

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get designer profile
      const { data: profile } = await supabase
        .from("designer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Designer profile not found");

      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.id}/${type}-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("creator-profiles")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("creator-profiles")
        .getPublicUrl(fileName);

      // Update designer profile
      const updateField = isProfile ? "profile_picture_url" : "cover_image_url";
      const { error: updateError } = await supabase
        .from("designer_profiles")
        .update({ [updateField]: publicUrl })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      onUpdate?.(publicUrl);
      toast({ title: `${isProfile ? "Profile" : "Cover"} photo updated!` });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file, "profile");
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file, "cover");
  };

  return (
    <div className="space-y-4">
      {/* Cover Photo */}
      {showCover && (
        <div className="relative group">
          <div
            className="h-32 sm:h-48 w-full rounded-xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 overflow-hidden"
            style={
              currentCoverUrl
                ? { backgroundImage: `url(${currentCoverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                : {}
            }
          >
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <Button
                variant="secondary"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity gap-2"
                onClick={() => coverInputRef.current?.click()}
                disabled={isUploadingCover}
              >
                {isUploadingCover ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                {isUploadingCover ? "Uploading..." : "Change Cover"}
              </Button>
            </div>
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverChange}
          />
        </div>
      )}

      {/* Profile Photo */}
      <div className={`flex items-center gap-4 ${showCover ? "-mt-12 ml-4 relative z-10" : ""}`}>
        <div className="relative group">
          <Avatar className={`${showCover ? "h-20 w-20 border-4 border-background" : "h-16 w-16"}`}>
            <AvatarImage src={currentImageUrl || undefined} />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-secondary text-white">
              {name?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => profileInputRef.current?.click()}
            disabled={isUploadingProfile}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isUploadingProfile ? (
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            ) : (
              <Camera className="h-5 w-5 text-white" />
            )}
          </button>
          <input
            ref={profileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProfileChange}
          />
        </div>
        {!showCover && (
          <div>
            <p className="font-medium">{name}</p>
            <button
              onClick={() => profileInputRef.current?.click()}
              className="text-sm text-primary hover:underline"
              disabled={isUploadingProfile}
            >
              {isUploadingProfile ? "Uploading..." : "Change photo"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
