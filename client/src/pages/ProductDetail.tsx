import { useState } from "react";
import { useParams, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Package,
  ShoppingCart,
  Minus,
  Plus,
  CheckCircle,
  Info,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const productId = parseInt(params.id || "0");
  const { user } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  const { data: product, isLoading } = trpc.products.getById.useQuery(
    { id: productId },
    { enabled: productId > 0 }
  );

  const { data: variants } = trpc.products.getVariants.useQuery(
    { productId },
    { enabled: productId > 0 }
  );


  const addToCartMutation = trpc.cart.add.useMutation();

  const selectedVariant = variants?.find((v: any) => v.id === selectedVariantId);

  // Stock and transit info
  const activeVariants = variants?.filter((v: any) => v.isActive !== false) || [];
  const stockAvailable = selectedVariant
    ? (selectedVariant.stockQuantity || 0)
    : activeVariants.length > 0
      ? activeVariants.reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0)
      : (product?.stockQuantity || 0);
  const transitAvailable = selectedVariant
    ? (selectedVariant.inTransitQuantity || 0)
    : activeVariants.length > 0
      ? activeVariants.reduce((sum: number, v: any) => sum + (v.inTransitQuantity || 0), 0)
      : (product?.inTransitQuantity || 0);
  const isReservation = stockAvailable === 0 && transitAvailable > 0;

  const getPrice = () => {
    if (selectedVariant?.pricePartnerHT) {
      return parseFloat(selectedVariant.pricePartnerHT);
    }
    return parseFloat(product?.pricePartnerHT || product?.pricePublicHT || "0");
  };

  const price = getPrice();

  const handleQuantityChange = (newQty: number) => {
    setQuantity(Math.max(1, Math.min(newQty, 100)));
  };

  const handleAddToCart = async (isPreorder: boolean = false) => {
    try {
      await addToCartMutation.mutateAsync({
        productId,
        variantId: selectedVariantId || undefined,
        quantity,
        isPreorder,
      });
      toast.success(
        isPreorder
          ? `${quantity} produit(s) pré-réservé(s)`
          : `${quantity} produit(s) ajouté(s) au panier`
      );
      setQuantity(1);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'ajout au panier");
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getCurrentWeek = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor(
      (now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
    );
    return Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-muted-foreground dark:text-muted-foreground">Produit non trouvé</p>
            <Link href="/catalog">
              <Button className="mt-4">Retour au catalogue</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <Link href="/catalog">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Catalogue
                </Button>
              </Link>
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

      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-3 md:p-8">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-xl border overflow-hidden">
              {(selectedVariant?.imageUrl || (product as any).imageUrl) ? (
                <img
                  src={selectedVariant?.imageUrl || (product as any).imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted/50 dark:bg-muted/30">
                  <Package className="w-32 h-32 text-gray-300" />
                </div>
              )}
            </div>

            {/* Variant Images */}
            {variants && variants.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedVariantId(null)}
                  className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 overflow-hidden ${
                    !selectedVariantId ? "border-blue-600" : "border-border dark:border-border"
                  }`}
                >
                  {(product as any).imageUrl ? (
                    <img
                      src={(product as any).imageUrl}
                      alt="Default"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/50 dark:bg-muted/30">
                      <Package className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </button>
                {variants.map((variant: any) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 overflow-hidden ${
                      selectedVariantId === variant.id
                        ? "border-blue-600"
                        : "border-border dark:border-border"
                    }`}
                  >
                    {variant.imageUrl ? (
                      <img
                        src={variant.imageUrl}
                        alt={variant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted/50 dark:bg-muted/30">
                        <span className="text-xs text-muted-foreground dark:text-muted-foreground">{variant.name}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="font-mono">{product.ean13 ? `EAN: ${product.ean13}` : (product.supplierProductCode || product.sku)}</Badge>

              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
              {selectedVariant && (
                <p className="text-lg text-muted-foreground mt-1">
                  Variante: {selectedVariant.name}
                </p>
              )}
            </div>

            {/* Stock / Transit Status */}
            <div className="flex flex-wrap gap-2">
              {stockAvailable > 0 && (
                <Badge className="bg-green-600 text-white gap-1 px-3 py-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  En stock ({stockAvailable})
                </Badge>
              )}
              {transitAvailable > 0 && (
                <Badge className="bg-amber-500 text-white gap-1 px-3 py-1">
                  <Truck className="w-3.5 h-3.5" />
                  En transit ({transitAvailable})
                </Badge>
              )}
              {stockAvailable === 0 && transitAvailable === 0 && (
                <Badge variant="secondary" className="px-3 py-1">
                  Indisponible
                </Badge>
              )}
            </div>

            {/* Transit reservation info */}
            {isReservation && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
                <Truck className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-300">Produit en transit</p>
                  <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                    Ce produit est en cours d'acheminement. Réservez-le maintenant pour le recevoir dès son arrivée.
                  </p>
                </div>
              </div>
            )}

            {/* Price */}
            <div className="bg-info/10 dark:bg-info-light rounded-xl p-4 md:p-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-info dark:text-info-dark">
                  {formatPrice(price)} €
                </span>
                <span className="text-lg text-muted-foreground dark:text-muted-foreground">HT</span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                Prix partenaire HT — TVA selon pays de livraison
              </p>
            </div>

            {/* Variants Selector with stock/transit */}
            {variants && variants.length > 0 && (
              <div className="space-y-2">
                <Label>Variante</Label>
                <Select
                  value={selectedVariantId?.toString() || "default"}
                  onValueChange={(value) =>
                    setSelectedVariantId(value === "default" ? null : parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une variante" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Standard</SelectItem>
                    {variants.map((variant: any) => {
                      const vs = variant.stockQuantity || 0;
                      const vt = variant.inTransitQuantity || 0;
                      return (
                        <SelectItem key={variant.id} value={variant.id.toString()}>
                          {variant.name}
                          {vs > 0 ? ` (${vs} en stock)` : ''}
                          {vt > 0 ? ` (${vt} en transit)` : ''}
                          {vs === 0 && vt === 0 ? ' (indisponible)' : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <Label>Quantité</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  max={100}
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  className="w-24 text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= 100}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart / Reserve */}
            <div className="space-y-3">
              {stockAvailable > 0 ? (
                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={() => handleAddToCart(false)}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Ajouter au panier
                </Button>
              ) : transitAvailable > 0 ? (
                <Button
                  size="lg"
                  className="w-full gap-2 bg-amber-600 hover:bg-amber-700"
                  onClick={() => handleAddToCart(true)}
                >
                  <Truck className="w-5 h-5" />
                  Réserver (en transit)
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full gap-2"
                  disabled
                >
                  <Package className="w-5 h-5" />
                  Indisponible
                </Button>
              )}
            </div>


          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specs">Caractéristiques</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground dark:text-muted-foreground whitespace-pre-wrap">
                    {product.description || "Aucune description disponible."}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="specs" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {product.supplierProductCode && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground dark:text-muted-foreground">Code Produit</span>
                        <span className="font-medium font-mono">{product.supplierProductCode}</span>
                      </div>
                    )}
                    {product.ean13 && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground dark:text-muted-foreground">EAN13</span>
                        <span className="font-medium font-mono">{product.ean13}</span>
                      </div>
                    )}
                    {product.weight && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground dark:text-muted-foreground">Poids</span>
                        <span className="font-medium">{product.weight} kg</span>
                      </div>
                    )}
                    {(product.length || product.width || product.height) && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground dark:text-muted-foreground">Dimensions</span>
                        <span className="font-medium">
                          {product.length}x{product.width}x{product.height} cm
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground dark:text-muted-foreground">TVA</span>
                      <span className="font-medium text-xs">Selon pays (FR: 20%, autres: 0%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
