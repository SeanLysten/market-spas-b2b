import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search, Package, Filter, ShoppingCart, Info, RotateCcw, Wrench, Cpu, Droplets,
  Zap, Thermometer, Wind, Eye, ChevronRight
} from "lucide-react";

// ===== CONSTANTS =====
const BRAND_LABELS: Record<string, string> = {
  MARKET_SPAS: "Market Spas", WELLIS_CLASSIC: "Wellis Classic", WELLIS_LIFE: "Wellis Life",
  WELLIS_WIBES: "Wellis Wibes", PASSION_SPAS: "Passion Spas", PLATINUM_SPAS: "Platinum Spas",
};

const CATEGORIES = [
  { value: "PUMP", label: "Pompes", icon: Droplets },
  { value: "CONTROL_BOARD", label: "Cartes mères", icon: Cpu },
  { value: "HEATER", label: "Réchauffeurs", icon: Thermometer },
  { value: "JET", label: "Jets", icon: Wind },
  { value: "DISPLAY", label: "Écrans / Claviers", icon: Eye },
  { value: "FILTER", label: "Filtres", icon: Filter },
  { value: "COVER", label: "Couvertures", icon: Package },
  { value: "PLUMBING", label: "Plomberie", icon: Wrench },
  { value: "ELECTRICAL", label: "Électrique", icon: Zap },
  { value: "BLOWER", label: "Blowers", icon: Wind },
  { value: "OZONE", label: "Ozonateurs", icon: Droplets },
  { value: "OTHER", label: "Autres", icon: Package },
];

function SparePartDetailDialog({ partId, open, onOpenChange }: {
  partId: number; open: boolean; onOpenChange: (open: boolean) => void;
}) {
  const { data: part } = trpc.spareParts.getById.useQuery({ id: partId }, { enabled: open });

  if (!part) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{part.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {part.imageUrl && (
            <div className="rounded-lg overflow-hidden bg-muted/30">
              <img src={part.imageUrl} alt={part.name} className="w-full h-48 object-contain" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Référence</Label>
              <p className="font-medium">{part.reference}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Catégorie</Label>
              <p className="font-medium">{CATEGORIES.find(c => c.value === part.category)?.label || part.category}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Prix HT</Label>
              <p className="font-medium text-lg">{(parseFloat(part.priceHT) / 100).toFixed(2)} €</p>
            </div>
            <div>
              <Label className="text-muted-foreground">TVA</Label>
              <p className="font-medium">{part.vatRate || "21"}%</p>
            </div>
            {part.weight && (
              <div>
                <Label className="text-muted-foreground">Poids</Label>
                <p className="font-medium">{part.weight} kg</p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Disponibilité</Label>
              <p className="font-medium">
                {part.stockQuantity > 0 ? (
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    En stock ({part.stockQuantity})
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                    Rupture de stock
                  </Badge>
                )}
              </p>
            </div>
          </div>

          {part.description && (
            <div>
              <Label className="text-muted-foreground">Description</Label>
              <p className="text-sm mt-1">{part.description}</p>
            </div>
          )}

          {part.compatibilities && part.compatibilities.length > 0 && (
            <div>
              <Label className="text-muted-foreground">Compatible avec</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {part.compatibilities.map((c: any, i: number) => (
                  <Badge key={i} variant="secondary">
                    {BRAND_LABELS[c.brand] || c.brand}
                    {c.productLine && ` — ${c.productLine}`}
                    {c.modelName && ` — ${c.modelName}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Pour commander cette pièce, veuillez créer un ticket SAV ou contacter votre gestionnaire de compte.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SpareParts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [selectedPartId, setSelectedPartId] = useState<number | null>(null);

  const { data: parts, isLoading } = trpc.spareParts.list.useQuery({
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    brand: brandFilter !== "all" ? brandFilter : undefined,
    search: searchQuery || undefined,
    isActive: true,
  });

  const handleResetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setBrandFilter("all");
  };

  const filteredParts = (parts || []).filter((p: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q);
  });

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Wrench className="h-8 w-8" />
            Pièces Détachées
          </h1>
          <p className="text-muted-foreground mt-1">
            Consultez notre catalogue de pièces de rechange pour tous les spas. Commandez via un ticket SAV.
          </p>
        </div>

        {/* Category Quick Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = categoryFilter === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(isActive ? "all" : cat.value)}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-sm ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card hover:bg-muted/50 border-border"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, référence..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Marque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les marques</SelectItem>
                  {Object.entries(BRAND_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleResetFilters}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredParts.length} pièce{filteredParts.length > 1 ? "s" : ""} trouvée{filteredParts.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Parts Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
            <p className="text-muted-foreground">Chargement du catalogue...</p>
          </div>
        ) : filteredParts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune pièce trouvée</h3>
              <p className="text-muted-foreground">
                {searchQuery || categoryFilter !== "all" || brandFilter !== "all"
                  ? "Essayez de modifier vos filtres de recherche."
                  : "Le catalogue de pièces détachées est en cours de constitution. Contactez votre gestionnaire pour toute demande."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredParts.map((part: any) => {
              const catInfo = CATEGORIES.find(c => c.value === part.category);
              const CatIcon = catInfo?.icon || Package;
              return (
                <Card key={part.id} className="hover:shadow-md transition-shadow group cursor-pointer" onClick={() => setSelectedPartId(part.id)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-muted/50">
                          <CatIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-base line-clamp-1">{part.name}</CardTitle>
                          <CardDescription className="text-xs">{part.reference}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    {part.imageUrl && (
                      <div className="rounded-lg overflow-hidden bg-muted/30 mb-3">
                        <img src={part.imageUrl} alt={part.name} className="w-full h-32 object-contain" />
                      </div>
                    )}
                    {part.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{part.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">{(parseFloat(part.priceHT) / 100).toFixed(2)} € <span className="text-xs font-normal text-muted-foreground">HT</span></span>
                      {part.stockQuantity > 0 ? (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs">
                          En stock
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-xs">
                          Indisponible
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" size="sm" className="w-full group-hover:bg-muted/50">
                      Voir les détails <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info Banner */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Comment commander des pièces ?</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Pour commander des pièces détachées, créez un <strong>ticket SAV</strong> en précisant le modèle de spa et le composant concerné.
                  Le système identifiera automatiquement les pièces compatibles. Si le remplacement est couvert par la garantie,
                  les pièces seront envoyées gratuitement. Sinon, un devis vous sera proposé avec paiement en ligne.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        {selectedPartId && (
          <SparePartDetailDialog
            partId={selectedPartId}
            open={!!selectedPartId}
            onOpenChange={() => setSelectedPartId(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
