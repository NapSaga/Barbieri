"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";

// ─── Zod Schemas ─────────────────────────────────────────────────────

const uuidSchema = z.string().uuid("ID non valido");

// ─── Types ───────────────────────────────────────────────────────────

export interface WaitlistEntry {
  id: string;
  client: { id: string; first_name: string; last_name: string | null; phone: string } | null;
  service: { id: string; name: string } | null;
  desired_date: string;
  desired_start_time: string;
  desired_end_time: string;
  status: string;
  notified_at: string | null;
  created_at: string;
}

// ─── Get Waitlist Entries ────────────────────────────────────────────

export async function getWaitlistEntries(): Promise<WaitlistEntry[]> {
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
    .from("waitlist")
    .select(`
      id, desired_date, desired_start_time, desired_end_time, status, notified_at, created_at,
      client:clients(id, first_name, last_name, phone),
      service:services(id, name)
    `)
    .eq("business_id", business.id)
    .order("desired_date", { ascending: true })
    .order("desired_start_time", { ascending: true });

  return (data as unknown as WaitlistEntry[]) || [];
}

// ─── Remove Waitlist Entry ───────────────────────────────────────────

export async function removeWaitlistEntry(entryId: string) {
  const parsed = uuidSchema.safeParse(entryId);
  if (!parsed.success) return { error: "ID lista d'attesa non valido" };

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
    .from("waitlist")
    .delete()
    .eq("id", entryId)
    .eq("business_id", business.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/waitlist");
  return { success: true };
}

// ─── Expire Old Entries ──────────────────────────────────────────────

export async function expireOldEntries() {
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

  const today = new Date().toISOString().split("T")[0];

  const { error, count } = await supabase
    .from("waitlist")
    .update({ status: "expired" })
    .eq("business_id", business.id)
    .in("status", ["waiting", "notified"])
    .lt("desired_date", today);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/waitlist");
  return { success: true, expired: count || 0 };
}
