import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/shared/sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, subscription_status, stripe_customer_id, subscription_plan")
    .eq("owner_id", user.id)
    .single();

  const status = business?.subscription_status || "trialing";
  const hasStripeCustomer = !!business?.stripe_customer_id;
  const hasActivePlan = !!business?.subscription_plan;
  const allowedStatuses = ["active", "trialing", "past_due"];
  const showSidebar = allowedStatuses.includes(status) && hasStripeCustomer && hasActivePlan;

  // Fetch unread notification count for sidebar badge
  let unreadCount = 0;
  if (showSidebar && business?.id) {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("read", false);
    unreadCount = count || 0;
  }

  if (!showSidebar) {
    return (
      <div className="min-h-screen bg-background">
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar businessId={business?.id} initialUnreadCount={unreadCount} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
