import { useState } from "react";
import { trpc } from "@/lib/trpc";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search, Package, ChevronRight, Info,
  Wrench, Cpu, Droplets, Zap, Thermometer, Wind, Eye, Users, Ruler,
  Box, ArrowLeft, Loader2, AlertCircle, Check
} from "lucide-react";

// ===== CONSTANTS =====
const BRAND_LABELS: Record<string, string> = {
  MARKET_SPAS: "Market Spas",
  WELLIS_CLASSIC: "Wellis Classic",
  WELLIS_LIFE: "Wellis Life",
  WELLIS_WIBES: "Wellis Wibes",
  PASSION_SPAS: "Passion Spas",
  PLATINUM_SPAS: "Platinum Spas",
};

const BRAND_COLORS: Record<string, string> = {
  MARKET_SPAS: "from-blue-500 to-blue-700",
  WELLIS_CLASSIC: "from-purple-500 to-purple-700",
  WELLIS_LIFE: "from-green-500 to-green-700",
  WELLIS_WIBES: "from-orange-500 to-orange-700",
  PASSION_SPAS: "from-red-500 to-red-700",
  PLATINUM_SPAS: "from-gray-500 to-gray-700",
};

const CATEGORY_INFO: Record<string, { label: string; icon: any; color: string }> = {
  PUMPS: { label: "Pompes", icon: Droplets, color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950" },
  ELECTRONICS: { label: "Électronique", icon: Cpu, color: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950" },
  JETS: { label: "Jets", icon: Wind, color: "text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-950" },
  SCREENS: { label: "Écrans / Afficheurs", icon: Eye, color: "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950" },
  HEATING: { label: "Chauffage", icon: Thermometer, color: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950" },
  PLUMBING: { label: "Plomberie", icon: Wrench, color: "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950" },
  COVERS: { label: "Couvertures", icon: Package, color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950" },
  CABINETS: { label: "Habillage", icon: Box, color: "text-stone-600 bg-stone-50 dark:text-stone-400 dark:bg-stone-950" },
  LIGHTING: { label: "Éclairage LED", icon: Zap, color: "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950" },
  AUDIO: { label: "Audio", icon: Wind, color: "text-pink-600 bg-pink-50 dark:text-pink-400 dark:bg-pink-950" },
  OZONE_UVC: { label: "Ozone / UVC", icon: Droplets, color: "text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-950" },
  OTHER: { label: "Autres", icon: Package, color: "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950" },
};

// ===== STEP 1: BRAND SELECTION =====
function BrandSelection({ onSelect }: { onSelect: (brand: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl md:text-2xl font-bold">Sélectionnez votre marque</h2>
        <p className="text-sm text-muted-foreground">Choisissez la marque de votre spa pour trouver les pièces compatibles</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {Object.entries(BRAND_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-lg transition-all duration-300 p-6 text-left"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${BRAND_COLORS[key]} opacity-0 group-hover:opacity-10 transition-opacity`} />
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${BRAND_COLORS[key]} flex items-center justify-center text-white`}>
                <Box className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base">{label}</h3>
                <p className="text-xs text-muted-foreground">Voir les modèles</p>
              </div>
              <ChevronRight className="w-5 h-5 ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ===== STEP 2: MODEL SELECTION =====
function ModelSelection({
  brand,
  onSelect,
  onBack,
}: {
  brand: string;
  onSelect: (model: any) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = useState("");
  const { data: models, isLoading } = trpc.spaModels.listWithPartCount.useQuery({ brand });

  const filtered = (models || []).filter((m: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return m.name.toLowerCase().includes(s) || (m.series || "").toLowerCase().includes(s);
  });

  // Grouper par série
  const grouped = new Map<string, any[]>();
  for (const m of filtered) {
    const series = m.series || "Autres";
    const list = grouped.get(series) || [];
    list.push(m);
    grouped.set(series, list);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour
        </Button>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Badge className={`bg-gradient-to-r ${BRAND_COLORS[brand]} text-white border-0`}>
              {BRAND_LABELS[brand]}
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground">Sélectionnez votre modèle de spa</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un modèle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-lg font-medium text-gray-500">Aucun modèle trouvé</p>
          <p className="text-sm text-muted-foreground">
            {search ? "Essayez un autre terme de recherche" : "Aucun modèle n'a été enregistré pour cette marque"}
          </p>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([series, seriesModels]) => (
          <div key={series} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{series}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {seriesModels.map((model: any) => (
                <button
                  key={model.id}
                  onClick={() => model.partCount > 0 ? onSelect(model) : null}
                  disabled={model.partCount === 0}
                  className={`group relative overflow-hidden rounded-xl border bg-card text-left transition-all duration-300 ${
                    model.partCount > 0
                      ? "hover:shadow-lg cursor-pointer"
                      : "opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="h-36 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center overflow-hidden">
                    {model.imageUrl ? (
                      <img src={model.imageUrl} alt={model.name} className="w-full h-full object-contain p-3" />
                    ) : (
                      <Box className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-semibold text-base">{model.name}</h4>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {model.seats && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {model.seats} places
                        </span>
                      )}
                      {model.dimensions && (
                        <span className="flex items-center gap-1">
                          <Ruler className="w-3 h-3" /> {model.dimensions}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={model.partCount > 0 ? "default" : "secondary"} className="text-xs">
                        {model.partCount} pièce{model.partCount !== 1 ? "s" : ""}
                      </Badge>
                      {model.partCount > 0 && (
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ===== STEP 3: PARTS LIST =====
function PartsList({
  model,
  brand,
  onBack,
}: {
  model: any;
  brand: string;
  onBack: () => void;
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [detailPart, setDetailPart] = useState<any>(null);

  const { data: parts, isLoading } = trpc.spaModels.getParts.useQuery({ spaModelId: model.id });

  const filtered = (parts || []).filter((p: any) => {
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return p.name.toLowerCase().includes(s) || p.reference.toLowerCase().includes(s);
    }
    return true;
  });

  // Grouper par catégorie
  const grouped = new Map<string, any[]>();
  for (const p of filtered) {
    const list = grouped.get(p.category) || [];
    list.push(p);
    grouped.set(p.category, list);
  }

  // Catégories disponibles
  const availableCategories = [...new Set((parts || []).map((p: any) => p.category))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0 self-start">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`bg-gradient-to-r ${BRAND_COLORS[brand]} text-white border-0`}>
              {BRAND_LABELS[brand]}
            </Badge>
            <h2 className="text-xl font-bold">{model.name}</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {parts?.length || 0} pièce{(parts?.length || 0) !== 1 ? "s" : ""} détachée{(parts?.length || 0) !== 1 ? "s" : ""} disponible{(parts?.length || 0) !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Recherche + filtres catégorie */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une pièce..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              categoryFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            Toutes ({parts?.length || 0})
          </button>
          {availableCategories.map((cat) => {
            const info = CATEGORY_INFO[cat] || { label: cat, icon: Package, color: "text-gray-600 bg-gray-50" };
            const count = (parts || []).filter((p: any) => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat === categoryFilter ? "all" : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  categoryFilter === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                {info.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste des pièces */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Search className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-lg font-medium text-gray-500">Aucune pièce trouvée</p>
          <p className="text-sm text-muted-foreground">Essayez un autre terme de recherche ou catégorie</p>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([category, categoryParts]) => {
          const info = CATEGORY_INFO[category] || { label: category, icon: Package, color: "text-gray-600 bg-gray-50" };
          const Icon = info.icon;
          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${info.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-base">{info.label}</h3>
                <Badge variant="secondary" className="text-xs">{categoryParts.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryParts.map((part: any) => (
                  <Card
                    key={part.sparePartId}
                    className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setDetailPart(part)}
                  >
                    <CardContent className="p-0">
                      {part.imageUrl && (
                        <div className="h-32 bg-muted/30 flex items-center justify-center overflow-hidden">
                          <img src={part.imageUrl} alt={part.name} className="w-full h-full object-contain p-2" />
                        </div>
                      )}
                      <div className="p-4 space-y-2">
                        <h4 className="font-medium text-sm leading-tight">{part.name}</h4>
                        <p className="text-xs text-muted-foreground font-mono">{part.reference}</p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-lg font-bold">{parseFloat(part.priceHT).toFixed(2)} €</span>
                          <span className="text-xs text-muted-foreground">HT</span>
                        </div>

                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Info box */}
      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/50">
        <CardContent className="p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-medium text-blue-900 dark:text-blue-100">Comment commander des pièces ?</h4>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Pour commander des pièces détachées, créez un <strong>ticket SAV</strong> en précisant le modèle de spa et le composant concerné.
              Si la pièce est couverte par la garantie, elle sera envoyée gratuitement. Sinon, un devis vous sera proposé.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {detailPart && (
        <Dialog open={!!detailPart} onOpenChange={() => setDetailPart(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{detailPart.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {detailPart.imageUrl && (
                <div className="rounded-lg overflow-hidden bg-muted/30">
                  <img src={detailPart.imageUrl} alt={detailPart.name} className="w-full h-48 object-contain" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Référence</Label>
                  <p className="font-medium font-mono">{detailPart.reference}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Catégorie</Label>
                  <p className="font-medium">{CATEGORY_INFO[detailPart.category]?.label || detailPart.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Prix HT</Label>
                  <p className="font-medium text-lg">{parseFloat(detailPart.priceHT).toFixed(2)} €</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">TVA</Label>
                  <p className="font-medium text-xs">Selon pays (FR: 20%, autres: 0%)</p>
                </div>

              </div>
              {detailPart.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="text-sm mt-1">{detailPart.description}</p>
                </div>
              )}
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Pour commander cette pièce, créez un ticket SAV ou contactez votre gestionnaire de compte.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function SpareParts() {
  const [step, setStep] = useState<"brand" | "model" | "parts">("brand");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<any>(null);

  const handleSelectBrand = (brand: string) => {
    setSelectedBrand(brand);
    setStep("model");
  };

  const handleSelectModel = (model: any) => {
    setSelectedModel(model);
    setStep("parts");
  };

  const handleBackToModels = () => {
    setSelectedModel(null);
    setStep("model");
  };

  const handleBackToBrands = () => {
    setSelectedBrand("");
    setStep("brand");
  };

  // Breadcrumb
  const breadcrumb = (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
      <button
        onClick={() => { setStep("brand"); setSelectedBrand(""); setSelectedModel(null); }}
        className={`hover:text-foreground transition-colors ${step === "brand" ? "text-foreground font-medium" : ""}`}
      >
        Pièces détachées
      </button>
      {selectedBrand && (
        <>
          <ChevronRight className="w-3 h-3" />
          <button
            onClick={() => { setStep("model"); setSelectedModel(null); }}
            className={`hover:text-foreground transition-colors ${step === "model" ? "text-foreground font-medium" : ""}`}
          >
            {BRAND_LABELS[selectedBrand]}
          </button>
        </>
      )}
      {selectedModel && (
        <>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">{selectedModel.name}</span>
        </>
      )}
    </div>
  );

  return (
    <>
      <div className="p-4 md:p-6">
        {breadcrumb}
        {step === "brand" && <BrandSelection onSelect={handleSelectBrand} />}
        {step === "model" && (
          <ModelSelection brand={selectedBrand} onSelect={handleSelectModel} onBack={handleBackToBrands} />
        )}
        {step === "parts" && selectedModel && (
          <PartsList model={selectedModel} brand={selectedBrand} onBack={handleBackToModels} />
        )}
      </div>
    </>
  );
}
