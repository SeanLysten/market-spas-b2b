import { refreshGoogleAdsAccessToken } from './google-ads-oauth';

const GOOGLE_ADS_API_VERSION = 'v17';
const GOOGLE_ADS_BASE_URL = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

/**
 * Helper to make authenticated Google Ads REST API calls
 */
async function googleAdsRequest(
  endpoint: string,
  accessToken: string,
  options: {
    method?: string;
    body?: any;
    loginCustomerId?: string;
  } = {}
) {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken) {
    throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN not configured');
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': developerToken,
    'Content-Type': 'application/json',
  };

  if (options.loginCustomerId) {
    headers['login-customer-id'] = options.loginCustomerId.replace(/-/g, '');
  }

  const fullUrl = `${GOOGLE_ADS_BASE_URL}${endpoint}`;
  console.log(`[Google Ads API] Request: ${options.method || 'GET'} ${fullUrl}`);
  console.log(`[Google Ads API] Headers:`, { ...headers, 'Authorization': 'Bearer ***', 'developer-token': '***' });
  
  const response = await fetch(fullUrl, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    console.error(`[Google Ads API] Error ${response.status}:`, JSON.stringify(errorData).substring(0, 500));
    throw new Error(`Google Ads API error ${response.status}: ${JSON.stringify(errorData?.error?.message || errorData?.error?.status || response.statusText)}`);
  }

  return response.json();
}

/**
 * List accessible customer IDs for the authenticated user
 */
export async function listAccessibleCustomers(accessToken: string): Promise<string[]> {
  try {
    const data = await googleAdsRequest('/customers:listAccessibleCustomers', accessToken);
    console.log('[Google Ads API] Accessible customers:', data);
    
    // Returns { resourceNames: ["customers/1234567890", ...] }
    const customerIds = (data.resourceNames || []).map((rn: string) => rn.replace('customers/', ''));
    return customerIds;
  } catch (error) {
    console.error('[Google Ads API] Error listing accessible customers:', error);
    return [];
  }
}

/**
 * Get customer account details
 */
export async function getCustomerDetails(
  accessToken: string,
  customerId: string
): Promise<{ id: string; name: string; currency: string; timezone: string } | null> {
  try {
    const cleanId = customerId.replace(/-/g, '');
    const data = await googleAdsRequest(
      `/customers/${cleanId}/googleAds:searchStream`,
      accessToken,
      {
        method: 'POST',
        body: {
          query: `SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone FROM customer LIMIT 1`
        }
      }
    );

    const results = data?.[0]?.results;
    if (results && results.length > 0) {
      const customer = results[0].customer;
      return {
        id: customer.id,
        name: customer.descriptiveName || `Compte ${customer.id}`,
        currency: customer.currencyCode || 'EUR',
        timezone: customer.timeZone || 'Europe/Brussels',
      };
    }
    return null;
  } catch (error) {
    console.error('[Google Ads API] Error getting customer details:', error);
    return null;
  }
}

/**
 * Récupère les campagnes avec leurs insights (statistiques)
 */
export async function getCampaignsWithInsights(
  refreshToken: string,
  customerId: string,
  startDate: string,
  endDate: string
) {
  try {
    // Refresh the access token
    const tokens = await refreshGoogleAdsAccessToken(refreshToken);
    if (!tokens || !tokens.accessToken) {
      throw new Error('Failed to refresh access token');
    }

    const cleanId = customerId.replace(/-/g, '');
    console.log(`[Google Ads API] Fetching campaigns for customer ID: ${cleanId} (original: ${customerId})`);
    console.log(`[Google Ads API] Date range: ${startDate} to ${endDate}`);

    // Query GAQL via searchStream REST endpoint
    const data = await googleAdsRequest(
      `/customers/${cleanId}/googleAds:searchStream`,
      tokens.accessToken,
      {
        method: 'POST',
        body: {
          query: `
            SELECT
              campaign.id,
              campaign.name,
              campaign.status,
              campaign.advertising_channel_type,
              campaign.bidding_strategy_type,
              campaign_budget.amount_micros,
              metrics.impressions,
              metrics.clicks,
              metrics.cost_micros,
              metrics.conversions,
              metrics.conversions_value,
              metrics.ctr,
              metrics.average_cpc,
              metrics.average_cpm
            FROM campaign
            WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
              AND campaign.status != 'REMOVED'
            ORDER BY metrics.cost_micros DESC
          `
        }
      }
    );

    // searchStream returns an array of batches
    const allResults: any[] = [];
    if (Array.isArray(data)) {
      for (const batch of data) {
        if (batch.results) {
          allResults.push(...batch.results);
        }
      }
    }

    const formattedCampaigns = allResults.map((row: any) => {
      const campaign = row.campaign || {};
      const metrics = row.metrics || {};
      const budget = row.campaignBudget || {};

      return {
        id: campaign.id?.toString() || '',
        name: campaign.name || 'Sans nom',
        status: mapCampaignStatus(campaign.status),
        channel_type: mapChannelType(campaign.advertisingChannelType),
        bidding_strategy: campaign.biddingStrategyType || '',
        budget_micros: budget.amountMicros ? Number(budget.amountMicros) : 0,
        insights: {
          impressions: Number(metrics.impressions || 0),
          clicks: Number(metrics.clicks || 0),
          spend: Number(metrics.costMicros || 0) / 1_000_000,
          conversions: Number(metrics.conversions || 0),
          conversions_value: Number(metrics.conversionsValue || 0),
          ctr: Number(metrics.ctr || 0),
          average_cpc: Number(metrics.averageCpc || 0) / 1_000_000,
          average_cpm: Number(metrics.averageCpm || 0) / 1_000_000,
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
 */
export async function getDailyInsights(
  refreshToken: string,
  customerId: string,
  startDate: string,
  endDate: string
) {
  try {
    const tokens = await refreshGoogleAdsAccessToken(refreshToken);
    if (!tokens || !tokens.accessToken) {
      throw new Error('Failed to refresh access token');
    }

    const cleanId = customerId.replace(/-/g, '');

    const data = await googleAdsRequest(
      `/customers/${cleanId}/googleAds:searchStream`,
      tokens.accessToken,
      {
        method: 'POST',
        body: {
          query: `
            SELECT
              segments.date,
              metrics.impressions,
              metrics.clicks,
              metrics.cost_micros,
              metrics.conversions,
              metrics.conversions_value
            FROM campaign
            WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
              AND campaign.status != 'REMOVED'
            ORDER BY segments.date ASC
          `
        }
      }
    );

    // Aggregate metrics by day
    const dailyData: Record<string, any> = {};

    if (Array.isArray(data)) {
      for (const batch of data) {
        if (batch.results) {
          for (const row of batch.results) {
            const date = row.segments?.date;
            const metrics = row.metrics || {};

            if (!date) continue;

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

            dailyData[date].impressions += Number(metrics.impressions || 0);
            dailyData[date].clicks += Number(metrics.clicks || 0);
            dailyData[date].spend += Number(metrics.costMicros || 0) / 1_000_000;
            dailyData[date].conversions += Number(metrics.conversions || 0);
            dailyData[date].conversions_value += Number(metrics.conversionsValue || 0);
          }
        }
      }
    }

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
    const tokens = await refreshGoogleAdsAccessToken(refreshToken);
    if (!tokens || !tokens.accessToken) {
      throw new Error('Failed to refresh access token');
    }

    const customerIds = await listAccessibleCustomers(tokens.accessToken);
    
    const accounts: Array<{
      id: string;
      name: string;
      currency: string;
      timezone: string;
    }> = [];

    for (const customerId of customerIds) {
      const details = await getCustomerDetails(tokens.accessToken, customerId);
      if (details) {
        accounts.push(details);
      }
    }

    return accounts;
  } catch (error) {
    console.error('[Google Ads API] Error fetching accessible accounts:', error);
    return [];
  }
}

// Helper functions for status mapping
function mapCampaignStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'ENABLED': 'Active',
    'PAUSED': 'En pause',
    'REMOVED': 'Supprimée',
    'UNKNOWN': 'Inconnu',
    'UNSPECIFIED': 'Non spécifié',
  };
  return statusMap[status] || status || 'Inconnu';
}

function mapChannelType(type: string): string {
  const typeMap: Record<string, string> = {
    'SEARCH': 'Recherche',
    'DISPLAY': 'Display',
    'SHOPPING': 'Shopping',
    'VIDEO': 'Vidéo',
    'MULTI_CHANNEL': 'Multi-canal',
    'LOCAL': 'Local',
    'SMART': 'Smart',
    'PERFORMANCE_MAX': 'Performance Max',
    'LOCAL_SERVICES': 'Services locaux',
    'DISCOVERY': 'Discovery',
    'TRAVEL': 'Voyage',
    'DEMAND_GEN': 'Demand Gen',
  };
  return typeMap[type] || type || 'Autre';
}
