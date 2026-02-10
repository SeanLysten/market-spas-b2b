import { describe, it, expect } from "vitest";

describe("Meta Comparison Insights", () => {
  // Simulate the getPeriodInsights aggregation logic
  function aggregatePeriodInsights(entries: any[]) {
    let spend = 0, leads = 0, clicks = 0, impressions = 0, reach = 0;
    let ctr = 0, cpc = 0, cpm = 0, frequency = 0;

    for (const entry of entries) {
      spend += parseFloat(entry.spend || "0");
      clicks += parseInt(entry.clicks || "0");
      impressions += parseInt(entry.impressions || "0");
      reach += parseInt(entry.reach || "0");

      const leadActions = entry.actions?.find((a: any) =>
        a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped"
      );
      leads += parseInt(leadActions?.value || "0");
    }

    ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    cpc = clicks > 0 ? spend / clicks : 0;
    cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    frequency = reach > 0 ? impressions / reach : 0;
    const costPerLead = leads > 0 ? spend / leads : 0;

    return { spend, leads, clicks, impressions, reach, ctr, cpc, cpm, frequency, costPerLead };
  }

  // Simulate the percentage change calculation from the frontend
  function calcChange(curr: number, prev: number): number {
    if (prev === 0 && curr === 0) return 0;
    if (prev === 0) return 100;
    return ((curr - prev) / prev) * 100;
  }

  it("should aggregate period insights correctly from multiple entries", () => {
    const entries = [
      {
        spend: "100.50",
        impressions: "5000",
        clicks: "150",
        reach: "3000",
        actions: [
          { action_type: "lead", value: "5" },
          { action_type: "link_click", value: "120" },
        ],
      },
      {
        spend: "75.25",
        impressions: "3500",
        clicks: "100",
        reach: "2000",
        actions: [
          { action_type: "lead", value: "3" },
        ],
      },
    ];

    const result = aggregatePeriodInsights(entries);

    expect(result.spend).toBeCloseTo(175.75, 2);
    expect(result.leads).toBe(8);
    expect(result.clicks).toBe(250);
    expect(result.impressions).toBe(8500);
    expect(result.reach).toBe(5000);
    expect(result.ctr).toBeCloseTo((250 / 8500) * 100, 4);
    expect(result.cpc).toBeCloseTo(175.75 / 250, 4);
    expect(result.cpm).toBeCloseTo((175.75 / 8500) * 1000, 4);
    expect(result.frequency).toBeCloseTo(8500 / 5000, 4);
    expect(result.costPerLead).toBeCloseTo(175.75 / 8, 4);
  });

  it("should handle empty entries array", () => {
    const result = aggregatePeriodInsights([]);

    expect(result.spend).toBe(0);
    expect(result.leads).toBe(0);
    expect(result.clicks).toBe(0);
    expect(result.impressions).toBe(0);
    expect(result.reach).toBe(0);
    expect(result.ctr).toBe(0);
    expect(result.cpc).toBe(0);
    expect(result.cpm).toBe(0);
    expect(result.frequency).toBe(0);
    expect(result.costPerLead).toBe(0);
  });

  it("should handle entries with no actions", () => {
    const entries = [
      {
        spend: "50.00",
        impressions: "2000",
        clicks: "60",
        reach: "1500",
        actions: [],
      },
    ];

    const result = aggregatePeriodInsights(entries);

    expect(result.spend).toBe(50);
    expect(result.leads).toBe(0);
    expect(result.clicks).toBe(60);
    expect(result.costPerLead).toBe(0);
  });

  it("should handle entries with onsite_conversion.lead_grouped action type", () => {
    const entries = [
      {
        spend: "80.00",
        impressions: "4000",
        clicks: "120",
        reach: "2500",
        actions: [
          { action_type: "onsite_conversion.lead_grouped", value: "7" },
        ],
      },
    ];

    const result = aggregatePeriodInsights(entries);

    expect(result.leads).toBe(7);
    expect(result.costPerLead).toBeCloseTo(80 / 7, 4);
  });

  it("should calculate percentage change correctly for positive increase", () => {
    expect(calcChange(150, 100)).toBeCloseTo(50, 1);
  });

  it("should calculate percentage change correctly for decrease", () => {
    expect(calcChange(75, 100)).toBeCloseTo(-25, 1);
  });

  it("should return 0 when both values are 0", () => {
    expect(calcChange(0, 0)).toBe(0);
  });

  it("should return 100 when previous value is 0 and current is positive", () => {
    expect(calcChange(50, 0)).toBe(100);
  });

  it("should return -100 when current value drops to 0", () => {
    expect(calcChange(0, 100)).toBe(-100);
  });

  it("should handle large percentage increases", () => {
    expect(calcChange(1000, 10)).toBeCloseTo(9900, 1);
  });

  it("should correctly identify cost metrics where decrease is positive", () => {
    // For cost metrics (spend, CPC, CPM, CPL), a decrease is good
    const costMetrics = ["spend", "cpc", "cpm", "costPerLead", "frequency"];
    const performanceMetrics = ["leads", "clicks", "impressions", "reach", "ctr"];

    // When cost decreases, invertColor=true means isPositive when change <= 0
    const spendChange = calcChange(80, 100); // -20%
    expect(spendChange).toBeLessThan(0);
    // invertColor = true → isPositive = change <= 0 → true (green)
    expect(spendChange <= 0).toBe(true);

    // When leads increase, invertColor=false means isPositive when change >= 0
    const leadsChange = calcChange(15, 10); // +50%
    expect(leadsChange).toBeGreaterThan(0);
    // invertColor = false → isPositive = change >= 0 → true (green)
    expect(leadsChange >= 0).toBe(true);
  });

  it("should compute comparison periods correctly for 'previous' mode", () => {
    const currentSince = "2026-01-11";
    const currentUntil = "2026-02-10";

    // Calculate previous period
    const daysDiff = Math.ceil(
      (new Date(currentUntil).getTime() - new Date(currentSince).getTime()) / (1000 * 60 * 60 * 24)
    );
    const prevEnd = new Date(currentSince);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - daysDiff);

    const prevSince = prevStart.toISOString().split("T")[0];
    const prevUntil = prevEnd.toISOString().split("T")[0];

    expect(daysDiff).toBe(30);
    expect(prevUntil).toBe("2026-01-10");
    // Previous period should be 30 days before the current start
    expect(prevSince).toBe("2025-12-11");
  });

  it("should compute comparison periods correctly for 'year' mode", () => {
    const currentSince = "2026-01-01";
    const currentUntil = "2026-01-31";

    const prevStartDate = new Date(currentSince);
    prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);
    const prevEndDate = new Date(currentUntil);
    prevEndDate.setFullYear(prevEndDate.getFullYear() - 1);

    const prevSince = prevStartDate.toISOString().split("T")[0];
    const prevUntil = prevEndDate.toISOString().split("T")[0];

    expect(prevSince).toBe("2025-01-01");
    expect(prevUntil).toBe("2025-01-31");
  });

  it("should format comparison bar chart data correctly", () => {
    const current = { spend: 500, leads: 20, clicks: 300, ctr: 3.5, cpc: 1.67, costPerLead: 25 };
    const previous = { spend: 400, leads: 15, clicks: 250, ctr: 3.0, cpc: 1.60, costPerLead: 26.67 };

    const chartData = [
      { name: "Dépenses (€)", current: current.spend, previous: previous.spend },
      { name: "Leads", current: current.leads, previous: previous.leads },
      { name: "Clics", current: current.clicks, previous: previous.clicks },
      { name: "CTR (%)", current: parseFloat(current.ctr.toFixed(2)), previous: parseFloat(previous.ctr.toFixed(2)) },
      { name: "CPC (€)", current: parseFloat(current.cpc.toFixed(2)), previous: parseFloat(previous.cpc.toFixed(2)) },
      { name: "CPL (€)", current: parseFloat(current.costPerLead.toFixed(2)), previous: parseFloat(previous.costPerLead.toFixed(2)) },
    ];

    expect(chartData).toHaveLength(6);
    expect(chartData[0].name).toBe("Dépenses (€)");
    expect(chartData[0].current).toBe(500);
    expect(chartData[0].previous).toBe(400);
    expect(chartData[1].name).toBe("Leads");
    expect(chartData[1].current).toBe(20);
    expect(chartData[5].name).toBe("CPL (€)");
    expect(chartData[5].current).toBe(25);
    expect(chartData[5].previous).toBe(26.67);
  });

  it("should handle comparison with all-zero previous period", () => {
    const current = { spend: 100, leads: 5, clicks: 50, impressions: 2000, reach: 1500 };
    const previous = { spend: 0, leads: 0, clicks: 0, impressions: 0, reach: 0 };

    const metrics = [
      { key: "spend", invertColor: true },
      { key: "leads", invertColor: false },
      { key: "clicks", invertColor: false },
    ];

    for (const metric of metrics) {
      const currVal = (current as any)[metric.key];
      const prevVal = (previous as any)[metric.key];
      const change = calcChange(currVal, prevVal);

      // When previous is 0, change should be 100%
      expect(change).toBe(100);
    }
  });

  it("should handle comparison with all-zero current period", () => {
    const current = { spend: 0, leads: 0, clicks: 0 };
    const previous = { spend: 100, leads: 5, clicks: 50 };

    const spendChange = calcChange(current.spend, previous.spend);
    expect(spendChange).toBe(-100);

    const leadsChange = calcChange(current.leads, previous.leads);
    expect(leadsChange).toBe(-100);
  });
});
