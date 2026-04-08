import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { 
  Search, 
  Filter, 
  Eye, 
  Package, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Euro,
  Calendar,
  Building2,
  FileText,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  SlidersHorizontal,
  CreditCard
} from "lucide-react";
import { toast } from "sonner";
import { OnboardingTour } from "@/components/OnboardingTour";
import { useOnboarding } from "@/hooks/useOnboarding";
import { adminOrdersTour } from "@/config/onboarding-tours";

type OrderStatus = "PENDING_APPROVAL" | "PENDING_DEPOSIT" | "PAYMENT_PENDING" | "DEPOSIT_PAID" | "PAYMENT_FAILED" | "IN_PRODUCTION" | "READY_TO_SHIP" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "REFUSED";

const ORDER_STATUSES: { value: OrderStatus; label: string; color: string; icon: any }[] = [
  { value: "PENDING_APPROVAL", label: "En attente d'approbation", color: "bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-400", icon: Clock },
  { value: "PENDING_DEPOSIT", label: "Acompte requis", color: "bg-orange-500/15 dark:bg-orange-500/25 text-orange-800 dark:text-orange-400", icon: Euro },
  { value: "PAYMENT_PENDING", label: "Paiement en cours", color: "bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-400", icon: Clock },
  { value: "DEPOSIT_PAID", label: "Acompte payé", color: "bg-info/15 dark:bg-info-light text-info dark:text-info-dark", icon: CheckCircle2 },
  { value: "PAYMENT_FAILED", label: "Paiement échoué", color: "bg-destructive/15 dark:bg-destructive/25 text-destructive", icon: XCircle },
  { value: "IN_PRODUCTION", label: "En production", color: "bg-purple-500/15 dark:bg-purple-500/25 text-purple-800 dark:text-purple-400", icon: Package },
  { value: "READY_TO_SHIP", label: "Prêt à expédier", color: "bg-indigo-500/15 dark:bg-indigo-500/25 text-indigo-800", icon: Package },
  { value: "SHIPPED", label: "Expédié", color: "bg-cyan-500/15 dark:bg-cyan-500/25 text-cyan-800", icon: Truck },
  { value: "DELIVERED", label: "Livré", color: "bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400", icon: CheckCircle2 },
  { value: "COMPLETED", label: "Terminé", color: "bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400", icon: CheckCircle2 },
  { value: "CANCELLED", label: "Annulé", color: "bg-destructive/15 dark:bg-destructive/25 text-destructive dark:text-destructive", icon: XCircle },
  { value: "REFUSED", label: "Refusé", color: "bg-destructive/15 dark:bg-destructive/25 text-destructive dark:text-destructive", icon: XCircle },
];

export default function AdminOrders() {
  const params = useParams<{ id?: string }>();
  const onboarding = useOnboarding("admin-orders");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [partnerFilter, setPartnerFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("")
  const [statusNote, setStatusNote] = useState("");

  const { data: orders, isLoading, refetch } = trpc.orders.list.useQuery({
    limit: 100,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  // Fetch full order with items when a specific order is selected
  const [detailOrderId, setDetailOrderId] = useState<number | null>(null);
  const { data: orderDetail } = trpc.orders.getWithItems.useQuery(
    { id: detailOrderId! },
    { enabled: !!detailOrderId }
  );

  // Merge order detail (with items) into selectedOrder when loaded
  useEffect(() => {
    if (orderDetail && detailOrderId) {
      // Merge partner info from list data with items from detail
      const listOrder = orders?.find((o: any) => o.id === detailOrderId);
      setSelectedOrder({
        ...listOrder,
        ...orderDetail,
        partner: listOrder?.partner || orderDetail.partner,
      });
    }
  }, [orderDetail, detailOrderId]);

  // Auto-open order detail when accessed via /admin/orders/:id
  useEffect(() => {
    if (params?.id && orders && !isDetailOpen) {
      const orderId = parseInt(params.id, 10);
      const order = orders.find((o: any) => o.id === orderId);
      if (order) {
        setDetailOrderId(orderId);
        setSelectedOrder(order);
        setIsDetailOpen(true);
      }
    }
  }, [params?.id, orders]);

  const updateStatusMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Statut de la commande mis à jour");
      refetch();
      setIsStatusDialogOpen(false);
      setSelectedOrder(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la mise à jour");
    },
  });

  const getStatusConfig = (status: string) => {
    return ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number | string | null) => {
    if (!price) return "0.00 €";
    return `${Number(price).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`;
  };

  // Extract unique partners for filter dropdown
  const uniquePartners = orders ? [...new Map(orders.map((o: any) => [
    o.partnerId, 
    { id: o.partnerId, name: o.partner?.companyName || "Inconnu" }
  ])).values()].sort((a, b) => a.name.localeCompare(b.name)) : [];

  const filteredOrders = orders?.filter((order: any) => {
    // Text search
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesSearch = (
        order.orderNumber?.toLowerCase().includes(searchLower) ||
        order.partner?.companyName?.toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }
    // Partner filter
    if (partnerFilter !== "all" && order.partnerId?.toString() !== partnerFilter) {
      return false;
    }
    // Date from filter
    if (dateFrom) {
      const orderDate = new Date(order.createdAt);
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (orderDate < fromDate) return false;
    }
    // Date to filter
    if (dateTo) {
      const orderDate = new Date(order.createdAt);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (orderDate > toDate) return false;
    }
    return true;
  }).sort((a: any, b: any) => {
    switch (sortBy) {
      case "date-asc":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "date-desc":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "amount-asc":
        return Number(a.totalHT || 0) - Number(b.totalHT || 0);
      case "amount-desc":
        return Number(b.totalHT || 0) - Number(a.totalHT || 0);
      case "partner-asc":
        return (a.partner?.companyName || "").localeCompare(b.partner?.companyName || "");
      case "partner-desc":
        return (b.partner?.companyName || "").localeCompare(a.partner?.companyName || "");
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  }) || [];

  // Summary stats for filtered results
  const filteredTotalHT = filteredOrders.reduce((sum: number, o: any) => sum + Number(o.totalHT || 0), 0);
  const activeFiltersCount = [partnerFilter !== "all", !!dateFrom, !!dateTo, statusFilter !== "all"].filter(Boolean).length;

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredOrders.length);

  // Reset page when filters change
  const resetPage = () => setCurrentPage(1);

  const clearAllFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPartnerFilter("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("date-desc");
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => { setSearch(value); resetPage(); };
  const handleStatusFilterChange = (value: string) => { setStatusFilter(value); resetPage(); };
  const handlePartnerFilterChange = (value: string) => { setPartnerFilter(value); resetPage(); };
  const handleDateFromChange = (value: string) => { setDateFrom(value); resetPage(); };
  const handleDateToChange = (value: string) => { setDateTo(value); resetPage(); };
  const handleSortByChange = (value: string) => { setSortBy(value); resetPage(); };
  const handleItemsPerPageChange = (value: string) => { setItemsPerPage(Number(value)); setCurrentPage(1); };

  const handleViewOrder = (order: any) => {
    setDetailOrderId(order.id);
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleChangeStatus = (order: any) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusNote("");
    setIsStatusDialogOpen(true);
  };

  const handleSubmitStatusChange = () => {
    if (!selectedOrder || !newStatus) return;
    
    updateStatusMutation.mutate({
      orderId: selectedOrder.id,
      status: newStatus,
      note: statusNote || undefined,
    });
  };

  // Simulate payment received (TEST MODE ONLY)
  const [simulatingPayment, setSimulatingPayment] = useState(false);
  const handleSimulatePayment = async (order: any) => {
    if (simulatingPayment) return;
    setSimulatingPayment(true);
    try {
      const res = await fetch('/api/admin/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Paiement simulé pour ${order.orderNumber} - Statut: Acompte payé`);
        refetch();
      } else {
        toast.error(data.error || 'Erreur lors de la simulation');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur réseau');
    } finally {
      setSimulatingPayment(false);
    }
  };

  // Stats
  const stats = {
    total: orders?.length || 0,
    pending: orders?.filter((o: any) => o.status === "PENDING_APPROVAL").length || 0,
    inProgress: orders?.filter((o: any) => ["PAYMENT_PENDING", "DEPOSIT_PAID", "IN_PRODUCTION", "READY_TO_SHIP"].includes(o.status)).length || 0,
    shipped: orders?.filter((o: any) => ["SHIPPED", "DELIVERED"].includes(o.status)).length || 0,
  };

  return (
    <AdminLayout>
      <OnboardingTour
        steps={adminOrdersTour}
        isActive={onboarding.isActive}
        currentStep={onboarding.currentStep}
        onNext={onboarding.nextStep}
        onPrev={onboarding.prevStep}
        onSkip={onboarding.skipTour}
        onComplete={onboarding.markCompleted}
      />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" data-tour="admin-orders-header">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Gestion des commandes</h1>
            <p className="text-muted-foreground mt-1">
              Suivez et gérez toutes les commandes partenaires
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </Button>
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <Download className="w-4 h-4" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total commandes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-display text-display font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="border-amber-500/20 dark:border-amber-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">En attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-display text-display font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card className="border-info/20 dark:border-info/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-info dark:text-info-dark">En cours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-display text-display font-bold text-info dark:text-info-dark">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/20 dark:border-emerald-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Expédiées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-display text-display font-bold text-emerald-600 dark:text-emerald-400">{stats.shipped}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card data-tour="admin-orders-filters">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* Row 1: Search + Status + Toggle advanced */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                  placeholder="Rechercher par numéro ou partenaire..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="w-full md:w-[220px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant={showAdvancedFilters ? "default" : "outline"}
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="gap-2 w-full md:w-auto"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtres
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Row 2: Advanced filters (collapsible) */}
              {showAdvancedFilters && (
                <div className="flex flex-col gap-3 pt-3 border-t">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Partner filter */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Partenaire</Label>
                      <Select value={partnerFilter} onValueChange={handlePartnerFilterChange}>
                        <SelectTrigger className="w-full">
                          <Building2 className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Tous les partenaires" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les partenaires</SelectItem>
                          {uniquePartners.map((p) => (
                            <SelectItem key={p.id} value={p.id?.toString()}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date from */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Date de début</Label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => handleDateFromChange(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    {/* Date to */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Date de fin</Label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => handleDateToChange(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    {/* Sort by */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Trier par</Label>
                      <Select value={sortBy} onValueChange={handleSortByChange}>
                        <SelectTrigger className="w-full">
                          <ArrowUpDown className="w-4 h-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date-desc">Date (récent → ancien)</SelectItem>
                          <SelectItem value="date-asc">Date (ancien → récent)</SelectItem>
                          <SelectItem value="amount-desc">Montant (décroissant)</SelectItem>
                          <SelectItem value="amount-asc">Montant (croissant)</SelectItem>
                          <SelectItem value="partner-asc">Partenaire (A → Z)</SelectItem>
                          <SelectItem value="partner-desc">Partenaire (Z → A)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Clear filters */}
                  {activeFiltersCount > 0 && (
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-2 text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                        Réinitialiser les filtres
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des commandes</CardTitle>
            <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span>{filteredOrders.length} commande(s) trouvée(s)</span>
              <span className="hidden sm:inline text-muted-foreground/40">·</span>
              <span className="font-medium">Total : {formatPrice(filteredTotalHT)} HT</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune commande trouvée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedOrders.map((order: any) => {
                  const statusConfig = getStatusConfig(order.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${statusConfig.color}`}>
                          <StatusIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{order.orderNumber}</span>
                            <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {order.partner?.companyName || "Partenaire inconnu"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(order.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold">{formatPrice(order.totalHT)} HT</div>
                          <div className="text-sm text-muted-foreground">
                            {order.itemCount || order.items?.length || 0} article(s)
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                            className="gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Détails
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleChangeStatus(order)}
                            className="gap-1"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Statut
                          </Button>
                          {order.status === 'PAYMENT_PENDING' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSimulatePayment(order)}
                              disabled={simulatingPayment}
                              className="gap-1 border-green-500 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                            >
                              <CreditCard className="w-4 h-4" />
                              {simulatingPayment ? 'Simulation...' : 'Simuler paiement'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t mt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Afficher</span>
                      <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                        <SelectTrigger className="w-[70px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                      <span>par page</span>
                      <span className="hidden sm:inline text-muted-foreground/40 mx-1">·</span>
                      <span className="hidden sm:inline">{startIndex}–{endIndex} sur {filteredOrders.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                        <ChevronsLeft className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm px-3 font-medium">Page {currentPage} sur {totalPages}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                        <ChevronsRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Commande {selectedOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              Détails complets de la commande
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Statut actuel</p>
                  <Badge className={`mt-1 ${getStatusConfig(selectedOrder.status).color}`}>
                    {getStatusConfig(selectedOrder.status).label}
                  </Badge>
                </div>
                <Button onClick={() => {
                  setIsDetailOpen(false);
                  handleChangeStatus(selectedOrder);
                }}>
                  Changer le statut
                </Button>
              </div>

              {/* Partner Info */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Informations partenaire
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Entreprise</p>
                    <p className="font-medium">{selectedOrder.partner?.companyName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium">{selectedOrder.partner?.primaryContactName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedOrder.partner?.primaryContactEmail || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{selectedOrder.partner?.primaryContactPhone || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Adresse de livraison
                </h4>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p>{selectedOrder.deliveryStreet || selectedOrder.shippingStreet || "N/A"}</p>
                  {(selectedOrder.deliveryStreet2 || selectedOrder.shippingStreet2) && <p>{selectedOrder.deliveryStreet2 || selectedOrder.shippingStreet2}</p>}
                  <p>{selectedOrder.deliveryPostalCode || selectedOrder.shippingPostalCode} {selectedOrder.deliveryCity || selectedOrder.shippingCity}</p>
                  <p>{{BE: 'Belgique', FR: 'France', NL: 'Pays-Bas', DE: 'Allemagne', LU: 'Luxembourg'}[selectedOrder.deliveryCountry || selectedOrder.shippingCountry || ''] || selectedOrder.deliveryCountry || selectedOrder.shippingCountry || ''}</p>
                  {selectedOrder.deliveryContactName && (
                    <p className="mt-2 text-sm text-muted-foreground">Contact : {selectedOrder.deliveryContactName}{selectedOrder.deliveryContactPhone ? ` - ${selectedOrder.deliveryContactPhone}` : ''}</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Articles commandés
                </h4>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.items?.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img 
                            src={item.imageUrl} 
                            alt={item.name || "Produit"} 
                            className="w-12 h-12 rounded object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{item.name || item.product?.name || "Produit"}</p>
                          {item.sku && (
                            <p className="text-xs text-muted-foreground font-mono">Réf : {item.sku}</p>
                          )}
                          {item.variant && (
                            <p className="text-xs md:text-sm text-muted-foreground">{item.variant.name}</p>
                          )}
                          {item.color && (
                            <p className="text-xs text-muted-foreground">Couleur : {item.color}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(item.totalHT)}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">{item.quantity} x {formatPrice(item.unitPriceHT)} HT</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total HT</span>
                    <span>{formatPrice(selectedOrder.totalHT)}</span>
                  </div>
                  {Number(selectedOrder.shippingHT || selectedOrder.shippingCost || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frais de livraison HT</span>
                      <span>{formatPrice(selectedOrder.shippingHT || selectedOrder.shippingCost || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total HT</span>
                    <span>{formatPrice(Number(selectedOrder.totalHT || 0) + Number(selectedOrder.shippingHT || selectedOrder.shippingCost || 0))}</span>
                  </div>
                  {Number(selectedOrder.depositAmount || 0) > 0 && (
                    <>
                      <div className="flex justify-between text-emerald-700 bg-emerald-50 p-2 rounded">
                        <span className="font-medium">Acompte</span>
                        <span className="font-semibold">{formatPrice(selectedOrder.depositAmount)} HT</span>
                      </div>
                      <div className="flex justify-between text-amber-700 bg-amber-50 p-2 rounded">
                        <span className="font-medium">Solde restant</span>
                        <span className="font-semibold">{formatPrice(Number(selectedOrder.totalHT || 0) + Number(selectedOrder.shippingHT || selectedOrder.shippingCost || 0) - Number(selectedOrder.depositAmount || 0))} HT</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Date de création</p>
                  <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dernière mise à jour</p>
                  <p className="font-medium">{formatDate(selectedOrder.updatedAt)}</p>
                </div>
                {(selectedOrder as any).deliveryRequestedDate && (
                  <div className="col-span-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-muted-foreground flex items-center gap-1">
                      <span>📅</span> Date de livraison souhaitée
                    </p>
                    <p className="font-semibold text-primary">
                      {new Date((selectedOrder as any).deliveryRequestedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le statut de la commande</DialogTitle>
            <DialogDescription>
              Commande {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nouveau statut</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <status.icon className="w-4 h-4" />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Note (optionnel)</Label>
              <Textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Ajouter une note sur ce changement de statut..."
                rows={3}
              />
            </div>

            {/* Status Flow Preview */}
            {selectedOrder && newStatus && newStatus !== selectedOrder.status && (
              <div className="flex items-center justify-center gap-2 p-4 bg-muted/50 rounded-lg">
                <Badge className={getStatusConfig(selectedOrder.status).color}>
                  {getStatusConfig(selectedOrder.status).label}
                </Badge>
                <ChevronRight className="w-4 h-4" />
                <Badge className={getStatusConfig(newStatus).color}>
                  {getStatusConfig(newStatus).label}
                </Badge>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmitStatusChange}
              disabled={!newStatus || newStatus === selectedOrder?.status || updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Mise à jour..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
