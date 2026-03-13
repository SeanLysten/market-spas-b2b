import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { toast } from "sonner";
import { Package, Check, Truck, ShoppingCart } from "lucide-react";

interface ProductAddToCartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

const COLOR_MAP: Record<string, string> = {
  "sterling marble": "#E8E4E0",
  "odyssey": "#B0B0B0",
  "midnight opal": "#1a1a2e",
  blanc: "#ffffff",
  noir: "#1a1a1a",
  gris: "#808080",
  "sterling silver": "#C0C0C0",
  beige: "#D4B896",
  brun: "#6B3A2A",
};

export default function ProductAddToCartDialog({
  open,
  onOpenChange,
  product,
}: ProductAddToCartDialogProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Fetch variants for this product
  const { data: variantsData } = trpc.products.getVariants.useQuery(
    { productId: product?.id },
    { enabled: open && !!product?.id }
  );
  const variants = useSafeQuery(variantsData) || [];

  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      const isReservation = stockAvailable === 0 && transitAvailable > 0;
      toast.success(isReservation ? "Produit réservé (en transit)" : "Produit ajouté au panier");
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const resetForm = () => {
    setSelectedVariantId(null);
    setQuantity(1);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // Filter only active variants
  const activeVariants = variants?.filter((v: any) => v.isActive !== false) || [];

  // Auto-select first active variant when variants load
  useEffect(() => {
    if (activeVariants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(activeVariants[0].id);
    } else if (activeVariants.length > 0 && selectedVariantId && !activeVariants.find((v: any) => v.id === selectedVariantId)) {
      setSelectedVariantId(activeVariants[0].id);
    }
  }, [activeVariants, selectedVariantId]);

  const handleAddToCart = () => {
    if (!product) return;

    const isPreorder = stockAvailable === 0 && transitAvailable > 0;

    addToCartMutation.mutate({
      productId: product.id,
      quantity,
      variantId: selectedVariantId || undefined,
      isPreorder,
    });
  };

  const hasVariants = activeVariants && activeVariants.length > 0;
  
  const selectedVariant = variants?.find((v: any) => v.id === selectedVariantId);
  
  // Use variant stock if a variant is selected, otherwise product stock
  const stockAvailable = selectedVariant
    ? (selectedVariant.stockQuantity || 0)
    : (product.stockQuantity || 0);

  const transitAvailable = selectedVariant
    ? (selectedVariant.inTransitQuantity || 0)
    : (product.inTransitQuantity || 0);

  // Get the image to display: variant image > product image > null
  const displayImage = selectedVariant?.imageUrl || product.imageUrl;

  const isReservation = stockAvailable === 0 && transitAvailable > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isReservation ? "Réserver un produit en transit" : "Ajouter au panier"}</DialogTitle>
          <DialogDescription>{product.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Image - changes based on selected variant */}
          <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            {displayImage ? (
              <img
                src={displayImage}
                alt={selectedVariant?.name || product.name}
                className="w-full h-full object-contain transition-all duration-300 p-2"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
            {/* Stock / Transit badges */}
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              {stockAvailable > 0 && (
                <Badge className="bg-green-600 text-white">
                  En stock ({stockAvailable})
                </Badge>
              )}
              {transitAvailable > 0 && (
                <Badge className="bg-amber-500 text-white gap-1">
                  <Truck className="w-3 h-3" />
                  En transit ({transitAvailable})
                </Badge>
              )}
              {stockAvailable === 0 && transitAvailable === 0 && (
                <Badge variant="secondary">Indisponible</Badge>
              )}
            </div>
          </div>

          {/* Info banner for transit reservation */}
          {isReservation && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
              <Truck className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-300">Produit en transit</p>
                <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                  Ce produit est actuellement en cours d'acheminement. Vous pouvez le réserver dès maintenant pour le recevoir dès son arrivée en stock.
                </p>
              </div>
            </div>
          )}

          {/* Variant Selection (Color) with stock/transit info */}
          {hasVariants && (
            <div className="space-y-3">
              <Label>Couleur</Label>
              <div className="flex gap-2 flex-wrap">
                {activeVariants.map((variant: any) => {
                  const isSelected = selectedVariantId === variant.id;
                  const colorHex = COLOR_MAP[variant.color?.toLowerCase()] || "#e5e5e5";
                  const varStock = variant.stockQuantity || 0;
                  const varTransit = variant.inTransitQuantity || 0;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/50"
                      }`}
                      title={`${variant.color || variant.name} — Stock: ${varStock}${varTransit > 0 ? ` | Transit: ${varTransit}` : ''}`}
                    >
                      <div
                        className="w-5 h-5 rounded-full border border-border/50 shadow-inner"
                        style={{ backgroundColor: colorHex }}
                      />
                      <span className="text-sm font-medium">{variant.color || variant.name}</span>
                      <div className="flex gap-1">
                        {varStock > 0 && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-green-600">
                            {varStock}
                          </Badge>
                        )}
                        {varTransit > 0 && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-amber-500 gap-0.5">
                            <Truck className="w-2.5 h-2.5" />
                            {varTransit}
                          </Badge>
                        )}
                        {varStock === 0 && varTransit === 0 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            0
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantité</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </Button>
              <input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
            </div>
          </div>

          {/* Price Summary */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Prix unitaire HT</span>
              <span className="font-medium">
                {product.pricePartnerHT || 0} €
              </span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-display mt-2">
              <span>Total HT</span>
              <span>
                {((product.pricePartnerHT || 0) * quantity).toFixed(2)} €
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleAddToCart}
            disabled={
              addToCartMutation.isPending ||
              (hasVariants && !selectedVariantId) ||
              (stockAvailable === 0 && transitAvailable === 0)
            }
            className={`gap-2 ${isReservation ? "bg-amber-600 hover:bg-amber-700" : ""}`}
          >
            {isReservation ? (
              <>
                <Truck className="w-4 h-4" />
                Réserver (en transit)
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                Ajouter au panier
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
