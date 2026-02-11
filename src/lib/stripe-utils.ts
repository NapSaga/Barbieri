/**
 * Stripe helper utilities.
 * Extracted from the webhook route to enable unit testing.
 */

/** Map Stripe subscription status to our DB enum. */
export function mapStatus(stripeStatus: string): string {
  const statusMap: Record<string, string> = {
    active: "active",
    past_due: "past_due",
    canceled: "cancelled",
    cancelled: "cancelled",
    trialing: "trialing",
    incomplete: "incomplete",
    incomplete_expired: "incomplete",
    unpaid: "past_due",
    paused: "past_due",
  };
  return statusMap[stripeStatus] || "incomplete";
}
