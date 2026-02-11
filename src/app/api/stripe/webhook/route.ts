import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { stripe } from "@/lib/stripe";

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

// Map Stripe subscription status → our DB enum
function mapStatus(stripeStatus: string): string {
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

async function updateSubscriptionStatus(customerId: string, status: string) {
  const { error } = await (getSupabaseAdmin().from("businesses") as any)
    .update({
      subscription_status: mapStatus(status),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("[Stripe Webhook] Error updating subscription status:", error);
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
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
        await updateSubscriptionStatus(customerId, subscription.status);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
        await updateSubscriptionStatus(customerId, "cancelled");
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
