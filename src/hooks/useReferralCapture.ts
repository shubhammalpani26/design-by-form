import { useEffect } from "react";

const STORAGE_KEY = "nyzora_referrer_slug";
const STORAGE_EXPIRY_KEY = "nyzora_referrer_expiry";
const EXPIRY_DAYS = 60;

/**
 * Captures ?ref=<creator-slug> from the URL and stashes it in localStorage
 * for 60 days, so we can attribute referrals on signup later.
 * Mount once, near the app root.
 */
export const useReferralCapture = () => {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (!ref) return;

      const slug = ref.trim().toLowerCase().slice(0, 120);
      if (!slug) return;

      const expiry = Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY, slug);
      localStorage.setItem(STORAGE_EXPIRY_KEY, String(expiry));
    } catch (err) {
      // localStorage may be unavailable (private mode); fail silently.
      console.warn("[referral] capture failed", err);
    }
  }, []);
};

export const getStoredReferrerSlug = (): string | null => {
  try {
    const slug = localStorage.getItem(STORAGE_KEY);
    const expiry = Number(localStorage.getItem(STORAGE_EXPIRY_KEY) || 0);
    if (!slug) return null;
    if (expiry && expiry < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_EXPIRY_KEY);
      return null;
    }
    return slug;
  } catch {
    return null;
  }
};

export const clearStoredReferrer = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_EXPIRY_KEY);
  } catch {
    /* noop */
  }
};