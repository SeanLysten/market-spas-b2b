import { BetaAnalyticsDataClient } from '@google-analytics/data';

let _client: BetaAnalyticsDataClient | null = null;

function getGA4Client(): BetaAnalyticsDataClient {
  if (_client) return _client;
  const keyJson = process.env.GA4_SERVICE_ACCOUNT_KEY;
  if (!keyJson) throw new Error('GA4_SERVICE_ACCOUNT_KEY is not configured');
  const credentials = JSON.parse(keyJson);
  _client = new BetaAnalyticsDataClient({ credentials });
  return _client;
}

export function getGA4PropertyId(): string {
  const id = process.env.GA4_PROPERTY_ID;
  if (!id) throw new Error('GA4_PROPERTY_ID is not configured');
  return id;
}

export interface GA4TrafficSource {
  channel: string;
  sessions: number;
  users: number;
  pageViews: number;
  bounceRate: number;
}

export interface GA4DailySession {
  date: string;
  sessions: number;
  users: number;
}

export interface GA4TrafficReport {
  totalSessions: number;
  totalUsers: number;
  totalPageViews: number;
  avgBounceRate: number;
  dailySessions: GA4DailySession[];
  trafficSources: GA4TrafficSource[];
  topPages: Array<{ page: string; views: number; users: number }>;
}

/**
 * Récupère les statistiques de trafic depuis Google Analytics 4
 */
export async function getGA4TrafficReport(
  startDate: string,
  endDate: string
): Promise<GA4TrafficReport> {
  const client = getGA4Client();
  const propertyId = getGA4PropertyId();

  // Requête 1 : sessions par canal de trafic
  const [channelResponse] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: 'sessions' },
      { name: 'activeUsers' },
      { name: 'screenPageViews' },
      { name: 'bounceRate' },
    ],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
  });

  // Requête 2 : sessions par jour
  const [dailyResponse] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: 'sessions' },
      { name: 'activeUsers' },
    ],
    dimensions: [{ name: 'date' }],
    orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
  });

  // Requête 3 : top pages
  const [pagesResponse] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'activeUsers' },
    ],
    dimensions: [{ name: 'pagePath' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 10,
  });

  // Parser les sources de trafic
  const trafficSources: GA4TrafficSource[] = [];
  let totalSessions = 0;
  let totalUsers = 0;
  let totalPageViews = 0;
  let totalBounceRateSum = 0;
  let channelCount = 0;

  for (const row of channelResponse.rows || []) {
    const channel = row.dimensionValues?.[0]?.value || 'Inconnu';
    const sessions = parseInt(row.metricValues?.[0]?.value || '0', 10);
    const users = parseInt(row.metricValues?.[1]?.value || '0', 10);
    const pageViews = parseInt(row.metricValues?.[2]?.value || '0', 10);
    const bounceRate = parseFloat(row.metricValues?.[3]?.value || '0') * 100;

    trafficSources.push({ channel, sessions, users, pageViews, bounceRate: Math.round(bounceRate * 10) / 10 });
    totalSessions += sessions;
    totalUsers += users;
    totalPageViews += pageViews;
    totalBounceRateSum += bounceRate;
    channelCount++;
  }

  // Parser les sessions journalières
  const dailySessions: GA4DailySession[] = [];
  for (const row of dailyResponse.rows || []) {
    const rawDate = row.dimensionValues?.[0]?.value || '';
    // Format GA4: YYYYMMDD → YYYY-MM-DD
    const date = rawDate.length === 8
      ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
      : rawDate;
    const sessions = parseInt(row.metricValues?.[0]?.value || '0', 10);
    const users = parseInt(row.metricValues?.[1]?.value || '0', 10);
    dailySessions.push({ date, sessions, users });
  }

  // Parser les top pages
  const topPages = (pagesResponse.rows || []).map((row) => ({
    page: row.dimensionValues?.[0]?.value || '/',
    views: parseInt(row.metricValues?.[0]?.value || '0', 10),
    users: parseInt(row.metricValues?.[1]?.value || '0', 10),
  }));

  return {
    totalSessions,
    totalUsers,
    totalPageViews,
    avgBounceRate: channelCount > 0 ? Math.round((totalBounceRateSum / channelCount) * 10) / 10 : 0,
    dailySessions,
    trafficSources,
    topPages,
  };
}

/**
 * Vérifie que la connexion GA4 fonctionne (pour les tests)
 */
export async function testGA4Connection(): Promise<boolean> {
  const client = getGA4Client();
  const propertyId = getGA4PropertyId();
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    metrics: [{ name: 'sessions' }],
  });
  return (response.rowCount ?? 0) >= 0;
}
