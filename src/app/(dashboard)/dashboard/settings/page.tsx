import { redirect } from "next/navigation";
import { getCurrentBusiness, getMessageTemplates } from "@/actions/business";
import { SettingsManager } from "@/components/settings/settings-manager";
import { isWhatsAppEnabled } from "@/lib/whatsapp";
import { getClosures } from "@/actions/closures";
import { getSubscriptionInfo } from "@/actions/billing";

export default async function SettingsPage() {
  const [business, templates, closures, subscriptionInfo] = await Promise.all([
    getCurrentBusiness(),
    getMessageTemplates(),
    getClosures(),
    getSubscriptionInfo(),
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
