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
import { CSVImportDialog } from "@/components/CSVImportDialog";

const COLOR_MAP: Record<string, string> = {
  "blanc": "#FFFFFF",
  "white": "#FFFFFF",
  "noir": "#1a1a1a",
  "black": "#1a1a1a",
  "gris": "#808080",
  "grey": "#808080",
  "gray": "#808080",
  "sterling silver": "#C4C4C4",
  "silver": "#C4C4C4",
  "argent": "#C4C4C4",
  "beige": "#D4B896",
  "brun": "#6B3A2A",
  "brown": "#6B3A2A",
  "bleu": "#2563EB",
  "blue": "#2563EB",
  "rouge": "#DC2626",
  "red": "#DC2626",
};

function getColorHex(colorName: string): string {
  const lower = colorName.toLowerCase().trim();
  return COLOR_MAP[lower] || "#9CA3AF";
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 186;
}

// Component for a single product card with variant color dots
function ProductCard({ product, allIncomingStock, onOpenDialog }: {
  product: any;
  allIncomingStock: any[] | undefined;
  onOpenDialog: (product: any) => void;
}) {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  // Fetch variants for this product
  const { data: variants } = trpc.products.getVariants.useQuery(
    { productId: product.id },
    { staleTime: 60000 }
  );

  // Filter only active variants
  const activeVariants = variants?.filter((v: any) => v.isActive !== false) || [];

  const selectedVariant = activeVariants?.find((v: any) => v.id === selectedVariantId) || null;

  // Determine the image to display: selected variant image > product image > placeholder
  const displayImage = selectedVariant?.imageUrl || product.imageUrl;

  // Calculate stock based on selected variant or sum of all active variants
  const totalVariantsStock = activeVariants?.reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0) || 0;
  const variantStock = selectedVariant ? (selectedVariant.stockQuantity || 0) : totalVariantsStock;
  const hasStock = variantStock > 0;

  const getPartnerPrice = () => {
    return Number(product.pricePartnerHT || product.pricePublicHT || 0);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const partnerPrice = getPartnerPrice();

  const hasIncomingStock = allIncomingStock?.some(
    (incoming: any) => incoming.productId === product.id && incoming.status === "PENDING"
  );

  return (
    <Card className="overflow-hidden flex flex-col">
      {/* Product Image */}
      <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={selectedVariant ? `${product.name} - ${selectedVariant.color || selectedVariant.name}` : product.name}
            className="w-full h-full object-cover transition-all duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        {/* Stock Badge */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {hasStock ? (
            <Badge variant="default" className="bg-emerald-600 dark:bg-emerald-500">
              En stock ({variantStock})
            </Badge>
          ) : (
            <Badge variant="secondary">
              Rupture
            </Badge>
          )}
          {hasIncomingStock && (
            <Badge className="bg-amber-500 dark:bg-amber-400 hover:bg-yellow-600 text-white">
              <TruckIcon className="mr-1 h-3 w-3" />
              Arrivage
            </Badge>
          )}
        </div>
      </div>

      <CardHeader className="flex-1 pb-2">
        <CardTitle className="line-clamp-2">{product.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {product.description || "Aucune description"}
        </CardDescription>
        {(product.ean13 || product.supplierProductCode) && (
          <div className="text-sm text-muted-foreground mt-1 font-mono">
            {product.ean13 ? `EAN: ${product.ean13}` : product.supplierProductCode}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Color Swatches */}
        {activeVariants && activeVariants.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {activeVariants.map((variant: any) => {
                const colorHex = getColorHex(variant.color || variant.name || "");
                const isSelected = selectedVariantId === variant.id;
                const isLight = isLightColor(colorHex);
                const vStock = variant.stockQuantity || 0;

                return (
                  <button
                    key={variant.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVariantId(isSelected ? null : variant.id);
                    }}
                    className={`relative w-7 h-7 rounded-full transition-all duration-200 focus:outline-none ${
                      isSelected
                        ? "ring-2 ring-primary ring-offset-2 scale-110"
                        : "ring-1 ring-border hover:ring-2 hover:ring-primary/50 hover:scale-105"
                    }`}
                    style={{ backgroundColor: colorHex }}
                    title={`${variant.color || variant.name} — Stock: ${vStock}`}
                  >
                    {isSelected && (
                      <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${isLight ? "text-gray-800" : "text-white"}`}>
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedVariant && (
              <p className="text-xs text-muted-foreground">
                {selectedVariant.color || selectedVariant.name}
                {selectedVariant.stockQuantity != null && (
                  <span className="ml-1">— Stock: {selectedVariant.stockQuantity}</span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl text-display text-display font-bold text-primary">
            {formatPrice(partnerPrice)} €
          </span>
          <span className="text-sm text-muted-foreground">HT</span>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-2">
        <Button 
          className="w-full gap-2" 
          onClick={() => onOpenDialog(product)}
        >
          <ShoppingCart className="w-4 h-4" />
          {hasStock ? "Ajouter au panier" : "Pré-commander"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Catalog() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: products, isLoading } = trpc.products.list.useQuery({
    search: searchQuery || undefined,
    category: selectedCategory,
    limit: 50,
  });

  // Fetch all incoming stock for badge display
  const { data: allIncomingStock } = trpc.admin.incomingStock.list.useQuery({});

  const handleOpenDialog = (product: any) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Retour</span>
                </Button>
              </Link>
              <div className="flex-1">
                <h1 className="text-lg md:text-2xl text-display font-bold">Catalogue produits</h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {products?.length || 0} produits
                </p>
              </div>
            </div>
            {/* Boutons empilés sur mobile */}
            <div className="flex flex-wrap items-center gap-2">
              <CSVImportDialog />
              <Link href="/favorites" className="flex-1 sm:flex-none">
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="hidden sm:inline">Favoris</span>
                </Button>
              </Link>
              <Link href="/cart" className="flex-1 sm:flex-none">
                <Button className="gap-2 w-full sm:w-auto">
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline">Panier</span>
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
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product: any) => (
              <ProductCard
                key={product.id}
                product={product}
                allIncomingStock={allIncomingStock}
                onOpenDialog={handleOpenDialog}
              />
            ))}
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
