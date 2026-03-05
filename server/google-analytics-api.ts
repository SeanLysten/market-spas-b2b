/**
 * Google Analytics Data API v1 (GA4)
 * Documentation : https://developers.google.com/analytics/devguides/reporting/data/v1
 */

const GA4_DATA_API = "https://analyticsdata.googleapis.com/v1beta";

/** Rafraîchit l'access token si nécessaire et retourne un token valide */
async function getValidAccessToken(
  refreshToken: string,
  accessToken: string,
  tokenExpiresAt: Date | null
): Promise<string> {
  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 minutes buffer

  if (tokenExpiresAt && tokenExpiresAt.getTime() - now.getTime() > bufferMs) {
    return accessToken;
  }

  // Refresh the token
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json() as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new Error(`Failed to refresh GA4 token: ${data.error || "unknown error"}`);
  }
  return data.access_token;
}

/** Liste les propriétés GA4 accessibles pour ce compte */
export async function listGa4Properties(
  accessToken: string,
  refreshToken: string,
  tokenExpiresAt: Date | null
): Promise<Array<{ propertyId: string; displayName: string; websiteUrl: string | null }>> {
  const token = await getValidAccessToken(refreshToken, accessToken, tokenExpiresAt);

  const res = await fetch(
    "https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:accounts/-&pageSize=50",
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(`GA4 Admin API error ${res.status}: ${err.error?.message || res.statusText}`);
  }

  const data = await res.json() as {
    properties?: Array<{
      name: string;
      displayName: string;
      websiteUri?: string;
    }>;
  };

  return (data.properties || []).map((p) => ({
    propertyId: p.name.replace("properties/", ""),
    displayName: p.displayName,
    websiteUrl: p.websiteUri || null,
  }));
}

export interface Ga4OverviewMetrics {
  sessions: number;
  totalUsers: number;
  newUsers: number;
  pageviews: number;
  avgSessionDuration: number; // seconds
  bounceRate: number; // 0-100
  engagementRate: number; // 0-100
}

export interface Ga4DailyPoint {
  date: string; // YYYY-MM-DD
  sessions: number;
  users: number;
  pageviews: number;
}

export interface Ga4TopPage {
  pagePath: string;
  pageTitle: string;
  screenPageViews: number;
  sessions: number;
}

export interface Ga4TrafficSource {
  sessionDefaultChannelGroup: string;
  sessions: number;
  users: number;
}

export interface Ga4DeviceCategory {
  deviceCategory: string;
  sessions: number;
  percentage: number;
}

export interface Ga4FullReport {
  overview: Ga4OverviewMetrics;
  dailyTrend: Ga4DailyPoint[];
  topPages: Ga4TopPage[];
  trafficSources: Ga4TrafficSource[];
  deviceCategories: Ga4DeviceCategory[];
  propertyId: string;
  dateRange: { startDate: string; endDate: string };
}

/** Exécute un rapport GA4 via l'API Data */
async function runReport(
  propertyId: string,
  token: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const res = await fetch(`${GA4_DATA_API}/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(`GA4 Data API error ${res.status}: ${err.error?.message || res.statusText}`);
  }

  return res.json() as Promise<Record<string, unknown>>;
}

/** Extrait la valeur d'une métrique d'une ligne de résultat */
function metricVal(row: { metricValues?: Array<{ value?: string }> }, idx: number): number {
  return parseFloat(row.metricValues?.[idx]?.value || "0") || 0;
}

/** Extrait la valeur d'une dimension d'une ligne de résultat */
function dimVal(row: { dimensionValues?: Array<{ value?: string }> }, idx: number): string {
  return row.dimensionValues?.[idx]?.value || "";
}

/** Récupère le rapport complet GA4 pour une propriété et une plage de dates */
export async function getGa4FullReport(
  propertyId: string,
  accessToken: string,
  refreshToken: string,
  tokenExpiresAt: Date | null,
  startDate: string,
  endDate: string
): Promise<Ga4FullReport> {
  const token = await getValidAccessToken(refreshToken, accessToken, tokenExpiresAt);
  const dateRange = [{ startDate, endDate }];

  // 1. Overview metrics
  const overviewRaw = await runReport(propertyId, token, {
    dateRanges: dateRange,
    metrics: [
      { name: "sessions" },
      { name: "totalUsers" },
      { name: "newUsers" },
      { name: "screenPageViews" },
      { name: "averageSessionDuration" },
      { name: "bounceRate" },
      { name: "engagementRate" },
    ],
  }) as { rows?: Array<{ metricValues?: Array<{ value?: string }> }> };

  const overviewRow = overviewRaw.rows?.[0];
  const overview: Ga4OverviewMetrics = overviewRow
    ? {
        sessions: metricVal(overviewRow, 0),
        totalUsers: metricVal(overviewRow, 1),
        newUsers: metricVal(overviewRow, 2),
        pageviews: metricVal(overviewRow, 3),
        avgSessionDuration: metricVal(overviewRow, 4),
        bounceRate: metricVal(overviewRow, 5) * 100,
        engagementRate: metricVal(overviewRow, 6) * 100,
      }
    : { sessions: 0, totalUsers: 0, newUsers: 0, pageviews: 0, avgSessionDuration: 0, bounceRate: 0, engagementRate: 0 };

  // 2. Daily trend
  const dailyRaw = await runReport(propertyId, token, {
    dateRanges: dateRange,
    dimensions: [{ name: "date" }],
    metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "screenPageViews" }],
    orderBys: [{ dimension: { dimensionName: "date" } }],
  }) as { rows?: Array<{ dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }> };

  const dailyTrend: Ga4DailyPoint[] = (dailyRaw.rows || []).map((row) => {
    const raw = dimVal(row, 0); // YYYYMMDD
    const date = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    return {
      date,
      sessions: metricVal(row, 0),
      users: metricVal(row, 1),
      pageviews: metricVal(row, 2),
    };
  });

  // 3. Top pages
  const pagesRaw = await runReport(propertyId, token, {
    dateRanges: dateRange,
    dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
    metrics: [{ name: "screenPageViews" }, { name: "sessions" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 10,
  }) as { rows?: Array<{ dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }> };

  const topPages: Ga4TopPage[] = (pagesRaw.rows || []).map((row) => ({
    pagePath: dimVal(row, 0),
    pageTitle: dimVal(row, 1),
    screenPageViews: metricVal(row, 0),
    sessions: metricVal(row, 1),
  }));

  // 4. Traffic sources
  const sourcesRaw = await runReport(propertyId, token, {
    dateRanges: dateRange,
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }, { name: "totalUsers" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 10,
  }) as { rows?: Array<{ dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }> };

  const trafficSources: Ga4TrafficSource[] = (sourcesRaw.rows || []).map((row) => ({
    sessionDefaultChannelGroup: dimVal(row, 0),
    sessions: metricVal(row, 0),
    users: metricVal(row, 1),
  }));

  // 5. Device categories
  const devicesRaw = await runReport(propertyId, token, {
    dateRanges: dateRange,
    dimensions: [{ name: "deviceCategory" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
  }) as { rows?: Array<{ dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }> };

  const totalDeviceSessions = (devicesRaw.rows || []).reduce(
    (sum, row) => sum + metricVal(row, 0),
    0
  );
  const deviceCategories: Ga4DeviceCategory[] = (devicesRaw.rows || []).map((row) => {
    const sessions = metricVal(row, 0);
    return {
      deviceCategory: dimVal(row, 0),
      sessions,
      percentage: totalDeviceSessions > 0 ? (sessions / totalDeviceSessions) * 100 : 0,
    };
  });

  return {
    overview,
    dailyTrend,
    topPages,
    trafficSources,
    deviceCategories,
    propertyId,
    dateRange: { startDate, endDate },
  };
}
