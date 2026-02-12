import dynamic from "next/dynamic";
import { getAnalyticsDaily, getAnalyticsSummary, getTopServices } from "@/actions/analytics";
import { Skeleton } from "@/components/ui/skeleton";

const AnalyticsDashboard = dynamic(
  () => import("@/components/analytics/analytics-dashboard").then((m) => m.AnalyticsDashboard),
  {
    loading: () => (
      <div className="space-y-6 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton key="s1" className="h-28 rounded-xl" />
          <Skeleton key="s2" className="h-28 rounded-xl" />
          <Skeleton key="s3" className="h-28 rounded-xl" />
          <Skeleton key="s4" className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    ),
  },
);

export default async function AnalyticsPage() {
  const today = new Date().toISOString().split("T")[0];
  const startDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  })();

  const [summary, daily, topServices] = await Promise.all([
    getAnalyticsSummary("30d"),
    getAnalyticsDaily(startDate, today),
    getTopServices("30d"),
  ]);

  return (
    <AnalyticsDashboard
      initialSummary={summary}
      initialDaily={daily}
      initialTopServices={topServices}
    />
  );
}
