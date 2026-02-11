"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";

// ─── Zod Schemas ─────────────────────────────────────────────────────

const uuidSchema = z.string().uuid("ID non valido");
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido (atteso YYYY-MM-DD)");

const addClosureSchema = z.object({
  date: dateSchema,
  reason: z.string().optional(),
});

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
  const parsed = uuidSchema.safeParse(businessId);
  if (!parsed.success) return [];

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
  const parsed = addClosureSchema.safeParse({ date, reason });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Dati chiusura non validi" };

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
  const parsed = uuidSchema.safeParse(closureId);
  if (!parsed.success) return { error: "ID chiusura non valido" };

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
