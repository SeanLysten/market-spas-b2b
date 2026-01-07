import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, AlertCircle, Clock, CheckCircle, XCircle, Package, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AfterSalesDetail from "@/components/AfterSalesDetail";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function AdminAfterSales() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [customerNameFilter, setCustomerNameFilter] = useState<string>("");
  const [orderBy, setOrderBy] = useState<string>("createdAt");
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("desc");
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusFormData, setStatusFormData] = useState<{
    serviceId: number;
    status: string;
    resolutionNotes: string;
  }>({
    serviceId: 0,
    status: "NEW",
    resolutionNotes: "",
  });

  // Handle sort
  const handleSort = (column: string) => {
    if (orderBy === column) {
      setOrderDirection(orderDirection === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(column);
      setOrderDirection("desc");
    }
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setUrgencyFilter("all");
    setDateFrom("");
    setDateTo("");
    setCustomerNameFilter("");
    setOrderBy("createdAt");
    setOrderDirection("desc");
  };

  // Fetch SAV list
  const { data: services, isLoading, refetch } = trpc.afterSales.list.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    urgency: urgencyFilter !== "all" ? urgencyFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    customerName: customerNameFilter || undefined,
    orderBy,
    orderDirection,
  });

  // Fetch statistics
  const { data: statsData } = trpc.afterSales.stats.useQuery();
  const { data: weeklyStats } = trpc.afterSales.weeklyStats.useQuery();
  const { data: partners } = trpc.partners.list.useQuery({});

  // Update status mutation
  const updateStatusMutation = trpc.afterSales.updateStatus.useMutation({
    onSuccess: () => {
      alert("Statut mis à jour avec succès");
      setIsStatusDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      alert(`Erreur: ${error.message}`);
    },
  });

  // Filter services
  const filteredServices = (services || []).filter((s) => {
    const service = s.service;
    const matchesSearch =
      searchQuery === "" ||
      service.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      NEW: { variant: "default", icon: AlertCircle },
      IN_PROGRESS: { variant: "default", icon: Clock },
      WAITING_PARTS: { variant: "secondary", icon: Package },
      RESOLVED: { variant: "outline", icon: CheckCircle },
      CLOSED: { variant: "outline", icon: XCircle },
    };
    const config = variants[status] || variants.NEW;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status === "NEW" && "Nouveau"}
        {status === "IN_PROGRESS" && "En cours"}
        {status === "WAITING_PARTS" && "Attente pièces"}
        {status === "RESOLVED" && "Résolu"}
        {status === "CLOSED" && "Fermé"}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    if (urgency === "CRITICAL") return <Badge variant="destructive">Critique</Badge>;
    if (urgency === "URGENT") return <Badge className="bg-orange-500">Urgent</Badge>;
    return <Badge variant="secondary">Normal</Badge>;
  };

  const handleStatusChange = (serviceId: number, currentStatus: string) => {
    setStatusFormData({
      serviceId,
      status: currentStatus,
      resolutionNotes: "",
    });
    setIsStatusDialogOpen(true);
  };

  const handleSubmitStatusChange = () => {
    updateStatusMutation.mutate({
      id: statusFormData.serviceId,
      status: statusFormData.status as "NEW" | "IN_PROGRESS" | "WAITING_PARTS" | "RESOLVED" | "CLOSED",
      resolutionNotes: statusFormData.resolutionNotes || undefined,
    });
  };

  // Calculate stats
  const stats = {
    total: filteredServices.length,
    new: filteredServices.filter((s) => s.service.status === "NEW").length,
    inProgress: filteredServices.filter((s) => s.service.status === "IN_PROGRESS").length,
    resolved: filteredServices.filter((s) => s.service.status === "RESOLVED").length,
  };

  // Prepare chart data
  const partnerStatsData = useMemo(() => {
    if (!statsData?.byPartner || !partners) return null;
    const partnerMap = new Map(partners.map(p => [p.id, p.companyName]));
    return {
      labels: statsData.byPartner.map(p => partnerMap.get(p.partnerId) || `Partner ${p.partnerId}`),
      datasets: [{
        label: "Nombre de tickets",
        data: statsData.byPartner.map(p => p.count),
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      }],
    };
  }, [statsData?.byPartner, partners]);

  const urgencyData = useMemo(() => {
    if (!statsData?.byUrgency) return null;
    const urgencyMap: Record<string, string> = { NORMAL: "Normal", URGENT: "Urgent", CRITICAL: "Critique" };
    const colorMap: Record<string, string> = {
      NORMAL: "rgba(107, 114, 128, 0.5)",
      URGENT: "rgba(249, 115, 22, 0.5)",
      CRITICAL: "rgba(239, 68, 68, 0.5)",
    };
    return {
      labels: statsData.byUrgency.map(u => urgencyMap[u.urgency] || u.urgency),
      datasets: [{
        label: "Nombre de tickets",
        data: statsData.byUrgency.map(u => u.count),
        backgroundColor: statsData.byUrgency.map(u => colorMap[u.urgency] || "rgba(107, 114, 128, 0.5)"),
        borderColor: statsData.byUrgency.map(u => colorMap[u.urgency]?.replace("0.5", "1") || "rgba(107, 114, 128, 1)"),
        borderWidth: 1,
      }],
    };
  }, [statsData?.byUrgency]);

  const statusData = useMemo(() => {
    if (!statsData?.byStatus) return null;
    const statusMap: Record<string, string> = {
      NEW: "Nouveau", IN_PROGRESS: "En cours", WAITING_PARTS: "Attente pièces",
      RESOLVED: "Résolu", CLOSED: "Fermé",
    };
    return {
      labels: statsData.byStatus.map(s => statusMap[s.status] || s.status),
      datasets: [{
        label: "Nombre de tickets",
        data: statsData.byStatus.map(s => s.count),
        backgroundColor: [
          "rgba(59, 130, 246, 0.5)", "rgba(249, 115, 22, 0.5)",
          "rgba(168, 85, 247, 0.5)", "rgba(34, 197, 94, 0.5)", "rgba(107, 114, 128, 0.5)",
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)", "rgba(249, 115, 22, 1)",
          "rgba(168, 85, 247, 1)", "rgba(34, 197, 94, 1)", "rgba(107, 114, 128, 1)",
        ],
        borderWidth: 1,
      }],
    };
  }, [statsData?.byStatus]);

  const weeklyChartData = useMemo(() => {
    if (!weeklyStats) return null;
    return {
      labels: weeklyStats.map(w => w.week || "N/A"),
      datasets: [{
        label: "Tickets créés",
        data: weeklyStats.map(w => w.count),
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2,
        tension: 0.4,
      }],
    };
  }, [weeklyStats]);

  const resolvedCount = statsData?.byStatus?.find(s => s.status === "RESOLVED")?.count || 0;
  const closedCount = statsData?.byStatus?.find(s => s.status === "CLOSED")?.count || 0;
  const resolutionRate = statsData?.totalTickets ? Math.round(((resolvedCount + closedCount) / statsData.totalTickets) * 100) : 0;

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestion SAV</h1>
        <p className="text-muted-foreground">Gérez toutes les demandes de service après-vente</p>
      </div>

      <Tabs defaultValue="tickets" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="tickets">Liste des tickets</TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="h-4 w-4 mr-2" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Résolus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par numéro de ticket, numéro de série..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="NEW">Nouveau</SelectItem>
                  <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                  <SelectItem value="WAITING_PARTS">Attente pièces</SelectItem>
                  <SelectItem value="RESOLVED">Résolu</SelectItem>
                  <SelectItem value="CLOSED">Fermé</SelectItem>
                </SelectContent>
              </Select>

              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Urgence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les urgences</SelectItem>
                  <SelectItem value="NORMAL">Normale</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                  <SelectItem value="CRITICAL">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtres avancés */}
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Nom du client..."
                  value={customerNameFilter}
                  onChange={(e) => setCustomerNameFilter(e.target.value)}
                />
              </div>
              <div className="w-48">
                <Input
                  type="date"
                  placeholder="Date de début"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="w-48">
                <Input
                  type="date"
                  placeholder="Date de fin"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sort Headers */}
      {!isLoading && filteredServices.length > 0 && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center text-sm font-medium">
              <button
                onClick={() => handleSort("createdAt")}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                Date de création
                {orderBy === "createdAt" ? (
                  orderDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                ) : (
                  <ArrowUpDown className="h-4 w-4 opacity-50" />
                )}
              </button>
              <button
                onClick={() => handleSort("status")}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                Statut
                {orderBy === "status" ? (
                  orderDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                ) : (
                  <ArrowUpDown className="h-4 w-4 opacity-50" />
                )}
              </button>
              <button
                onClick={() => handleSort("urgency")}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                Urgence
                {orderBy === "urgency" ? (
                  orderDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                ) : (
                  <ArrowUpDown className="h-4 w-4 opacity-50" />
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SAV List */}
      {isLoading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : filteredServices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Aucune demande de SAV trouvée</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredServices.map((item) => {
            const service = item.service;
            const partner = item.partner;
            return (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{service.ticketNumber}</CardTitle>
                      <CardDescription>
                        Partenaire: {partner?.companyName || "N/A"} • Numéro de série: {service.serialNumber} •
                        Créé le {new Date(service.createdAt).toLocaleDateString("fr-FR")}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(service.status)}
                      {getUrgencyBadge(service.urgency)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedServiceId(service.id)}
                    >
                      Voir les détails
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleStatusChange(service.id, service.status)}
                    >
                      Changer le statut
                    </Button>
                  </div>
                  <p className="text-sm mb-2">
                    <strong>Type:</strong>{" "}
                    {service.issueType === "TECHNICAL" && "Technique"}
                    {service.issueType === "LEAK" && "Fuite"}
                    {service.issueType === "ELECTRICAL" && "Électrique"}
                    {service.issueType === "HEATING" && "Chauffage"}
                    {service.issueType === "JETS" && "Jets"}
                    {service.issueType === "CONTROL_PANEL" && "Panneau de contrôle"}
                    {service.issueType === "OTHER" && "Autre"}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                  {service.customerName && (
                    <p className="text-sm mt-2">
                      <strong>Client:</strong> {service.customerName}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

        </TabsContent>

        <TabsContent value="stats">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{statsData?.totalTickets || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Tous les tickets SAV</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Critiques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {statsData?.byUrgency?.find(u => u.urgency === "CRITICAL")?.count || 0}
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
                  {statsData?.byUrgency?.find(u => u.urgency === "URGENT")?.count || 0}
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
                      plugins: { legend: { position: "top" as const } },
                      scales: { y: { beginAtZero: true } },
                    }}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">Chargement...</div>
                )}
              </CardContent>
            </Card>

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
                      plugins: { legend: { position: "top" as const } },
                    }}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">Chargement...</div>
                )}
              </CardContent>
            </Card>

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
                      plugins: { legend: { position: "top" as const } },
                    }}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">Chargement...</div>
                )}
              </CardContent>
            </Card>

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
                      plugins: { legend: { position: "top" as const } },
                      scales: { y: { beginAtZero: true } },
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
                {statsData?.byStatus?.map(status => (
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
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      {selectedServiceId && (
        <Dialog open={!!selectedServiceId} onOpenChange={() => setSelectedServiceId(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <AfterSalesDetail serviceId={selectedServiceId} onClose={() => setSelectedServiceId(null)} />
          </DialogContent>
        </Dialog>
      )}

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le statut</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Nouveau statut</Label>
              <Select
                value={statusFormData.status}
                onValueChange={(value: any) => setStatusFormData({ ...statusFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">Nouveau</SelectItem>
                  <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                  <SelectItem value="WAITING_PARTS">Attente pièces</SelectItem>
                  <SelectItem value="RESOLVED">Résolu</SelectItem>
                  <SelectItem value="CLOSED">Fermé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(statusFormData.status === "RESOLVED" || statusFormData.status === "CLOSED") && (
              <div className="space-y-2">
                <Label htmlFor="resolutionNotes">Notes de résolution</Label>
                <Textarea
                  id="resolutionNotes"
                  value={statusFormData.resolutionNotes}
                  onChange={(e) => setStatusFormData({ ...statusFormData, resolutionNotes: e.target.value })}
                  rows={4}
                  placeholder="Décrivez la résolution du problème..."
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmitStatusChange} disabled={updateStatusMutation.isPending}>
                {updateStatusMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </AdminLayout>
  );
}
