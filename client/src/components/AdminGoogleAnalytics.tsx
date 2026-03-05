import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Eye, MousePointer, Clock, Wifi, WifiOff,
  RefreshCw, ExternalLink, Monitor, Smartphone, Tablet,
  BarChart2, Globe, CalendarIcon, Minus
} from "lucide-react";
import { toast } from "sonner";
import { format, subDays, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
// DateRange est défini dans react-day-picker/dist/cjs/types/shared mais pas réexporté depuis l'index
// On utilise une définition locale compatible
type DateRange = { from?: Date; to?: Date };

// ── Couleurs ─────────────────────────────────────────────────────────────────
const DEVICE_COLORS: Record<string, string> = {
  desktop: "#3b82f6",
  mobile: "#10b981",
  tablet: "#f59e0b",
};

const SOURCE_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function toIsoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function deltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

// ── Composant delta ───────────────────────────────────────────────────────────
function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  const delta = deltaPercent(current, previous);
  if (delta === null) return null;
  const isPositive = delta >= 0;
  const Icon = delta === 0 ? Minus : isPositive ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
      }`}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

// ── Préréglages de période ────────────────────────────────────────────────────
type PresetKey = "7" | "14" | "30" | "90" | "custom";

const PRESETS: { label: string; value: PresetKey; days?: number }[] = [
  { label: "7 derniers jours", value: "7", days: 7 },
  { label: "14 derniers jours", value: "14", days: 14 },
  { label: "30 derniers jours", value: "30", days: 30 },
  { label: "90 derniers jours", value: "90", days: 90 },
  { label: "Période personnalisée", value: "custom" },
];

// ── Props ─────────────────────────────────────────────────────────────────────
interface AdminGoogleAnalyticsProps {
  /** Appelé quand le code OAuth GA4 est détecté et traité */
  onCallbackHandled?: () => void;
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function AdminGoogleAnalytics({ onCallbackHandled }: AdminGoogleAnalyticsProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  // ── Sélecteur de période ──────────────────────────────────────────────────
  const [preset, setPreset] = useState<PresetKey>("30");
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Calculer les dates effectives
  const today = startOfDay(new Date());
  const effectiveDates = (() => {
    if (preset !== "custom") {
      const days = Number(preset);
      return {
        startDate: toIsoDate(subDays(today, days)),
        endDate: toIsoDate(today),
        days,
      };
    }
    if (customRange?.from && customRange?.to) {
      return {
        startDate: toIsoDate(customRange.from),
        endDate: toIsoDate(customRange.to),
        days: undefined,
      };
    }
    // Fallback si plage personnalisée incomplète
    return { startDate: toIsoDate(subDays(today, 30)), endDate: toIsoDate(today), days: 30 };
  })();

  // ── Détection du callback OAuth GA4 ──────────────────────────────────────
  const urlParams = new URLSearchParams(window.location.search);
  const ga4Code = urlParams.get("code");
  const isGa4Callback = urlParams.get("ga4") === "true";
  const ga4Error = urlParams.get("ga4_error");

  const oauthUrlQuery = trpc.googleAnalytics.getOAuthUrl.useQuery(
    { state: "ga4_connect" },
    { enabled: false }
  );
  const handleCallbackMutation = trpc.googleAnalytics.handleCallback.useMutation();
  const disconnectMutation = trpc.googleAnalytics.disconnectAccount.useMutation();

  const reportQuery = trpc.googleAnalytics.getReport.useQuery(
    {
      startDate: effectiveDates.startDate,
      endDate: effectiveDates.endDate,
      ...(effectiveDates.days ? { days: effectiveDates.days } : {}),
    },
    { retry: false, refetchOnWindowFocus: false }
  );

  // ── Gestion des erreurs OAuth ─────────────────────────────────────────────
  useEffect(() => {
    if (ga4Error) {
      toast.error("Erreur de connexion Google Analytics", {
        description: decodeURIComponent(ga4Error),
      });
      const clean = new URL(window.location.href);
      clean.searchParams.delete("ga4_error");
      window.history.replaceState({}, "", clean.toString());
    }
  }, [ga4Error]);

  // ── Traitement du code OAuth ──────────────────────────────────────────────
  useEffect(() => {
    if (!ga4Code || !isGa4Callback || handleCallbackMutation.isPending) return;

    const clean = new URL(window.location.href);
    clean.searchParams.delete("code");
    clean.searchParams.delete("ga4");
    clean.searchParams.delete("state");
    window.history.replaceState({}, "", clean.toString());

    setIsConnecting(true);
    handleCallbackMutation.mutate(
      { code: ga4Code },
      {
        onSuccess: (data) => {
          setIsConnecting(false);
          toast.success("Google Analytics connecté", {
            description: `Propriété "${data.propertyName}" connectée avec succès.`,
          });
          reportQuery.refetch();
          onCallbackHandled?.();
        },
        onError: (err) => {
          setIsConnecting(false);
          toast.error("Erreur de connexion GA4", { description: err.message });
        },
      }
    );
  }, [ga4Code, isGa4Callback]);

  const handleConnect = async () => {
    const result = await oauthUrlQuery.refetch();
    if (result.data?.url) window.location.href = result.data.url;
  };

  const handleDisconnect = () => {
    const data = reportQuery.data;
    if (!data?.connected || !data.account) return;
    disconnectMutation.mutate(
      { id: data.account.id },
      {
        onSuccess: () => {
          toast.success("Compte GA4 déconnecté");
          reportQuery.refetch();
        },
      }
    );
  };

  // ── État non connecté ─────────────────────────────────────────────────────
  if (!reportQuery.data?.connected && !reportQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-orange-500" />
            Google Analytics 4 — marketspas.com
          </CardTitle>
          <CardDescription>
            Connectez votre propriété GA4 pour afficher les métriques de trafic de marketspas.com
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <div className="rounded-full bg-orange-100 dark:bg-orange-900/20 p-6">
            <WifiOff className="h-10 w-10 text-orange-500" />
          </div>
          <p className="text-center text-sm text-muted-foreground max-w-sm">
            Aucune propriété Google Analytics 4 connectée. Cliquez sur le bouton ci-dessous pour
            autoriser l'accès à votre compte Google Analytics.
          </p>
          <Button onClick={handleConnect} disabled={isConnecting || oauthUrlQuery.isFetching} className="gap-2">
            {isConnecting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BarChart2 className="h-4 w-4" />}
            {isConnecting ? "Connexion en cours…" : "Connecter Google Analytics"}
          </Button>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            Assurez-vous que les APIs <strong>Google Analytics Data</strong> et{" "}
            <strong>Google Analytics Admin</strong> sont activées dans votre projet Google Cloud.
            L'URI de redirection est la même que Google Ads :{" "}
            <code className="bg-muted px-1 rounded text-xs">
              {window.location.origin}/api/google-ads/callback
            </code>{" "}
            (déjà autorisée dans la console OAuth).
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Chargement ────────────────────────────────────────────────────────────
  if (reportQuery.isLoading || isConnecting) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-blue-500" />
            Google Analytics 4
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // ── Erreur ────────────────────────────────────────────────────────────────
  if (reportQuery.isError) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <BarChart2 className="h-5 w-5" />
            Google Analytics 4 — Erreur
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{reportQuery.error.message}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => reportQuery.refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Réessayer
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDisconnect}>
              Déconnecter
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { account, report, compareReport, period, comparePeriod } = reportQuery.data!;
  const { overview, dailyTrend, topPages, trafficSources, deviceCategories } = report!;
  const cmpOverview = compareReport?.overview;

  // ── Données du graphique combiné (période actuelle + précédente) ──────────
  const combinedTrend = dailyTrend.map((d, i) => ({
    ...d,
    prevSessions: compareReport?.dailyTrend[i]?.sessions ?? null,
    prevUsers: compareReport?.dailyTrend[i]?.users ?? null,
  }));

  // ── Rendu principal ───────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ── En-tête + sélecteur de période ─────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Infos compte */}
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-2">
                <Wifi className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {account!.propertyName || "Propriété GA4"}
                  <Badge variant="outline" className="text-xs font-normal">
                    ID : {account!.propertyId}
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-center gap-1 mt-0.5">
                  {account!.email}
                  {account!.websiteUrl && (
                    <>
                      <span className="mx-1">·</span>
                      <a
                        href={account!.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 hover:underline"
                      >
                        {account!.websiteUrl.replace(/^https?:\/\//, "")}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </>
                  )}
                </CardDescription>
              </div>
            </div>

            {/* Sélecteur de période */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={preset} onValueChange={(v) => setPreset(v as PresetKey)}>
                <SelectTrigger className="w-48 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Calendrier pour plage personnalisée */}
              {preset === "custom" && (
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4" />
                      {customRange?.from && customRange?.to
                        ? `${format(customRange.from, "d MMM", { locale: fr })} – ${format(customRange.to, "d MMM yyyy", { locale: fr })}`
                        : "Choisir les dates"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="range"
                      selected={customRange}
                      onSelect={(range) => {
                        setCustomRange(range);
                        if (range?.from && range?.to) setCalendarOpen(false);
                      }}
                      disabled={[{ after: today }]}
                      numberOfMonths={2}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              )}

              {/* Bouton rafraîchir */}
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => reportQuery.refetch()}
                disabled={reportQuery.isFetching}
              >
                <RefreshCw className={`h-4 w-4 ${reportQuery.isFetching ? "animate-spin" : ""}`} />
              </Button>

              <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={handleDisconnect}>
                Déconnecter
              </Button>
            </div>
          </div>

          {/* Bandeau de période */}
          {period && (
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                Période : {format(new Date(period.startDate), "d MMM yyyy", { locale: fr })} –{" "}
                {format(new Date(period.endDate), "d MMM yyyy", { locale: fr })}
              </span>
              {comparePeriod && (
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-200 inline-block" />
                  Comparaison : {format(new Date(comparePeriod.startDate), "d MMM yyyy", { locale: fr })} –{" "}
                  {format(new Date(comparePeriod.endDate), "d MMM yyyy", { locale: fr })}
                </span>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* ── KPI Cards avec delta ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: "Sessions",
            value: formatNumber(overview.sessions),
            raw: overview.sessions,
            prev: cmpOverview?.sessions ?? 0,
            icon: Globe,
            color: "text-blue-500",
          },
          {
            label: "Utilisateurs",
            value: formatNumber(overview.totalUsers),
            raw: overview.totalUsers,
            prev: cmpOverview?.totalUsers ?? 0,
            icon: Users,
            color: "text-green-500",
          },
          {
            label: "Nouveaux",
            value: formatNumber(overview.newUsers),
            raw: overview.newUsers,
            prev: cmpOverview?.newUsers ?? 0,
            icon: TrendingUp,
            color: "text-purple-500",
          },
          {
            label: "Pages vues",
            value: formatNumber(overview.pageviews),
            raw: overview.pageviews,
            prev: cmpOverview?.pageviews ?? 0,
            icon: Eye,
            color: "text-orange-500",
          },
          {
            label: "Durée moy.",
            value: formatDuration(overview.avgSessionDuration),
            raw: overview.avgSessionDuration,
            prev: cmpOverview?.avgSessionDuration ?? 0,
            icon: Clock,
            color: "text-cyan-500",
          },
          {
            label: "Engagement",
            value: `${overview.engagementRate.toFixed(1)}%`,
            raw: overview.engagementRate,
            prev: cmpOverview?.engagementRate ?? 0,
            icon: MousePointer,
            color: "text-pink-500",
          },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-xl font-bold leading-tight">{kpi.value}</p>
            {cmpOverview && (
              <div className="mt-0.5">
                <DeltaBadge current={kpi.raw} previous={kpi.prev} />
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* ── Graphique d'évolution (période actuelle + précédente) ───────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Évolution du trafic</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={combinedTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                labelFormatter={(v: string) => new Date(v).toLocaleDateString("fr-FR")}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    sessions: "Sessions",
                    users: "Utilisateurs",
                    pageviews: "Pages vues",
                    prevSessions: "Sessions (période préc.)",
                    prevUsers: "Utilisateurs (période préc.)",
                  };
                  return [formatNumber(value), labels[name] || name];
                }}
              />
              <Legend
                formatter={(v) => {
                  const labels: Record<string, string> = {
                    sessions: "Sessions",
                    users: "Utilisateurs",
                    pageviews: "Pages vues",
                    prevSessions: "Sessions préc.",
                    prevUsers: "Utilisateurs préc.",
                  };
                  return labels[v] || v;
                }}
              />
              <Line type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="pageviews" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              {compareReport && (
                <>
                  <Line type="monotone" dataKey="prevSessions" stroke="#93c5fd" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="prevUsers" stroke="#6ee7b7" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Sources + Appareils + Top pages ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sources de trafic */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sources de trafic</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={trafficSources.slice(0, 6)}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="sessionDefaultChannelGroup"
                  tick={{ fontSize: 10 }}
                  width={80}
                  tickFormatter={(v: string) => v.replace(" Search", "").replace(" Social", "")}
                />
                <Tooltip formatter={(v: number) => [formatNumber(v), "Sessions"]} />
                <Bar dataKey="sessions" radius={[0, 4, 4, 0]}>
                  {trafficSources.slice(0, 6).map((_, i) => (
                    <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Appareils */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Appareils</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={deviceCategories}
                  dataKey="sessions"
                  nameKey="deviceCategory"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  innerRadius={30}
                >
                  {deviceCategories.map((entry, i) => (
                    <Cell key={i} fill={DEVICE_COLORS[entry.deviceCategory] || SOURCE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number, name: string) => [formatNumber(v), name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 text-xs">
              {deviceCategories.map((d, i) => {
                const Icon = d.deviceCategory === "mobile" ? Smartphone
                  : d.deviceCategory === "tablet" ? Tablet : Monitor;
                return (
                  <div key={i} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: DEVICE_COLORS[d.deviceCategory] || SOURCE_COLORS[i] }}
                    />
                    <Icon className="h-3 w-3 text-muted-foreground" />
                    <span className="capitalize">{d.deviceCategory}</span>
                    <span className="font-medium">{d.percentage.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top pages */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topPages.slice(0, 7).map((page, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" title={page.pagePath}>
                      {page.pagePath === "/" ? "Accueil" : page.pagePath}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div
                        className="h-1 rounded-full bg-blue-500"
                        style={{
                          width: `${Math.min(100, (page.screenPageViews / (topPages[0]?.screenPageViews || 1)) * 100)}%`,
                          maxWidth: "80px",
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {formatNumber(page.screenPageViews)} vues
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
