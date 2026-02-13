import { redirect } from "next/navigation";
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
    .select("subscription_status, stripe_customer_id, subscription_plan, setup_fee_paid")
    .eq("owner_id", user.id)
    .single();

  const status = business?.subscription_status || "trialing";
  const hasStripeCustomer = !!business?.stripe_customer_id;
  const hasActivePlan = !!business?.subscription_plan;
  const allowedStatuses = ["active", "trialing", "past_due"];

  // Only redirect back if subscription is valid AND user completed checkout (has a plan)
  if (allowedStatuses.includes(status) && hasStripeCustomer && hasActivePlan) {
    redirect("/dashboard");
  }

  // Build subscription info inline to avoid getAuthenticatedBusiness() redirect loop
  // when business record doesn't exist
  const subscriptionInfo = {
    status: status,
    planId: null as string | null,
    planName: null as string | null,
    currentPeriodEnd: null as string | null,
    cancelAtPeriodEnd: false,
    trialEnd: null as string | null,
  };

  // New user = never completed checkout (no plan assigned yet)
  const isNewUser = !hasActivePlan;
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
