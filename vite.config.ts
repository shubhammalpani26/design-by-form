import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { componentTagger } from "lovable-tagger";
// @ts-expect-error - no types shipped
import vitePrerender from "vite-plugin-prerender";

const SITEMAP_URL =
  "https://rdcfakdhgndnhgzfkuvw.supabase.co/functions/v1/sitemap";
const SITE = "https://nyzora.ai";

// Routes that are safe to pre-render (no auth required, public content).
// Dynamic routes (/product/:slug, /designer/:slug, /maker/:slug) are intentionally
// excluded — they need a separate SSG step that queries Supabase at build time.
const PRERENDER_ROUTES = [
  "/",
  "/browse",
  "/explore",
  "/creators",
  "/verified-makers",
  "/design-studio",
  "/how-it-works",
  "/about",
  "/technology",
  "/contact",
  "/plans",
  "/designer-signup",
  "/maker-faq",
  "/creator-faq",
  "/shopper-faq",
  "/privacy-policy",
  "/terms",
];

const FALLBACK_SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${SITE}/browse</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${SITE}/explore</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${SITE}/creators</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE}/verified-makers</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE}/design-studio</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE}/how-it-works</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${SITE}/about</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
</urlset>`;

// Vite plugin: fetch the live sitemap from the Supabase Edge Function at build
// start and emit it as /sitemap.xml so it's served from the project's domain.
function sitemapPlugin(): Plugin {
  return {
    name: "nyzora-sitemap-generator",
    apply: "build",
    async buildStart() {
      const outDir = path.resolve(__dirname, "public");
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
      const outFile = path.join(outDir, "sitemap.xml");
      try {
        const res = await fetch(SITEMAP_URL, {
          headers: { Accept: "application/xml" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const xml = await res.text();
        if (!xml.includes("<urlset")) throw new Error("invalid xml");
        writeFileSync(outFile, xml, "utf8");
        const count = (xml.match(/<url>/g) || []).length;
        // eslint-disable-next-line no-console
        console.log(`[sitemap] wrote ${count} urls to public/sitemap.xml`);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(
          "[sitemap] live fetch failed, using fallback:",
          (err as Error).message,
        );
        writeFileSync(outFile, FALLBACK_SITEMAP, "utf8");
      }
    },
  };
}

// Wrap the prerender plugin so a Puppeteer/Chromium failure (e.g. missing
// system deps in the build sandbox) never breaks the production build.
function safePrerenderPlugin(): Plugin {
  const inner = vitePrerender({
    staticDir: path.join(__dirname, "dist"),
    routes: PRERENDER_ROUTES,
    renderer: new vitePrerender.PuppeteerRenderer({
      // Wait for React to render before snapshotting.
      renderAfterDocumentEvent: "render-event",
      // Fallback timeout so a hung route can't stall the whole build.
      renderAfterTime: 5000,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    }),
    postProcess(renderedRoute: { html: string; route: string }) {
      // Marker so client-side main.tsx knows to hydrate instead of render.
      renderedRoute.html = renderedRoute.html.replace(
        "<html",
        '<html data-prerendered="true"',
      );
      return renderedRoute;
    },
  });

  return {
    ...inner,
    name: "nyzora-safe-prerender",
    apply: "build",
    async closeBundle(this: unknown, ...args: unknown[]) {
      try {
        // @ts-expect-error - delegate to wrapped plugin
        if (typeof inner.closeBundle === "function") {
          // @ts-expect-error - delegate to wrapped plugin
          await inner.closeBundle.call(this, ...args);
          // eslint-disable-next-line no-console
          console.log(
            `[prerender] generated ${PRERENDER_ROUTES.length} static routes`,
          );
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(
          "[prerender] failed (build will continue with SPA fallback):",
          (err as Error).message,
        );
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    sitemapPlugin(),
    mode !== "development" && safePrerenderPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
