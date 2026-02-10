"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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

  const name = formData.get("name") as string;

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
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const active = formData.get("active") === "true";

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
  workingHours: Record<string, { start: string; end: string; breakStart?: string; breakEnd?: string; off: boolean }>,
) {
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
  const supabase = await createClient();

  const { error } = await supabase.from("staff").delete().eq("id", staffId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/staff");
  return { success: true };
}
