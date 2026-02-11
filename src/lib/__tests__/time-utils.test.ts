import { describe, expect, it } from "vitest";
import {
  addMinutesToTime,
  formatPrice,
  minutesToHeight,
  minutesToTop,
  timeToMinutes,
} from "@/lib/time-utils";

// ─── addMinutesToTime ───────────────────────────────────────────────

describe("addMinutesToTime", () => {
  it("adds minutes within the same hour", () => {
    expect(addMinutesToTime("09:00", 30)).toBe("09:30");
  });

  it("rolls over to the next hour", () => {
    expect(addMinutesToTime("09:45", 30)).toBe("10:15");
  });

  it("handles adding zero minutes", () => {
    expect(addMinutesToTime("14:30", 0)).toBe("14:30");
  });

  it("handles large additions within day", () => {
    expect(addMinutesToTime("08:00", 480)).toBe("16:00");
  });

  it("caps at 23:59 on overflow", () => {
    expect(addMinutesToTime("23:00", 120)).toBe("23:59");
  });

  it("caps at 23:59 for extreme values", () => {
    expect(addMinutesToTime("00:00", 9999)).toBe("23:59");
  });

  it("handles midnight start", () => {
    expect(addMinutesToTime("00:00", 60)).toBe("01:00");
  });
});

// ─── timeToMinutes ──────────────────────────────────────────────────

describe("timeToMinutes", () => {
  it("converts midnight", () => {
    expect(timeToMinutes("00:00")).toBe(0);
  });

  it("converts a morning time", () => {
    expect(timeToMinutes("09:30")).toBe(570);
  });

  it("converts noon", () => {
    expect(timeToMinutes("12:00")).toBe(720);
  });

  it("converts end of day", () => {
    expect(timeToMinutes("23:59")).toBe(1439);
  });

  it("converts an afternoon time", () => {
    expect(timeToMinutes("15:45")).toBe(945);
  });
});

// ─── minutesToTop ───────────────────────────────────────────────────

describe("minutesToTop", () => {
  it("returns 0 when minutes equals start hour", () => {
    expect(minutesToTop(420, 7, 72)).toBe(0); // 7*60=420
  });

  it("returns hourHeight for one hour past start", () => {
    expect(minutesToTop(480, 7, 72)).toBe(72); // 8*60=480
  });

  it("returns negative for times before start", () => {
    expect(minutesToTop(360, 7, 72)).toBe(-72); // 6*60=360
  });

  it("handles half-hour offsets", () => {
    expect(minutesToTop(450, 7, 72)).toBe(36); // 7:30 -> half of 72
  });
});

// ─── minutesToHeight ────────────────────────────────────────────────

describe("minutesToHeight", () => {
  it("returns hourHeight for a 60-minute appointment", () => {
    expect(minutesToHeight(540, 600, 72)).toBe(72);
  });

  it("returns half hourHeight for a 30-minute appointment", () => {
    expect(minutesToHeight(540, 570, 72)).toBe(36);
  });

  it("returns 0 for zero-duration", () => {
    expect(minutesToHeight(540, 540, 72)).toBe(0);
  });

  it("scales with hourHeight", () => {
    expect(minutesToHeight(0, 60, 100)).toBe(100);
    expect(minutesToHeight(0, 30, 100)).toBe(50);
  });
});

// ─── formatPrice ────────────────────────────────────────────────────

describe("formatPrice", () => {
  it("formats whole euros", () => {
    expect(formatPrice(1500)).toMatch(/15[.,]00/);
    expect(formatPrice(1500)).toContain("€");
  });

  it("formats cents correctly", () => {
    expect(formatPrice(1050)).toMatch(/10[.,]50/);
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toMatch(/0[.,]00/);
    expect(formatPrice(0)).toContain("€");
  });

  it("formats small amounts", () => {
    expect(formatPrice(50)).toMatch(/0[.,]50/);
  });
});
