import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck,
  FileText,
  Download,
  Eye,
  RefreshCw,
  Heart,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Filter
} from "lucide-react";
import { Link } from "wouter";
import { ExportButton } from "@/components/ExportButton";
import { Badge } from "@/components/ui/badge";
import { OnboardingTour } from "@/components/OnboardingTour";
import { useOnboarding } from "@/hooks/useOnboarding";
import { ordersTour } from "@/config/onboarding-tours";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_OPTIONS = [
  { value: "PENDING_APPROVAL", label: "En attente d'approbation" },
  { value: "PENDING_DEPOSIT", label: "En attente d'acompte" },
  { value: "PAYMENT_PENDING", label: "Paiement en cours" },
  { value: "DEPOSIT_PAID", label: "Acompte payé" },
  { value: "IN_PRODUCTION", label: "En production" },
  { value: "READY_TO_SHIP", label: "Prêt à expédier" },
  { value: "SHIPPED", label: "Expédié" },
  { value: "DELIVERED", label: "Livré" },
  { value: "COMPLETED", label: "Terminé" },
  { value: "CANCELLED", label: "Annulé" },
  { value: "REFUSED", label: "Refusé" },
];

export default function Orders() {
  const { user } = useAuth();
  const onboarding = useOnboarding("orders");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const { data: orders, isLoading } = trpc.orders.list.useQuery({
    limit: 100,
  });

  const exportQuery = trpc.orders.export.useQuery(
    { status: statusFilter !== "all" ? statusFilter : undefined },
    { enabled: false }
  );

  const reorderMutation = trpc.orders.reorder.useMutation({
    onSuccess: () => {
      alert("Les articles ont été ajoutés à votre panier !");
    },
    onError: (error) => {
      alert("Erreur: " + error.message);
    },
  });

  const handleReorder = (orderId: number) => {
    reorderMutation.mutate({ orderId });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-muted dark:bg-muted/50 text-gray-800 border-border dark:border-border",
      PENDING_APPROVAL: "bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30",
      PENDING_DEPOSIT: "bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30",
      PAYMENT_PENDING: "bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30",
      DEPOSIT_PAID: "bg-info/15 dark:bg-info-light text-info dark:text-info-dark border-info/20 dark:border-info/30",
      IN_PRODUCTION: "bg-purple-500/15 dark:bg-purple-500/25 text-purple-800 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/30",
      READY_TO_SHIP: "bg-indigo-500/15 dark:bg-indigo-500/25 text-indigo-800 dark:text-indigo-400 border-indigo-500/20 dark:border-indigo-500/30",
      SHIPPED: "bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30",
      DELIVERED: "bg-green-200 text-green-900 border-green-300",
      COMPLETED: "bg-green-300 text-green-950 border-green-400",
      CANCELLED: "bg-destructive/15 dark:bg-destructive/25 text-destructive dark:text-destructive border-destructive/20 dark:border-destructive/30",
      REFUSED: "bg-destructive/15 dark:bg-destructive/25 text-destructive dark:text-destructive border-destructive/20 dark:border-destructive/30",
    };
    return colors[status] || "bg-muted dark:bg-muted/50 text-gray-800 border-border dark:border-border";
  };

  const getStatusLabel = (status: string) => {
    const found = STATUS_OPTIONS.find(s => s.value === status);
    if (found) return found.label;
    const labels: Record<string, string> = {
      DRAFT: "Brouillon",
      PARTIALLY_SHIPPED: "Expédition partielle",
      REFUNDED: "Remboursé",
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      DRAFT: Clock,
      PENDING_APPROVAL: Clock,
      PENDING_DEPOSIT: Clock,
      PAYMENT_PENDING: Clock,
      DEPOSIT_PAID: CheckCircle2,
      IN_PRODUCTION: Package,
      READY_TO_SHIP: Package,
      SHIPPED: Truck,
      DELIVERED: CheckCircle2,
      COMPLETED: CheckCircle2,
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  // Filtered and sorted orders
  const { filteredOrders, filteredTotalHT, activeFiltersCount } = useMemo(() => {
    const filtered = (orders || []).filter((order: any) => {
      // Text search
      if (search) {
        const searchLower = search.toLowerCase();
        if (!order.orderNumber?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      // Status filter
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }
      // Date from
      if (dateFrom) {
        const orderDate = new Date(order.createdAt);
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (orderDate < fromDate) return false;
      }
      // Date to
      if (dateTo) {
        const orderDate = new Date(order.createdAt);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (orderDate > toDate) return false;
      }
      return true;
    });

    // Sort
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case "date-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "date-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "amount-asc":
          return Number(a.totalHT || 0) - Number(b.totalHT || 0);
        case "amount-desc":
          return Number(b.totalHT || 0) - Number(a.totalHT || 0);
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    const totalHT = filtered.reduce((sum: number, o: any) => sum + Number(o.totalHT || 0), 0);
    const count = [statusFilter !== "all", !!dateFrom, !!dateTo].filter(Boolean).length;

    return { filteredOrders: filtered, filteredTotalHT: totalHT, activeFiltersCount: count };
  }, [orders, search, statusFilter, dateFrom, dateTo, sortBy]);

  const formatPrice = (price: number | string | null) => {
    if (!price) return "0,00 €";
    return `${Number(price).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`;
  };

  const clearAllFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("date-desc");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header data-tour="orders-header" className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl text-display font-bold">Mes commandes</h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {filteredOrders.length} commande(s) &middot; Total : {formatPrice(filteredTotalHT)} HT
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <ExportButton
                onExport={async () => {
                  const result = await exportQuery.refetch();
                  return result.data || { fileBase64: "" };
                }}
                filename={`commandes-${new Date().toISOString().split('T')[0]}.xlsx`}
              />
              <Link href="/catalog">
                <Button>Nouvelle commande</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-6">
        {/* Filters Card */}
        <Card data-tour="orders-filters" className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* Row 1: Search + Status + Toggle */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par n° de commande..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant={showAdvancedFilters ? "default" : "outline"}
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="gap-2 w-full sm:w-auto"
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Date from */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Date de début</Label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    {/* Date to */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Date de fin</Label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    {/* Sort by */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Trier par</Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full">
                          <ArrowUpDown className="w-4 h-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date-desc">Date (récent &rarr; ancien)</SelectItem>
                          <SelectItem value="date-asc">Date (ancien &rarr; récent)</SelectItem>
                          <SelectItem value="amount-desc">Montant (décroissant)</SelectItem>
                          <SelectItem value="amount-asc">Montant (croissant)</SelectItem>
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
        {isLoading ? (
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="skeleton h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : filteredOrders.length > 0 ? (
          <>
            {/* Vue desktop : Tableau */}
            <Card data-tour="orders-list" className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Commande</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Montant HT</TableHead>
                    <TableHead className="text-right">Montant TTC</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order: any) => (
                    <TableRow key={order.id} className="hover:bg-accent/5">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          {order.orderNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(order.totalHT)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatPrice(order.totalTTC)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div data-tour="orders-actions" className="flex justify-end gap-2">
                          <Link href={`/order/${order.id}`}>
                            <Button variant="ghost" size="sm" title="Voir les détails">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Recommander"
                            onClick={() => handleReorder(order.id)}
                            disabled={reorderMutation.isPending}
                          >
                            <RefreshCw className={`w-4 h-4 ${reorderMutation.isPending ? 'animate-spin' : ''}`} />
                          </Button>
                          {order.status !== "DRAFT" && (
                            <Link href={`/order/${order.id}/summary`}>
                              <Button variant="ghost" size="sm" title="Récapitulatif">
                                <FileText className="w-4 h-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Vue mobile : Cartes empilées */}
            <div className="md:hidden space-y-4">
              {filteredOrders.map((order: any) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <CardTitle className="text-base">{order.orderNumber}</CardTitle>
                        </div>
                        <CardDescription>
                          {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Montant HT</span>
                        <span className="font-medium">{formatPrice(order.totalHT)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Montant TTC</span>
                        <span className="font-bold">{formatPrice(order.totalTTC)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/order/${order.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          Détails
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleReorder(order.id)}
                        disabled={reorderMutation.isPending}
                      >
                        <RefreshCw className={`w-4 h-4 ${reorderMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                      {order.status !== "DRAFT" && (
                        <Link href={`/order/${order.id}/summary`}>
                          <Button variant="outline" size="sm">
                            <FileText className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <Package className="w-16 h-16 text-muted-foreground/50 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
                <p className="text-muted-foreground">
                  {(search || statusFilter !== "all" || dateFrom || dateTo)
                    ? "Aucune commande ne correspond à vos filtres"
                    : "Vous n'avez pas encore passé de commande"}
                </p>
              </div>
              {(search || statusFilter !== "all" || dateFrom || dateTo) ? (
                <Button variant="outline" onClick={clearAllFilters}>
                  Réinitialiser les filtres
                </Button>
              ) : (
                <Link href="/catalog">
                  <Button>Parcourir le catalogue</Button>
                </Link>
              )}
            </div>
          </Card>
        )}
      </div>
      <OnboardingTour
        steps={ordersTour}
        isActive={onboarding.isActive}
        currentStep={onboarding.currentStep}
        onNext={onboarding.nextStep}
        onPrev={onboarding.prevStep}
        onSkip={onboarding.skipTour}
        onComplete={onboarding.markCompleted}
      />
    </div>
  );
}
