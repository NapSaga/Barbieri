"use client";

import { useState, useCallback, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  Calendar as CalendarIcon,
  CalendarOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DayView } from "./day-view";
import { WeekView } from "./week-view";
import { WalkInDialog } from "./walk-in-dialog";
import { AppointmentSheet } from "./appointment-sheet";
import {
  getAppointmentsForDate,
  getAppointmentsForWeek,
  type CalendarAppointment,
} from "@/actions/appointments";

interface StaffMember {
  id: string;
  name: string;
  photo_url: string | null;
  working_hours: Record<
    string,
    { start: string; end: string; breakStart?: string; breakEnd?: string; off: boolean }
  > | null;
}

interface ServiceItem {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
}

interface CalendarViewProps {
  initialDate: string;
  initialAppointments: CalendarAppointment[];
  staffMembers: StaffMember[];
  services: ServiceItem[];
  closureDates?: string[];
}

type ViewMode = "day" | "week";

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function formatDateHeader(date: Date): string {
  return date.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatWeekHeader(start: Date, end: Date): string {
  const s = start.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  const e = end.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
  return `${s} — ${e}`;
}

export function CalendarView({
  initialDate,
  initialAppointments,
  staffMembers,
  services,
  closureDates = [],
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date(initialDate + "T00:00:00"));
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [appointments, setAppointments] = useState<CalendarAppointment[]>(initialAppointments);
  const [isPending, startTransition] = useTransition();
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null);

  const fetchAppointments = useCallback(
    (date: Date, mode: ViewMode) => {
      startTransition(async () => {
        if (mode === "day") {
          const data = await getAppointmentsForDate(toISODate(date));
          setAppointments(data);
        } else {
          const monday = getMonday(date);
          const sunday = addDays(monday, 6);
          const data = await getAppointmentsForWeek(toISODate(monday), toISODate(sunday));
          setAppointments(data);
        }
      });
    },
    [],
  );

  function navigate(direction: -1 | 1) {
    const days = viewMode === "day" ? 1 : 7;
    const newDate = addDays(currentDate, direction * days);
    setCurrentDate(newDate);
    fetchAppointments(newDate, viewMode);
  }

  function goToToday() {
    const today = new Date();
    setCurrentDate(today);
    fetchAppointments(today, viewMode);
  }

  function switchView(mode: ViewMode) {
    setViewMode(mode);
    fetchAppointments(currentDate, mode);
  }

  function handleRefresh() {
    fetchAppointments(currentDate, viewMode);
  }

  const weekStart = getMonday(currentDate);
  const weekEnd = addDays(weekStart, 6);
  const isToday = toISODate(currentDate) === toISODate(new Date());

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-7 w-7 text-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Calendario</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWalkInOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Walk-in
          </button>
        </div>
      </div>

      {/* Navigation bar */}
      <div className="flex flex-col gap-3 rounded-xl bg-card p-3 shadow-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg p-2 hover:bg-accent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="rounded-lg p-2 hover:bg-accent"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={goToToday}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium",
              isToday
                ? "bg-secondary text-foreground"
                : "text-foreground hover:bg-accent",
            )}
          >
            Oggi
          </button>
          <h2 className="ml-2 text-sm font-semibold text-foreground sm:text-base">
            {viewMode === "day"
              ? formatDateHeader(currentDate)
              : formatWeekHeader(weekStart, weekEnd)}
          </h2>
          {isPending && (
            <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
          )}
        </div>

        <div className="flex rounded-lg bg-secondary p-0.5">
          <button
            onClick={() => switchView("day")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              viewMode === "day"
                ? "bg-accent text-foreground shadow-sm"
                : "text-muted-foreground hover:text-accent-foreground",
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            Giorno
          </button>
          <button
            onClick={() => switchView("week")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              viewMode === "week"
                ? "bg-accent text-foreground shadow-sm"
                : "text-muted-foreground hover:text-accent-foreground",
            )}
          >
            <CalendarDays className="h-4 w-4" />
            Settimana
          </button>
        </div>
      </div>

      {/* Closure banner */}
      {viewMode === "day" && closureDates.includes(toISODate(currentDate)) && (
        <div className="flex items-center gap-2.5 rounded-xl border border-orange-800/50 bg-orange-950/30 px-4 py-3 text-sm text-orange-400">
          <CalendarOff className="h-5 w-5 shrink-0 text-orange-400" />
          <span className="font-medium">Chiusura straordinaria — la barberia è chiusa in questa data.</span>
        </div>
      )}

      {/* Calendar grid */}
      <div className="rounded-xl bg-card shadow-md overflow-hidden">
        {viewMode === "day" ? (
          <DayView
            date={currentDate}
            appointments={appointments}
            staffMembers={staffMembers}
            onSelectAppointment={setSelectedAppointment}
          />
        ) : (
          <WeekView
            weekStart={weekStart}
            appointments={appointments}
            staffMembers={staffMembers}
            onSelectAppointment={setSelectedAppointment}
          />
        )}
      </div>

      {/* Walk-in dialog */}
      <WalkInDialog
        open={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        date={toISODate(currentDate)}
        staffMembers={staffMembers}
        services={services}
        onSuccess={handleRefresh}
      />

      {/* Appointment detail sheet */}
      <AppointmentSheet
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onUpdate={handleRefresh}
      />
    </div>
  );
}
