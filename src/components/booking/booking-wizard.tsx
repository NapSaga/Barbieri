"use client";

import { Check, ChevronLeft, Clock, ClockAlert, Loader2, Scissors, User } from "lucide-react";
import { useEffect, useState } from "react";
import { bookAppointment, getStaffBookedSlots } from "@/actions/appointments";
import { addToWaitlistPublic } from "@/actions/waitlist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addMinutesToTime, formatPrice } from "@/lib/time-utils";
import { cn } from "@/lib/utils";

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

interface StaffServiceLink {
  staffId: string;
  serviceId: string;
}

interface BookingWizardProps {
  business: Business;
  services: Service[];
  staffMembers: StaffMember[];
  staffServiceLinks?: StaffServiceLink[];
  closureDates?: string[];
  previewMode?: boolean;
}

type Step = "service" | "staff" | "datetime" | "confirm";

const DAYS_TO_SHOW = 14;
const SLOT_INCREMENT = 15;

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

export function BookingWizard({
  business,
  services,
  staffMembers,
  staffServiceLinks = [],
  closureDates = [],
  previewMode = false,
}: BookingWizardProps) {
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientLastName, setClientLastName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<{ startTime: string; endTime: string }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [waitlistMode, setWaitlistMode] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistLastName, setWaitlistLastName] = useState("");
  const [waitlistPhone, setWaitlistPhone] = useState("");
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  useEffect(() => {
    if (previewMode || !selectedDate || !selectedStaff) {
      setBookedSlots([]);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    getStaffBookedSlots(business.id, selectedStaff.id, toISODate(selectedDate)).then((slots) => {
      if (!cancelled) {
        setBookedSlots(slots);
        setSlotsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedDate, selectedStaff, business.id, previewMode]);

  const dates = Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  function getSlots(
    date: Date,
    staff: StaffMember,
    duration: number,
    booked: { startTime: string; endTime: string }[],
  ): string[] {
    const dayKey = getDayKey(date);
    const staffSchedule = staff.working_hours?.[dayKey];
    const businessDay = business.opening_hours?.[dayKey];

    if (!staffSchedule || staffSchedule.off) return [];
    if (businessDay?.closed) return [];

    const effectiveStart = businessDay
      ? staffSchedule.start > businessDay.open
        ? staffSchedule.start
        : businessDay.open
      : staffSchedule.start;
    const effectiveEnd = businessDay
      ? staffSchedule.end < businessDay.close
        ? staffSchedule.end
        : businessDay.close
      : staffSchedule.end;

    if (effectiveStart >= effectiveEnd) return [];

    const allSlots = generateTimeSlots(
      effectiveStart,
      effectiveEnd,
      duration,
      staffSchedule.breakStart,
      staffSchedule.breakEnd,
    );

    // Filter out booked slots and past slots (for today)
    const now = new Date();
    const isToday = toISODate(date) === toISODate(now);
    const currentTime = isToday
      ? `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
      : null;

    return allSlots.filter((slotStart) => {
      if (currentTime && slotStart <= currentTime) return false;
      const slotEnd = addMinutesToTime(slotStart, duration);
      return !booked.some((appt) => slotStart < appt.endTime && slotEnd > appt.startTime);
    });
  }

  const availableSlots =
    selectedDate && selectedStaff && selectedService
      ? getSlots(selectedDate, selectedStaff, selectedService.duration_minutes, bookedSlots)
      : [];

  // Filter staff by service: if any staff has associations, only show matching staff
  // If no staff_services rows exist at all, show everyone (backwards compatible)
  function getStaffForService(serviceId: string): StaffMember[] {
    if (staffServiceLinks.length === 0) return staffMembers;
    const linksForService = staffServiceLinks.filter((l) => l.serviceId === serviceId);
    const staffIds = new Set(linksForService.map((l) => l.staffId));
    return staffMembers.filter((s) => staffIds.has(s.id));
  }

  // Filter services: if staff_services links exist, only show services that have at least one staff member
  const bookableServices =
    staffServiceLinks.length === 0
      ? services
      : services.filter((s) => staffServiceLinks.some((l) => l.serviceId === s.id));

  function handleSelectService(service: Service) {
    setSelectedService(service);
    setSelectedStaff(null);
    setSelectedDate(null);
    setSelectedTime(null);

    const eligible = getStaffForService(service.id);
    if (eligible.length === 1) {
      setSelectedStaff(eligible[0]);
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
      const eligible = selectedService ? getStaffForService(selectedService.id) : staffMembers;
      if (eligible.length === 1) setStep("service");
      else setStep("staff");
    } else if (step === "confirm") setStep("datetime");
  }

  async function handleConfirm() {
    if (previewMode) return;
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
      clientLastName: clientLastName.trim() || undefined,
      clientPhone: clientPhone.trim(),
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  }

  if (waitlistSuccess) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
          <ClockAlert className="h-8 w-8 text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Sei in lista d&apos;attesa!</h2>
        <p className="mt-2 text-muted-foreground">
          {selectedService?.name} — {selectedDate && formatDate(selectedDate)}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Ti avviseremo via WhatsApp se si libera un posto.
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
          <Check className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Prenotazione confermata!</h2>
        <p className="mt-2 text-muted-foreground">
          {selectedService?.name} con {selectedStaff?.name}
        </p>
        <p className="text-muted-foreground">
          {selectedDate && formatDate(selectedDate)} alle {selectedTime}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
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
              step === s
                ? "bg-primary"
                : i < ["service", "staff", "datetime", "confirm"].indexOf(step)
                  ? "bg-muted-foreground"
                  : "bg-secondary",
            )}
          />
        ))}
      </div>

      {/* Back button */}
      {step !== "service" && (
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Indietro
        </button>
      )}

      {/* Step: Select Service */}
      {step === "service" && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Scegli il servizio</h2>
          {bookableServices.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nessun servizio disponibile al momento.</p>
          ) : (
            bookableServices.map((service) => (
              <button
                type="button"
                key={service.id}
                onClick={() => handleSelectService(service)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-input hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <Scissors className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">{service.name}</p>
                    <p className="text-sm text-muted-foreground">
                      <Clock className="mr-1 inline h-3 w-3" />
                      {service.duration_minutes} min
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-foreground">
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
          <h2 className="text-lg font-semibold text-foreground">Scegli il barbiere</h2>
          {(selectedService ? getStaffForService(selectedService.id) : staffMembers).map(
            (member) => (
              <button
                type="button"
                key={member.id}
                onClick={() => handleSelectStaff(member)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-input hover:bg-accent"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="font-medium text-foreground">{member.name}</span>
              </button>
            ),
          )}
        </div>
      )}

      {/* Step: Select Date & Time */}
      {step === "datetime" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Scegli data e ora</h2>

          {/* Date selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map((date) => {
              const dayKey = getDayKey(date);
              const schedule = selectedStaff?.working_hours?.[dayKey];
              const isClosed = closureDates.includes(toISODate(date));
              const businessDay = business.opening_hours?.[dayKey];
              const isBusinessClosed = businessDay?.closed === true;
              const isOff = !schedule || schedule.off || isClosed || isBusinessClosed;

              return (
                <button
                  type="button"
                  key={toISODate(date)}
                  disabled={isOff}
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedTime(null);
                  }}
                  className={cn(
                    "flex shrink-0 flex-col items-center rounded-xl px-4 py-3 text-sm transition-colors",
                    isOff
                      ? "bg-muted text-muted-foreground/40 cursor-not-allowed"
                      : selectedDate && toISODate(selectedDate) === toISODate(date)
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card text-foreground hover:border-input hover:bg-accent",
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
              <h3 className="text-sm font-medium text-foreground">Orari disponibili</h3>
              {slotsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Nessun orario disponibile per questa data.
                  </p>
                  {!previewMode && !waitlistMode && (
                    <button
                      type="button"
                      onClick={() => setWaitlistMode(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-sm font-medium text-foreground transition-colors hover:border-input hover:bg-accent"
                    >
                      <ClockAlert className="h-4 w-4 text-muted-foreground" />
                      Avvisami se si libera un posto
                    </button>
                  )}
                  {waitlistMode && (
                    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                      <h4 className="text-sm font-semibold text-foreground">Lista d&apos;attesa</h4>
                      <p className="text-xs text-muted-foreground">
                        Inserisci i tuoi dati e ti avviseremo via WhatsApp se si libera un posto.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="text"
                          value={waitlistName}
                          onChange={(e) => setWaitlistName(e.target.value)}
                          placeholder="Nome *"
                        />
                        <Input
                          type="text"
                          value={waitlistLastName}
                          onChange={(e) => setWaitlistLastName(e.target.value)}
                          placeholder="Cognome"
                        />
                      </div>
                      <Input
                        type="tel"
                        value={waitlistPhone}
                        onChange={(e) => setWaitlistPhone(e.target.value)}
                        placeholder="Telefono *"
                      />
                      {waitlistError && <p className="text-xs text-destructive">{waitlistError}</p>}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setWaitlistMode(false);
                            setWaitlistError(null);
                          }}
                        >
                          Annulla
                        </Button>
                        <Button
                          size="sm"
                          disabled={waitlistLoading}
                          onClick={async () => {
                            if (!waitlistName.trim() || !waitlistPhone.trim()) {
                              setWaitlistError("Nome e telefono sono obbligatori");
                              return;
                            }
                            if (!selectedService || !selectedDate) return;
                            setWaitlistLoading(true);
                            setWaitlistError(null);
                            const result = await addToWaitlistPublic({
                              businessId: business.id,
                              serviceId: selectedService.id,
                              clientFirstName: waitlistName.trim(),
                              clientLastName: waitlistLastName.trim() || undefined,
                              clientPhone: waitlistPhone.trim(),
                              desiredDate: toISODate(selectedDate),
                            });
                            setWaitlistLoading(false);
                            if (result.error) {
                              setWaitlistError(result.error);
                            } else {
                              setWaitlistSuccess(true);
                            }
                          }}
                        >
                          {waitlistLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                          Iscrivimi
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map((time) => (
                    <button
                      type="button"
                      key={time}
                      onClick={() => handleSelectTime(time)}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        selectedTime === time
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-card text-foreground hover:border-input hover:bg-accent",
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
          <h2 className="text-lg font-semibold text-foreground">Conferma prenotazione</h2>

          {/* Summary */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Servizio</span>
              <span className="font-medium">{selectedService.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Barbiere</span>
              <span className="font-medium">{selectedStaff.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Data</span>
              <span className="font-medium">{formatDate(selectedDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ora</span>
              <span className="font-medium">
                {selectedTime} - {addMinutesToTime(selectedTime, selectedService.duration_minutes)}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
              <span className="text-muted-foreground">Prezzo</span>
              <span className="font-bold text-foreground">
                {formatPrice(selectedService.price_cents)}
              </span>
            </div>
          </div>

          {/* Client info */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Mario"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Cognome</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={clientLastName}
                  onChange={(e) => setClientLastName(e.target.value)}
                  placeholder="Rossi"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Numero di telefono</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+39 333 1234567"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <Button
            onClick={handleConfirm}
            disabled={loading || previewMode}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Prenotazione in corso...
              </>
            ) : (
              "Conferma Prenotazione"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
