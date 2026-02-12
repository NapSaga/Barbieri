"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  MessageCircle,
  Phone,
  Scissors,
  Undo2,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useState, useTransition } from "react";
import {
  revertAppointmentStatus,
  sendDelayNotice,
  updateAppointmentStatus,
} from "@/actions/appointments";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatPrice } from "@/lib/time-utils";
import { cn } from "@/lib/utils";
import type { CalendarAppointment } from "@/types";
import { STATUS_LABELS, STATUS_STYLES } from "./appointment-card";

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
  const [delaySuccess, setDelaySuccess] = useState(false);
  const [delayOpen, setDelayOpen] = useState(false);

  if (!appointment) return null;

  const style = STATUS_STYLES[appointment.status] || STATUS_STYLES.booked;
  const clientName = appointment.client
    ? `${appointment.client.first_name}${appointment.client.last_name ? ` ${appointment.client.last_name}` : ""}`
    : "Cliente sconosciuto";

  const today = new Date().toISOString().split("T")[0];
  const isFuture = appointment.date > today;

  const isToday = appointment.date === today;
  const canComplete =
    (appointment.status === "booked" || appointment.status === "confirmed") && !isFuture;
  const canCancel = appointment.status === "booked" || appointment.status === "confirmed";
  const canNoShow =
    (appointment.status === "booked" || appointment.status === "confirmed") && !isFuture;
  const canConfirm = appointment.status === "booked";
  const canRevert = appointment.status === "completed" || appointment.status === "no_show";
  const canDelay =
    (appointment.status === "booked" || appointment.status === "confirmed") &&
    isToday &&
    !!appointment.client?.phone;

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

  function handleDelay(minutes: number) {
    setError(null);
    setDelaySuccess(false);
    setDelayOpen(false);
    startTransition(async () => {
      const result = await sendDelayNotice(appointment!.id, minutes);
      if (result.error) {
        setError(result.error);
      } else {
        setDelaySuccess(true);
      }
    });
  }

  function handleRevert() {
    if (appointment!.status !== "completed" && appointment!.status !== "no_show") return;
    setError(null);
    startTransition(async () => {
      const result = await revertAppointmentStatus(
        appointment!.id,
        appointment!.status as "completed" | "no_show",
      );
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
      <button
        type="button"
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        tabIndex={-1}
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />
      <div className="relative z-10 w-full max-w-md animate-in slide-in-from-bottom-4 rounded-t-2xl bg-card border border-border shadow-xl sm:mx-4 sm:rounded-2xl">
        {/* Accent bar */}
        <div className={cn("h-1.5 w-full rounded-t-2xl", style.accent)} />

        <div className="p-5">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white",
                    style.accent,
                  )}
                >
                  {clientName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">{clientName}</h2>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        appointment.status === "booked" && "bg-violet-500/20 text-violet-300",
                        appointment.status === "confirmed" && "bg-emerald-500/20 text-emerald-300",
                        appointment.status === "completed" && "bg-secondary text-muted-foreground",
                        appointment.status === "cancelled" && "bg-red-500/20 text-red-400",
                        appointment.status === "no_show" && "bg-amber-500/20 text-amber-300",
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", style.accent)} />
                      {STATUS_LABELS[appointment.status] || appointment.status}
                    </span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {SOURCE_LABELS[appointment.source] || appointment.source}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Details */}
          <div className="space-y-1 rounded-xl border border-border bg-muted p-3">
            <div className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm">
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <span className="font-semibold text-foreground">
                  {appointment.start_time.slice(0, 5)} — {appointment.end_time.slice(0, 5)}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">{appointment.date}</span>
              </div>
            </div>

            {appointment.service && (
              <div className="flex items-center justify-between rounded-lg px-2 py-2 text-sm">
                <div className="flex items-center gap-3">
                  <Scissors className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-foreground">{appointment.service.name}</span>
                </div>
                <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-bold text-foreground">
                  {formatPrice(appointment.service.price_cents)}
                </span>
              </div>
            )}

            {appointment.staff && (
              <div className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm">
                <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-foreground">{appointment.staff.name}</span>
              </div>
            )}

            {appointment.client?.phone && (
              <div className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <a
                  href={`tel:${appointment.client.phone}`}
                  className="font-medium text-foreground hover:text-foreground hover:underline"
                >
                  {appointment.client.phone}
                </a>
              </div>
            )}
          </div>

          {/* Confirmation status */}
          {appointment.confirmationStatus && appointment.confirmationStatus !== "none" && (
            <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm">
              <MessageCircle
                className={cn(
                  "h-4 w-4 shrink-0",
                  appointment.confirmationStatus === "pending" && "text-amber-400",
                  appointment.confirmationStatus === "confirmed" && "text-emerald-400",
                  appointment.confirmationStatus === "auto_cancelled" && "text-red-400",
                )}
              />
              <div>
                {appointment.confirmationStatus === "pending" && (
                  <span className="text-amber-300">In attesa di conferma WhatsApp</span>
                )}
                {appointment.confirmationStatus === "confirmed" && (
                  <span className="text-emerald-300">Confermato via WhatsApp</span>
                )}
                {appointment.confirmationStatus === "auto_cancelled" && (
                  <span className="text-red-400">
                    Il cliente non ha confermato via WhatsApp entro il termine previsto — cancellato
                    automaticamente
                  </span>
                )}
                {appointment.confirmRequestSentAt &&
                  appointment.confirmationStatus === "pending" && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      · inviato{" "}
                      {new Date(appointment.confirmRequestSentAt).toLocaleString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  )}
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3 rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">
              {error}
            </p>
          )}

          {delaySuccess && (
            <p className="mt-3 rounded-lg bg-emerald-500/10 p-2.5 text-sm text-emerald-400">
              Avviso ritardo inviato al cliente
            </p>
          )}

          {/* Delay notice */}
          {canDelay && (
            <div className="mt-4">
              <Popover open={delayOpen} onOpenChange={setDelayOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    disabled={isPending}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-sky-700/50 bg-sky-950/30 px-3 py-2.5 text-sm font-semibold text-sky-300 transition-colors hover:bg-sky-950/50 disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                    In ritardo
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="center">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Quanti minuti di ritardo?
                  </p>
                  <div className="flex gap-1.5">
                    {[5, 10, 15, 20, 30].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleDelay(m)}
                        className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Actions */}
          {(canConfirm || canComplete || canCancel || canNoShow || canRevert) && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {canConfirm && (
                <button
                  type="button"
                  onClick={() => handleAction("confirmed")}
                  disabled={isPending}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Conferma
                </button>
              )}

              {canComplete && (
                <button
                  type="button"
                  onClick={() => handleAction("completed")}
                  disabled={isPending}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Completato
                </button>
              )}

              {canNoShow && (
                <button
                  type="button"
                  onClick={() => handleAction("no_show")}
                  disabled={isPending}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-700/50 bg-amber-950/30 px-3 py-2.5 text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-950/50 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  No-show
                </button>
              )}

              {canCancel && (
                <button
                  type="button"
                  onClick={() => handleAction("cancelled")}
                  disabled={isPending}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-red-700/50 bg-red-950/30 px-3 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-950/50 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Cancella
                </button>
              )}

              {canRevert && (
                <button
                  type="button"
                  onClick={handleRevert}
                  disabled={isPending}
                  className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Undo2 className="h-4 w-4" />
                  )}
                  Ripristina a Confermato
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
