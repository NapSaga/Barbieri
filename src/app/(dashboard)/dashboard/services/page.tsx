import { getServices } from "@/actions/services";
import { ServicesManager } from "@/components/services/services-manager";

export default async function ServicesPage() {
  const services = await getServices();

  return <ServicesManager initialServices={services} />;
}
