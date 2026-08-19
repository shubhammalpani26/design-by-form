import { createRoot } from "react-dom/client";
import { initGoogleAds } from "./lib/googleAds";
import App from "./App.tsx";
import "./index.css";

initGoogleAds();
createRoot(document.getElementById("root")!).render(<App />);
