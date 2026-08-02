import { assertNoUserErrors, shopifyAdminGraphQL } from "../_shared/shopify-admin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Idempotent setup endpoint: points the store's order webhooks at our handler.
 * The callback URL is fixed in code, so repeat calls cannot redirect events elsewhere.
 */
const CALLBACK_URL =
  `${Deno.env.get("SUPABASE_URL")}/functions/v1/shopify-order-webhook`;

const TOPICS = ["ORDERS_PAID", "ORDERS_CREATE"];

const LIST = `
  query { webhookSubscriptions(first: 50) { nodes { id topic endpoint { ... on WebhookHttpEndpoint { callbackUrl } } } } }
`;

const CREATE = `
  mutation create($topic: WebhookSubscriptionTopic!, $sub: WebhookSubscriptionInput!) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: $sub) {
      webhookSubscription { id topic }
      userErrors { field message }
    }
  }
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const existing = await shopifyAdminGraphQL(LIST);
    const nodes = existing?.webhookSubscriptions?.nodes ?? [];
    const results: any[] = [];

    for (const topic of TOPICS) {
      const already = nodes.find(
        (n: any) => n.topic === topic && n.endpoint?.callbackUrl === CALLBACK_URL,
      );
      if (already) {
        results.push({ topic, status: "already-registered", id: already.id });
        continue;
      }

      const data = await shopifyAdminGraphQL(CREATE, {
        topic,
        sub: { callbackUrl: CALLBACK_URL, format: "JSON" },
      });
      assertNoUserErrors("webhookSubscriptionCreate", data?.webhookSubscriptionCreate?.userErrors);
      results.push({
        topic,
        status: "created",
        id: data.webhookSubscriptionCreate.webhookSubscription.id,
      });
    }

    return new Response(JSON.stringify({ callbackUrl: CALLBACK_URL, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("shopify-register-webhooks error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});