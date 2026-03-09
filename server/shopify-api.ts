/**
 * Shopify GraphQL Admin API
 * Récupère les métriques de ventes, commandes, clients et produits
 */

const SHOPIFY_API_VERSION = '2026-01';

export interface ShopifyAccount {
  shopDomain: string;
  accessToken: string;
  shopName?: string;
  currency?: string;
}

export interface ShopifyOverview {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  currency: string;
}

export interface ShopifyDailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

export interface ShopifyTopProduct {
  id: string;
  title: string;
  totalSold: number;
  totalRevenue: number;
  imageUrl?: string;
}

export interface ShopifyOrderStatus {
  status: string;
  count: number;
}

export interface ShopifyReport {
  overview: ShopifyOverview;
  dailyRevenue: ShopifyDailyRevenue[];
  topProducts: ShopifyTopProduct[];
  orderStatuses: ShopifyOrderStatus[];
  compareOverview?: ShopifyOverview;
}

export interface ShopifyTrafficSource {
  source: string;
  sessions: number;
  conversionRate: number;
}

export interface ShopifyDailySession {
  date: string;
  sessions: number;
}

export interface ShopifyTrafficReport {
  totalSessions: number;
  conversionRate: number;
  cartAbandonmentRate: number;
  dailySessions: ShopifyDailySession[];
  trafficSources: ShopifyTrafficSource[];
}

async function shopifyGraphQL(
  shopDomain: string,
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<unknown> {
  const url = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Shopify API error ${response.status}: ${text}`);
  }

  const json = await response.json() as { data?: unknown; errors?: unknown[] };
  if (json.errors && json.errors.length > 0) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}

/**
 * Récupère les informations de la boutique
 */
export async function getShopInfo(shopDomain: string, accessToken: string) {
  const query = `
    query {
      shop {
        name
        email
        currencyCode
        myshopifyDomain
        plan {
          displayName
        }
      }
    }
  `;
  const data = await shopifyGraphQL(shopDomain, accessToken, query) as { shop: { name: string; email: string; currencyCode: string; myshopifyDomain: string; plan: { displayName: string } } };
  return data.shop;
}

/**
 * Récupère les métriques de ventes sur une période donnée
 */
export async function getShopifyReport(
  shopDomain: string,
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<ShopifyReport> {
  // Requête pour les commandes de la période
  const ordersQuery = `
    query getOrders($query: String!, $first: Int!) {
      orders(query: $query, first: $first, sortKey: CREATED_AT) {
        edges {
          node {
            id
            name
            createdAt
            displayFinancialStatus
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            customer {
              id
              numberOfOrders
            }
            lineItems(first: 10) {
              edges {
                node {
                  title
                  quantity
                  originalTotalSet {
                    shopMoney {
                      amount
                    }
                  }
                  product {
                    id
                    title
                    featuredImage {
                      url
                    }
                  }
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  `;

  const dateQuery = `created_at:>=${startDate} created_at:<=${endDate} financial_status:paid`;

  const data = await shopifyGraphQL(shopDomain, accessToken, ordersQuery, {
    query: dateQuery,
    first: 250,
  }) as {
    orders: {
      edges: Array<{
        node: {
          id: string;
          name: string;
          createdAt: string;
          displayFinancialStatus: string;
          totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
          customer?: { id: string; numberOfOrders: number };
          lineItems: {
            edges: Array<{
              node: {
                title: string;
                quantity: number;
                originalTotalSet: { shopMoney: { amount: string } };
                product?: { id: string; title: string; featuredImage?: { url: string } };
              };
            }>;
          };
        };
      }>;
    };
  };

  const orders = data.orders.edges.map((e) => e.node);
  const currency = orders[0]?.totalPriceSet?.shopMoney?.currencyCode || 'EUR';

  // Calcul des métriques overview
  let totalRevenue = 0;
  let newCustomers = 0;
  let returningCustomers = 0;
  const customerIds = new Set<string>();
  const productMap = new Map<string, { title: string; sold: number; revenue: number; imageUrl?: string }>();
  const dailyMap = new Map<string, { revenue: number; orders: number }>();
  const statusMap = new Map<string, number>();

  for (const order of orders) {
    const amount = parseFloat(order.totalPriceSet.shopMoney.amount);
    totalRevenue += amount;

    // Clients
    if (order.customer) {
      customerIds.add(order.customer.id);
      if (order.customer.numberOfOrders <= 1) {
        newCustomers++;
      } else {
        returningCustomers++;
      }
    }

    // Revenus journaliers
    const date = order.createdAt.split('T')[0];
    const existing = dailyMap.get(date) || { revenue: 0, orders: 0 };
    dailyMap.set(date, {
      revenue: existing.revenue + amount,
      orders: existing.orders + 1,
    });

    // Statuts
    const status = order.displayFinancialStatus || 'UNKNOWN';
    statusMap.set(status, (statusMap.get(status) || 0) + 1);

    // Produits
    for (const lineItem of order.lineItems.edges) {
      const item = lineItem.node;
      const productId = item.product?.id || item.title;
      const productTitle = item.product?.title || item.title;
      const itemRevenue = parseFloat(item.originalTotalSet.shopMoney.amount);
      const existing = productMap.get(productId) || {
        title: productTitle,
        sold: 0,
        revenue: 0,
        imageUrl: item.product?.featuredImage?.url,
      };
      productMap.set(productId, {
        title: productTitle,
        sold: existing.sold + item.quantity,
        revenue: existing.revenue + itemRevenue,
        imageUrl: existing.imageUrl || item.product?.featuredImage?.url,
      });
    }
  }

  // Construire les données journalières (remplir les jours manquants)
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dailyRevenue: ShopifyDailyRevenue[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const day = dailyMap.get(dateStr) || { revenue: 0, orders: 0 };
    dailyRevenue.push({
      date: dateStr,
      revenue: Math.round(day.revenue * 100) / 100,
      orders: day.orders,
    });
  }

  // Top produits (triés par CA)
  const topProducts: ShopifyTopProduct[] = Array.from(productMap.entries())
    .map(([id, p]) => ({
      id,
      title: p.title,
      totalSold: p.sold,
      totalRevenue: Math.round(p.revenue * 100) / 100,
      imageUrl: p.imageUrl,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);

  // Statuts des commandes
  const orderStatuses: ShopifyOrderStatus[] = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
  }));

  const overview: ShopifyOverview = {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOrders: orders.length,
    averageOrderValue: orders.length > 0 ? Math.round((totalRevenue / orders.length) * 100) / 100 : 0,
    totalCustomers: customerIds.size,
    newCustomers,
    returningCustomers,
    currency,
  };

  return {
    overview,
    dailyRevenue,
    topProducts,
    orderStatuses,
  };
}

/**
 * Récupère les statistiques de trafic et visites via ShopifyQL
 */
export async function getShopifyTrafficReport(
  shopDomain: string,
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<ShopifyTrafficReport> {
  // Requête ShopifyQL pour les sessions totales et taux de conversion par jour
  const dailySessionsQuery = `
    mutation {
      shopifyqlQuery(query: "FROM sessions SHOW sessions, conversion_rate, cart_abandonment_rate TIMESERIES day SINCE ${startDate} UNTIL ${endDate}") {
        __typename
        ... on TableResponse {
          tableData {
            rowData
            columns {
              name
              dataType
              displayName
            }
          }
        }
        ... on ParseErrorResponse {
          parseErrors {
            code
            message
            range {
              start { line column }
              end { line column }
            }
          }
        }
      }
    }
  `;

  // Requête ShopifyQL pour les sessions par source de trafic
  const trafficSourceQuery = `
    mutation {
      shopifyqlQuery(query: "FROM sessions SHOW sessions, conversion_rate GROUP BY traffic_source SINCE ${startDate} UNTIL ${endDate} ORDER BY sessions DESC") {
        __typename
        ... on TableResponse {
          tableData {
            rowData
            columns {
              name
              dataType
              displayName
            }
          }
        }
        ... on ParseErrorResponse {
          parseErrors {
            code
            message
            range {
              start { line column }
              end { line column }
            }
          }
        }
      }
    }
  `;

  type ShopifyQLResponse = {
    shopifyqlQuery: {
      __typename: string;
      tableData?: {
        rowData: string[][];
        columns: Array<{ name: string; dataType: string; displayName: string }>;
      };
      parseErrors?: Array<{ code: string; message: string }>;
    };
  };

  const [dailyData, trafficData] = await Promise.all([
    shopifyGraphQL(shopDomain, accessToken, dailySessionsQuery) as Promise<ShopifyQLResponse>,
    shopifyGraphQL(shopDomain, accessToken, trafficSourceQuery) as Promise<ShopifyQLResponse>,
  ]);

  // Parser les sessions journalières
  const dailySessions: ShopifyDailySession[] = [];
  let totalSessions = 0;
  let totalConversionRate = 0;
  let totalCartAbandonmentRate = 0;
  let dayCount = 0;

  if (dailyData?.shopifyqlQuery?.tableData) {
    const { rowData, columns } = dailyData.shopifyqlQuery.tableData;
    const dayIdx = columns.findIndex((c) => c.name === 'day');
    const sessionsIdx = columns.findIndex((c) => c.name === 'sessions');
    const conversionIdx = columns.findIndex((c) => c.name === 'conversion_rate');
    const cartAbandonIdx = columns.findIndex((c) => c.name === 'cart_abandonment_rate');

    for (const row of rowData) {
      const date = dayIdx >= 0 ? row[dayIdx] : '';
      const sessions = sessionsIdx >= 0 ? parseFloat(row[sessionsIdx] || '0') : 0;
      const convRate = conversionIdx >= 0 ? parseFloat(row[conversionIdx] || '0') : 0;
      const cartAbandon = cartAbandonIdx >= 0 ? parseFloat(row[cartAbandonIdx] || '0') : 0;

      if (date) {
        dailySessions.push({ date: date.split('T')[0], sessions: Math.round(sessions) });
        totalSessions += sessions;
        totalConversionRate += convRate;
        totalCartAbandonmentRate += cartAbandon;
        dayCount++;
      }
    }
  }

  // Parser les sources de trafic
  const trafficSources: ShopifyTrafficSource[] = [];

  if (trafficData?.shopifyqlQuery?.tableData) {
    const { rowData, columns } = trafficData.shopifyqlQuery.tableData;
    const sourceIdx = columns.findIndex((c) => c.name === 'traffic_source');
    const sessionsIdx = columns.findIndex((c) => c.name === 'sessions');
    const conversionIdx = columns.findIndex((c) => c.name === 'conversion_rate');

    for (const row of rowData) {
      const source = sourceIdx >= 0 ? (row[sourceIdx] || 'Inconnu') : 'Inconnu';
      const sessions = sessionsIdx >= 0 ? parseFloat(row[sessionsIdx] || '0') : 0;
      const convRate = conversionIdx >= 0 ? parseFloat(row[conversionIdx] || '0') : 0;

      trafficSources.push({
        source,
        sessions: Math.round(sessions),
        conversionRate: Math.round(convRate * 100) / 100,
      });
    }
  }

  return {
    totalSessions: Math.round(totalSessions),
    conversionRate: dayCount > 0 ? Math.round((totalConversionRate / dayCount) * 100) / 100 : 0,
    cartAbandonmentRate: dayCount > 0 ? Math.round((totalCartAbandonmentRate / dayCount) * 100) / 100 : 0,
    dailySessions,
    trafficSources,
  };
}

/**
 * Échange le code OAuth contre un token d'accès permanent
 */
export async function exchangeShopifyCode(
  shopDomain: string,
  code: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; scope: string }> {
  const url = `https://${shopDomain}/admin/oauth/access_token`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!response.ok) {
    let errorMsg = `Shopify token exchange error ${response.status}`;
    try {
      const json = await response.json() as { error?: string; error_description?: string };
      errorMsg += `: ${json.error_description || json.error || 'Unknown error'}`;
    } catch {
      const text = await response.text();
      errorMsg += `: ${text.substring(0, 200)}`;
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<{ access_token: string; scope: string }>;
}

/**
 * Génère l'URL d'autorisation OAuth Shopify
 */
export function getShopifyOAuthUrl(
  shopDomain: string,
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const scopes = 'read_orders,read_customers,read_products,read_analytics,read_all_orders';
  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    state,
  });
  return `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`;
}
