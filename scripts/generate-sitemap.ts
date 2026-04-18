// Build-time sitemap generator.
// Fetches the live sitemap from the Supabase Edge Function and writes it to
// public/sitemap.xml so the file is served from the same domain as the site
// (e.g. https://nyzora.ai/sitemap.xml). Falls back to a minimal static sitemap
// if the fetch fails so builds never break.
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

const SITEMAP_URL =
  "https://rdcfakdhgndnhgzfkuvw.supabase.co/functions/v1/sitemap";
const OUTPUT = resolve(process.cwd(), "public/sitemap.xml");
const SITE = "https://nyzora.ai";

const FALLBACK = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${SITE}/browse</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${SITE}/explore</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${SITE}/creators</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE}/verified-makers</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE}/design-studio</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${SITE}/how-it-works</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>${SITE}/about</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>${SITE}/technology</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>${SITE}/contact</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${SITE}/plans</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>${SITE}/designer-signup</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
</urlset>`;

async function run() {
  try {
    const res = await fetch(SITEMAP_URL, {
      headers: { Accept: "application/xml" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    if (!xml.includes("<urlset")) throw new Error("Invalid sitemap response");
    if (!existsSync(dirname(OUTPUT))) mkdirSync(dirname(OUTPUT), { recursive: true });
    writeFileSync(OUTPUT, xml, "utf8");
    const count = (xml.match(/<url>/g) || []).length;
    console.log(`[sitemap] wrote ${count} urls to public/sitemap.xml`);
  } catch (err) {
    console.warn("[sitemap] fetch failed, writing fallback:", (err as Error).message);
    if (!existsSync(dirname(OUTPUT))) mkdirSync(dirname(OUTPUT), { recursive: true });
    writeFileSync(OUTPUT, FALLBACK, "utf8");
  }
}

run();
