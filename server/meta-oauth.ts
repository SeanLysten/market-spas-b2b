/**
 * Meta OAuth & Marketing API Integration
 * 
 * Ce module gère :
 * 1. Le flux OAuth pour connecter un compte publicitaire Meta
 * 2. L'échange de tokens (short-lived → long-lived)
 * 3. La récupération des comptes publicitaires
 * 4. La récupération des campagnes et insights
 * 5. La synchronisation automatique des données
 */

const META_GRAPH_VERSION = "v21.0";

interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface MetaAdAccount {
  id: string;
  name: string;
  account_id: string;
  account_status: number;
  currency: string;
  timezone_name: string;
  amount_spent: string;
}

interface MetaCampaignInsight {
  campaign_id: string;
  campaign_name: string;
  status: string;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  spend: string;
  impressions: string;
  clicks: string;
  ctr: string;
  cpc: string;
  cpm: string;
  reach: string;
  actions?: Array<{ action_type: string; value: string }>;
  date_start: string;
  date_stop: string;
}

/**
 * Génère l'URL d'autorisation OAuth Meta
 */
export function getMetaOAuthUrl(redirectUri: string, state: string): string {
  const appId = process.env.META_APP_ID;
  if (!appId) throw new Error("META_APP_ID non configuré");

  const scopes = [
    "ads_read",
    "ads_management",
    "business_management",
    "pages_read_engagement",
    "leads_retrieval",
  ].join(",");

  return `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth?` +
    `client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scopes}` +
    `&state=${state}` +
    `&response_type=code`;
}

/**
 * Échange le code d'autorisation contre un token d'accès
 */
export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<MetaTokenResponse> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  
  if (!appId || !appSecret) {
    throw new Error("META_APP_ID ou META_APP_SECRET non configuré");
  }

  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token?` +
    `client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&client_secret=${appSecret}` +
    `&code=${code}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    console.error("[Meta OAuth] Erreur échange token:", error);
    throw new Error(error.error?.message || "Erreur échange token Meta");
  }

  return response.json();
}

/**
 * Échange un token short-lived contre un token long-lived (60 jours)
 */
export async function getLongLivedToken(shortLivedToken: string): Promise<MetaTokenResponse> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  
  if (!appId || !appSecret) {
    throw new Error("META_APP_ID ou META_APP_SECRET non configuré");
  }

  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token?` +
    `grant_type=fb_exchange_token` +
    `&client_id=${appId}` +
    `&client_secret=${appSecret}` +
    `&fb_exchange_token=${shortLivedToken}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    console.error("[Meta OAuth] Erreur long-lived token:", error);
    throw new Error(error.error?.message || "Erreur long-lived token Meta");
  }

  return response.json();
}

/**
 * Récupère les informations de l'utilisateur Meta connecté
 */
export async function getMetaUserInfo(accessToken: string): Promise<{ id: string; name: string; email?: string }> {
  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/me?fields=id,name,email&access_token=${accessToken}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Erreur récupération profil Meta");
  }

  return response.json();
}

/**
 * Récupère les comptes publicitaires accessibles par l'utilisateur
 */
export async function getAdAccounts(accessToken: string): Promise<MetaAdAccount[]> {
  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/me/adaccounts?` +
    `fields=id,name,account_id,account_status,currency,timezone_name,amount_spent` +
    `&access_token=${accessToken}` +
    `&limit=100`;

  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    console.error("[Meta] Erreur récupération comptes pub:", error);
    throw new Error(error.error?.message || "Erreur récupération comptes publicitaires");
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Récupère les campagnes d'un compte publicitaire avec leurs insights
 */
export async function getCampaignsWithInsights(
  adAccountId: string,
  accessToken: string,
  datePreset: string = "last_30d"
): Promise<MetaCampaignInsight[]> {
  // Récupérer les campagnes
  const campaignsUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${adAccountId}/campaigns?` +
    `fields=id,name,status,objective,daily_budget,lifetime_budget` +
    `&access_token=${accessToken}` +
    `&limit=100`;

  const campaignsResponse = await fetch(campaignsUrl);
  
  if (!campaignsResponse.ok) {
    const error = await campaignsResponse.json();
    console.error("[Meta] Erreur récupération campagnes:", error);
    throw new Error(error.error?.message || "Erreur récupération campagnes");
  }

  const campaignsData = await campaignsResponse.json();
  const campaigns = campaignsData.data || [];

  // Récupérer les insights pour chaque campagne
  const insightsUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${adAccountId}/insights?` +
    `fields=campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,actions` +
    `&level=campaign` +
    `&date_preset=${datePreset}` +
    `&access_token=${accessToken}` +
    `&limit=500`;

  const insightsResponse = await fetch(insightsUrl);
  
  let insightsMap: Record<string, any> = {};
  if (insightsResponse.ok) {
    const insightsData = await insightsResponse.json();
    for (const insight of (insightsData.data || [])) {
      insightsMap[insight.campaign_id] = insight;
    }
  }

  // Combiner campagnes et insights
  return campaigns.map((campaign: any) => {
    const insight = insightsMap[campaign.id] || {};
    const leadActions = insight.actions?.find((a: any) => 
      a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped"
    );

    return {
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      status: campaign.status,
      objective: campaign.objective || "",
      daily_budget: campaign.daily_budget,
      lifetime_budget: campaign.lifetime_budget,
      spend: insight.spend || "0",
      impressions: insight.impressions || "0",
      clicks: insight.clicks || "0",
      ctr: insight.ctr || "0",
      cpc: insight.cpc || "0",
      cpm: insight.cpm || "0",
      reach: insight.reach || "0",
      leads: leadActions?.value || "0",
      actions: insight.actions || [],
      date_start: insight.date_start || "",
      date_stop: insight.date_stop || "",
    };
  });
}

/**
 * Vérifie si un token est encore valide
 */
export async function validateToken(accessToken: string): Promise<boolean> {
  try {
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/me?access_token=${accessToken}`;
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Récupère les informations de débogage d'un token
 */
export async function debugToken(accessToken: string): Promise<{
  isValid: boolean;
  expiresAt: number;
  scopes: string[];
}> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  
  if (!appId || !appSecret) {
    throw new Error("META_APP_ID ou META_APP_SECRET non configuré");
  }

  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/debug_token?` +
    `input_token=${accessToken}` +
    `&access_token=${appId}|${appSecret}`;

  const response = await fetch(url);
  const data = await response.json();
  
  return {
    isValid: data.data?.is_valid || false,
    expiresAt: data.data?.expires_at || 0,
    scopes: data.data?.scopes || [],
  };
}
