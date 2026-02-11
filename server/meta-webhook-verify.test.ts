import { describe, it, expect } from "vitest";
import { verifyMetaWebhook } from "./meta-leads";

describe("Meta Webhook Verify Token", () => {
  it("should verify the webhook with the correct token", () => {
    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || "market_spas_b2b_verify";
    const result = verifyMetaWebhook("subscribe", verifyToken, "test_challenge_123");
    expect(result).toBe("test_challenge_123");
  });

  it("should reject invalid token", () => {
    const result = verifyMetaWebhook("subscribe", "wrong_token", "test_challenge_123");
    expect(result).toBeNull();
  });

  it("should reject non-subscribe mode", () => {
    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || "market_spas_b2b_verify";
    const result = verifyMetaWebhook("unsubscribe", verifyToken, "test_challenge_123");
    expect(result).toBeNull();
  });
});
