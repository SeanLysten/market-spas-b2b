import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { createMollieClient, PaymentMethod } = require("@mollie/api-client");

const apiKey = process.env.MOLLIE_API_KEY_TEST || process.env.MOLLIE_API_KEY_LIVE;
console.log("Using API key:", apiKey ? apiKey.substring(0, 15) + "..." : "NONE");
console.log("Mode:", apiKey?.startsWith("test_") ? "TEST" : "LIVE");

const mollieClient = createMollieClient({ apiKey });

try {
  // List existing payments first
  console.log("\n--- Listing existing payments ---");
  const payments = await mollieClient.payments.page({ limit: 10 });
  console.log("Total payments found:", payments.length);
  for (const p of payments) {
    console.log(`  Payment ${p.id}: ${p.status} - ${p.amount.value} ${p.amount.currency} - ${p.description} (mode: ${p.mode})`);
  }

  // Try creating a test payment
  console.log("\n--- Creating test payment ---");
  const payment = await mollieClient.payments.create({
    amount: {
      currency: "EUR",
      value: "1.00",
    },
    description: "Test paiement diagnostic",
    redirectUrl: "https://marketspas.pro/dashboard",
    method: PaymentMethod.banktransfer,
    metadata: { test: "true" },
  });

  console.log("Payment created successfully!");
  console.log("  ID:", payment.id);
  console.log("  Status:", payment.status);
  console.log("  Checkout URL:", payment.getCheckoutUrl());
  console.log("  Profile ID:", payment.profileId);
  console.log("  Mode:", payment.mode);
  console.log("  Details:", JSON.stringify(payment.details, null, 2));
} catch (error) {
  console.error("Error:", error.message);
  if (error.statusCode) console.error("Status code:", error.statusCode);
  if (error.field) console.error("Field:", error.field);
}
