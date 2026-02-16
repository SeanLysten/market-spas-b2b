import { describe, it, expect } from "vitest";

/**
 * Tests for the SAV Dashboard stats computation logic.
 * The computeSavStats function is a pure client-side function that
 * calculates counters from the list of SAV tickets.
 */

interface SavStats {
  total: number;
  open: number;
  actionRequired: number;
  paymentPending: number;
  inProgress: number;
  shipped: number;
  resolved: number;
  urgentOrCritical: number;
}

// Mirror of the client-side computeSavStats function
function computeSavStats(services: any[]): SavStats {
  const stats: SavStats = {
    total: 0,
    open: 0,
    actionRequired: 0,
    paymentPending: 0,
    inProgress: 0,
    shipped: 0,
    resolved: 0,
    urgentOrCritical: 0,
  };
  if (!services) return stats;
  stats.total = services.length;
  for (const item of services) {
    const s = item.service;
    const status = s.status;
    if (status === "NEW" || status === "ANALYZING") stats.open++;
    if (status === "INFO_REQUIRED" || status === "QUOTE_PENDING") stats.actionRequired++;
    if (status === "PAYMENT_PENDING") stats.paymentPending++;
    if (status === "PAYMENT_CONFIRMED" || status === "PARTS_ORDERED") stats.inProgress++;
    if (status === "SHIPPED") stats.shipped++;
    if (status === "RESOLVED" || status === "CLOSED") stats.resolved++;
    if (s.urgency === "URGENT" || s.urgency === "CRITICAL") stats.urgentOrCritical++;
  }
  return stats;
}

function makeTicket(status: string, urgency: string = "NORMAL") {
  return { service: { status, urgency } };
}

describe("SAV Dashboard Stats Computation", () => {
  it("should return zero stats for empty array", () => {
    const stats = computeSavStats([]);
    expect(stats.total).toBe(0);
    expect(stats.open).toBe(0);
    expect(stats.actionRequired).toBe(0);
    expect(stats.paymentPending).toBe(0);
    expect(stats.inProgress).toBe(0);
    expect(stats.shipped).toBe(0);
    expect(stats.resolved).toBe(0);
    expect(stats.urgentOrCritical).toBe(0);
  });

  it("should return zero stats for null/undefined input", () => {
    const stats = computeSavStats(null as any);
    expect(stats.total).toBe(0);
  });

  it("should count NEW tickets as open", () => {
    const services = [makeTicket("NEW"), makeTicket("NEW")];
    const stats = computeSavStats(services);
    expect(stats.total).toBe(2);
    expect(stats.open).toBe(2);
  });

  it("should count ANALYZING tickets as open", () => {
    const services = [makeTicket("ANALYZING")];
    const stats = computeSavStats(services);
    expect(stats.open).toBe(1);
  });

  it("should count INFO_REQUIRED as action required", () => {
    const services = [makeTicket("INFO_REQUIRED")];
    const stats = computeSavStats(services);
    expect(stats.actionRequired).toBe(1);
  });

  it("should count QUOTE_PENDING as action required", () => {
    const services = [makeTicket("QUOTE_PENDING")];
    const stats = computeSavStats(services);
    expect(stats.actionRequired).toBe(1);
  });

  it("should count PAYMENT_PENDING correctly", () => {
    const services = [makeTicket("PAYMENT_PENDING"), makeTicket("PAYMENT_PENDING")];
    const stats = computeSavStats(services);
    expect(stats.paymentPending).toBe(2);
  });

  it("should count PAYMENT_CONFIRMED and PARTS_ORDERED as in progress", () => {
    const services = [makeTicket("PAYMENT_CONFIRMED"), makeTicket("PARTS_ORDERED")];
    const stats = computeSavStats(services);
    expect(stats.inProgress).toBe(2);
  });

  it("should count SHIPPED correctly", () => {
    const services = [makeTicket("SHIPPED")];
    const stats = computeSavStats(services);
    expect(stats.shipped).toBe(1);
  });

  it("should count RESOLVED and CLOSED as resolved", () => {
    const services = [makeTicket("RESOLVED"), makeTicket("CLOSED"), makeTicket("RESOLVED")];
    const stats = computeSavStats(services);
    expect(stats.resolved).toBe(3);
  });

  it("should count URGENT tickets", () => {
    const services = [makeTicket("NEW", "URGENT")];
    const stats = computeSavStats(services);
    expect(stats.urgentOrCritical).toBe(1);
  });

  it("should count CRITICAL tickets", () => {
    const services = [makeTicket("NEW", "CRITICAL")];
    const stats = computeSavStats(services);
    expect(stats.urgentOrCritical).toBe(1);
  });

  it("should NOT count NORMAL urgency as urgent", () => {
    const services = [makeTicket("NEW", "NORMAL")];
    const stats = computeSavStats(services);
    expect(stats.urgentOrCritical).toBe(0);
  });

  it("should compute correct stats for a mixed set of tickets", () => {
    const services = [
      makeTicket("NEW", "NORMAL"),
      makeTicket("NEW", "URGENT"),
      makeTicket("ANALYZING", "NORMAL"),
      makeTicket("INFO_REQUIRED", "NORMAL"),
      makeTicket("QUOTE_PENDING", "NORMAL"),
      makeTicket("PAYMENT_PENDING", "CRITICAL"),
      makeTicket("PAYMENT_CONFIRMED", "NORMAL"),
      makeTicket("PARTS_ORDERED", "NORMAL"),
      makeTicket("SHIPPED", "NORMAL"),
      makeTicket("RESOLVED", "NORMAL"),
      makeTicket("CLOSED", "URGENT"),
    ];
    const stats = computeSavStats(services);
    expect(stats.total).toBe(11);
    expect(stats.open).toBe(3);           // NEW x2 + ANALYZING
    expect(stats.actionRequired).toBe(2); // INFO_REQUIRED + QUOTE_PENDING
    expect(stats.paymentPending).toBe(1); // PAYMENT_PENDING
    expect(stats.inProgress).toBe(2);     // PAYMENT_CONFIRMED + PARTS_ORDERED
    expect(stats.shipped).toBe(1);        // SHIPPED
    expect(stats.resolved).toBe(2);       // RESOLVED + CLOSED
    expect(stats.urgentOrCritical).toBe(3); // URGENT + CRITICAL + URGENT
  });

  it("should handle all statuses summing up to total (no ticket missed)", () => {
    const services = [
      makeTicket("NEW"),
      makeTicket("ANALYZING"),
      makeTicket("INFO_REQUIRED"),
      makeTicket("QUOTE_PENDING"),
      makeTicket("PAYMENT_PENDING"),
      makeTicket("PAYMENT_CONFIRMED"),
      makeTicket("PARTS_ORDERED"),
      makeTicket("SHIPPED"),
      makeTicket("RESOLVED"),
      makeTicket("CLOSED"),
    ];
    const stats = computeSavStats(services);
    const categorized = stats.open + stats.actionRequired + stats.paymentPending + stats.inProgress + stats.shipped + stats.resolved;
    expect(categorized).toBe(stats.total);
  });
});
