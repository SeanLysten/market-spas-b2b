import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Search, Package, ShoppingCart, Filter, ArrowLeft, Euro, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function Catalog() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();

  const { data: products, isLoading } = trpc.products.list.useQuery({
    search: searchQuery || undefined,
    categoryId: selectedCategory,
    limit: 50,
  });

  const getPartnerPrice = (product: any) => {
    // TODO: Apply partner level discount
    return Number(product.pricePartnerHT);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Catalogue produits</h1>
                <p className="text-sm text-muted-foreground">
                  {products?.length || 0} produits disponibles
                </p>
              </div>
            </div>
            <Link href="/cart">
              <Button className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                Panier
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtres
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="skeleton h-48 w-full" />
                <CardHeader>
                  <div className="skeleton h-6 w-3/4 mb-2" />
                  <div className="skeleton h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <div className="skeleton h-8 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Card key={product.id} className="card-hover overflow-hidden flex flex-col">
                <div className="relative h-48 bg-muted flex items-center justify-center">
                  <Package className="w-16 h-16 text-muted-foreground/30" />
                  {product.isFeatured && (
                    <Badge className="absolute top-2 right-2 bg-primary">
                      Vedette
                    </Badge>
                  )}
                  {product.stockQuantity !== null && product.lowStockThreshold !== null && product.stockQuantity <= product.lowStockThreshold && (
                    <Badge className="absolute top-2 left-2 bg-warning text-warning-foreground">
                      Stock bas
                    </Badge>
                  )}
                </div>
                <CardHeader className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {product.shortDescription || product.description || "Produit de qualité premium"}
                  </CardDescription>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                    <span>SKU: {product.sku}</span>
                    {product.trackStock && (
                      <>
                        <span>•</span>
                        <span className={(product.stockQuantity || 0) > 0 ? "text-green-600" : "text-red-600"}>
                          {(product.stockQuantity || 0) > 0 ? `${product.stockQuantity} en stock` : "Rupture"}
                        </span>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold text-primary">
                      €{formatPrice(getPartnerPrice(product))}
                    </div>
                    <div className="text-sm text-muted-foreground line-through">
                      €{formatPrice(Number(product.pricePublicHT))}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    HT • TVA {Number(product.vatRate)}%
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Link href={`/products/${product.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      Détails
                    </Button>
                  </Link>
                  <Button className="flex-1 gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Ajouter
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <Package className="w-16 h-16 text-muted-foreground/50 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Essayez de modifier votre recherche"
                    : "Le catalogue sera bientôt disponible"}
                </p>
              </div>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Réinitialiser la recherche
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
