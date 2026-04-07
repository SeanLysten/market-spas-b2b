export const ENV = {
  // App
  appId: process.env.VITE_APP_ID ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  port: process.env.PORT ?? "3000",
  siteUrl: process.env.SITE_URL ?? "http://localhost:3000",
  
  // Database
  databaseUrl: process.env.DATABASE_URL ?? "",
  
  // Auth (local JWT sessions)
  cookieSecret: process.env.JWT_SECRET ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  ownerName: process.env.OWNER_NAME ?? "",
  
  // Forge API
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  frontendForgeApiUrl: process.env.VITE_FRONTEND_FORGE_API_URL ?? "",
  frontendForgeApiKey: process.env.VITE_FRONTEND_FORGE_API_KEY ?? "",
  
  // Mollie
  mollieApiKeyLive: process.env.MOLLIE_API_KEY_LIVE ?? "",
  mollieApiKeyTest: process.env.MOLLIE_API_KEY_TEST ?? "",
  mollieProfileId: process.env.MOLLIE_PROFILE_ID ?? "",
  
  // Email
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "",
  
  // Meta Ads
  metaAppId: process.env.META_APP_ID ?? "",
  metaAppSecret: process.env.META_APP_SECRET ?? "",
  metaConfigId: process.env.META_CONFIG_ID ?? "",
  metaPageAccessToken: process.env.META_PAGE_ACCESS_TOKEN ?? "",
  metaWebhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN ?? "",
  
  // Google Ads
  googleAdsClientId: process.env.GOOGLE_ADS_CLIENT_ID ?? "",
  googleAdsClientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET ?? "",
  googleAdsDeveloperToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? "",
  
  // CORS
  allowedOrigins: process.env.ALLOWED_ORIGINS ?? "",
};

/**
 * Validate critical environment variables at startup
 * Throws error in production if required variables are missing
 */
export function validateEnv() {
  const requiredVars = [
    { key: "DATABASE_URL", value: ENV.databaseUrl },
    { key: "JWT_SECRET", value: ENV.cookieSecret },
    { key: "SITE_URL", value: ENV.siteUrl },
  ];

  const missing = requiredVars.filter(v => !v.value);

  if (missing.length > 0) {
    const missingKeys = missing.map(v => v.key).join(", ");
    const message = `Missing required environment variables: ${missingKeys}`;
    
    if (ENV.isProduction) {
      console.error(`[ENV] ${message}`);
      throw new Error(message);
    } else {
      console.warn(`[ENV] Warning: ${message}`);
    }
  } else {
    console.log("[ENV] All required environment variables are set");
  }
}
