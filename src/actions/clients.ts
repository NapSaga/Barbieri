"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function getClients() {
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

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("business_id", business.id)
    .order("last_visit_at", { ascending: false, nullsFirst: false });

  return clients || [];
}

export async function createNewClient(formData: FormData) {
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

  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const notes = formData.get("notes") as string;

  const { error } = await supabase.from("clients").insert({
    business_id: business.id,
    first_name: firstName,
    last_name: lastName || null,
    phone,
    email: email || null,
    notes: notes || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Un cliente con questo numero di telefono esiste già" };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/clients");
  return { success: true };
}

export async function updateClientTags(clientId: string, tags: string[]) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({ tags, updated_at: new Date().toISOString() })
    .eq("id", clientId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/clients");
  return { success: true };
}

export async function updateClientNotes(clientId: string, notes: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", clientId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/clients");
  return { success: true };
}
