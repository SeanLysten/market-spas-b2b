import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Eye, MousePointer,
  RefreshCw, BarChart2, Globe, CalendarIcon, Minus, AlertCircle
} from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

type DateRange = { from?: Date; to?: Date };

// ── Couleurs ──────────────────────────────────────────────────────────────────
const SOURCE_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  const delta = deltaPercent(current, previous);
  if (delta === null) return null;
  const isPositive = delta >= 0;
  const Icon = delta === 0 ? Minus : isPositive ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
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
  onCallbackHandled?: () => void;
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function AdminGoogleAnalytics({ onCallbackHandled: _ }: AdminGoogleAnalyticsProps) {
  // ── Sélecteur de période ──────────────────────────────────────────────────
  const [preset, setPreset] = useState<PresetKey>("30");
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const today = startOfDay(new Date());
  const effectiveDates = (() => {
    if (preset !== "custom") {
      const days = Number(preset);
      return { startDate: toIsoDate(subDays(today, days)), endDate: toIsoDate(today), days };
    }
    if (customRange?.from && customRange?.to) {
      return { startDate: toIsoDate(customRange.from), endDate: toIsoDate(customRange.to), days: undefined };
    }
    return { startDate: toIsoDate(subDays(today, 30)), endDate: toIsoDate(today), days: 30 };
  })();

  // ── Query GA4 via compte de service ──────────────────────────────────────
  const reportQuery = trpc.admin.analytics.getGA4Report.useQuery(
    { startDate: effectiveDates.startDate, endDate: effectiveDates.endDate },
    { retry: false, refetchOnWindowFocus: false }
  );

  // ── Chargement ────────────────────────────────────────────────────────────
  if (reportQuery.isLoading) {
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
            <AlertCircle className="h-5 w-5" />
            Google Analytics 4 — Erreur
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{reportQuery.error.message}</p>
          <Button variant="outline" size="sm" onClick={() => reportQuery.refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const data = reportQuery.data;
  if (!data) return null;

  const { totalSessions, totalUsers, totalPageViews, avgBounceRate, dailySessions, trafficSources, topPages } = data;

  // ── Sélecteur de période ──────────────────────────────────────────────────
  const PeriodSelector = () => (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={preset} onValueChange={(v) => setPreset(v as PresetKey)}>
        <SelectTrigger className="w-44 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value} className="text-xs">
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {preset === "custom" && (
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
              <CalendarIcon className="h-3 w-3" />
              {customRange?.from && customRange?.to
                ? `${format(customRange.from, "dd/MM/yy", { locale: fr })} – ${format(customRange.to, "dd/MM/yy", { locale: fr })}`
                : "Choisir une plage"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={customRange as any}
              onSelect={(range: any) => {
                setCustomRange(range);
                if (range?.from && range?.to) setCalendarOpen(false);
              }}
              disabled={(date) => date > today}
              locale={fr}
            />
          </PopoverContent>
        </Popover>
      )}
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => reportQuery.refetch()} title="Actualiser">
        <RefreshCw className={`h-3.5 w-3.5 ${reportQuery.isFetching ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );

  // ── KPI Cards ─────────────────────────────────────────────────────────────
  const kpis = [
    { label: "Sessions", value: totalSessions, icon: MousePointer, color: "text-blue-500" },
    { label: "Utilisateurs", value: totalUsers, icon: Users, color: "text-green-500" },
    { label: "Pages vues", value: totalPageViews, icon: Eye, color: "text-purple-500" },
    { label: "Taux de rebond", value: `${avgBounceRate.toFixed(1)}%`, icon: TrendingDown, color: "text-orange-500", raw: avgBounceRate },
  ];

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-orange-500" />
            Google Analytics 4 — marketspas.com
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {effectiveDates.startDate} → {effectiveDates.endDate}
          </p>
        </div>
        <PeriodSelector />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
            <p className="text-xl font-bold">
              {typeof kpi.value === "number" ? formatNumber(kpi.value) : kpi.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Graphique sessions par jour */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Sessions & Utilisateurs par jour</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailySessions} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => {
                  const parts = d.split("-");
                  return `${parts[2]}/${parts[1]}`;
                }}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(value: number, name: string) => [formatNumber(value), name === "sessions" ? "Sessions" : "Utilisateurs"]}
                labelFormatter={(label) => {
                  const parts = label.split("-");
                  return `${parts[2]}/${parts[1]}/${parts[0]}`;
                }}
              />
              <Legend formatter={(v) => v === "sessions" ? "Sessions" : "Utilisateurs"} />
              <Line type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sources de trafic + Top pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Camembert sources */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              Sources de trafic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={trafficSources}
                  dataKey="sessions"
                  nameKey="channel"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ channel, percent }) => percent > 0.04 ? `${channel} ${(percent * 100).toFixed(0)}%` : ""}
                  labelLine={false}
                >
                  {trafficSources.map((_, i) => (
                    <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [formatNumber(v), "Sessions"]} />
              </PieChart>
            </ResponsiveContainer>
            {/* Tableau sources */}
            <div className="mt-2 space-y-1">
              {trafficSources.slice(0, 6).map((src, i) => (
                <div key={src.channel} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                    <span className="truncate max-w-[120px]">{src.channel}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{formatNumber(src.sessions)} sess.</span>
                    <span className="text-xs">{src.bounceRate.toFixed(0)}% rebond</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top pages */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-500" />
              Pages les plus visitées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topPages.slice(0, 8).map((page, i) => {
                const maxViews = topPages[0]?.views || 1;
                const pct = Math.round((page.views / maxViews) * 100);
                return (
                  <div key={i} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate max-w-[200px] text-muted-foreground font-mono">{page.page}</span>
                      <span className="font-medium ml-2">{formatNumber(page.views)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-purple-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau détaillé sources */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Détail par canal d'acquisition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 pr-4">Canal</th>
                  <th className="text-right py-2 px-2">Sessions</th>
                  <th className="text-right py-2 px-2">Utilisateurs</th>
                  <th className="text-right py-2 px-2">Pages vues</th>
                  <th className="text-right py-2 pl-2">Taux rebond</th>
                </tr>
              </thead>
              <tbody>
                {trafficSources.map((src, i) => (
                  <tr key={src.channel} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                        {src.channel}
                      </div>
                    </td>
                    <td className="text-right py-2 px-2 font-medium">{formatNumber(src.sessions)}</td>
                    <td className="text-right py-2 px-2">{formatNumber(src.users)}</td>
                    <td className="text-right py-2 px-2">{formatNumber(src.pageViews)}</td>
                    <td className="text-right py-2 pl-2">
                      <span className={src.bounceRate > 70 ? "text-red-500" : src.bounceRate > 50 ? "text-orange-500" : "text-green-600"}>
                        {src.bounceRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
