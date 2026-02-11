import { redirect } from "next/navigation";
import { getAppointmentsForDate, getStaffForCalendar } from "@/actions/appointments";
import { getClosureDates } from "@/actions/closures";
import { getWaitlistCountsByDate } from "@/actions/waitlist";
import { CalendarView } from "@/components/calendar/calendar-view";
import { createClient } from "@/lib/supabase/server";

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        <p className="text-lg font-medium">Nessuna barberia configurata</p>
        <p className="mt-2 text-sm">Vai alle impostazioni per configurare la tua barberia.</p>
      </div>
    );
  }

  const today = toISODate(new Date());

  const [appointments, staffMembers, servicesResult, closureDates, waitlistCounts] =
    await Promise.all([
      getAppointmentsForDate(today),
      getStaffForCalendar(),
      supabase
        .from("services")
        .select("id, name, duration_minutes, price_cents")
        .eq("business_id", business.id)
        .eq("active", true)
        .order("display_order", { ascending: true }),
      getClosureDates(business.id),
      getWaitlistCountsByDate(),
    ]);

  const services = servicesResult.data || [];

  // biome-ignore lint/suspicious/noExplicitAny: Supabase query result lacks working_hours shape
  const typedStaff = staffMembers as any;

  return (
    <CalendarView
      initialDate={today}
      initialAppointments={appointments}
      staffMembers={typedStaff}
      services={services}
      closureDates={closureDates}
      waitlistCounts={waitlistCounts}
    />
  );
}
