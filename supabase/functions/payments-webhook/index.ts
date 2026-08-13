import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";
import {
  CREDIT_PACK_PRICES,
  FREE_TIER,
  SUBSCRIPTION_PRICES,
  type PlanEntitlement,
} from "../_shared/plans.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function db() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

/** Human-readable price id — stable across sandbox and live. */
function resolvePriceId(price: any): string | null {
  return price?.lookup_key ?? price?.metadata?.lovable_external_id ?? null;
}

function isoFromUnix(seconds: number | null | undefined): string | null {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function addCredits(userId: string, amount: number, type: string, description: string, metadata: Record<string, unknown>) {
  if (amount <= 0) return;
  const { data: row } = await db()
    .from("user_credits")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (row) {
    await db()
      .from("user_credits")
      .update({ balance: (row.balance as number) + amount, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
  } else {
    await db().from("user_credits").insert({
      user_id: userId,
      balance: amount,
      free_credits_reset_at: "infinity",
    });
  }

  await db().from("credit_transactions").insert({
    user_id: userId,
    amount,
    type,
    description,
    metadata,
  });
}

async function sendWelcomeEmail(userId: string, plan: PlanEntitlement) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.warn("RESEND_API_KEY missing — skipping welcome email");
    return;
  }
  const { data: authUser } = await db().auth.admin.getUserById(userId);
  const email = authUser?.user?.email;
  if (!email) return;

  const body = `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#111;">
      <p style="font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:#888;">Nyzora</p>
      <h1 style="font-size:26px;font-weight:600;margin:8px 0 16px;">Welcome to ${plan.label}</h1>
      <p style="line-height:1.6;color:#444;">Your plan is active. Here's what just unlocked:</p>
      <ul style="line-height:1.9;color:#444;">
        <li>${plan.listingsLimit === null ? "Unlimited product listings" : `${plan.listingsLimit} product listings`}</li>
        <li>${plan.monthlyCredits} AI design credits, refilled every billing period</li>
        <li>${plan.threeDModelsLimit} 3D models included per period</li>
        <li>Verified Creator badge on your profile and products</li>
        ${plan.tier === "pro_studio" ? "<li>Branded storefront, custom domain and the full AI marketing agent suite</li>" : ""}
      </ul>
      <p style="line-height:1.6;color:#444;">Start designing at
        <a href="https://nyzora.ai/design-studio" style="color:#111;">nyzora.ai/design-studio</a>.
      </p>
      <p style="font-size:12px;color:#999;margin-top:28px;">Manage or cancel anytime from your creator dashboard.</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Nyzora <hello@nyzora.ai>",
      to: [email],
      subject: `Your Nyzora ${plan.label} plan is live`,
      html: body,
    }),
  });
  if (!res.ok) console.error("Welcome email failed:", res.status, await res.text());
}

async function setPlanTier(userId: string, tier: string) {
  await db().from("designer_profiles").update({ plan_tier: tier }).eq("user_id", userId);
}

async function upsertSubscription(subscription: any, env: StripeEnv, opts: { isNew: boolean }) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  const item = subscription.items?.data?.[0];
  const priceId = resolvePriceId(item?.price);
  const plan = priceId ? SUBSCRIPTION_PRICES[priceId] : undefined;
  if (!plan) {
    console.error("Unrecognised subscription price:", priceId);
    return;
  }

  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  const { data: existing } = await db()
    .from("subscriptions")
    .select("id, credits_refilled_at, price_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  await db().from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      price_id: priceId,
      plan_type: plan.planType,
      billing_cycle: plan.billingCycle,
      status: subscription.status,
      current_period_start: isoFromUnix(periodStart),
      current_period_end: isoFromUnix(periodEnd),
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      listings_limit: plan.listingsLimit,
      three_d_models_limit: plan.threeDModelsLimit,
      monthly_credits: plan.monthlyCredits,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );

  const isPaidStatus = ["active", "trialing", "past_due"].includes(subscription.status);
  if (isPaidStatus) {
    await setPlanTier(userId, plan.tier);
  }

  // Grant credits on first activation and on any tier change (upgrade/downgrade).
  const tierChanged = existing && existing.price_id !== priceId;
  if (isPaidStatus && (opts.isNew || !existing || tierChanged)) {
    await addCredits(
      userId,
      plan.monthlyCredits,
      "subscription_grant",
      `${plan.label} plan credits`,
      { subscription_id: subscription.id, price_id: priceId },
    );
    await db()
      .from("subscriptions")
      .update({ credits_refilled_at: new Date().toISOString() })
      .eq("stripe_subscription_id", subscription.id);

    await sendWelcomeEmail(userId, plan);
  }
}

/** Renewal: top up the plan's credit allowance once per billing period. */
async function refillOnRenewal(invoice: any, env: StripeEnv) {
  const subscriptionId = typeof invoice.subscription === "string"
    ? invoice.subscription
    : invoice.subscription?.id;
  if (!subscriptionId) return;

  const { data: sub } = await db()
    .from("subscriptions")
    .select("user_id, price_id, monthly_credits, credits_refilled_at, current_period_start")
    .eq("stripe_subscription_id", subscriptionId)
    .eq("environment", env)
    .maybeSingle();
  if (!sub) return;

  const periodStart = sub.current_period_start ? new Date(sub.current_period_start as string) : null;
  const lastRefill = sub.credits_refilled_at ? new Date(sub.credits_refilled_at as string) : null;
  if (periodStart && lastRefill && lastRefill >= periodStart) return; // already refilled

  await addCredits(
    sub.user_id as string,
    sub.monthly_credits as number,
    "subscription_refill",
    "Monthly plan credit refill",
    { subscription_id: subscriptionId, price_id: sub.price_id },
  );
  await db()
    .from("subscriptions")
    .update({ credits_refilled_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscriptionId);
}

/**
 * Period has actually ended. Soft-cap: published listings stay live and
 * sellable on Nyzora and Shopify — only new listings and 3D models are capped.
 */
async function endSubscription(subscription: any, env: StripeEnv) {
  const { data: row } = await db()
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  await db()
    .from("subscriptions")
    .update({
      status: "canceled",
      listings_limit: FREE_TIER.listingsLimit,
      three_d_models_limit: FREE_TIER.threeDModelsLimit,
      monthly_credits: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);

  const userId = subscription.metadata?.userId ?? row?.user_id;
  if (userId) await setPlanTier(userId as string, "free");
}

/** One-time credit pack purchase. */
async function fulfilCreditPack(session: any, env: StripeEnv) {
  const userId = session.metadata?.userId;
  const priceId = session.metadata?.lovablePriceId;
  if (!userId || !priceId) return;

  const pack = CREDIT_PACK_PRICES[priceId];
  if (!pack) {
    console.error("Unrecognised credit pack price:", priceId);
    return;
  }
  await fulfilCreditPackInner(session, env, userId, priceId, pack);
}

/** Nyzora Originals retail order — mark paid, capture shipping, confirm by email. */
async function fulfilOriginalsOrder(session: any) {
  const orderId = session.metadata?.originals_order_id;
  if (!orderId) return;

  const { data: order } = await db()
    .from("originals_orders")
    .select("id, status, sku_slug, size_label, amount_usd, preview_image_url")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) {
    console.error("Originals order not found:", orderId);
    return;
  }
  if (order.status === "paid" || order.status === "in_production" || order.status === "shipped") return;

  const email = session.customer_details?.email ?? session.customer_email ?? null;
  const shipping = session.collected_information?.shipping_details
    ?? session.shipping_details
    ?? session.customer_details?.address
    ?? null;

  // Only the delivery that actually flips the status sends the receipt.
  // Guards against two concurrent Stripe deliveries both passing the read above.
  const { data: claimed } = await db()
    .from("originals_orders")
    .update({
      status: "paid",
      customer_email: email,
      stripe_session_id: session.id,
      shipping_address: shipping,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .in("status", ["pending", "failed"])
    .select("id");

  if (!claimed || claimed.length === 0) {
    console.log("Originals order already fulfilled, skipping receipt:", orderId);
    return;
  }

  await sendOriginalsReceipt(email, order);
}

async function sendOriginalsReceipt(email: string | null, order: any) {
  if (!email) return;
  const names: Record<string, string> = {
    "pet-silhouette-keepsake": "Pet Sculpture Piece",
    "nursery-name-date": "Baby Name & Date Piece",
    "wedding-coordinates": "Wedding Coordinates Piece",
  };
  const { error } = await db().functions.invoke("send-transactional-email", {
    body: {
      templateName: "originals-order-confirmation",
      recipientEmail: email,
      idempotencyKey: `originals-confirmation-${order.id}`,
      templateData: {
        orderId: order.id,
        sizeLabel: order.size_label ?? "",
        amountUsd: order.amount_usd,
        previewImageUrl: order.preview_image_url ?? "",
        productName: names[order.sku_slug] ?? "Your Nyzora piece",
      },
    },
  });
  if (error) console.error("Originals confirmation email failed:", error);
}

async function fulfilCreditPackInner(
  session: any,
  env: StripeEnv,
  userId: string,
  priceId: string,
  pack: { credits: number; label: string },
) {
  // stripe_session_id is UNIQUE — this makes redelivery idempotent.
  const { error } = await db().from("credit_purchases").insert({
    user_id: userId,
    stripe_session_id: session.id,
    price_id: priceId,
    credits: pack.credits,
    amount: (session.amount_total ?? 0) / 100,
    currency: session.currency ?? "usd",
    environment: env,
  });
  if (error) {
    if (error.code === "23505") return; // already fulfilled
    throw error;
  }

  await addCredits(userId, pack.credits, "purchase", `${pack.label} — ${pack.credits} credits`, {
    session_id: session.id,
    price_id: priceId,
  });
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "customer.subscription.created":
      await upsertSubscription(event.data.object, env, { isNew: true });
      break;
    case "customer.subscription.updated":
      await upsertSubscription(event.data.object, env, { isNew: false });
      break;
    case "customer.subscription.deleted":
      await endSubscription(event.data.object, env);
      break;
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "payment" && session.payment_status !== "unpaid") {
        if (session.metadata?.originals_order_id) {
          await fulfilOriginalsOrder(session);
        } else {
          await fulfilCreditPack(session, env);
        }
      }
      break;
    }
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      if (session.mode === "payment") {
        if (session.metadata?.originals_order_id) {
          await fulfilOriginalsOrder(session);
        } else {
          await fulfilCreditPack(session, env);
        }
      }
      break;
    }
    case "invoice.paid":
      await refillOnRenewal(event.data.object, env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("Webhook received with invalid env:", rawEnv);
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await handleWebhook(req, rawEnv);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
