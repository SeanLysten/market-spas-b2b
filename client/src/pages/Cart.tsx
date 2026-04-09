import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Minus, Plus, ShoppingCart, Trash2, ArrowRight, TruckIcon, Package, BadgePercent, Clock, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Cart() {
  const { user } = useAuth();
  const { data: cart, isLoading, refetch } = trpc.cart.get.useQuery(undefined, { refetchInterval: 30000 });
  const updateQuantityMutation = trpc.cart.updateQuantity.useMutation();
  const removeItemMutation = trpc.cart.removeItem.useMutation();
  const clearCartMutation = trpc.cart.clear.useMutation();

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-4 bg-muted rounded w-32" />
          <div className="space-y-3 mt-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Countdown timer for cart reservation
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);

  const cartReservedUntil = (cart as any)?.cartReservedUntil;

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

      if (remaining <= 0) {
        setExpired(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [cartReservedUntil]);

  // When timer expires, show message and refetch cart (items will be removed by cron)
  useEffect(() => {
    if (expired) {
      toast.error("Le temps de réservation de votre panier a expiré. Les produits ont été remis en stock.");
      // Refetch after a short delay to let the cron job clean up
      const timeout = setTimeout(() => refetch(), 3000);
      return () => clearTimeout(timeout);
    }
  }, [expired, refetch]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleUpdateQuantity = async (productId: number, quantity: number, variantId?: number) => {
    if (quantity < 1) return;
    
    try {
      const result: any = await updateQuantityMutation.mutateAsync({ productId, quantity, variantId });
      if (result && result.success === false) {
        toast.error(result.error || "Stock insuffisant");
        return;
      }
      refetch();
      toast.success("Quantité mise à jour");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    }
  };

  const handleRemoveItem = async (productId: number, variantId?: number) => {
    try {
      await removeItemMutation.mutateAsync({ productId, variantId });
      toast.success("Produit retiré du panier");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
            <CardDescription>
              Vous devez être connecté pour accéder à votre panier
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/">
              <Button>Se connecter</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const isEmpty = !cart || !cart.items || cart.items.length === 0;
  const inStockItems = cart?.items?.filter((item: any) => !item.isPreorder) || [];
  const preorderItems = cart?.items?.filter((item: any) => item.isPreorder) || [];


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl text-display font-bold">Mon panier</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                {isEmpty ? "Votre panier est vide" : `${cart.items.length} article(s)`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/catalog">
                <Button variant="outline" size="sm">Continuer mes achats</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
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
                Vos spas sont réservés temporairement. Finalisez votre commande avant l'expiration.
              </span>
              <span className={`text-2xl font-mono font-bold tabular-nums ${timeLeft <= 120 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-amber-600 dark:text-amber-400'}`}>
                {formatTime(timeLeft)}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Expired reservation banner */}
        {expired && (
          <Alert className="mb-6 border-red-500/50 bg-red-50 dark:bg-red-950/30">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="text-sm font-medium text-red-800 dark:text-red-300">
                Le temps de réservation a expiré. Les produits ont été remis en stock.
              </span>
              <Link href="/catalog">
                <Button size="sm" variant="outline" className="border-red-500/50 text-red-700 dark:text-red-400">
                  Retourner au catalogue
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {isEmpty ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-12 pb-12 text-center">
              <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl text-display font-bold mb-2">Votre panier est vide</h2>
              <p className="text-muted-foreground mb-6">
                Découvrez notre catalogue et ajoutez des produits à votre panier
              </p>
              <Link href="/catalog">
                <Button className="gap-2">
                  Voir le catalogue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-3 md:p-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">

              {/* In Stock Items */}
              {inStockItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <CardTitle>Produits au catalogue</CardTitle>
                      <Badge variant="default" className="bg-emerald-600 dark:bg-emerald-500">
                        {inStockItems.length}
                      </Badge>
                    </div>
                    <CardDescription>
                      Expédition immédiate après validation de la commande
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {inStockItems.map((item: any) => (
                      <div key={item.productId} className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border">
                        {/* Product Image */}
                        <div className="w-full sm:w-24 h-32 sm:h-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          {item.product?.imageUrl ? (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold line-clamp-1">{item.product?.name}</h3>
                          <p className="text-xs md:text-sm text-muted-foreground font-mono">{item.product?.ean13 ? `EAN: ${item.product.ean13}` : (item.product?.supplierProductCode || item.product?.sku)}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-base font-semibold text-display text-primary">
                              {formatPrice(typeof item.unitPriceHT === 'string' ? parseFloat(item.unitPriceHT) : item.unitPriceHT)} €
                            </span>
                            <span className="text-sm text-muted-foreground">HT</span>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1, item.variantId)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1, item.variantId)}
                              className="w-16 text-center"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1, item.variantId)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.productId, item.variantId)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Retirer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Preorder Items */}
              {preorderItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TruckIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <CardTitle>Pré-réservations</CardTitle>
                      <Badge variant="secondary" className="bg-orange-500/15 dark:bg-orange-500/25 text-orange-800 dark:text-orange-400">
                        {preorderItems.length}
                      </Badge>
                    </div>
                    <CardDescription>
                      Produits en arrivage - Expédition dès réception du stock
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {preorderItems.map((item: any) => (
                      <div key={`preorder-${item.productId}`} className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-orange-500/20 dark:border-orange-500/30 bg-orange-500/5">
                        <div className="w-full sm:w-24 h-32 sm:h-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          {item.product?.imageUrl ? (
                            <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <TruckIcon className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <h3 className="font-semibold line-clamp-1 flex-1">{item.product?.name}</h3>
                            <Badge variant="secondary" className="bg-orange-500/15 dark:bg-orange-500/25 text-orange-800 dark:text-orange-400 text-xs">
                              Arrivage prévu
                            </Badge>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground font-mono">{item.product?.ean13 ? `EAN: ${item.product.ean13}` : (item.product?.supplierProductCode || item.product?.sku)}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-base font-semibold text-display text-primary">
                              {formatPrice(typeof item.unitPriceHT === 'string' ? parseFloat(item.unitPriceHT) : item.unitPriceHT)} €
                            </span>
                            <span className="text-sm text-muted-foreground">HT</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1, item.variantId)} disabled={item.quantity <= 1}>
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input type="number" min="1" value={item.quantity} onChange={(e) => handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1, item.variantId)} className="w-16 text-center" />
                            <Button variant="outline" size="sm" onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1, item.variantId)}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.productId, item.variantId)} className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4 mr-1" />
                            Retirer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sous-total HT</span>
                      <span className="font-medium">{formatPrice(cart.subtotalHT)} €</span>
                    </div>

                    {/* Partner Discount */}
                    {cart.discountPercent > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                        <span className="flex items-center gap-1">
                          <BadgePercent className="w-3.5 h-3.5" />
                          Remise partenaire ({cart.discountPercent.toFixed(1)}%)
                        </span>
                        <span>-{formatPrice(cart.discountAmount)} €</span>
                      </div>
                    )}

                    {/* Shipping */}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <TruckIcon className="w-3.5 h-3.5" />
                        Livraison
                      </span>
                      <span className="font-medium">{formatPrice((cart as any)?.shippingHT || 0)} €</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {(cart as any)?.vatLabel || "TVA"} ({(cart as any)?.vatRate ?? 0}%)
                      </span>
                      <span className="font-medium">{formatPrice(cart.vatAmount)} €</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base font-semibold text-display">
                      <span>Total TTC</span>
                      <span className="text-primary">{formatPrice(cart.totalTTC)} €</span>
                    </div>
                  </div>

                  {/* Partner Discount Info */}
                  {cart.discountPercent > 0 && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-xs text-muted-foreground">
                        <BadgePercent className="w-4 h-4 inline mr-1 text-primary" />
                        Votre remise partenaire de <strong className="text-primary">{cart.discountPercent.toFixed(1)}%</strong> est appliquée automatiquement.
                      </p>
                    </div>
                  )}

                  {preorderItems.length > 0 && (
                    <div className="p-3 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/20 dark:border-orange-500/30">
                      <p className="text-xs text-orange-800 dark:text-orange-400">
                        <TruckIcon className="w-4 h-4 inline mr-1" />
                        Votre commande contient {preorderItems.length} pré-réservation(s). 
                        L'expédition sera effectuée dès réception du stock.
                      </p>
                    </div>
                  )}
                </CardContent>
                {/* Countdown in summary */}
                {timeLeft !== null && timeLeft > 0 && !expired && (
                  <CardContent className="pt-0">
                    <div className={`p-3 rounded-lg text-center ${timeLeft <= 120 ? 'bg-red-50 dark:bg-red-950/30 border border-red-500/20' : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20'}`}>
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Clock className={`w-4 h-4 ${timeLeft <= 120 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
                        <span className={`text-xs font-medium ${timeLeft <= 120 ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>Réservation expire dans</span>
                      </div>
                      <span className={`text-xl font-mono font-bold tabular-nums ${timeLeft <= 120 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-amber-600 dark:text-amber-400'}`}>
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  </CardContent>
                )}
                <CardFooter className="flex-col gap-2">
                  <Link href="/checkout" className="w-full">
                    <Button className="w-full gap-2" size="lg" disabled={expired}>
                      Valider la commande
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/catalog" className="w-full">
                    <Button variant="outline" className="w-full" size="sm">
                      Continuer mes achats
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
