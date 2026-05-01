import { supabase } from "@/integrations/supabase/client";
import { getStoredReferrerSlug, clearStoredReferrer } from "@/hooks/useReferralCapture";

/**
 * Attempts to attach the stored referrer to the currently signed-in user.
 * Safe to call multiple times — DB unique constraint prevents duplicates.
 */
export const attachReferralIfPending = async (): Promise<void> => {
  try {
    const slug = getStoredReferrerSlug();
    if (!slug) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Already attributed?
    const { data: existing } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_user_id", user.id)
      .maybeSingle();
    if (existing) {
      clearStoredReferrer();
      return;
    }

    // Resolve referrer designer profile by slug (only approved creators)
    const { data: referrer } = await supabase
      .from("designer_profiles")
      .select("id, user_id")
      .eq("slug", slug)
      .eq("status", "approved")
      .maybeSingle();
    if (!referrer) {
      clearStoredReferrer();
      return;
    }

    // Don't self-refer
    if (referrer.user_id === user.id) {
      clearStoredReferrer();
      return;
    }

    const { error } = await supabase.from("referrals").insert({
      referrer_designer_id: referrer.id,
      referred_user_id: user.id,
      status: "pending",
    });

    if (!error) clearStoredReferrer();
  } catch (err) {
    console.warn("[referral] attach failed", err);
  }
};

/**
 * Builds a share URL with referral attribution.
 */
export const buildReferralUrl = (path: string, referrerSlug?: string | null): string => {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://nyzora.ai";
  const url = new URL(path.startsWith("http") ? path : `${origin}${path}`);
  if (referrerSlug) url.searchParams.set("ref", referrerSlug);
  return url.toString();
};