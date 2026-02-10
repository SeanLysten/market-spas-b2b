import { describe, it, expect } from "vitest";

// Reproduce the priority logic from meta-oauth.ts
const PRIORITY_OBJECTIVES = [
  "LEAD_GENERATION", "OUTCOME_LEADS",
  "LINK_CLICKS", "OUTCOME_TRAFFIC",
  "CONVERSIONS", "OUTCOME_SALES", "OUTCOME_APP_PROMOTION",
  "PRODUCT_CATALOG_SALES",
  "MESSAGES",
  "VIDEO_VIEWS", "OUTCOME_AWARENESS",
];
const SECONDARY_OBJECTIVES = [
  "POST_ENGAGEMENT", "PAGE_LIKES", "EVENT_RESPONSES",
  "BRAND_AWARENESS", "REACH",
  "ENGAGEMENT", "OUTCOME_ENGAGEMENT",
];

function getCampaignPriority(objective: string): number {
  const upperObj = objective.toUpperCase();
  const priorityIndex = PRIORITY_OBJECTIVES.findIndex(o => upperObj.includes(o));
  if (priorityIndex !== -1) return priorityIndex;
  const secondaryIndex = SECONDARY_OBJECTIVES.findIndex(o => upperObj.includes(o));
  if (secondaryIndex !== -1) return 100 + secondaryIndex;
  return 50;
}

function getObjectiveLabel(objective: string): string {
  const labels: Record<string, string> = {
    LEAD_GENERATION: "Prospects",
    OUTCOME_LEADS: "Prospects",
    LINK_CLICKS: "Trafic",
    OUTCOME_TRAFFIC: "Trafic",
    CONVERSIONS: "Conversions",
    OUTCOME_SALES: "Ventes",
    PRODUCT_CATALOG_SALES: "Catalogue",
    MESSAGES: "Messages",
    VIDEO_VIEWS: "Vidéos",
    OUTCOME_AWARENESS: "Notoriété",
    POST_ENGAGEMENT: "Boost",
    PAGE_LIKES: "J'aime Page",
    EVENT_RESPONSES: "Événements",
    BRAND_AWARENESS: "Notoriété",
    REACH: "Couverture",
    ENGAGEMENT: "Engagement",
    OUTCOME_ENGAGEMENT: "Engagement",
    OUTCOME_APP_PROMOTION: "App",
  };
  return labels[objective.toUpperCase()] || objective;
}

describe("Campaign Priority System", () => {
  it("should prioritize LEAD_GENERATION over POST_ENGAGEMENT", () => {
    const leadGen = getCampaignPriority("LEAD_GENERATION");
    const boost = getCampaignPriority("POST_ENGAGEMENT");
    expect(leadGen).toBeLessThan(boost);
  });

  it("should prioritize OUTCOME_TRAFFIC over BRAND_AWARENESS", () => {
    const traffic = getCampaignPriority("OUTCOME_TRAFFIC");
    const brand = getCampaignPriority("BRAND_AWARENESS");
    expect(traffic).toBeLessThan(brand);
  });

  it("should prioritize CONVERSIONS over ENGAGEMENT", () => {
    const conversions = getCampaignPriority("CONVERSIONS");
    const engagement = getCampaignPriority("ENGAGEMENT");
    expect(conversions).toBeLessThan(engagement);
  });

  it("should mark priority objectives as < 100", () => {
    expect(getCampaignPriority("LEAD_GENERATION")).toBeLessThan(100);
    expect(getCampaignPriority("OUTCOME_LEADS")).toBeLessThan(100);
    expect(getCampaignPriority("LINK_CLICKS")).toBeLessThan(100);
    expect(getCampaignPriority("OUTCOME_TRAFFIC")).toBeLessThan(100);
    expect(getCampaignPriority("CONVERSIONS")).toBeLessThan(100);
    expect(getCampaignPriority("OUTCOME_SALES")).toBeLessThan(100);
  });

  it("should mark secondary objectives as >= 100", () => {
    expect(getCampaignPriority("POST_ENGAGEMENT")).toBeGreaterThanOrEqual(100);
    expect(getCampaignPriority("BRAND_AWARENESS")).toBeGreaterThanOrEqual(100);
    expect(getCampaignPriority("REACH")).toBeGreaterThanOrEqual(100);
    expect(getCampaignPriority("ENGAGEMENT")).toBeGreaterThanOrEqual(100);
  });

  it("should sort campaigns correctly by priority then spend", () => {
    const campaigns = [
      { objective: "POST_ENGAGEMENT", spend: "100" },
      { objective: "LEAD_GENERATION", spend: "50" },
      { objective: "LINK_CLICKS", spend: "200" },
      { objective: "LEAD_GENERATION", spend: "150" },
      { objective: "BRAND_AWARENESS", spend: "300" },
    ];

    campaigns.sort((a, b) => {
      const priorityA = getCampaignPriority(a.objective);
      const priorityB = getCampaignPriority(b.objective);
      if (priorityA !== priorityB) return priorityA - priorityB;
      return parseFloat(b.spend) - parseFloat(a.spend);
    });

    // LEAD_GENERATION first (sorted by spend desc)
    expect(campaigns[0].objective).toBe("LEAD_GENERATION");
    expect(campaigns[0].spend).toBe("150");
    expect(campaigns[1].objective).toBe("LEAD_GENERATION");
    expect(campaigns[1].spend).toBe("50");
    // Then LINK_CLICKS
    expect(campaigns[2].objective).toBe("LINK_CLICKS");
    // Then secondary: POST_ENGAGEMENT, BRAND_AWARENESS
    expect(campaigns[3].objective).toBe("POST_ENGAGEMENT");
    expect(campaigns[4].objective).toBe("BRAND_AWARENESS");
  });

  it("should filter campaigns with real activity only", () => {
    const allCampaigns = [
      { status: "ACTIVE", spend: 50, clicks: 10, impressions: 500, has_activity: true },
      { status: "ACTIVE", spend: 0, clicks: 0, impressions: 0, has_activity: false },
      { status: "PAUSED", spend: 30, clicks: 5, impressions: 200, has_activity: true },
      { status: "ARCHIVED", spend: 0, clicks: 0, impressions: 0, has_activity: false },
    ];

    const active = allCampaigns.filter(c => c.has_activity);
    expect(active).toHaveLength(2);
    expect(active[0].spend).toBe(50);
    expect(active[1].spend).toBe(30);
  });

  it("should return correct objective labels", () => {
    expect(getObjectiveLabel("LEAD_GENERATION")).toBe("Prospects");
    expect(getObjectiveLabel("OUTCOME_LEADS")).toBe("Prospects");
    expect(getObjectiveLabel("LINK_CLICKS")).toBe("Trafic");
    expect(getObjectiveLabel("POST_ENGAGEMENT")).toBe("Boost");
    expect(getObjectiveLabel("BRAND_AWARENESS")).toBe("Notoriété");
    expect(getObjectiveLabel("CONVERSIONS")).toBe("Conversions");
  });

  it("should return original objective for unknown types", () => {
    expect(getObjectiveLabel("SOME_NEW_OBJECTIVE")).toBe("SOME_NEW_OBJECTIVE");
  });
});
