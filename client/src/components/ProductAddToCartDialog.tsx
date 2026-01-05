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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Package, Calendar, Check } from "lucide-react";

interface ProductAddToCartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

export default function ProductAddToCartDialog({
  open,
  onOpenChange,
  product,
}: ProductAddToCartDialogProps) {
  // const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [sourceType, setSourceType] = useState<"stock" | "incoming">("stock");
  const [selectedIncomingId, setSelectedIncomingId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  // Fetch variants for this product (disabled for now)
  // const { data: variants } = trpc.admin.products.listVariants.useQuery(
  //   { productId: product.id },
  //   { enabled: open && !!product.id }
  // );
  const variants = [];

  // Fetch incoming stock for this product
  const { data: incomingStock } = trpc.admin.incomingStock.list.useQuery(
    { productId: product.id },
    { enabled: open && !!product.id }
  );

  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success("Produit ajouté au panier");
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const resetForm = () => {
    // setSelectedVariantId(null);
    setSourceType("stock");
    setSelectedIncomingId("");
    setQuantity(1);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleAddToCart = () => {
    if (!product) return;

    const isPreorder = sourceType === "incoming";

    addToCartMutation.mutate({
      productId: product.id,
      // variantId: selectedVariantId || undefined,
      quantity,
      isPreorder,
    });
  };

  const hasVariants = false; // variants && variants.length > 0;
  const hasIncomingStock = incomingStock && incomingStock.length > 0;
  
  // const selectedVariant = variants?.find((v: any) => v.id === selectedVariantId);
  const selectedVariant = null;
  const stockAvailable = product.stockQuantity || 0;

  const pendingIncoming = incomingStock?.filter((s) => s.status === "PENDING") || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter au panier</DialogTitle>
          <DialogDescription>{product.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Variant Selection - Disabled for now */}

          {/* Source Type Selection */}
          <div className="space-y-3">
            <Label>Source</Label>
            <RadioGroup value={sourceType} onValueChange={(value: any) => setSourceType(value)}>
              {/* Stock Option */}
              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="stock" id="stock" />
                <Label htmlFor="stock" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-green-600" />
                      <span className="font-medium">Stock disponible</span>
                    </div>
                    <Badge variant={stockAvailable > 0 ? "default" : "secondary"}>
                      {stockAvailable} unités
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Expédition immédiate
                  </p>
                </Label>
              </div>

              {/* Incoming Stock Option */}
              {hasIncomingStock && pendingIncoming.length > 0 && (
                <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="incoming" id="incoming" />
                  <Label htmlFor="incoming" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Arrivage programmé</span>
                      </div>
                      <Badge variant="outline">{pendingIncoming.length} arrivages</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Précommande avec date d'arrivée estimée
                    </p>
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Incoming Stock Selection */}
          {sourceType === "incoming" && hasIncomingStock && (
            <div className="space-y-2">
              <Label>Semaine d'arrivage</Label>
              <Select value={selectedIncomingId} onValueChange={setSelectedIncomingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une semaine" />
                </SelectTrigger>
                <SelectContent>
                  {pendingIncoming.map((incoming) => (
                    <SelectItem key={incoming.id} value={incoming.id.toString()}>
                      Semaine {incoming.expectedWeek} - {incoming.expectedYear}
                      <span className="text-muted-foreground ml-2">
                        ({incoming.quantity} unités disponibles)
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-center"
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
            <div className="flex items-center justify-between text-lg font-bold mt-2">
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
              // (hasVariants && !selectedVariantId) ||
              (sourceType === "incoming" && !selectedIncomingId) ||
              (sourceType === "stock" && stockAvailable < quantity)
            }
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            Ajouter au panier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
