import { useState, useEffect, useMemo } from "react";
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
import { Package, Truck, ShoppingCart, CalendarClock, AlertTriangle, ChevronRight, ArrowLeft } from "lucide-react";

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

type SourceType = "stock" | "transit";

interface SourceOption {
  type: SourceType;
  variantId: number;
  quantity: number;
  arrivalWeek: string | null;
  arrivalLabel: string | null;
}

export default function ProductAddToCartDialog({
  open,
  onOpenChange,
  product,
}: ProductAddToCartDialogProps) {
  // Step 0: no variants (direct add), Step 1: color, Step 2: source
  const [step, setStep] = useState<0 | 1 | 2>(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<SourceOption | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { data: variantsData } = trpc.products.getVariants.useQuery(
    { productId: product?.id },
    { enabled: open && !!product?.id }
  );
  const variants = useSafeQuery(variantsData) || [];

  const { data: availabilityData } = trpc.cart.availableQuantity.useQuery(
    { productId: product?.id, variantId: selectedSource?.variantId || undefined },
    { enabled: open && !!product?.id && !!selectedSource?.variantId }
  );
  const availability = useSafeQuery(availabilityData);

  const utils = trpc.useUtils();

  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: (result: any) => {
      if (result && result.success === false) {
        toast.error(result.error || "Erreur lors de l'ajout au panier");
        return;
      }
      const isReservation = selectedSource?.type === "transit";
      toast.success(isReservation ? "Produit réservé (en transit)" : "Produit ajouté au panier");
      utils.cart.get.invalidate();
      utils.cart.availableQuantity.invalidate();
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const resetForm = () => {
    setStep(hasNoVariants ? 0 : 1);
    setSelectedColor(null);
    setSelectedSource(null);
    setQuantity(1);
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  // Reset quantity when source changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedSource?.variantId, selectedSource?.type]);

  const activeVariants = variants?.filter((v: any) => v.isActive !== false) || [];
  const hasNoVariants = activeVariants.length === 0;

  // Auto-switch to step 0 (direct add) when product has no variants
  useEffect(() => {
    if (open && hasNoVariants && variantsData !== undefined) {
      setStep(0);
    }
  }, [open, hasNoVariants, variantsData]);

  // Group variants by color
  const colorGroups = useMemo(() => {
    const groups: Record<string, { color: string; colorHex: string; variants: any[]; totalStock: number; totalTransit: number; totalReserved: number }> = {};
    
    for (const v of activeVariants) {
      const colorName = v.color || v.name || "Standard";
      if (!groups[colorName]) {
        groups[colorName] = {
          color: colorName,
          colorHex: COLOR_MAP[colorName.toLowerCase()] || "#e5e5e5",
          variants: [],
          totalStock: 0,
          totalTransit: 0,
          totalReserved: 0,
        };
      }
      groups[colorName].variants.push(v);
      groups[colorName].totalStock += (v.stockQuantity || 0);
      groups[colorName].totalTransit += (v.inTransitQuantity || 0);
      groups[colorName].totalReserved += (v.stockReserved || 0);
    }
    return Object.values(groups);
  }, [activeVariants]);

  // Sources for selected color
  const sourcesForColor = useMemo(() => {
    if (!selectedColor) return [];
    const group = colorGroups.find(g => g.color === selectedColor);
    if (!group) return [];

    const sources: SourceOption[] = [];

    for (const v of group.variants) {
      const stock = v.stockQuantity || 0;
      const transit = v.inTransitQuantity || 0;
      const arrival = formatArrival(v.estimatedArrival);

      // Stock source
      if (stock > 0) {
        sources.push({
          type: "stock",
          variantId: v.id,
          quantity: stock,
          arrivalWeek: null,
          arrivalLabel: null,
        });
      }

      // Transit source (per arrival week)
      if (transit > 0) {
        sources.push({
          type: "transit",
          variantId: v.id,
          quantity: transit,
          arrivalWeek: v.estimatedArrival,
          arrivalLabel: arrival,
        });
      }
    }

    return sources;
  }, [selectedColor, colorGroups]);

  // Auto-select if only one source
  useEffect(() => {
    if (step === 2 && sourcesForColor.length === 1 && !selectedSource) {
      setSelectedSource(sourcesForColor[0]);
    }
  }, [step, sourcesForColor, selectedSource]);

  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
    setSelectedSource(null);
    setQuantity(1);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedSource(null);
    setQuantity(1);
  };

  const handleAddToCart = () => {
    if (!product) return;
    // For products without variants (step 0), add directly without variantId
    if (hasNoVariants) {
      if (directMaxQuantity > 0 && quantity > directMaxQuantity) {
        toast.error(`Quantité maximale disponible : ${directMaxQuantity}`);
        return;
      }
      addToCartMutation.mutate({
        productId: product.id,
        quantity,
        isPreorder: false,
      });
      return;
    }
    if (!selectedSource) return;
    if (maxQuantity > 0 && quantity > maxQuantity) {
      toast.error(`Quantité maximale disponible : ${maxQuantity}`);
      return;
    }
    const isPreorder = selectedSource.type === "transit";
    addToCartMutation.mutate({
      productId: product.id,
      quantity,
      variantId: selectedSource.variantId,
      isPreorder,
    });
  };

  const maxQuantity = availability?.available ?? (selectedSource?.quantity || 0);
  const reserved = availability?.reserved ?? 0;
  const isOverLimit = quantity > maxQuantity;
  const isReservation = selectedSource?.type === "transit";

  // For products without variants, query availability directly from product stock
  const { data: directAvailabilityData } = trpc.cart.availableQuantity.useQuery(
    { productId: product?.id },
    { enabled: open && !!product?.id && hasNoVariants }
  );
  const directAvailability = useSafeQuery(directAvailabilityData);
  const directMaxQuantity = directAvailability?.available ?? (product?.stockQuantity || 0);
  const directIsOverLimit = hasNoVariants && quantity > directMaxQuantity;

  const selectedGroup = colorGroups.find(g => g.color === selectedColor);
  const selectedVariant = selectedSource ? activeVariants.find((v: any) => v.id === selectedSource.variantId) : null;
  const displayImage = selectedVariant?.imageUrl || product.imageUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 0 ? "Ajouter au panier" : step === 1 ? "Choisir une couleur" : "Choisir la disponibilité"}
          </DialogTitle>
          <DialogDescription>{product.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* ====== STEP 0: Direct Add (no variants) ====== */}
          {step === 0 && (
            <>
              {/* Product Image */}
              <div className="relative w-full h-52 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain transition-all duration-300 p-2"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quantity-direct">Quantité</Label>
                  {directMaxQuantity > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {directMaxQuantity} disponible(s)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <input
                    id="quantity-direct"
                    type="number"
                    min="1"
                    max={directMaxQuantity > 0 ? directMaxQuantity : undefined}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className={`flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm text-center ${
                      directIsOverLimit ? "border-red-500 text-red-600" : "border-input"
                    }`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(quantity + 1, directMaxQuantity > 0 ? directMaxQuantity : quantity + 1))}
                    disabled={directMaxQuantity > 0 && quantity >= directMaxQuantity}
                  >
                    +
                  </Button>
                </div>

                {directIsOverLimit && (
                  <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>
                      Quantité maximale disponible : <strong>{directMaxQuantity}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Price Summary */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Prix unitaire HT</span>
                  <span className="font-medium">
                    {parseFloat(String(product.pricePartnerHT || 0)).toFixed(2)} €
                  </span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold text-display mt-2">
                  <span>Total HT</span>
                  <span>
                    {(parseFloat(String(product.pricePartnerHT || 0)) * quantity).toFixed(2)} €
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ====== STEP 1: Color Selection ====== */}
          {step === 1 && (
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">Sélectionnez une couleur</Label>
              <div className="flex flex-col gap-2">
                {colorGroups.map((group) => {
                  const totalAvailable = Math.max(0, group.totalStock + group.totalTransit - group.totalReserved);
                  const isAvailable = totalAvailable > 0;
                  const arrivals = group.variants
                    .filter(v => (v.inTransitQuantity || 0) > 0)
                    .map(v => formatArrival(v.estimatedArrival))
                    .filter(Boolean);
                  const uniqueArrivals = [...new Set(arrivals)];

                  return (
                    <button
                      key={group.color}
                      onClick={() => isAvailable && handleSelectColor(group.color)}
                      disabled={!isAvailable}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all text-left ${
                        isAvailable
                          ? "border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                          : "border-border/50 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full border border-border/50 shadow-inner flex-shrink-0"
                        style={{ backgroundColor: group.colorHex }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold block">{group.color}</span>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {group.totalStock > 0 && (
                            <span className="text-xs text-green-600 font-medium">
                              {group.totalStock} en stock
                            </span>
                          )}
                          {group.totalTransit > 0 && (
                            <span className="text-xs text-amber-600 font-medium flex items-center gap-0.5">
                              <Truck className="w-3 h-3" />
                              {group.totalTransit} en transit
                            </span>
                          )}
                          {uniqueArrivals.length > 0 && (
                            <span className="text-xs text-blue-600 font-medium flex items-center gap-0.5">
                              <CalendarClock className="w-3 h-3" />
                              {uniqueArrivals.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={`text-[10px] px-1.5 py-0 ${totalAvailable > 0 ? "bg-green-600" : "bg-gray-400"}`}>
                          {totalAvailable} dispo.
                        </Badge>
                        {isAvailable && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ====== STEP 2: Source Selection + Quantity ====== */}
          {step === 2 && selectedColor && (
            <>
              {/* Back button */}
              <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1 -ml-2 text-muted-foreground">
                <ArrowLeft className="w-4 h-4" />
                Retour aux couleurs
              </Button>

              {/* Selected color recap */}
              <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
                <div
                  className="w-6 h-6 rounded-full border border-border/50 shadow-inner flex-shrink-0"
                  style={{ backgroundColor: selectedGroup?.colorHex || "#e5e5e5" }}
                />
                <span className="text-sm font-semibold">{selectedColor}</span>
              </div>

              {/* Product Image */}
              <div className="relative w-full h-52 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={product.name}
                    className="w-full h-full object-contain transition-all duration-300 p-2"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Source selection */}
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">Choisissez votre source</Label>
                <div className="flex flex-col gap-2">
                  {sourcesForColor.map((source, idx) => {
                    const isSelected = selectedSource?.variantId === source.variantId && selectedSource?.type === source.type;
                    return (
                      <button
                        key={`${source.type}-${source.variantId}-${idx}`}
                        onClick={() => setSelectedSource(source)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/50 cursor-pointer"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          source.type === "stock" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {source.type === "stock" ? (
                            <Package className="w-5 h-5" />
                          ) : (
                            <Truck className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold block">
                            {source.type === "stock" ? "En stock" : `Arrivage ${source.arrivalLabel || "en transit"}`}
                          </span>
                          <span className={`text-xs font-medium ${
                            source.type === "stock" ? "text-green-600" : "text-amber-600"
                          }`}>
                            {source.quantity} unité(s) disponible(s)
                          </span>
                        </div>
                        <Badge className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${
                          source.type === "stock" ? "bg-green-600" : "bg-amber-500"
                        }`}>
                          {source.quantity}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity (only shown when source is selected) */}
              {selectedSource && (
                <>
                  {/* Info banner for transit */}
                  {isReservation && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
                      <Truck className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800 dark:text-amber-300">Réservation en transit</p>
                        <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                          Ce produit est en cours d'acheminement.
                          {selectedSource.arrivalLabel && (
                            <span className="font-semibold"> Arrivée prévue : {selectedSource.arrivalLabel}.</span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="quantity">Quantité</Label>
                      {maxQuantity > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {maxQuantity} disponible(s)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        -
                      </Button>
                      <input
                        id="quantity"
                        type="number"
                        min="1"
                        max={maxQuantity > 0 ? maxQuantity : undefined}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className={`flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm text-center ${
                          isOverLimit ? "border-red-500 text-red-600" : "border-input"
                        }`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.min(quantity + 1, maxQuantity > 0 ? maxQuantity : quantity + 1))}
                        disabled={maxQuantity > 0 && quantity >= maxQuantity}
                      >
                        +
                      </Button>
                    </div>

                    {isOverLimit && (
                      <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>
                          Quantité maximale disponible : <strong>{maxQuantity}</strong>
                          {reserved > 0 && ` (${reserved} déjà réservé(s))`}
                        </span>
                      </div>
                    )}

                    {reserved > 0 && !isOverLimit && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {reserved} unité(s) déjà réservée(s) sur cette source.
                      </p>
                    )}
                  </div>

                  {/* Price Summary */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Prix unitaire HT</span>
                      <span className="font-medium">
                        {parseFloat(String(product.pricePartnerHT || 0)).toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-base font-semibold text-display mt-2">
                      <span>Total HT</span>
                      <span>
                        {(parseFloat(String(product.pricePartnerHT || 0)) * quantity).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          {step === 0 && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleAddToCart}
                disabled={
                  addToCartMutation.isPending ||
                  directIsOverLimit ||
                  (directMaxQuantity === 0 && quantity > 0)
                }
                className="gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Ajouter au panier
              </Button>
            </>
          )}
          {step === 1 && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={handleBack}>
                Retour
              </Button>
              <Button
                onClick={handleAddToCart}
                disabled={
                  addToCartMutation.isPending ||
                  !selectedSource ||
                  isOverLimit ||
                  maxQuantity === 0
                }
                className={`gap-2 ${isReservation ? "bg-amber-600 hover:bg-amber-700" : ""}`}
              >
                {isReservation ? (
                  <>
                    <Truck className="w-4 h-4" />
                    Réserver{selectedSource?.arrivalLabel ? ` (${selectedSource.arrivalLabel})` : ""}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    Ajouter au panier
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
