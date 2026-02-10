"use client";

import { useState, useTransition, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  AlertTriangle,
  DollarSign,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAnalyticsSummary,
  getAnalyticsDaily,
  getTopServices,
} from "@/actions/analytics";
import type {
  AnalyticsSummary,
  AnalyticsDayRow,
  TopService,
} from "@/actions/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type Period = "7d" | "30d" | "90d";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatDelta(delta: number | null): { text: string; positive: boolean } | null {
  if (delta === null) return null;
  const sign = delta >= 0 ? "+" : "";
  return { text: `${sign}${delta.toFixed(1)}%`, positive: delta >= 0 };
}

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

interface AnalyticsDashboardProps {
  initialSummary: AnalyticsSummary;
  initialDaily: AnalyticsDayRow[];
  initialTopServices: TopService[];
}

export function AnalyticsDashboard({
  initialSummary,
  initialDaily,
  initialTopServices,
}: AnalyticsDashboardProps) {
  const [period, setPeriod] = useState<Period>("30d");
  const [summary, setSummary] = useState<AnalyticsSummary>(initialSummary);
  const [daily, setDaily] = useState<AnalyticsDayRow[]>(initialDaily);
  const [topServices, setTopServices] = useState<TopService[]>(initialTopServices);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const today = new Date().toISOString().split("T")[0];
      const startDate = subtractDays(today, days);

      const [s, d, t] = await Promise.all([
        getAnalyticsSummary(period),
        getAnalyticsDaily(startDate, today),
        getTopServices(period),
      ]);
      setSummary(s);
      setDaily(d);
      setTopServices(t);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  // Chart data
  const maxRevenue = Math.max(...daily.map((d) => d.total_revenue_cents), 1);
  const maxAppts = Math.max(...daily.map((d) => d.appointments_completed), 1);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList>
            <TabsTrigger value="7d">7 giorni</TabsTrigger>
            <TabsTrigger value="30d">30 giorni</TabsTrigger>
            <TabsTrigger value="90d">90 giorni</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-100 dark:bg-emerald-500/20"
          label="Fatturato"
          value={formatCurrency(summary.totalRevenue)}
          delta={formatDelta(summary.revenueDelta)}
        />
        <KpiCard
          icon={Calendar}
          iconColor="text-blue-600"
          iconBg="bg-blue-100 dark:bg-blue-500/20"
          label="Completati"
          value={String(summary.totalAppointments)}
          delta={formatDelta(summary.appointmentsDelta)}
        />
        <KpiCard
          icon={AlertTriangle}
          iconColor="text-amber-600"
          iconBg="bg-amber-100 dark:bg-amber-500/20"
          label="No-show rate"
          value={`${summary.noShowRate.toFixed(1)}%`}
          delta={formatDelta(summary.noShowDelta)}
          invertDelta
        />
        <KpiCard
          icon={Users}
          iconColor="text-violet-600"
          iconBg="bg-violet-100 dark:bg-violet-500/20"
          label="Nuovi clienti"
          value={String(summary.newClients)}
          delta={formatDelta(summary.newClientsDelta)}
        />
      </div>

      {/* Revenue chart */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Fatturato giornaliero</CardTitle>
        </CardHeader>
        <CardContent>
          {daily.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nessun dato per il periodo selezionato</p>
          ) : (
            <div className="flex items-end gap-[2px]" style={{ height: 180 }}>
              {daily.map((d) => {
                const h = Math.max((d.total_revenue_cents / maxRevenue) * 160, 2);
                const date = new Date(d.date + "T00:00:00");
                const label = date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
                return (
                  <div
                    key={d.date}
                    className="group relative flex flex-1 flex-col items-center justify-end"
                    style={{ height: 180 }}
                  >
                    <div className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full rounded-lg bg-popover px-2.5 py-1.5 text-[10px] text-popover-foreground shadow-lg group-hover:block">
                      <div className="font-semibold">{formatCurrency(d.total_revenue_cents)}</div>
                      <div className="text-muted-foreground">{d.appointments_completed} completati</div>
                    </div>
                    <div
                      className="w-full rounded-t bg-blue-500 transition-colors group-hover:bg-blue-600"
                      style={{ height: h, minWidth: 4 }}
                    />
                    {(daily.length <= 14 || daily.indexOf(d) % Math.ceil(daily.length / 14) === 0) && (
                      <span className="mt-1.5 text-[9px] text-muted-foreground">{label}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointments chart */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Appuntamenti giornalieri</CardTitle>
        </CardHeader>
        <CardContent>
          {daily.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nessun dato</p>
          ) : (
            <div className="flex items-end gap-[2px]" style={{ height: 140 }}>
              {daily.map((d) => {
                const completedH = Math.max((d.appointments_completed / maxAppts) * 100, 0);
                const noShowH = Math.max((d.appointments_no_show / maxAppts) * 100, 0);
                const cancelledH = Math.max((d.appointments_cancelled / maxAppts) * 100, 0);
                return (
                  <div
                    key={d.date}
                    className="group relative flex flex-1 flex-col items-center justify-end"
                    style={{ height: 140 }}
                  >
                    <div className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full rounded-lg bg-popover px-2.5 py-1.5 text-[10px] text-popover-foreground shadow-lg group-hover:block">
                      <div>✅ {d.appointments_completed} · ❌ {d.appointments_cancelled} · ⚠️ {d.appointments_no_show}</div>
                    </div>
                    <div className="flex w-full flex-col items-stretch">
                      {noShowH > 0 && (
                        <div className="w-full rounded-t bg-amber-400" style={{ height: noShowH, minWidth: 4 }} />
                      )}
                      {cancelledH > 0 && (
                        <div className="w-full bg-red-300" style={{ height: cancelledH, minWidth: 4 }} />
                      )}
                      <div
                        className={cn("w-full bg-emerald-500", noShowH === 0 && cancelledH === 0 && "rounded-t")}
                        style={{ height: Math.max(completedH, 2), minWidth: 4 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> Completati</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-300" /> Cancellati</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-400" /> No-show</span>
          </div>
        </CardContent>
      </Card>

      {/* Bottom row: top services + client breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Services */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Servizi più richiesti</CardTitle>
          </CardHeader>
          <CardContent>
            {topServices.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nessun dato</p>
            ) : (
              <div className="space-y-3">
                {topServices.map((s, i) => {
                  const maxCount = topServices[0]?.count || 1;
                  const pct = (s.count / maxCount) * 100;
                  return (
                    <div key={s.name} className="flex items-center gap-3">
                      <span className="w-5 text-right text-xs font-bold text-muted-foreground">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="truncate font-medium text-foreground">{s.name}</span>
                          <span className="ml-2 shrink-0 text-muted-foreground">
                            {s.count}x · {formatCurrency(s.revenue_cents)}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-blue-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Clienti nel periodo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{summary.newClients}</div>
                <div className="mt-1 text-xs text-muted-foreground">Nuovi</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">{summary.returningClients}</div>
                <div className="mt-1 text-xs text-muted-foreground">Ricorrenti</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">
                  {summary.newClients + summary.returningClients}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Totale</div>
              </div>
            </div>
            {summary.newClients + summary.returningClients > 0 && (
              <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-blue-500"
                  style={{
                    width: `${(summary.newClients / (summary.newClients + summary.returningClients)) * 100}%`,
                  }}
                />
                <div className="flex-1 bg-emerald-500" />
              </div>
            )}
            <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-blue-500" /> Nuovi</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> Ricorrenti</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── KPI Card Component ──────────────────────────────────────────────

interface KpiCardProps {
  icon: typeof BarChart3;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  delta: { text: string; positive: boolean } | null;
  invertDelta?: boolean;
}

function KpiCard({ icon: Icon, iconColor, iconBg, label, value, delta, invertDelta }: KpiCardProps) {
  const isGood = delta ? (invertDelta ? !delta.positive : delta.positive) : true;

  return (
    <Card className="gap-0 py-4">
      <CardContent className="px-4">
        <div className="flex items-center gap-2.5">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", iconBg)}>
            <Icon className={cn("h-4 w-4", iconColor)} />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <span className="text-xl font-bold text-foreground">{value}</span>
          {delta && (
            <Badge
              variant="secondary"
              className={cn(
                "gap-0.5 text-[11px] font-semibold",
                isGood ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400",
              )}
            >
              {isGood ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {delta.text}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
