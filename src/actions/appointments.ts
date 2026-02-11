"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { renderTemplate, sendWhatsAppMessage } from "@/lib/whatsapp";

// ─── Conflict Helpers ────────────────────────────────────────────────

interface BookedSlot {
  startTime: string;
  endTime: string;
}

async function hasConflict(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  staffId: string,
  date: string,
  startTime: string,
  endTime: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("appointments")
    .select("id")
    .eq("business_id", businessId)
    .eq("staff_id", staffId)
    .eq("date", date)
    .neq("status", "cancelled")
    .lt("start_time", endTime)
    .gt("end_time", startTime)
    .limit(1);

  return (data?.length ?? 0) > 0;
}

/**
 * Public: fetch booked time ranges for a staff member on a date.
 * Used by the booking wizard to filter out unavailable slots.
 */
export async function getStaffBookedSlots(
  businessId: string,
  staffId: string,
  date: string,
): Promise<BookedSlot[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("appointments")
    .select("start_time, end_time")
    .eq("business_id", businessId)
    .eq("staff_id", staffId)
    .eq("date", date)
    .neq("status", "cancelled")
    .order("start_time", { ascending: true });

  return (data || []).map((a) => ({
    startTime: a.start_time.slice(0, 5),
    endTime: a.end_time.slice(0, 5),
  }));
}

// ─── Zod Schemas ─────────────────────────────────────────────────────

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido (atteso YYYY-MM-DD)");
const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Formato orario non valido (atteso HH:MM)");
const uuidSchema = z.string().uuid("ID non valido");

const walkInSchema = z.object({
  client_name: z.string().min(1, "Nome cliente obbligatorio"),
  client_phone: z.string().min(1, "Telefono cliente obbligatorio"),
  staff_id: uuidSchema,
  service_id: uuidSchema,
  date: dateSchema,
  start_time: timeSchema,
  end_time: timeSchema,
});

const bookAppointmentSchema = z.object({
  businessId: uuidSchema,
  staffId: uuidSchema,
  serviceId: uuidSchema,
  date: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  clientFirstName: z.string().min(1, "Nome cliente obbligatorio"),
  clientLastName: z.string().optional(),
  clientPhone: z.string().min(1, "Telefono cliente obbligatorio"),
});

const updateStatusSchema = z.object({
  appointmentId: uuidSchema,
  status: z.enum(["confirmed", "completed", "cancelled", "no_show"]),
});

// ─── Calendar Data Fetching ──────────────────────────────────────────

export type ConfirmationStatus = "none" | "pending" | "confirmed" | "auto_cancelled";

export interface CalendarAppointment {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  source: string;
  confirmationStatus: ConfirmationStatus;
  confirmRequestSentAt: string | null;
  client: { id: string; first_name: string; last_name: string | null; phone: string } | null;
  staff: { id: string; name: string } | null;
  service: { id: string; name: string; duration_minutes: number; price_cents: number } | null;
}

export async function getAppointmentsForDate(date: string): Promise<CalendarAppointment[]> {
  const parsed = dateSchema.safeParse(date);
  if (!parsed.success) return [];

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
    .from("appointments")
    .select(`
      id, date, start_time, end_time, status, source,
      client:clients(id, first_name, last_name, phone),
      staff:staff(id, name),
      service:services(id, name, duration_minutes, price_cents)
    `)
    .eq("business_id", business.id)
    .eq("date", date)
    .order("start_time", { ascending: true });

  return enrichWithConfirmationStatus(supabase, data || [], business.id);
}

export async function getAppointmentsForWeek(
  startDate: string,
  endDate: string,
): Promise<CalendarAppointment[]> {
  const parsed = z
    .object({ startDate: dateSchema, endDate: dateSchema })
    .safeParse({ startDate, endDate });
  if (!parsed.success) return [];

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
    .from("appointments")
    .select(`
      id, date, start_time, end_time, status, source,
      client:clients(id, first_name, last_name, phone),
      staff:staff(id, name),
      service:services(id, name, duration_minutes, price_cents)
    `)
    .eq("business_id", business.id)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("start_time", { ascending: true });

  return enrichWithConfirmationStatus(supabase, data || [], business.id);
}

// ─── Confirmation Status Enrichment ──────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function enrichWithConfirmationStatus(
  supabase: any,
  rawAppointments: any[],
  businessId: string,
): Promise<CalendarAppointment[]> {
  if (rawAppointments.length === 0) return [];

  const appointmentIds = rawAppointments.map((a) => a.id);

  // Single batch query for all confirmation-related messages
  const { data: messages } = await supabase
    .from("messages")
    .select("appointment_id, type, sent_at, status")
    .eq("business_id", businessId)
    .in("appointment_id", appointmentIds)
    .in("type", ["confirm_request", "confirm_reminder"])
    .neq("status", "failed");

  // Index messages by appointment_id
  const msgByAppt: Record<string, { type: string; sent_at: string | null }[]> = {};
  for (const m of messages || []) {
    if (!msgByAppt[m.appointment_id]) msgByAppt[m.appointment_id] = [];
    msgByAppt[m.appointment_id].push(m);
  }

  return rawAppointments.map((appt) => {
    const msgs = msgByAppt[appt.id] || [];
    const confirmReq = msgs.find((m) => m.type === "confirm_request");

    let confirmationStatus: ConfirmationStatus = "none";
    if (appt.status === "confirmed") {
      confirmationStatus = "confirmed";
    } else if (appt.status === "cancelled" && confirmReq) {
      confirmationStatus = "auto_cancelled";
    } else if (confirmReq && appt.status === "booked") {
      confirmationStatus = "pending";
    }

    return {
      ...appt,
      confirmationStatus,
      confirmRequestSentAt: confirmReq?.sent_at || null,
    } as CalendarAppointment;
  });
}

export async function getStaffForCalendar() {
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
    .from("staff")
    .select("id, name, photo_url, working_hours, active")
    .eq("business_id", business.id)
    .eq("active", true)
    .order("sort_order", { ascending: true });

  return data || [];
}

export async function addWalkIn(formData: FormData) {
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
    client_name: formData.get("client_name") as string,
    client_phone: formData.get("client_phone") as string,
    staff_id: formData.get("staff_id") as string,
    service_id: formData.get("service_id") as string,
    date: formData.get("date") as string,
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
  };
  const parsed = walkInSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dati non validi" };

  const {
    client_name: clientName,
    client_phone: clientPhone,
    staff_id: staffId,
    service_id: serviceId,
    date,
    start_time: startTime,
    end_time: endTime,
  } = parsed.data;

  // Find or create client
  let clientId: string;
  const { data: existingClient } = await supabase
    .from("clients")
    .select("id")
    .eq("business_id", business.id)
    .eq("phone", clientPhone)
    .single();

  if (existingClient) {
    clientId = existingClient.id;
  } else {
    const { data: newClient, error: clientError } = await supabase
      .from("clients")
      .insert({
        business_id: business.id,
        first_name: clientName,
        phone: clientPhone,
      })
      .select("id")
      .single();

    if (clientError || !newClient) {
      return { error: clientError?.message || "Errore creazione cliente" };
    }
    clientId = newClient.id;
  }

  // Server-side conflict check
  const conflict = await hasConflict(supabase, business.id, staffId, date, startTime, endTime);
  if (conflict) {
    return { error: "Conflitto: il barbiere ha già un appuntamento in questo orario." };
  }

  const { error } = await supabase.from("appointments").insert({
    business_id: business.id,
    client_id: clientId,
    staff_id: staffId,
    service_id: serviceId,
    date,
    start_time: startTime,
    end_time: endTime,
    status: "confirmed",
    source: "walk_in",
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

interface BookAppointmentInput {
  businessId: string;
  staffId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  clientFirstName: string;
  clientLastName?: string;
  clientPhone: string;
}

export async function bookAppointment(input: BookAppointmentInput) {
  const parsed = bookAppointmentSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Dati prenotazione non validi" };

  const supabase = await createClient();

  // Find or create client
  const { data: existingClient } = await supabase
    .from("clients")
    .select("id")
    .eq("business_id", input.businessId)
    .eq("phone", input.clientPhone)
    .single();

  let clientId: string;

  if (existingClient) {
    clientId = existingClient.id;
  } else {
    const { data: newClient, error: clientError } = await supabase
      .from("clients")
      .insert({
        business_id: input.businessId,
        first_name: input.clientFirstName,
        last_name: input.clientLastName || null,
        phone: input.clientPhone,
      })
      .select("id")
      .single();

    if (clientError || !newClient) {
      return { error: clientError?.message || "Errore nella creazione del cliente" };
    }
    clientId = newClient.id;
  }

  // Server-side conflict check
  const conflict = await hasConflict(
    supabase,
    input.businessId,
    input.staffId,
    input.date,
    input.startTime,
    input.endTime,
  );
  if (conflict) {
    return { error: "Questo orario non è più disponibile. Scegli un altro slot." };
  }

  // Create appointment
  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .insert({
      business_id: input.businessId,
      client_id: clientId,
      staff_id: input.staffId,
      service_id: input.serviceId,
      date: input.date,
      start_time: input.startTime,
      end_time: input.endTime,
      status: "booked",
      source: "online",
    })
    .select("id")
    .single();

  if (appointmentError || !appointment) {
    return { error: appointmentError?.message || "Errore nella creazione dell'appuntamento" };
  }

  // Send WhatsApp confirmation (mock)
  const { data: business } = await supabase
    .from("businesses")
    .select("name, address")
    .eq("id", input.businessId)
    .single();

  const { data: service } = await supabase
    .from("services")
    .select("name")
    .eq("id", input.serviceId)
    .single();

  if (business && service) {
    await sendWhatsAppMessage({
      to: input.clientPhone,
      body: renderTemplate(
        "Ciao {{client_name}}! Appuntamento confermato per {{service_name}} il {{date}} alle {{time}} presso {{business_name}}, {{address}}.",
        {
          client_name: input.clientFirstName,
          service_name: service.name,
          date: input.date,
          time: input.startTime,
          business_name: business.name,
          address: business.address || "",
        },
      ),
    });

    // Schedule reminder messages (mock - in production these would be pg_cron jobs)
    await supabase.from("messages").insert([
      {
        business_id: input.businessId,
        client_id: clientId,
        appointment_id: appointment.id,
        type: "confirmation",
        status: "sent",
        scheduled_for: new Date().toISOString(),
        sent_at: new Date().toISOString(),
      },
    ]);
  }

  revalidatePath("/dashboard");

  return { success: true, appointmentId: appointment.id };
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: "confirmed" | "completed" | "cancelled" | "no_show",
) {
  const parsed = updateStatusSchema.safeParse({ appointmentId, status });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dati non validi" };

  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "cancelled") {
    updateData.cancelled_at = new Date().toISOString();
  }

  // Fetch full appointment data before update (needed for cancellation waitlist notification)
  const { data: appointmentData } = await supabase
    .from("appointments")
    .select("client_id, business_id, date, start_time, service_id")
    .eq("id", appointmentId)
    .single();

  const { error } = await supabase.from("appointments").update(updateData).eq("id", appointmentId);

  if (error) {
    return { error: error.message };
  }

  // If cancelled, notify waitlist entries for the freed slot
  if (status === "cancelled" && appointmentData) {
    await notifyWaitlistOnCancel(supabase, {
      business_id: appointmentData.business_id,
      date: appointmentData.date,
      start_time: appointmentData.start_time,
      service_id: appointmentData.service_id,
    });
  }

  // If no-show, increment client no_show_count
  if (status === "no_show" && appointmentData?.client_id) {
    await supabase.rpc("increment_no_show", { client_uuid: appointmentData.client_id });
  }

  // If completed, increment total_visits and update last_visit_at
  if (status === "completed" && appointmentData?.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("total_visits")
      .eq("id", appointmentData.client_id)
      .single();

    await supabase
      .from("clients")
      .update({
        total_visits: (client?.total_visits || 0) + 1,
        last_visit_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentData.client_id);
  }

  revalidatePath("/dashboard");

  return { success: true };
}

// ─── Waitlist Notification on Calendar Cancellation ─────────────────

async function notifyWaitlistOnCancel(
  supabase: Awaited<ReturnType<typeof createClient>>,
  cancelledAppointment: {
    business_id: string;
    date: string;
    start_time: string;
    service_id: string;
  },
) {
  const { data: waitlistEntries } = await supabase
    .from("waitlist")
    .select("id, client_id, service_id, desired_date, desired_start_time, desired_end_time")
    .eq("business_id", cancelledAppointment.business_id)
    .eq("desired_date", cancelledAppointment.date)
    .eq("status", "waiting")
    .order("created_at", { ascending: true })
    .limit(1);

  if (!waitlistEntries || waitlistEntries.length === 0) return;

  const entry = waitlistEntries[0];

  await supabase
    .from("waitlist")
    .update({ status: "notified", notified_at: new Date().toISOString() })
    .eq("id", entry.id);

  const { data: client } = await supabase
    .from("clients")
    .select("first_name, phone")
    .eq("id", entry.client_id)
    .single();

  const { data: service } = await supabase
    .from("services")
    .select("name")
    .eq("id", entry.service_id)
    .single();

  if (client?.phone) {
    const { sendWhatsAppMessage, renderTemplate } = await import("@/lib/whatsapp");
    const { DEFAULT_TEMPLATES } = await import("@/lib/templates");

    await sendWhatsAppMessage({
      to: client.phone,
      body: renderTemplate(DEFAULT_TEMPLATES.waitlist_notify, {
        client_name: client.first_name,
        date: cancelledAppointment.date,
        time: cancelledAppointment.start_time,
        service_name: service?.name || "servizio",
      }),
    });

    await supabase.from("messages").insert({
      business_id: cancelledAppointment.business_id,
      client_id: entry.client_id,
      type: "waitlist_notify",
      status: "sent",
      scheduled_for: new Date().toISOString(),
      sent_at: new Date().toISOString(),
    });
  }
}
