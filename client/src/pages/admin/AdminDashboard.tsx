import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  Package, 
  Users, 
  ShoppingBag, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  AlertCircle, 
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Euro,
  BarChart3,
  Activity,
  Target,
  Megaphone,
  Wrench,
  Mail,
  Calendar,
  Settings,
  Map,
  HeadphonesIcon,
  Eye,
  MousePointerClick,
  Globe,
  Percent,
  Zap,
  Send,
  LayoutGrid,
  Truck,
  Timer,
  Shield,
  BookOpen,
} from "lucide-react";
import { Link } from "wouter";
import SalesChart from "@/components/charts/SalesChart";
import TopProductsChart from "@/components/charts/TopProductsChart";

// Helper to check admin module access
function hasModule(
  userRole: string | undefined,
  adminPermissions: any,
  module: string
): boolean {
  if (userRole === "SUPER_ADMIN") return true;
  if (userRole !== "ADMIN" || !adminPermissions) return false;
  const modulePerms = adminPermissions?.modules?.[module];
  return modulePerms?.view === true;
}

// ==========================================
// MARKETING DASHBOARD SECTION
// ==========================================
function MarketingDashboardSection() {
  const { data: leadStats } = trpc.admin.leads.stats.useQuery({});
  const { data: ga4Data } = trpc.admin.analytics.getGA4Report.useQuery({ startDate: undefined, endDate: undefined });
  const { data: metaData } = trpc.metaAds.getCampaigns.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const { data: googleAdsData } = trpc.googleAds.getCampaigns.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const ga4 = ga4Data as any;
  const metaCampaigns = (metaData as any)?.campaigns || [];
  const googleCampaigns = (googleAdsData as any)?.campaigns || [];

  // Calculate Meta Ads totals
  const metaTotals = metaCampaigns.reduce((acc: any, c: any) => ({
    spend: acc.spend + (parseFloat(c.insights?.spend) || 0),
    impressions: acc.impressions + (parseInt(c.insights?.impressions) || 0),
    clicks: acc.clicks + (parseInt(c.insights?.clicks) || 0),
    leads: acc.leads + (parseInt(c.insights?.actions?.find((a: any) => a.action_type === "lead")?.value) || 0),
  }), { spend: 0, impressions: 0, clicks: 0, leads: 0 });

  // Calculate Google Ads totals
  const googleTotals = googleCampaigns.reduce((acc: any, c: any) => ({
    spend: acc.spend + (parseFloat(c.cost) || 0),
    impressions: acc.impressions + (parseInt(c.impressions) || 0),
    clicks: acc.clicks + (parseInt(c.clicks) || 0),
    conversions: acc.conversions + (parseFloat(c.conversions) || 0),
  }), { spend: 0, impressions: 0, clicks: 0, conversions: 0 });

  return (
    <div className="space-y-6">
      {/* Marketing KPIs */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-600" />
          Leads & Prospection
        </h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leadStats?.total || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{leadStats?.new || 0} nouveaux non assignés</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{leadStats?.inProgress || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{leadStats?.contacted || 0} contactés</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taux de conversion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{leadStats?.conversionRate || 0}%</div>
              <p className="text-xs text-muted-foreground mt-1">{leadStats?.converted || 0} convertis</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taux de contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{leadStats?.contactRate || 0}%</div>
              <p className="text-xs text-muted-foreground mt-1">{leadStats?.lost || 0} perdus</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* GA4 Traffic */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Globe className="w-5 h-5 text-orange-600" />
          Trafic du site (Google Analytics - 30 jours)
        </h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sessions</CardTitle>
              <Eye className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ga4?.totalSessions?.toLocaleString("fr-FR") || "—"}</div>
              <p className="text-xs text-muted-foreground mt-1">Visiteurs uniques : {ga4?.totalUsers?.toLocaleString("fr-FR") || "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pages vues</CardTitle>
              <MousePointerClick className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ga4?.totalPageviews?.toLocaleString("fr-FR") || "—"}</div>
              <p className="text-xs text-muted-foreground mt-1">Pages/session : {ga4?.avgPagesPerSession?.toFixed(1) || "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taux de rebond</CardTitle>
              <Percent className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ga4?.bounceRate ? `${(ga4.bounceRate * 100).toFixed(1)}%` : "—"}</div>
              <p className="text-xs text-muted-foreground mt-1">Durée moy. : {ga4?.avgSessionDuration ? `${Math.round(ga4.avgSessionDuration)}s` : "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sources principales</CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {ga4?.topSources && ga4.topSources.length > 0 ? (
                <div className="space-y-1">
                  {ga4.topSources.slice(0, 3).map((s: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="truncate">{s.source || "direct"}</span>
                      <span className="font-medium">{s.sessions}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune donnée</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Meta Ads & Google Ads side by side */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Meta Ads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Meta Ads
            </CardTitle>
            <CardDescription>
              {(metaData as any)?.connected ? `${metaCampaigns.length} campagne(s) active(s)` : "Non connecté"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(metaData as any)?.connected ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Dépenses</p>
                  <p className="text-lg font-bold">{metaTotals.spend.toFixed(2)} €</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Impressions</p>
                  <p className="text-lg font-bold">{metaTotals.impressions.toLocaleString("fr-FR")}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Clics</p>
                  <p className="text-lg font-bold">{metaTotals.clicks.toLocaleString("fr-FR")}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">CTR</p>
                  <p className="text-lg font-bold">{metaTotals.impressions > 0 ? ((metaTotals.clicks / metaTotals.impressions) * 100).toFixed(2) : 0}%</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Connectez votre compte Meta Ads</p>
                <Link href="/admin/leads">
                  <Button variant="outline" size="sm" className="mt-2 gap-1">Configurer <ArrowRight className="w-3 h-3" /></Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Ads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google Ads
            </CardTitle>
            <CardDescription>
              {(googleAdsData as any)?.connected ? `${googleCampaigns.length} campagne(s) active(s)` : "Non connecté"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(googleAdsData as any)?.connected ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Dépenses</p>
                  <p className="text-lg font-bold">{googleTotals.spend.toFixed(2)} €</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Impressions</p>
                  <p className="text-lg font-bold">{googleTotals.impressions.toLocaleString("fr-FR")}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Clics</p>
                  <p className="text-lg font-bold">{googleTotals.clicks.toLocaleString("fr-FR")}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Conversions</p>
                  <p className="text-lg font-bold">{googleTotals.conversions.toFixed(0)}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Zap className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Connectez votre compte Google Ads</p>
                <Link href="/admin/leads">
                  <Button variant="outline" size="sm" className="mt-2 gap-1">Configurer <ArrowRight className="w-3 h-3" /></Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Marketing Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Actions rapides</h2>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/admin/leads", icon: Target, title: "Leads & Campagnes", desc: "Gérer les leads et campagnes publicitaires", color: "text-blue-600", bg: "bg-blue-500/10" },
            { href: "/admin/newsletter", icon: Mail, title: "Newsletter", desc: "Envoyer une campagne email", color: "text-teal-600", bg: "bg-teal-500/10" },
            { href: "/admin/calendar", icon: Calendar, title: "Agenda", desc: "Événements et promotions", color: "text-indigo-600", bg: "bg-indigo-500/10" },
            { href: "/admin/territories", icon: Map, title: "Territoires", desc: "Zones commerciales", color: "text-cyan-600", bg: "bg-cyan-500/10" },
            { href: "/admin/partner-map", icon: Map, title: "Carte Réseau", desc: "Visualiser les partenaires", color: "text-sky-600", bg: "bg-sky-500/10" },
            { href: "/admin/resources", icon: FileText, title: "Ressources Médias", desc: "PLV et supports marketing", color: "text-purple-600", bg: "bg-purple-500/10" },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Card key={a.href} className="card-hover cursor-pointer group" onClick={() => window.location.href = a.href}>
                <CardHeader className="pb-3">
                  <div className={`w-10 h-10 rounded-lg ${a.bg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${a.color}`} />
                  </div>
                  <CardTitle className="text-sm">{a.title}</CardTitle>
                  <CardDescription className="text-xs">{a.desc}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// STOCK DASHBOARD SECTION
// ==========================================
function StockDashboardSection() {
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: allProducts } = trpc.products.list.useQuery({ limit: 200 });
  const products = useSafeQuery(allProducts);
  const { data: incomingStock } = trpc.admin.incomingStock.list.useQuery();
  const incomingStockSafe = useSafeQuery(incomingStock);

  const pendingArrivals = incomingStockSafe.filter((s: any) => s.status === "PENDING" || s.status === "IN_TRANSIT");

  return (
    <div className="space-y-6">
      {/* Stock KPIs */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Package className="w-5 h-5 text-orange-600" />
          Vue d'ensemble du stock
        </h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Produits actifs</CardTitle>
              <Package className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Références au catalogue</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Arrivages prévus</CardTitle>
              <Truck className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{pendingArrivals.length}</div>
              <p className="text-xs text-muted-foreground mt-1">En attente ou en transit</p>
            </CardContent>
          </Card>
        </div>
      </div>



      {/* Stock Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Actions rapides</h2>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/admin/products", icon: Package, title: "Catalogue Produits", desc: "Gérer les produits et stocks", color: "text-orange-600", bg: "bg-orange-500/10" },
            { href: "/admin/forecast", icon: BarChart3, title: "Prévisions Stock", desc: "Planifier les réapprovisionnements", color: "text-blue-600", bg: "bg-blue-500/10" },
            { href: "/admin/spare-parts", icon: Wrench, title: "Pièces Détachées", desc: "Gérer les pièces et modèles", color: "text-amber-600", bg: "bg-amber-500/10" },
            { href: "/admin/orders", icon: ShoppingBag, title: "Commandes", desc: "Voir les commandes en cours", color: "text-emerald-600", bg: "bg-emerald-500/10" },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Card key={a.href} className="card-hover cursor-pointer group" onClick={() => window.location.href = a.href}>
                <CardHeader className="pb-3">
                  <div className={`w-10 h-10 rounded-lg ${a.bg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${a.color}`} />
                  </div>
                  <CardTitle className="text-sm">{a.title}</CardTitle>
                  <CardDescription className="text-xs">{a.desc}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SAV DASHBOARD SECTION
// ==========================================
function SavDashboardSection() {
  const { data: savStats } = trpc.afterSales.stats.useQuery({ period: "8weeks" });
  const { data: recentTickets } = trpc.afterSales.list.useQuery({ limit: 5 });
  const recentTicketsSafe = useSafeQuery(recentTickets);

  const stats = savStats as any;
  const openTickets = stats?.byStatus?.find((s: any) => s.status === "OPEN")?.count || 0;
  const inProgressTickets = stats?.byStatus?.filter((s: any) => !["OPEN", "CLOSED", "RESOLVED"].includes(s.status))
    .reduce((sum: number, s: any) => sum + (s.count || 0), 0) || 0;
  const resolvedTickets = stats?.byStatus?.find((s: any) => s.status === "RESOLVED")?.count || 0;
  const closedTickets = stats?.byStatus?.find((s: any) => s.status === "CLOSED")?.count || 0;

  const urgentTickets = stats?.byUrgency?.find((u: any) => u.urgency === "CRITICAL" || u.urgency === "HIGH")?.count || 0;

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      OPEN: "Ouvert", DIAGNOSED: "Diagnostiqué", PARTS_ORDERED: "Pièces commandées",
      REPAIR_SCHEDULED: "Réparation planifiée", IN_REPAIR: "En réparation",
      QUOTE_PENDING: "Devis en attente", RESOLVED: "Résolu", CLOSED: "Fermé",
    };
    return labels[status] || status;
  };

  const getUrgencyBadge = (urgency: string) => {
    const config: Record<string, { label: string; className: string }> = {
      LOW: { label: "Faible", className: "bg-muted text-foreground" },
      MEDIUM: { label: "Moyen", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      HIGH: { label: "Élevé", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
      CRITICAL: { label: "Critique", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
    };
    const c = config[urgency] || config.MEDIUM;
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* SAV KPIs */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <HeadphonesIcon className="w-5 h-5 text-red-600" />
          Service Après-Vente (8 dernières semaines)
        </h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total tickets</CardTitle>
              <HeadphonesIcon className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalTickets || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{urgentTickets} urgents</p>
            </CardContent>
          </Card>
          <Card className={openTickets > 0 ? "border-orange-500/30" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ouverts</CardTitle>
              <AlertCircle className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${openTickets > 0 ? "text-orange-600" : ""}`}>{openTickets}</div>
              <p className="text-xs text-muted-foreground mt-1">En attente de traitement</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
              <Clock className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{inProgressTickets}</div>
              <p className="text-xs text-muted-foreground mt-1">Diagnostic, réparation, devis...</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Résolus</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{resolvedTickets + closedTickets}</div>
              <p className="text-xs text-muted-foreground mt-1">Traités avec succès</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Warranty breakdown */}
      {stats?.byWarrantyStatus && stats.byWarrantyStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="w-5 h-5" />
              Répartition par garantie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.byWarrantyStatus.map((ws: any) => {
                const labels: Record<string, string> = {
                  PENDING: "En attente", UNDER_WARRANTY: "Sous garantie",
                  OUT_OF_WARRANTY: "Hors garantie", PARTIAL_WARRANTY: "Garantie partielle",
                };
                return (
                  <div key={ws.warrantyStatus} className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground">{labels[ws.warrantyStatus] || ws.warrantyStatus}</p>
                    <p className="text-xl font-bold mt-1">{ws.count}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent SAV Tickets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Tickets récents
            </CardTitle>
            <CardDescription>Les derniers tickets SAV</CardDescription>
          </div>
          <Link href="/admin/after-sales">
            <Button variant="ghost" size="sm" className="gap-1">Voir tout <ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentTicketsSafe.length > 0 ? (
            <div className="space-y-3">
              {recentTicketsSafe.slice(0, 5).map((ticket: any) => (
                <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <HeadphonesIcon className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{ticket.ticketNumber || `SAV-${ticket.id}`}</p>
                      <p className="text-xs text-muted-foreground">{ticket.brand} — {ticket.issueType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getUrgencyBadge(ticket.urgency)}
                    <Badge variant="outline">{getStatusLabel(ticket.status)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-500 opacity-70" />
              <p>Aucun ticket SAV récent</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SAV Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Actions rapides</h2>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/admin/after-sales", icon: HeadphonesIcon, title: "Tickets SAV", desc: "Gérer les demandes SAV", color: "text-red-600", bg: "bg-red-500/10" },
            { href: "/admin/spare-parts", icon: Wrench, title: "Pièces Détachées", desc: "Stock de pièces et modèles", color: "text-orange-600", bg: "bg-orange-500/10" },
            { href: "/admin/technical-resources", icon: BookOpen, title: "Ressources Techniques", desc: "Guides et vidéos de réparation", color: "text-amber-600", bg: "bg-amber-500/10" },
            { href: "/admin/partners", icon: Users, title: "Partenaires", desc: "Voir les partenaires concernés", color: "text-blue-600", bg: "bg-blue-500/10" },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Card key={a.href} className="card-hover cursor-pointer group" onClick={() => window.location.href = a.href}>
                <CardHeader className="pb-3">
                  <div className={`w-10 h-10 rounded-lg ${a.bg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${a.color}`} />
                  </div>
                  <CardTitle className="text-sm">{a.title}</CardTitle>
                  <CardDescription className="text-xs">{a.desc}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// ORDERS DASHBOARD SECTION
// ==========================================
function OrdersDashboardSection() {
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: recentOrders } = trpc.orders.list.useQuery({ limit: 8 });
  const recentOrdersSafe = useSafeQuery(recentOrders);
  const { data: salesData } = trpc.admin.analytics.salesByMonth.useQuery({ months: 6 });
  const { data: partnerPerf } = trpc.admin.analytics.partnerPerformance.useQuery({ limit: 5 });
  const partnerPerfSafe = useSafeQuery(partnerPerf);

  const formatPrice = (price: number | string | null) => {
    if (!price) return "0.00 €";
    return `${Number(price).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      PENDING_APPROVAL: { label: "En attente", variant: "secondary" },
      PENDING_DEPOSIT: { label: "Acompte requis", variant: "outline" },
      DEPOSIT_PAID: { label: "Acompte payé", variant: "default" },
      IN_PRODUCTION: { label: "En production", variant: "default" },
      READY_TO_SHIP: { label: "Prêt à expédier", variant: "default" },
      SHIPPED: { label: "Expédié", variant: "default" },
      DELIVERED: { label: "Livré", variant: "default" },
      COMPLETED: { label: "Terminé", variant: "default" },
      CANCELLED: { label: "Annulé", variant: "destructive" },
    };
    const config = statusConfig[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const avgOrderValue = (stats?.totalOrders || 0) > 0 
    ? ((stats?.totalRevenue || 0) / (stats?.totalOrders || 1)) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Orders KPIs */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-emerald-600" />
          Commandes & Chiffre d'affaires
        </h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Commandes totales</CardTitle>
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Toutes les commandes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Chiffre d'affaires</CardTitle>
              <Euro className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(stats?.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">Commandes terminées</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Panier moyen</CardTitle>
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(avgOrderValue)}</div>
              <p className="text-xs text-muted-foreground mt-1">Valeur moyenne par commande</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Partenaires actifs</CardTitle>
              <Users className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalPartners || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Partenaires approuvés</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Évolution des ventes</CardTitle>
            <CardDescription>CA et commandes sur 6 mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {salesData && (salesData as any[]).length > 0 ? (
                <SalesChart data={salesData as any} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Aucune donnée de vente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Partners */}
        <Card>
          <CardHeader>
            <CardTitle>Top partenaires</CardTitle>
            <CardDescription>Par volume de commandes</CardDescription>
          </CardHeader>
          <CardContent>
            {partnerPerfSafe.length > 0 ? (
              <div className="space-y-3">
                {partnerPerfSafe.slice(0, 5).map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{p.partnerName || `Partenaire #${p.partnerId}`}</p>
                        <p className="text-xs text-muted-foreground">{p.orderCount} commandes</p>
                      </div>
                    </div>
                    <p className="font-semibold text-sm">{formatPrice(p.totalRevenue)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune donnée de performance</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Commandes récentes
            </CardTitle>
            <CardDescription>Les dernières commandes</CardDescription>
          </div>
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm" className="gap-1">Voir tout <ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentOrdersSafe.length > 0 ? (
            <div className="space-y-3">
              {recentOrdersSafe.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(order.totalTTC)}</p>
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune commande récente</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Actions rapides</h2>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/admin/orders", icon: ShoppingBag, title: "Commandes", desc: "Gérer toutes les commandes", color: "text-emerald-600", bg: "bg-emerald-500/10" },
            { href: "/admin/partners", icon: Users, title: "Partenaires", desc: "Gérer les comptes partenaires", color: "text-blue-600", bg: "bg-blue-500/10" },
            { href: "/admin/reports", icon: BarChart3, title: "Rapports", desc: "Exporter les données", color: "text-purple-600", bg: "bg-purple-500/10" },
            { href: "/admin/products", icon: Package, title: "Produits", desc: "Voir le catalogue", color: "text-orange-600", bg: "bg-orange-500/10" },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Card key={a.href} className="card-hover cursor-pointer group" onClick={() => window.location.href = a.href}>
                <CardHeader className="pb-3">
                  <div className={`w-10 h-10 rounded-lg ${a.bg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${a.color}`} />
                  </div>
                  <CardTitle className="text-sm">{a.title}</CardTitle>
                  <CardDescription className="text-xs">{a.desc}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// FULL / SUPER ADMIN DASHBOARD (existing)
// ==========================================
function FullAdminDashboardSection() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: recentOrders } = trpc.orders.list.useQuery({ limit: 5 });
  const recentOrdersSafe = useSafeQuery(recentOrders);
  const { data: salesData } = trpc.admin.analytics.salesByMonth.useQuery({ months: 6 });
  const { data: topProductsData } = trpc.admin.analytics.topProducts.useQuery({ limit: 5 });

  const formatPrice = (price: number | string | null) => {
    if (!price) return "0.00 €";
    return `${Number(price).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      PENDING_APPROVAL: { label: "En attente", variant: "secondary" },
      PENDING_DEPOSIT: { label: "Acompte requis", variant: "outline" },
      DEPOSIT_PAID: { label: "Acompte payé", variant: "default" },
      IN_PRODUCTION: { label: "En production", variant: "default" },
      READY_TO_SHIP: { label: "Prêt à expédier", variant: "default" },
      SHIPPED: { label: "Expédié", variant: "default" },
      DELIVERED: { label: "Livré", variant: "default" },
      COMPLETED: { label: "Terminé", variant: "default" },
      CANCELLED: { label: "Annulé", variant: "destructive" },
    };
    const config = statusConfig[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const statsCards = [
    {
      title: "Partenaires actifs",
      value: stats?.totalPartners || 0,
      icon: Users,
      description: "Réseau actif",
      color: "text-info dark:text-info-dark",
      bgColor: "bg-info/10 dark:bg-info-light",
    },
    {
      title: "Commandes",
      value: stats?.totalOrders || 0,
      icon: ShoppingBag,
      description: "Total commandes",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    },
    {
      title: "Chiffre d'affaires",
      value: formatPrice(stats?.totalRevenue),
      icon: Euro,
      description: "Commandes terminées",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
    },
    {
      title: "Produits au catalogue",
      value: stats?.totalProducts || 0,
      icon: Package,
      description: "Au catalogue",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-500/10 dark:bg-orange-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map((i) => (
            <Card key={i}><CardHeader className="pb-3"><div className="skeleton h-4 w-24 mb-2 bg-muted animate-pulse rounded" /><div className="skeleton h-8 w-16 bg-muted animate-pulse rounded" /></CardHeader></Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="card-hover">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}><Icon className={`w-4 h-4 ${stat.color}`} /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl text-display font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Orders + Stock */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" />Commandes récentes</CardTitle>
              <CardDescription>Les 5 dernières commandes</CardDescription>
            </div>
            <Link href="/admin/orders"><Button variant="ghost" size="sm" className="gap-1">Voir tout <ArrowRight className="w-4 h-4" /></Button></Link>
          </CardHeader>
          <CardContent>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrdersSafe.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-primary" /></div>
                      <div><p className="font-medium">{order.orderNumber}</p><p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p></div>
                    </div>
                    <div className="text-right"><p className="font-semibold">{formatPrice(order.totalTTC)}</p>{getStatusBadge(order.status)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground"><ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Aucune commande récente</p></div>
            )}
          </CardContent>
        </Card>


      </div>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Évolution des ventes</CardTitle><CardDescription>CA et commandes sur 6 mois</CardDescription></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {salesData && (salesData as any[]).length > 0 ? <SalesChart data={salesData as any} /> : <div className="flex items-center justify-center h-full text-muted-foreground"><p>Aucune donnée</p></div>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top 5 produits</CardTitle><CardDescription>Produits les plus vendus</CardDescription></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {topProductsData && (topProductsData as any[]).length > 0 ? <TopProductsChart data={topProductsData as any} /> : <div className="flex items-center justify-center h-full text-muted-foreground"><p>Aucune donnée</p></div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Accès rapides</h2>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/admin/products", icon: Package, title: "Produits", desc: "Catalogue produits", color: "text-primary", bg: "bg-primary/10" },
            { href: "/admin/partners", icon: Users, title: "Partenaires", desc: "Comptes partenaires", color: "text-blue-600", bg: "bg-blue-500/10" },
            { href: "/admin/orders", icon: ShoppingBag, title: "Commandes", desc: "Gérer les commandes", color: "text-emerald-600", bg: "bg-emerald-500/10" },
            { href: "/admin/leads", icon: Target, title: "Marketing", desc: "Leads et campagnes", color: "text-blue-600", bg: "bg-blue-500/10" },
            { href: "/admin/after-sales", icon: HeadphonesIcon, title: "SAV", desc: "Tickets SAV", color: "text-red-600", bg: "bg-red-500/10" },
            { href: "/admin/spare-parts", icon: Wrench, title: "Pièces", desc: "Pièces détachées", color: "text-orange-600", bg: "bg-orange-500/10" },
            { href: "/admin/newsletter", icon: Mail, title: "Newsletter", desc: "Campagnes email", color: "text-teal-600", bg: "bg-teal-500/10" },
            { href: "/admin/users", icon: Users, title: "Utilisateurs", desc: "Gérer les accès", color: "text-violet-600", bg: "bg-violet-500/10" },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Card key={a.href} className="card-hover cursor-pointer group" onClick={() => window.location.href = a.href}>
                <CardHeader className="pb-3">
                  <div className={`w-10 h-10 rounded-lg ${a.bg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${a.color}`} />
                  </div>
                  <CardTitle className="text-sm">{a.title}</CardTitle>
                  <CardDescription className="text-xs">{a.desc}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN DASHBOARD COMPONENT
// ==========================================
export default function AdminDashboard() {
  const { user } = useAuth();
  const userRole = user?.role;
  const adminPerms = (user as any)?.adminPermissions;

  // Detect the role preset for specialized dashboards
  const preset = (user as any)?.adminRolePreset;
  const isSuper = userRole === "SUPER_ADMIN";
  const isFull = isSuper || preset === "ADMIN_FULL";

  // Check individual module access for custom roles
  const canOrders = hasModule(userRole, adminPerms, "orders");
  const canPartners = hasModule(userRole, adminPerms, "partners");
  const canProducts = hasModule(userRole, adminPerms, "products");
  const canStock = hasModule(userRole, adminPerms, "stock");
  const canMarketing = hasModule(userRole, adminPerms, "marketing");
  const canSav = hasModule(userRole, adminPerms, "sav");
  const canReports = hasModule(userRole, adminPerms, "reports");

  // Determine role label
  const getRoleLabel = () => {
    if (isSuper) return "Super Administrateur";
    const presetLabels: Record<string, string> = {
      ADMIN_FULL: "Administrateur Complet",
      ADMIN_STOCK: "Gestionnaire Stock",
      ADMIN_SAV: "Gestionnaire SAV",
      ADMIN_MARKETING: "Gestionnaire Marketing",
      ADMIN_ORDERS: "Gestionnaire Commandes",
      ADMIN_CUSTOM: "Administrateur",
    };
    return presetLabels[preset] || "Administrateur";
  };

  const getRoleDescription = () => {
    if (isSuper || isFull) return "Vous avez accès à l'ensemble des modules d'administration.";
    const descriptions: Record<string, string> = {
      ADMIN_STOCK: "Gérez les stocks, les produits, les prévisions de réapprovisionnement et les pièces détachées.",
      ADMIN_SAV: "Suivez les tickets SAV, gérez les pièces détachées et les ressources techniques.",
      ADMIN_MARKETING: "Pilotez le marketing : leads, campagnes Meta/Google, newsletter, agenda et territoires.",
      ADMIN_ORDERS: "Gérez les commandes, les partenaires et les rapports commerciaux.",
    };
    return descriptions[preset] || "Votre dashboard affiche les modules auxquels vous avez accès.";
  };

  // Determine which specialized dashboard to show
  const renderDashboardContent = () => {
    // Super Admin or Full Admin -> full dashboard
    if (isFull) {
      return <FullAdminDashboardSection />;
    }

    // Specialized role dashboards
    if (preset === "ADMIN_MARKETING") {
      return <MarketingDashboardSection />;
    }
    if (preset === "ADMIN_STOCK") {
      return <StockDashboardSection />;
    }
    if (preset === "ADMIN_SAV") {
      return <SavDashboardSection />;
    }
    if (preset === "ADMIN_ORDERS") {
      return <OrdersDashboardSection />;
    }

    // Custom role - show a mix based on permissions
    return <CustomRoleDashboard 
      canOrders={canOrders} canPartners={canPartners} canProducts={canProducts}
      canStock={canStock} canMarketing={canMarketing} canSav={canSav} canReports={canReports}
    />;
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard Administration</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              {getRoleLabel()} — {user?.firstName || user?.name || "Admin"}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              {getRoleDescription()}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/dashboard" className="flex-1 sm:flex-none">
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <Activity className="w-4 h-4" />
                Dashboard Utilisateur
              </Button>
            </Link>
            {canReports && (
              <Link href="/admin/reports" className="flex-1 sm:flex-none">
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <BarChart3 className="w-4 h-4" />
                  Rapports
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Role-specific dashboard content */}
        {renderDashboardContent()}
      </div>
    </AdminLayout>
  );
}

// ==========================================
// CUSTOM ROLE DASHBOARD (fallback for ADMIN_CUSTOM)
// ==========================================
function CustomRoleDashboard({ canOrders, canPartners, canProducts, canStock, canMarketing, canSav, canReports }: {
  canOrders: boolean; canPartners: boolean; canProducts: boolean;
  canStock: boolean; canMarketing: boolean; canSav: boolean; canReports: boolean;
}) {
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: recentOrders } = trpc.orders.list.useQuery({ limit: 5 }, { enabled: canOrders });
  const recentOrdersSafe = useSafeQuery(recentOrders);


  const formatPrice = (price: number | string | null) => {
    if (!price) return "0.00 €";
    return `${Number(price).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  };

  // Build KPI cards dynamically
  const kpis = [];
  if (canPartners) kpis.push({ title: "Partenaires", value: stats?.totalPartners || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-500/10" });
  if (canOrders) {
    kpis.push({ title: "Commandes", value: stats?.totalOrders || 0, icon: ShoppingBag, color: "text-emerald-600", bg: "bg-emerald-500/10" });
    kpis.push({ title: "CA", value: formatPrice(stats?.totalRevenue), icon: Euro, color: "text-purple-600", bg: "bg-purple-500/10" });
  }
  if (canStock || canProducts) kpis.push({ title: "Produits", value: stats?.totalProducts || 0, icon: Package, color: "text-orange-600", bg: "bg-orange-500/10" });

  // Build quick actions
  const actions = [];
  if (canProducts || canStock) actions.push({ href: "/admin/products", icon: Package, title: "Produits", desc: "Catalogue", color: "text-orange-600", bg: "bg-orange-500/10" });
  if (canOrders) actions.push({ href: "/admin/orders", icon: ShoppingBag, title: "Commandes", desc: "Gérer", color: "text-emerald-600", bg: "bg-emerald-500/10" });
  if (canPartners) actions.push({ href: "/admin/partners", icon: Users, title: "Partenaires", desc: "Comptes", color: "text-blue-600", bg: "bg-blue-500/10" });
  if (canMarketing) actions.push({ href: "/admin/leads", icon: Target, title: "Marketing", desc: "Leads", color: "text-blue-600", bg: "bg-blue-500/10" });
  if (canSav) actions.push({ href: "/admin/after-sales", icon: HeadphonesIcon, title: "SAV", desc: "Tickets", color: "text-red-600", bg: "bg-red-500/10" });
  if (canReports) actions.push({ href: "/admin/reports", icon: BarChart3, title: "Rapports", desc: "Données", color: "text-purple-600", bg: "bg-purple-500/10" });

  return (
    <div className="space-y-6">
      {/* KPIs */}
      {kpis.length > 0 && (
        <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(kpis.length, 4)}`}>
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${kpi.bg}`}><Icon className={`w-4 h-4 ${kpi.color}`} /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Content sections based on permissions */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {canOrders && recentOrdersSafe.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Commandes récentes</CardTitle></div>
              <Link href="/admin/orders"><Button variant="ghost" size="sm" className="gap-1">Voir tout <ArrowRight className="w-4 h-4" /></Button></Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentOrdersSafe.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div><p className="font-medium text-sm">{order.orderNumber}</p><p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p></div>
                    <p className="font-semibold text-sm">{formatPrice(order.totalTTC)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}


      </div>

      {/* Quick Actions */}
      {actions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Actions rapides</h2>
          <div className={`grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(actions.length, 4)}`}>
            {actions.map((a) => {
              const Icon = a.icon;
              return (
                <Card key={a.href} className="card-hover cursor-pointer group" onClick={() => window.location.href = a.href}>
                  <CardHeader className="pb-3">
                    <div className={`w-10 h-10 rounded-lg ${a.bg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${a.color}`} />
                    </div>
                    <CardTitle className="text-sm">{a.title}</CardTitle>
                    <CardDescription className="text-xs">{a.desc}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
