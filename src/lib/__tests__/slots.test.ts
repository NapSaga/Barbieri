import { describe, expect, it } from "vitest";
import { getAvailableSlots } from "@/lib/slots";
import type { ExistingAppointment, StaffSchedule } from "@/lib/slots";

const BASE_SCHEDULE: StaffSchedule = {
  staffId: "staff-1",
  staffName: "Marco",
  workStart: "09:00",
  workEnd: "13:00",
};

describe("getAvailableSlots", () => {
  it("generates slots for a simple schedule with no appointments", () => {
    const slots = getAvailableSlots(BASE_SCHEDULE, [], 30);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].start).toBe("09:00");
    expect(slots[0].end).toBe("09:30");
  });

  it("last slot ends at or before work end", () => {
    const slots = getAvailableSlots(BASE_SCHEDULE, [], 30);
    const last = slots[slots.length - 1];
    expect(last.end).toBe("13:00");
  });

  it("does not generate slots that would exceed work end", () => {
    const schedule: StaffSchedule = {
      ...BASE_SCHEDULE,
      workStart: "12:00",
      workEnd: "13:00",
    };
    const slots = getAvailableSlots(schedule, [], 90);
    expect(slots).toHaveLength(0);
  });

  it("excludes slots overlapping with break", () => {
    const schedule: StaffSchedule = {
      ...BASE_SCHEDULE,
      breakStart: "11:00",
      breakEnd: "12:00",
    };
    const slots = getAvailableSlots(schedule, [], 30);
    const duringBreak = slots.filter(
      (s) => s.start >= "11:00" && s.start < "12:00",
    );
    // No slot should start during the break (since 30min slots starting in 11:xx would overlap break)
    expect(duringBreak).toHaveLength(0);
  });

  it("excludes slots overlapping with existing appointments", () => {
    const appointments: ExistingAppointment[] = [
      { staffId: "staff-1", startTime: "10:00", endTime: "10:30" },
    ];
    const slots = getAvailableSlots(BASE_SCHEDULE, appointments, 30);
    const overlapping = slots.filter((s) => s.start === "10:00");
    expect(overlapping).toHaveLength(0);
  });

  it("ignores appointments for a different staff member", () => {
    const appointments: ExistingAppointment[] = [
      { staffId: "staff-2", startTime: "10:00", endTime: "10:30" },
    ];
    const slots = getAvailableSlots(BASE_SCHEDULE, appointments, 30);
    const at10 = slots.filter((s) => s.start === "10:00");
    expect(at10).toHaveLength(1);
  });

  it("returns empty for zero-length work window", () => {
    const schedule: StaffSchedule = {
      ...BASE_SCHEDULE,
      workStart: "09:00",
      workEnd: "09:00",
    };
    const slots = getAvailableSlots(schedule, [], 30);
    expect(slots).toHaveLength(0);
  });

  it("handles 15-minute service duration", () => {
    const slots = getAvailableSlots(BASE_SCHEDULE, [], 15);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].end).toBe("09:15");
  });

  it("handles exactly-fitting duration", () => {
    const schedule: StaffSchedule = {
      ...BASE_SCHEDULE,
      workStart: "09:00",
      workEnd: "10:00",
    };
    const slots = getAvailableSlots(schedule, [], 60);
    expect(slots).toHaveLength(1);
    expect(slots[0]).toEqual({ start: "09:00", end: "10:00" });
  });

  it("handles multiple back-to-back appointments", () => {
    const appointments: ExistingAppointment[] = [
      { staffId: "staff-1", startTime: "09:00", endTime: "09:30" },
      { staffId: "staff-1", startTime: "09:30", endTime: "10:00" },
      { staffId: "staff-1", startTime: "10:00", endTime: "10:30" },
    ];
    const slots = getAvailableSlots(BASE_SCHEDULE, appointments, 30);
    const earlySlots = slots.filter((s) => s.start < "10:30");
    expect(earlySlots).toHaveLength(0);
  });

  it("generates slots with 15-minute increments", () => {
    const slots = getAvailableSlots(BASE_SCHEDULE, [], 30);
    for (let i = 1; i < slots.length; i++) {
      const prevStart = parseInt(slots[i - 1].start.split(":")[1], 10);
      const curStart = parseInt(slots[i].start.split(":")[1], 10);
      const prevHour = parseInt(slots[i - 1].start.split(":")[0], 10);
      const curHour = parseInt(slots[i].start.split(":")[0], 10);
      const diffMinutes = (curHour * 60 + curStart) - (prevHour * 60 + prevStart);
      expect(diffMinutes).toBe(15);
    }
  });
});
