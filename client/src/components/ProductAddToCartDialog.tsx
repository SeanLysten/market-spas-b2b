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
import { Package, Truck, ShoppingCart, CalendarClock } from "lucide-react";

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

function formatArrival(yyyyww: string | null | undefined): string | null {
  if (!yyyyww || yyyyww === "0") return null;
  const str = yyyyww.toString();
  if (str.length < 5) return null;
  const year = str.slice(0, 4);
  const week = str.slice(4);
  return `S${parseInt(week)} ${year}`;
}

export default function ProductAddToCartDialog({
  open,
  onOpenChange,
  product,
}: ProductAddToCartDialogProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { data: variantsData } = trpc.products.getVariants.useQuery(
    { productId: product?.id },
    { enabled: open && !!product?.id }
  );
  const variants = useSafeQuery(variantsData) || [];

  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      const isReservation = stockAvailable === 0 && transitAvailable > 0;
      toast.success(isReservation ? "Produit r\u00e9serv\u00e9 (en transit)" : "Produit ajout\u00e9 au panier");
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

  const activeVariants = variants?.filter((v: any) => v.isActive !== false) || [];

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

  const stockAvailable = selectedVariant
    ? (selectedVariant.stockQuantity || 0)
    : (product.stockQuantity || 0);

  const transitAvailable = selectedVariant
    ? (selectedVariant.inTransitQuantity || 0)
    : (product.inTransitQuantity || 0);

  const displayImage = selectedVariant?.imageUrl || product.imageUrl;
  const isReservation = stockAvailable === 0 && transitAvailable > 0;
  const arrivalLabel = selectedVariant ? formatArrival(selectedVariant.estimatedArrival) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isReservation ? "R\u00e9server un produit en transit" : "Ajouter au panier"}</DialogTitle>
          <DialogDescription>{product.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Image */}
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
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              {stockAvailable > 0 && (
                <Badge className="bg-green-600 text-white">
                  En stock ({stockAvailable})
                </Badge>
              )}
              {transitAvailable > 0 && (
                <Badge className="bg-amber-500 text-white gap-1">
                  <Truck className="w-3 h-3" />
                  {transitAvailable} en transit
                </Badge>
              )}
              {arrivalLabel && (
                <Badge className="bg-blue-600 text-white gap-1">
                  <CalendarClock className="w-3 h-3" />
                  Arrivage {arrivalLabel}
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
                  Ce produit est actuellement en cours d'acheminement.
                  {arrivalLabel && (
                    <span className="font-semibold"> Arriv\u00e9e pr\u00e9vue : {arrivalLabel}.</span>
                  )}
                  {" "}Vous pouvez le r\u00e9server d\u00e8s maintenant.
                </p>
              </div>
            </div>
          )}

          {/* Variant Selection (Color) with stock/transit/arrival info */}
          {hasVariants && (
            <div className="space-y-3">
              <Label>Couleur / Variante</Label>
              <div className="flex flex-col gap-2">
                {activeVariants.map((variant: any) => {
                  const isSelected = selectedVariantId === variant.id;
                  const colorHex = COLOR_MAP[variant.color?.toLowerCase()] || "#e5e5e5";
                  const varStock = variant.stockQuantity || 0;
                  const varTransit = variant.inTransitQuantity || 0;
                  const varArrival = formatArrival(variant.estimatedArrival);
                  const isAvailable = varStock > 0 || varTransit > 0;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg border-2 transition-all cursor-pointer text-left ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : isAvailable
                            ? "border-border hover:border-primary/50"
                            : "border-border/50 opacity-60"
                      }`}
                    >
                      {/* Color dot */}
                      <div
                        className="w-6 h-6 rounded-full border border-border/50 shadow-inner flex-shrink-0"
                        style={{ backgroundColor: colorHex }}
                      />

                      {/* Variant info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{variant.color || variant.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {varStock > 0 && (
                            <span className="text-xs text-green-600 font-medium">
                              {varStock} en stock
                            </span>
                          )}
                          {varTransit > 0 && (
                            <span className="text-xs text-amber-600 font-medium flex items-center gap-0.5">
                              <Truck className="w-3 h-3" />
                              {varTransit} en transit
                            </span>
                          )}
                          {varArrival && (
                            <span className="text-xs text-blue-600 font-medium flex items-center gap-0.5">
                              <CalendarClock className="w-3 h-3" />
                              Arrivage {varArrival}
                            </span>
                          )}
                          {!isAvailable && (
                            <span className="text-xs text-muted-foreground">Indisponible</span>
                          )}
                        </div>
                      </div>

                      {/* Badges compact */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
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
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantit\u00e9</Label>
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
                {product.pricePartnerHT || 0} \u20ac
              </span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-display mt-2">
              <span>Total HT</span>
              <span>
                {((product.pricePartnerHT || 0) * quantity).toFixed(2)} \u20ac
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
                R\u00e9server{arrivalLabel ? ` (${arrivalLabel})` : " (en transit)"}
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
