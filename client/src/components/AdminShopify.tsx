import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  ShoppingBag, TrendingUp, Users, Package,
  CalendarIcon, RefreshCw, Unlink, ShoppingCart, Euro,
  ArrowUpRight, ArrowDownRight, Globe, MousePointerClick, ShoppingBasket,
} from "lucide-react";

// ─── Types locaux ────────────────────────────────────────────────────────────
interface DateRange { from?: Date; to?: Date }

const PRESETS = [
  { label: "7 jours", days: 7 },
  { label: "14 jours", days: 14 },
  { label: "30 jours", days: 30 },
  { label: "90 jours", days: 90 },
];

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"];

function fmt(n: number, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}
function fmtNum(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}
function fmtDate(d: Date) {
  return format(d, "dd/MM/yyyy", { locale: fr });
}

// ─── Delta Badge ─────────────────────────────────────────────────────────────
function DeltaBadge({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined || previous === 0) return null;
  const delta = ((current - previous) / previous) * 100;
  const abs = Math.abs(delta).toFixed(1);
  if (Math.abs(delta) < 0.5) return <span className="text-xs text-muted-foreground ml-1">~0%</span>;
  if (delta > 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600 ml-1">
      <ArrowUpRight className="h-3 w-3" />+{abs}%
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-red-500 ml-1">
      <ArrowDownRight className="h-3 w-3" />-{abs}%
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  title, value, subValue, icon: Icon, compare, color = "emerald",
}: {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ElementType;
  compare?: number;
  color?: string;
}) {
  const bg: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{title}</p>
            <p className="text-xl font-bold mt-0.5 truncate">{value}</p>
            {subValue && <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>}
          </div>
          <div className={`rounded-lg p-2 shrink-0 ${bg[color] || bg.emerald}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        {compare !== undefined && (
          <div className="mt-1">
            <DeltaBadge current={parseFloat(value.replace(/[^0-9.-]/g, ""))} previous={compare} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function AdminShopify() {
  const utils = trpc.useUtils();

  // Période sélectionnée
  const [preset, setPreset] = useState(30);
  const [customRange, setCustomRange] = useState<DateRange>({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [compareEnabled, setCompareEnabled] = useState(false);

  // Calcul des dates
  const today = new Date();
  const endDate = customRange.to ? format(customRange.to, "yyyy-MM-dd") : format(today, "yyyy-MM-dd");
  const startDate = customRange.from
    ? format(customRange.from, "yyyy-MM-dd")
    : format(subDays(today, preset - 1), "yyyy-MM-dd");

  const diffDays = Math.round(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
  const compareEndDate = format(subDays(new Date(startDate), 1), "yyyy-MM-dd");
  const compareStartDate = format(subDays(new Date(startDate), diffDays), "yyyy-MM-dd");

  // Queries tRPC
  const accountQuery = trpc.shopify.getConnectedAccount.useQuery(undefined, { retry: false });
  const oauthUrlQuery = trpc.shopify.getOAuthUrl.useQuery({}, { enabled: false, retry: false });
  const reportQuery = trpc.shopify.getReport.useQuery(
    {
      startDate,
      endDate,
      compareStartDate: compareEnabled ? compareStartDate : undefined,
      compareEndDate: compareEnabled ? compareEndDate : undefined,
    },
    { enabled: !!accountQuery.data, retry: false }
  );
  const trafficQuery = trpc.shopify.getTrafficReport.useQuery(
    { startDate, endDate },
    { enabled: !!accountQuery.data, retry: false }
  );
  const disconnectMutation = trpc.shopify.disconnectAccount.useMutation({
    onSuccess: () => {
      toast.success("Boutique Shopify déconnectée");
      utils.shopify.getConnectedAccount.invalidate();
    },
  });

  // Détection du callback OAuth (paramètre ?shopify=true dans l'URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("shopify") === "true") {
      toast.success("Boutique Shopify connectée avec succès !");
      utils.shopify.getConnectedAccount.invalidate();
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("shopify");
      window.history.replaceState({}, "", newUrl.toString());
    }
    const shopifyError = params.get("shopify_error");
    if (shopifyError) {
      toast.error(`Erreur Shopify : ${shopifyError}`);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("shopify_error");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, []);

  const handleConnect = async () => {
    try {
      const result = await utils.shopify.getOAuthUrl.fetch({});
      if (result?.url) {
        toast.info("Redirection vers Shopify...");
        window.location.href = result.url;
      }
    } catch (e) {
      toast.error("Impossible de générer l'URL d'autorisation Shopify");
    }
  };

  // ── État non connecté ────────────────────────────────────────────────────
  if (!accountQuery.data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Ventes Shopify — marketspas.com</h2>
            <p className="text-sm text-muted-foreground">Commandes, CA, clients et produits en temps réel</p>
          </div>
        </div>

        <Card className="border-dashed">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto">
              <ShoppingBag className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Connecter votre boutique Shopify</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Visualisez vos ventes, commandes, clients et produits les plus performants directement dans ce tableau de bord.
              </p>
            </div>
            <Button
              onClick={handleConnect}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={accountQuery.isLoading}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Connecter Shopify
            </Button>
            <div className="mt-4 p-3 bg-muted rounded-lg text-left text-xs text-muted-foreground max-w-md mx-auto">
              <p className="font-medium mb-1">Configuration requise dans le Dev Dashboard Shopify :</p>
              <p>URL de l'application : <code className="bg-background px-1 rounded">https://marketspas.pro</code></p>
              <p>URL de redirection : <code className="bg-background px-1 rounded">https://marketspas.pro/api/shopify/callback</code></p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const account = accountQuery.data;
  const report = reportQuery.data;
  const overview = report?.overview;
  const compareOverview = report?.compareOverview;
  const traffic = trafficQuery.data;

  // ── Sélecteur de période ─────────────────────────────────────────────────
  const PeriodSelector = (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <Button
          key={p.days}
          variant={preset === p.days && !customRange.from ? "default" : "outline"}
          size="sm"
          className="text-xs h-7"
          onClick={() => { setPreset(p.days); setCustomRange({}); }}
        >
          {p.label}
        </Button>
      ))}
      <Popover open={showCalendar} onOpenChange={setShowCalendar}>
        <PopoverTrigger asChild>
          <Button
            variant={customRange.from ? "default" : "outline"}
            size="sm"
            className="text-xs h-7 gap-1"
          >
            <CalendarIcon className="h-3 w-3" />
            {customRange.from
              ? `${fmtDate(customRange.from)} → ${customRange.to ? fmtDate(customRange.to) : "..."}`
              : "Personnalisé"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={customRange as { from: Date; to: Date }}
            onSelect={(range) => {
              setCustomRange(range || {});
              if (range?.from && range?.to) setShowCalendar(false);
            }}
            disabled={{ after: today }}
            numberOfMonths={2}
            locale={fr}
          />
        </PopoverContent>
      </Popover>
      <Button
        variant={compareEnabled ? "default" : "outline"}
        size="sm"
        className="text-xs h-7"
        onClick={() => setCompareEnabled(!compareEnabled)}
      >
        Comparer
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-xs h-7"
        onClick={() => reportQuery.refetch()}
        disabled={reportQuery.isFetching}
      >
        <RefreshCw className={`h-3 w-3 ${reportQuery.isFetching ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Shopify Analytics</h2>
              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50">
                {account.shopName || account.shopDomain}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {startDate} → {endDate}
              {compareEnabled && <span className="ml-2 text-xs">(vs {compareStartDate} → {compareEndDate})</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {PeriodSelector}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-red-500 hover:text-red-700 h-7"
            onClick={() => disconnectMutation.mutate()}
          >
            <Unlink className="h-3 w-3 mr-1" />
            Déconnecter
          </Button>
        </div>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="sales">
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="sales" className="text-xs gap-1.5">
            <ShoppingCart className="h-3.5 w-3.5" />
            Ventes
          </TabsTrigger>
          <TabsTrigger value="traffic" className="text-xs gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            Trafic
          </TabsTrigger>
        </TabsList>

        {/* ── Onglet Ventes ─────────────────────────────────────────────── */}
        <TabsContent value="sales" className="space-y-4 mt-4">
          {reportQuery.isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}><CardContent className="pt-4 pb-3"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>
              ))}
            </div>
          )}
          {reportQuery.error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4 text-sm text-red-600">
                Erreur : {reportQuery.error.message}
              </CardContent>
            </Card>
          )}
          {overview && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard title="Chiffre d'affaires" value={fmt(overview.totalRevenue, overview.currency)} icon={Euro} color="emerald" compare={compareOverview?.totalRevenue} />
                <KpiCard title="Commandes" value={fmtNum(overview.totalOrders)} icon={ShoppingCart} color="blue" compare={compareOverview?.totalOrders} />
                <KpiCard title="Panier moyen" value={fmt(overview.averageOrderValue, overview.currency)} icon={TrendingUp} color="amber" compare={compareOverview?.averageOrderValue} />
                <KpiCard title="Clients uniques" value={fmtNum(overview.totalCustomers)} subValue={`${overview.newCustomers} nouveaux · ${overview.returningCustomers} récurrents`} icon={Users} color="violet" compare={compareOverview?.totalCustomers} />
              </div>
              {report.dailyRevenue && report.dailyRevenue.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Évolution du chiffre d'affaires</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={report.dailyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}€`} />
                        <Tooltip formatter={(v: number) => [fmt(v, overview.currency), "CA"]} labelFormatter={(l) => format(new Date(l), "dd MMMM yyyy", { locale: fr })} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" name="CA (€)" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
              {report.dailyRevenue && report.dailyRevenue.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Commandes par jour</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={report.dailyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip formatter={(v: number) => [v, "Commandes"]} labelFormatter={(l) => format(new Date(l), "dd MMMM yyyy", { locale: fr })} />
                        <Bar dataKey="orders" name="Commandes" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.topProducts && report.topProducts.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Package className="h-4 w-4 text-amber-500" />
                        Top 10 produits
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {report.topProducts.slice(0, 10).map((p, i) => (
                          <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                              {p.imageUrl && <img src={p.imageUrl} alt={p.title} className="w-7 h-7 rounded object-cover shrink-0" />}
                              <span className="truncate text-xs">{p.title}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs font-medium">{fmt(p.totalRevenue, overview.currency)}</div>
                              <div className="text-xs text-muted-foreground">{p.totalSold} vendus</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {report.orderStatuses && report.orderStatuses.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-blue-500" />
                        Statuts des commandes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={report.orderStatuses} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {report.orderStatuses.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                          </Pie>
                          <Tooltip formatter={(v: number, name: string) => [v, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-2 space-y-1">
                        {report.orderStatuses.map((s, i) => (
                          <div key={s.status} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              <span>{s.status}</span>
                            </div>
                            <span className="font-medium">{s.count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              {overview.totalOrders === 0 && (
                <Card className="border-dashed">
                  <CardContent className="pt-6 pb-6 text-center text-sm text-muted-foreground">
                    Aucune commande payée sur cette période.
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Onglet Trafic ─────────────────────────────────────────────── */}
        <TabsContent value="traffic" className="space-y-4 mt-4">
          {trafficQuery.isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}><CardContent className="pt-4 pb-3"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>
              ))}
            </div>
          )}
          {trafficQuery.error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4 text-sm text-red-600">
                Erreur trafic : {trafficQuery.error.message}
              </CardContent>
            </Card>
          )}
          {traffic && (
            <>
              {/* KPIs trafic */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <KpiCard
                  title="Sessions totales"
                  value={fmtNum(traffic.totalSessions)}
                  icon={Globe}
                  color="blue"
                />
                <KpiCard
                  title="Taux de conversion"
                  value={`${traffic.conversionRate.toFixed(2)}%`}
                  icon={MousePointerClick}
                  color="emerald"
                />
                <KpiCard
                  title="Abandon panier"
                  value={`${traffic.cartAbandonmentRate.toFixed(2)}%`}
                  icon={ShoppingBasket}
                  color="amber"
                />
              </div>

              {/* Graphique sessions journalières */}
              {traffic.dailySessions && traffic.dailySessions.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Sessions par jour</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={traffic.dailySessions} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip formatter={(v: number) => [fmtNum(v), "Sessions"]} labelFormatter={(l) => format(new Date(l), "dd MMMM yyyy", { locale: fr })} />
                        <Bar dataKey="sessions" name="Sessions" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Sources de trafic */}
              {traffic.trafficSources && traffic.trafficSources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Camembert sources */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-500" />
                        Répartition des sources
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={traffic.trafficSources}
                            dataKey="sessions"
                            nameKey="source"
                            cx="50%"
                            cy="50%"
                            outerRadius={75}
                            label={({ source, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                            labelLine={false}
                          >
                            {traffic.trafficSources.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                          </Pie>
                          <Tooltip formatter={(v: number, name: string) => [fmtNum(v) + " sessions", name]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-2 space-y-1">
                        {traffic.trafficSources.map((s, i) => (
                          <div key={s.source} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              <span className="capitalize">{s.source || 'Direct'}</span>
                            </div>
                            <span className="font-medium">{fmtNum(s.sessions)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tableau détaillé */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <MousePointerClick className="h-4 w-4 text-emerald-500" />
                        Détail par source
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {traffic.trafficSources.map((s, i) => {
                          const totalSess = traffic.trafficSources.reduce((acc, x) => acc + x.sessions, 0);
                          const pct = totalSess > 0 ? (s.sessions / totalSess) * 100 : 0;
                          return (
                            <div key={s.source} className="space-y-0.5">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                  <span className="capitalize font-medium">{s.source || 'Direct'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                  <span>{fmtNum(s.sessions)} sess.</span>
                                  <span className="text-emerald-600">{s.conversionRate.toFixed(1)}% conv.</span>
                                </div>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full"
                                  style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                !trafficQuery.isLoading && (
                  <Card className="border-dashed">
                    <CardContent className="pt-6 pb-6 text-center text-sm text-muted-foreground">
                      <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>Aucune donnée de trafic disponible pour cette période.</p>
                      <p className="text-xs mt-1">Les données de sessions nécessitent le scope <code>read_analytics</code> dans votre application Shopify.</p>
                    </CardContent>
                  </Card>
                )
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
