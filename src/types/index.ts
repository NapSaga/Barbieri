import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type {
  analyticsDaily,
  appointments,
  businesses,
  clients,
  messages,
  messageTemplates,
  services,
  staff,
  waitlist,
} from "@/db/schema";

// Select types (read from DB)
export type Business = InferSelectModel<typeof businesses>;
export type Staff = InferSelectModel<typeof staff>;
export type Service = InferSelectModel<typeof services>;
export type Client = InferSelectModel<typeof clients>;
export type Appointment = InferSelectModel<typeof appointments>;
export type Waitlist = InferSelectModel<typeof waitlist>;
export type Message = InferSelectModel<typeof messages>;
export type MessageTemplate = InferSelectModel<typeof messageTemplates>;
export type AnalyticsDaily = InferSelectModel<typeof analyticsDaily>;

// Insert types (write to DB)
export type NewBusiness = InferInsertModel<typeof businesses>;
export type NewStaff = InferInsertModel<typeof staff>;
export type NewService = InferInsertModel<typeof services>;
export type NewClient = InferInsertModel<typeof clients>;
export type NewAppointment = InferInsertModel<typeof appointments>;
export type NewWaitlist = InferInsertModel<typeof waitlist>;
export type NewMessage = InferInsertModel<typeof messages>;
export type NewMessageTemplate = InferInsertModel<typeof messageTemplates>;

// Appointment status and source types
export type AppointmentStatus = "booked" | "confirmed" | "completed" | "cancelled" | "no_show";
export type AppointmentSource = "online" | "walk_in" | "manual" | "waitlist";
export type WaitlistStatus = "waiting" | "notified" | "converted" | "expired";
export type MessageType =
  | "confirmation"
  | "reminder_24h"
  | "reminder_2h"
  | "cancellation"
  | "review_request"
  | "reactivation"
  | "waitlist_notify";
export type MessageStatus = "queued" | "sent" | "delivered" | "read" | "failed";

// Opening hours shape
export type OpeningHours = Record<string, { open: string; close: string; closed: boolean }>;

// Working hours shape
export type WorkingHours = Record<
  string,
  { start: string; end: string; breakStart?: string; breakEnd?: string; off: boolean }
>;
