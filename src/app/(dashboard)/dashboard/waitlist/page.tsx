import { getClients } from "@/actions/clients";
import { getServices } from "@/actions/services";
import { getWaitlistEntries } from "@/actions/waitlist";
import { WaitlistManager } from "@/components/waitlist/waitlist-manager";

export default async function WaitlistPage() {
  const [entries, clients, services] = await Promise.all([
    getWaitlistEntries(),
    getClients(),
    getServices(),
  ]);

  return (
    <WaitlistManager
      initialEntries={entries}
      clients={clients}
      services={services}
    />
  );
}
