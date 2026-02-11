"use client";

import {
  AlertTriangle,
  BarChart3,
  Calendar,
  Euro,
  Loader2,
  Scissors,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import type { AnalyticsDayRow, AnalyticsSummary, TopService } from "@/actions/analytics";
import { getAnalyticsDaily, getAnalyticsSummary, getTopServices } from "@/actions/analytics";
import { cn } from "@/lib/utils";

type Period = "7d" | "30d" | "90d";

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7 giorni",
  "30d": "30 giorni",
  "90d": "90 giorni",
};

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

  const maxRevenue = Math.max(...daily.map((d) => d.total_revenue_cents), 1);
  const maxAppts = Math.max(
    ...daily.map(
      (d) => d.appointments_completed + d.appointments_cancelled + d.appointments_no_show,
    ),
    1,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        {/* Period selector */}
        <div className="flex rounded-lg bg-muted p-0.5">
          {(["7d", "30d", "90d"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                period === p
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={Euro}
          label="Fatturato"
          value={formatCurrency(summary.totalRevenue)}
          delta={formatDelta(summary.revenueDelta)}
          accentColor="emerald"
        />
        <KpiCard
          icon={Calendar}
          label="Completati"
          value={String(summary.totalAppointments)}
          delta={formatDelta(summary.appointmentsDelta)}
          accentColor="foreground"
        />
        <KpiCard
          icon={AlertTriangle}
          label="No-show rate"
          value={`${summary.noShowRate.toFixed(1)}%`}
          delta={formatDelta(summary.noShowDelta)}
          invertDelta
          accentColor="amber"
        />
        <KpiCard
          icon={UserPlus}
          label="Nuovi clienti"
          value={String(summary.newClients)}
          delta={formatDelta(summary.newClientsDelta)}
          accentColor="violet"
        />
      </div>

      {/* Revenue chart */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Euro className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Fatturato giornaliero</span>
          </div>
          <span className="text-xs text-muted-foreground">Ultimi {PERIOD_LABELS[period]}</span>
        </div>
        <div className="p-5">
          {daily.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="flex items-end gap-[2px]" style={{ height: 200 }}>
              {daily.map((d, idx) => {
                const h = Math.max((d.total_revenue_cents / maxRevenue) * 176, 2);
                const date = new Date(d.date + "T00:00:00");
                const label = date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
                const showLabel = daily.length <= 14 || idx % Math.ceil(daily.length / 12) === 0;
                return (
                  <div
                    key={d.date}
                    className="group relative flex flex-1 flex-col items-center justify-end"
                    style={{ height: 200 }}
                  >
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card px-3 py-2 text-[11px] shadow-lg group-hover:block">
                      <div className="font-bold text-foreground">
                        {formatCurrency(d.total_revenue_cents)}
                      </div>
                      <div className="text-muted-foreground">
                        {d.appointments_completed} completati
                      </div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground/60">{label}</div>
                    </div>
                    <div
                      className="w-full rounded-t-sm bg-foreground/80 transition-colors group-hover:bg-foreground"
                      style={{ height: h, minWidth: 3 }}
                    />
                    {showLabel && (
                      <span className="mt-2 text-[9px] text-muted-foreground">{label}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Appointments chart */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Appuntamenti giornalieri</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-emerald-500" />
              Completati
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-red-400" />
              Cancellati
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-amber-400" />
              No-show
            </span>
          </div>
        </div>
        <div className="p-5">
          {daily.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="flex items-end gap-[2px]" style={{ height: 160 }}>
              {daily.map((d) => {
                const total =
                  d.appointments_completed + d.appointments_cancelled + d.appointments_no_show;
                const completedH = Math.max((d.appointments_completed / maxAppts) * 120, 0);
                const noShowH = Math.max((d.appointments_no_show / maxAppts) * 120, 0);
                const cancelledH = Math.max((d.appointments_cancelled / maxAppts) * 120, 0);
                return (
                  <div
                    key={d.date}
                    className="group relative flex flex-1 flex-col items-center justify-end"
                    style={{ height: 160 }}
                  >
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card px-3 py-2 text-[11px] shadow-lg group-hover:block">
                      <div className="text-foreground">{d.appointments_completed} completati</div>
                      <div className="text-red-400">{d.appointments_cancelled} cancellati</div>
                      <div className="text-amber-400">{d.appointments_no_show} no-show</div>
                    </div>
                    <div className="flex w-full flex-col items-stretch">
                      {noShowH > 0 && (
                        <div
                          className="w-full rounded-t-sm bg-amber-400"
                          style={{ height: noShowH, minWidth: 3 }}
                        />
                      )}
                      {cancelledH > 0 && (
                        <div
                          className={cn("w-full bg-red-400", noShowH === 0 && "rounded-t-sm")}
                          style={{ height: cancelledH, minWidth: 3 }}
                        />
                      )}
                      <div
                        className={cn(
                          "w-full bg-emerald-500",
                          noShowH === 0 && cancelledH === 0 && "rounded-t-sm",
                        )}
                        style={{ height: Math.max(completedH, total > 0 ? 2 : 0), minWidth: 3 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Services */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
            <Scissors className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Servizi piu richiesti</span>
          </div>
          <div className="p-5">
            {topServices.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nessun dato per il periodo selezionato
              </p>
            ) : (
              <div className="space-y-4">
                {topServices.map((s, i) => {
                  const maxCount = topServices[0]?.count || 1;
                  const pct = (s.count / maxCount) * 100;
                  return (
                    <div key={s.name} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-[11px] font-bold text-muted-foreground">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate font-medium text-foreground">{s.name}</span>
                          <div className="ml-3 flex shrink-0 items-center gap-2">
                            <span className="tabular-nums text-muted-foreground">{s.count}x</span>
                            <span className="font-semibold tabular-nums text-foreground">
                              {formatCurrency(s.revenue_cents)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-foreground/70 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Client breakdown */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Clienti nel periodo</span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-4">
              <ClientStat
                icon={UserPlus}
                label="Nuovi"
                value={summary.newClients}
                color="text-violet-600 dark:text-violet-400"
                bgColor="bg-violet-100 dark:bg-violet-500/15"
              />
              <ClientStat
                icon={UserCheck}
                label="Ricorrenti"
                value={summary.returningClients}
                color="text-emerald-600 dark:text-emerald-400"
                bgColor="bg-emerald-100 dark:bg-emerald-500/15"
              />
              <ClientStat
                icon={Users}
                label="Totale"
                value={summary.newClients + summary.returningClients}
                color="text-foreground"
                bgColor="bg-muted"
              />
            </div>
            {summary.newClients + summary.returningClients > 0 && (
              <>
                <div className="mt-5 flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="rounded-l-full bg-violet-500 transition-all"
                    style={{
                      width: `${(summary.newClients / (summary.newClients + summary.returningClients)) * 100}%`,
                    }}
                  />
                  <div className="flex-1 rounded-r-full bg-emerald-500" />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-violet-500" />
                    Nuovi (
                    {summary.newClients + summary.returningClients > 0
                      ? Math.round(
                          (summary.newClients / (summary.newClients + summary.returningClients)) *
                            100,
                        )
                      : 0}
                    %)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Ricorrenti (
                    {summary.newClients + summary.returningClients > 0
                      ? Math.round(
                          (summary.returningClients /
                            (summary.newClients + summary.returningClients)) *
                            100,
                        )
                      : 0}
                    %)
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function EmptyChart() {
  return (
    <div className="flex h-40 items-center justify-center">
      <p className="text-sm text-muted-foreground">Nessun dato per il periodo selezionato</p>
    </div>
  );
}

interface ClientStatProps {
  icon: typeof Users;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

function ClientStat({ icon: Icon, label, value, color, bgColor }: ClientStatProps) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-border p-3.5">
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", bgColor)}>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div className={cn("mt-2 text-2xl font-bold tabular-nums", color)}>{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────

type AccentColor = "emerald" | "amber" | "violet" | "foreground";

const ACCENT_STYLES: Record<AccentColor, { iconBg: string; iconColor: string }> = {
  emerald: {
    iconBg: "bg-emerald-100 dark:bg-emerald-500/15",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    iconBg: "bg-amber-100 dark:bg-amber-500/15",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  violet: {
    iconBg: "bg-violet-100 dark:bg-violet-500/15",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  foreground: {
    iconBg: "bg-muted",
    iconColor: "text-foreground",
  },
};

interface KpiCardProps {
  icon: typeof BarChart3;
  label: string;
  value: string;
  delta: { text: string; positive: boolean } | null;
  invertDelta?: boolean;
  accentColor: AccentColor;
}

function KpiCard({ icon: Icon, label, value, delta, invertDelta, accentColor }: KpiCardProps) {
  const isGood = delta ? (invertDelta ? !delta.positive : delta.positive) : true;
  const accent = ACCENT_STYLES[accentColor];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2.5">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", accent.iconBg)}>
          <Icon className={cn("h-4 w-4", accent.iconColor)} />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <span className="text-2xl font-bold tabular-nums text-foreground">{value}</span>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              isGood
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
            )}
          >
            {isGood ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta.text}
          </span>
        )}
      </div>
    </div>
  );
}
