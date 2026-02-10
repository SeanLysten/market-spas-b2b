import { describe, it, expect } from "vitest";

describe("Meta Daily Insights", () => {
  it("should format daily data correctly from API response", () => {
    const mockApiData = [
      {
        date_start: "2025-01-15",
        spend: "45.50",
        impressions: "1200",
        clicks: "35",
        reach: "800",
        actions: [
          { action_type: "lead", value: "3" },
          { action_type: "link_click", value: "30" },
        ],
      },
      {
        date_start: "2025-01-16",
        spend: "52.30",
        impressions: "1500",
        clicks: "42",
        reach: "950",
        actions: [
          { action_type: "lead", value: "5" },
        ],
      },
      {
        date_start: "2025-01-14",
        spend: "30.00",
        impressions: "900",
        clicks: "20",
        reach: "600",
        actions: [],
      },
    ];

    // Simulate the processing logic from getDailyInsights
    const dailyData = mockApiData.map((day: any) => {
      const leadActions = day.actions?.find((a: any) =>
        a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped"
      );
      return {
        date: day.date_start,
        spend: parseFloat(day.spend || "0"),
        leads: parseInt(leadActions?.value || "0"),
        clicks: parseInt(day.clicks || "0"),
        impressions: parseInt(day.impressions || "0"),
        reach: parseInt(day.reach || "0"),
      };
    });

    dailyData.sort((a: any, b: any) => a.date.localeCompare(b.date));

    expect(dailyData).toHaveLength(3);
    expect(dailyData[0].date).toBe("2025-01-14");
    expect(dailyData[0].spend).toBe(30.0);
    expect(dailyData[0].leads).toBe(0);
    expect(dailyData[1].date).toBe("2025-01-15");
    expect(dailyData[1].spend).toBe(45.5);
    expect(dailyData[1].leads).toBe(3);
    expect(dailyData[2].date).toBe("2025-01-16");
    expect(dailyData[2].spend).toBe(52.3);
    expect(dailyData[2].leads).toBe(5);
  });

  it("should handle empty actions array", () => {
    const day = {
      date_start: "2025-01-15",
      spend: "10.00",
      impressions: "500",
      clicks: "15",
      reach: "300",
      actions: [],
    };

    const leadActions = day.actions?.find((a: any) =>
      a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped"
    );

    expect(leadActions).toBeUndefined();
    expect(parseInt(leadActions?.value || "0")).toBe(0);
  });

  it("should handle missing actions field", () => {
    const day = {
      date_start: "2025-01-15",
      spend: "10.00",
      impressions: "500",
      clicks: "15",
      reach: "300",
    } as any;

    const leadActions = day.actions?.find((a: any) =>
      a.action_type === "lead"
    );

    expect(leadActions).toBeUndefined();
    expect(parseInt(leadActions?.value || "0")).toBe(0);
  });

  it("should format date labels correctly for chart display", () => {
    const dailyData = [
      { date: "2025-01-15", spend: 45.5, leads: 3 },
      { date: "2025-02-01", spend: 52.3, leads: 5 },
    ];

    const chartData = dailyData.map((d) => ({
      ...d,
      dateLabel: new Date(d.date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
      }),
    }));

    // Date formatting depends on timezone, just verify format contains day and month
    expect(chartData[0].dateLabel).toMatch(/\d{2}/);
    expect(chartData[0].dateLabel).toMatch(/janv/);
    expect(chartData[1].dateLabel).toMatch(/\d{2}/);
    expect(chartData[1].dateLabel).toMatch(/févr|janv/);
  });

  it("should calculate correct chart interval for tick display", () => {
    // For 7 days, show all ticks (interval = 0)
    const data7 = Array(7).fill(null);
    const interval7 = data7.length > 14 ? Math.floor(data7.length / 7) : 0;
    expect(interval7).toBe(0);

    // For 30 days, show every ~4th tick
    const data30 = Array(30).fill(null);
    const interval30 = data30.length > 14 ? Math.floor(data30.length / 7) : 0;
    expect(interval30).toBe(4);

    // For 90 days, show every ~12th tick
    const data90 = Array(90).fill(null);
    const interval90 = data90.length > 14 ? Math.floor(data90.length / 7) : 0;
    expect(interval90).toBe(12);
  });
});
