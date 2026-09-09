import { createRoot } from "react-dom/client";
import { initGoogleAds } from "./lib/googleAds";
import { initMetaPixel } from "./lib/metaPixel";
import { onTrackingAllowed } from "./lib/consent";
import App from "./App.tsx";
import "./index.css";

// Tracking only starts once consent resolves: instantly outside the regions
// that require consent, and after the visitor accepts inside them.
onTrackingAllowed(() => {
  initGoogleAds();
  initMetaPixel();
});

createRoot(document.getElementById("root")!).render(<App />);
