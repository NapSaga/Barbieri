"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { STRIPE_PRICES, stripe } from "@/lib/stripe";
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
    .select("id, owner_id, name, stripe_customer_id, subscription_status")
    .eq("owner_id", user.id)
    .single();

  if (!business) redirect("/login");

  return { supabase, user, business };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureStripeCustomer(
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

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
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

export interface SubscriptionInfo {
  status: string;
  planId: PlanId | null;
  planName: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
}

export async function getSubscriptionInfo(): Promise<SubscriptionInfo | null> {
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
  } catch {
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
