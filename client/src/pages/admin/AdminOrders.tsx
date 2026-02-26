import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
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
  RefreshCw,
  Download
} from "lucide-react";
import { toast } from "sonner";

type OrderStatus = "PENDING_APPROVAL" | "PENDING_DEPOSIT" | "DEPOSIT_PAID" | "IN_PRODUCTION" | "READY_TO_SHIP" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED";

const ORDER_STATUSES: { value: OrderStatus; label: string; color: string; icon: any }[] = [
  { value: "PENDING_APPROVAL", label: "En attente d'approbation", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  { value: "PENDING_DEPOSIT", label: "Acompte requis", color: "bg-orange-100 text-orange-800", icon: Euro },
  { value: "DEPOSIT_PAID", label: "Acompte payé", color: "bg-blue-100 text-blue-800", icon: CheckCircle2 },
  { value: "IN_PRODUCTION", label: "En production", color: "bg-purple-100 text-purple-800", icon: Package },
  { value: "READY_TO_SHIP", label: "Prêt à expédier", color: "bg-indigo-100 text-indigo-800", icon: Package },
  { value: "SHIPPED", label: "Expédié", color: "bg-cyan-100 text-cyan-800", icon: Truck },
  { value: "DELIVERED", label: "Livré", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  { value: "COMPLETED", label: "Terminé", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  { value: "CANCELLED", label: "Annulé", color: "bg-red-100 text-red-800", icon: XCircle },
];

export default function AdminOrders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");
  const [statusNote, setStatusNote] = useState("");

  const { data: orders, isLoading, refetch } = trpc.orders.list.useQuery({
    limit: 100,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

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

  const filteredOrders = orders?.filter((order: any) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      order.orderNumber?.toLowerCase().includes(searchLower) ||
      order.partner?.companyName?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleViewOrder = (order: any) => {
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

  // Stats
  const stats = {
    total: orders?.length || 0,
    pending: orders?.filter((o: any) => o.status === "PENDING_APPROVAL").length || 0,
    inProgress: orders?.filter((o: any) => ["DEPOSIT_PAID", "IN_PRODUCTION", "READY_TO_SHIP"].includes(o.status)).length || 0,
    shipped: orders?.filter((o: any) => ["SHIPPED", "DELIVERED"].includes(o.status)).length || 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des commandes</h1>
            <p className="text-muted-foreground mt-1">
              Suivez et gérez toutes les commandes partenaires
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total commandes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-display text-display font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">En attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-display text-display font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">En cours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-display text-display font-bold text-blue-600">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Expédiées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-display text-display font-bold text-green-600">{stats.shipped}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro ou partenaire..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
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
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des commandes</CardTitle>
            <CardDescription>
              {filteredOrders.length} commande(s) trouvée(s)
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
                {filteredOrders.map((order: any) => {
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
                          <div className="font-semibold">{formatPrice(order.totalTTC)}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.items?.length || 0} article(s)
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
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                  <p className="text-sm text-muted-foreground">Statut actuel</p>
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
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Entreprise</p>
                    <p className="font-medium">{selectedOrder.partner?.companyName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium">{selectedOrder.partner?.primaryContactName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedOrder.partner?.primaryContactEmail || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
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
                  <p>{selectedOrder.shippingStreet || "N/A"}</p>
                  {selectedOrder.shippingStreet2 && <p>{selectedOrder.shippingStreet2}</p>}
                  <p>{selectedOrder.shippingPostalCode} {selectedOrder.shippingCity}</p>
                  <p>{selectedOrder.shippingCountry}</p>
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
                        {item.product?.imageUrl ? (
                          <img 
                            src={item.product.imageUrl} 
                            alt={item.product?.name} 
                            className="w-12 h-12 rounded object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{item.product?.name || "Produit"}</p>
                          {item.variant && (
                            <p className="text-sm text-muted-foreground">{item.variant.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(item.totalHT)}</p>
                        <p className="text-sm text-muted-foreground">Qté: {item.quantity}</p>
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TVA (21%)</span>
                    <span>{formatPrice(Number(selectedOrder.totalTTC) - Number(selectedOrder.totalHT))}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-display">
                    <span>Total TTC</span>
                    <span>{formatPrice(selectedOrder.totalTTC)}</span>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date de création</p>
                  <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dernière mise à jour</p>
                  <p className="font-medium">{formatDate(selectedOrder.updatedAt)}</p>
                </div>
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

          <DialogFooter>
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
