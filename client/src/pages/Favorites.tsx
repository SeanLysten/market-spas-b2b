import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Heart, ShoppingCart, Search, Package, Trash2, ArrowLeft } from "lucide-react";

export default function Favorites() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: favorites, isLoading, refetch } = trpc.products.getFavorites.useQuery();
  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success("Produit ajouté au panier !");
    },
  });
  const removeFavoriteMutation = trpc.products.removeFavorite.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const filteredFavorites = favorites?.filter((fav) =>
    fav.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (fav.product.ean13 || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (fav.product.supplierProductCode || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToCart = (productId: number) => {
    addToCartMutation.mutate({ productId, quantity: 1, isPreorder: false });
  };

  const handleRemoveFavorite = (productId: number) => {
    removeFavoriteMutation.mutate({ productId });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/50 dark:bg-muted/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50 dark:bg-muted/30">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <Link href="/catalog">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour au catalogue
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Heart className="h-6 w-6 text-red-500 fill-red-500" />
                <h1 className="text-xl text-display text-display font-semibold">Mes favoris</h1>
              </div>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher dans mes favoris..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container py-8">
        {!filteredFavorites || filteredFavorites.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl text-display text-display font-semibold text-foreground dark:text-foreground mb-2">
                {searchQuery ? "Aucun favori trouvé" : "Aucun produit favori"}
              </h2>
              <p className="text-muted-foreground dark:text-muted-foreground mb-6">
                {searchQuery
                  ? "Essayez avec d'autres termes de recherche"
                  : "Ajoutez des produits à vos favoris pour les retrouver facilement"}
              </p>
              <Link href="/catalog">
                <Button>
                  <Package className="h-4 w-4 mr-2" />
                  Parcourir le catalogue
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-muted-foreground dark:text-muted-foreground mb-6">
              {filteredFavorites.length} produit{filteredFavorites.length > 1 ? "s" : ""} dans vos favoris
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-4 md:p-6">
              {filteredFavorites.map((fav) => (
                <Card key={fav.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    {/* Image placeholder */}
                    <div className="aspect-square bg-gradient-to-br from-blue-50 to-blue-100 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="h-16 w-16 text-blue-200" />
                      </div>
                      {/* Remove favorite button */}
                      <button
                        onClick={() => handleRemoveFavorite(fav.productId)}
                        className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-destructive/10 dark:bg-destructive/20 transition-colors"
                      >
                        <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                      </button>
                    </div>
                    
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-1 font-mono">{fav.product.ean13 ? `EAN: ${fav.product.ean13}` : (fav.product.supplierProductCode || fav.product.sku)}</p>
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {fav.product.name}
                      </h3>
                      
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-base font-semibold text-display text-info dark:text-info-dark">
                          {Number(fav.product.pricePartnerHT).toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground dark:text-muted-foreground">HT</span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(fav.productId)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          Ajouter au panier
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
