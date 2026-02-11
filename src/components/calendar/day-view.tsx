"use client";

import type { CalendarAppointment } from "@/actions/appointments";
import { cn } from "@/lib/utils";
import { AppointmentCard } from "./appointment-card";

interface StaffMember {
  id: string;
  name: string;
  photo_url: string | null;
  working_hours: Record<
    string,
    { start: string; end: string; breakStart?: string; breakEnd?: string; off: boolean }
  > | null;
}

interface DayViewProps {
  date: Date;
  appointments: CalendarAppointment[];
  staffMembers: StaffMember[];
  onSelectAppointment: (appointment: CalendarAppointment) => void;
}

const START_HOUR = 7;
const END_HOUR = 21;
const HOUR_HEIGHT = 72;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const GUTTER_WIDTH = 64;

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTop(minutes: number): number {
  return ((minutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
}

function minutesToHeight(startMin: number, endMin: number): number {
  return ((endMin - startMin) / 60) * HOUR_HEIGHT;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function getWorkingHours(
  staff: StaffMember,
  date: Date,
): { start: number; end: number; breakStart?: number; breakEnd?: number } | null {
  const dayKey = DAY_KEYS[date.getDay()];
  const wh = staff.working_hours?.[dayKey];
  if (!wh || wh.off) return null;
  return {
    start: timeToMinutes(wh.start),
    end: timeToMinutes(wh.end),
    breakStart: wh.breakStart ? timeToMinutes(wh.breakStart) : undefined,
    breakEnd: wh.breakEnd ? timeToMinutes(wh.breakEnd) : undefined,
  };
}

function formatWorkingRange(staff: StaffMember, date: Date): string {
  const wh = getWorkingHours(staff, date);
  if (!wh) return "Giorno libero";
  const startH = String(Math.floor(wh.start / 60)).padStart(2, "0");
  const startM = String(wh.start % 60).padStart(2, "0");
  const endH = String(Math.floor(wh.end / 60)).padStart(2, "0");
  const endM = String(wh.end % 60).padStart(2, "0");
  return `${startH}:${startM} – ${endH}:${endM}`;
}

function isHourWorking(hour: number, wh: { start: number; end: number } | null): boolean {
  if (!wh) return false;
  const hourStart = hour * 60;
  const hourEnd = (hour + 1) * 60;
  return hourStart < wh.end && hourEnd > wh.start;
}

export function DayView({ date, appointments, staffMembers, onSelectAppointment }: DayViewProps) {
  const hasStaff = staffMembers.length > 0;
  const columns = hasStaff
    ? staffMembers
    : [{ id: "default", name: "Tutti", photo_url: null, working_hours: null } as StaffMember];

  const showToday = isToday(date);

  return (
    <div className="relative overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Staff header */}
        <div className="sticky top-0 z-20 flex border-b border-border bg-card">
          {/* Gutter corner */}
          <div className="shrink-0 border-r border-border" style={{ width: GUTTER_WIDTH }} />
          {columns.map((col, idx) => {
            const colCount = hasStaff
              ? appointments.filter((a) => a.staff?.id === col.id).length
              : appointments.length;
            const schedule = hasStaff ? formatWorkingRange(col, date) : "";
            const isDayOff = hasStaff && getWorkingHours(col, date) === null;

            return (
              <div
                key={col.id}
                className={cn(
                  "flex flex-1 items-center gap-3 px-4 py-3",
                  idx < columns.length - 1 && "border-r border-border",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm",
                    isDayOff ? "bg-muted text-muted-foreground" : "bg-foreground text-background",
                  )}
                >
                  {col.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {col.name}
                    </span>
                    {colCount > 0 && (
                      <span className="shrink-0 rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-foreground">
                        {colCount}
                      </span>
                    )}
                  </div>
                  {hasStaff && (
                    <span
                      className={cn(
                        "text-[11px]",
                        isDayOff ? "font-medium text-amber-500" : "text-muted-foreground",
                      )}
                    >
                      {schedule}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline grid */}
        <div className="relative flex" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
          {/* Hour gutter */}
          <div
            className="shrink-0 border-r border-border bg-muted/40"
            style={{ width: GUTTER_WIDTH }}
          >
            {Array.from({ length: TOTAL_HOURS }, (_, i) => {
              const hour = START_HOUR + i;
              return (
                <div key={hour} className="relative" style={{ height: HOUR_HEIGHT }}>
                  <span className="absolute -top-[9px] right-3 select-none text-[11px] font-medium tabular-nums text-muted-foreground">
                    {String(hour).padStart(2, "0")}:00
                  </span>
                </div>
              );
            })}
          </div>

          {/* Staff columns */}
          {columns.map((col, idx) => {
            const colAppointments = hasStaff
              ? appointments.filter((a) => a.staff?.id === col.id)
              : appointments;
            const wh = hasStaff ? getWorkingHours(col, date) : null;

            return (
              <div
                key={col.id}
                className={cn(
                  "relative flex-1",
                  idx < columns.length - 1 && "border-r border-border",
                )}
              >
                {/* Hour rows with working/non-working shading */}
                {Array.from({ length: TOTAL_HOURS }, (_, i) => {
                  const hour = START_HOUR + i;
                  const working = hasStaff ? isHourWorking(hour, wh) : true;

                  return (
                    <div
                      key={i}
                      className={cn("relative", !working && "bg-muted/50")}
                      style={{ height: HOUR_HEIGHT }}
                    >
                      {/* Hour line */}
                      <div className="absolute inset-x-0 top-0 border-t border-border/70" />
                      {/* Half-hour line */}
                      <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border/30" />
                    </div>
                  );
                })}

                {/* Appointment blocks */}
                {colAppointments.map((appointment) => {
                  const startMin = timeToMinutes(appointment.start_time);
                  const endMin = timeToMinutes(appointment.end_time);
                  const top = minutesToTop(startMin);
                  const height = minutesToHeight(startMin, endMin);

                  if (startMin < START_HOUR * 60 || startMin >= END_HOUR * 60) return null;

                  return (
                    <div
                      key={appointment.id}
                      className="absolute inset-x-1.5 z-[5]"
                      style={{
                        top: Math.max(top, 0),
                        height: Math.max(height, 26),
                      }}
                    >
                      <AppointmentCard
                        appointment={appointment}
                        compact={height < 40}
                        onClick={() => onSelectAppointment(appointment)}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Current time indicator — single line across all columns */}
          {showToday && <CurrentTimeIndicator gutterWidth={GUTTER_WIDTH} />}
        </div>

        {/* Empty state */}
        {appointments.length === 0 && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="rounded-xl border border-border bg-card/95 px-8 py-5 text-center shadow-lg backdrop-blur-sm">
              <p className="text-sm font-medium text-muted-foreground">
                Nessun appuntamento per oggi
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Usa il pulsante Walk-in per aggiungerne uno
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CurrentTimeIndicator({ gutterWidth }: { gutterWidth: number }) {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const top = minutesToTop(minutes);

  if (minutes < START_HOUR * 60 || minutes > END_HOUR * 60) return null;

  return (
    <div
      className="pointer-events-none absolute z-[8] flex items-center"
      style={{ top, left: gutterWidth - 6, right: 0 }}
    >
      <div className="h-3 w-3 rounded-full bg-red-500 shadow-md shadow-red-500/40" />
      <div className="h-[2px] flex-1 bg-red-500/80" />
    </div>
  );
}
