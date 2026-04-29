import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import {
  ArrowLeft,
  Package,
  Download,
  FileText,
  MapPin,
  Phone,
  Building2,
  Euro,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
} from "lucide-react";

type OrderStatus =
  | "PENDING_APPROVAL"
  | "PENDING_DEPOSIT"
  | "PAYMENT_PENDING"
  | "DEPOSIT_PAID"
  | "PAYMENT_FAILED"
  | "IN_PRODUCTION"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUSED";

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_APPROVAL: { label: "En attente de validation", color: "bg-amber-500/15 text-amber-800 dark:text-amber-400 border-yellow-300", icon: Clock },
  PENDING_DEPOSIT: { label: "Acompte requis", color: "bg-amber-500/15 text-amber-800 dark:text-amber-400 border-yellow-300", icon: Euro },
  PAYMENT_PENDING: { label: "Paiement en cours", color: "bg-amber-500/15 text-amber-800 dark:text-amber-400 border-yellow-300", icon: Clock },
  DEPOSIT_PAID: { label: "Acompte payé", color: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border-green-300", icon: CheckCircle2 },
  PAYMENT_FAILED: { label: "Paiement échoué", color: "bg-destructive/15 text-destructive border-red-300", icon: AlertCircle },
  IN_PRODUCTION: { label: "En production", color: "bg-info/15 text-info dark:text-info-dark border-blue-300", icon: Package },
  READY_TO_SHIP: { label: "Prêt à expédier", color: "bg-info/15 text-info dark:text-info-dark border-blue-300", icon: Package },
  SHIPPED: { label: "Expédié", color: "bg-cyan-500/15 text-cyan-800 border-cyan-300", icon: Truck },
  DELIVERED: { label: "Livré", color: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border-green-300", icon: CheckCircle2 },
  COMPLETED: { label: "Terminé", color: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border-green-300", icon: CheckCircle2 },
  CANCELLED: { label: "Annulé", color: "bg-destructive/15 text-destructive border-red-300", icon: AlertCircle },
  REFUSED: { label: "Refusé", color: "bg-destructive/15 text-destructive border-red-300", icon: AlertCircle },
};

export default function OrderSummary() {
  const { user } = useAuth();
  const params = useParams<{ orderId: string }>();
  const orderId = parseInt(params.orderId || "0");

  const { data: order, isLoading } = trpc.orders.getWithItems.useQuery(
    { id: orderId },
    { enabled: orderId > 0 }
  );

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatPrice = (price: number | string | null) => {
    if (!price) return "0,00 €";
    return `${Number(price).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  };

  const handleDownloadPdf = () => {
    window.open(`/api/orders/${orderId}/pdf`, "_blank");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
        </header>
        <div className="container py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
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

  const statusInfo = STATUS_LABELS[order.status] || { label: order.status, color: "bg-muted text-muted-foreground", icon: Clock };
  const StatusIcon = statusInfo.icon;
  const items = order.items || [];

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
                <h1 className="text-xl md:text-2xl text-display font-bold flex items-center gap-2 flex-wrap">
                  <FileText className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  Récapitulatif {order.orderNumber}
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Passée le {formatDate(order.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Link href={`/order/${orderId}`} className="flex-1 sm:flex-none">
                <Button variant="outline" className="gap-2 w-full">
                  <Truck className="w-4 h-4" />
                  <span className="hidden sm:inline">Suivi</span>
                </Button>
              </Link>
              <Button onClick={handleDownloadPdf} className="gap-2 flex-1 sm:flex-none">
                <Download className="w-4 h-4" />
                Télécharger PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-6 md:py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Status Card */}
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <StatusIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Statut actuel</p>
                    <Badge className={`${statusInfo.color} text-sm mt-1`}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center w-full sm:w-auto">
                  <div>
                    <p className="text-xs text-muted-foreground">Total HT</p>
                    <p className="text-sm font-semibold">{formatPrice(order.totalHT)}</p>
                  </div>
                  {Number(order.shippingHT || 0) > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">dont Livraison</p>
                      <p className="text-sm font-semibold">{formatPrice(order.shippingHT)}</p>
                    </div>
                  )}
                  {Number(order.depositAmount || 0) > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Acompte</p>
                      <p className="text-sm font-semibold text-emerald-600">{formatPrice(order.depositAmount)}</p>
                    </div>
                  )}
                  {Number(order.depositAmount || 0) > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Solde restant</p>
                      <p className="text-sm font-semibold text-amber-600">{formatPrice(Number(order.totalHT || 0) - Number(order.depositAmount || 0))}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Package className="w-5 h-5" />
                Articles commandés ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground">Produit</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground">Réf. / EAN</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground">Source</th>
                      <th className="text-center py-3 px-3 font-medium text-muted-foreground">Qté</th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground">P.U. HT</th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground">Total HT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any, index: number) => (
                      <tr key={item.id || index} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.productName} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                <Package className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{item.productName || "Produit"}</p>
                              {item.color && (
                                <p className="text-xs text-muted-foreground">Couleur : {item.color}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            {item.sku && (
                              <p className="text-xs font-mono">{item.sku}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {item.stockSource === "TRANSIT" ? (
                            <Badge variant="outline" className="text-xs">
                              Transit {item.stockSourceArrivalWeek ? `(${item.stockSourceArrivalWeek})` : ""}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300">
                              En stock
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-medium">{item.quantity}</td>
                        <td className="py-3 px-3 text-right">{formatPrice(item.unitPriceHT)}</td>
                        <td className="py-3 px-3 text-right font-semibold">{formatPrice(item.totalHT)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {items.map((item: any, index: number) => (
                  <div key={item.id || index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{item.productName || "Produit"}</p>
                        {item.color && (
                          <p className="text-xs text-muted-foreground">Couleur : {item.color}</p>
                        )}
                      </div>
                      <p className="font-semibold text-sm">{formatPrice(item.totalHT)}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Qté: {item.quantity} × {formatPrice(item.unitPriceHT)}</span>
                      {item.stockSource === "TRANSIT" ? (
                        <Badge variant="outline" className="text-xs">
                          Transit {item.stockSourceArrivalWeek ? `(${item.stockSourceArrivalWeek})` : ""}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300">
                          En stock
                        </Badge>
                      )}
                    </div>
                    {item.sku && (
                      <p className="text-xs text-muted-foreground font-mono">
                        Réf: {item.sku}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-6 pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total HT</span>
                  <span>{formatPrice(order.subtotalHT)}</span>
                </div>
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remise ({order.discountPercent}%)</span>
                    <span className="text-red-600">-{formatPrice(order.discountAmount)}</span>
                  </div>
                )}
                {Number(order.shippingHT) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Frais de livraison HT</span>
                    <span>{formatPrice(order.shippingHT)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base md:text-lg font-bold">
                  <span>Total HT</span>
                  <span className="text-primary">{formatPrice(order.totalHT)}</span>
                </div>
                {Number(order.depositAmount || 0) > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-emerald-700 bg-emerald-50 p-2 rounded">
                      <span className="font-medium">Acompte</span>
                      <span className="font-semibold">{formatPrice(order.depositAmount)} HT</span>
                    </div>
                    <div className="flex justify-between text-sm text-amber-700 bg-amber-50 p-2 rounded">
                      <span className="font-medium">Solde restant</span>
                      <span className="font-semibold">{formatPrice(Number(order.totalHT || 0) - Number(order.depositAmount || 0))} HT</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment & Delivery Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Payment Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Euro className="w-5 h-5" />
                  Paiement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Number(order.depositAmount) > 0 && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Acompte ({order.depositPercent}%)</p>
                        <p className="text-lg font-bold">{formatPrice(order.depositAmount)}</p>
                      </div>
                      <Badge className={order.depositPaid
                        ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border-green-300"
                        : "bg-amber-500/15 text-amber-800 dark:text-amber-400 border-yellow-300"
                      }>
                        {order.depositPaid ? "Payé" : "En attente"}
                      </Badge>
                    </div>
                    {order.depositPaidAt && (
                      <p className="text-xs text-muted-foreground">
                        Payé le {formatDate(order.depositPaidAt)}
                      </p>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Solde restant</p>
                        <p className="text-lg font-bold">{formatPrice(order.balanceAmount)}</p>
                      </div>
                      <Badge className={order.balancePaid
                        ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border-green-300"
                        : "bg-amber-500/15 text-amber-800 dark:text-amber-400 border-yellow-300"
                      }>
                        {order.balancePaid ? "Payé" : "À régler"}
                      </Badge>
                    </div>
                    {order.balancePaidAt && (
                      <p className="text-xs text-muted-foreground">
                        Payé le {formatDate(order.balancePaidAt)}
                      </p>
                    )}
                  </div>
                )}
                {order.paymentMethod && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground">
                      Mode de paiement : <span className="font-medium text-foreground">{order.paymentMethod === "transfer" ? "Virement bancaire" : order.paymentMethod === "card" ? "Carte bancaire" : order.paymentMethod}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="w-5 h-5" />
                  Adresse de livraison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.deliveryContactName && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <p className="font-medium text-sm">{order.deliveryContactName}</p>
                  </div>
                )}
                <div className="text-sm text-muted-foreground pl-6 space-y-0.5">
                  {order.deliveryStreet && <p>{order.deliveryStreet}</p>}
                  {order.deliveryStreet2 && <p>{order.deliveryStreet2}</p>}
                  <p>{order.deliveryPostalCode} {order.deliveryCity}</p>
                  <p>{order.deliveryCountry || "Belgique"}</p>
                </div>
                {order.deliveryContactPhone && (
                  <div className="flex items-center gap-2 pt-1">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm">{order.deliveryContactPhone}</p>
                  </div>
                )}
                {order.deliveryInstructions && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Instructions de livraison</p>
                    <p className="text-sm">{order.deliveryInstructions}</p>
                  </div>
                )}
                {order.deliveryRequestedWeek && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Semaine souhaitée : <span className="font-medium text-foreground">{order.deliveryRequestedWeek}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Billing Address */}
            {(order as any).partner && (() => {
              const p = (order as any).partner;
              const isSame = p?.billingAddressSame;
              const street = isSame ? p?.addressStreet : p?.billingStreet;
              const street2 = isSame ? p?.addressStreet2 : p?.billingStreet2;
              const city = isSame ? p?.addressCity : p?.billingCity;
              const postal = isSame ? p?.addressPostalCode : p?.billingPostalCode;
              const country = isSame ? p?.addressCountry : p?.billingCountry;
              return (street || city) ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="w-5 h-5" />
                      Adresse de facturation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="font-medium text-sm">{p.companyName}</p>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      {street && <p>{street}</p>}
                      {street2 && <p>{street2}</p>}
                      {(postal || city) && <p>{postal} {city}</p>}
                      {country && <p>{country}</p>}
                      {p.vatNumber && (
                        <p className="pt-1">TVA: {p.vatNumber}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })()}
          </div>

          {/* Notes */}
          {order.customerNotes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.customerNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pb-8">
            <Button onClick={handleDownloadPdf} className="gap-2 flex-1 sm:flex-none">
              <Download className="w-4 h-4" />
              Télécharger le récapitulatif PDF
            </Button>
            <Link href={`/order/${orderId}`} className="flex-1 sm:flex-none">
              <Button variant="outline" className="gap-2 w-full">
                <Truck className="w-4 h-4" />
                Voir le suivi de commande
              </Button>
            </Link>
            <Link href="/orders" className="flex-1 sm:flex-none">
              <Button variant="ghost" className="gap-2 w-full">
                <ArrowLeft className="w-4 h-4" />
                Retour aux commandes
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
