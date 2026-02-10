/**
 * Slot availability calculation
 * Computes available time slots based on staff working hours,
 * existing appointments, and service duration.
 */

import { addMinutes, format, parse, isAfter, isBefore, isEqual } from "date-fns";

export interface TimeSlot {
  start: string; // HH:mm
  end: string; // HH:mm
}

export interface StaffSchedule {
  staffId: string;
  staffName: string;
  workStart: string; // HH:mm
  workEnd: string; // HH:mm
  breakStart?: string; // HH:mm
  breakEnd?: string; // HH:mm
}

export interface ExistingAppointment {
  staffId: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

const SLOT_INCREMENT_MINUTES = 15;
const TIME_REF_DATE = "2000-01-01";

function parseTime(time: string): Date {
  return parse(time, "HH:mm", new Date(TIME_REF_DATE));
}

function timeToString(date: Date): string {
  return format(date, "HH:mm");
}

/**
 * Calculate available slots for a given staff member on a given date.
 */
export function getAvailableSlots(
  schedule: StaffSchedule,
  existingAppointments: ExistingAppointment[],
  serviceDurationMinutes: number,
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const workStart = parseTime(schedule.workStart);
  const workEnd = parseTime(schedule.workEnd);
  const breakStart = schedule.breakStart ? parseTime(schedule.breakStart) : null;
  const breakEnd = schedule.breakEnd ? parseTime(schedule.breakEnd) : null;

  const staffAppointments = existingAppointments
    .filter((a) => a.staffId === schedule.staffId)
    .map((a) => ({
      start: parseTime(a.startTime),
      end: parseTime(a.endTime),
    }));

  let current = workStart;

  while (isBefore(current, workEnd) || isEqual(current, workEnd)) {
    const slotEnd = addMinutes(current, serviceDurationMinutes);

    // Slot must end before or at work end
    if (isAfter(slotEnd, workEnd)) break;

    // Check if slot overlaps with break
    const overlapsBreak =
      breakStart &&
      breakEnd &&
      isBefore(current, breakEnd) &&
      isAfter(slotEnd, breakStart);

    // Check if slot overlaps with any existing appointment
    const overlapsAppointment = staffAppointments.some(
      (appt) => isBefore(current, appt.end) && isAfter(slotEnd, appt.start),
    );

    if (!overlapsBreak && !overlapsAppointment) {
      slots.push({
        start: timeToString(current),
        end: timeToString(slotEnd),
      });
    }

    current = addMinutes(current, SLOT_INCREMENT_MINUTES);
  }

  return slots;
}
