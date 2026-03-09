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

// ── Interfaces ────────────────────────────────────────────────────────────────

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

export interface GA4GeoCountry {
  country: string;
  countryCode: string;
  sessions: number;
  users: number;
  pageViews: number;
  bounceRate: number;
}

export interface GA4GeoCity {
  city: string;
  country: string;
  sessions: number;
  users: number;
}

export interface GA4DeviceCategory {
  device: string;
  sessions: number;
  users: number;
  bounceRate: number;
}

export interface GA4Language {
  language: string;
  sessions: number;
  users: number;
}

export interface GA4LandingPage {
  page: string;
  sessions: number;
  bounceRate: number;
  avgSessionDuration: number;
}

export interface GA4TrafficReport {
  totalSessions: number;
  totalUsers: number;
  totalPageViews: number;
  avgBounceRate: number;
  avgSessionDuration: number;
  dailySessions: GA4DailySession[];
  trafficSources: GA4TrafficSource[];
  topPages: Array<{ page: string; views: number; users: number }>;
  // Nouvelles dimensions
  geoCountries: GA4GeoCountry[];
  geoCities: GA4GeoCity[];
  devices: GA4DeviceCategory[];
  languages: GA4Language[];
  landingPages: GA4LandingPage[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function intVal(row: any, idx: number): number {
  return parseInt(row.metricValues?.[idx]?.value || '0', 10);
}
function floatVal(row: any, idx: number): number {
  return parseFloat(row.metricValues?.[idx]?.value || '0');
}
function dimVal(row: any, idx: number): string {
  return row.dimensionValues?.[idx]?.value || '';
}
function formatDate(rawDate: string): string {
  return rawDate.length === 8
    ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
    : rawDate;
}

// Mapping ISO alpha-2 codes depuis les noms de pays GA4
// GA4 retourne les noms en anglais, on les garde tels quels pour le display
// et on utilise une table de correspondance pour les codes ISO
const COUNTRY_TO_ISO: Record<string, string> = {
  'France': 'FR', 'Belgium': 'BE', 'Switzerland': 'CH', 'Luxembourg': 'LU',
  'Germany': 'DE', 'Netherlands': 'NL', 'Spain': 'ES', 'Italy': 'IT',
  'United Kingdom': 'GB', 'United States': 'US', 'Canada': 'CA',
  'Australia': 'AU', 'Japan': 'JP', 'China': 'CN', 'Brazil': 'BR',
  'Mexico': 'MX', 'Portugal': 'PT', 'Austria': 'AT', 'Sweden': 'SE',
  'Denmark': 'DK', 'Norway': 'NO', 'Finland': 'FI', 'Poland': 'PL',
  'Czech Republic': 'CZ', 'Romania': 'RO', 'Hungary': 'HU', 'Morocco': 'MA',
  'Algeria': 'DZ', 'Tunisia': 'TN', 'Senegal': 'SN', 'Ivory Coast': "CI",
  'United Arab Emirates': 'AE', 'Saudi Arabia': 'SA', 'Qatar': 'QA',
};

/**
 * Récupère les statistiques de trafic complètes depuis Google Analytics 4
 */
export async function getGA4TrafficReport(
  startDate: string,
  endDate: string
): Promise<GA4TrafficReport> {
  const client = getGA4Client();
  const propertyId = getGA4PropertyId();

  const property = `properties/${propertyId}`;
  const dateRanges = [{ startDate, endDate }];

  // Lancer toutes les requêtes en parallèle pour la performance
  const [
    [channelResponse],
    [dailyResponse],
    [pagesResponse],
    [countriesResponse],
    [citiesResponse],
    [devicesResponse],
    [languagesResponse],
    [landingPagesResponse],
  ] = await Promise.all([
    // 1. Sources de trafic par canal
    client.runReport({
      property, dateRanges,
      metrics: [
        { name: 'sessions' }, { name: 'activeUsers' },
        { name: 'screenPageViews' }, { name: 'bounceRate' },
      ],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    }),
    // 2. Sessions par jour
    client.runReport({
      property, dateRanges,
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      dimensions: [{ name: 'date' }],
      orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
    }),
    // 3. Top pages vues
    client.runReport({
      property, dateRanges,
      metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
      dimensions: [{ name: 'pagePath' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    }),
    // 4. Géographie : pays
    client.runReport({
      property, dateRanges,
      metrics: [
        { name: 'sessions' }, { name: 'activeUsers' },
        { name: 'screenPageViews' }, { name: 'bounceRate' },
      ],
      dimensions: [{ name: 'country' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 20,
    }),
    // 5. Géographie : villes
    client.runReport({
      property, dateRanges,
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      dimensions: [{ name: 'city' }, { name: 'country' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 15,
    }),
    // 6. Appareils
    client.runReport({
      property, dateRanges,
      metrics: [
        { name: 'sessions' }, { name: 'activeUsers' }, { name: 'bounceRate' },
      ],
      dimensions: [{ name: 'deviceCategory' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    }),
    // 7. Langues
    client.runReport({
      property, dateRanges,
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      dimensions: [{ name: 'language' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    }),
    // 8. Pages d'atterrissage (landing pages)
    client.runReport({
      property, dateRanges,
      metrics: [
        { name: 'sessions' }, { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
      ],
      dimensions: [{ name: 'landingPage' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    }),
  ]);

  // ── Parser les sources de trafic ─────────────────────────────────────────
  const trafficSources: GA4TrafficSource[] = [];
  let totalSessions = 0;
  let totalUsers = 0;
  let totalPageViews = 0;
  let totalBounceRateSum = 0;
  let channelCount = 0;

  for (const row of channelResponse.rows || []) {
    const channel = dimVal(row, 0);
    const sessions = intVal(row, 0);
    const users = intVal(row, 1);
    const pageViews = intVal(row, 2);
    const bounceRate = floatVal(row, 3) * 100;
    trafficSources.push({ channel, sessions, users, pageViews, bounceRate: Math.round(bounceRate * 10) / 10 });
    totalSessions += sessions;
    totalUsers += users;
    totalPageViews += pageViews;
    totalBounceRateSum += bounceRate;
    channelCount++;
  }

  // ── Parser les sessions journalières ─────────────────────────────────────
  const dailySessions: GA4DailySession[] = (dailyResponse.rows || []).map((row) => ({
    date: formatDate(dimVal(row, 0)),
    sessions: intVal(row, 0),
    users: intVal(row, 1),
  }));

  // ── Parser les top pages ──────────────────────────────────────────────────
  const topPages = (pagesResponse.rows || []).map((row) => ({
    page: dimVal(row, 0),
    views: intVal(row, 0),
    users: intVal(row, 1),
  }));

  // ── Parser les pays ───────────────────────────────────────────────────────
  const geoCountries: GA4GeoCountry[] = (countriesResponse.rows || [])
    .filter((row) => dimVal(row, 0) !== '(not set)')
    .map((row) => {
      const country = dimVal(row, 0);
      return {
        country,
        countryCode: COUNTRY_TO_ISO[country] || country.slice(0, 2).toUpperCase(),
        sessions: intVal(row, 0),
        users: intVal(row, 1),
        pageViews: intVal(row, 2),
        bounceRate: Math.round(floatVal(row, 3) * 1000) / 10,
      };
    });

  // ── Parser les villes ─────────────────────────────────────────────────────
  const geoCities: GA4GeoCity[] = (citiesResponse.rows || [])
    .filter((row) => dimVal(row, 0) !== '(not set)')
    .map((row) => ({
      city: dimVal(row, 0),
      country: dimVal(row, 1),
      sessions: intVal(row, 0),
      users: intVal(row, 1),
    }));

  // ── Parser les appareils ──────────────────────────────────────────────────
  const devices: GA4DeviceCategory[] = (devicesResponse.rows || []).map((row) => ({
    device: dimVal(row, 0),
    sessions: intVal(row, 0),
    users: intVal(row, 1),
    bounceRate: Math.round(floatVal(row, 2) * 1000) / 10,
  }));

  // ── Parser les langues ────────────────────────────────────────────────────
  const languages: GA4Language[] = (languagesResponse.rows || [])
    .filter((row) => dimVal(row, 0) !== '(not set)')
    .map((row) => ({
      language: dimVal(row, 0),
      sessions: intVal(row, 0),
      users: intVal(row, 1),
    }));

  // ── Parser les landing pages ──────────────────────────────────────────────
  const landingPages: GA4LandingPage[] = (landingPagesResponse.rows || [])
    .filter((row) => dimVal(row, 0) !== '(not set)')
    .map((row) => ({
      page: dimVal(row, 0),
      sessions: intVal(row, 0),
      bounceRate: Math.round(floatVal(row, 1) * 1000) / 10,
      avgSessionDuration: Math.round(floatVal(row, 2)),
    }));

  // ── Durée moyenne de session globale ─────────────────────────────────────
  // Calculée comme moyenne pondérée des landing pages
  const totalLandingSessions = landingPages.reduce((s, p) => s + p.sessions, 0);
  const avgSessionDuration = totalLandingSessions > 0
    ? Math.round(landingPages.reduce((s, p) => s + p.avgSessionDuration * p.sessions, 0) / totalLandingSessions)
    : 0;

  return {
    totalSessions,
    totalUsers,
    totalPageViews,
    avgBounceRate: channelCount > 0 ? Math.round((totalBounceRateSum / channelCount) * 10) / 10 : 0,
    avgSessionDuration,
    dailySessions,
    trafficSources,
    topPages,
    geoCountries,
    geoCities,
    devices,
    languages,
    landingPages,
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
