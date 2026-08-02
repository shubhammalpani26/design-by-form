import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { assertNoUserErrors, shopifyAdminGraphQL } from "../_shared/shopify-admin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const PRODUCT_CREATE = `
  mutation productCreate($product: ProductCreateInput!) {
    productCreate(product: $product) {
      product {
        id
        variants(first: 1) { nodes { id } }
      }
      userErrors { field message }
    }
  }
`;

const PRODUCT_UPDATE = `
  mutation productUpdate($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
      product { id }
      userErrors { field message }
    }
  }
`;

const VARIANTS_BULK_UPDATE = `
  mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants { id }
      userErrors { field message }
    }
  }
`;

const CREATE_MEDIA = `
  mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
    productCreateMedia(productId: $productId, media: $media) {
      mediaUserErrors { field message }
    }
  }
`;

const PUBLICATIONS = `
  query { publications(first: 20) { nodes { id name } } }
`;

const PUBLISH = `
  mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      userErrors { field message }
    }
  }
`;

let cachedPublicationIds: string[] | null = null;
async function getPublicationIds(): Promise<string[]> {
  if (cachedPublicationIds) return cachedPublicationIds;
  const data = await shopifyAdminGraphQL(PUBLICATIONS);
  cachedPublicationIds = (data?.publications?.nodes ?? []).map((n: any) => n.id);
  return cachedPublicationIds!;
}

function buildDescriptionHtml(product: any): string {
  const parts: string[] = [];
  if (product.description) parts.push(`<p>${escapeHtml(product.description)}</p>`);
  if (product.materials_description) {
    parts.push(`<p><strong>Materials:</strong> ${escapeHtml(product.materials_description)}</p>`);
  }
  const d = product.dimensions;
  if (d && (d.width || d.depth || d.height)) {
    parts.push(
      `<p><strong>Dimensions:</strong> ${[d.width, d.depth, d.height]
        .filter(Boolean)
        .join(" × ")} cm</p>`,
    );
  }
  if (product.lead_time_days) {
    parts.push(`<p><strong>Lead time:</strong> ${product.lead_time_days} days (made to order)</p>`);
  }
  return parts.join("\n");
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildTags(product: any): string[] {
  return [
    product.category,
    product.manufacturing_method === "fdm_us" ? "made-in-usa" : "made-in-india",
    product.production_region === "US" ? "region-us" : "region-in",
    "nyzora",
  ].filter(Boolean);
}

async function syncProduct(productId: string) {
  const { data: product, error } = await supabase
    .from("designer_products")
    .select(
      "id, name, slug, description, materials_description, category, designer_price, image_url, status, dimensions, weight, lead_time_days, manufacturing_method, production_region, shopify_product_id, shopify_variant_id",
    )
    .eq("id", productId)
    .maybeSingle();

  if (error) throw error;
  if (!product) throw new Error("Product not found");
  if (product.status !== "approved") {
    throw new Error("Only approved products can be synced to the store");
  }

  const descriptionHtml = buildDescriptionHtml(product);
  const tags = buildTags(product);
  const price = Number(product.designer_price).toFixed(2);

  let shopifyProductId = product.shopify_product_id as string | null;
  let shopifyVariantId = product.shopify_variant_id as string | null;

  if (shopifyProductId) {
    const data = await shopifyAdminGraphQL(PRODUCT_UPDATE, {
      product: {
        id: shopifyProductId,
        title: product.name,
        descriptionHtml,
        productType: product.category,
        tags,
        status: "ACTIVE",
      },
    });
    assertNoUserErrors("productUpdate", data?.productUpdate?.userErrors);
  } else {
    const data = await shopifyAdminGraphQL(PRODUCT_CREATE, {
      product: {
        title: product.name,
        handle: product.slug || undefined,
        descriptionHtml,
        productType: product.category,
        vendor: "Nyzora",
        tags,
        status: "ACTIVE",
        metafields: [
          {
            namespace: "nyzora",
            key: "product_id",
            type: "single_line_text_field",
            value: product.id,
          },
        ],
      },
    });
    assertNoUserErrors("productCreate", data?.productCreate?.userErrors);
    shopifyProductId = data.productCreate.product.id;
    shopifyVariantId = data.productCreate.product.variants.nodes[0]?.id ?? null;

    if (product.image_url) {
      const mediaData = await shopifyAdminGraphQL(CREATE_MEDIA, {
        productId: shopifyProductId,
        media: [
          {
            originalSource: product.image_url,
            alt: product.name,
            mediaContentType: "IMAGE",
          },
        ],
      });
      assertNoUserErrors("productCreateMedia", mediaData?.productCreateMedia?.mediaUserErrors);
    }

    const publicationIds = await getPublicationIds();
    if (publicationIds.length > 0) {
      const publishData = await shopifyAdminGraphQL(PUBLISH, {
        id: shopifyProductId,
        input: publicationIds.map((publicationId) => ({ publicationId })),
      });
      assertNoUserErrors("publishablePublish", publishData?.publishablePublish?.userErrors);
    }
  }

  if (!shopifyVariantId) {
    throw new Error("Could not resolve the Shopify variant for this product");
  }

  const variantData = await shopifyAdminGraphQL(VARIANTS_BULK_UPDATE, {
    productId: shopifyProductId,
    variants: [
      {
        id: shopifyVariantId,
        price,
        // Made to order: never block a sale on stock counts.
        inventoryPolicy: "CONTINUE",
        inventoryItem: {
          requiresShipping: true,
          tracked: false,
          ...(product.weight
            ? { measurement: { weight: { value: Number(product.weight), unit: "KILOGRAMS" } } }
            : {}),
        },
      },
    ],
  });
  assertNoUserErrors(
    "productVariantsBulkUpdate",
    variantData?.productVariantsBulkUpdate?.userErrors,
  );

  await supabase
    .from("designer_products")
    .update({
      shopify_product_id: shopifyProductId,
      shopify_variant_id: shopifyVariantId,
      shopify_synced_at: new Date().toISOString(),
      shopify_sync_error: null,
    })
    .eq("id", product.id);

  return { productId: product.id, shopifyProductId, shopifyVariantId };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { productId, productIds, syncAllApproved } = body ?? {};

    let ids: string[] = [];
    if (typeof productId === "string") ids = [productId];
    else if (Array.isArray(productIds)) ids = productIds.filter((v) => typeof v === "string");
    else if (syncAllApproved === true) {
      const { data, error } = await supabase
        .from("designer_products")
        .select("id")
        .eq("status", "approved")
        .order("created_at", { ascending: true });
      if (error) throw error;
      ids = (data ?? []).map((r: any) => r.id);
    }

    if (ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "Provide productId, productIds, or syncAllApproved: true" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results: any[] = [];
    for (const id of ids) {
      try {
        results.push({ ok: true, ...(await syncProduct(id)) });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error(`Sync failed for ${id}:`, message);
        await supabase
          .from("designer_products")
          .update({ shopify_sync_error: message.slice(0, 500) })
          .eq("id", id);
        results.push({ ok: false, productId: id, error: message });
      }
    }

    const failed = results.filter((r) => !r.ok).length;
    return new Response(
      JSON.stringify({ total: results.length, synced: results.length - failed, failed, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("sync-product-to-shopify error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});