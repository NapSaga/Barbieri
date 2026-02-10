"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { MessageTemplate, MessageTemplateType } from "@/lib/templates";

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
  return { success: true };
}

export async function updateBusinessOpeningHours(
  openingHours: Record<string, { open: string; close: string; closed: boolean }>,
) {
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
  return { success: true };
}

export async function updateBusinessThresholds(data: {
  dormant_threshold_days: number;
  no_show_threshold: number;
}) {
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
      updated_at: new Date().toISOString(),
    })
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
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
