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
    .select("subscription_status")
    .eq("owner_id", user.id)
    .single();

  const status = business?.subscription_status || "trialing";
  const allowedStatuses = ["active", "trialing", "past_due"];

  if (allowedStatuses.includes(status)) {
    redirect("/dashboard");
  }

  const subscriptionInfo = await getSubscriptionInfo();

  return <ExpiredView subscriptionInfo={subscriptionInfo} />;
}
