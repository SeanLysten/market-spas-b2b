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

  const configId = process.env.META_CONFIG_ID;
  
  // Facebook Login for Business utilise config_id au lieu de scope
  if (configId) {
    return `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth?` +
      `client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&config_id=${configId}` +
      `&state=${state}` +
      `&response_type=code` +
      `&override_default_response_type=true`;
  }

  // Fallback: Facebook Login standard avec scope
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
    `&response_type=code` +
    `&display=page`;
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
  datePreset: string = "last_30d",
  timeRange?: { since: string; until: string }
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
    `fields=campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,cost_per_action_type,conversions,cost_per_conversion` +
    `&level=campaign` +
    (timeRange 
      ? `&time_range=${JSON.stringify(timeRange)}` 
      : `&date_preset=${datePreset}`) +
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

  // Combiner campagnes et insights, filtrer les campagnes pertinentes
  const allCampaigns = campaigns.map((campaign: any) => {
    const insight = insightsMap[campaign.id] || {};
    const leadActions = insight.actions?.find((a: any) => 
      a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped"
    );
    const linkClicks = insight.actions?.find((a: any) => 
      a.action_type === "link_click"
    );
    const costPerLead = insight.cost_per_action_type?.find((a: any) =>
      a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped"
    );
    const conversions = insight.actions?.filter((a: any) =>
      a.action_type === "offsite_conversion" || 
      a.action_type === "onsite_conversion" ||
      a.action_type === "lead" ||
      a.action_type === "onsite_conversion.lead_grouped" ||
      a.action_type === "purchase" ||
      a.action_type === "complete_registration"
    ) || [];

    const spend = parseFloat(insight.spend || "0");
    const leads = parseInt(leadActions?.value || "0");
    const clicks = parseInt(insight.clicks || "0");
    const impressions = parseInt(insight.impressions || "0");

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
      frequency: insight.frequency || "0",
      leads: leadActions?.value || "0",
      link_clicks: linkClicks?.value || "0",
      cost_per_lead: costPerLead?.value || (leads > 0 ? (spend / leads).toFixed(2) : "0"),
      conversions: conversions.map((c: any) => ({ type: c.action_type, value: c.value })),
      actions: insight.actions || [],
      date_start: insight.date_start || "",
      date_stop: insight.date_stop || "",
      has_activity: spend > 0 || clicks > 0 || impressions > 0,
    };
  });

  // Priorité des objectifs de campagne
  // Prioritaires : Prospects (LEAD_GENERATION), Trafic (LINK_CLICKS), Conversions (CONVERSIONS, OUTCOME_SALES)
  // Secondaires : Boost (POST_ENGAGEMENT), Notoriété (BRAND_AWARENESS, REACH), Engagement (ENGAGEMENT)
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
    return 50; // Objectif inconnu = milieu
  }

  // Filtrer : UNIQUEMENT les campagnes avec activité réelle durant la période
  // (dépenses > 0 OU clics > 0 OU impressions > 0)
  const activeCampaigns = allCampaigns.filter((c: any) => c.has_activity);

  // Trier : prioritaires en haut (Prospects, Trafic, Conversions), puis par dépenses décroissantes
  activeCampaigns.sort((a: any, b: any) => {
    const priorityA = getCampaignPriority(a.objective);
    const priorityB = getCampaignPriority(b.objective);
    if (priorityA !== priorityB) return priorityA - priorityB;
    // Même priorité : trier par dépenses décroissantes
    return parseFloat(b.spend) - parseFloat(a.spend);
  });

  // Ajouter le flag de priorité pour le frontend
  return activeCampaigns.map((c: any) => ({
    ...c,
    is_priority: getCampaignPriority(c.objective) < 100,
    objective_label: getObjectiveLabel(c.objective),
  }));
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

/**
 * Récupère les insights agrégés jour par jour pour un compte publicitaire
 */
export async function getDailyInsights(
  adAccountId: string,
  accessToken: string,
  datePreset: string = "last_30d",
  timeRange?: { since: string; until: string }
): Promise<{ date: string; spend: number; leads: number; clicks: number; impressions: number; reach: number }[]> {
  const dateParam = timeRange
    ? `&time_range=${JSON.stringify(timeRange)}`
    : `&date_preset=${datePreset}`;

  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${adAccountId}/insights?` +
    `fields=spend,impressions,clicks,reach,actions` +
    `&time_increment=1` +
    dateParam +
    `&access_token=${accessToken}` +
    `&limit=500`;

  const response = await fetch(url);
  if (!response.ok) {
    console.error("[Meta] Erreur récupération insights quotidiens");
    return [];
  }

  const data = await response.json();
  const dailyData = (data.data || []).map((day: any) => {
    const leadActions = day.actions?.find((a: any) =>
      a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped"
    );
    return {
      date: day.date_start,
      spend: parseFloat(day.spend || "0"),
      leads: parseInt(leadActions?.value || "0"),
      clicks: parseInt(day.clicks || "0"),
      impressions: parseInt(day.impressions || "0"),
      reach: parseInt(day.reach || "0"),
    };
  });

  // Trier par date
  dailyData.sort((a: any, b: any) => a.date.localeCompare(b.date));
  return dailyData;
}

/**
 * Récupère les insights agrégés pour une période donnée (pour comparaison)
 */
export async function getPeriodInsights(
  adAccountId: string,
  accessToken: string,
  timeRange: { since: string; until: string }
): Promise<{ spend: number; leads: number; clicks: number; impressions: number; reach: number; ctr: number; cpc: number; cpm: number; frequency: number; costPerLead: number }> {
  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${adAccountId}/insights?` +
    `fields=spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,cost_per_action_type` +
    `&time_range=${JSON.stringify(timeRange)}` +
    `&access_token=${accessToken}` +
    `&limit=500`;

  const response = await fetch(url);
  if (!response.ok) {
    console.error("[Meta] Erreur récupération insights période");
    return { spend: 0, leads: 0, clicks: 0, impressions: 0, reach: 0, ctr: 0, cpc: 0, cpm: 0, frequency: 0, costPerLead: 0 };
  }

  const data = await response.json();
  const entries = data.data || [];
  
  // Agréger toutes les entrées de la période
  let spend = 0, leads = 0, clicks = 0, impressions = 0, reach = 0;
  let ctr = 0, cpc = 0, cpm = 0, frequency = 0;
  
  for (const entry of entries) {
    spend += parseFloat(entry.spend || "0");
    clicks += parseInt(entry.clicks || "0");
    impressions += parseInt(entry.impressions || "0");
    reach += parseInt(entry.reach || "0");
    
    const leadActions = entry.actions?.find((a: any) =>
      a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped"
    );
    leads += parseInt(leadActions?.value || "0");
  }
  
  // Calculer les moyennes pondérées
  ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  cpc = clicks > 0 ? spend / clicks : 0;
  cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
  frequency = reach > 0 ? impressions / reach : 0;
  const costPerLead = leads > 0 ? spend / leads : 0;

  return { spend, leads, clicks, impressions, reach, ctr, cpc, cpm, frequency, costPerLead };
}

// Cache de validation du token pour éviter le rate limiting de l'API Meta
const tokenValidationCache: Map<string, { valid: boolean; timestamp: number }> = new Map();
const TOKEN_CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Vérifie si un token est encore valide (avec cache pour éviter le rate limiting)
 */
export async function validateToken(accessToken: string): Promise<boolean> {
  // Vérifier le cache d'abord
  const tokenKey = accessToken.substring(0, 20);
  const cached = tokenValidationCache.get(tokenKey);
  if (cached && (Date.now() - cached.timestamp) < TOKEN_CACHE_DURATION_MS) {
    return cached.valid;
  }

  try {
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/me?access_token=${accessToken}`;
    const response = await fetch(url);
    
    // Si rate limited (code 4), considérer le token comme valide (il l'était probablement)
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      if (body?.error?.code === 4 || body?.error?.is_transient) {
        console.log("[Meta] Rate limited lors de la validation du token - on considère le token comme valide");
        tokenValidationCache.set(tokenKey, { valid: true, timestamp: Date.now() });
        return true;
      }
    }
    
    const isValid = response.ok;
    tokenValidationCache.set(tokenKey, { valid: isValid, timestamp: Date.now() });
    return isValid;
  } catch {
    // En cas d'erreur réseau, considérer le token comme valide si on avait un cache positif avant
    if (cached?.valid) {
      return true;
    }
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

// ============================================
// LEAD FORMS SYNC (Rattrapage des leads manquants)
// ============================================

/**
 * Récupère les pages liées au compte avec leur token
 */
export async function getLinkedPages(accessToken: string): Promise<{ id: string; name: string; access_token: string }[]> {
  try {
    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/me/accounts?access_token=${accessToken}&limit=50`;
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.data || [];
  } catch {
    return [];
  }
}

/**
 * Récupère tous les formulaires Lead Ads des pages liées au compte
 */
export async function getLeadForms(accessToken: string): Promise<{ id: string; name: string; status: string; pageId: string; pageToken: string }[]> {
  try {
    const pages = await getLinkedPages(accessToken);
    const allForms: { id: string; name: string; status: string; pageId: string; pageToken: string }[] = [];

    for (const page of pages) {
      const formsUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${page.id}/leadgen_forms?access_token=${page.access_token}&fields=id,name,status&limit=100`;
      const formsResp = await fetch(formsUrl);
      if (!formsResp.ok) continue;
      const formsData = await formsResp.json();
      if (formsData.data) {
        allForms.push(...formsData.data.map((f: any) => ({ ...f, pageId: page.id, pageToken: page.access_token })));
      }
    }

    return allForms;
  } catch (error) {
    console.error("[Meta] Erreur récupération formulaires:", error);
    return [];
  }
}

/**
 * Récupère les leads d'un formulaire Meta depuis une date donnée
 */
export async function getLeadsFromForm(
  formId: string,
  pageToken: string,
  since?: Date
): Promise<Array<{
  id: string;
  created_time: string;
  ad_id?: string;
  field_data: Array<{ name: string; values: string[] }>;
}>> {
  try {
    let url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${formId}/leads?` +
      `access_token=${pageToken}&fields=id,created_time,ad_id,field_data&limit=100`;

    if (since) {
      const sinceTimestamp = Math.floor(since.getTime() / 1000);
      url += `&filtering=[{"field":"time_created","operator":"GREATER_THAN","value":${sinceTimestamp}}]`;
    }

    const allLeads: any[] = [];
    let nextUrl: string | null = url;

    while (nextUrl) {
      const resp = await fetch(nextUrl);
      if (!resp.ok) {
        const err = await resp.text();
        console.error(`[Meta] Erreur récupération leads formulaire ${formId}: ${err}`);
        break;
      }
      const data = await resp.json();
      if (data.data) allLeads.push(...data.data);
      nextUrl = data.paging?.next || null;
    }

    return allLeads;
  } catch (error) {
    console.error(`[Meta] Erreur getLeadsFromForm ${formId}:`, error);
    return [];
  }
}
