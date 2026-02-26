import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Heart
} from "lucide-react";
import { Link } from "wouter";
import { ExportButton } from "@/components/ExportButton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Orders() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data: orders, isLoading } = trpc.orders.list.useQuery({
    status: statusFilter,
    limit: 50,
  });

  const exportQuery = trpc.orders.export.useQuery(
    { status: statusFilter },
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
      PENDING_DEPOSIT: "bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30",
      DEPOSIT_PAID: "bg-info/15 dark:bg-info-light text-info dark:text-info-dark border-info/20 dark:border-info/30",
      IN_PRODUCTION: "bg-purple-500/15 dark:bg-purple-500/25 text-purple-800 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/30",
      SHIPPED: "bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30",
      DELIVERED: "bg-green-200 text-green-900 border-green-300",
      COMPLETED: "bg-green-300 text-green-950 border-green-400",
      CANCELLED: "bg-destructive/15 dark:bg-destructive/25 text-destructive dark:text-destructive border-destructive/20 dark:border-destructive/30",
    };
    return colors[status] || "bg-muted dark:bg-muted/50 text-gray-800 border-border dark:border-border";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: "Brouillon",
      PENDING_APPROVAL: "En attente d'approbation",
      PENDING_DEPOSIT: "En attente d'acompte",
      DEPOSIT_PAID: "Acompte payé",
      IN_PRODUCTION: "En production",
      READY_TO_SHIP: "Prêt à expédier",
      PARTIALLY_SHIPPED: "Expédition partielle",
      SHIPPED: "Expédié",
      DELIVERED: "Livré",
      COMPLETED: "Terminé",
      CANCELLED: "Annulé",
      REFUNDED: "Remboursé",
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      DRAFT: Clock,
      PENDING_DEPOSIT: Clock,
      DEPOSIT_PAID: CheckCircle2,
      IN_PRODUCTION: Package,
      SHIPPED: Truck,
      DELIVERED: CheckCircle2,
      COMPLETED: CheckCircle2,
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl text-display text-display font-bold">Mes commandes</h1>
                <p className="text-sm text-muted-foreground">
                  {orders?.length || 0} commandes
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

      <div className="container py-8">
        {/* Status Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <Button
            variant={statusFilter === undefined ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(undefined)}
          >
            Toutes
          </Button>
          {[
            { value: "PENDING_DEPOSIT", label: "En attente" },
            { value: "DEPOSIT_PAID", label: "Payées" },
            { value: "IN_PRODUCTION", label: "En production" },
            { value: "SHIPPED", label: "Expédiées" },
            { value: "COMPLETED", label: "Terminées" },
          ].map((filter) => (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Orders List */}
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="skeleton h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : orders && orders.length > 0 ? (
          <Card>
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
                {orders.map((order) => (
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
                      €{Number(order.totalHT).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      €{Number(order.totalTTC).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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
                          <Button variant="ghost" size="sm" title="Facture">
                            <FileText className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <Package className="w-16 h-16 text-muted-foreground/50 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
                <p className="text-muted-foreground">
                  {statusFilter
                    ? "Aucune commande avec ce statut"
                    : "Vous n'avez pas encore passé de commande"}
                </p>
              </div>
              <Link href="/catalog">
                <Button>Parcourir le catalogue</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
