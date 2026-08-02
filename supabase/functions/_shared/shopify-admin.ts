export const SHOPIFY_API_VERSION = "2025-07";

export function getShopDomain(): string {
  return Deno.env.get("SHOPIFY_STORE_DOMAIN") ??
    "design-by-form-5q5vx-zxvewddj.myshopify.com";
}

function getAdminToken(): string {
  const token = Deno.env.get("SHOPIFY_ACCESS_TOKEN");
  if (!token) throw new Error("SHOPIFY_ACCESS_TOKEN is not configured");
  return token;
}

/** Calls the Shopify Admin GraphQL API and throws on transport failures. */
export async function shopifyAdminGraphQL<T = any>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const url = `https://${getShopDomain()}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": getAdminToken(),
    },
    body: JSON.stringify({ query, variables }),
  });

  const text = await response.text();
  if (!response.ok) {
    console.error(`Shopify Admin API failed [${response.status}]: ${text}`);
    throw new Error(`Shopify Admin API failed [${response.status}]: ${text}`);
  }

  const json = JSON.parse(text);
  if (json.errors) {
    throw new Error(`Shopify Admin API error: ${JSON.stringify(json.errors)}`);
  }
  return json.data as T;
}

export function assertNoUserErrors(scope: string, userErrors: any[] | undefined) {
  if (userErrors && userErrors.length > 0) {
    throw new Error(`${scope}: ${userErrors.map((e) => e.message).join("; ")}`);
  }
}