import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Minus, Plus, ShoppingCart, Trash2, ArrowRight, TruckIcon, Package, BadgePercent, Gift } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function Cart() {
  const { user } = useAuth();
  const { data: cart, refetch } = trpc.cart.get.useQuery();
  const updateQuantityMutation = trpc.cart.updateQuantity.useMutation();
  const removeItemMutation = trpc.cart.removeItem.useMutation();

  const handleUpdateQuantity = async (productId: number, quantity: number) => {
    if (quantity < 1) return;
    
    try {
      await updateQuantityMutation.mutateAsync({ productId, quantity });
      refetch();
      toast.success("Quantité mise à jour");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    }
  };

  const handleRemoveItem = async (productId: number) => {
    try {
      await removeItemMutation.mutateAsync({ productId });
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

  // Free shipping progress
  const subtotalAfterDiscount = (cart?.subtotalHT || 0) - (cart?.discountAmount || 0);
  const freeShippingThreshold = (cart as any)?.freeShippingThreshold || 5000;
  const isFreeShipping = (cart as any)?.isFreeShipping || false;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotalAfterDiscount);
  const freeShippingProgress = Math.min(100, (subtotalAfterDiscount / freeShippingThreshold) * 100);

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
              {/* Free Shipping Progress Banner */}
              {!isEmpty && (
                <Card className={`border ${isFreeShipping ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-primary/20 bg-primary/5'}`}>
                  <CardContent className="py-4">
                    {isFreeShipping ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                          <Gift className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                            Livraison gratuite applicable
                          </p>
                          <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                            Votre commande dépasse le seuil de {formatPrice(freeShippingThreshold)} € HT
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TruckIcon className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">
                              Plus que <strong>{formatPrice(remainingForFreeShipping)} € HT</strong> pour la livraison gratuite
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatPrice(subtotalAfterDiscount)} / {formatPrice(freeShippingThreshold)} €
                          </span>
                        </div>
                        <Progress value={freeShippingProgress} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* In Stock Items */}
              {inStockItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <CardTitle>Produits en stock</CardTitle>
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
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1)}
                              className="w-16 text-center"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.productId)}
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
                            <Button variant="outline" size="sm" onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)} disabled={item.quantity <= 1}>
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input type="number" min="1" value={item.quantity} onChange={(e) => handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1)} className="w-16 text-center" />
                            <Button variant="outline" size="sm" onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.productId)} className="text-destructive hover:text-destructive">
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
                          Remise {(cart as any).partnerLevel || "partenaire"} ({cart.discountPercent}%)
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
                      {(cart as any)?.isFreeShipping ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Gratuite</span>
                      ) : (
                        <span className="font-medium">{formatPrice((cart as any)?.shippingHT || 0)} €</span>
                      )}
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">TVA</span>
                      <span className="font-medium">{formatPrice(cart.vatAmount)} €</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base font-semibold text-display">
                      <span>Total TTC</span>
                      <span className="text-primary">{formatPrice(cart.totalTTC)} €</span>
                    </div>
                  </div>

                  {/* Partner Level Badge */}
                  {(cart as any)?.partnerLevel && cart.discountPercent > 0 && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-xs text-muted-foreground">
                        <BadgePercent className="w-4 h-4 inline mr-1 text-primary" />
                        Votre niveau <strong className="text-primary">{(cart as any).partnerLevel}</strong> vous donne droit à une remise de <strong className="text-primary">{cart.discountPercent}%</strong> sur tous les produits.
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
                <CardFooter className="flex-col gap-2">
                  <Link href="/checkout" className="w-full">
                    <Button className="w-full gap-2" size="lg">
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
