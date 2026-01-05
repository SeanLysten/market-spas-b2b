import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Search, Package, ShoppingCart, Filter, ArrowLeft, Euro, TrendingUp, TruckIcon, Minus, Plus, Heart } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ProductAddToCartDialog from "@/components/ProductAddToCartDialog";

export default function Catalog() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: products, isLoading } = trpc.products.list.useQuery({
    search: searchQuery || undefined,
    category: selectedCategory,
    limit: 50,
  });

  // Note: We'll fetch incoming stock per product in the dialog
  // For badges, we could add a bulk endpoint later

  // Remove direct add to cart mutation - now handled by ProductAddToCartDialog

  const getQuantity = (productId: number) => quantities[productId] || 1;

  const setQuantity = (productId: number, quantity: number, maxStock: number) => {
    const newQty = Math.max(1, Math.min(quantity, maxStock));
    setQuantities({ ...quantities, [productId]: newQty });
  };

  const handleOpenDialog = (product: any) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const getPartnerPrice = (product: any) => {
    // TODO: Apply partner level discount
    return Number(product.pricePartnerHT || product.pricePublicHT || 0);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getCurrentWeek = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
  };

  // Incoming stock will be fetched per product in the dialog
  // For now, we'll show badges based on product data

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
            <div className="flex items-center gap-2">
              <Link href="/favorites">
                <Button variant="outline" className="gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  Favoris
                </Button>
              </Link>
              <Link href="/cart">
                <Button className="gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Panier
                </Button>
              </Link>
            </div>
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
          </div>
          
          {/* Category Filters */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={selectedCategory === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(undefined)}
            >
              Tous
            </Button>
            <Button 
              variant={selectedCategory === "SPAS" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("SPAS")}
            >
              Spas
            </Button>
            <Button 
              variant={selectedCategory === "SWIM_SPAS" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("SWIM_SPAS")}
            >
              Spas de nage
            </Button>
            <Button 
              variant={selectedCategory === "MAINTENANCE" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("MAINTENANCE")}
            >
              Produits d'entretien
            </Button>
            <Button 
              variant={selectedCategory === "COVERS" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("COVERS")}
            >
              Couvertures
            </Button>
            <Button 
              variant={selectedCategory === "ACCESSORIES" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("ACCESSORIES")}
            >
              Accessoires
            </Button>
            <Button 
              variant={selectedCategory === "OTHER" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("OTHER")}
            >
              Autre
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="skeleton h-48 w-full bg-muted animate-pulse" />
                <CardHeader>
                  <div className="skeleton h-6 w-3/4 mb-2 bg-muted animate-pulse" />
                  <div className="skeleton h-4 w-1/2 bg-muted animate-pulse" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product: any) => {
              const stock = product.stockQuantity || 0;
              const hasStock = stock > 0;
              const quantity = getQuantity(product.id);
              const partnerPrice = getPartnerPrice(product);
              // Incoming stock badges removed for now - will be shown in dialog

              return (
                <Card key={product.id} className="overflow-hidden flex flex-col">
                  {/* Product Image */}
                  <div className="relative h-48 bg-muted">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    {/* Stock Badge */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {hasStock ? (
                        <Badge variant="default" className="bg-green-600">
                          En stock ({stock})
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Rupture
                        </Badge>
                      )}
                      {/* Incoming Stock Badges - will be added back with proper API */}
                    </div>
                  </div>

                  <CardHeader className="flex-1">
                    <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {product.description || "Aucune description"}
                    </CardDescription>
                    <div className="text-sm text-muted-foreground mt-2">
                      SKU: {product.sku}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Price */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(partnerPrice)} €
                      </span>
                      <span className="text-sm text-muted-foreground">HT</span>
                    </div>

                    {/* Quantity Selector (only if in stock) */}
                    {hasStock && (
                      <div className="space-y-2">
                        <Label className="text-sm">Quantité</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQuantity(product.id, quantity - 1, stock)}
                            disabled={quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            max={stock}
                            value={quantity}
                            onChange={(e) => setQuantity(product.id, parseInt(e.target.value) || 1, stock)}
                            className="w-20 text-center"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQuantity(product.id, quantity + 1, stock)}
                            disabled={quantity >= stock}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex-col gap-2">
                    <Button 
                      className="w-full gap-2" 
                      onClick={() => handleOpenDialog(product)}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {hasStock ? "Ajouter au panier" : "Pré-commander"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        )}
      </div>

      {/* Product Add to Cart Dialog */}
      {selectedProduct && (
        <ProductAddToCartDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          product={selectedProduct}
        />
      )}
    </div>
  );
}
