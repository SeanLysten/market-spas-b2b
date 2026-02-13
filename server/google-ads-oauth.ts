import { google } from "googleapis";
import { ENV } from "./_core/env";

/**
 * Configuration OAuth 2.0 pour Google Ads
 * 
 * Pour configurer :
 * 1. Aller sur https://console.cloud.google.com
 * 2. Créer un projet ou sélectionner un projet existant
 * 3. Activer l'API Google Ads
 * 4. Créer des identifiants OAuth 2.0 (Application Web)
 * 5. Ajouter les URLs de redirection autorisées :
 *    - http://localhost:3000/api/google-ads/callback (dev)
 *    - https://votre-domaine.com/api/google-ads/callback (prod)
 * 6. Copier le Client ID et Client Secret dans les variables d'environnement
 */

const GOOGLE_ADS_SCOPES = [
  "https://www.googleapis.com/auth/adwords", // Google Ads API
  "https://www.googleapis.com/auth/userinfo.email", // Email de l'utilisateur
  "https://www.googleapis.com/auth/userinfo.profile", // Profil de l'utilisateur
];

export function getGoogleAdsOAuthClient() {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const redirectUri = process.env.SITE_URL 
    ? `${process.env.SITE_URL}/api/google-ads/callback`
    : "http://localhost:3000/api/google-ads/callback";

  if (!clientId || !clientSecret) {
    return null; // Return null instead of throwing error
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  return oauth2Client;
}

export function getGoogleAdsAuthUrl(state?: string) {
  const oauth2Client = getGoogleAdsOAuthClient();

  if (!oauth2Client) {
    return null; // Return null if credentials not configured
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // Pour obtenir un refresh token
    scope: GOOGLE_ADS_SCOPES,
    state: state || "", // Pour la sécurité CSRF
    prompt: "consent", // Force l'affichage de l'écran de consentement pour obtenir un refresh token
  });

  return authUrl;
}

export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getGoogleAdsOAuthClient();
  
  if (!oauth2Client) {
    throw new Error("Google Ads OAuth credentials not configured");
  }

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token || null,
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getGoogleAdsOAuthClient();
  
  if (!oauth2Client) {
    throw new Error("Google Ads OAuth credentials not configured");
  }
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();

  return {
    accessToken: credentials.access_token!,
    expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
  };
}

export async function getGoogleUserInfo(accessToken: string) {
  const oauth2Client = getGoogleAdsOAuthClient();
  
  if (!oauth2Client) {
    throw new Error("Google Ads OAuth credentials not configured");
  }
  oauth2Client.setCredentials({ access_token: accessToken });

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();

  return {
    googleUserId: data.id!,
    googleUserEmail: data.email || null,
    googleUserName: data.name || null,
  };
}
