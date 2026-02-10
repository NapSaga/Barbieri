"use client";

import { cn } from "@/lib/utils";
import type { CalendarAppointment } from "@/actions/appointments";
import { AppointmentCard } from "./appointment-card";

interface StaffMember {
  id: string;
  name: string;
}

interface WeekViewProps {
  weekStart: Date;
  appointments: CalendarAppointment[];
  staffMembers: StaffMember[];
  onSelectAppointment: (appointment: CalendarAppointment) => void;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

const DAY_NAMES = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export function WeekView({
  weekStart,
  appointments,
  staffMembers,
  onSelectAppointment,
}: WeekViewProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const byDate: Record<string, CalendarAppointment[]> = {};
  for (const day of days) {
    byDate[toISODate(day)] = [];
  }
  for (const appt of appointments) {
    if (byDate[appt.date]) {
      byDate[appt.date].push(appt);
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[700px] grid-cols-7">
        {/* Day headers */}
        {days.map((day, i) => {
          const count = (byDate[toISODate(day)] || []).length;
          return (
            <div
              key={toISODate(day)}
              className={cn(
                "border-b border-r border-gray-100 px-2 py-3 text-center last:border-r-0",
                isToday(day) && "bg-blue-50/60",
              )}
            >
              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                {DAY_NAMES[i]}
              </span>
              <div
                className={cn(
                  "mx-auto mt-1 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors",
                  isToday(day)
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                    : "text-gray-900",
                )}
              >
                {day.getDate()}
              </div>
              {count > 0 && (
                <span className="mt-1 inline-block text-[10px] font-medium text-gray-400">
                  {count} app.
                </span>
              )}
            </div>
          );
        })}

        {/* Day cells */}
        {days.map((day) => {
          const dayAppts = byDate[toISODate(day)] || [];

          return (
            <div
              key={toISODate(day)}
              className={cn(
                "min-h-[240px] border-r border-gray-100 p-1.5 last:border-r-0",
                isToday(day) && "bg-blue-50/20",
              )}
            >
              <div className="space-y-1">
                {dayAppts.map((appt) => (
                  <div key={appt.id} className="h-7">
                    <AppointmentCard
                      appointment={appt}
                      compact
                      onClick={() => onSelectAppointment(appt)}
                    />
                  </div>
                ))}
                {dayAppts.length === 0 && (
                  <div className="flex h-20 items-center justify-center">
                    <span className="text-xs text-gray-200">—</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
