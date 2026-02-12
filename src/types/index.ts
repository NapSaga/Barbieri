import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type {
  analyticsDaily,
  appointments,
  businesses,
  clients,
  messages,
  messageTemplates,
  notifications,
  referrals,
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
export type Referral = InferSelectModel<typeof referrals>;
export type Notification = InferSelectModel<typeof notifications>;

// Insert types (write to DB)
export type NewBusiness = InferInsertModel<typeof businesses>;
export type NewStaff = InferInsertModel<typeof staff>;
export type NewService = InferInsertModel<typeof services>;
export type NewClient = InferInsertModel<typeof clients>;
export type NewAppointment = InferInsertModel<typeof appointments>;
export type NewWaitlist = InferInsertModel<typeof waitlist>;
export type NewMessage = InferInsertModel<typeof messages>;
export type NewMessageTemplate = InferInsertModel<typeof messageTemplates>;
export type NewReferral = InferInsertModel<typeof referrals>;
export type NewNotification = InferInsertModel<typeof notifications>;

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
export type ReferralStatus = "pending" | "converted" | "rewarded" | "expired";
export type NotificationType =
  | "new_booking"
  | "cancellation"
  | "confirmation"
  | "no_show"
  | "waitlist_converted";

// Waitlist entry (joined shape used by UI)
export interface WaitlistEntry {
  id: string;
  client: { id: string; first_name: string; last_name: string | null; phone: string } | null;
  service: { id: string; name: string } | null;
  desired_date: string;
  desired_start_time: string;
  desired_end_time: string;
  status: string;
  notified_at: string | null;
  created_at: string;
}

// Calendar appointment (joined shape used by UI)
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

// Analytics types (joined shapes used by UI)
export interface AnalyticsDayRow {
  date: string;
  total_revenue_cents: number;
  appointments_completed: number;
  appointments_cancelled: number;
  appointments_no_show: number;
  new_clients: number;
  returning_clients: number;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalAppointments: number;
  noShowRate: number;
  newClients: number;
  returningClients: number;
  revenueDelta: number | null;
  appointmentsDelta: number | null;
  noShowDelta: number | null;
  newClientsDelta: number | null;
}

export interface TopService {
  name: string;
  count: number;
  revenue_cents: number;
}

// Referral types (joined shapes used by UI)
export interface ReferralInfo {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  convertedReferrals: number;
  totalCreditsEarned: number;
  pendingCredits: number;
}

export interface ReferralEntry {
  id: string;
  referredBusinessName: string;
  status: string;
  rewardAmountCents: number;
  createdAt: string;
  convertedAt: string | null;
  rewardedAt: string | null;
}

// Notification entry (shape used by UI)
export interface NotificationEntry {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  appointment_id: string | null;
  read: boolean;
  created_at: string;
}

// Closure entry (joined shape used by UI)
export interface ClosureEntry {
  id: string;
  date: string;
  reason: string | null;
  created_at: string;
}

// Subscription info
export interface SubscriptionInfo {
  status: string;
  planId: string | null;
  planName: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
}

// Services
export const ALLOWED_DURATIONS = [15, 30, 45, 60, 75, 90, 105, 120] as const;

// Opening hours shape
export type OpeningHours = Record<string, { open: string; close: string; closed: boolean }>;

// Working hours shape
export type WorkingHours = Record<
  string,
  { start: string; end: string; breakStart?: string; breakEnd?: string; off: boolean }
>;
