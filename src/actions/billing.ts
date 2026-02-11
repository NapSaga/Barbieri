"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { getPlanLimitsForPlan } from "@/lib/plan-limits";
import { STRIPE_PRICE_SETUP, STRIPE_PRICES, stripe } from "@/lib/stripe";
import { PLANS, type PlanId, STRIPE_CONFIG } from "@/lib/stripe-plans";
import { createClient } from "@/lib/supabase/server";

// ─── Zod Schemas ─────────────────────────────────────────────────────

const planIdSchema = z.enum(["essential", "professional", "enterprise"]);

// ─── Helpers ────────────────────────────────────────────────────────

async function getAuthenticatedBusiness() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, owner_id, name, stripe_customer_id, subscription_status, referred_by, setup_fee_paid")
    .eq("owner_id", user.id)
    .single();

  if (!business) redirect("/login");

  return { supabase, user, business };
}

async function ensureStripeCustomer(
  // biome-ignore lint/suspicious/noExplicitAny: Supabase client from getAuthenticatedBusiness
  supabase: any,
  business: { id: string; stripe_customer_id: string | null; name: string },
  userEmail: string,
) {
  if (business.stripe_customer_id) return business.stripe_customer_id;

  const customer = await stripe.customers.create({
    email: userEmail,
    name: business.name,
    metadata: { business_id: business.id },
  });

  await supabase
    .from("businesses")
    .update({ stripe_customer_id: customer.id, updated_at: new Date().toISOString() })
    .eq("id", business.id);

  return customer.id;
}

// ─── Create Checkout Session ────────────────────────────────────────

export async function createCheckoutSession(planId: PlanId) {
  const parsed = planIdSchema.safeParse(planId);
  if (!parsed.success) return { error: "Piano non valido" };

  const plan = PLANS[planId];
  const priceId = STRIPE_PRICES[planId];
  if (!plan || !priceId) {
    return { error: "Piano non disponibile" };
  }

  const { supabase, user, business } = await getAuthenticatedBusiness();
  const headersList = await headers();
  const origin =
    headersList.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const customerId = await ensureStripeCustomer(supabase, business, user.email!);

  // Auto-apply 20% referral discount for referred businesses
  const isReferred = !!business.referred_by;

  // Build line items: subscription + optional one-time setup fee
  const lineItems: { price: string; quantity: number }[] = [
    { price: priceId, quantity: 1 },
  ];

  // Add setup fee only if not already paid and price is configured
  if (!business.setup_fee_paid && STRIPE_PRICE_SETUP) {
    lineItems.push({ price: STRIPE_PRICE_SETUP, quantity: 1 });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    // allow_promotion_codes and discounts are mutually exclusive in Stripe
    ...(isReferred
      ? { discounts: [{ coupon: "REFERRAL_20_OFF" }] }
      : { allow_promotion_codes: true }),
    line_items: lineItems,
    subscription_data: {
      trial_period_days: STRIPE_CONFIG.trialDays,
      metadata: { business_id: business.id, plan: planId },
    },
    success_url: `${origin}${STRIPE_CONFIG.checkoutSuccessUrl}`,
    cancel_url: `${origin}${STRIPE_CONFIG.checkoutCancelUrl}`,
    metadata: { business_id: business.id, plan: planId },
  });

  if (!session.url) return { error: "Impossibile creare la sessione di pagamento" };

  redirect(session.url);
}

// ─── Create Customer Portal Session ─────────────────────────────────

export async function createPortalSession() {
  const { business } = await getAuthenticatedBusiness();
  const headersList = await headers();
  const origin =
    headersList.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!business.stripe_customer_id) {
    return { error: "Nessun abbonamento attivo" };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: business.stripe_customer_id,
    return_url: `${origin}${STRIPE_CONFIG.portalReturnUrl}`,
  });

  redirect(session.url);
}

// ─── Get Subscription Info ──────────────────────────────────────────

export async function getSubscriptionInfo() {
  const { business } = await getAuthenticatedBusiness();

  if (!business.stripe_customer_id) {
    return {
      status: business.subscription_status || "trialing",
      planId: null,
      planName: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trialEnd: null,
    };
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: business.stripe_customer_id,
      status: "all",
      limit: 1,
    });

    const sub = subscriptions.data[0];
    if (!sub) {
      return {
        status: business.subscription_status || "trialing",
        planId: null,
        planName: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        trialEnd: null,
      };
    }

    const periodEnd = sub.items.data[0]?.current_period_end;

    // Detect plan from subscription metadata or price
    const metaPlan = sub.metadata?.plan as PlanId | undefined;
    const activePriceId = sub.items.data[0]?.price?.id;
    let detectedPlan: PlanId | null = metaPlan || null;
    if (!detectedPlan && activePriceId) {
      for (const [key, priceId] of Object.entries(STRIPE_PRICES)) {
        if (priceId === activePriceId) {
          detectedPlan = key as PlanId;
          break;
        }
      }
    }

    return {
      status: sub.status,
      planId: detectedPlan,
      planName: detectedPlan ? PLANS[detectedPlan].name : null,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    };
  } catch (err) {
    console.error("❌ getSubscriptionInfo Stripe error:", err);
    return {
      status: business.subscription_status || "trialing",
      planId: null,
      planName: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trialEnd: null,
    };
  }
}

// ─── Get Plan Limits ─────────────────────────────────────────────────

export async function getPlanLimits() {
  const { business } = await getAuthenticatedBusiness();
  const dbStatus = business.subscription_status || "trialing";

  // If no Stripe customer, fall back to DB status (shouldn't happen with new flow)
  if (!business.stripe_customer_id) {
    return getPlanLimitsForPlan(null, dbStatus);
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: business.stripe_customer_id,
      status: "all",
      limit: 1,
    });

    const sub = subscriptions.data[0];
    if (!sub) return getPlanLimitsForPlan(null, dbStatus);

    const metaPlan = sub.metadata?.plan as PlanId | undefined;
    const activePriceId = sub.items.data[0]?.price?.id;
    let detectedPlan: PlanId | null = metaPlan || null;
    if (!detectedPlan && activePriceId) {
      for (const [key, priceId] of Object.entries(STRIPE_PRICES)) {
        if (priceId === activePriceId) {
          detectedPlan = key as PlanId;
          break;
        }
      }
    }

    // Use Stripe sub status, but fall back to DB status if plan not detected
    const effectiveStatus = sub.status === "trialing" ? "trialing" : sub.status;
    return getPlanLimitsForPlan(detectedPlan, effectiveStatus);
  } catch (err) {
    console.error("❌ getPlanLimits Stripe error:", err);
    return getPlanLimitsForPlan(null, dbStatus);
  }
}
