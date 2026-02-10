import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import twilio from "twilio";

/**
 * Webhook endpoint per messaggi WhatsApp in ingresso da Twilio.
 * Gestisce le risposte dei clienti:
 *   - "CONFERMA"      → conferma appuntamento (booked → confirmed)
 *   - "CANCELLA"      → cancella appuntamento attivo
 *   - "CAMBIA ORARIO" → invia link prenotazione per riprogrammare
 *   - "SI"            → conferma prenotazione dalla waitlist
 *   - "ANNULLA"       → alias di CANCELLA (retrocompatibilità)
 *
 * Configura questo URL nella Twilio Console:
 *   Messaging → Settings → WhatsApp Sandbox → "WHEN A MESSAGE COMES IN"
 *   URL: https://tuodominio.com/api/whatsapp/webhook
 *   Method: POST
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = SupabaseClient<any, "public", any>;

// Supabase admin client (bypassa RLS per operazioni webhook)
function getSupabaseAdmin(): AdminClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for webhook");
  }

  return createClient(url, serviceKey);
}

// Validazione firma Twilio per sicurezza
function validateTwilioRequest(req: NextRequest, body: string): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;

  const signature = req.headers.get("x-twilio-signature");
  if (!signature) return false;

  const url = `${process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000"}/api/whatsapp/webhook`;

  const params: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(body)) {
    params[key] = value;
  }

  return twilio.validateRequest(authToken, signature, url, params);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const params = new URLSearchParams(body);

  const from = params.get("From") || "";
  const messageBody = params.get("Body") || "";
  const messageSid = params.get("MessageSid") || "";

  const phone = from.replace("whatsapp:", "").replace("+", "");
  const phoneWithPlus = from.replace("whatsapp:", "");

  const command = messageBody.trim().toUpperCase();

  console.log(`📥 WhatsApp webhook: from=${phone} body="${messageBody}" sid=${messageSid}`);

  if (process.env.NODE_ENV === "production") {
    const isValid = validateTwilioRequest(req, body);
    if (!isValid) {
      console.error("❌ Invalid Twilio signature");
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  try {
    const supabase = getSupabaseAdmin();

    if (command === "CONFERMA") {
      await handleConfirm(supabase, phone, phoneWithPlus);
    } else if (command === "CANCELLA" || command === "ANNULLA") {
      await handleCancel(supabase, phone, phoneWithPlus);
    } else if (command === "CAMBIA ORARIO") {
      await handleReschedule(supabase, phone, phoneWithPlus);
    } else if (command === "SI" || command === "SÌ") {
      await handleWaitlistConfirm(supabase, phone, phoneWithPlus);
    } else {
      await handleUnknown(supabase, phone, phoneWithPlus, messageBody);
    }
  } catch (error) {
    console.error("❌ Webhook error:", error);
  }

  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { status: 200, headers: { "Content-Type": "text/xml" } },
  );
}

// ─── Helper: trova cliente per telefono ──────────────────────────────

async function findClientByPhone(supabase: AdminClient, phone: string, phoneWithPlus: string) {
  const { data: clients } = await supabase
    .from("clients")
    .select("id, business_id, first_name")
    .or(`phone.eq.${phone},phone.eq.${phoneWithPlus},phone.eq.+${phone}`);
  return clients || [];
}

// ─── Helper: trova prossimo appuntamento attivo ──────────────────────

async function findNextAppointment(supabase: AdminClient, clientId: string) {
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, date, start_time, service_id, business_id, status")
    .eq("client_id", clientId)
    .in("status", ["booked", "confirmed"])
    .gte("date", new Date().toISOString().split("T")[0])
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(1);
  return appointments?.[0] || null;
}

// ─── Helper: invia risposta WhatsApp via Twilio ─────────────────────

async function sendReply(phone: string, body: string) {
  const { sendWhatsAppMessage } = await import("@/lib/whatsapp");
  await sendWhatsAppMessage({ to: phone, body });
}

// ─── CONFERMA: conferma appuntamento (booked → confirmed) ───────────

async function handleConfirm(supabase: AdminClient, phone: string, phoneWithPlus: string) {
  const clients = await findClientByPhone(supabase, phone, phoneWithPlus);
  if (clients.length === 0) {
    console.log(`⚠️ CONFERMA: nessun cliente trovato per ${phone}`);
    return;
  }

  for (const client of clients) {
    const appointment = await findNextAppointment(supabase, client.id);
    if (!appointment) continue;

    if (appointment.status === "confirmed") {
      console.log(`ℹ️ CONFERMA: appuntamento ${appointment.id} già confermato`);
      continue;
    }

    await supabase
      .from("appointments")
      .update({ status: "confirmed", updated_at: new Date().toISOString() })
      .eq("id", appointment.id);

    const { data: service } = await supabase
      .from("services")
      .select("name")
      .eq("id", appointment.service_id)
      .single();

    const time = appointment.start_time?.substring(0, 5) || "";

    await sendReply(
      phoneWithPlus,
      `✅ Perfetto ${client.first_name}! Appuntamento confermato per ${service?.name || "il servizio"} alle ${time}.\n\nCi vediamo presto! Per qualsiasi cosa, scrivici qui.`,
    );

    await supabase.from("messages").insert({
      business_id: appointment.business_id,
      client_id: client.id,
      appointment_id: appointment.id,
      type: "confirmation",
      status: "sent",
      scheduled_for: new Date().toISOString(),
      sent_at: new Date().toISOString(),
    });

    console.log(`✅ CONFERMA: appuntamento ${appointment.id} confermato per ${client.first_name} (${phone})`);

    // Auto-tag: se il cliente ha ≥3 conferme, aggiungi tag "Affidabile"
    await autoTagClient(supabase, client.id, "confirm");
  }
}

// ─── Auto-tag logic ─────────────────────────────────────────────────

async function autoTagClient(supabase: AdminClient, clientId: string, event: "confirm" | "auto_cancel") {
  const { data: clientData } = await supabase
    .from("clients")
    .select("tags")
    .eq("id", clientId)
    .single();

  const currentTags: string[] = clientData?.tags || [];

  if (event === "confirm") {
    // Count total confirmations for this client
    const { count } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("status", "confirmed");

    if ((count || 0) >= 3 && !currentTags.includes("Affidabile")) {
      const newTags = [...currentTags.filter((t) => t !== "Non conferma"), "Affidabile"];
      await supabase
        .from("clients")
        .update({ tags: newTags, updated_at: new Date().toISOString() })
        .eq("id", clientId);
      console.log(`🏷️ Auto-tag: ${clientId} → Affidabile`);
    }
  } else if (event === "auto_cancel") {
    // Count auto-cancellations (cancelled appointments that had a confirm_request)
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("type", "cancellation");

    if ((count || 0) >= 2 && !currentTags.includes("Non conferma")) {
      const newTags = [...currentTags.filter((t) => t !== "Affidabile"), "Non conferma"];
      await supabase
        .from("clients")
        .update({ tags: newTags, updated_at: new Date().toISOString() })
        .eq("id", clientId);
      console.log(`🏷️ Auto-tag: ${clientId} → Non conferma`);
    }
  }
}

// ─── CAMBIA ORARIO: invia link per riprogrammare ────────────────────

async function handleReschedule(supabase: AdminClient, phone: string, phoneWithPlus: string) {
  const clients = await findClientByPhone(supabase, phone, phoneWithPlus);
  if (clients.length === 0) {
    console.log(`⚠️ CAMBIA ORARIO: nessun cliente trovato per ${phone}`);
    return;
  }

  for (const client of clients) {
    const { data: business } = await supabase
      .from("businesses")
      .select("slug, name")
      .eq("id", client.business_id)
      .single();

    if (!business) continue;

    const bookingLink = `https://barberos.app/book/${business.slug}`;

    await sendReply(
      phoneWithPlus,
      `🔄 ${client.first_name}, per cambiare orario usa questo link:\n\n${bookingLink}\n\nL'appuntamento attuale resta attivo fino a nuova prenotazione. Se vuoi cancellare, rispondi CANCELLA.`,
    );

    console.log(`✅ CAMBIA ORARIO: link inviato a ${client.first_name} (${phone})`);
  }
}

// ─── Messaggio non riconosciuto ─────────────────────────────────────

async function handleUnknown(supabase: AdminClient, phone: string, phoneWithPlus: string, originalMessage: string) {
  const clients = await findClientByPhone(supabase, phone, phoneWithPlus);

  console.log(`ℹ️ Messaggio non riconosciuto da ${phone}: "${originalMessage}"`);

  if (clients.length > 0) {
    await sendReply(
      phoneWithPlus,
      `Non ho capito il messaggio. Rispondi con:\n\n✅ CONFERMA — per confermare l'appuntamento\n❌ CANCELLA — per cancellare\n🔄 CAMBIA ORARIO — per riprogrammare`,
    );
  }
}

// ─── CANCELLA: cancella appuntamento attivo ──────────────────────────

async function handleCancel(supabase: AdminClient, phone: string, phoneWithPlus: string) {
  const clients = await findClientByPhone(supabase, phone, phoneWithPlus);
  if (clients.length === 0) {
    console.log(`⚠️ CANCELLA: nessun cliente trovato per ${phone}`);
    return;
  }

  for (const client of clients) {
    const appointment = await findNextAppointment(supabase, client.id);
    if (!appointment) continue;

    await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointment.id);

    await supabase
      .from("messages")
      .update({ status: "failed" })
      .eq("appointment_id", appointment.id)
      .eq("status", "queued");

    const { data: business } = await supabase
      .from("businesses")
      .select("slug")
      .eq("id", appointment.business_id)
      .single();

    const bookingLink = business ? `https://barberos.app/book/${business.slug}` : "";

    await sendReply(
      phoneWithPlus,
      `❌ Appuntamento cancellato, ${client.first_name}.\n\nPrenota quando vuoi → ${bookingLink}`,
    );

    await supabase.from("messages").insert({
      business_id: appointment.business_id,
      client_id: client.id,
      appointment_id: appointment.id,
      type: "cancellation",
      status: "sent",
      scheduled_for: new Date().toISOString(),
      sent_at: new Date().toISOString(),
    });

    console.log(`✅ CANCELLA: appuntamento ${appointment.id} cancellato per ${client.first_name} (${phone})`);

    await autoTagClient(supabase, client.id, "auto_cancel");
    await notifyWaitlist(supabase, appointment);
  }
}

// ─── SI: conferma prenotazione dalla waitlist ───────────────────────

async function handleWaitlistConfirm(supabase: AdminClient, phone: string, phoneWithPlus: string) {
  const { data: clients } = await supabase
    .from("clients")
    .select("id, business_id, first_name")
    .or(`phone.eq.${phone},phone.eq.${phoneWithPlus},phone.eq.+${phone}`);

  if (!clients || clients.length === 0) {
    console.log(`⚠️ SI: nessun cliente trovato per ${phone}`);
    return;
  }

  for (const client of clients) {
    const { data: waitlistEntries } = await supabase
      .from("waitlist")
      .select("id, business_id, service_id, desired_date, desired_start_time, desired_end_time")
      .eq("client_id", client.id)
      .eq("status", "notified")
      .order("notified_at", { ascending: false })
      .limit(1);

    if (!waitlistEntries || waitlistEntries.length === 0) continue;

    const entry = waitlistEntries[0];

    const { data: staffMembers } = await supabase
      .from("staff")
      .select("id")
      .eq("business_id", entry.business_id)
      .eq("active", true)
      .limit(1);

    const staffId = staffMembers?.[0]?.id;
    if (!staffId) continue;

    const { error: appointmentError } = await supabase.from("appointments").insert({
      business_id: entry.business_id,
      client_id: client.id,
      staff_id: staffId,
      service_id: entry.service_id,
      date: entry.desired_date,
      start_time: entry.desired_start_time,
      end_time: entry.desired_end_time,
      status: "confirmed",
      source: "waitlist",
    });

    if (appointmentError) {
      console.error(`❌ SI: errore creazione appuntamento:`, appointmentError.message);
      continue;
    }

    await supabase
      .from("waitlist")
      .update({ status: "converted" })
      .eq("id", entry.id);

    console.log(`✅ SI: waitlist ${entry.id} convertita per ${client.first_name} (${phone})`);
  }
}

// ─── Notifica Waitlist ──────────────────────────────────────────────

async function notifyWaitlist(
  supabase: AdminClient,
  cancelledAppointment: { business_id: string; date: string; start_time: string; service_id: string },
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

    console.log(`📲 Waitlist: notificato ${client.first_name} (${client.phone}) per slot liberato`);
  }
}
