import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Minus, Plus, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Mon panier</h1>
              <p className="text-sm text-muted-foreground">
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
              <h2 className="text-2xl font-bold mb-2">Votre panier est vide</h2>
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
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item: any) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      {/* Product Image */}
                      <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{item.product.name}</h3>
                            <p className="text-sm text-muted-foreground">SKU: {item.product.sku}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.productId)}
                            disabled={removeItemMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const qty = parseInt(e.target.value);
                                if (qty > 0) handleUpdateQuantity(item.productId, qty);
                              }}
                              className="w-16 text-center"
                              min="1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                              disabled={updateQuantityMutation.isPending}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Prix unitaire HT</p>
                            <p className="text-lg font-bold">{item.unitPriceHT.toFixed(2)} €</p>
                            <p className="text-sm font-medium text-primary">
                              Total: {(item.unitPriceHT * item.quantity).toFixed(2)} €
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                      <span className="font-medium">{cart.subtotalHT?.toFixed(2) || "0.00"} €</span>
                    </div>
                    
                    {cart.discountAmount && cart.discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Remise ({cart.discountPercent}%)</span>
                        <span>-{cart.discountAmount.toFixed(2)} €</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">TVA</span>
                      <span className="font-medium">{cart.vatAmount?.toFixed(2) || "0.00"} €</span>
                    </div>

                    <div className="border-t pt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold">Total TTC</span>
                        <span className="text-2xl font-bold text-primary">
                          {cart.totalTTC?.toFixed(2) || "0.00"} €
                        </span>
                      </div>
                    </div>
                  </div>

                  {cart.discountPercent && cart.discountPercent > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800 font-medium">
                        🎉 Remise partenaire de {cart.discountPercent}% appliquée
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex-col gap-3">
                  <Link href="/checkout" className="w-full">
                    <Button className="w-full gap-2" size="lg">
                      Passer la commande
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/catalog" className="w-full">
                    <Button variant="outline" className="w-full" size="lg">
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
