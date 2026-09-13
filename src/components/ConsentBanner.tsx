import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { resolveConsent, setConsent } from "@/lib/consent";

/**
 * Cookie/tracking consent banner.
 *
 * Only renders for visitors in regions that require consent. Everyone else
 * never sees it. Accepting and declining are equally easy.
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

  // Reserve the banner's height so other fixed bottom bars (e.g. the order
  // bar) sit above it instead of being covered.
  useEffect(() => {
    const root = document.documentElement;
    if (!visible) {
      root.style.setProperty("--bottom-banner-h", "0px");
      return;
    }
    const el = document.querySelector<HTMLElement>("[data-consent-banner]");
    root.style.setProperty("--bottom-banner-h", `${el?.offsetHeight ?? 96}px`);
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
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-background/95 backdrop-blur px-4 py-4 md:px-6"
    >
      <div className="container flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          We use cookies to measure how our ads and site perform. Nothing is
          tracked unless you accept. See our{" "}
          <Link to="/privacy-policy" className="underline underline-offset-2 hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex gap-3 shrink-0">
          <Button variant="outline" size="sm" onClick={() => choose("denied")}>
            Decline
          </Button>
          <Button size="sm" onClick={() => choose("granted")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;
