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
            <p className="text-gray-600">Commande non trouvée</p>
            <Link href="/dashboard">
              <Button className="mt-4">Retour au tableau de bord</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "Brouillon", color: "bg-gray-100 text-gray-800" },
    PENDING_APPROVAL: { label: "En attente de validation", color: "bg-yellow-100 text-yellow-800" },
    PENDING_DEPOSIT: { label: "En attente d'acompte", color: "bg-orange-100 text-orange-800" },
    DEPOSIT_PAID: { label: "Acompte payé", color: "bg-blue-100 text-blue-800" },
    IN_PRODUCTION: { label: "En production", color: "bg-purple-100 text-purple-800" },
    READY_TO_SHIP: { label: "Prêt à expédier", color: "bg-indigo-100 text-indigo-800" },
    SHIPPED: { label: "Expédié", color: "bg-cyan-100 text-cyan-800" },
    DELIVERED: { label: "Livré", color: "bg-green-100 text-green-800" },
    COMPLETED: { label: "Terminé", color: "bg-green-100 text-green-800" },
    CANCELLED: { label: "Annulé", color: "bg-red-100 text-red-800" },
  };

  const paymentMethodLabels: Record<string, string> = {
    bank_transfer: "Virement bancaire",
    payment_on_delivery: "Paiement à la livraison",
  };

  const status = statusLabels[order.status] || { label: order.status, color: "bg-gray-100" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Market Spas</h1>
                <p className="text-xs text-gray-500">Portail Partenaires B2B</p>
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
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 flex items-center gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-green-800">
              Commande confirmée !
            </h2>
            <p className="text-green-700 mt-1">
              Votre commande <strong>{order.orderNumber}</strong> a été enregistrée avec succès.
              Vous recevrez un email de confirmation sous peu.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Commande {order.orderNumber}</CardTitle>
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
                            <p className="text-sm text-gray-500">SKU: {item.sku}</p>
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
                    <span className="text-gray-600">Sous-total HT</span>
                    <span>{parseFloat(order.subtotalHT || "0").toFixed(2)} €</span>
                  </div>
                  {parseFloat(order.discountAmount || "0") > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Remise partenaire ({order.discountPercent}%)</span>
                      <span>-{parseFloat(order.discountAmount || "0").toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total HT</span>
                    <span>{parseFloat(order.totalHT || "0").toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">TVA</span>
                    <span>{parseFloat(order.totalVAT || "0").toFixed(2)} €</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total TTC</span>
                    <span className="text-blue-600">
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
                  <Truck className="h-5 w-5 text-blue-600" />
                  Adresse de livraison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium">{order.deliveryContactName}</p>
                  <p className="text-gray-600">{order.deliveryStreet}</p>
                  {order.deliveryStreet2 && (
                    <p className="text-gray-600">{order.deliveryStreet2}</p>
                  )}
                  <p className="text-gray-600">
                    {order.deliveryPostalCode} {order.deliveryCity}
                  </p>
                  <p className="text-gray-600">{order.deliveryCountry}</p>
                  {order.deliveryContactPhone && (
                    <p className="text-gray-600 mt-2">
                      Tél: {order.deliveryContactPhone}
                    </p>
                  )}
                  {order.deliveryInstructions && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-500">Instructions de livraison:</p>
                      <p className="text-gray-700">{order.deliveryInstructions}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Instructions */}
          <div className="space-y-6">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Paiement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Mode de paiement</p>
                  <p className="font-medium">
                    {paymentMethodLabels[order.paymentMethod || ""] || order.paymentMethod || "Non spécifié"}
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-gray-600">Acompte à verser (30%)</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {parseFloat(order.depositAmount || "0").toFixed(2)} €
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Solde restant</p>
                  <p className="text-lg font-medium">
                    {parseFloat(order.balanceAmount || "0").toFixed(2)} €
                  </p>
                </div>

                {order.paymentMethod === "bank_transfer" && (
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <p className="font-medium text-blue-800 mb-2">
                      Coordonnées bancaires
                    </p>
                    <div className="text-sm space-y-1">
                      <p><span className="text-gray-500">Bénéficiaire:</span> Market Spas SRL</p>
                      <p><span className="text-gray-500">IBAN:</span> BE71 0000 0000 0000</p>
                      <p><span className="text-gray-500">BIC:</span> GEBABEBB</p>
                      <p className="mt-2">
                        <span className="text-gray-500">Communication:</span>
                        <br />
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {order.orderNumber}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {order.paymentMethod === "payment_on_delivery" && (
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-gray-600">
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
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
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
                  <p className="text-gray-600 text-sm">{order.customerNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
