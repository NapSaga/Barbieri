"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";

// ─── Zod Schemas ─────────────────────────────────────────────────────

const uuidSchema = z.string().uuid("ID non valido");

const createStaffSchema = z.object({
  name: z.string().min(1, "Nome membro staff obbligatorio"),
});

const updateStaffSchema = z.object({
  staffId: uuidSchema,
  name: z.string().min(1, "Nome membro staff obbligatorio"),
  active: z.enum(["true", "false"]),
});

const workingHoursDaySchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/, "Formato orario non valido"),
  end: z.string().regex(/^\d{2}:\d{2}$/, "Formato orario non valido"),
  breakStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Formato orario pausa non valido")
    .optional(),
  breakEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Formato orario pausa non valido")
    .optional(),
  off: z.boolean(),
});

const updateWorkingHoursSchema = z.object({
  staffId: uuidSchema,
  workingHours: z.record(z.string(), workingHoursDaySchema),
});

export async function getStaff() {
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

  const { data: staffMembers } = await supabase
    .from("staff")
    .select("*")
    .eq("business_id", business.id)
    .order("sort_order", { ascending: true });

  return staffMembers || [];
}

const DEFAULT_WORKING_HOURS = {
  monday: { start: "09:00", end: "19:00", off: false },
  tuesday: { start: "09:00", end: "19:00", off: false },
  wednesday: { start: "09:00", end: "19:00", off: false },
  thursday: { start: "09:00", end: "19:00", off: false },
  friday: { start: "09:00", end: "19:00", off: false },
  saturday: { start: "09:00", end: "17:00", off: false },
  sunday: { start: "09:00", end: "13:00", off: true },
};

export async function createStaffMember(formData: FormData) {
  const raw = { name: (formData.get("name") as string) ?? "" };
  const parsed = createStaffSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dati staff non validi" };

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

  const { error } = await supabase.from("staff").insert({
    business_id: business.id,
    name,
    working_hours: DEFAULT_WORKING_HOURS,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/staff");
  return { success: true };
}

export async function updateStaffMember(staffId: string, formData: FormData) {
  const raw = {
    staffId,
    name: (formData.get("name") as string) ?? "",
    active: (formData.get("active") as string) ?? "false",
  };
  const parsed = updateStaffSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dati staff non validi" };

  const supabase = await createClient();

  const name = parsed.data.name;
  const active = parsed.data.active === "true";

  const { error } = await supabase
    .from("staff")
    .update({ name, active, updated_at: new Date().toISOString() })
    .eq("id", staffId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/staff");
  return { success: true };
}

export async function updateStaffWorkingHours(
  staffId: string,
  workingHours: Record<
    string,
    { start: string; end: string; breakStart?: string; breakEnd?: string; off: boolean }
  >,
) {
  const parsed = updateWorkingHoursSchema.safeParse({ staffId, workingHours });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Orari di lavoro non validi" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("staff")
    .update({ working_hours: workingHours, updated_at: new Date().toISOString() })
    .eq("id", staffId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/staff");
  return { success: true };
}

export async function deleteStaffMember(staffId: string) {
  const parsed = uuidSchema.safeParse(staffId);
  if (!parsed.success) return { error: "ID staff non valido" };

  const supabase = await createClient();

  const { error } = await supabase.from("staff").delete().eq("id", staffId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/staff");
  return { success: true };
}
