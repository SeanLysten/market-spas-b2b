import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Package, MapPin, CreditCard, FileText, Calendar, TruckIcon, BadgePercent, Info, AlertTriangle, Building2, Clock, CheckCircle2, ShieldCheck, Phone } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// Build the list of selectable delivery dates
function buildDeliveryDateOptions(latestArrivalDate?: string | null): { value: string; label: string }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let startDate = new Date(today);
  if (latestArrivalDate) {
    const arrival = new Date(latestArrivalDate + "T12:00:00Z");
    arrival.setHours(0, 0, 0, 0);
    if (arrival > startDate) startDate = arrival;
  }

  const maxDays = 42; // 6 weeks
  const options: { value: string; label: string }[] = [];

  for (let i = 1; i <= maxDays; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    if (d.getDay() === 0) continue; // Skip Sundays
    const iso = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    options.push({ value: iso, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
}

export default function Checkout() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [deliveryRequestedDate, setDeliveryRequestedDate] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    city: "",
    postalCode: "",
    country: "BE",
    contactName: "",
    contactPhone: "",
    instructions: "",
  });

  const { data: cartData, refetch: refetchCart } = trpc.cart.get.useQuery(undefined, { refetchInterval: 30000 });
  const createOrderMutation = trpc.orders.create.useMutation();

  // Countdown timer for cart reservation
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);
  const cartReservedUntil = (cartData as any)?.cartReservedUntil;

  useEffect(() => {
    if (!cartReservedUntil) {
      setTimeLeft(null);
      setExpired(false);
      return;
    }
    const updateTimer = () => {
      const now = Date.now();
      const expiry = new Date(cartReservedUntil).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) setExpired(true);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [cartReservedUntil]);

  useEffect(() => {
    if (expired) {
      toast.error("Le temps de r\u00e9servation a expir\u00e9. Les produits ont \u00e9t\u00e9 remis en stock.");
      setTimeout(() => setLocation("/cart"), 3000);
    }
  }, [expired, setLocation]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Dynamic shipping cost lookup based on delivery address
  const shippingLookup = trpc.shippingZones.lookup.useQuery(
    { country: deliveryAddress.country, postalCode: deliveryAddress.postalCode },
    { enabled: deliveryAddress.country.length === 2 && deliveryAddress.postalCode.length >= 2 }
  );
  const dynamicShippingHT = shippingLookup.data?.shippingCostHT ?? null;
  const shippingZoneName = shippingLookup.data?.zoneName ?? null;
  const shippingSource = shippingLookup.data?.source ?? "default";

  const cartItems = cartData?.items || [];

  // Backend-calculated values
  const subtotalHT = cartData?.subtotalHT || 0;
  const discountPercent = cartData?.discountPercent || 0;
  const discountAmount = cartData?.discountAmount || 0;
  const shippingHT = (cartData as any)?.shippingHT || 0;
  const vatRate = (cartData as any)?.vatRate ?? 0;
  const vatLabel = (cartData as any)?.vatLabel || "TVA";
  const vatAmount = cartData?.vatAmount || 0;
  const totalTTC = cartData?.totalTTC || 0;
  const depositAmount = (cartData as any)?.depositAmount || 0;
  const balanceAmount = (cartData as any)?.balanceAmount || 0;
  const hasSpaItems = (cartData as any)?.hasSpaItems || false;
  const spaUnitCount = (cartData as any)?.spaUnitCount || 0;
  const latestArrivalDate = (cartData as any)?.latestArrivalDate || null;

  const deliveryDateOptions = useMemo(() => buildDeliveryDateOptions(latestArrivalDate), [latestArrivalDate]);

  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Validation before showing the confirmation modal
  const handleRequestConfirmation = () => {
    if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.postalCode) {
      toast.error("Veuillez remplir l'adresse de livraison compl\u00e8te");
      return;
    }
    if (!deliveryAddress.contactName || !deliveryAddress.contactPhone) {
      toast.error("Veuillez fournir un nom et t\u00e9l\u00e9phone de contact");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Votre panier est vide");
      return;
    }
    if (!deliveryRequestedDate) {
      toast.error("Veuillez choisir une date de livraison souhait\u00e9e");
      return;
    }
    // Show confirmation modal
    setShowConfirmation(true);
  };

  // Actual order submission (only called after confirmation)
  const handleSubmitOrder = async () => {
    setShowConfirmation(false);

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
        paymentMethod: "BANK_TRANSFER",
        shippingType: "standard" as const,
        customerNotes: deliveryAddress.instructions,
        deliveryRequestedDate,
      });

      // If Mollie checkout URL is available, redirect to it
      if ((result as any).mollieCheckoutUrl) {
        toast.success("Commande cr\u00e9\u00e9e ! Redirection vers la page de paiement...");
        window.open((result as any).mollieCheckoutUrl, "_blank");
        setLocation(`/order-confirmation/${result.orderId}`);
      } else {
        toast.success("Commande cr\u00e9\u00e9e avec succ\u00e8s !");
        setLocation(`/order-confirmation/${result.orderId}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la cr\u00e9ation de la commande");
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const mainContent = (
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
        {/* Reservation countdown banner */}
        {timeLeft !== null && timeLeft > 0 && !expired && (
          <Alert className={`mb-6 ${timeLeft <= 120 ? 'border-red-500/50 bg-red-50 dark:bg-red-950/30' : 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/30'}`}>
            <Clock className={`w-5 h-5 ${timeLeft <= 120 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
            <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className={`text-sm font-medium ${timeLeft <= 120 ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'}`}>
                Vos spas sont r\u00e9serv\u00e9s temporairement. Finalisez votre commande avant l'expiration.
              </span>
              <span className={`text-2xl font-mono font-bold tabular-nums ${timeLeft <= 120 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-amber-600 dark:text-amber-400'}`}>
                {formatTime(timeLeft)}
              </span>
            </AlertDescription>
          </Alert>
        )}
        {expired && (
          <Alert className="mb-6 border-red-500/50 bg-red-50 dark:bg-red-950/30">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-sm font-medium text-red-800 dark:text-red-300">
              Le temps de r\u00e9servation a expir\u00e9. Vous allez \u00eatre redirig\u00e9 vers votre panier...
            </AlertDescription>
          </Alert>
        )}
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
                <CardDescription>Indiquez l'adresse de livraison pour cette commande</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="street">Adresse *</Label>
                    <Input
                      id="street"
                      placeholder="Numéro et nom de rue"
                      value={deliveryAddress.street}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Code postal *</Label>
                    <Input
                      id="postalCode"
                      placeholder="1000"
                      value={deliveryAddress.postalCode}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, postalCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville *</Label>
                    <Input
                      id="city"
                      placeholder="Bruxelles"
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Pays *</Label>
                    <Select value={deliveryAddress.country} onValueChange={(v) => setDeliveryAddress({ ...deliveryAddress, country: v })}>
                      <SelectTrigger id="country">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BE">Belgique</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="LU">Luxembourg</SelectItem>
                        <SelectItem value="NL">Pays-Bas</SelectItem>
                        <SelectItem value="DE">Allemagne</SelectItem>
                        <SelectItem value="CH">Suisse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Nom du contact *</Label>
                    <Input
                      id="contactName"
                      placeholder="Jean Dupont"
                      value={deliveryAddress.contactName}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, contactName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Téléphone *</Label>
                    <Input
                      id="contactPhone"
                      placeholder="+32 xxx xx xx xx"
                      value={deliveryAddress.contactPhone}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, contactPhone: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="instructions">Instructions de livraison</Label>
                    <Textarea
                      id="instructions"
                      placeholder="Instructions particulières pour la livraison..."
                      value={deliveryAddress.instructions}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, instructions: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Cost - Auto-calculated */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TruckIcon className="w-5 h-5 text-primary" />
                  <CardTitle>Frais de livraison</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between border rounded-lg p-4 border-primary bg-primary/5">
                  <div className="flex items-center gap-3">
                    <TruckIcon className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <div className="font-medium">Livraison</div>
                      {shippingLookup.isLoading ? (
                        <div className="text-sm text-muted-foreground">Calcul en cours...</div>
                      ) : dynamicShippingHT !== null ? (
                        <div className="text-sm text-muted-foreground">
                          {shippingZoneName ? (
                            <span>Zone : {shippingZoneName}</span>
                          ) : shippingSource === "default" ? (
                            <span>Tarif standard</span>
                          ) : (
                            <span>Tarif zone</span>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Renseignez le pays et code postal pour calculer les frais
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {shippingLookup.isLoading ? (
                      <div className="text-sm text-muted-foreground">...</div>
                    ) : dynamicShippingHT !== null ? (
                      <div className="font-bold text-primary text-lg">{formatPrice(dynamicShippingHT)} € HT</div>
                    ) : (
                      <div className="font-bold text-primary text-lg">{formatPrice(shippingHT)} € HT</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method - SEPA Bank Transfer via Mollie */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <CardTitle>Mode de paiement</CardTitle>
                </div>
                <CardDescription>
                  Paiement par virement bancaire SEPA via Mollie
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 border rounded-lg p-4 border-primary bg-primary/5">
                  <CreditCard className="w-6 h-6 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">Virement bancaire SEPA</div>
                    <div className="text-sm text-muted-foreground">
                      Vous recevrez les coordonnées bancaires pour effectuer le virement. Le paiement sera validé automatiquement à réception des fonds.
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary text-lg">{formatPrice(depositAmount)} €</div>
                    <div className="text-xs text-muted-foreground">
                      {hasSpaItems ? "Acompte TTC" : "Total TTC"}
                    </div>
                  </div>
                </div>

                {/* Deposit info for spa orders */}
                {hasSpaItems && (
                  <div className="space-y-3">
                    <div className="flex gap-3 p-4 rounded-lg border bg-blue-500/5 border-blue-500/20 text-blue-800 dark:text-blue-300">
                      <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div className="text-sm space-y-1">
                        <div className="font-semibold">Acompte de {formatPrice(depositAmount)} € ({spaUnitCount} spa{spaUnitCount > 1 ? "s" : ""} x 300 €)</div>
                        <div>
                          Un acompte fixe de <strong>300 € par spa</strong> est demandé pour confirmer votre commande.
                          Le solde restant de <strong>{formatPrice(balanceAmount)} €</strong> sera facturé ultérieurement via votre fournisseur.
                        </div>
                      </div>
                    </div>

                    {/* WARNING: Deposit loss if balance not paid within 14 days */}
                    <div className="flex gap-3 p-4 rounded-lg border bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div className="text-sm space-y-1">
                        <div className="font-semibold">Conditions de l'acompte</div>
                        <div>
                          L'acompte sera <strong>définitivement perdu</strong> si l'intégralité du solde restant ({formatPrice(balanceAmount)} €) n'est pas réglée dans les <strong>14 jours</strong> suivant la réception de l'acompte par nos services.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full payment info for non-spa orders */}
                {!hasSpaItems && (
                  <div className="flex gap-3 p-4 rounded-lg border bg-emerald-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-semibold">Paiement intégral requis</div>
                      <div>
                        Pour les commandes d'accessoires et produits d'entretien, le paiement intégral est requis pour valider la commande.
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Date Selection */}
            <Card className="border-primary/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <CardTitle>Date de livraison souhaitée *</CardTitle>
                </div>
                <CardDescription>
                  Choisissez une date dans les 6 prochaines semaines.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {latestArrivalDate && (
                  <div className="flex gap-3 p-3 rounded-lg border text-sm bg-blue-500/5 border-blue-500/20 text-blue-800 dark:text-blue-300">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      Votre commande contient un spa en arrivage estimé le{" "}
                      <strong>{new Date(latestArrivalDate + "T12:00:00Z").toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</strong>.
                      La plage de livraison commence à partir de cette date.
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">Choisissez votre date *</Label>
                  <Select value={deliveryRequestedDate} onValueChange={setDeliveryRequestedDate}>
                    <SelectTrigger id="deliveryDate" className={!deliveryRequestedDate ? "border-primary/50" : ""}>
                      <SelectValue placeholder="Sélectionner une date de livraison" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {deliveryDateOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!deliveryRequestedDate && (
                    <p className="text-xs text-muted-foreground">Ce champ est obligatoire pour valider la commande.</p>
                  )}
                  {deliveryRequestedDate && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Date souhaitée : {new Date(deliveryRequestedDate + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
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
                            <span className="ml-2 text-orange-600 dark:text-orange-400">Pré-commande</span>
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
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                      <span className="flex items-center gap-1">
                        <BadgePercent className="w-3.5 h-3.5" />
                        Remise partenaire ({discountPercent.toFixed(1)}%)
                      </span>
                      <span>-{formatPrice(discountAmount)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TruckIcon className="w-3.5 h-3.5" />
                      Livraison
                    </span>
                    <span>{formatPrice(dynamicShippingHT ?? shippingHT)} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{vatLabel} ({vatRate}%)</span>
                    <span>{formatPrice(vatAmount)} €</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-semibold text-display">
                    <span>Total TTC</span>
                    <span className="text-primary">{formatPrice(totalTTC)} €</span>
                  </div>
                </div>

                {/* Deposit / Payment Amount */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-sm">
                        {hasSpaItems ? "Acompte à régler" : "Montant à régler"}
                      </div>
                      {hasSpaItems && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {spaUnitCount} spa{spaUnitCount > 1 ? "s" : ""} x 300 € = {formatPrice(depositAmount)} €
                        </div>
                      )}
                    </div>
                    <div className="text-xl font-bold text-primary">{formatPrice(depositAmount)} €</div>
                  </div>
                  {hasSpaItems && balanceAmount > 0 && (
                    <div className="mt-2 pt-2 border-t border-primary/10 flex justify-between text-sm text-muted-foreground">
                      <span>Solde restant</span>
                      <span>{formatPrice(balanceAmount)} €</span>
                    </div>
                  )}
                </div>

                {discountPercent > 0 && (
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      <BadgePercent className="w-4 h-4 inline mr-1" />
                      Remise partenaire de {discountPercent.toFixed(1)}% appliquée automatiquement.
                    </p>
                  </div>
                )}

                {/* Delivery date recap */}
                {deliveryRequestedDate && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                      <div>
                        <span className="font-medium text-primary">Livraison souhaitée :</span>
                        <br />
                        <span className="text-muted-foreground text-xs">
                          {new Date(deliveryRequestedDate + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Info Box */}
                <div className="bg-info/10 dark:bg-blue-950/20 border border-info/20 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex gap-2">
                    <Building2 className="w-5 h-5 text-info dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-100">
                      <div className="font-medium mb-1">Paiement par virement SEPA</div>
                      <div className="text-blue-700 dark:text-blue-300">
                        Après validation, vous serez redirigé vers la page de paiement Mollie pour effectuer votre virement bancaire.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button - Opens confirmation modal */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleRequestConfirmation}
                  disabled={createOrderMutation.isPending || cartItems.length === 0 || !deliveryRequestedDate || expired}
                >
                  {createOrderMutation.isPending ? "Traitement..." : `V\u00e9rifier et confirmer la commande`}
                </Button>
                {!deliveryRequestedDate && (
                  <p className="text-xs text-center text-amber-600 dark:text-amber-400">
                    Choisissez une date de livraison pour continuer
                  </p>
                )}
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

  // ========================================
  // CONFIRMATION MODAL (Double s\u00e9curit\u00e9)
  // ========================================
  const confirmationModal = (
    <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Confirmation de commande
          </DialogTitle>
          <DialogDescription>
            V\u00e9rifiez attentivement le r\u00e9capitulatif avant de valider votre commande.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh] pr-4">
          <div className="space-y-4">
            {/* Articles */}
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-primary" />
                Articles ({cartItems.length})
              </h4>
              <div className="space-y-2">
                {cartItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded-md bg-muted/50 text-sm">
                    <div className="flex-1">
                      <span className="font-medium">{item.product?.name || "Produit"}</span>
                      <span className="text-muted-foreground ml-1">x{item.quantity}</span>
                      {item.isPreorder && (
                        <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">(Pr\u00e9-commande)</span>
                      )}
                    </div>
                    <span className="font-medium">
                      {formatPrice(Number(item.product?.pricePartnerHT || item.product?.pricePublicHT || 0) * item.quantity)} \u20ac
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Adresse de livraison */}
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                Adresse de livraison
              </h4>
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md space-y-0.5">
                <p className="font-medium text-foreground">{deliveryAddress.contactName}</p>
                <p>{deliveryAddress.street}</p>
                <p>{deliveryAddress.postalCode} {deliveryAddress.city}</p>
                <p>{deliveryAddress.country === "BE" ? "Belgique" : deliveryAddress.country === "FR" ? "France" : deliveryAddress.country}</p>
                <p className="flex items-center gap-1 pt-1">
                  <Phone className="w-3 h-3" /> {deliveryAddress.contactPhone}
                </p>
              </div>
            </div>

            {/* Date de livraison */}
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                Date de livraison souhait\u00e9e
              </h4>
              <p className="text-sm bg-muted/50 p-3 rounded-md">
                {deliveryRequestedDate
                  ? new Date(deliveryRequestedDate + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
                  : "Non s\u00e9lectionn\u00e9e"}
              </p>
            </div>

            <Separator />

            {/* R\u00e9capitulatif financier */}
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-primary" />
                R\u00e9capitulatif financier
              </h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total HT</span>
                  <span>{formatPrice(subtotalHT)} \u20ac</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Remise partenaire ({discountPercent.toFixed(1)}%)</span>
                    <span>-{formatPrice(discountAmount)} \u20ac</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livraison HT</span>
                  <span>{formatPrice(dynamicShippingHT ?? shippingHT)} \u20ac</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{vatLabel} ({vatRate}%)</span>
                  <span>{formatPrice(vatAmount)} \u20ac</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total TTC</span>
                  <span className="text-primary">{formatPrice(totalTTC)} \u20ac</span>
                </div>
              </div>
            </div>

            {/* Montant \u00e0 payer maintenant */}
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm">
                    {hasSpaItems ? "Acompte \u00e0 r\u00e9gler maintenant" : "Montant \u00e0 r\u00e9gler"}
                  </p>
                  {hasSpaItems && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {spaUnitCount} spa{spaUnitCount > 1 ? "s" : ""} x 300 \u20ac
                    </p>
                  )}
                </div>
                <span className="text-xl font-bold text-primary">{formatPrice(depositAmount)} \u20ac</span>
              </div>
              {hasSpaItems && balanceAmount > 0 && (
                <div className="mt-2 pt-2 border-t border-primary/20 flex justify-between text-sm text-muted-foreground">
                  <span>Solde restant (\u00e0 r\u00e9gler \u00e0 la livraison)</span>
                  <span>{formatPrice(balanceAmount)} \u20ac</span>
                </div>
              )}
            </div>

            {/* Mode de paiement */}
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <Building2 className="w-4 h-4 flex-shrink-0" />
                Paiement par virement SEPA via Mollie
              </p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => setShowConfirmation(false)}
            className="w-full sm:w-auto"
          >
            Modifier ma commande
          </Button>
          <Button
            onClick={handleSubmitOrder}
            disabled={createOrderMutation.isPending}
            className="w-full sm:w-auto gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {createOrderMutation.isPending ? "Traitement..." : `Confirmer et payer ${formatPrice(depositAmount)} \u20ac`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      {confirmationModal}
      {mainContent}
    </>
  );
}
