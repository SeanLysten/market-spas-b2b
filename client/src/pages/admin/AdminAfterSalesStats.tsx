import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminAfterSalesStats() {
  const { data: stats, isLoading: statsLoading } = trpc.afterSales.stats.useQuery({ period: "8weeks" });
  const { data: weeklyStats, isLoading: weeklyLoading } = trpc.afterSales.weeklyStats.useQuery({ period: "8weeks" });
  const { data: partners } = trpc.partners.list.useQuery({});

  // Prepare data for charts
  const partnerStatsData = useMemo(() => {
    if (!stats?.byPartner || !partners) return null;

    const partnerMap = new Map(partners.map(p => [p.id, p.companyName]));
    const labels = stats.byPartner.map(p => partnerMap.get(p.partnerId) || `Partner ${p.partnerId}`);
    const data = stats.byPartner.map(p => p.count);

    return {
      labels,
      datasets: [
        {
          label: "Nombre de tickets",
          data,
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 1,
        },
      ],
    };
  }, [stats?.byPartner, partners]);

  const urgencyData = useMemo(() => {
    if (!stats?.byUrgency) return null;

    const urgencyMap: Record<string, string> = {
      NORMAL: "Normal",
      URGENT: "Urgent",
      CRITICAL: "Critique",
    };

    const colorMap: Record<string, string> = {
      NORMAL: "rgba(107, 114, 128, 0.5)",
      URGENT: "rgba(249, 115, 22, 0.5)",
      CRITICAL: "rgba(239, 68, 68, 0.5)",
    };

    return {
      labels: stats.byUrgency.map(u => urgencyMap[u.urgency] || u.urgency),
      datasets: [
        {
          label: "Nombre de tickets",
          data: stats.byUrgency.map(u => u.count),
          backgroundColor: stats.byUrgency.map(u => colorMap[u.urgency] || "rgba(107, 114, 128, 0.5)"),
          borderColor: stats.byUrgency.map(u => colorMap[u.urgency]?.replace("0.5", "1") || "rgba(107, 114, 128, 1)"),
          borderWidth: 1,
        },
      ],
    };
  }, [stats?.byUrgency]);

  const statusData = useMemo(() => {
    if (!stats?.byStatus) return null;

    const statusMap: Record<string, string> = {
      NEW: "Nouveau",
      IN_PROGRESS: "En cours",
      WAITING_PARTS: "Attente pièces",
      RESOLVED: "Résolu",
      CLOSED: "Fermé",
    };

    return {
      labels: stats.byStatus.map(s => statusMap[s.status] || s.status),
      datasets: [
        {
          label: "Nombre de tickets",
          data: stats.byStatus.map(s => s.count),
          backgroundColor: [
            "rgba(59, 130, 246, 0.5)",
            "rgba(249, 115, 22, 0.5)",
            "rgba(168, 85, 247, 0.5)",
            "rgba(34, 197, 94, 0.5)",
            "rgba(107, 114, 128, 0.5)",
          ],
          borderColor: [
            "rgba(59, 130, 246, 1)",
            "rgba(249, 115, 22, 1)",
            "rgba(168, 85, 247, 1)",
            "rgba(34, 197, 94, 1)",
            "rgba(107, 114, 128, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [stats?.byStatus]);

  const weeklyChartData = useMemo(() => {
    if (!weeklyStats) return null;

    return {
      labels: weeklyStats.map(w => w.week || "N/A"),
      datasets: [
        {
          label: "Tickets créés",
          data: weeklyStats.map(w => w.count),
          borderColor: "rgba(59, 130, 246, 1)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 2,
          tension: 0.4,
        },
      ],
    };
  }, [weeklyStats]);

  const resolvedCount = stats?.byStatus?.find(s => s.status === "RESOLVED")?.count || 0;
  const closedCount = stats?.byStatus?.find(s => s.status === "CLOSED")?.count || 0;
  const resolutionRate = stats?.totalTickets ? Math.round(((resolvedCount + closedCount) / stats.totalTickets) * 100) : 0;

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/after-sales">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Statistiques SAV</h1>
            <p className="text-muted-foreground">Analyse des tickets de service après-vente</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalTickets || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Tous les tickets SAV</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Critiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {stats?.byUrgency?.find(u => u.urgency === "CRITICAL")?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Tickets critiques</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Urgents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {stats?.byUrgency?.find(u => u.urgency === "URGENT")?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Tickets urgents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taux de Résolution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{resolutionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Tickets résolus/fermés</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Tickets by Partner */}
          <Card>
            <CardHeader>
              <CardTitle>Tickets par Partenaire</CardTitle>
            </CardHeader>
            <CardContent>
              {partnerStatsData ? (
                <Bar
                  data={partnerStatsData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "top" as const,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              )}
            </CardContent>
          </Card>

          {/* Tickets by Urgency */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par Urgence</CardTitle>
            </CardHeader>
            <CardContent>
              {urgencyData ? (
                <Pie
                  data={urgencyData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "top" as const,
                      },
                    },
                  }}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              )}
            </CardContent>
          </Card>

          {/* Tickets by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par Statut</CardTitle>
            </CardHeader>
            <CardContent>
              {statusData ? (
                <Pie
                  data={statusData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "top" as const,
                      },
                    },
                  }}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution Hebdomadaire</CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyChartData ? (
                <Line
                  data={weeklyChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "top" as const,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>Détail par Statut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.byStatus?.map(status => (
                <div key={status.status} className="flex justify-between items-center p-2 border rounded">
                  <span>
                    {status.status === "NEW" && "Nouveau"}
                    {status.status === "IN_PROGRESS" && "En cours"}
                    {status.status === "WAITING_PARTS" && "Attente pièces"}
                    {status.status === "RESOLVED" && "Résolu"}
                    {status.status === "CLOSED" && "Fermé"}
                  </span>
                  <Badge>{status.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
