"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// ─── Types ───────────────────────────────────────────────────────────

export interface ClosureEntry {
  id: string;
  date: string;
  reason: string | null;
  created_at: string;
}

// ─── Get Closures ────────────────────────────────────────────────────

export async function getClosures(): Promise<ClosureEntry[]> {
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

  if (!business) return [];

  const { data } = await supabase
    .from("business_closures")
    .select("id, date, reason, created_at")
    .eq("business_id", business.id)
    .order("date", { ascending: true });

  return (data as ClosureEntry[]) || [];
}

// ─── Get Closure Dates (for booking) ─────────────────────────────────

export async function getClosureDates(businessId: string): Promise<string[]> {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("business_closures")
    .select("date")
    .eq("business_id", businessId)
    .gte("date", today);

  return (data || []).map((d) => d.date);
}

// ─── Add Closure ─────────────────────────────────────────────────────

export async function addClosure(date: string, reason?: string) {
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

  if (!business) return { error: "Barberia non trovata" };

  const { error } = await supabase.from("business_closures").insert({
    business_id: business.id,
    date,
    reason: reason || null,
  });

  if (error) {
    if (error.code === "23505") return { error: "Chiusura già presente per questa data" };
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ─── Remove Closure ──────────────────────────────────────────────────

export async function removeClosure(closureId: string) {
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

  if (!business) return { error: "Barberia non trovata" };

  const { error } = await supabase
    .from("business_closures")
    .delete()
    .eq("id", closureId)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}
