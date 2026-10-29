import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { assertNoUserErrors, shopifyAdminGraphQL } from "../_shared/shopify-admin.ts";

/**
 * Admin-only: makes one clean studio photo of a catalog product from its existing
 * photo (an edit, so the piece's exact shape is kept), stores it beside the
 * original, and makes it the first image in the Shopify checkout.
 *
 * body: { action: "generate", productId } | { action: "next" } | { action: "remove", productId }
 */

const GATEWAY = "https://ai.gateway.lovable.dev";
const IMAGE_MODEL = "openai/gpt-image-2.5-sunburst";
const SITE_ORIGIN = Deno.env.get("SITE_URL") ?? "https://nyzora.ai";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export function buildStudioPrompt(name: string, category: string) {
  return [
    `Re-photograph the exact object in this image ("${name}", ${category}) as a clean, high-end studio product photo for an editorial furniture and decor catalogue.`,
    "KEEP IDENTICAL: the object's exact shape, silhouette, proportions, curves, edges, number of parts, colours, materials, finish, surface texture and every design detail. Do not redesign, simplify, smooth, add, remove or restyle anything. Keep the same viewing angle as the source.",
    "CHANGE ONLY the surroundings and light: remove any room, furniture, people, props, plants, text, watermarks, logos and UI. Show the object alone, whole and uncropped, centred with generous margin, on a seamless warm off-white paper backdrop.",
    "Soft diffused key light from the upper left, gentle fill, a soft natural contact shadow beneath the object, true-to-life colour, crisp focus, photorealistic. No text anywhere in the image.",
  ].join(" ");
}

const CREATE_MEDIA = `
  mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
    productCreateMedia(productId: $productId, media: $media) {
      media { id }
      mediaUserErrors { field message }
    }
  }
`;
const REORDER_MEDIA = `
  mutation productReorderMedia($id: ID!, $moves: [MoveInput!]!) {
    productReorderMedia(id: $id, moves: $moves) {
      job { id }
      mediaUserErrors { field message }
    }
  }
`;
const DELETE_MEDIA = `
  mutation productDeleteMedia($productId: ID!, $mediaIds: [ID!]!) {
    productDeleteMedia(productId: $productId, mediaIds: $mediaIds) {
      deletedMediaIds
      mediaUserErrors { field message }
    }
  }
`;

async function removeShopifyMedia(productId: string | null, mediaId: string | null) {
  if (!productId || !mediaId) return;
  const data = await shopifyAdminGraphQL(DELETE_MEDIA, { productId, mediaIds: [mediaId] });
  assertNoUserErrors("productDeleteMedia", data?.productDeleteMedia?.mediaUserErrors);
}

/** Adds the studio photo to the Shopify product and moves it to the front (checkout thumbnail). */
async function putStudioFirstInShopify(productId: string, imageUrl: string, alt: string) {
  const created = await shopifyAdminGraphQL(CREATE_MEDIA, {
    productId,
    media: [{ originalSource: imageUrl, alt, mediaContentType: "IMAGE" }],
  });
  assertNoUserErrors("productCreateMedia", created?.productCreateMedia?.mediaUserErrors);
  const mediaId: string | undefined = created?.productCreateMedia?.media?.[0]?.id;
  if (!mediaId) throw new Error("Shopify did not return the new image");
  const reordered = await shopifyAdminGraphQL(REORDER_MEDIA, {
    id: productId,
    moves: [{ id: mediaId, newPosition: "0" }],
  });
  assertNoUserErrors("productReorderMedia", reordered?.productReorderMedia?.mediaUserErrors);
  return mediaId;
}

function resolveSource(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/")) return `${SITE_ORIGIN}${raw}`;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI is not configured." }, 500);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Unauthorized" }, 401);
    const { data: userData } = await admin.auth.getUser(token);
    const userId = userData?.user?.id;
    if (!userId) return json({ error: "Unauthorized" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (isAdmin !== true) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "generate");
    const cols =
      "id, name, category, image_url, status, shopify_product_id, studio_image_url, studio_shopify_media_id";

    let product: any = null;
    if (action === "next") {
      const { data } = await admin
        .from("designer_products")
        .select(cols)
        .eq("status", "approved")
        .is("studio_image_url", null)
        .is("studio_image_error", null)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!data) return json({ ok: true, done: true });
      product = data;
    } else {
      const productId = String(body?.productId ?? "").trim();
      if (!productId) return json({ error: "Missing productId." }, 400);
      const { data } = await admin.from("designer_products").select(cols).eq("id", productId).maybeSingle();
      if (!data) return json({ error: "Product not found." }, 404);
      product = data;
    }

    if (action === "remove") {
      let shopifyError: string | null = null;
      try {
        await removeShopifyMedia(product.shopify_product_id, product.studio_shopify_media_id);
      } catch (e) {
        shopifyError = (e as Error).message;
      }
      await admin
        .from("designer_products")
        .update({ studio_image_url: null, studio_image_at: null, studio_shopify_media_id: null, studio_image_error: null })
        .eq("id", product.id);
      return json({ ok: true, productId: product.id, shopifyError });
    }

    const markError = async (msg: string) => {
      await admin.from("designer_products").update({ studio_image_error: msg.slice(0, 300) }).eq("id", product.id);
    };

    const sourceUrl = resolveSource(product.image_url);
    if (!sourceUrl) {
      await markError("No usable original photo.");
      return json({ ok: false, productId: product.id, name: product.name, error: "No usable original photo." });
    }
    const src = await fetch(sourceUrl);
    const srcType = (src.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!src.ok || !/^image\/(png|jpe?g|webp)$/i.test(srcType)) {
      await markError(`Original photo could not be read (${src.status}).`);
      return json({ ok: false, productId: product.id, name: product.name, error: "Original photo could not be read." });
    }
    const srcBlob = new Blob([await src.arrayBuffer()], { type: srcType });
    const ext = srcType.includes("png") ? "png" : srcType.includes("webp") ? "webp" : "jpg";

    const form = new FormData();
    form.set("model", IMAGE_MODEL);
    form.set("prompt", buildStudioPrompt(product.name, product.category));
    form.append("image", new File([srcBlob], `source.${ext}`, { type: srcType }));
    form.set("size", "1024x1024");
    form.set("quality", "medium");
    form.set("output_format", "jpeg");

    const res = await fetch(`${GATEWAY}/v1/images/edits`, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: form,
    });
    if (!res.ok) {
      const text = (await res.text()).slice(0, 500);
      console.error("studio photo gateway error", res.status, text);
      let message = "The photo didn't come back.";
      try {
        message = JSON.parse(text)?.error?.message ?? JSON.parse(text)?.message ?? message;
      } catch { /* keep default */ }
      // Credit, permission and rate problems stop the whole batch; don't mark the product.
      if (res.status === 402 || res.status === 403 || res.status === 429) {
        return json({ ok: false, stop: true, status: res.status, error: message }, res.status);
      }
      if (res.status === 400) await markError(message);
      return json({ ok: false, productId: product.id, name: product.name, error: message }, 502);
    }
    const out = await res.json();
    const b64: string | undefined = out?.data?.[0]?.b64_json;
    if (!b64) {
      await markError("The photo came back empty.");
      return json({ ok: false, productId: product.id, name: product.name, error: "The photo came back empty." }, 502);
    }
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const path = `studio/${product.id}/${crypto.randomUUID()}.jpg`;
    const { error: upErr } = await admin.storage
      .from("product-images")
      .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
    if (upErr) return json({ ok: false, productId: product.id, error: "Could not store the photo." }, 500);
    const publicUrl = admin.storage.from("product-images").getPublicUrl(path).data.publicUrl;

    // Shopify checkout image: replace any earlier studio photo, then put this one first.
    let mediaId: string | null = null;
    let shopifyError: string | null = null;
    if (product.shopify_product_id) {
      try {
        await removeShopifyMedia(product.shopify_product_id, product.studio_shopify_media_id).catch(() => {});
        mediaId = await putStudioFirstInShopify(product.shopify_product_id, publicUrl, product.name);
      } catch (e) {
        shopifyError = (e as Error).message;
        console.error("studio photo shopify error", product.id, shopifyError);
      }
    }

    await admin
      .from("designer_products")
      .update({
        studio_image_url: publicUrl,
        studio_image_at: new Date().toISOString(),
        studio_shopify_media_id: mediaId,
        studio_image_error: shopifyError ? `Checkout image not updated: ${shopifyError}`.slice(0, 300) : null,
      })
      .eq("id", product.id);

    return json({ ok: true, productId: product.id, name: product.name, studioUrl: publicUrl, shopifyError });
  } catch (e) {
    console.error("admin-product-studio-photo error", e);
    return json({ error: "Something went wrong." }, 500);
  }
});
