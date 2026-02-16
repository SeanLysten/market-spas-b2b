import { describe, it, expect } from "vitest";

/**
 * Tests for the SAV Dashboard stats computation logic.
 * The computeSavStats function is a pure client-side function that
 * calculates counters from the list of SAV tickets.
 * 
 * DB status enum: NEW, ANALYZING, INFO_REQUIRED, QUOTE_PENDING,
 * PAYMENT_CONFIRMED, PREPARING, SHIPPED, RESOLVED, CLOSED,
 * IN_PROGRESS, WAITING_PARTS
 */

interface SavStats {
  total: number;
  open: number;
  actionRequired: number;
  quotePending: number;
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
    quotePending: 0,
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
    if (status === "INFO_REQUIRED") stats.actionRequired++;
    if (status === "QUOTE_PENDING") stats.quotePending++;
    if (status === "PAYMENT_CONFIRMED" || status === "WAITING_PARTS" || status === "PREPARING" || status === "IN_PROGRESS") stats.inProgress++;
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
    expect(stats.quotePending).toBe(0);
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

  it("should count QUOTE_PENDING as quote pending", () => {
    const services = [makeTicket("QUOTE_PENDING"), makeTicket("QUOTE_PENDING")];
    const stats = computeSavStats(services);
    expect(stats.quotePending).toBe(2);
  });

  it("should count PAYMENT_CONFIRMED as in progress", () => {
    const services = [makeTicket("PAYMENT_CONFIRMED")];
    const stats = computeSavStats(services);
    expect(stats.inProgress).toBe(1);
  });

  it("should count WAITING_PARTS as in progress", () => {
    const services = [makeTicket("WAITING_PARTS")];
    const stats = computeSavStats(services);
    expect(stats.inProgress).toBe(1);
  });

  it("should count PREPARING as in progress", () => {
    const services = [makeTicket("PREPARING")];
    const stats = computeSavStats(services);
    expect(stats.inProgress).toBe(1);
  });

  it("should count IN_PROGRESS as in progress", () => {
    const services = [makeTicket("IN_PROGRESS")];
    const stats = computeSavStats(services);
    expect(stats.inProgress).toBe(1);
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

  it("should compute correct stats for the actual test data set (20 tickets)", () => {
    // Mirrors the seed-sav.mjs data:
    // NEW: 2, ANALYZING: 2, INFO_REQUIRED: 1, QUOTE_PENDING: 4,
    // PAYMENT_CONFIRMED: 2, WAITING_PARTS: 2, SHIPPED: 2, RESOLVED: 3, CLOSED: 2
    // Urgencies: URGENT x5, CRITICAL x2
    const services = [
      makeTicket("NEW", "URGENT"),       // SAV-0001 partner1
      makeTicket("ANALYZING", "CRITICAL"), // SAV-0002 partner1
      makeTicket("INFO_REQUIRED"),        // SAV-0003 partner1
      makeTicket("QUOTE_PENDING"),        // SAV-0004 partner1
      makeTicket("QUOTE_PENDING"),        // SAV-0005 partner2
      makeTicket("QUOTE_PENDING"),        // SAV-0006 partner2
      makeTicket("PAYMENT_CONFIRMED", "URGENT"), // SAV-0007 partner2
      makeTicket("WAITING_PARTS"),        // SAV-0008 partner2
      makeTicket("SHIPPED"),              // SAV-0009 partner3
      makeTicket("SHIPPED", "URGENT"),    // SAV-0010 partner3
      makeTicket("RESOLVED"),             // SAV-0011 partner3
      makeTicket("RESOLVED", "CRITICAL"), // SAV-0012 partner3
      makeTicket("CLOSED"),              // SAV-0013 partner4
      makeTicket("CLOSED"),              // SAV-0014 partner4
      makeTicket("NEW"),                 // SAV-0015 partner4
      makeTicket("QUOTE_PENDING"),        // SAV-0016 partner2
      makeTicket("WAITING_PARTS", "URGENT"), // SAV-0017 partner3
      makeTicket("PAYMENT_CONFIRMED"),    // SAV-0018 partner1
      makeTicket("ANALYZING", "URGENT"),  // SAV-0019 partner4
      makeTicket("RESOLVED"),             // SAV-0020 partner2
    ];
    const stats = computeSavStats(services);
    expect(stats.total).toBe(20);
    expect(stats.open).toBe(4);           // NEW x2 + ANALYZING x2
    expect(stats.actionRequired).toBe(1); // INFO_REQUIRED x1
    expect(stats.quotePending).toBe(4);   // QUOTE_PENDING x4
    expect(stats.inProgress).toBe(4);     // PAYMENT_CONFIRMED x2 + WAITING_PARTS x2
    expect(stats.shipped).toBe(2);        // SHIPPED x2
    expect(stats.resolved).toBe(5);       // RESOLVED x3 + CLOSED x2
    expect(stats.urgentOrCritical).toBe(7); // URGENT: SAV-0001, SAV-0007, SAV-0010, SAV-0017, SAV-0019 = 5 + CRITICAL: SAV-0002, SAV-0012 = 2 => total 7
  });

  it("should handle all DB statuses summing up to total (no ticket missed)", () => {
    const services = [
      makeTicket("NEW"),
      makeTicket("ANALYZING"),
      makeTicket("INFO_REQUIRED"),
      makeTicket("QUOTE_PENDING"),
      makeTicket("PAYMENT_CONFIRMED"),
      makeTicket("PREPARING"),
      makeTicket("WAITING_PARTS"),
      makeTicket("IN_PROGRESS"),
      makeTicket("SHIPPED"),
      makeTicket("RESOLVED"),
      makeTicket("CLOSED"),
    ];
    const stats = computeSavStats(services);
    const categorized = stats.open + stats.actionRequired + stats.quotePending + stats.inProgress + stats.shipped + stats.resolved;
    expect(categorized).toBe(stats.total);
  });
});
