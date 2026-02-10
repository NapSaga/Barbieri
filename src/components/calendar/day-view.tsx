"use client";

import { cn } from "@/lib/utils";
import type { CalendarAppointment } from "@/actions/appointments";
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
const HOUR_HEIGHT = 80;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const GUTTER_WIDTH = 56;

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

export function DayView({ date, appointments, staffMembers, onSelectAppointment }: DayViewProps) {
  const hasStaff = staffMembers.length > 0;
  const columns = hasStaff
    ? staffMembers
    : [{ id: "default", name: "Tutti", photo_url: null }];

  return (
    <div className="relative overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Staff header */}
        <div className="sticky top-0 z-20 flex border-b border-gray-200 bg-white/95 backdrop-blur-sm">
          <div
            className="shrink-0 border-r border-gray-100"
            style={{ width: GUTTER_WIDTH }}
          />
          {columns.map((col) => {
            const colCount = hasStaff
              ? appointments.filter((a) => a.staff?.id === col.id).length
              : appointments.length;
            return (
              <div
                key={col.id}
                className="flex flex-1 items-center justify-center gap-2 border-r border-gray-100 px-2 py-3 last:border-r-0"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white shadow-sm">
                  {col.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-gray-900">
                    {col.name}
                  </span>
                  {colCount > 0 && (
                    <span className="text-[11px] text-gray-400">
                      {colCount} app.
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
          <div className="shrink-0 border-r border-gray-100" style={{ width: GUTTER_WIDTH }}>
            {Array.from({ length: TOTAL_HOURS }, (_, i) => {
              const hour = START_HOUR + i;
              return (
                <div key={hour} className="relative" style={{ height: HOUR_HEIGHT }}>
                  <span className="absolute -top-[9px] right-3 select-none text-[11px] font-medium tabular-nums text-gray-400">
                    {String(hour).padStart(2, "0")}:00
                  </span>
                </div>
              );
            })}
          </div>

          {/* Columns */}
          {columns.map((col) => {
            const colAppointments = hasStaff
              ? appointments.filter((a) => a.staff?.id === col.id)
              : appointments;

            return (
              <div
                key={col.id}
                className="relative flex-1 border-r border-gray-100 last:border-r-0"
              >
                {/* Hour + half-hour lines */}
                {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                  <div key={i} className="relative" style={{ height: HOUR_HEIGHT }}>
                    <div className="absolute inset-x-0 top-0 border-t border-gray-100" />
                    <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-gray-50" />
                  </div>
                ))}

                {/* Current time indicator */}
                {isToday(date) && <CurrentTimeIndicator />}

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
                      className="absolute inset-x-1 z-[5]"
                      style={{
                        top: Math.max(top, 0),
                        height: Math.max(height, 22),
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
        </div>

        {/* Empty state */}
        {appointments.length === 0 && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="rounded-xl bg-white/90 px-6 py-4 text-center shadow-sm backdrop-blur-sm">
              <p className="text-sm font-medium text-gray-400">
                Nessun appuntamento per oggi
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CurrentTimeIndicator() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const top = minutesToTop(minutes);

  if (minutes < START_HOUR * 60 || minutes > END_HOUR * 60) return null;

  return (
    <div
      className="absolute inset-x-0 z-[8] flex items-center"
      style={{ top }}
    >
      <div className="h-3 w-3 -translate-x-1.5 rounded-full bg-red-500 shadow-sm shadow-red-500/30" />
      <div className="h-[2px] flex-1 bg-red-500 shadow-sm shadow-red-500/20" />
    </div>
  );
}
