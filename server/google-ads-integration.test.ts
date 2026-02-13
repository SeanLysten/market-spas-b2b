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
