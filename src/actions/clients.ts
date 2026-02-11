"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";

// ─── Zod Schemas ─────────────────────────────────────────────────────

const uuidSchema = z.string().uuid("ID non valido");

const createClientSchema = z.object({
  first_name: z.string().min(1, "Nome obbligatorio"),
  last_name: z.string(),
  phone: z.string().min(1, "Telefono obbligatorio"),
  email: z.string(),
  notes: z.string(),
});

const updateTagsSchema = z.object({
  clientId: uuidSchema,
  tags: z.array(z.string()),
});

const updateNotesSchema = z.object({
  clientId: uuidSchema,
  notes: z.string(),
});

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

  const raw = {
    first_name: (formData.get("first_name") as string) ?? "",
    last_name: (formData.get("last_name") as string) ?? "",
    phone: (formData.get("phone") as string) ?? "",
    email: (formData.get("email") as string) ?? "",
    notes: (formData.get("notes") as string) ?? "",
  };
  const parsed = createClientSchema.safeParse(raw);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Dati cliente non validi" };

  const { first_name: firstName, last_name: lastName, phone, email, notes } = parsed.data;

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
  const parsed = updateTagsSchema.safeParse({ clientId, tags });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dati non validi" };

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
  const parsed = updateNotesSchema.safeParse({ clientId, notes });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dati non validi" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", clientId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/clients");
  return { success: true };
}
