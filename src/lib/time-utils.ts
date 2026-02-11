/**
 * Shared time/price utility functions.
 * Extracted from booking-wizard, walk-in-dialog, day-view, appointment-sheet
 * to avoid duplication and enable unit testing.
 */

/** Add minutes to an "HH:MM" time string, capping at 23:59. */
export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59);
  const newH = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const newM = (total % 60).toString().padStart(2, "0");
  return `${newH}:${newM}`;
}

/** Convert "HH:MM" to total minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Convert minutes-since-midnight to a CSS top offset in px. */
export function minutesToTop(minutes: number, startHour: number, hourHeight: number): number {
  return ((minutes - startHour * 60) / 60) * hourHeight;
}

/** Compute the CSS height in px from a start/end pair (in minutes). */
export function minutesToHeight(startMin: number, endMin: number, hourHeight: number): number {
  return ((endMin - startMin) / 60) * hourHeight;
}

/** Format EUR cents as Italian-locale currency string. */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
