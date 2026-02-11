import { describe, expect, it } from "vitest";
import { mapStatus } from "@/lib/stripe-utils";

describe("mapStatus", () => {
  it("maps 'active' to 'active'", () => {
    expect(mapStatus("active")).toBe("active");
  });

  it("maps 'past_due' to 'past_due'", () => {
    expect(mapStatus("past_due")).toBe("past_due");
  });

  it("maps 'canceled' (Stripe spelling) to 'cancelled'", () => {
    expect(mapStatus("canceled")).toBe("cancelled");
  });

  it("maps 'cancelled' (British spelling) to 'cancelled'", () => {
    expect(mapStatus("cancelled")).toBe("cancelled");
  });

  it("maps 'trialing' to 'trialing'", () => {
    expect(mapStatus("trialing")).toBe("trialing");
  });

  it("maps 'incomplete' to 'incomplete'", () => {
    expect(mapStatus("incomplete")).toBe("incomplete");
  });

  it("maps 'incomplete_expired' to 'incomplete'", () => {
    expect(mapStatus("incomplete_expired")).toBe("incomplete");
  });

  it("maps 'unpaid' to 'past_due'", () => {
    expect(mapStatus("unpaid")).toBe("past_due");
  });

  it("maps 'paused' to 'past_due'", () => {
    expect(mapStatus("paused")).toBe("past_due");
  });

  it("maps unknown status to 'incomplete'", () => {
    expect(mapStatus("something_unexpected")).toBe("incomplete");
  });

  it("maps empty string to 'incomplete'", () => {
    expect(mapStatus("")).toBe("incomplete");
  });
});
