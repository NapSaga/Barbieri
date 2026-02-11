"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";

// ─── Zod Schemas ─────────────────────────────────────────────────────

const uuidSchema = z.string().uuid("ID non valido");

// ─── Get Waitlist Entries ────────────────────────────────────────────

export async function getWaitlistEntries() {
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

  return (data as unknown as Array<{
    id: string;
    client: { id: string; first_name: string; last_name: string | null; phone: string } | null;
    service: { id: string; name: string } | null;
    desired_date: string;
    desired_start_time: string;
    desired_end_time: string;
    status: string;
    notified_at: string | null;
    created_at: string;
  }>) || [];
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

// ─── Add to Waitlist ────────────────────────────────────────────────

const addToWaitlistSchema = z.object({
  clientId: z.string().uuid("ID cliente non valido").optional(),
  newClientFirstName: z.string().optional(),
  newClientLastName: z.string().optional(),
  newClientPhone: z.string().optional(),
  serviceId: z.string().uuid("ID servizio non valido"),
  desiredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida")
    .refine(
      (d) => d >= new Date().toISOString().split("T")[0],
      "La data deve essere oggi o nel futuro",
    ),
  desiredStartTime: z.string().regex(/^\d{2}:\d{2}$/, "Orario non valido"),
  desiredEndTime: z.string().regex(/^\d{2}:\d{2}$/, "Orario non valido"),
});

export async function addToWaitlist(input: {
  clientId?: string;
  newClientFirstName?: string;
  newClientLastName?: string;
  newClientPhone?: string;
  serviceId: string;
  desiredDate: string;
  desiredStartTime: string;
  desiredEndTime: string;
}) {
  const parsed = addToWaitlistSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dati non validi" };

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

  let clientId = parsed.data.clientId;

  // Create new client if no existing client selected
  if (!clientId) {
    const firstName = parsed.data.newClientFirstName?.trim();
    const phone = parsed.data.newClientPhone?.trim();
    if (!firstName || !phone) {
      return { error: "Nome e telefono sono obbligatori per un nuovo cliente" };
    }

    // Check if client already exists by phone
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("business_id", business.id)
      .eq("phone", phone)
      .single();

    if (existing) {
      clientId = existing.id;
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          business_id: business.id,
          first_name: firstName,
          last_name: parsed.data.newClientLastName?.trim() || null,
          phone,
        })
        .select("id")
        .single();

      if (clientError) return { error: clientError.message };
      clientId = newClient.id;
    }
  }

  const { error } = await supabase.from("waitlist").insert({
    business_id: business.id,
    client_id: clientId,
    service_id: parsed.data.serviceId,
    desired_date: parsed.data.desiredDate,
    desired_start_time: parsed.data.desiredStartTime,
    desired_end_time: parsed.data.desiredEndTime,
    status: "waiting",
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/waitlist");
  return { success: true };
}

// ─── Add to Waitlist (Public — no auth, for booking page) ───────────

const addToWaitlistPublicSchema = z.object({
  businessId: z.string().uuid("ID barberia non valido"),
  serviceId: z.string().uuid("ID servizio non valido"),
  clientFirstName: z.string().min(1, "Nome obbligatorio"),
  clientLastName: z.string().optional(),
  clientPhone: z.string().min(5, "Telefono obbligatorio"),
  desiredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida")
    .refine(
      (d) => d >= new Date().toISOString().split("T")[0],
      "La data deve essere oggi o nel futuro",
    ),
});

export async function addToWaitlistPublic(input: {
  businessId: string;
  serviceId: string;
  clientFirstName: string;
  clientLastName?: string;
  clientPhone: string;
  desiredDate: string;
}) {
  const parsed = addToWaitlistPublicSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dati non validi" };

  const supabase = await createClient();

  // Find or create client by phone
  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("business_id", parsed.data.businessId)
    .eq("phone", parsed.data.clientPhone)
    .single();

  let clientId: string;
  if (existing) {
    clientId = existing.id;
  } else {
    const { data: newClient, error: clientError } = await supabase
      .from("clients")
      .insert({
        business_id: parsed.data.businessId,
        first_name: parsed.data.clientFirstName,
        last_name: parsed.data.clientLastName?.trim() || null,
        phone: parsed.data.clientPhone,
      })
      .select("id")
      .single();

    if (clientError) return { error: clientError.message };
    clientId = newClient.id;
  }

  const { error } = await supabase.from("waitlist").insert({
    business_id: parsed.data.businessId,
    client_id: clientId,
    service_id: parsed.data.serviceId,
    desired_date: parsed.data.desiredDate,
    desired_start_time: "09:00",
    desired_end_time: "19:00",
    status: "waiting",
  });

  if (error) return { error: error.message };

  return { success: true };
}

// ─── Get Waitlist Counts by Date (for calendar badge) ───────────────

export async function getWaitlistCountsByDate(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return {};

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!business) return {};

  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("waitlist")
    .select("desired_date")
    .eq("business_id", business.id)
    .eq("status", "waiting")
    .gte("desired_date", today);

  if (!data) return {};

  const counts: Record<string, number> = {};
  for (const row of data) {
    counts[row.desired_date] = (counts[row.desired_date] || 0) + 1;
  }
  return counts;
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
