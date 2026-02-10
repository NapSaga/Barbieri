"use client";

import { useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { addWalkIn } from "@/actions/appointments";

interface StaffMember {
  id: string;
  name: string;
}

interface ServiceItem {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
}

interface WalkInDialogProps {
  open: boolean;
  onClose: () => void;
  date: string;
  staffMembers: StaffMember[];
  services: ServiceItem[];
  onSuccess: () => void;
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59);
  const newH = Math.floor(total / 60).toString().padStart(2, "0");
  const newM = (total % 60).toString().padStart(2, "0");
  return `${newH}:${newM}`;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function WalkInDialog({
  open,
  onClose,
  date,
  staffMembers,
  services,
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

  if (!open) return null;

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const endTime = selectedService
    ? addMinutesToTime(startTime, selectedService.duration_minutes)
    : startTime;

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
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl shadow-black/50 mx-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-100">Aggiungi Walk-in</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-zinc-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={handleSubmit} className="space-y-4">
          {/* Client info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-300">Nome cliente</label>
              <input
                name="client_name"
                required
                className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="Mario"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300">Telefono</label>
              <input
                name="client_phone"
                type="tel"
                required
                className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="+39 333..."
              />
            </div>
          </div>

          {/* Service */}
          <div>
            <label className="block text-sm font-medium text-zinc-300">Servizio</label>
            <select
              name="service_id"
              required
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
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
            <label className="block text-sm font-medium text-zinc-300">Barbiere</label>
            <select
              name="staff_id"
              required
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
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
              <label className="block text-sm font-medium text-zinc-300">Ora inizio</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                step={900}
                className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300">Ora fine</label>
              <input
                type="time"
                value={endTime}
                readOnly
                className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-500"
              />
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-950/50 p-2 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
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
