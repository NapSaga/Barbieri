import { redirect } from "next/navigation";
import { getSubscriptionInfo } from "@/actions/billing";
import { ExpiredView } from "@/components/billing/expired-view";
import { createClient } from "@/lib/supabase/server";

export default async function ExpiredPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // If subscription is actually valid, redirect back to dashboard
  const { data: business } = await supabase
    .from("businesses")
    .select("subscription_status, stripe_customer_id, setup_fee_paid")
    .eq("owner_id", user.id)
    .single();

  const status = business?.subscription_status || "trialing";
  const hasStripeCustomer = !!business?.stripe_customer_id;
  const allowedStatuses = ["active", "trialing", "past_due"];

  // Only redirect back if subscription is valid AND user has gone through Stripe
  if (allowedStatuses.includes(status) && hasStripeCustomer) {
    redirect("/dashboard");
  }

  const subscriptionInfo = await getSubscriptionInfo();

  // New user = trialing without Stripe customer (never went through checkout)
  const isNewUser = status === "trialing" && !hasStripeCustomer;
  // Show setup fee if user hasn't paid it yet
  const showSetupFee = !business?.setup_fee_paid;

  return (
    <ExpiredView
      subscriptionInfo={subscriptionInfo}
      isNewUser={isNewUser}
      showSetupFee={showSetupFee}
    />
  );
}
