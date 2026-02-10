"use client";

import { useTransition, useState } from "react";
import {
  X,
  Phone,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateAppointmentStatus } from "@/actions/appointments";
import type { CalendarAppointment } from "@/actions/appointments";
import { STATUS_STYLES, STATUS_LABELS } from "./appointment-card";

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

const SOURCE_LABELS: Record<string, string> = {
  online: "Online",
  walk_in: "Walk-in",
  manual: "Manuale",
  waitlist: "Lista d'attesa",
};

interface AppointmentSheetProps {
  appointment: CalendarAppointment | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function AppointmentSheet({ appointment, onClose, onUpdate }: AppointmentSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!appointment) return null;

  const style = STATUS_STYLES[appointment.status] || STATUS_STYLES.booked;
  const clientName = appointment.client
    ? `${appointment.client.first_name}${appointment.client.last_name ? ` ${appointment.client.last_name}` : ""}`
    : "Cliente sconosciuto";

  const canComplete = appointment.status === "booked" || appointment.status === "confirmed";
  const canCancel = appointment.status === "booked" || appointment.status === "confirmed";
  const canNoShow = appointment.status === "booked" || appointment.status === "confirmed";
  const canConfirm = appointment.status === "booked";

  function handleAction(status: "confirmed" | "completed" | "cancelled" | "no_show") {
    setError(null);
    startTransition(async () => {
      const result = await updateAppointmentStatus(appointment!.id, status);
      if (result.error) {
        setError(result.error);
      } else {
        onUpdate();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md animate-in slide-in-from-bottom-4 rounded-t-2xl bg-zinc-900 border border-zinc-800 shadow-2xl shadow-black/50 sm:mx-4 sm:rounded-2xl">
        {/* Accent bar */}
        <div className={cn("h-1.5 w-full rounded-t-2xl", style.accent)} />

        <div className="p-5">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white", style.accent)}>
                  {clientName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-100">{clientName}</h2>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        appointment.status === "booked" && "bg-blue-500/20 text-blue-300",
                        appointment.status === "confirmed" && "bg-emerald-500/20 text-emerald-300",
                        appointment.status === "completed" && "bg-zinc-800 text-zinc-400",
                        appointment.status === "cancelled" && "bg-red-500/20 text-red-400",
                        appointment.status === "no_show" && "bg-amber-500/20 text-amber-300",
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", style.accent)} />
                      {STATUS_LABELS[appointment.status] || appointment.status}
                    </span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                      {SOURCE_LABELS[appointment.source] || appointment.source}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Details */}
          <div className="space-y-1 rounded-xl border border-zinc-800 bg-zinc-800/30 p-3">
            <div className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm">
              <Clock className="h-4 w-4 shrink-0 text-zinc-500" />
              <div>
                <span className="font-semibold text-zinc-100">
                  {appointment.start_time.slice(0, 5)} — {appointment.end_time.slice(0, 5)}
                </span>
                <span className="ml-2 text-xs text-zinc-500">{appointment.date}</span>
              </div>
            </div>

            {appointment.service && (
              <div className="flex items-center justify-between rounded-lg px-2 py-2 text-sm">
                <div className="flex items-center gap-3">
                  <Scissors className="h-4 w-4 shrink-0 text-zinc-500" />
                  <span className="text-zinc-300">{appointment.service.name}</span>
                </div>
                <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-200">
                  {formatPrice(appointment.service.price_cents)}
                </span>
              </div>
            )}

            {appointment.staff && (
              <div className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm">
                <User className="h-4 w-4 shrink-0 text-zinc-500" />
                <span className="text-zinc-300">{appointment.staff.name}</span>
              </div>
            )}

            {appointment.client?.phone && (
              <div className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm">
                <Phone className="h-4 w-4 shrink-0 text-zinc-500" />
                <a
                  href={`tel:${appointment.client.phone}`}
                  className="font-medium text-zinc-300 hover:text-white hover:underline"
                >
                  {appointment.client.phone}
                </a>
              </div>
            )}
          </div>

          {/* Confirmation status */}
          {appointment.confirmationStatus && appointment.confirmationStatus !== "none" && (
            <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-zinc-800 px-3 py-2.5 text-sm">
              <MessageCircle className={cn(
                "h-4 w-4 shrink-0",
                appointment.confirmationStatus === "pending" && "text-amber-400",
                appointment.confirmationStatus === "confirmed" && "text-emerald-400",
                appointment.confirmationStatus === "auto_cancelled" && "text-red-400",
              )} />
              <div>
                {appointment.confirmationStatus === "pending" && (
                  <span className="text-amber-300">In attesa di conferma WhatsApp</span>
                )}
                {appointment.confirmationStatus === "confirmed" && (
                  <span className="text-emerald-300">Confermato via WhatsApp</span>
                )}
                {appointment.confirmationStatus === "auto_cancelled" && (
                  <span className="text-red-400">Non confermato — cancellato automaticamente</span>
                )}
                {appointment.confirmRequestSentAt && appointment.confirmationStatus === "pending" && (
                  <span className="ml-1.5 text-xs text-zinc-500">
                    · inviato {new Date(appointment.confirmRequestSentAt).toLocaleString("it-IT", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                  </span>
                )}
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3 rounded-lg bg-red-950/50 p-2.5 text-sm text-red-400">{error}</p>
          )}

          {/* Actions */}
          {(canConfirm || canComplete || canCancel || canNoShow) && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {canConfirm && (
                <button
                  onClick={() => handleAction("confirmed")}
                  disabled={isPending}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Conferma
                </button>
              )}

              {canComplete && (
                <button
                  onClick={() => handleAction("completed")}
                  disabled={isPending}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-200 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Completato
                </button>
              )}

              {canNoShow && (
                <button
                  onClick={() => handleAction("no_show")}
                  disabled={isPending}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-700/50 bg-amber-950/30 px-3 py-2.5 text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-950/50 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                  No-show
                </button>
              )}

              {canCancel && (
                <button
                  onClick={() => handleAction("cancelled")}
                  disabled={isPending}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-red-700/50 bg-red-950/30 px-3 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-950/50 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Cancella
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
