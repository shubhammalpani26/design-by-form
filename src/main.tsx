import { createRoot } from "react-dom/client";
import { initGoogleAds } from "./lib/googleAds";
import { initMetaPixel } from "./lib/metaPixel";
import App from "./App.tsx";
import "./index.css";

initGoogleAds();
initMetaPixel();
createRoot(document.getElementById("root")!).render(<App />);
