import { GoogleAdsApi, Customer } from 'google-ads-api';
import { getGoogleAdsOAuthClient, refreshGoogleAdsAccessToken } from './google-ads-oauth';

/**
 * Crée un client Google Ads API avec les identifiants OAuth
 */
export async function createGoogleAdsClient(
  refreshToken: string,
  customerId: string
): Promise<{ client: GoogleAdsApi; customer: Customer } | null> {
  try {
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    
    if (!developerToken) {
      console.error('[Google Ads API] Developer Token not configured');
      return null;
    }

    const oauthClient = getGoogleAdsOAuthClient();
    if (!oauthClient) {
      console.error('[Google Ads API] OAuth client not configured');
      return null;
    }

    // Rafraîchir le token d'accès
    const tokens = await refreshGoogleAdsAccessToken(refreshToken);
    if (!tokens || !tokens.access_token) {
      console.error('[Google Ads API] Failed to refresh access token');
      return null;
    }

    // Créer le client Google Ads API
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      developer_token: developerToken,
    });

    // Créer un customer avec le token d'accès
    const customer = client.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
    });

    return { client, customer };
  } catch (error) {
    console.error('[Google Ads API] Error creating client:', error);
    return null;
  }
}

/**
 * Récupère les campagnes avec leurs insights (statistiques)
 * Similaire à getCampaignsWithInsights de Meta Ads
 */
export async function getCampaignsWithInsights(
  refreshToken: string,
  customerId: string,
  startDate: string, // Format: YYYY-MM-DD
  endDate: string     // Format: YYYY-MM-DD
) {
  try {
    const result = await createGoogleAdsClient(refreshToken, customerId);
    if (!result) {
      throw new Error('Failed to create Google Ads client');
    }

    const { customer } = result;

    // Query GAQL (Google Ads Query Language) pour récupérer les campagnes et leurs métriques
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc
      FROM campaign
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      ORDER BY metrics.cost_micros DESC
    `;

    const campaigns = await customer.query(query);

    // Transformer les données pour correspondre au format Meta Ads
    const formattedCampaigns = campaigns.map((row: any) => {
      const campaign = row.campaign;
      const metrics = row.metrics;

      return {
        id: campaign.id.toString(),
        name: campaign.name,
        status: campaign.status,
        channel_type: campaign.advertising_channel_type,
        insights: {
          impressions: metrics.impressions || 0,
          clicks: metrics.clicks || 0,
          spend: (metrics.cost_micros || 0) / 1_000_000, // Convertir micros en devise
          conversions: metrics.conversions || 0,
          conversions_value: metrics.conversions_value || 0,
          ctr: metrics.ctr || 0,
          average_cpc: (metrics.average_cpc || 0) / 1_000_000, // Convertir micros en devise
          date_start: startDate,
          date_stop: endDate,
        },
      };
    });

    return formattedCampaigns;
  } catch (error) {
    console.error('[Google Ads API] Error fetching campaigns:', error);
    throw error;
  }
}

/**
 * Récupère les insights quotidiens pour une période donnée
 * Similaire à getDailyInsights de Meta Ads
 */
export async function getDailyInsights(
  refreshToken: string,
  customerId: string,
  startDate: string,
  endDate: string
) {
  try {
    const result = await createGoogleAdsClient(refreshToken, customerId);
    if (!result) {
      throw new Error('Failed to create Google Ads client');
    }

    const { customer } = result;

    const query = `
      SELECT
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      ORDER BY segments.date ASC
    `;

    const rows = await customer.query(query);

    // Agréger les métriques par jour
    const dailyData: Record<string, any> = {};

    rows.forEach((row: any) => {
      const date = row.segments.date;
      const metrics = row.metrics;

      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          impressions: 0,
          clicks: 0,
          spend: 0,
          conversions: 0,
          conversions_value: 0,
        };
      }

      dailyData[date].impressions += metrics.impressions || 0;
      dailyData[date].clicks += metrics.clicks || 0;
      dailyData[date].spend += (metrics.cost_micros || 0) / 1_000_000;
      dailyData[date].conversions += metrics.conversions || 0;
      dailyData[date].conversions_value += metrics.conversions_value || 0;
    });

    return Object.values(dailyData);
  } catch (error) {
    console.error('[Google Ads API] Error fetching daily insights:', error);
    throw error;
  }
}

/**
 * Récupère les comptes publicitaires accessibles
 */
export async function getAccessibleAccounts(refreshToken: string) {
  try {
    const oauthClient = getGoogleAdsOAuthClient();
    if (!oauthClient) {
      throw new Error('OAuth client not configured');
    }

    // Rafraîchir le token d'accès
    const tokens = await refreshGoogleAdsAccessToken(refreshToken);
    if (!tokens || !tokens.access_token) {
      throw new Error('Failed to refresh access token');
    }

    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    if (!developerToken) {
      throw new Error('Developer Token not configured');
    }

    // Créer le client Google Ads API
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      developer_token: developerToken,
    });

    // Pour obtenir la liste des comptes accessibles, nous devons utiliser le compte manager
    // ou demander à l'utilisateur de fournir son Customer ID
    // Pour l'instant, nous retournons un tableau vide et demanderons le Customer ID lors de la connexion
    
    return [];
  } catch (error) {
    console.error('[Google Ads API] Error fetching accessible accounts:', error);
    throw error;
  }
}
