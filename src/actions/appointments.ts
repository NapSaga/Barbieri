"use server";

import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage, renderTemplate } from "@/lib/whatsapp";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
  const { data: { user } } = await supabase.auth.getUser();
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!business) return { error: "Barberia non trovata" };

  const clientName = formData.get("client_name") as string;
  const clientPhone = formData.get("client_phone") as string;
  const staffId = formData.get("staff_id") as string;
  const serviceId = formData.get("service_id") as string;
  const date = formData.get("date") as string;
  const startTime = formData.get("start_time") as string;
  const endTime = formData.get("end_time") as string;

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
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "cancelled") {
    updateData.cancelled_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("appointments")
    .update(updateData)
    .eq("id", appointmentId);

  if (error) {
    return { error: error.message };
  }

  // If no-show, increment client no_show_count
  if (status === "no_show") {
    const { data: appointment } = await supabase
      .from("appointments")
      .select("client_id")
      .eq("id", appointmentId)
      .single();

    if (appointment?.client_id) {
      await supabase.rpc("increment_no_show", { client_uuid: appointment.client_id });
    }
  }

  // If completed, increment total_visits and update last_visit_at
  if (status === "completed") {
    const { data: appointment } = await supabase
      .from("appointments")
      .select("client_id")
      .eq("id", appointmentId)
      .single();

    if (appointment?.client_id) {
      const { data: client } = await supabase
        .from("clients")
        .select("total_visits")
        .eq("id", appointment.client_id)
        .single();

      await supabase
        .from("clients")
        .update({
          total_visits: (client?.total_visits || 0) + 1,
          last_visit_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointment.client_id);
    }
  }

  revalidatePath("/dashboard");

  return { success: true };
}
