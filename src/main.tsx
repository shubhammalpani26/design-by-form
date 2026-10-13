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

// Stale module files (after a new deploy, or the dev server re-bundling its
// dependencies) fail with "Importing a module script failed" / "Failed to fetch
// dynamically imported module". Reload once to pick up fresh files instead of
// leaving a blank screen; the session flag prevents reload loops.
const CHUNK_RELOAD_KEY = "nyzora:chunk-reloaded";
const isStaleModuleError = (msg: string) =>
  /Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module/i.test(msg);
const reloadOnceForStaleModules = () => {
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1") return false;
  sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  window.location.reload();
  return true;
};
window.addEventListener("vite:preloadError", (e) => {
  if (reloadOnceForStaleModules()) e.preventDefault();
});
window.addEventListener("unhandledrejection", (e) => {
  const msg = String((e.reason as Error)?.message ?? e.reason ?? "");
  if (isStaleModuleError(msg) && reloadOnceForStaleModules()) e.preventDefault();
});
window.addEventListener("error", (e) => {
  const msg = e.message ?? e.error?.message ?? "";
  if (isStaleModuleError(msg) && reloadOnceForStaleModules()) e.preventDefault();
});
// Clear the flag once the app has been up for a while, so a later deploy can reload again.
window.setTimeout(() => sessionStorage.removeItem(CHUNK_RELOAD_KEY), 10_000);

// Tracking only starts once consent resolves: instantly outside the regions
// that require consent, and after the visitor accepts inside them.
onTrackingAllowed(() => {
  initGoogleAds();
  initMetaPixel();
});

createRoot(document.getElementById("root")!).render(<App />);
