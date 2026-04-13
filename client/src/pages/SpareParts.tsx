import { useState, lazy, Suspense } from "react";
import { trpc } from "@/lib/trpc";
import { LAYERS, groupPartsByLayer, getLayerPartCount, type LayerKey } from "@/lib/spare-parts-layers";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search, Package, ChevronRight, ChevronDown, Info,
  Users, Ruler, Box, ArrowLeft, Loader2, FileImage
} from "lucide-react";

// ===== MODEL SELECTION =====
function ModelSelection({ onSelect }: { onSelect: (model: any) => void }) {
  const [search, setSearch] = useState("");
  const { data: models, isLoading } = trpc.spaModels.listWithPartCount.useQuery({ brand: "MARKET_SPAS" });

  const filtered = (models || []).filter((m: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return m.name.toLowerCase().includes(s) || (m.series || "").toLowerCase().includes(s) || (m.dimensions || "").toLowerCase().includes(s);
  });

  const grouped = new Map<string, any[]>();
  for (const m of filtered) {
    const series = m.series || "Autres";
    const list = grouped.get(series) || [];
    list.push(m);
    grouped.set(series, list);
  }

  const totalParts = (models || []).reduce((sum: number, m: any) => sum + (m.partCount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl md:text-2xl font-bold">Pièces détachées Market Spas</h2>
        <p className="text-sm text-muted-foreground">
          {models?.length || 0} modèle{(models?.length || 0) !== 1 ? "s" : ""} disponible{(models?.length || 0) !== 1 ? "s" : ""} — {totalParts} pièce{totalParts !== 1 ? "s" : ""} au catalogue
        </p>
      </div>

      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher un modèle..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-lg font-medium text-gray-500">Aucun modèle trouvé</p>
          <p className="text-sm text-muted-foreground">{search ? "Essayez un autre terme de recherche" : "Aucun modèle n'a été enregistré"}</p>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([series, seriesModels]) => (
          <div key={series} className="space-y-3">
            {grouped.size > 1 && <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{series}</h3>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {seriesModels.map((model: any) => (
                <button
                  key={model.id}
                  onClick={() => model.partCount > 0 ? onSelect(model) : null}
                  disabled={model.partCount === 0}
                  className={`group relative overflow-hidden rounded-xl border bg-card text-left transition-all duration-300 ${model.partCount > 0 ? "hover:shadow-lg cursor-pointer" : "opacity-60 cursor-not-allowed"}`}
                >
                  <div className="h-40 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center overflow-hidden">
                    {model.schemaImageUrl ? (
                      <img src={model.schemaImageUrl} alt={model.name} className="w-full h-full object-contain p-2" />
                    ) : model.imageUrl ? (
                      <img src={model.imageUrl} alt={model.name} className="w-full h-full object-contain p-3" />
                    ) : (
                      <Box className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-semibold text-base">{model.name}</h4>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {model.seats && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {model.seats} places</span>}
                      {model.dimensions && <span className="flex items-center gap-1"><Ruler className="w-3 h-3" /> {model.dimensions}</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={model.partCount > 0 ? "default" : "secondary"} className="text-xs">{model.partCount} pièce{model.partCount !== 1 ? "s" : ""}</Badge>
                      {model.partCount > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />}
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

// ===== PARTS LIST WITH LAYER TREE =====
function PartsList({ model, onBack }: { model: any; onBack: () => void }) {
  const [search, setSearch] = useState("");
  const [expandedLayers, setExpandedLayers] = useState<Set<LayerKey>>(new Set(["SHELL", "TECHNICAL", "EXTERIOR"]));
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());
  const [detailPart, setDetailPart] = useState<any>(null);

  const { data: parts, isLoading } = trpc.spaModels.getParts.useQuery({ spaModelId: model.id });

  // Filter by search
  const filtered = (parts || []).filter((p: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.name.toLowerCase().includes(s) || p.reference.toLowerCase().includes(s);
  });

  // Group into layer tree
  const tree = groupPartsByLayer(filtered);

  const toggleLayer = (key: LayerKey) => {
    const next = new Set(expandedLayers);
    if (next.has(key)) next.delete(key); else next.add(key);
    setExpandedLayers(next);
  };

  const toggleSub = (key: string) => {
    const next = new Set(expandedSubs);
    if (next.has(key)) next.delete(key); else next.add(key);
    setExpandedSubs(next);
  };

  // Auto-expand subcategories that have parts when searching
  const getVisibleSubKey = (layerKey: LayerKey, subKey: string) => `${layerKey}:${subKey}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0 self-start">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{model.name}</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
            {model.seats && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {model.seats} places</span>}
            {model.dimensions && <span className="flex items-center gap-1"><Ruler className="w-3 h-3" /> {model.dimensions}</span>}
            <span>{parts?.length || 0} pièce{(parts?.length || 0) !== 1 ? "s" : ""} détachée{(parts?.length || 0) !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Schéma technique */}
      {model.schemaImageUrl && (
        <div className="rounded-xl border bg-white dark:bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileImage className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Schéma technique — {model.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">{model.dimensions}</span>
          </div>
          <div className="p-4 flex items-center justify-center bg-white dark:bg-muted/10">
            <img
              src={model.schemaImageUrl}
              alt={`Schéma technique ${model.name}`}
              className="max-w-full max-h-[500px] object-contain cursor-zoom-in"
              onClick={(e) => {
                const img = e.currentTarget;
                if (img.style.maxHeight === "none") { img.style.maxHeight = "500px"; img.style.cursor = "zoom-in"; }
                else { img.style.maxHeight = "none"; img.style.cursor = "zoom-out"; }
              }}
            />
          </div>
        </div>
      )}

      {/* Filtre rapide */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher une pièce (nom, référence)..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Layer summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {LAYERS.map((layer) => {
          const count = getLayerPartCount(tree, layer.key);
          const LayerIcon = layer.icon;
          return (
            <button
              key={layer.key}
              onClick={() => {
                toggleLayer(layer.key);
                // Scroll to the layer section
                document.getElementById(`layer-${layer.key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`p-4 rounded-xl border text-left transition-all hover:shadow-md ${layer.bgColor} ${expandedLayers.has(layer.key) ? "ring-2 ring-primary/30" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white/80 dark:bg-black/20 ${layer.color}`}>
                  <LayerIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{layer.label}</h3>
                  <p className="text-xs text-muted-foreground truncate">{count} pièce{count !== 1 ? "s" : ""}</p>
                </div>
                {expandedLayers.has(layer.key) ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Search className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-lg font-medium text-gray-500">Aucune pièce trouvée</p>
          <p className="text-sm text-muted-foreground">Essayez un autre terme de recherche</p>
        </div>
      ) : (
        /* Layer tree */
        <div className="space-y-6">
          {LAYERS.map((layer) => {
            const layerMap = tree.get(layer.key);
            const layerCount = getLayerPartCount(tree, layer.key);
            if (layerCount === 0 && search) return null; // Hide empty layers when searching
            const isExpanded = expandedLayers.has(layer.key);
            const LayerIcon = layer.icon;

            return (
              <div key={layer.key} id={`layer-${layer.key}`} className="space-y-3">
                {/* Layer header */}
                <button
                  onClick={() => toggleLayer(layer.key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm ${layer.bgColor}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/80 dark:bg-black/20 ${layer.color}`}>
                    <LayerIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-sm">{layer.label}</h3>
                    <p className="text-xs text-muted-foreground">{layer.description}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{layerCount}</Badge>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </button>

                {/* Subcategories */}
                {isExpanded && layerMap && (
                  <div className="ml-4 md:ml-6 space-y-3 border-l-2 border-muted pl-4">
                    {layer.subcategories.map((sub) => {
                      const subParts = layerMap.get(sub.key) || [];
                      if (subParts.length === 0) return null;
                      const subFullKey = getVisibleSubKey(layer.key, sub.key);
                      const isSubExpanded = expandedSubs.has(subFullKey) || !!search; // Auto-expand when searching
                      const SubIcon = sub.icon;

                      return (
                        <div key={sub.key} className="space-y-2">
                          {/* Subcategory header */}
                          <button
                            onClick={() => toggleSub(subFullKey)}
                            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center ${sub.color}`}>
                              <SubIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-medium text-sm flex-1 text-left">{sub.label}</span>
                            <Badge variant="outline" className="text-xs">{subParts.length}</Badge>
                            {isSubExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                          </button>

                          {/* Parts grid */}
                          {isSubExpanded && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ml-2">
                              {subParts.map((part: any) => (
                                <Card
                                  key={part.sparePartId || part.linkId}
                                  className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                  onClick={() => setDetailPart(part)}
                                >
                                  <CardContent className="p-0">
                                    {part.imageUrl && (
                                      <div className="h-28 bg-muted/30 flex items-center justify-center overflow-hidden">
                                        <img src={part.imageUrl} alt={part.name} className="w-full h-full object-contain p-2" />
                                      </div>
                                    )}
                                    <div className="p-3 space-y-1.5">
                                      <h4 className="font-medium text-sm leading-tight line-clamp-2">{part.name}</h4>
                                      <p className="text-xs text-muted-foreground font-mono">{part.reference}</p>
                                      {part.quantity && <p className="text-xs text-muted-foreground">{part.quantity} PCS</p>}
                                      <div className="flex items-center justify-between pt-1">
                                        <span className="text-base font-bold">{parseFloat(part.priceHT || "0").toFixed(2)} €</span>
                                        <span className="text-xs text-muted-foreground">HT</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
                  <p className="font-medium">{detailPart.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Prix HT</Label>
                  <p className="font-medium text-lg">{parseFloat(detailPart.priceHT || "0").toFixed(2)} €</p>
                </div>
                {detailPart.quantity && (
                  <div>
                    <Label className="text-muted-foreground">Quantité</Label>
                    <p className="font-medium">{detailPart.quantity} PCS</p>
                  </div>
                )}
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

const VisualExplorer = lazy(() => import("@/components/VisualExplorer"));

// ===== MAIN COMPONENT =====
export default function SpareParts() {
  const [step, setStep] = useState<"models" | "explorer" | "parts">("models");
  const [selectedModel, setSelectedModel] = useState<any>(null);

  const handleSelectModel = (model: any) => {
    setSelectedModel(model);
    // Go directly to parts list with layer tree (explorer is for future interactive hotspots)
    setStep("parts");
  };

  const handleBackToModels = () => {
    setSelectedModel(null);
    setStep("models");
  };

  const handleFallbackToList = () => {
    setStep("parts");
  };

  const breadcrumb = step !== "explorer" ? (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
      <button
        onClick={() => { setStep("models"); setSelectedModel(null); }}
        className={`hover:text-foreground transition-colors ${step === "models" ? "text-foreground font-medium" : ""}`}
      >
        Pièces détachées
      </button>
      {selectedModel && (
        <>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">{selectedModel.name}</span>
        </>
      )}
    </div>
  ) : null;

  return (
    <div className="p-4 md:p-6">
      {breadcrumb}
      {step === "models" && <ModelSelection onSelect={handleSelectModel} />}
      {step === "explorer" && selectedModel && (
        <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>}>
          <VisualExplorer model={selectedModel} onBack={handleBackToModels} onFallbackToList={handleFallbackToList} />
        </Suspense>
      )}
      {step === "parts" && selectedModel && <PartsList model={selectedModel} onBack={handleBackToModels} />}
    </div>
  );
}
