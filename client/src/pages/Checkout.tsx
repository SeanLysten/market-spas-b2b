import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Package, MapPin, CreditCard, FileText, Calendar, TruckIcon, BadgePercent, Gift, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Checkout() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [paymentMethod, setPaymentMethod] = useState<string>("CARD_FULL");
  const [shippingType, setShippingType] = useState<"standard" | "express">("standard");
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    city: "",
    postalCode: "",
    country: "BE",
    contactName: "",
    contactPhone: "",
    instructions: "",
  });

  const { data: cartData } = trpc.cart.get.useQuery();
  const createOrderMutation = trpc.orders.create.useMutation();

  const cartItems = cartData?.items || [];

  // Use the backend-calculated values from cart
  const subtotalHT = cartData?.subtotalHT || 0;
  const discountPercent = cartData?.discountPercent || 0;
  const discountAmount = cartData?.discountAmount || 0;
  const partnerLevel = (cartData as any)?.partnerLevel || "";
  const isFreeShipping = (cartData as any)?.isFreeShipping || false;
  const shippingHT = (cartData as any)?.shippingHT || 0;
  const vatAmount = cartData?.vatAmount || 0;
  const totalTTC = cartData?.totalTTC || 0;

  const handleSubmitOrder = async () => {
    if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.postalCode) {
      toast.error("Veuillez remplir l'adresse de livraison complète");
      return;
    }

    if (!deliveryAddress.contactName || !deliveryAddress.contactPhone) {
      toast.error("Veuillez fournir un nom et téléphone de contact");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Votre panier est vide");
      return;
    }

    try {
      const result = await createOrderMutation.mutateAsync({
        items: cartItems.map(item => ({
          productId: item.productId,
          variantId: (item as any).variantId,
          quantity: item.quantity,
          isPreorder: (item as any).isPreorder || false,
        })),
        deliveryAddress: {
          street: deliveryAddress.street,
          city: deliveryAddress.city,
          postalCode: deliveryAddress.postalCode,
          country: deliveryAddress.country,
          contactName: deliveryAddress.contactName,
          contactPhone: deliveryAddress.contactPhone,
          instructions: deliveryAddress.instructions,
        },
        paymentMethod,
        shippingType,
        customerNotes: deliveryAddress.instructions,
      });

      toast.success("Commande créée avec succès !");
      setLocation(`/order-confirmation/${result.orderId}`);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création de la commande");
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <Link href="/cart">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour au panier
                </Button>
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl text-display font-bold">Finaliser la commande</h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Vérifiez vos informations et validez votre commande
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-3 md:p-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <CardTitle>Adresse de livraison</CardTitle>
                </div>
                <CardDescription>
                  Où souhaitez-vous recevoir votre commande ?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="street">Adresse *</Label>
                    <Input
                      id="street"
                      value={deliveryAddress.street}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                      placeholder="Rue de la Paix, 123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville *</Label>
                    <Input
                      id="city"
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                      placeholder="Bruxelles"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Code postal *</Label>
                    <Input
                      id="postalCode"
                      value={deliveryAddress.postalCode}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, postalCode: e.target.value })}
                      placeholder="1000"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="country">Pays</Label>
                    <Select
                      value={deliveryAddress.country}
                      onValueChange={(value) => setDeliveryAddress({ ...deliveryAddress, country: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BE">Belgique</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="LU">Luxembourg</SelectItem>
                        <SelectItem value="NL">Pays-Bas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Nom du contact *</Label>
                    <Input
                      id="contactName"
                      value={deliveryAddress.contactName}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, contactName: e.target.value })}
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Téléphone *</Label>
                    <Input
                      id="contactPhone"
                      value={deliveryAddress.contactPhone}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, contactPhone: e.target.value })}
                      placeholder="+32 2 123 45 67"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions">Instructions de livraison</Label>
                  <Textarea
                    id="instructions"
                    value={deliveryAddress.instructions}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, instructions: e.target.value })}
                    placeholder="Code d'accès, étage, horaires préférés..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shipping Type */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TruckIcon className="w-5 h-5 text-primary" />
                  <CardTitle>Mode de livraison</CardTitle>
                </div>
                <CardDescription>
                  Choisissez votre mode de livraison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={shippingType} onValueChange={(v) => setShippingType(v as "standard" | "express")}>
                  <div className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors ${shippingType === 'standard' ? 'border-primary bg-primary/5' : ''}`}>
                    <RadioGroupItem value="standard" id="shipping-standard" />
                    <Label htmlFor="shipping-standard" className="flex-1 cursor-pointer">
                      <div className="font-medium flex items-center gap-2">
                        <TruckIcon className="w-4 h-4" />
                        Livraison standard
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Délai estimé : 10-14 jours ouvrés
                      </div>
                    </Label>
                    <div className="text-right">
                      {isFreeShipping ? (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                          <Gift className="w-4 h-4" />
                          Gratuite
                        </div>
                      ) : (
                        <div className="font-bold text-primary">{formatPrice(shippingHT)} € HT</div>
                      )}
                    </div>
                  </div>

                  <div className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors ${shippingType === 'express' ? 'border-primary bg-primary/5' : ''}`}>
                    <RadioGroupItem value="express" id="shipping-express" />
                    <Label htmlFor="shipping-express" className="flex-1 cursor-pointer">
                      <div className="font-medium flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Livraison express
                        <span className="text-xs bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">Rapide</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Délai estimé : 3-5 jours ouvrés
                      </div>
                    </Label>
                    <div className="text-right">
                      {/* Express shipping is never free */}
                      <div className="font-bold text-primary">{formatPrice(shippingHT > 0 ? shippingHT * 2 : 300)} € HT</div>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <CardTitle>Mode de paiement</CardTitle>
                </div>
                <CardDescription>
                  Choisissez votre mode de paiement préféré
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors ${paymentMethod === 'CARD_FULL' ? 'border-primary bg-primary/5' : ''}`}>
                    <RadioGroupItem value="CARD_FULL" id="card-full" />
                    <Label htmlFor="card-full" className="flex-1 cursor-pointer">
                      <div className="font-medium flex items-center gap-2">
                        Paiement par carte (100%)
                        <span className="text-xs bg-emerald-600 dark:bg-emerald-500 text-white px-2 py-0.5 rounded">Recommandé</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Payez la totalité de votre commande maintenant par carte bancaire
                      </div>
                    </Label>
                    <div className="text-right">
                      <div className="font-bold text-primary">{formatPrice(totalTTC)} €</div>
                      <div className="text-xs text-muted-foreground">TTC</div>
                    </div>
                  </div>

                  <div className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors ${paymentMethod === 'CARD_DEPOSIT' ? 'border-primary bg-primary/5' : ''}`}>
                    <RadioGroupItem value="CARD_DEPOSIT" id="card-deposit" />
                    <Label htmlFor="card-deposit" className="flex-1 cursor-pointer">
                      <div className="font-medium">Paiement par carte (acompte 30%)</div>
                      <div className="text-sm text-muted-foreground">
                        Payez un acompte de 30% maintenant, le solde à la livraison
                      </div>
                    </Label>
                    <div className="text-right">
                      <div className="font-bold text-primary">{formatPrice(totalTTC * 0.3)} €</div>
                      <div className="text-xs text-muted-foreground">Acompte TTC</div>
                    </div>
                  </div>

                  <div className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors ${paymentMethod === 'BANK_TRANSFER' ? 'border-primary bg-primary/5' : ''}`}>
                    <RadioGroupItem value="BANK_TRANSFER" id="bank-transfer" />
                    <Label htmlFor="bank-transfer" className="flex-1 cursor-pointer">
                      <div className="font-medium">Virement bancaire</div>
                      <div className="text-sm text-muted-foreground">
                        Vous recevrez les coordonnées bancaires par email
                      </div>
                    </Label>
                    <div className="text-right">
                      <div className="font-bold text-primary">{formatPrice(totalTTC)} €</div>
                      <div className="text-xs text-muted-foreground">TTC</div>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <CardTitle>Récapitulatif</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={`${item.productId}-${(item as any).variantId || 'no-variant'}`} className="flex gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {item.product.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Quantité: {item.quantity}
                          {(item as any).isPreorder && (
                            <span className="ml-2 text-orange-600 dark:text-orange-400">• Pré-commande</span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {formatPrice(Number(item.product.pricePartnerHT || item.product.pricePublicHT || 0) * item.quantity)} €
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total HT</span>
                    <span>{formatPrice(subtotalHT)} €</span>
                  </div>

                  {/* Partner Discount */}
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                      <span className="flex items-center gap-1">
                        <BadgePercent className="w-3.5 h-3.5" />
                        Remise {partnerLevel} ({discountPercent}%)
                      </span>
                      <span>-{formatPrice(discountAmount)} €</span>
                    </div>
                  )}

                  {/* Shipping */}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TruckIcon className="w-3.5 h-3.5" />
                      Livraison {shippingType === "express" ? "express" : "standard"}
                    </span>
                    {isFreeShipping && shippingType === "standard" ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Gratuite</span>
                    ) : (
                      <span>{formatPrice(shippingType === "express" ? (shippingHT > 0 ? shippingHT * 2 : 300) : shippingHT)} €</span>
                    )}
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">TVA</span>
                    <span>{formatPrice(vatAmount)} €</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-semibold text-display">
                    <span>Total TTC</span>
                    <span className="text-primary">{formatPrice(totalTTC)} €</span>
                  </div>
                </div>

                {/* Partner Level Info */}
                {discountPercent > 0 && (
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      <BadgePercent className="w-4 h-4 inline mr-1" />
                      Remise <strong>{partnerLevel}</strong> de {discountPercent}% appliquée automatiquement.
                    </p>
                  </div>
                )}

                <Separator />

                {/* Info Box */}
                <div className="bg-info/10 dark:bg-blue-950/20 border border-info/20 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex gap-2">
                    <Calendar className="w-5 h-5 text-info dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-100">
                      <div className="font-medium mb-1">Après validation</div>
                      <div className="text-blue-700 dark:text-blue-300">
                        Vous recevrez un devis détaillé par email. La commande sera traitée après confirmation du paiement.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmitOrder}
                  disabled={createOrderMutation.isPending || cartItems.length === 0}
                >
                  {createOrderMutation.isPending ? "Traitement..." : "Valider la commande"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  En validant, vous acceptez nos conditions générales de vente
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
