"use client";

import { Loader2, X } from "lucide-react";
import { useState, useTransition } from "react";
import { addWalkIn } from "@/actions/appointments";
import { addMinutesToTime, formatPrice } from "@/lib/time-utils";

interface StaffMember {
  id: string;
  name: string;
  photo_url?: string | null;
  working_hours?: Record<string, unknown> | null;
}

interface ServiceItem {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
}

interface ExistingAppointment {
  start_time: string;
  end_time: string;
  status: string;
  staff: { id: string; name?: string } | null;
}

interface WalkInDialogProps {
  open: boolean;
  onClose: () => void;
  date: string;
  staffMembers: StaffMember[];
  services: ServiceItem[];
  appointments: ExistingAppointment[];
  onSuccess: () => void;
}

export function WalkInDialog({
  open,
  onClose,
  date,
  staffMembers,
  services,
  appointments,
  onSuccess,
}: WalkInDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(Math.floor(now.getMinutes() / 15) * 15).padStart(2, "0");
    return `${h}:${m}`;
  });

  const [selectedStaffId, setSelectedStaffId] = useState("");

  if (!open) return null;

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const endTime = selectedService
    ? addMinutesToTime(startTime, selectedService.duration_minutes)
    : startTime;

  const hasConflict =
    selectedStaffId &&
    selectedService &&
    appointments.some(
      (a) =>
        a.staff?.id === selectedStaffId &&
        a.status !== "cancelled" &&
        a.start_time.slice(0, 5) < endTime &&
        a.end_time.slice(0, 5) > startTime,
    );

  function handleSubmit(formData: FormData) {
    if (!selectedService) {
      setError("Seleziona un servizio");
      return;
    }

    formData.set("date", date);
    formData.set("start_time", startTime);
    formData.set("end_time", endTime);

    setError(null);
    startTransition(async () => {
      const result = await addWalkIn(formData);
      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        tabIndex={-1}
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-card border border-border p-6 shadow-xl mx-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Aggiungi Walk-in</h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={handleSubmit} className="space-y-4">
          {/* Client info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="walkin-client-name"
                className="block text-sm font-medium text-foreground"
              >
                Nome cliente
              </label>
              <input
                id="walkin-client-name"
                name="client_name"
                required
                className="mt-1 block w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Mario"
              />
            </div>
            <div>
              <label
                htmlFor="walkin-client-phone"
                className="block text-sm font-medium text-foreground"
              >
                Telefono
              </label>
              <input
                id="walkin-client-phone"
                name="client_phone"
                type="tel"
                required
                className="mt-1 block w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="+39 333..."
              />
            </div>
          </div>

          {/* Service */}
          <div>
            <label htmlFor="walkin-service" className="block text-sm font-medium text-foreground">
              Servizio
            </label>
            <select
              id="walkin-service"
              name="service_id"
              required
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Seleziona servizio...</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.duration_minutes} min — {formatPrice(s.price_cents)}
                </option>
              ))}
            </select>
          </div>

          {/* Staff */}
          <div>
            <label htmlFor="walkin-staff" className="block text-sm font-medium text-foreground">
              Barbiere
            </label>
            <select
              id="walkin-staff"
              name="staff_id"
              required
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Seleziona barbiere...</option>
              {staffMembers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="walkin-start-time"
                className="block text-sm font-medium text-foreground"
              >
                Ora inizio
              </label>
              <input
                id="walkin-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                step={900}
                className="mt-1 block w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label
                htmlFor="walkin-end-time"
                className="block text-sm font-medium text-foreground"
              >
                Ora fine
              </label>
              <input
                id="walkin-end-time"
                type="time"
                value={endTime}
                readOnly
                className="mt-1 block w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-muted-foreground"
              />
            </div>
          </div>

          {hasConflict && (
            <p className="rounded-lg bg-orange-950/30 border border-orange-800/50 p-2 text-sm text-orange-400">
              Attenzione: il barbiere ha già un appuntamento in questo orario.
            </p>
          )}

          {error && (
            <p className="rounded-lg bg-destructive/10 p-2 text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvataggio...
              </>
            ) : (
              "Aggiungi Walk-in"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
