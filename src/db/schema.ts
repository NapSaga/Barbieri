import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────────────────

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "booked",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
]);

export const appointmentSourceEnum = pgEnum("appointment_source", [
  "online",
  "walk_in",
  "manual",
  "waitlist",
]);

export const waitlistStatusEnum = pgEnum("waitlist_status", [
  "waiting",
  "notified",
  "converted",
  "expired",
]);

export const messageTypeEnum = pgEnum("message_type", [
  "confirmation",
  "confirm_request",
  "confirm_reminder",
  "pre_appointment",
  "cancellation",
  "review_request",
  "reactivation",
  "waitlist_notify",
]);

export const messageStatusEnum = pgEnum("message_status", [
  "queued",
  "sent",
  "delivered",
  "read",
  "failed",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
  "cancelled",
  "trialing",
  "incomplete",
]);

export const referralStatusEnum = pgEnum("referral_status", [
  "pending",
  "converted",
  "rewarded",
  "expired",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "new_booking",
  "cancellation",
  "confirmation",
  "no_show",
  "waitlist_converted",
]);

// ─── Tables ──────────────────────────────────────────────────────────

export const businesses = pgTable("businesses", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  address: text("address"),
  phone: text("phone"),
  logoUrl: text("logo_url"),
  googleReviewLink: text("google_review_link"),
  openingHours:
    jsonb("opening_hours").$type<
      Record<string, { open: string; close: string; closed: boolean }>
    >(),
  welcomeText: text("welcome_text"),
  coverImageUrl: text("cover_image_url"),
  fontPreset: text("font_preset"),
  brandColors: jsonb("brand_colors").$type<{ primary: string; secondary: string }>(),
  timezone: text("timezone").default("Europe/Rome").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default("trialing"),
  subscriptionPlan: text("subscription_plan"),
  dormantThresholdDays: integer("dormant_threshold_days").default(28),
  noShowThreshold: integer("no_show_threshold").default(2),
  autoCompleteDelayMinutes: integer("auto_complete_delay_minutes").default(20),
  setupFeePaid: boolean("setup_fee_paid").default(false).notNull(),
  referralCode: text("referral_code").unique(),
  // biome-ignore lint/suspicious/noExplicitAny: self-referencing FK requires any for circular reference
  referredBy: uuid("referred_by").references((): any => businesses.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const staff = pgTable(
  "staff",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .references(() => businesses.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    photoUrl: text("photo_url"),
    workingHours:
      jsonb("working_hours").$type<
        Record<
          string,
          { start: string; end: string; breakStart?: string; breakEnd?: string; off: boolean }
        >
      >(),
    active: boolean("active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("staff_business_id_idx").on(table.businessId)],
);

export const services = pgTable(
  "services",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .references(() => businesses.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    priceCents: integer("price_cents").notNull(),
    isCombo: boolean("is_combo").default(false).notNull(),
    comboServiceIds: uuid("combo_service_ids").array(),
    displayOrder: integer("display_order").default(0).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("services_business_id_idx").on(table.businessId)],
);

export const staffServices = pgTable(
  "staff_services",
  {
    staffId: uuid("staff_id")
      .references(() => staff.id, { onDelete: "cascade" })
      .notNull(),
    serviceId: uuid("service_id")
      .references(() => services.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [uniqueIndex("staff_services_pk").on(table.staffId, table.serviceId)],
);

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .references(() => businesses.id, { onDelete: "cascade" })
      .notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    phone: text("phone").notNull(),
    email: text("email"),
    notes: text("notes"),
    tags: text("tags").array(),
    noShowCount: integer("no_show_count").default(0).notNull(),
    totalVisits: integer("total_visits").default(0).notNull(),
    lastVisitAt: timestamp("last_visit_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("clients_business_phone_idx").on(table.businessId, table.phone),
    index("clients_business_id_idx").on(table.businessId),
  ],
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .references(() => businesses.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    staffId: uuid("staff_id").references(() => staff.id, { onDelete: "set null" }),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    date: date("date").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    status: appointmentStatusEnum("status").default("booked").notNull(),
    source: appointmentSourceEnum("source").default("online").notNull(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("appointments_business_date_idx").on(table.businessId, table.date),
    index("appointments_staff_date_idx").on(table.staffId, table.date),
  ],
);

export const waitlist = pgTable(
  "waitlist",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .references(() => businesses.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" })
      .notNull(),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    desiredDate: date("desired_date").notNull(),
    desiredStartTime: time("desired_start_time").notNull(),
    desiredEndTime: time("desired_end_time").notNull(),
    status: waitlistStatusEnum("status").default("waiting").notNull(),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("waitlist_business_date_idx").on(table.businessId, table.desiredDate)],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .references(() => businesses.id, { onDelete: "cascade" })
      .notNull(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id, {
      onDelete: "set null",
    }),
    type: messageTypeEnum("type").notNull(),
    whatsappMessageId: text("whatsapp_message_id"),
    status: messageStatusEnum("status").default("queued").notNull(),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("messages_scheduled_status_idx").on(table.scheduledFor, table.status),
    index("messages_business_id_idx").on(table.businessId),
  ],
);

export const messageTemplates = pgTable(
  "message_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .references(() => businesses.id, { onDelete: "cascade" })
      .notNull(),
    type: messageTypeEnum("type").notNull(),
    bodyTemplate: text("body_template").notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("message_templates_business_type_idx").on(table.businessId, table.type)],
);

export const analyticsDaily = pgTable(
  "analytics_daily",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .references(() => businesses.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    totalRevenueCents: integer("total_revenue_cents").default(0).notNull(),
    appointmentsCompleted: integer("appointments_completed").default(0).notNull(),
    appointmentsCancelled: integer("appointments_cancelled").default(0).notNull(),
    appointmentsNoShow: integer("appointments_no_show").default(0).notNull(),
    newClients: integer("new_clients").default(0).notNull(),
    returningClients: integer("returning_clients").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("analytics_daily_business_date_idx").on(table.businessId, table.date)],
);

export const businessClosures = pgTable(
  "business_closures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .references(() => businesses.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("business_closures_business_date_idx").on(table.businessId, table.date),
    index("business_closures_business_id_idx").on(table.businessId),
  ],
);

export const referrals = pgTable(
  "referrals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    referrerBusinessId: uuid("referrer_business_id")
      .references(() => businesses.id, { onDelete: "cascade" })
      .notNull(),
    referredBusinessId: uuid("referred_business_id")
      .references(() => businesses.id, { onDelete: "cascade" })
      .notNull(),
    status: referralStatusEnum("status").default("pending").notNull(),
    rewardAmountCents: integer("reward_amount_cents").default(5000).notNull(),
    stripeCreditId: text("stripe_credit_id"),
    convertedAt: timestamp("converted_at", { withTimezone: true }),
    rewardedAt: timestamp("rewarded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("referrals_unique_pair").on(table.referrerBusinessId, table.referredBusinessId),
    index("referrals_referrer_idx").on(table.referrerBusinessId),
    index("referrals_referred_idx").on(table.referredBusinessId),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .references(() => businesses.id, { onDelete: "cascade" })
      .notNull(),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    appointmentId: uuid("appointment_id").references(() => appointments.id, {
      onDelete: "set null",
    }),
    read: boolean("read").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notifications_business_id_idx").on(table.businessId),
    index("notifications_business_read_idx").on(table.businessId, table.read),
  ],
);

// ─── Relations ───────────────────────────────────────────────────────

export const businessesRelations = relations(businesses, ({ many }) => ({
  staff: many(staff),
  services: many(services),
  clients: many(clients),
  appointments: many(appointments),
  messages: many(messages),
  messageTemplates: many(messageTemplates),
  analyticsDaily: many(analyticsDaily),
  waitlist: many(waitlist),
  closures: many(businessClosures),
  referralsMade: many(referrals, { relationName: "referrer" }),
  referralsReceived: many(referrals, { relationName: "referred" }),
  notifications: many(notifications),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  business: one(businesses, {
    fields: [staff.businessId],
    references: [businesses.id],
  }),
  staffServices: many(staffServices),
  appointments: many(appointments),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  business: one(businesses, {
    fields: [services.businessId],
    references: [businesses.id],
  }),
  staffServices: many(staffServices),
  appointments: many(appointments),
}));

export const staffServicesRelations = relations(staffServices, ({ one }) => ({
  staff: one(staff, {
    fields: [staffServices.staffId],
    references: [staff.id],
  }),
  service: one(services, {
    fields: [staffServices.serviceId],
    references: [services.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  business: one(businesses, {
    fields: [clients.businessId],
    references: [businesses.id],
  }),
  appointments: many(appointments),
  messages: many(messages),
  waitlist: many(waitlist),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  business: one(businesses, {
    fields: [appointments.businessId],
    references: [businesses.id],
  }),
  client: one(clients, {
    fields: [appointments.clientId],
    references: [clients.id],
  }),
  staff: one(staff, {
    fields: [appointments.staffId],
    references: [staff.id],
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
  messages: many(messages),
}));

export const waitlistRelations = relations(waitlist, ({ one }) => ({
  business: one(businesses, {
    fields: [waitlist.businessId],
    references: [businesses.id],
  }),
  client: one(clients, {
    fields: [waitlist.clientId],
    references: [clients.id],
  }),
  service: one(services, {
    fields: [waitlist.serviceId],
    references: [services.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  business: one(businesses, {
    fields: [messages.businessId],
    references: [businesses.id],
  }),
  client: one(clients, {
    fields: [messages.clientId],
    references: [clients.id],
  }),
  appointment: one(appointments, {
    fields: [messages.appointmentId],
    references: [appointments.id],
  }),
}));

export const messageTemplatesRelations = relations(messageTemplates, ({ one }) => ({
  business: one(businesses, {
    fields: [messageTemplates.businessId],
    references: [businesses.id],
  }),
}));

export const analyticsDailyRelations = relations(analyticsDaily, ({ one }) => ({
  business: one(businesses, {
    fields: [analyticsDaily.businessId],
    references: [businesses.id],
  }),
}));

export const businessClosuresRelations = relations(businessClosures, ({ one }) => ({
  business: one(businesses, {
    fields: [businessClosures.businessId],
    references: [businesses.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(businesses, {
    fields: [referrals.referrerBusinessId],
    references: [businesses.id],
    relationName: "referrer",
  }),
  referred: one(businesses, {
    fields: [referrals.referredBusinessId],
    references: [businesses.id],
    relationName: "referred",
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  business: one(businesses, {
    fields: [notifications.businessId],
    references: [businesses.id],
  }),
  appointment: one(appointments, {
    fields: [notifications.appointmentId],
    references: [appointments.id],
  }),
}));
