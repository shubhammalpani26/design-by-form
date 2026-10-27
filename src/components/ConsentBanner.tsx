import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { resolveConsent, setConsent } from "@/lib/consent";

/**
 * Cookie/tracking consent strip.
 *
 * Only renders for visitors in regions that require consent. Everyone else
 * never sees it. Accepting and declining are equally easy. Kept to one slim
 * row so it never hides the page's main action on a phone.
 */
export const ConsentBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let active = true;
    resolveConsent().then((show) => {
      if (active) setVisible(show);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const open = () => setVisible(true);
    window.addEventListener("nyzora:open-consent", open);
    return () => window.removeEventListener("nyzora:open-consent", open);
  }, []);

  // Reserve the strip's height so other fixed bottom bars (e.g. the order
  // bar) sit above it instead of being covered.
  useEffect(() => {
    const root = document.documentElement;
    if (!visible) {
      root.style.setProperty("--bottom-banner-h", "0px");
      return;
    }
    const el = document.querySelector<HTMLElement>("[data-consent-banner]");
    root.style.setProperty("--bottom-banner-h", `${el?.offsetHeight ?? 44}px`);
    return () => root.style.setProperty("--bottom-banner-h", "0px");
  }, [visible]);

  if (!visible) return null;

  const choose = (choice: "granted" | "denied") => {
    setConsent(choice);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      data-consent-banner
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-background/95 backdrop-blur px-3 py-1.5 md:px-6"
    >
      <div className="container flex items-center justify-between gap-3 px-0">
        <p className="min-w-0 text-[11px] leading-snug text-muted-foreground">
          Cookies help us measure our ads. Nothing is tracked unless you accept.{" "}
          <Link to="/privacy-policy" className="underline underline-offset-2 hover:text-foreground">
            Privacy
          </Link>
        </p>
        <div className="flex shrink-0 gap-1.5">
          <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs" onClick={() => choose("denied")}>
            Decline
          </Button>
          <Button size="sm" className="h-7 px-2.5 text-xs" onClick={() => choose("granted")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;
