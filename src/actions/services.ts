"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";

// ─── Allowed Durations (15-min increments) ───────────────────────────

const ALLOWED_DURATIONS = [15, 30, 45, 60, 75, 90, 105, 120] as const;

// ─── Zod Schemas ─────────────────────────────────────────────────────

const uuidSchema = z.string().uuid("ID non valido");

const serviceFormSchema = z.object({
  name: z.string().min(1, "Nome servizio obbligatorio"),
  duration_minutes: z
    .string()
    .regex(/^\d+$/, "Durata non valida")
    .refine(
      (v) => (ALLOWED_DURATIONS as readonly number[]).includes(Number(v)),
      "Durata deve essere 15, 30, 45, 60, 75, 90, 105 o 120 minuti",
    ),
  price: z.string().regex(/^\d+([.,]\d{1,2})?$/, "Prezzo non valido"),
  is_combo: z.enum(["true", "false"]).optional(),
  combo_service_ids: z.string().optional(),
});

const toggleServiceSchema = z.object({
  serviceId: uuidSchema,
  active: z.boolean(),
});

export async function getServices() {
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

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .order("display_order", { ascending: true });

  return services || [];
}

export async function createService(formData: FormData) {
  const raw = {
    name: (formData.get("name") as string) ?? "",
    duration_minutes: (formData.get("duration_minutes") as string) ?? "",
    price: (formData.get("price") as string) ?? "",
  };
  const parsed = serviceFormSchema.safeParse(raw);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Dati servizio non validi" };

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

  const name = parsed.data.name;
  const durationMinutes = parseInt(parsed.data.duration_minutes, 10);
  const priceCents = Math.round(parseFloat(parsed.data.price) * 100);
  const isCombo = parsed.data.is_combo === "true";
  const comboServiceIds =
    isCombo && parsed.data.combo_service_ids
      ? parsed.data.combo_service_ids.split(",").filter(Boolean)
      : null;

  const { error } = await supabase.from("services").insert({
    business_id: business.id,
    name,
    duration_minutes: durationMinutes,
    price_cents: priceCents,
    is_combo: isCombo,
    combo_service_ids: comboServiceIds,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/services");
  revalidatePath("/book", "layout");
  return { success: true };
}

export async function updateService(serviceId: string, formData: FormData) {
  const idParsed = uuidSchema.safeParse(serviceId);
  if (!idParsed.success) return { error: "ID servizio non valido" };

  const raw = {
    name: (formData.get("name") as string) ?? "",
    duration_minutes: (formData.get("duration_minutes") as string) ?? "",
    price: (formData.get("price") as string) ?? "",
  };
  const parsed = serviceFormSchema.safeParse(raw);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Dati servizio non validi" };

  const supabase = await createClient();

  const name = parsed.data.name;
  const durationMinutes = parseInt(parsed.data.duration_minutes, 10);
  const priceCents = Math.round(parseFloat(parsed.data.price) * 100);
  const isCombo = parsed.data.is_combo === "true";
  const comboServiceIds =
    isCombo && parsed.data.combo_service_ids
      ? parsed.data.combo_service_ids.split(",").filter(Boolean)
      : null;

  const { error } = await supabase
    .from("services")
    .update({
      name,
      duration_minutes: durationMinutes,
      price_cents: priceCents,
      is_combo: isCombo,
      combo_service_ids: comboServiceIds,
      updated_at: new Date().toISOString(),
    })
    .eq("id", serviceId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/services");
  revalidatePath("/book", "layout");
  return { success: true };
}

export async function toggleService(serviceId: string, active: boolean) {
  const parsed = toggleServiceSchema.safeParse({ serviceId, active });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dati non validi" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", serviceId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/services");
  revalidatePath("/book", "layout");
  return { success: true };
}

export async function deleteService(serviceId: string) {
  const parsed = uuidSchema.safeParse(serviceId);
  if (!parsed.success) return { error: "ID servizio non valido" };

  const supabase = await createClient();

  const { error } = await supabase.from("services").delete().eq("id", serviceId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/services");
  revalidatePath("/book", "layout");
  return { success: true };
}
