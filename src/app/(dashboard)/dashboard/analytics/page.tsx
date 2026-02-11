import { getAnalyticsDaily, getAnalyticsSummary, getTopServices } from "@/actions/analytics";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

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
