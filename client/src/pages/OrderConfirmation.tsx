import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  Package,
  Truck,
  CreditCard,
  FileText,
  ArrowLeft,
  Printer,
  Home,
} from "lucide-react";

export default function OrderConfirmation() {
  const params = useParams<{ id: string }>();
  const orderId = parseInt(params.id || "0");

  const { data: order, isLoading } = trpc.orders.getWithItems.useQuery(
    { id: orderId },
    { enabled: orderId > 0 }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground dark:text-muted-foreground">Commande non trouvée</p>
            <Link href="/dashboard">
              <Button className="mt-4">Retour au tableau de bord</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "Brouillon", color: "bg-muted dark:bg-muted/50 text-gray-800" },
    PENDING_APPROVAL: { label: "En attente de validation", color: "bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-400" },
    PENDING_DEPOSIT: { label: "En attente d'acompte", color: "bg-orange-500/15 dark:bg-orange-500/25 text-orange-800 dark:text-orange-400" },
    PAYMENT_PENDING: { label: "Paiement en cours", color: "bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-400" },
    DEPOSIT_PAID: { label: "Acompte payé", color: "bg-info/15 dark:bg-info-light text-info dark:text-info-dark" },
    PAYMENT_FAILED: { label: "Paiement échoué", color: "bg-destructive/15 dark:bg-destructive/25 text-destructive" },
    IN_PRODUCTION: { label: "En production", color: "bg-purple-500/15 dark:bg-purple-500/25 text-purple-800 dark:text-purple-400" },
    READY_TO_SHIP: { label: "Prêt à expédier", color: "bg-indigo-500/15 dark:bg-indigo-500/25 text-indigo-800" },
    SHIPPED: { label: "Expédié", color: "bg-cyan-500/15 dark:bg-cyan-500/25 text-cyan-800" },
    DELIVERED: { label: "Livré", color: "bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400" },
    COMPLETED: { label: "Terminé", color: "bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400" },
    CANCELLED: { label: "Annulé", color: "bg-destructive/15 dark:bg-destructive/25 text-destructive dark:text-destructive" },
    REFUSED: { label: "Refusé", color: "bg-destructive/15 dark:bg-destructive/25 text-destructive dark:text-destructive" },
  };

  const paymentMethodLabels: Record<string, string> = {
    bank_transfer: "Virement bancaire",
    payment_on_delivery: "Paiement à la livraison",
  };

  const status = statusLabels[order.status] || { label: order.status, color: "bg-muted dark:bg-muted/50" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-border dark:border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663031645455/jX4Ppf2KXZ8z9Tppipem7T/logo-market-spa_177731cb.png" alt="Market Spas" className="w-10 h-10 rounded-lg object-contain" />
              <div>
                <h1 className="text-xl text-display text-display font-bold text-gray-900">Market Spas</h1>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">Portail Partenaires B2B</p>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/orders">
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Mes commandes
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">
                <Home className="mr-2 h-4 w-4" />
                Tableau de bord
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Success Banner */}
        <div className="bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 dark:border-emerald-500/30 rounded-xl p-4 md:p-6 mb-8 flex items-center gap-4">
          <div className="w-16 h-16 bg-emerald-500/15 dark:bg-emerald-500/25 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl text-display text-display font-bold text-emerald-800 dark:text-emerald-400">
              Commande confirmée !
            </h2>
            <p className="text-emerald-700 dark:text-emerald-400 mt-1">
              Votre commande <strong>{order.orderNumber}</strong> a été enregistrée avec succès.
              Vous recevrez un email de confirmation sous peu.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-4 md:p-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary Card */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl text-display text-display">Commande {order.orderNumber}</CardTitle>
                    <CardDescription>
                      Passée le {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </CardDescription>
                  </div>
                  <Badge className={status.color}>{status.label}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead className="text-center">Quantité</TableHead>
                      <TableHead className="text-right">Prix unitaire HT</TableHead>
                      <TableHead className="text-right">Total HT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs md:text-sm text-muted-foreground dark:text-muted-foreground font-mono">{item.ean13 ? `EAN: ${item.ean13}` : (item.supplierProductCode || item.sku)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {parseFloat(item.unitPriceHT).toFixed(2)} €
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {parseFloat(item.totalHT).toFixed(2)} €
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Separator className="my-4" />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground dark:text-muted-foreground">Sous-total HT</span>
                    <span>{parseFloat(order.subtotalHT || "0").toFixed(2)} €</span>
                  </div>
                  {parseFloat(order.discountAmount || "0") > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                      <span>Remise partenaire ({order.discountPercent}%)</span>
                      <span>-{parseFloat(order.discountAmount || "0").toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground dark:text-muted-foreground">Total HT</span>
                    <span>{parseFloat(order.totalHT || "0").toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground dark:text-muted-foreground">TVA</span>
                    <span>{parseFloat(order.totalVAT || "0").toFixed(2)} €</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-semibold text-display">
                    <span>Total TTC</span>
                    <span className="text-info dark:text-info-dark">
                      {parseFloat(order.totalTTC || "0").toFixed(2)} €
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-info dark:text-info-dark" />
                  Adresse de livraison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 dark:bg-muted/30 rounded-lg p-4">
                  <p className="font-medium">{order.deliveryContactName}</p>
                  <p className="text-muted-foreground dark:text-muted-foreground">{order.deliveryStreet}</p>
                  {order.deliveryStreet2 && (
                    <p className="text-muted-foreground dark:text-muted-foreground">{order.deliveryStreet2}</p>
                  )}
                  <p className="text-muted-foreground dark:text-muted-foreground">
                    {order.deliveryPostalCode} {order.deliveryCity}
                  </p>
                  <p className="text-muted-foreground dark:text-muted-foreground">{order.deliveryCountry}</p>
                  {order.deliveryContactPhone && (
                    <p className="text-muted-foreground dark:text-muted-foreground mt-2">
                      Tél: {order.deliveryContactPhone}
                    </p>
                  )}
                  {order.deliveryInstructions && (
                    <div className="mt-3 pt-3 border-t border-border dark:border-border">
                      <p className="text-xs md:text-sm text-muted-foreground dark:text-muted-foreground">Instructions de livraison:</p>
                      <p className="text-foreground dark:text-foreground">{order.deliveryInstructions}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Instructions */}
          <div className="space-y-6">
            <Card className="border-info/20 dark:border-info/30 bg-info/10 dark:bg-info-light/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-info dark:text-info-dark" />
                  Paiement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground dark:text-muted-foreground">Mode de paiement</p>
                  <p className="font-medium">
                    {paymentMethodLabels[order.paymentMethod || ""] || order.paymentMethod || "Non spécifié"}
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="text-xs md:text-sm text-muted-foreground dark:text-muted-foreground">Acompte à verser (30%)</p>
                  <p className="text-2xl text-display text-display font-bold text-info dark:text-info-dark">
                    {parseFloat(order.depositAmount || "0").toFixed(2)} €
                  </p>
                </div>

                <div>
                  <p className="text-xs md:text-sm text-muted-foreground dark:text-muted-foreground">Solde restant</p>
                  <p className="text-lg font-medium">
                    {parseFloat(order.balanceAmount || "0").toFixed(2)} €
                  </p>
                </div>

                {order.paymentMethod === "bank_transfer" && (
                  <div className="bg-white rounded-lg p-4 border border-info/20 dark:border-info/30">
                    <p className="font-medium text-info dark:text-info-dark mb-2">
                      Coordonnées bancaires
                    </p>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground dark:text-muted-foreground">Bénéficiaire:</span> Market Spas SRL</p>
                      <p><span className="text-muted-foreground dark:text-muted-foreground">IBAN:</span> BE71 0000 0000 0000</p>
                      <p><span className="text-muted-foreground dark:text-muted-foreground">BIC:</span> GEBABEBB</p>
                      <p className="mt-2">
                        <span className="text-muted-foreground dark:text-muted-foreground">Communication:</span>
                        <br />
                        <span className="font-mono bg-muted dark:bg-muted/50 px-2 py-1 rounded">
                          {order.orderNumber}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {order.paymentMethod === "payment_on_delivery" && (
                  <div className="bg-white rounded-lg p-4 border border-info/20 dark:border-info/30">
                    <p className="text-xs md:text-sm text-muted-foreground dark:text-muted-foreground">
                      Le paiement sera effectué à la livraison. Veuillez prévoir le montant exact.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button className="w-full" variant="outline" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimer la commande
                </Button>
                <Link href="/catalog" className="block">
                  <Button className="w-full bg-info dark:bg-info-dark hover:bg-info hover:bg-info/90 dark:bg-info-dark dark:hover:bg-info-dark/90">
                    <Package className="mr-2 h-4 w-4" />
                    Continuer mes achats
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Customer Notes */}
            {order.customerNotes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground dark:text-muted-foreground text-sm">{order.customerNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
