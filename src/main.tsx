import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const container = document.getElementById("root")!;

// If the HTML was pre-rendered at build time (via vite-plugin-prerender),
// hydrate over it instead of doing a full client-side render. This preserves
// the SEO-friendly HTML and lets React take over interactivity.
const isPrerendered =
  document.documentElement.getAttribute("data-prerendered") === "true" &&
  container.hasChildNodes();

if (isPrerendered) {
  hydrateRoot(container, <App />);
} else {
  createRoot(container).render(<App />);
}

// Signal to the prerenderer that the app has rendered and the snapshot can
// be captured. Fired on next tick so React has time to commit.
requestAnimationFrame(() => {
  document.dispatchEvent(new Event("render-event"));
});
