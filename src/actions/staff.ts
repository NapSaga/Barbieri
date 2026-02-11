"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { getPlanLimits } from "@/actions/billing";
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

  // Check staff limit for current plan
  const { count } = await supabase
    .from("staff")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);

  const limits = await getPlanLimits();
  if ((count ?? 0) >= limits.maxStaff) {
    return {
      error: `Hai raggiunto il limite di ${limits.maxStaff} barbieri per il tuo piano. Passa a un piano superiore per aggiungerne altri.`,
    };
  }

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

const reorderStaffSchema = z.object({
  staffIds: z.array(z.string().uuid("ID staff non valido")).min(1, "Lista staff vuota"),
});

export async function reorderStaff(staffIds: string[]) {
  const parsed = reorderStaffSchema.safeParse({ staffIds });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Dati riordino non validi" };

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

  const updates = parsed.data.staffIds.map((id, index) =>
    supabase
      .from("staff")
      .update({ sort_order: index, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("business_id", business.id),
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard");
  return { success: true };
}

const updateStaffServicesSchema = z.object({
  staffId: uuidSchema,
  serviceIds: z.array(z.string().uuid("ID servizio non valido")),
});

export async function getStaffServices(businessId?: string) {
  const supabase = await createClient();

  if (!businessId) {
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
    businessId = business.id;
  }

  const { data } = await supabase
    .from("staff_services")
    .select("staff_id, service_id, staff!inner(business_id)")
    .eq("staff.business_id", businessId);

  return (data || []).map((row) => ({
    staffId: row.staff_id,
    serviceId: row.service_id,
  }));
}

export async function updateStaffServices(staffId: string, serviceIds: string[]) {
  const parsed = updateStaffServicesSchema.safeParse({ staffId, serviceIds });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Dati associazione non validi" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Delete existing associations
  const { error: deleteError } = await supabase
    .from("staff_services")
    .delete()
    .eq("staff_id", parsed.data.staffId);

  if (deleteError) return { error: deleteError.message };

  // Insert new associations
  if (parsed.data.serviceIds.length > 0) {
    const rows = parsed.data.serviceIds.map((serviceId) => ({
      staff_id: parsed.data.staffId,
      service_id: serviceId,
    }));

    const { error: insertError } = await supabase.from("staff_services").insert(rows);
    if (insertError) return { error: insertError.message };
  }

  revalidatePath("/dashboard/staff");
  revalidatePath("/book", "layout");
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
