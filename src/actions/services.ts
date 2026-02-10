"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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
  const durationMinutes = parseInt(formData.get("duration_minutes") as string, 10);
  const priceCents = Math.round(parseFloat(formData.get("price") as string) * 100);

  const { error } = await supabase.from("services").insert({
    business_id: business.id,
    name,
    duration_minutes: durationMinutes,
    price_cents: priceCents,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function updateService(serviceId: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const durationMinutes = parseInt(formData.get("duration_minutes") as string, 10);
  const priceCents = Math.round(parseFloat(formData.get("price") as string) * 100);

  const { error } = await supabase
    .from("services")
    .update({
      name,
      duration_minutes: durationMinutes,
      price_cents: priceCents,
      updated_at: new Date().toISOString(),
    })
    .eq("id", serviceId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function toggleService(serviceId: string, active: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", serviceId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function deleteService(serviceId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("services").delete().eq("id", serviceId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/services");
  return { success: true };
}
