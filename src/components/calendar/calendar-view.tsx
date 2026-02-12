"use client";

import {
  CalendarDays,
  Calendar as CalendarIcon,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  ClockAlert,
  Plus,
  Users,
} from "lucide-react";
import { useCallback, useMemo, useState, useTransition } from "react";
import { getAppointmentsForDate, getAppointmentsForWeek } from "@/actions/appointments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CalendarAppointment } from "@/types";
import { AppointmentSheet } from "./appointment-sheet";
import { DayView } from "./day-view";
import { WalkInDialog } from "./walk-in-dialog";
import { WeekView } from "./week-view";

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
  initialWeekAppointments?: CalendarAppointment[];
  staffMembers: StaffMember[];
  services: ServiceItem[];
  closureDates?: string[];
  waitlistCounts?: Record<string, number>;
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
  initialWeekAppointments,
  staffMembers,
  services,
  closureDates = [],
  waitlistCounts = {},
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date(`${initialDate}T00:00:00`));
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [dayAppointments, setDayAppointments] = useState<CalendarAppointment[]>(initialAppointments);
  const [weekAppointments, setWeekAppointments] = useState<CalendarAppointment[]>(initialWeekAppointments || []);
  const [isPending, startTransition] = useTransition();
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null);
  const [staffFilter, setStaffFilter] = useState<string>("all");

  const appointments = viewMode === "day" ? dayAppointments : weekAppointments;

  const filteredStaff = useMemo(
    () => (staffFilter === "all" ? staffMembers : staffMembers.filter((s) => s.id === staffFilter)),
    [staffFilter, staffMembers],
  );

  const filteredAppointments = useMemo(
    () =>
      staffFilter === "all"
        ? appointments
        : appointments.filter((a) => a.staff?.id === staffFilter),
    [staffFilter, appointments],
  );

  const fetchDay = useCallback((date: Date) => {
    startTransition(async () => {
      const data = await getAppointmentsForDate(toISODate(date));
      setDayAppointments(data);
    });
  }, []);

  const fetchWeek = useCallback((date: Date) => {
    startTransition(async () => {
      const monday = getMonday(date);
      const sunday = addDays(monday, 6);
      const data = await getAppointmentsForWeek(toISODate(monday), toISODate(sunday));
      setWeekAppointments(data);
    });
  }, []);

  const fetchAppointments = useCallback(
    (date: Date, mode: ViewMode) => {
      if (mode === "day") {
        fetchDay(date);
      } else {
        fetchWeek(date);
      }
    },
    [fetchDay, fetchWeek],
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
    // Refresh both views so switching is always instant after a mutation
    fetchDay(currentDate);
    fetchWeek(currentDate);
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
            type="button"
            onClick={() => setWalkInOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Walk-in
          </button>
        </div>
      </div>

      {/* Navigation bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => navigate(1)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goToToday}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              isToday ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
            )}
          >
            Oggi
          </button>
          <h2 className="ml-2 text-sm font-semibold capitalize text-foreground sm:text-base">
            {viewMode === "day"
              ? formatDateHeader(currentDate)
              : formatWeekHeader(weekStart, weekEnd)}
          </h2>
          {isPending && (
            <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {staffMembers.length > 1 && (
            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger size="sm" className="gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                {staffMembers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex rounded-lg bg-muted p-0.5">
            <button
              type="button"
              onClick={() => switchView("day")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                viewMode === "day"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              Giorno
            </button>
            <button
              type="button"
              onClick={() => switchView("week")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                viewMode === "week"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <CalendarDays className="h-4 w-4" />
              Settimana
            </button>
          </div>
        </div>
      </div>

      {/* Waitlist banner */}
      {viewMode === "day" && (waitlistCounts[toISODate(currentDate)] || 0) > 0 && (
        <div className="flex items-center gap-2.5 rounded-xl border border-blue-800/50 bg-blue-950/30 px-4 py-3 text-sm text-blue-400">
          <ClockAlert className="h-5 w-5 shrink-0 text-blue-400" />
          <span className="font-medium">
            {waitlistCounts[toISODate(currentDate)]}{" "}
            {waitlistCounts[toISODate(currentDate)] === 1
              ? "cliente in lista d\u2019attesa"
              : "clienti in lista d\u2019attesa"}{" "}
            per questa data
          </span>
        </div>
      )}

      {/* Closure banner */}
      {viewMode === "day" && closureDates.includes(toISODate(currentDate)) && (
        <div className="flex items-center gap-2.5 rounded-xl border border-orange-800/50 bg-orange-950/30 px-4 py-3 text-sm text-orange-400">
          <CalendarOff className="h-5 w-5 shrink-0 text-orange-400" />
          <span className="font-medium">
            Chiusura straordinaria — la barberia è chiusa in questa data.
          </span>
        </div>
      )}

      {/* Calendar grid */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {viewMode === "day" ? (
          <DayView
            date={currentDate}
            appointments={filteredAppointments}
            staffMembers={filteredStaff}
            onSelectAppointment={setSelectedAppointment}
          />
        ) : (
          <WeekView
            weekStart={weekStart}
            appointments={filteredAppointments}
            staffMembers={filteredStaff}
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
        appointments={appointments}
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
