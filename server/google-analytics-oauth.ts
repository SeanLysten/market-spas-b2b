import { google } from "googleapis";

/**
 * Configuration OAuth 2.0 pour Google Analytics 4
 *
 * Scopes requis :
 *  - analytics.readonly  → lire les rapports GA4 via la Data API
 *  - userinfo.email / userinfo.profile → identifier le compte Google
 *
 * Redirect URI à ajouter dans la Google Cloud Console :
 *  - http://localhost:3000/api/google-analytics/callback  (dev)
 *  - https://votre-domaine.com/api/google-analytics/callback  (prod)
 *
 * Le même Client ID / Secret que Google Ads peut être réutilisé si les
 * scopes Analytics sont activés sur le même projet GCP.
 */

const GA4_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export function getGa4OAuthClient() {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const redirectUri = process.env.SITE_URL
    ? `${process.env.SITE_URL}/api/google-analytics/callback`
    : "http://localhost:3000/api/google-analytics/callback";

  if (!clientId || !clientSecret) return null;

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGa4AuthUrl(state?: string) {
  const client = getGa4OAuthClient();
  if (!client) return null;

  return client.generateAuthUrl({
    access_type: "offline",
    scope: GA4_SCOPES,
    state: state || "",
    prompt: "consent",
  });
}

export async function exchangeGa4CodeForTokens(code: string) {
  const client = getGa4OAuthClient();
  if (!client) throw new Error("Google Analytics OAuth credentials not configured");

  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token || null,
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  };
}

export async function refreshGa4AccessToken(refreshToken: string) {
  const client = getGa4OAuthClient();
  if (!client) throw new Error("Google Analytics OAuth credentials not configured");

  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();
  return {
    accessToken: credentials.access_token!,
    expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
  };
}

export async function getGoogleUserInfoForGa4(accessToken: string) {
  const client = getGa4OAuthClient();
  if (!client) throw new Error("Google Analytics OAuth credentials not configured");

  client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get();
  return {
    googleUserId: data.id!,
    googleUserEmail: data.email || null,
    googleUserName: data.name || null,
  };
}
