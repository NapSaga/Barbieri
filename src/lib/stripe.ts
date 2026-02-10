import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
  }
  return _stripe;
}

/** @deprecated Use getStripe() for lazy init — kept as alias for convenience */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver);
  },
});

// Re-export plan definitions for server-side convenience
export { PLANS, STRIPE_CONFIG, type PlanId, type PlanDef } from "@/lib/stripe-plans";

// Server-only: price IDs from env (not available in client components)
export const STRIPE_PRICES: Record<string, string> = {
  essential: process.env.STRIPE_PRICE_ESSENTIAL || "",
  professional: process.env.STRIPE_PRICE_PROFESSIONAL || "",
};
