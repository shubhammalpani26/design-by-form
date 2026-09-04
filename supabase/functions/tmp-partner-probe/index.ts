import { uploadPrintFile, estimateFilePrice } from "../_shared/slant3d.ts";

Deno.serve(async (req) => {
  const { url, name } = await req.json().catch(() => ({ url: null, name: null }));
  try {
    const f = await uploadPrintFile(url, name ? { name } : {});
    const price = await estimateFilePrice(f.publicFileServiceId);
    return new Response(JSON.stringify({ ok: true, id: f.publicFileServiceId, metrics: f.STLMetrics, price }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { headers: { "Content-Type": "application/json" } });
  }
});
