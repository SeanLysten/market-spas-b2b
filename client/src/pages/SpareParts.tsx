import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Package, Filter, ShoppingCart, Info, RotateCcw, Wrench, Cpu, Droplets,
  Zap, Thermometer, Wind, Eye, ChevronRight, X, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

// ===== CONSTANTS =====
const BRAND_LABELS: Record<string, string> = {
  MARKET_SPAS: "Market Spas",
  WELLIS_CLASSIC: "Wellis Classic",
  WELLIS_LIFE: "Wellis Life",
  WELLIS_WIBES: "Wellis Wibes",
  PASSION_SPAS: "Passion Spas",
  PLATINUM_SPAS: "Platinum Spas",
};

const CATEGORY_LABELS: Record<string, { label: string; icon: any }> = {
  PUMPS: { label: "Pompes", icon: Droplets },
  ELECTRONICS: { label: "Électronique / Cartes mères", icon: Cpu },
  JETS: { label: "Jets", icon: Wind },
  SCREENS: { label: "Écrans / Afficheurs", icon: Eye },
  HEATING: { label: "Chauffage", icon: Thermometer },
  PLUMBING: { label: "Plomberie", icon: Wrench },
  COVERS: { label: "Couvertures thermiques", icon: Package },
  CABINETS: { label: "Habillage", icon: Package },
  LIGHTING: { label: "Éclairage LED", icon: Zap },
  AUDIO: { label: "Système audio", icon: Wind },
  OZONE_UVC: { label: "Ozone / UVC", icon: Droplets },
  OTHER: { label: "Autres", icon: Package },
};

// ===== DETAIL DIALOG =====
function SparePartDetailDialog({ partId, open, onOpenChange }: {
  partId: number; open: boolean; onOpenChange: (open: boolean) => void;
}) {
  const { data: part } = trpc.spareParts.getById.useQuery({ id: partId }, { enabled: open });

  if (!part) return null;

  const catInfo = CATEGORY_LABELS[(part as any).category] || { label: (part as any).category, icon: Package };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-display text-display">{(part as any).name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {(part as any).imageUrl && (
            <div className="rounded-lg overflow-hidden bg-muted/30">
              <img src={(part as any).imageUrl} alt={(part as any).name} className="w-full h-48 object-contain" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Référence</Label>
              <p className="font-medium font-mono">{(part as any).reference}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Catégorie</Label>
              <p className="font-medium">{catInfo.label}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Prix HT</Label>
              <p className="font-medium text-lg">{parseFloat((part as any).priceHT).toFixed(2)} €</p>
            </div>
            <div>
              <Label className="text-muted-foreground">TVA</Label>
              <p className="font-medium">{(part as any).vatRate || "21"}%</p>
            </div>
            {(part as any).weight && (
              <div>
                <Label className="text-muted-foreground">Poids</Label>
                <p className="font-medium">{(part as any).weight} kg</p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Disponibilité</Label>
              <p className="font-medium">
                {(part as any).stockQuantity > 0 ? (
                  <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/20">
                    En stock ({(part as any).stockQuantity})
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-destructive dark:text-destructive border-destructive/20 dark:border-destructive/30 bg-destructive/10 dark:bg-destructive/20">
                    Rupture de stock
                  </Badge>
                )}
              </p>
            </div>
          </div>

          {(part as any).description && (
            <div>
              <Label className="text-muted-foreground">Description</Label>
              <p className="text-sm mt-1">{(part as any).description}</p>
            </div>
          )}

          {(part as any).compatibility && (part as any).compatibility.length > 0 && (
            <div>
              <Label className="text-muted-foreground">Compatible avec</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {(part as any).compatibility.map((c: any, i: number) => (
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

// ===== MAIN COMPONENT =====
export default function SpareParts() {
  // toast from sonner is imported at top level
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState("");
  const [selectedPartId, setSelectedPartId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"catalog" | "by-model">("catalog");

  // Query all parts
  const { data: allParts, isLoading } = trpc.spareParts.list.useQuery({
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    brand: brandFilter !== "all" ? brandFilter : undefined,
    search: searchQuery || undefined,
    isActive: true,
    modelName: modelFilter || undefined,
  });

  const parts = allParts || [];

  const handleResetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setBrandFilter("all");
    setModelFilter("");
  };

  const hasActiveFilters = searchQuery || categoryFilter !== "all" || brandFilter !== "all" || modelFilter;

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Wrench className="h-8 w-8" />
            Pièces Détachées
          </h1>
          <p className="text-muted-foreground mt-1">
            Consultez notre catalogue de pièces de rechange pour tous les modèles de spas.
          </p>
        </div>

        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={(v) => { setViewMode(v as any); handleResetFilters(); }} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-1 md:grid-cols-2">
            <TabsTrigger value="catalog">
              <Package className="h-4 w-4 mr-2" />
              Catalogue complet
            </TabsTrigger>
            <TabsTrigger value="by-model">
              <Filter className="h-4 w-4 mr-2" />
              Par modèle de spa
            </TabsTrigger>
          </TabsList>

          {/* ===== CATALOGUE VIEW ===== */}
          <TabsContent value="catalog" className="space-y-6 mt-6">
            {/* Category Quick Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.entries(CATEGORY_LABELS).map(([key, { label, icon: Icon }]) => {
                const isActive = categoryFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setCategoryFilter(isActive ? "all" : key)}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-sm ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-card hover:bg-muted/50 border-border"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium truncate">{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search and Brand Filter */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
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
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Marque" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les marques</SelectItem>
                      {Object.entries(BRAND_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={handleResetFilters}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Réinitialiser
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== BY MODEL VIEW ===== */}
          <TabsContent value="by-model" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rechercher par modèle de spa</CardTitle>
                <CardDescription>
                  Sélectionnez la marque et entrez le modèle pour trouver toutes les pièces compatibles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Marque du spa</Label>
                    <Select value={brandFilter} onValueChange={(v) => { setBrandFilter(v); setModelFilter(""); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une marque" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les marques</SelectItem>
                        {Object.entries(BRAND_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Modèle du spa</Label>
                    <Input
                      placeholder="Ex: Everest, Kilimanjaro..."
                      value={modelFilter}
                      onChange={(e) => setModelFilter(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Catégorie de pièce</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les catégories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les catégories</SelectItem>
                        {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {hasActiveFilters && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <span className="text-sm text-muted-foreground">Filtres actifs :</span>
                    {brandFilter !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        {BRAND_LABELS[brandFilter]}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setBrandFilter("all")} />
                      </Badge>
                    )}
                    {modelFilter && (
                      <Badge variant="secondary" className="gap-1">
                        Modèle: {modelFilter}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setModelFilter("")} />
                      </Badge>
                    )}
                    {categoryFilter !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        {CATEGORY_LABELS[categoryFilter]?.label}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setCategoryFilter("all")} />
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                      Tout effacer
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs md:text-sm text-muted-foreground">
            {parts.length} pièce{parts.length > 1 ? "s" : ""} trouvée{parts.length > 1 ? "s" : ""}
            {modelFilter && ` pour le modèle "${modelFilter}"`}
            {brandFilter !== "all" && ` (${BRAND_LABELS[brandFilter]})`}
          </p>
        </div>

        {/* Parts Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
            <p className="text-muted-foreground">Chargement du catalogue...</p>
          </div>
        ) : parts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune pièce trouvée</h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? "Aucune pièce ne correspond à vos critères. Essayez de modifier vos filtres."
                  : "Le catalogue de pièces détachées est en cours de constitution."}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={handleResetFilters}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser les filtres
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {parts.map((part: any) => {
              const catInfo = CATEGORY_LABELS[part.category] || { label: part.category, icon: Package };
              const CatIcon = catInfo.icon;
              return (
                <Card
                  key={part.id}
                  className="hover:shadow-md transition-shadow group cursor-pointer"
                  onClick={() => setSelectedPartId(part.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-2 rounded-lg bg-muted/50 shrink-0">
                          <CatIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base line-clamp-1">{part.name}</CardTitle>
                          <CardDescription className="text-xs font-mono">{part.reference}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    {part.imageUrl && (
                      <div className="rounded-lg overflow-hidden bg-muted/30 mb-3">
                        <img
                          src={part.imageUrl}
                          alt={part.name}
                          className="w-full h-32 object-contain"
                          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                        />
                      </div>
                    )}
                    {part.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{part.description}</p>
                    )}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <span className="text-base font-semibold text-display">
                        {parseFloat(part.priceHT).toFixed(2)} €{" "}
                        <span className="text-xs font-normal text-muted-foreground">HT</span>
                      </span>
                      {part.stockQuantity > 0 ? (
                        <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/20 text-xs">
                          En stock
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-destructive dark:text-destructive border-destructive/20 dark:border-destructive/30 bg-destructive/10 dark:bg-destructive/20 text-xs">
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
        <Card className="mt-8 bg-info/10 dark:bg-info-light border-info/20 dark:border-info/30">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-info dark:text-info-dark mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900">Comment commander des pièces ?</h4>
                <p className="text-sm text-info dark:text-info-dark mt-1">
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
