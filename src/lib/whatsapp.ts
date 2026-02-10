/**
 * WhatsApp Service — Twilio Integration
 *
 * Modalità:
 * - Se le variabili TWILIO_* sono configurate → invia messaggi reali via Twilio WhatsApp API
 * - Altrimenti → mock con console.log (sviluppo locale)
 *
 * Variabili d'ambiente necessarie per produzione:
 *   TWILIO_ACCOUNT_SID   — dal dashboard Twilio
 *   TWILIO_AUTH_TOKEN     — dal dashboard Twilio
 *   TWILIO_WHATSAPP_FROM  — formato "whatsapp:+14155238886" (numero Twilio WhatsApp)
 */

import twilio from "twilio";

// ─── Types ──────────────────────────────────────────────────────────

export interface WhatsAppMessage {
  to: string;
  body: string;
  templateName?: string;
}

export interface WhatsAppResult {
  success: boolean;
  messageId: string;
  mode: "live" | "mock";
}

// ─── Configuration ──────────────────────────────────────────────────

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (accountSid && authToken && from) {
    return { accountSid, authToken, from, enabled: true as const };
  }
  return { accountSid: "", authToken: "", from: "", enabled: false as const };
}

export function isWhatsAppEnabled(): boolean {
  return getTwilioConfig().enabled;
}

// ─── Send Message ───────────────────────────────────────────────────

export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<WhatsAppResult> {
  const config = getTwilioConfig();

  if (!config.enabled) {
    return sendMock(message);
  }

  return sendViaTwilio(message, config);
}

// ─── Twilio Implementation ──────────────────────────────────────────

async function sendViaTwilio(
  message: WhatsAppMessage,
  config: { accountSid: string; authToken: string; from: string },
): Promise<WhatsAppResult> {
  const client = twilio(config.accountSid, config.authToken);

  // Normalizza il numero: assicurati che abbia il prefisso whatsapp:
  const toNumber = message.to.startsWith("whatsapp:")
    ? message.to
    : `whatsapp:${message.to.startsWith("+") ? message.to : `+${message.to}`}`;

  try {
    const result = await client.messages.create({
      from: config.from,
      to: toNumber,
      body: message.body,
    });

    console.log(`✅ WhatsApp sent to ${message.to} — SID: ${result.sid}`);

    return {
      success: true,
      messageId: result.sid,
      mode: "live",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown Twilio error";
    console.error(`❌ WhatsApp failed to ${message.to}: ${errorMessage}`);

    return {
      success: false,
      messageId: "",
      mode: "live",
    };
  }
}

// ─── Mock Implementation ────────────────────────────────────────────

async function sendMock(message: WhatsAppMessage): Promise<WhatsAppResult> {
  const messageId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📱 WhatsApp Message (MOCK — Twilio non configurato)");
  console.log(`   To: ${message.to}`);
  console.log(`   Body: ${message.body}`);
  if (message.templateName) {
    console.log(`   Template: ${message.templateName}`);
  }
  console.log(`   ID: ${messageId}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  return { success: true, messageId, mode: "mock" };
}

// ─── Template Rendering ─────────────────────────────────────────────

export function renderTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replaceAll(`{{${key}}}`, value);
  }
  return rendered;
}
