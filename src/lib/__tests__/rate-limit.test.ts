import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// ─── checkRateLimit ─────────────────────────────────────────────────

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first request", () => {
    const result = checkRateLimit("test-first-1", 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("allows multiple requests under the limit", () => {
    const ip = "test-multi-1";
    checkRateLimit(ip, 5, 60_000);
    checkRateLimit(ip, 5, 60_000);
    const result = checkRateLimit(ip, 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("blocks requests exceeding the limit", () => {
    const ip = "test-block-1";
    for (let i = 0; i < 5; i++) {
      checkRateLimit(ip, 5, 60_000);
    }
    const result = checkRateLimit(ip, 5, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after the window expires", () => {
    const ip = "test-reset-1";
    for (let i = 0; i < 5; i++) {
      checkRateLimit(ip, 5, 60_000);
    }
    // blocked
    expect(checkRateLimit(ip, 5, 60_000).allowed).toBe(false);

    // advance past window
    vi.advanceTimersByTime(61_000);

    const result = checkRateLimit(ip, 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("tracks different IPs independently", () => {
    const ip1 = "test-indep-a";
    const ip2 = "test-indep-b";

    for (let i = 0; i < 5; i++) {
      checkRateLimit(ip1, 5, 60_000);
    }
    expect(checkRateLimit(ip1, 5, 60_000).allowed).toBe(false);
    expect(checkRateLimit(ip2, 5, 60_000).allowed).toBe(true);
  });

  it("returns remaining 0 at exact limit", () => {
    const ip = "test-exact-1";
    for (let i = 0; i < 4; i++) {
      checkRateLimit(ip, 5, 60_000);
    }
    const result = checkRateLimit(ip, 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("returns resetAt in the future", () => {
    const now = Date.now();
    const result = checkRateLimit("test-reset-at-1", 5, 60_000);
    expect(result.resetAt).toBeGreaterThan(now);
  });
});

// ─── getClientIp ────────────────────────────────────────────────────

describe("getClientIp", () => {
  it("extracts IP from x-forwarded-for header", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  it("extracts IP from x-real-ip header", () => {
    const headers = new Headers({ "x-real-ip": "10.0.0.1" });
    expect(getClientIp(headers)).toBe("10.0.0.1");
  });

  it("prefers x-forwarded-for over x-real-ip", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.2.3.4",
      "x-real-ip": "10.0.0.1",
    });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  it("returns 'unknown' when no headers are present", () => {
    const headers = new Headers();
    expect(getClientIp(headers)).toBe("unknown");
  });
});
