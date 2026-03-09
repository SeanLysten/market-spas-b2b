import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  RefreshCw, BarChart2, Globe, CalendarIcon, Minus, AlertCircle,
  Smartphone, Clock, MapPin, Languages, Navigation
} from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

type DateRange = { from?: Date; to?: Date };

// ── Couleurs ──────────────────────────────────────────────────────────────────
const PALETTE = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1",
];

const DEVICE_COLORS: Record<string, string> = {
  desktop: "#3b82f6",
  mobile: "#10b981",
  tablet: "#f59e0b",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function toIsoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function flagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "🌍";
  const codePoints = [...countryCode.toUpperCase()].map(
    (c) => 127397 + c.charCodeAt(0)
  );
  return String.fromCodePoint(...codePoints);
}

function deviceLabel(d: string): string {
  const map: Record<string, string> = { desktop: "Ordinateur", mobile: "Mobile", tablet: "Tablette" };
  return map[d.toLowerCase()] || d;
}

function deviceIcon(d: string): string {
  const map: Record<string, string> = { desktop: "🖥️", mobile: "📱", tablet: "📲" };
  return map[d.toLowerCase()] || "💻";
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

  const {
    totalSessions, totalUsers, totalPageViews, avgBounceRate, avgSessionDuration,
    dailySessions, trafficSources, topPages,
    geoCountries, geoCities, devices, languages, landingPages,
  } = data;

  // ── Sélecteur de période ──────────────────────────────────────────────────
  const PeriodSelector = () => (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={preset} onValueChange={(v) => setPreset(v as PresetKey)}>
        <SelectTrigger className="w-44 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
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

  // ── Données appareils pour PieChart ──────────────────────────────────────
  const devicePieData = (devices || []).map((d) => ({
    name: deviceLabel(d.device),
    value: d.sessions,
    color: DEVICE_COLORS[d.device.toLowerCase()] || "#94a3b8",
  }));

  const totalDeviceSessions = devicePieData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-5">
      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-orange-500" />
            Google Analytics 4 — marketspas.pro
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {effectiveDates.startDate} → {effectiveDates.endDate}
          </p>
        </div>
        <PeriodSelector />
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Sessions", value: formatNumber(totalSessions), icon: MousePointer, color: "text-blue-500" },
          { label: "Utilisateurs", value: formatNumber(totalUsers), icon: Users, color: "text-green-500" },
          { label: "Pages vues", value: formatNumber(totalPageViews), icon: Eye, color: "text-purple-500" },
          { label: "Taux de rebond", value: `${avgBounceRate.toFixed(1)}%`, icon: TrendingDown, color: "text-orange-500" },
          { label: "Durée moy. session", value: formatDuration(avgSessionDuration || 0), icon: Clock, color: "text-cyan-500" },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
            <p className="text-xl font-bold">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* ── Graphique sessions par jour ───────────────────────────────────── */}
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
                tickFormatter={(d) => { const p = d.split("-"); return `${p[2]}/${p[1]}`; }}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(v: number, name: string) => [formatNumber(v), name === "sessions" ? "Sessions" : "Utilisateurs"]}
                labelFormatter={(l) => { const p = l.split("-"); return `${p[2]}/${p[1]}/${p[0]}`; }}
              />
              <Legend formatter={(v) => v === "sessions" ? "Sessions" : "Utilisateurs"} />
              <Line type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Sources de trafic + Appareils ─────────────────────────────────── */}
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
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={trafficSources}
                  dataKey="sessions"
                  nameKey="channel"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ channel, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""}
                  labelLine={false}
                >
                  {trafficSources.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [formatNumber(v), "Sessions"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {trafficSources.slice(0, 6).map((src, i) => (
                <div key={src.channel} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                    <span className="truncate max-w-[130px]">{src.channel}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{formatNumber(src.sessions)}</span>
                    <span className={src.bounceRate > 70 ? "text-red-500" : src.bounceRate > 50 ? "text-orange-500" : "text-green-600"}>
                      {src.bounceRate.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Appareils */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-green-500" />
              Répartition par appareil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={devicePieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""}
                  labelLine={false}
                >
                  {devicePieData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [formatNumber(v), "Sessions"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1.5">
              {(devices || []).map((d) => {
                const pct = totalDeviceSessions > 0 ? Math.round((d.sessions / totalDeviceSessions) * 100) : 0;
                const color = DEVICE_COLORS[d.device.toLowerCase()] || "#94a3b8";
                return (
                  <div key={d.device} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <span>{deviceIcon(d.device)}</span>
                        <span>{deviceLabel(d.device)}</span>
                      </span>
                      <span className="font-medium">{formatNumber(d.sessions)} <span className="text-muted-foreground">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Géographie : Pays ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-red-500" />
            Audience par pays
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tableau pays */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-3">Pays</th>
                    <th className="text-right py-2 px-2">Sessions</th>
                    <th className="text-right py-2 px-2">Utilisateurs</th>
                    <th className="text-right py-2 pl-2">Rebond</th>
                  </tr>
                </thead>
                <tbody>
                  {(geoCountries || []).slice(0, 12).map((c, i) => {
                    const maxSessions = geoCountries[0]?.sessions || 1;
                    const pct = Math.round((c.sessions / maxSessions) * 100);
                    return (
                      <tr key={c.country} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-1.5 pr-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base leading-none">{flagEmoji(c.countryCode)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="truncate">{c.country}</div>
                              <div className="h-1 bg-muted rounded-full mt-0.5 overflow-hidden">
                                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-1.5 px-2 font-medium">{formatNumber(c.sessions)}</td>
                        <td className="text-right py-1.5 px-2 text-muted-foreground">{formatNumber(c.users)}</td>
                        <td className="text-right py-1.5 pl-2">
                          <span className={c.bounceRate > 70 ? "text-red-500" : c.bounceRate > 50 ? "text-orange-500" : "text-green-600"}>
                            {c.bounceRate.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* BarChart top pays */}
            <div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={(geoCountries || []).slice(0, 8).map((c) => ({
                    name: c.country.length > 12 ? c.country.slice(0, 10) + "…" : c.country,
                    sessions: c.sessions,
                    users: c.users,
                  }))}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip formatter={(v: number, name: string) => [formatNumber(v), name === "sessions" ? "Sessions" : "Utilisateurs"]} />
                  <Bar dataKey="sessions" fill="#3b82f6" radius={[0, 3, 3, 0]} />
                  <Bar dataKey="users" fill="#10b981" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Villes + Langues ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top villes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Navigation className="h-4 w-4 text-indigo-500" />
              Top villes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {(geoCities || []).slice(0, 10).map((city, i) => {
                const maxSessions = geoCities[0]?.sessions || 1;
                const pct = Math.round((city.sessions / maxSessions) * 100);
                return (
                  <div key={`${city.city}-${i}`} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 truncate max-w-[160px]">
                        <span className="text-muted-foreground">{i + 1}.</span>
                        <span>{city.city}</span>
                        <span className="text-muted-foreground text-[10px]">({city.country})</span>
                      </span>
                      <span className="font-medium ml-2">{formatNumber(city.sessions)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {(!geoCities || geoCities.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-4">Aucune donnée de ville disponible</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Langues */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Languages className="h-4 w-4 text-teal-500" />
              Langues de l'audience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {(languages || []).slice(0, 10).map((lang, i) => {
                const maxSessions = languages[0]?.sessions || 1;
                const pct = Math.round((lang.sessions / maxSessions) * 100);
                const totalLangSessions = (languages || []).reduce((s, l) => s + l.sessions, 0);
                const share = totalLangSessions > 0 ? Math.round((lang.sessions / totalLangSessions) * 100) : 0;
                return (
                  <div key={lang.language} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold bg-teal-100 text-teal-700">
                          {lang.language.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="capitalize">{lang.language}</span>
                      </span>
                      <span className="font-medium">{formatNumber(lang.sessions)} <span className="text-muted-foreground">({share}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-teal-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {(!languages || languages.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-4">Aucune donnée de langue disponible</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Top pages vues ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

        {/* Pages d'atterrissage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Pages d'atterrissage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-3">Page</th>
                    <th className="text-right py-2 px-2">Sessions</th>
                    <th className="text-right py-2 px-2">Rebond</th>
                    <th className="text-right py-2 pl-2">Durée moy.</th>
                  </tr>
                </thead>
                <tbody>
                  {(landingPages || []).slice(0, 8).map((lp, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-1.5 pr-3 font-mono truncate max-w-[140px]">{lp.page}</td>
                      <td className="text-right py-1.5 px-2 font-medium">{formatNumber(lp.sessions)}</td>
                      <td className="text-right py-1.5 px-2">
                        <span className={lp.bounceRate > 70 ? "text-red-500" : lp.bounceRate > 50 ? "text-orange-500" : "text-green-600"}>
                          {lp.bounceRate.toFixed(0)}%
                        </span>
                      </td>
                      <td className="text-right py-1.5 pl-2 text-muted-foreground">{formatDuration(lp.avgSessionDuration)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Tableau détaillé canaux d'acquisition ────────────────────────── */}
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
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
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
