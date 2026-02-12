import { redirect } from "next/navigation";
import { getNotifications } from "@/actions/notifications";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { createClient } from "@/lib/supabase/server";

export default async function NotificationsPage() {
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

  const notifications = await getNotifications(100);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifiche</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aggiornamenti sui tuoi appuntamenti
        </p>
      </div>

      <NotificationsList initialNotifications={notifications} businessId={business?.id} />
    </div>
  );
}
