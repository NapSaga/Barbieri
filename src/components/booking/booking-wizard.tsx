"use client";

import { useState, useEffect } from "react";
import { Check, ChevronLeft, Clock, Scissors, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { bookAppointment } from "@/actions/appointments";

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  is_combo: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  photo_url: string | null;
  working_hours: Record<
    string,
    { start: string; end: string; breakStart?: string; breakEnd?: string; off: boolean }
  > | null;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  opening_hours: Record<string, { open: string; close: string; closed: boolean }> | null;
}

interface BookingWizardProps {
  business: Business;
  services: Service[];
  staffMembers: StaffMember[];
  closureDates?: string[];
}

type Step = "service" | "staff" | "datetime" | "confirm";

const DAYS_TO_SHOW = 14;
const SLOT_INCREMENT = 15;

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const newM = (total % 60).toString().padStart(2, "0");
  return `${newH}:${newM}`;
}

function getDayName(date: Date): string {
  return date.toLocaleDateString("it-IT", { weekday: "long" });
}

function getDayKey(date: Date): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[date.getDay()];
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("it-IT", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function generateTimeSlots(
  start: string,
  end: string,
  durationMinutes: number,
  breakStart?: string,
  breakEnd?: string,
): string[] {
  const slots: string[] = [];
  let current = start;

  while (current < end) {
    const slotEnd = addMinutesToTime(current, durationMinutes);
    if (slotEnd > end) break;

    // Skip slots that overlap with break
    if (breakStart && breakEnd) {
      if (current < breakEnd && slotEnd > breakStart) {
        current = addMinutesToTime(current, SLOT_INCREMENT);
        continue;
      }
    }

    slots.push(current);
    current = addMinutesToTime(current, SLOT_INCREMENT);
  }

  return slots;
}

export function BookingWizard({ business, services, staffMembers, closureDates = [] }: BookingWizardProps) {
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate next N days
  const dates = Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1); // Start from tomorrow
    return d;
  });

  // Get available time slots for selected date + staff
  const availableSlots =
    selectedDate && selectedStaff && selectedService
      ? getSlots(selectedDate, selectedStaff, selectedService.duration_minutes)
      : [];

  function getSlots(date: Date, staff: StaffMember, duration: number): string[] {
    const dayKey = getDayKey(date);
    const schedule = staff.working_hours?.[dayKey];

    if (!schedule || schedule.off) return [];

    return generateTimeSlots(
      schedule.start,
      schedule.end,
      duration,
      schedule.breakStart,
      schedule.breakEnd,
    );
  }

  function handleSelectService(service: Service) {
    setSelectedService(service);
    setSelectedStaff(null);
    setSelectedDate(null);
    setSelectedTime(null);

    if (staffMembers.length === 1) {
      setSelectedStaff(staffMembers[0]);
      setStep("datetime");
    } else {
      setStep("staff");
    }
  }

  function handleSelectStaff(staff: StaffMember) {
    setSelectedStaff(staff);
    setSelectedDate(null);
    setSelectedTime(null);
    setStep("datetime");
  }

  function handleSelectTime(time: string) {
    setSelectedTime(time);
    setStep("confirm");
  }

  function handleBack() {
    if (step === "staff") setStep("service");
    else if (step === "datetime") {
      if (staffMembers.length === 1) setStep("service");
      else setStep("staff");
    } else if (step === "confirm") setStep("datetime");
  }

  async function handleConfirm() {
    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime) return;
    if (!clientName.trim() || !clientPhone.trim()) {
      setError("Inserisci nome e numero di telefono");
      return;
    }

    setLoading(true);
    setError(null);

    const endTime = addMinutesToTime(selectedTime, selectedService.duration_minutes);

    const result = await bookAppointment({
      businessId: business.id,
      staffId: selectedStaff.id,
      serviceId: selectedService.id,
      date: toISODate(selectedDate),
      startTime: selectedTime,
      endTime,
      clientFirstName: clientName.trim(),
      clientPhone: clientPhone.trim(),
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Prenotazione confermata!</h2>
        <p className="mt-2 text-gray-600">
          {selectedService?.name} con {selectedStaff?.name}
        </p>
        <p className="text-gray-600">
          {selectedDate && formatDate(selectedDate)} alle {selectedTime}
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Riceverai un messaggio WhatsApp con i dettagli.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {(["service", "staff", "datetime", "confirm"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-2 w-8 rounded-full transition-colors",
              step === s ? "bg-blue-600" : i < ["service", "staff", "datetime", "confirm"].indexOf(step) ? "bg-blue-300" : "bg-gray-200",
            )}
          />
        ))}
      </div>

      {/* Back button */}
      {step !== "service" && (
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Indietro
        </button>
      )}

      {/* Step: Select Service */}
      {step === "service" && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Scegli il servizio</h2>
          {services.length === 0 ? (
            <p className="text-gray-500 text-sm">Nessun servizio disponibile al momento.</p>
          ) : (
            services.map((service) => (
              <button
                key={service.id}
                onClick={() => handleSelectService(service)}
                className="flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <Scissors className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{service.name}</p>
                    <p className="text-sm text-gray-500">
                      <Clock className="mr-1 inline h-3 w-3" />
                      {service.duration_minutes} min
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-gray-900">
                  {formatPrice(service.price_cents)}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Step: Select Staff */}
      {step === "staff" && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Scegli il barbiere</h2>
          {staffMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => handleSelectStaff(member)}
              className="flex w-full items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-medium text-gray-900">{member.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Step: Select Date & Time */}
      {step === "datetime" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Scegli data e ora</h2>

          {/* Date selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map((date) => {
              const dayKey = getDayKey(date);
              const schedule = selectedStaff?.working_hours?.[dayKey];
              const isClosed = closureDates.includes(toISODate(date));
              const isOff = !schedule || schedule.off || isClosed;

              return (
                <button
                  key={toISODate(date)}
                  disabled={isOff}
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedTime(null);
                  }}
                  className={cn(
                    "flex shrink-0 flex-col items-center rounded-xl px-4 py-3 text-sm transition-colors",
                    isOff
                      ? "cursor-not-allowed bg-gray-100 text-gray-400"
                      : selectedDate && toISODate(selectedDate) === toISODate(date)
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-900 shadow-sm hover:shadow-md",
                  )}
                >
                  <span className="text-xs uppercase">
                    {date.toLocaleDateString("it-IT", { weekday: "short" })}
                  </span>
                  <span className="text-lg font-bold">{date.getDate()}</span>
                  <span className="text-xs">
                    {date.toLocaleDateString("it-IT", { month: "short" })}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Orari disponibili</h3>
              {availableSlots.length === 0 ? (
                <p className="text-sm text-gray-500">Nessun orario disponibile per questa data.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => handleSelectTime(time)}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        selectedTime === time
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-900 shadow-sm hover:shadow-md",
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && selectedService && selectedStaff && selectedDate && selectedTime && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Conferma prenotazione</h2>

          {/* Summary */}
          <div className="rounded-xl bg-white p-4 shadow-sm space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Servizio</span>
              <span className="font-medium">{selectedService.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Barbiere</span>
              <span className="font-medium">{selectedStaff.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Data</span>
              <span className="font-medium">{formatDate(selectedDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Ora</span>
              <span className="font-medium">
                {selectedTime} - {addMinutesToTime(selectedTime, selectedService.duration_minutes)}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2 mt-2">
              <span className="text-gray-500">Prezzo</span>
              <span className="font-bold text-gray-900">
                {formatPrice(selectedService.price_cents)}
              </span>
            </div>
          </div>

          {/* Client info */}
          <div className="space-y-3">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome
              </label>
              <input
                id="name"
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Il tuo nome"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Numero di telefono
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="+39 333 1234567"
              />
            </div>
          </div>

          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Prenotazione in corso...
              </>
            ) : (
              "Conferma Prenotazione"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
