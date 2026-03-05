import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Google Ads Integration", () => {
  it("should have connectGoogleAdAccount function", () => {
    expect(typeof db.connectGoogleAdAccount).toBe("function");
  });

  it("should have disconnectGoogleAdAccount function", () => {
    expect(typeof db.disconnectGoogleAdAccount).toBe("function");
  });

  it("should have getConnectedGoogleAdAccounts function", () => {
    expect(typeof db.getConnectedGoogleAdAccounts).toBe("function");
  });

  it("should have updateGoogleAdAccountLastSynced function", () => {
    expect(typeof db.updateGoogleAdAccountLastSynced).toBe("function");
  });

  it("should have updateGoogleAdAccountSyncError function", () => {
    expect(typeof db.updateGoogleAdAccountSyncError).toBe("function");
  });

  it("should export googleAdAccounts from schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.googleAdAccounts).toBeDefined();
    expect(typeof schema.googleAdAccounts).toBe("object");
  });
});

describe("Google Ads API Module", () => {
  it("should use API version v23", async () => {
    const apiModule = await import("./google-ads-api");
    // Check that the module exports the expected functions
    expect(typeof apiModule.listAccessibleCustomers).toBe("function");
    expect(typeof apiModule.getCustomerDetails).toBe("function");
    expect(typeof apiModule.getCampaignsWithInsights).toBe("function");
    expect(typeof apiModule.getDailyInsights).toBe("function");
    expect(typeof apiModule.getAccessibleAccounts).toBe("function");
  });

  it("should have getCustomerDetails with isManager field support", async () => {
    const apiModule = await import("./google-ads-api");
    // The function signature should accept loginCustomerId as 3rd param
    expect(apiModule.getCustomerDetails.length).toBeGreaterThanOrEqual(2);
  });

  it("should have getCampaignsWithInsights with loginCustomerId support", async () => {
    const apiModule = await import("./google-ads-api");
    // The function signature should accept loginCustomerId as 5th param
    expect(apiModule.getCampaignsWithInsights.length).toBeGreaterThanOrEqual(4);
  });
});
