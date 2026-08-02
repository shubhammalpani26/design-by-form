import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { isCreditPackPrice, isSubscriptionPrice } from "../_shared/plans.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

/**
 * Resolve (or create) a Stripe Customer carrying metadata.userId so later
 * reads — portal, dashboards, subscriptions.search — can find this user.
 */
async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId: string },
): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");

  // Fastest and most reliable: the customer id we already recorded ourselves.
  const { data: known } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", options.userId)
    .not("stripe_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (known?.stripe_customer_id) return known.stripe_customer_id;

  // Stripe Search is not available in every account region — treat it as a
  // best-effort lookup and fall through to the email match when it fails.
  try {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  } catch (searchError) {
    console.warn("customers.search unavailable, falling back to email lookup:", searchError);
  }

  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }

  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    metadata: { userId: options.userId },
  });
  return created.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { priceId, returnUrl, environment } = await req.json();

    if (environment !== "sandbox" && environment !== "live") {
      throw new Error("Invalid environment");
    }
    const env: StripeEnv = environment;

    if (typeof priceId !== "string" || !/^[a-zA-Z0-9_-]+$/.test(priceId)) {
      throw new Error("Invalid priceId");
    }
    if (!isSubscriptionPrice(priceId) && !isCreditPackPrice(priceId)) {
      throw new Error("Unknown priceId");
    }
    if (typeof returnUrl !== "string" || !returnUrl.startsWith("http")) {
      throw new Error("Invalid returnUrl");
    }

    // Everything sold here is tied to an account, so require a signed-in user.
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Please sign in to continue" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = createStripeClient(env);

    const prices = await stripe.prices.list({ lookup_keys: [priceId] });
    if (!prices.data.length) throw new Error("Price not found");
    const stripePrice = prices.data[0];
    const isRecurring = stripePrice.type === "recurring";

    // Block duplicate subscriptions for the same tier.
    if (isRecurring) {
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("status, current_period_end, price_id")
        .eq("user_id", user.id)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const stillActive = existing
        && ["active", "trialing", "past_due"].includes(existing.status)
        && (!existing.current_period_end || new Date(existing.current_period_end) > new Date());

      if (stillActive && existing.price_id === priceId) {
        return new Response(
          JSON.stringify({ error: "You are already on this plan. Manage it from billing settings." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const customerId = await resolveOrCreateCustomer(stripe, {
      email: user.email ?? undefined,
      userId: user.id,
    });

    let productDescription: string | undefined;
    if (!isRecurring) {
      const productId = typeof stripePrice.product === "string"
        ? stripePrice.product
        : stripePrice.product.id;
      const product = await stripe.products.retrieve(productId);
      productDescription = product.name;
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      customer: customerId,
      // Stripe Tax is unavailable for India-based accounts, so tax is handled
      // outside checkout (GST invoicing) rather than calculated here.
      metadata: { userId: user.id, lovablePriceId: priceId },
      ...(!isRecurring && { payment_intent_data: { description: productDescription } }),
      ...(isRecurring && {
        subscription_data: { metadata: { userId: user.id, lovablePriceId: priceId } },
      }),
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    console.error("create-checkout error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
