import { describe, it, expect } from "vitest";

describe("META_PAGE_ACCESS_TOKEN validation", () => {
  it("should be set and non-empty", () => {
    const token = process.env.META_PAGE_ACCESS_TOKEN;
    expect(token).toBeDefined();
    expect(token!.length).toBeGreaterThan(50);
  });

  it("should be a valid token that can access the Graph API", async () => {
    const token = process.env.META_PAGE_ACCESS_TOKEN;
    const res = await fetch(
      `https://graph.facebook.com/v24.0/debug_token?input_token=${token}&access_token=${token}`
    );
    const data = await res.json();
    expect(data.data).toBeDefined();
    expect(data.data.is_valid).toBe(true);
    expect(data.data.app_id).toBe("1228586458787257");
    // Should not expire (permanent token)
    expect(data.data.expires_at).toBe(0);
  });

  it("should have leads_retrieval permission", async () => {
    const token = process.env.META_PAGE_ACCESS_TOKEN;
    const res = await fetch(
      `https://graph.facebook.com/v24.0/debug_token?input_token=${token}&access_token=${token}`
    );
    const data = await res.json();
    expect(data.data.scopes).toContain("leads_retrieval");
    expect(data.data.scopes).toContain("pages_read_engagement");
    expect(data.data.scopes).toContain("pages_manage_ads");
  });

  it("should be able to access Market Spa page", async () => {
    const token = process.env.META_PAGE_ACCESS_TOKEN;
    const res = await fetch(
      `https://graph.facebook.com/v24.0/1656566307905615?fields=id,name&access_token=${token}`
    );
    const data = await res.json();
    expect(data.id).toBe("1656566307905615");
    expect(data.name).toBe("Market Spa");
  });

  it("should be able to get page tokens via me/accounts", async () => {
    const token = process.env.META_PAGE_ACCESS_TOKEN;
    const res = await fetch(
      `https://graph.facebook.com/v24.0/me/accounts?fields=id,name&access_token=${token}`
    );
    const data = await res.json();
    expect(data.data).toBeDefined();
    expect(data.data.length).toBeGreaterThan(0);
    const pageNames = data.data.map((p: any) => p.name);
    expect(pageNames).toContain("Market Spa");
    expect(pageNames).toContain("Market spas - Online store");
  });
});
