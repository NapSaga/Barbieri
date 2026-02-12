import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { STRIPE_PRICES, STRIPE_PRODUCT_SETUP, stripe } from "@/lib/stripe";
import { mapStatus } from "@/lib/stripe-utils";

// Use Supabase admin client to bypass RLS (same pattern as WhatsApp webhook)
// Lazy-initialized to avoid build-time crash when env vars aren't set
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabaseAdmin;
}

function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET!;
}

function detectPlanFromSubscription(subscription: Stripe.Subscription): string | null {
  const metaPlan = subscription.metadata?.plan;
  if (metaPlan) return metaPlan;

  const activePriceId = subscription.items.data[0]?.price?.id;
  if (activePriceId) {
    for (const [key, priceId] of Object.entries(STRIPE_PRICES)) {
      if (priceId === activePriceId) return key;
    }
  }
  return null;
}

async function updateSubscriptionStatus(
  customerId: string,
  status: string,
  planId?: string | null,
) {
  // biome-ignore lint/suspicious/noExplicitAny: admin client has no generated types
  const updateData: any = {
    subscription_status: mapStatus(status),
    updated_at: new Date().toISOString(),
  };
  if (planId !== undefined) {
    updateData.subscription_plan = planId;
  }

  // biome-ignore lint/suspicious/noExplicitAny: admin client has no generated types
  const { error } = await (getSupabaseAdmin().from("businesses") as any)
    .update(updateData)
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("[Stripe Webhook] Error updating subscription status:", error);
  }
}

async function processCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!STRIPE_PRODUCT_SETUP) return;

  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (!customerId) return;

  // Retrieve line items to check for setup fee product
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
  const hasSetupFee = lineItems.data.some((item) => {
    const productId =
      typeof item.price?.product === "string" ? item.price.product : item.price?.product?.id;
    return productId === STRIPE_PRODUCT_SETUP;
  });

  if (!hasSetupFee) return;

  const now = new Date().toISOString();
  // biome-ignore lint/suspicious/noExplicitAny: admin client has no generated types
  const { error } = await (getSupabaseAdmin().from("businesses") as any)
    .update({ setup_fee_paid: true, setup_fee_paid_at: now, updated_at: now })
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("[Stripe Webhook] Error marking setup fee as paid:", error);
  } else {
    console.log(`[Stripe Webhook] Setup fee marked as paid for customer ${customerId}`);
  }
}

async function processReferralReward(customerId: string, invoice: Stripe.Invoice) {
  // Only process first real invoice (not trial period invoices with amount 0)
  if (invoice.amount_paid <= 0) return;

  const admin = getSupabaseAdmin();

  // Find the business that just paid
  // biome-ignore lint/suspicious/noExplicitAny: admin client has no generated types
  const { data: business } = await (admin.from("businesses") as any)
    .select("id, referred_by")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!business?.referred_by) return;

  // Check if there's a pending referral to reward
  // biome-ignore lint/suspicious/noExplicitAny: admin client has no generated types
  const { data: referral } = await (admin.from("referrals") as any)
    .select("id, status, reward_amount_cents")
    .eq("referrer_business_id", business.referred_by)
    .eq("referred_business_id", business.id)
    .in("status", ["pending", "converted"])
    .single();

  if (!referral) return;

  // Update to converted if still pending
  if (referral.status === "pending") {
    // biome-ignore lint/suspicious/noExplicitAny: admin client has no generated types
    await (admin.from("referrals") as any)
      .update({ status: "converted", converted_at: new Date().toISOString() })
      .eq("id", referral.id);
  }

  // Find referrer's Stripe customer ID to apply credit
  // biome-ignore lint/suspicious/noExplicitAny: admin client has no generated types
  const { data: referrer } = await (admin.from("businesses") as any)
    .select("stripe_customer_id")
    .eq("id", business.referred_by)
    .single();

  if (!referrer?.stripe_customer_id) {
    console.log("[Stripe Webhook] Referrer has no Stripe customer, skipping credit");
    return;
  }

  try {
    // Apply credit to referrer via Stripe Customer Balance (negative = credit)
    const balanceTx = await stripe.customers.createBalanceTransaction(referrer.stripe_customer_id, {
      amount: -referral.reward_amount_cents,
      currency: "eur",
      description: "Credito referral BarberOS",
    });

    // Mark referral as rewarded
    // biome-ignore lint/suspicious/noExplicitAny: admin client has no generated types
    await (admin.from("referrals") as any)
      .update({
        status: "rewarded",
        rewarded_at: new Date().toISOString(),
        stripe_credit_id: balanceTx.id,
      })
      .eq("id", referral.id);

    console.log(
      `[Stripe Webhook] Referral reward applied: ${referral.reward_amount_cents} cents to ${referrer.stripe_customer_id}`,
    );
  } catch (err) {
    console.error("[Stripe Webhook] Error applying referral credit:", err);
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const { allowed, resetAt } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, getWebhookSecret());
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await processCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
        const planId = detectPlanFromSubscription(subscription);
        await updateSubscriptionStatus(customerId, subscription.status, planId);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
        await updateSubscriptionStatus(customerId, "cancelled", null);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          await updateSubscriptionStatus(customerId, "past_due");
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          await updateSubscriptionStatus(customerId, "active");
          await processReferralReward(customerId, invoice);
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }
  } catch (err) {
    console.error("[Stripe Webhook] Error processing event:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
