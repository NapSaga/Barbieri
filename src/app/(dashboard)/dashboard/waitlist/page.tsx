import { getWaitlistEntries } from "@/actions/waitlist";
import { WaitlistManager } from "@/components/waitlist/waitlist-manager";

export default async function WaitlistPage() {
  const entries = await getWaitlistEntries();

  return <WaitlistManager initialEntries={entries} />;
}
