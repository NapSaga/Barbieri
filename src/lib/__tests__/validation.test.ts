import { describe, expect, it } from "vitest";
import { z } from "zod/v4";

/**
 * Re-declare the same Zod schemas used in server actions.
 * These are pure validation schemas — we test them here to ensure
 * correctness without spinning up the full server action context.
 */

// From src/actions/appointments.ts
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

// From src/actions/services.ts
const serviceFormSchema = z.object({
  name: z.string().min(1, "Nome servizio obbligatorio"),
  duration_minutes: z.string().regex(/^\d+$/, "Durata non valida"),
  price: z.string().regex(/^\d+([.,]\d{1,2})?$/, "Prezzo non valido"),
});

// From src/actions/clients.ts
const createClientSchema = z.object({
  first_name: z.string().min(1, "Nome obbligatorio"),
  last_name: z.string(),
  phone: z.string().min(1, "Telefono obbligatorio"),
  email: z.string(),
  notes: z.string(),
});

// ─── dateSchema ─────────────────────────────────────────────────────

describe("dateSchema", () => {
  it("accepts YYYY-MM-DD format", () => {
    expect(dateSchema.safeParse("2025-01-15").success).toBe(true);
  });

  it("rejects DD/MM/YYYY", () => {
    expect(dateSchema.safeParse("15/01/2025").success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(dateSchema.safeParse("").success).toBe(false);
  });

  it("rejects partial date", () => {
    expect(dateSchema.safeParse("2025-01").success).toBe(false);
  });
});

// ─── timeSchema ─────────────────────────────────────────────────────

describe("timeSchema", () => {
  it("accepts HH:MM format", () => {
    expect(timeSchema.safeParse("09:30").success).toBe(true);
  });

  it("accepts HH:MM:SS format", () => {
    expect(timeSchema.safeParse("09:30:00").success).toBe(true);
  });

  it("rejects single-digit hour", () => {
    expect(timeSchema.safeParse("9:30").success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(timeSchema.safeParse("").success).toBe(false);
  });
});

// ─── uuidSchema ─────────────────────────────────────────────────────

describe("uuidSchema", () => {
  it("accepts valid UUID v4", () => {
    expect(uuidSchema.safeParse("550e8400-e29b-41d4-a716-446655440000").success).toBe(true);
  });

  it("rejects non-UUID string", () => {
    expect(uuidSchema.safeParse("not-a-uuid").success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(uuidSchema.safeParse("").success).toBe(false);
  });
});

// ─── walkInSchema ───────────────────────────────────────────────────

describe("walkInSchema", () => {
  const validWalkIn = {
    client_name: "Mario",
    client_phone: "+39 333 1234567",
    staff_id: "550e8400-e29b-41d4-a716-446655440000",
    service_id: "660e8400-e29b-41d4-a716-446655440000",
    date: "2025-01-15",
    start_time: "09:00",
    end_time: "09:30",
  };

  it("accepts valid walk-in data", () => {
    expect(walkInSchema.safeParse(validWalkIn).success).toBe(true);
  });

  it("rejects missing client name", () => {
    expect(walkInSchema.safeParse({ ...validWalkIn, client_name: "" }).success).toBe(false);
  });

  it("rejects invalid staff_id", () => {
    expect(walkInSchema.safeParse({ ...validWalkIn, staff_id: "bad-id" }).success).toBe(false);
  });

  it("rejects invalid date format", () => {
    expect(walkInSchema.safeParse({ ...validWalkIn, date: "15-01-2025" }).success).toBe(false);
  });
});

// ─── bookAppointmentSchema ──────────────────────────────────────────

describe("bookAppointmentSchema", () => {
  const validBooking = {
    businessId: "550e8400-e29b-41d4-a716-446655440000",
    staffId: "660e8400-e29b-41d4-a716-446655440000",
    serviceId: "770e8400-e29b-41d4-a716-446655440000",
    date: "2025-01-15",
    startTime: "09:00",
    endTime: "09:30",
    clientFirstName: "Mario",
    clientPhone: "+39 333 1234567",
  };

  it("accepts valid booking data", () => {
    expect(bookAppointmentSchema.safeParse(validBooking).success).toBe(true);
  });

  it("accepts optional clientLastName", () => {
    expect(
      bookAppointmentSchema.safeParse({ ...validBooking, clientLastName: "Rossi" }).success,
    ).toBe(true);
  });

  it("accepts missing clientLastName", () => {
    expect(bookAppointmentSchema.safeParse(validBooking).success).toBe(true);
  });

  it("rejects missing clientFirstName", () => {
    expect(bookAppointmentSchema.safeParse({ ...validBooking, clientFirstName: "" }).success).toBe(
      false,
    );
  });

  it("rejects invalid businessId", () => {
    expect(
      bookAppointmentSchema.safeParse({ ...validBooking, businessId: "not-uuid" }).success,
    ).toBe(false);
  });
});

// ─── serviceFormSchema ──────────────────────────────────────────────

describe("serviceFormSchema", () => {
  it("accepts valid service data with dot decimal", () => {
    expect(
      serviceFormSchema.safeParse({ name: "Taglio", duration_minutes: "30", price: "15.50" })
        .success,
    ).toBe(true);
  });

  it("accepts valid service data with comma decimal (EU format)", () => {
    expect(
      serviceFormSchema.safeParse({ name: "Taglio", duration_minutes: "30", price: "15,50" })
        .success,
    ).toBe(true);
  });

  it("accepts whole number price", () => {
    expect(
      serviceFormSchema.safeParse({ name: "Barba", duration_minutes: "15", price: "10" }).success,
    ).toBe(true);
  });

  it("rejects empty service name", () => {
    expect(
      serviceFormSchema.safeParse({ name: "", duration_minutes: "30", price: "15.00" }).success,
    ).toBe(false);
  });

  it("rejects non-numeric duration", () => {
    expect(
      serviceFormSchema.safeParse({ name: "Taglio", duration_minutes: "trenta", price: "15.00" })
        .success,
    ).toBe(false);
  });

  it("rejects invalid price format", () => {
    expect(
      serviceFormSchema.safeParse({ name: "Taglio", duration_minutes: "30", price: "abc" }).success,
    ).toBe(false);
  });
});

// ─── createClientSchema ─────────────────────────────────────────────

describe("createClientSchema", () => {
  const validClient = {
    first_name: "Mario",
    last_name: "Rossi",
    phone: "+39 333 1234567",
    email: "mario@email.com",
    notes: "",
  };

  it("accepts valid client data", () => {
    expect(createClientSchema.safeParse(validClient).success).toBe(true);
  });

  it("rejects empty first name", () => {
    expect(createClientSchema.safeParse({ ...validClient, first_name: "" }).success).toBe(false);
  });

  it("rejects empty phone", () => {
    expect(createClientSchema.safeParse({ ...validClient, phone: "" }).success).toBe(false);
  });

  it("accepts empty email and notes", () => {
    expect(createClientSchema.safeParse({ ...validClient, email: "", notes: "" }).success).toBe(
      true,
    );
  });
});
