"use server";

import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";

// ─── Zod Schemas ─────────────────────────────────────────────────────

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido (atteso YYYY-MM-DD)");
const periodSchema = z.enum(["7d", "30d", "90d"]);

// ─── Types ───────────────────────────────────────────────────────────

export interface AnalyticsDayRow {
  date: string;
  total_revenue_cents: number;
  appointments_completed: number;
  appointments_cancelled: number;
  appointments_no_show: number;
  new_clients: number;
  returning_clients: number;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalAppointments: number;
  noShowRate: number;
  newClients: number;
  returningClients: number;
  // Comparison with previous period
  revenueDelta: number | null;
  appointmentsDelta: number | null;
  noShowDelta: number | null;
  newClientsDelta: number | null;
}

export interface TopService {
  name: string;
  count: number;
  revenue_cents: number;
}

// ─── Helper ──────────────────────────────────────────────────────────

async function getBusinessId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  return { supabase, businessId: business?.id || null };
}

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

// ─── Get Daily Rows ──────────────────────────────────────────────────

export async function getAnalyticsDaily(
  startDate: string,
  endDate: string,
): Promise<AnalyticsDayRow[]> {
  const parsed = z
    .object({ startDate: dateStringSchema, endDate: dateStringSchema })
    .safeParse({ startDate, endDate });
  if (!parsed.success) return [];

  const { supabase, businessId } = await getBusinessId();
  if (!businessId) return [];

  const { data } = await supabase
    .from("analytics_daily")
    .select(
      "date, total_revenue_cents, appointments_completed, appointments_cancelled, appointments_no_show, new_clients, returning_clients",
    )
    .eq("business_id", businessId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  return (data as AnalyticsDayRow[]) || [];
}

// ─── Get Summary with Delta ──────────────────────────────────────────

export async function getAnalyticsSummary(period: "7d" | "30d" | "90d"): Promise<AnalyticsSummary> {
  const parsed = periodSchema.safeParse(period);
  if (!parsed.success)
    return {
      totalRevenue: 0,
      totalAppointments: 0,
      noShowRate: 0,
      newClients: 0,
      returningClients: 0,
      revenueDelta: null,
      appointmentsDelta: null,
      noShowDelta: null,
      newClientsDelta: null,
    };

  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const today = new Date().toISOString().split("T")[0];
  const startDate = subtractDays(today, days);
  const prevStart = subtractDays(startDate, days);

  const [current, previous] = await Promise.all([
    getAnalyticsDaily(startDate, today),
    getAnalyticsDaily(prevStart, subtractDays(startDate, 1)),
  ]);

  function sum(rows: AnalyticsDayRow[], key: keyof AnalyticsDayRow): number {
    return rows.reduce((acc, r) => acc + (r[key] as number), 0);
  }

  const totalRevenue = sum(current, "total_revenue_cents");
  const totalCompleted = sum(current, "appointments_completed");
  const totalCancelled = sum(current, "appointments_cancelled");
  const totalNoShow = sum(current, "appointments_no_show");
  const totalAll = totalCompleted + totalCancelled + totalNoShow;
  const noShowRate = totalAll > 0 ? (totalNoShow / totalAll) * 100 : 0;
  const newClients = sum(current, "new_clients");
  const returningClients = sum(current, "returning_clients");

  // Previous period
  const prevRevenue = sum(previous, "total_revenue_cents");
  const prevCompleted = sum(previous, "appointments_completed");
  const prevCancelled = sum(previous, "appointments_cancelled");
  const prevNoShow = sum(previous, "appointments_no_show");
  const prevAll = prevCompleted + prevCancelled + prevNoShow;
  const prevNoShowRate = prevAll > 0 ? (prevNoShow / prevAll) * 100 : 0;
  const prevNewClients = sum(previous, "new_clients");

  function delta(cur: number, prev: number): number | null {
    if (prev === 0) return cur > 0 ? 100 : null;
    return ((cur - prev) / prev) * 100;
  }

  return {
    totalRevenue,
    totalAppointments: totalCompleted,
    noShowRate,
    newClients,
    returningClients,
    revenueDelta: delta(totalRevenue, prevRevenue),
    appointmentsDelta: delta(totalCompleted, prevCompleted),
    noShowDelta: delta(noShowRate, prevNoShowRate),
    newClientsDelta: delta(newClients, prevNewClients),
  };
}

// ─── Top Services ────────────────────────────────────────────────────

export async function getTopServices(period: "7d" | "30d" | "90d"): Promise<TopService[]> {
  const parsed = periodSchema.safeParse(period);
  if (!parsed.success) return [];

  const { supabase, businessId } = await getBusinessId();
  if (!businessId) return [];

  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const today = new Date().toISOString().split("T")[0];
  const startDate = subtractDays(today, days);

  // Get completed appointments with services in the period
  const { data } = await supabase
    .from("appointments")
    .select("service:services(name, price_cents)")
    .eq("business_id", businessId)
    .eq("status", "completed")
    .gte("date", startDate)
    .lte("date", today);

  if (!data || data.length === 0) return [];

  // Aggregate by service name
  const map: Record<string, { count: number; revenue_cents: number }> = {};
  for (const row of data) {
    const svc = row.service as unknown as { name: string; price_cents: number } | null;
    if (!svc?.name) continue;
    if (!map[svc.name]) map[svc.name] = { count: 0, revenue_cents: 0 };
    map[svc.name].count++;
    map[svc.name].revenue_cents += svc.price_cents || 0;
  }

  return Object.entries(map)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
