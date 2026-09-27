import { createRoot } from "react-dom/client";
import { initGoogleAds } from "./lib/googleAds";
import { initMetaPixel } from "./lib/metaPixel";
import { onTrackingAllowed } from "./lib/consent";
import App from "./App.tsx";
import "./index.css";

// Root-cause fix: deliver ResizeObserver notifications on the next animation
// frame instead of inside the resize loop, so "ResizeObserver loop completed
// with undelivered notifications" (benign, but it blanks the preview when
// uncaught) can never fire in the first place.
const OriginalResizeObserver = window.ResizeObserver;
class DeferredResizeObserver extends OriginalResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    super((entries, observer) => {
      requestAnimationFrame(() => callback(entries, observer));
    });
  }
}
window.ResizeObserver = DeferredResizeObserver;

// Belt and braces: swallow any instance that still slips through (including
// Safari's "ResizeObserver loop limit exceeded" wording).
window.addEventListener("error", (e) => {
  const msg = e.message ?? e.error?.message ?? "";
  if (msg.includes("ResizeObserver loop")) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

// Tracking only starts once consent resolves: instantly outside the regions
// that require consent, and after the visitor accepts inside them.
onTrackingAllowed(() => {
  initGoogleAds();
  initMetaPixel();
});

createRoot(document.getElementById("root")!).render(<App />);
