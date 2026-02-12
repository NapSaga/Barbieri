"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { updateBrandSettingsSchema } from "@/lib/brand-settings";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import type { MessageTemplate, MessageTemplateType } from "@/lib/templates";

// ─── Zod Schemas ─────────────────────────────────────────────────────

const updateBusinessInfoSchema = z.object({
  name: z.string().min(1, "Nome barberia obbligatorio"),
  address: z.string().min(1, "Indirizzo obbligatorio"),
  phone: z.string().min(1, "Telefono obbligatorio"),
  google_review_link: z.string(),
});

const dayHoursSchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/, "Formato orario non valido"),
  close: z.string().regex(/^\d{2}:\d{2}$/, "Formato orario non valido"),
  closed: z.boolean(),
});
const openingHoursSchema = z.record(z.string(), dayHoursSchema);

const updateThresholdsSchema = z.object({
  dormant_threshold_days: z.number().int().min(1, "Soglia giorni dormiente deve essere almeno 1"),
  no_show_threshold: z.number().int().min(1, "Soglia no-show deve essere almeno 1"),
  auto_complete_delay_minutes: z
    .number()
    .int()
    .min(0, "Ritardo completamento deve essere almeno 0")
    .max(60, "Ritardo completamento massimo 60 minuti"),
});

const messageTemplateTypeSchema = z.enum([
  "confirmation",
  "confirm_request",
  "confirm_reminder",
  "pre_appointment",
  "cancellation",
  "review_request",
  "reactivation",
  "waitlist_notify",
]);

const upsertTemplateSchema = z.object({
  type: messageTemplateTypeSchema,
  bodyTemplate: z.string().min(1, "Template messaggio obbligatorio"),
  active: z.boolean(),
});

export async function getCurrentBusiness() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  return business;
}

export async function updateBusinessInfo(data: {
  name: string;
  address: string;
  phone: string;
  google_review_link: string;
}) {
  const parsed = updateBusinessInfoSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dati non validi" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase
    .from("businesses")
    .update({
      name: data.name,
      address: data.address,
      phone: data.phone,
      google_review_link: data.google_review_link,
      updated_at: new Date().toISOString(),
    })
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/book", "layout");
  return { success: true };
}

export async function updateBusinessOpeningHours(
  openingHours: Record<string, { open: string; close: string; closed: boolean }>,
) {
  const parsed = openingHoursSchema.safeParse(openingHours);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Orari non validi" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase
    .from("businesses")
    .update({
      opening_hours: openingHours,
      updated_at: new Date().toISOString(),
    })
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/book", "layout");
  return { success: true };
}

export async function updateBusinessThresholds(data: {
  dormant_threshold_days: number;
  no_show_threshold: number;
  auto_complete_delay_minutes: number;
}) {
  const parsed = updateThresholdsSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Soglie non valide" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase
    .from("businesses")
    .update({
      dormant_threshold_days: data.dormant_threshold_days,
      no_show_threshold: data.no_show_threshold,
      auto_complete_delay_minutes: data.auto_complete_delay_minutes,
      updated_at: new Date().toISOString(),
    })
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ─── Brand Settings ─────────────────────────────────────────────────

export async function updateBrandSettings(data: {
  brandColors?: { primary: string; secondary: string };
  logoUrl?: string;
  welcomeText?: string;
  coverImageUrl?: string;
  fontPreset?: string;
}) {
  const parsed = updateBrandSettingsSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dati non validi" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.brandColors !== undefined) {
    updateData.brand_colors = data.brandColors;
  }
  if (data.logoUrl !== undefined) {
    updateData.logo_url = data.logoUrl || null;
  }
  if (data.welcomeText !== undefined) {
    updateData.welcome_text = data.welcomeText || null;
  }
  if (data.coverImageUrl !== undefined) {
    updateData.cover_image_url = data.coverImageUrl || null;
  }
  if (data.fontPreset !== undefined) {
    updateData.font_preset = data.fontPreset || null;
  }

  const { error } = await supabase.from("businesses").update(updateData).eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/customize");
  revalidatePath("/book", "layout");
  return { success: true };
}

// ─── Message Templates ──────────────────────────────────────────────

export async function getMessageTemplates(): Promise<MessageTemplate[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!business) return [];

  const { data: templates } = await supabase
    .from("message_templates")
    .select("id, type, body_template, active")
    .eq("business_id", business.id)
    .order("type");

  return (templates as MessageTemplate[]) || [];
}

export async function upsertMessageTemplate(
  type: MessageTemplateType,
  bodyTemplate: string,
  active: boolean,
) {
  const parsed = upsertTemplateSchema.safeParse({ type, bodyTemplate, active });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Dati template non validi" };

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

  if (!business) return { error: "Business non trovata" };

  const { data: existing } = await supabase
    .from("message_templates")
    .select("id")
    .eq("business_id", business.id)
    .eq("type", type)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("message_templates")
      .update({
        body_template: bodyTemplate,
        active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("message_templates").insert({
      business_id: business.id,
      type,
      body_template: bodyTemplate,
      active,
    });

    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ─── Delete Account ──────────────────────────────────────────────────

let _supabaseAdmin: ReturnType<typeof createAdminClient> | null = null;
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY non configurata. Impossibile eliminare l'account.",
      );
    }
    _supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
  }
  return _supabaseAdmin;
}

export async function deleteAccount(confirmText: string) {
  if (confirmText !== "ELIMINA") {
    return { error: "Conferma non valida. Scrivi ELIMINA per procedere." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, stripe_customer_id")
    .eq("owner_id", user.id)
    .single();

  if (!business) redirect("/login");

  // 1. Cancel all active Stripe subscriptions
  if (business.stripe_customer_id) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: business.stripe_customer_id,
        status: "all",
      });
      for (const sub of subscriptions.data) {
        if (sub.status !== "canceled") {
          await stripe.subscriptions.cancel(sub.id);
        }
      }
    } catch (err) {
      console.error("❌ deleteAccount: Stripe cancellation error:", err);
    }
  }

  // 2. Delete business row (CASCADE deletes all related data)
  const { error: deleteError } = await supabase.from("businesses").delete().eq("id", business.id);

  if (deleteError) {
    return { error: `Errore durante l'eliminazione dei dati: ${deleteError.message}` };
  }

  // 3. Delete auth user via admin client
  const admin = getSupabaseAdmin();
  const { error: authError } = await admin.auth.admin.deleteUser(user.id);
  if (authError) {
    console.error("❌ deleteAccount: Auth deletion error:", authError);
  }

  // 4. Sign out current session
  await supabase.auth.signOut();

  redirect("/login");
}
