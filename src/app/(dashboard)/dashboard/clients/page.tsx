import { getClients } from "@/actions/clients";
import { ClientsManager } from "@/components/clients/clients-manager";

export default async function ClientsPage() {
  const clients = await getClients();

  return <ClientsManager initialClients={clients} />;
}
