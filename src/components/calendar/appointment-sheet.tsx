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
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md animate-in slide-in-from-bottom-4 rounded-t-2xl bg-white shadow-2xl sm:mx-4 sm:rounded-2xl">
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
                  <h2 className="text-base font-bold text-gray-900">{clientName}</h2>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        appointment.status === "booked" && "bg-blue-100 text-blue-700",
                        appointment.status === "confirmed" && "bg-emerald-100 text-emerald-700",
                        appointment.status === "completed" && "bg-gray-100 text-gray-500",
                        appointment.status === "cancelled" && "bg-red-100 text-red-600",
                        appointment.status === "no_show" && "bg-amber-100 text-amber-700",
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", style.accent)} />
                      {STATUS_LABELS[appointment.status] || appointment.status}
                    </span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                      {SOURCE_LABELS[appointment.source] || appointment.source}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Details */}
          <div className="space-y-1 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
            <div className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm">
              <Clock className="h-4 w-4 shrink-0 text-gray-400" />
              <div>
                <span className="font-semibold text-gray-900">
                  {appointment.start_time.slice(0, 5)} — {appointment.end_time.slice(0, 5)}
                </span>
                <span className="ml-2 text-xs text-gray-400">{appointment.date}</span>
              </div>
            </div>

            {appointment.service && (
              <div className="flex items-center justify-between rounded-lg px-2 py-2 text-sm">
                <div className="flex items-center gap-3">
                  <Scissors className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="text-gray-700">{appointment.service.name}</span>
                </div>
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-900">
                  {formatPrice(appointment.service.price_cents)}
                </span>
              </div>
            )}

            {appointment.staff && (
              <div className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm">
                <User className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="text-gray-700">{appointment.staff.name}</span>
              </div>
            )}

            {appointment.client?.phone && (
              <div className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm">
                <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                <a
                  href={`tel:${appointment.client.phone}`}
                  className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {appointment.client.phone}
                </a>
              </div>
            )}
          </div>

          {/* Confirmation status */}
          {appointment.confirmationStatus && appointment.confirmationStatus !== "none" && (
            <div className="mt-3 flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm">
              <MessageCircle className={cn(
                "h-4 w-4 shrink-0",
                appointment.confirmationStatus === "pending" && "text-amber-500",
                appointment.confirmationStatus === "confirmed" && "text-emerald-500",
                appointment.confirmationStatus === "auto_cancelled" && "text-red-400",
              )} />
              <div>
                {appointment.confirmationStatus === "pending" && (
                  <span className="text-amber-700">In attesa di conferma WhatsApp</span>
                )}
                {appointment.confirmationStatus === "confirmed" && (
                  <span className="text-emerald-700">Confermato via WhatsApp</span>
                )}
                {appointment.confirmationStatus === "auto_cancelled" && (
                  <span className="text-red-600">Non confermato — cancellato automaticamente</span>
                )}
                {appointment.confirmRequestSentAt && appointment.confirmationStatus === "pending" && (
                  <span className="ml-1.5 text-xs text-gray-400">
                    · inviato {new Date(appointment.confirmRequestSentAt).toLocaleString("it-IT", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                  </span>
                )}
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 p-2.5 text-sm text-red-600">{error}</p>
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
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Completato
                </button>
              )}

              {canNoShow && (
                <button
                  onClick={() => handleAction("no_show")}
                  disabled={isPending}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                  No-show
                </button>
              )}

              {canCancel && (
                <button
                  onClick={() => handleAction("cancelled")}
                  disabled={isPending}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
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
