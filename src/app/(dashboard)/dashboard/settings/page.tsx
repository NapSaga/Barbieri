import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { getSubscriptionInfo } from "@/actions/billing";
import { getCurrentBusiness, getMessageTemplates } from "@/actions/business";
import { getClosures } from "@/actions/closures";
import { Skeleton } from "@/components/ui/skeleton";
import { isWhatsAppEnabled } from "@/lib/whatsapp";

const SettingsManager = dynamic(
  () => import("@/components/settings/settings-manager").then((m) => m.SettingsManager),
  {
    loading: () => (
      <div className="space-y-6 p-4">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-4">
          <Skeleton key="s1" className="h-20 rounded-xl" />
          <Skeleton key="s2" className="h-20 rounded-xl" />
          <Skeleton key="s3" className="h-20 rounded-xl" />
          <Skeleton key="s4" className="h-20 rounded-xl" />
          <Skeleton key="s5" className="h-20 rounded-xl" />
        </div>
      </div>
    ),
  },
);

export default async function SettingsPage() {
  const [business, templates, closures, subscriptionInfo] = await Promise.all([
    getCurrentBusiness(),
    getMessageTemplates(),
    getClosures(),
    getSubscriptionInfo().catch(() => null),
  ]);

  if (!business) redirect("/login");

  return (
    <SettingsManager
      business={business}
      initialTemplates={templates}
      whatsappEnabled={isWhatsAppEnabled()}
      initialClosures={closures}
      subscriptionInfo={subscriptionInfo}
    />
  );
}
