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
    .select("subscription_status, stripe_customer_id")
    .eq("owner_id", user.id)
    .single();

  const status = business?.subscription_status || "trialing";
  const hasStripeCustomer = !!business?.stripe_customer_id;
  const allowedStatuses = ["active", "trialing", "past_due"];
  const showSidebar = allowedStatuses.includes(status) && hasStripeCustomer;

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
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
