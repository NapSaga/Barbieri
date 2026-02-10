"use client";

import { cn } from "@/lib/utils";
import type { CalendarAppointment } from "@/actions/appointments";

const STATUS_STYLES: Record<
  string,
  { accent: string; bg: string; text: string; muted: string }
> = {
  booked: {
    accent: "bg-violet-500",
    bg: "bg-violet-500/10 hover:bg-violet-500/15",
    text: "text-violet-300",
    muted: "text-violet-400/70",
  },
  confirmed: {
    accent: "bg-emerald-500",
    bg: "bg-emerald-500/10 hover:bg-emerald-500/15",
    text: "text-emerald-300",
    muted: "text-emerald-400/70",
  },
  completed: {
    accent: "bg-zinc-500",
    bg: "bg-zinc-500/10 hover:bg-zinc-500/15",
    text: "text-zinc-400",
    muted: "text-zinc-500",
  },
  cancelled: {
    accent: "bg-red-500",
    bg: "bg-red-500/8 hover:bg-red-500/12",
    text: "text-red-400 line-through",
    muted: "text-red-500",
  },
  no_show: {
    accent: "bg-amber-500",
    bg: "bg-amber-500/10 hover:bg-amber-500/15",
    text: "text-amber-300",
    muted: "text-amber-400/70",
  },
};

const STATUS_LABELS: Record<string, string> = {
  booked: "Prenotato",
  confirmed: "Confermato",
  completed: "Completato",
  cancelled: "Cancellato",
  no_show: "No-show",
};

interface AppointmentCardProps {
  appointment: CalendarAppointment;
  compact?: boolean;
  onClick?: () => void;
}

export function AppointmentCard({
  appointment,
  compact = false,
  onClick,
}: AppointmentCardProps) {
  const style = STATUS_STYLES[appointment.status] || STATUS_STYLES.booked;
  const clientName = appointment.client
    ? `${appointment.client.first_name}${appointment.client.last_name ? ` ${appointment.client.last_name}` : ""}`
    : "Sconosciuto";

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex h-full w-full items-center gap-1.5 overflow-hidden rounded-md pl-0 text-left transition-all",
          style.bg,
        )}
      >
        <div className={cn("h-full w-1 shrink-0 rounded-l-md", style.accent)} />
        <div className="flex min-w-0 items-center gap-1 py-0.5 pr-1.5">
          <span className={cn("truncate text-[11px] font-semibold leading-tight", style.text)}>
            {clientName}
          </span>
          {appointment.confirmationStatus === "pending" && (
            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-400" title="In attesa conferma" />
          )}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-full w-full overflow-hidden rounded-lg pl-0 text-left transition-all",
        style.bg,
      )}
    >
      <div className={cn("w-1 shrink-0 rounded-l-lg", style.accent)} />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-2.5 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className={cn("truncate text-[13px] font-semibold leading-snug", style.text)}>
            {clientName}
          </span>
          {appointment.confirmationStatus === "pending" && (
            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-400" title="In attesa conferma" />
          )}
        </div>
        <div className={cn("flex items-center gap-1.5 text-[11px] leading-none", style.muted)}>
          <span>{appointment.start_time.slice(0, 5)}</span>
          {appointment.service && (
            <>
              <span className="opacity-40">·</span>
              <span className="truncate">{appointment.service.name}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

export { STATUS_STYLES, STATUS_LABELS };
