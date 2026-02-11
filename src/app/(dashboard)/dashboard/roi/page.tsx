import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const RoiSimulator = dynamic(
  () => import("@/components/roi/roi-simulator").then((m) => m.RoiSimulator),
  {
    loading: () => (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    ),
  },
);

export default function RoiPage() {
  return <RoiSimulator />;
}
