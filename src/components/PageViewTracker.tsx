import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getSessionId } from "@/lib/experiments";

/** Logs one anonymous page view per route change for the admin Dashboard tab. */
export const PageViewTracker = () => {
  const location = useLocation();
  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return;
    const params = new URLSearchParams(location.search);
    let source = params.get("utm_source") || (params.get("fbclid") ? "facebook" : "");
    if (!source) {
      try {
        const ref = document.referrer ? new URL(document.referrer).hostname : "";
        source = ref && !ref.includes("nyzora") && !ref.includes("lovable") ? ref.replace(/^www\./, "") : "direct";
      } catch { source = "direct"; }
    }
    void fetch(`${url}/rest/v1/experiment_events`, {
      method: "POST",
      keepalive: true,
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        experiment: "site",
        variant: "a",
        event: "page_view",
        session_id: getSessionId(),
        metadata: { path: location.pathname.slice(0, 200), source: source.slice(0, 60) },
      }),
    }).catch(() => undefined);
  }, [location.pathname]);
  return null;
};
