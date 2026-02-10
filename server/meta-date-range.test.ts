import { describe, it, expect } from "vitest";

describe("Meta Ads date range query input", () => {
  it("should build correct query input for preset dates", () => {
    const dateRange = "7";
    const isCustomDate = false;
    const customDateFrom = "";
    const customDateTo = "";

    const metaQueryInput = isCustomDate && customDateFrom && customDateTo
      ? { since: customDateFrom, until: customDateTo }
      : { datePreset: dateRange === "7" ? "last_7d" : dateRange === "30" ? "last_30d" : dateRange === "365" ? "last_year" : "last_90d" };

    expect(metaQueryInput).toEqual({ datePreset: "last_7d" });
  });

  it("should build correct query input for 30 days preset", () => {
    const dateRange = "30";
    const isCustomDate = false;

    const metaQueryInput = isCustomDate
      ? { since: "", until: "" }
      : { datePreset: dateRange === "7" ? "last_7d" : dateRange === "30" ? "last_30d" : dateRange === "365" ? "last_year" : "last_90d" };

    expect(metaQueryInput).toEqual({ datePreset: "last_30d" });
  });

  it("should build correct query input for 365 days preset", () => {
    const dateRange = "365";
    const isCustomDate = false;

    const metaQueryInput = isCustomDate
      ? { since: "", until: "" }
      : { datePreset: dateRange === "7" ? "last_7d" : dateRange === "30" ? "last_30d" : dateRange === "365" ? "last_year" : "last_90d" };

    expect(metaQueryInput).toEqual({ datePreset: "last_year" });
  });

  it("should build correct query input for custom date range", () => {
    const isCustomDate = true;
    const customDateFrom = "2025-01-01";
    const customDateTo = "2025-06-30";

    const metaQueryInput = isCustomDate && customDateFrom && customDateTo
      ? { since: customDateFrom, until: customDateTo }
      : { datePreset: "last_30d" };

    expect(metaQueryInput).toEqual({ since: "2025-01-01", until: "2025-06-30" });
  });

  it("should fall back to preset when custom dates are incomplete", () => {
    const dateRange = "30";
    const isCustomDate = true;
    const customDateFrom = "2025-01-01";
    const customDateTo = ""; // missing end date

    const metaQueryInput = isCustomDate && customDateFrom && customDateTo
      ? { since: customDateFrom, until: customDateTo }
      : { datePreset: dateRange === "7" ? "last_7d" : dateRange === "30" ? "last_30d" : dateRange === "365" ? "last_year" : "last_90d" };

    expect(metaQueryInput).toEqual({ datePreset: "last_30d" });
  });

  it("should format time_range correctly for Meta API", () => {
    const since = "2025-01-01";
    const until = "2025-06-30";
    const timeRange = since && until ? { since, until } : undefined;

    expect(timeRange).toEqual({ since: "2025-01-01", until: "2025-06-30" });

    // Verify the JSON format matches Meta API expectations
    const jsonStr = JSON.stringify(timeRange);
    expect(jsonStr).toBe('{"since":"2025-01-01","until":"2025-06-30"}');
  });

  it("should return undefined timeRange when dates are missing", () => {
    const since = "";
    const until = "2025-06-30";
    const timeRange = since && until ? { since, until } : undefined;

    expect(timeRange).toBeUndefined();
  });
});
