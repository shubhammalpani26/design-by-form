import { createRoot } from "react-dom/client";
import { initGoogleAds } from "./lib/googleAds";
import { initMetaPixel } from "./lib/metaPixel";
import { onTrackingAllowed } from "./lib/consent";
import App from "./App.tsx";
import "./index.css";

// "ResizeObserver loop completed with undelivered notifications" is a benign
// browser notice fired when an observed element resizes faster than one frame
// (charts, carousels, the 3D viewer). It carries no actionable failure, but an
// uncaught instance blanks the preview — swallow it before anything mounts.
window.addEventListener("error", (e) => {
  if (e.message?.includes("ResizeObserver loop")) {
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
