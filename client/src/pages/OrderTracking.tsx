import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Euro,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  AlertCircle,
  XCircle,
  Download,
  Ban,
  AlertTriangle,
} from "lucide-react";

type OrderStatus = "PENDING_APPROVAL" | "PENDING_DEPOSIT" | "PAYMENT_PENDING" | "DEPOSIT_PAID" | "PAYMENT_FAILED" | "IN_PRODUCTION" | "READY_TO_SHIP" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "REFUSED";

const STATUS_STEPS: { status: OrderStatus; label: string; description: string; icon: any }[] = [
  { status: "PENDING_APPROVAL", label: "En attente", description: "Commande en cours de validation", icon: Clock },
  { status: "PENDING_DEPOSIT", label: "Acompte requis", description: "En attente du paiement de l'acompte", icon: Euro },
  { status: "PAYMENT_PENDING", label: "Paiement en cours", description: "Virement SEPA en cours de traitement", icon: Clock },
  { status: "DEPOSIT_PAID", label: "Acompte payé", description: "Acompte reçu, commande confirmée", icon: CheckCircle2 },
  { status: "IN_PRODUCTION", label: "En production", description: "Votre commande est en cours de préparation", icon: Package },
  { status: "READY_TO_SHIP", label: "Prêt à expédier", description: "Commande prête pour l'expédition", icon: Package },
  { status: "SHIPPED", label: "Expédié", description: "Votre commande est en route", icon: Truck },
  { status: "DELIVERED", label: "Livré", description: "Commande livrée", icon: CheckCircle2 },
  { status: "COMPLETED", label: "Terminé", description: "Commande terminée", icon: CheckCircle2 },
];

const getStatusIndex = (status: string): number => {
  if (status === "CANCELLED" || status === "REFUSED") return -1;
  const index = STATUS_STEPS.findIndex(s => s.status === status);
  return index >= 0 ? index : 0;
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case "PENDING_APPROVAL":
    case "PENDING_DEPOSIT":
    case "PAYMENT_PENDING":
      return "bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-400 border-yellow-300";
    case "PAYMENT_FAILED":
      return "bg-destructive/15 dark:bg-destructive/25 text-destructive dark:text-destructive border-red-300";
    case "DEPOSIT_PAID":
    case "IN_PRODUCTION":
    case "READY_TO_SHIP":
      return "bg-info/15 dark:bg-info-light text-info dark:text-info-dark border-blue-300";
    case "SHIPPED":
      return "bg-cyan-500/15 dark:bg-cyan-500/25 text-cyan-800 border-cyan-300";
    case "DELIVERED":
    case "COMPLETED":
      return "bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400 border-green-300";
    case "CANCELLED":
    case "REFUSED":
      return "bg-destructive/15 dark:bg-destructive/25 text-destructive dark:text-destructive border-red-300";
    default:
      return "bg-muted dark:bg-muted/50 text-gray-800 border-gray-300";
  }
};

export default function OrderTracking() {
  const { user } = useAuth();
  const params = useParams<{ orderId: string }>();
  const orderId = parseInt(params.orderId || "0");

  const { data: order, isLoading, refetch } = trpc.orders.getWithItems.useQuery(
    { id: orderId },
    { enabled: orderId > 0 }
  );

  // Cancel order state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const cancelOrderMutation = trpc.orders.cancel.useMutation({
    onSuccess: () => {
      toast.success("Commande annulée avec succès. Les produits ont été remis en stock.");
      setShowCancelDialog(false);
      setCancelReason("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de l'annulation de la commande");
    },
  });

  const canCancel = order?.status === "PAYMENT_PENDING" || order?.status === "PAYMENT_FAILED";

  const handleCancelOrder = () => {
    if (!orderId) return;
    cancelOrderMutation.mutate({
      orderId,
      reason: cancelReason || undefined,
    });
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number | string | null) => {
    if (!price) return "0.00 €";
    return `${Number(price).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
            <CardDescription>
              Vous devez être connecté pour suivre vos commandes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>Se connecter</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Commande introuvable
            </CardTitle>
            <CardDescription>
              Cette commande n'existe pas ou vous n'y avez pas accès
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/orders">
              <Button>Voir mes commandes</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);
  const isCancelled = order.status === "CANCELLED" || order.status === "REFUSED";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <Link href="/orders">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl text-display text-display font-bold flex items-center gap-2">
                  Commande {order.orderNumber}
                  <Badge className={getStatusColor(order.status)}>
                    {STATUS_STEPS.find(s => s.status === order.status)?.label || order.status}
                  </Badge>
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Passée le {formatDate(order.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {canCancel && (
                <Button
                  variant="destructive"
                  className="gap-2 w-full sm:w-auto"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <Ban className="w-4 h-4" />
                  Annuler la commande
                </Button>
              )}
              <Link href={`/order/${orderId}/summary`}>
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <FileText className="w-4 h-4" />
                  Récapitulatif
                </Button>
              </Link>
              <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={() => window.open(`/api/orders/${orderId}/pdf`, '_blank')}>
                <Download className="w-4 h-4" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-4 md:gap-4 md:p-8">
          {/* Left Column - Tracking */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Suivi de commande
                </CardTitle>
                <CardDescription>
                  Suivez l'avancement de votre commande en temps réel
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isCancelled ? (
                  <div className="flex items-center gap-4 p-4 md:p-6 bg-destructive/10 dark:bg-destructive/20 border border-destructive/20 dark:border-destructive/30 rounded-lg">
                    <XCircle className="w-12 h-12 text-red-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-destructive dark:text-destructive">{order.status === "REFUSED" ? "Commande refusée" : "Commande annulée"}</h3>
                      <p className="text-destructive dark:text-destructive">{order.status === "REFUSED" ? "Le paiement n'a pas été reçu dans les délais. Les produits ont été remis en stock." : "Cette commande a été annulée."}</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    {STATUS_STEPS.map((step, index) => {
                      const isCompleted = index <= currentStatusIndex;
                      const isCurrent = index === currentStatusIndex;
                      const StepIcon = step.icon;

                      return (
                        <div key={step.status} className="flex gap-4 pb-8 last:pb-0">
                          {/* Timeline Line */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                isCompleted
                                  ? "bg-primary border-primary text-white"
                                  : "bg-muted border-muted-foreground/30 text-muted-foreground"
                              } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                            >
                              <StepIcon className="w-5 h-5" />
                            </div>
                            {index < STATUS_STEPS.length - 1 && (
                              <div
                                className={`w-0.5 flex-1 mt-2 ${
                                  index < currentStatusIndex ? "bg-primary" : "bg-muted-foreground/30"
                                }`}
                              />
                            )}
                          </div>

                          {/* Step Content */}
                          <div className={`flex-1 pb-4 ${!isCompleted && "opacity-50"}`}>
                            <div className="flex items-center gap-2">
                              <h4 className={`font-semibold ${isCurrent ? "text-primary" : ""}`}>
                                {step.label}
                              </h4>
                              {isCurrent && (
                                <Badge variant="outline" className="text-xs">
                                  En cours
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs md:text-sm text-muted-foreground mt-1">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Articles commandés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item: any, index: number) => (
                      <div key={index} className="flex gap-4 p-4 rounded-lg border">
                        <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.productName || "Produit"}</h4>
                          {item.color && (
                            <p className="text-xs md:text-sm text-muted-foreground">Couleur : {item.color}</p>
                          )}
                          <p className="text-xs md:text-sm text-muted-foreground font-mono">
                            {item.sku || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(item.totalHT)}</p>
                          <p className="text-xs md:text-sm text-muted-foreground">Qté: {item.quantity}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Aucun article trouvé</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total HT</span>
                    <span>{formatPrice(order.totalHT)}</span>
                  </div>
                  {Number((order as any).shippingHT || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Frais de livraison HT</span>
                      <span>{formatPrice((order as any).shippingHT)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-base font-semibold text-display">
                    <span>Total HT</span>
                    <span className="text-primary">{formatPrice(Number(order.totalHT || 0) + Number((order as any).shippingHT || 0))}</span>
                  </div>
                </div>

                {order.depositAmount && Number(order.depositAmount) > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-emerald-700 bg-emerald-50 p-2 rounded">
                        <span className="font-medium">Acompte versé</span>
                        <span className="font-semibold">{formatPrice(order.depositAmount)} HT</span>
                      </div>
                      <div className="flex justify-between text-sm text-amber-700 bg-amber-50 p-2 rounded font-medium">
                        <span>Solde restant</span>
                        <span>{formatPrice(Number(order.totalHT || 0) + Number((order as any).shippingHT || 0) - Number(order.depositAmount || 0))} HT</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Delivery Requested Date */}
            {(order as any).deliveryRequestedDate && (
              <Card className="border-primary/30">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date de livraison souhaitée</p>
                      <p className="font-semibold text-primary">
                        {new Date((order as any).deliveryRequestedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Adresse de livraison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{(order as any).shippingContactName || "N/A"}</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {(order as any).shippingStreet || "Adresse non renseignée"}
                  {(order as any).shippingStreet2 && <br />}
                  {(order as any).shippingStreet2}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {(order as any).shippingPostalCode} {(order as any).shippingCity}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">{(order as any).shippingCountry || "Belgique"}</p>
                
                {(order as any).shippingContactPhone && (
                  <div className="flex items-center gap-2 pt-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{(order as any).shippingContactPhone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cancel Order Card (visible only for PAYMENT_PENDING / PAYMENT_FAILED) */}
            {canCancel && (
              <Card className="border-amber-300 dark:border-amber-700">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Annuler cette commande ?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Vous pouvez annuler cette commande tant que le paiement n'a pas été validé. Les produits seront automatiquement remis en stock.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <Ban className="w-4 h-4" />
                    Annuler la commande
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Contact Support */}
            <Card>
              <CardHeader>
                <CardTitle>Besoin d'aide ?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs md:text-sm text-muted-foreground">
                  Notre équipe est disponible pour répondre à vos questions.
                </p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full gap-2">
                    <Mail className="w-4 h-4" />
                    Contacter le support
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <Phone className="w-4 h-4" />
                    +32 2 123 45 67
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Cancel Order Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Confirmer l'annulation
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir annuler la commande <strong>{order?.orderNumber}</strong> ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Recap of what will happen */}
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-1">Ce qui va se passer :</p>
              <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                <li>La commande sera marquée comme annulée</li>
                <li>Les produits seront remis en stock automatiquement</li>
                <li>Vous et les administrateurs serez notifiés</li>
                {order?.depositAmount && Number(order.depositAmount) > 0 && (
                  <li>Si un paiement a été initié, il sera annulé ou remboursé</li>
                )}
              </ul>
            </div>

            {/* Optional reason */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Raison de l'annulation (optionnel)</label>
              <Textarea
                placeholder="Ex: Erreur de commande, changement d'avis..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              className="w-full sm:w-auto"
            >
              Garder la commande
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={cancelOrderMutation.isPending}
              className="w-full sm:w-auto gap-2"
            >
              <Ban className="w-4 h-4" />
              {cancelOrderMutation.isPending ? "Annulation..." : "Confirmer l'annulation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
