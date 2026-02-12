"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid("ID non valido");

// ─── Get Notifications ──────────────────────────────────────────────

export async function getNotifications(limit = 50) {
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
    .from("notifications")
    .select("id, type, title, body, appointment_id, read, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}

// ─── Get Unread Count ───────────────────────────────────────────────

export async function getUnreadNotificationCount() {
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

  if (!business) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("read", false);

  return count || 0;
}

// ─── Get Business ID (for Realtime subscription) ────────────────────

export async function getBusinessIdForNotifications() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  return business?.id || null;
}

// ─── Mark as Read ───────────────────────────────────────────────────

export async function markNotificationAsRead(notificationId: string) {
  const parsed = uuidSchema.safeParse(notificationId);
  if (!parsed.success) return { error: "ID non valido" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/notifications");
  return { success: true };
}

// ─── Mark All as Read ───────────────────────────────────────────────

export async function markAllNotificationsAsRead() {
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
    .from("notifications")
    .update({ read: true })
    .eq("business_id", business.id)
    .eq("read", false);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/notifications");
  return { success: true };
}
