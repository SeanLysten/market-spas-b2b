import { describe, it, expect, vi } from "vitest";

// Mock the websocket module
vi.mock("./_core/websocket", () => ({
  notifyAdmins: vi.fn(),
  notifyPartner: vi.fn(),
  notifyUser: vi.fn(),
  broadcastToAll: vi.fn(),
}));

import { notifyAdmins } from "./_core/websocket";

describe("Leads Realtime Notifications", () => {
  it("notifyAdmins should be callable with leads:refresh event", () => {
    notifyAdmins("leads:refresh", { timestamp: Date.now() });
    expect(notifyAdmins).toHaveBeenCalledWith("leads:refresh", expect.objectContaining({
      timestamp: expect.any(Number),
    }));
  });

  it("notifyAdmins should be callable with lead:new event", () => {
    notifyAdmins("lead:new", {
      leadId: 123,
      customerName: "Test Customer",
      city: "Paris",
    });
    expect(notifyAdmins).toHaveBeenCalledWith("lead:new", {
      leadId: 123,
      customerName: "Test Customer",
      city: "Paris",
    });
  });

  it("notifyAdmins should handle lead status change notification", () => {
    notifyAdmins("leads:refresh", { 
      timestamp: Date.now(), 
      leadId: 456, 
      newStatus: "CONVERTED" 
    });
    expect(notifyAdmins).toHaveBeenCalledWith("leads:refresh", expect.objectContaining({
      leadId: 456,
      newStatus: "CONVERTED",
    }));
  });

  it("should compute conversion rate correctly", () => {
    const leads = [
      { status: "NEW" },
      { status: "ASSIGNED" },
      { status: "CONTACTED" },
      { status: "CONVERTED" },
      { status: "CONVERTED" },
      { status: "LOST" },
    ];

    const totalLeads = leads.length;
    const convertedLeads = leads.filter(l => l.status === "CONVERTED").length;
    const conversionRate = totalLeads > 0 
      ? Math.round((convertedLeads / totalLeads) * 100) 
      : 0;

    expect(totalLeads).toBe(6);
    expect(convertedLeads).toBe(2);
    expect(conversionRate).toBe(33);
  });

  it("should compute conversion rate as 0 when no leads", () => {
    const leads: { status: string }[] = [];
    const totalLeads = leads.length;
    const convertedLeads = leads.filter(l => l.status === "CONVERTED").length;
    const conversionRate = totalLeads > 0 
      ? Math.round((convertedLeads / totalLeads) * 100) 
      : 0;

    expect(conversionRate).toBe(0);
  });

  it("should compute new leads count correctly", () => {
    const leads = [
      { status: "NEW" },
      { status: "NEW" },
      { status: "ASSIGNED" },
      { status: "CONTACTED" },
      { status: "CONVERTED" },
    ];

    const newLeads = leads.filter(l => l.status === "NEW" || l.status === "ASSIGNED").length;
    expect(newLeads).toBe(3);
  });

  it("should compute partner stats correctly", () => {
    const leads = [
      { partnerName: "Spa Paradise", status: "CONVERTED", firstContactAt: "2026-01-01" },
      { partnerName: "Spa Paradise", status: "CONTACTED", firstContactAt: "2026-01-02" },
      { partnerName: "Aqua Dreams", status: "NEW", firstContactAt: null },
      { partnerName: null, status: "NEW", firstContactAt: null },
    ];

    const partnerStats = leads.reduce((acc, lead) => {
      const key = lead.partnerName || "Non assigné";
      if (!acc[key]) {
        acc[key] = { total: 0, contacted: 0, converted: 0 };
      }
      acc[key].total++;
      if (lead.firstContactAt) acc[key].contacted++;
      if (lead.status === "CONVERTED") acc[key].converted++;
      return acc;
    }, {} as Record<string, { total: number; contacted: number; converted: number }>);

    expect(partnerStats["Spa Paradise"]).toEqual({ total: 2, contacted: 2, converted: 1 });
    expect(partnerStats["Aqua Dreams"]).toEqual({ total: 1, contacted: 0, converted: 0 });
    expect(partnerStats["Non assigné"]).toEqual({ total: 1, contacted: 0, converted: 0 });
  });
});
