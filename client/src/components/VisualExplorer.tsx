/**
 * VisualExplorer — Composant partenaire pour explorer les pièces d'un spa
 * via un parcours interactif : Couche → Zone → Hotspot → Fiche pièce
 */
import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  ChevronRight,
  MapPin,
  Loader2,
  Package,
  Info,
  ShoppingCart,
  ZoomIn,
} from "lucide-react";

// ============================================
// TYPES & CONSTANTS
// ============================================

const LAYER_CONFIG = {
  SHELL: {
    icon: "🛁",
    gradient: "from-blue-500/10 to-cyan-500/10",
    border: "border-blue-200 dark:border-blue-800",
    accent: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  TECHNICAL: {
    icon: "⚙️",
    gradient: "from-amber-500/10 to-orange-500/10",
    border: "border-amber-200 dark:border-amber-800",
    accent: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  EXTERIOR: {
    icon: "🏠",
    gradient: "from-emerald-500/10 to-green-500/10",
    border: "border-emerald-200 dark:border-emerald-800",
    accent: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
} as const;

type ExplorerStep = "layers" | "zones" | "hotspots";

// ============================================
// MAIN COMPONENT
// ============================================

export default function VisualExplorer({
  model,
  onBack,
  onFallbackToList,
}: {
  model: any;
  onBack: () => void;
  onFallbackToList: () => void;
}) {
  const [step, setStep] = useState<ExplorerStep>("layers");
  const [selectedLayer, setSelectedLayer] = useState<any>(null);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [detailPart, setDetailPart] = useState<any>(null);
  const [animating, setAnimating] = useState(false);

  const { data: explorerData, isLoading } = trpc.spaModels.getExplorerData.useQuery(
    { spaModelId: model.id },
    { staleTime: 5 * 60 * 1000 }
  );

  const layers = explorerData?.layers || [];
  const hasExplorerData = layers.some((l: any) => l.imageUrl && l.zones?.length > 0);

  // Animated transition helper
  const navigateTo = useCallback((newStep: ExplorerStep, delay = 300) => {
    setAnimating(true);
    setTimeout(() => {
      setStep(newStep);
      setAnimating(false);
    }, delay);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasExplorerData) {
    // Fallback to classic list
    onFallbackToList();
    return null;
  }

  // Breadcrumb
  const breadcrumb = (
    <div className="flex items-center gap-1.5 text-sm mb-6 flex-wrap">
      <button
        onClick={() => { onBack(); }}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        Pièces détachées
      </button>
      <ChevronRight className="w-3 h-3 text-muted-foreground" />
      <button
        onClick={() => { setStep("layers"); setSelectedLayer(null); setSelectedZone(null); }}
        className={`transition-colors ${step === "layers" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
      >
        {model.name}
      </button>
      {selectedLayer && (
        <>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <button
            onClick={() => { setStep("zones"); setSelectedZone(null); }}
            className={`transition-colors ${step === "zones" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
          >
            {selectedLayer.label}
          </button>
        </>
      )}
      {selectedZone && (
        <>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-foreground font-medium">{selectedZone.label}</span>
        </>
      )}
    </div>
  );

  return (
    <div className={`transition-opacity duration-300 ${animating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
      {breadcrumb}

      {step === "layers" && (
        <LayerSelection
          model={model}
          layers={layers}
          onSelectLayer={(layer: any) => {
            setSelectedLayer(layer);
            navigateTo("zones");
          }}
          onFallbackToList={onFallbackToList}
        />
      )}

      {step === "zones" && selectedLayer && (
        <ZoneExplorer
          layer={selectedLayer}
          model={model}
          onBack={() => { setSelectedLayer(null); navigateTo("layers"); }}
          onSelectZone={(zone: any) => {
            setSelectedZone(zone);
            navigateTo("hotspots");
          }}
        />
      )}

      {step === "hotspots" && selectedZone && selectedLayer && (
        <HotspotExplorer
          zone={selectedZone}
          layer={selectedLayer}
          model={model}
          onBack={() => { setSelectedZone(null); navigateTo("zones"); }}
          onViewPart={(part: any) => setDetailPart(part)}
        />
      )}

      {/* Part detail dialog */}
      {detailPart && (
        <PartDetailDialog
          part={detailPart}
          onClose={() => setDetailPart(null)}
        />
      )}
    </div>
  );
}

// ============================================
// LAYER SELECTION — 3 cartes animées
// ============================================

function LayerSelection({
  model,
  layers,
  onSelectLayer,
  onFallbackToList,
}: {
  model: any;
  layers: any[];
  onSelectLayer: (layer: any) => void;
  onFallbackToList: () => void;
}) {
  const activeLayers = layers.filter((l: any) => l.imageUrl && l.isActive);

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{model.name}</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Explorez votre spa couche par couche pour identifier et commander les pièces dont vous avez besoin.
        </p>
      </div>

      {/* Layer cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {activeLayers.map((layer: any, idx: number) => {
          const config = LAYER_CONFIG[layer.layerType as keyof typeof LAYER_CONFIG];
          const zoneCount = layer.zones?.length || 0;
          const hotspotCount = layer.zones?.reduce((sum: number, z: any) => sum + (z.hotspots?.length || 0), 0) || 0;

          return (
            <button
              key={layer.id}
              onClick={() => onSelectLayer(layer)}
              className="group text-left"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className={`rounded-2xl border-2 ${config?.border || "border-muted"} overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-card`}>
                {/* Image */}
                <div className={`h-48 md:h-56 bg-gradient-to-br ${config?.gradient || "from-muted to-muted"} flex items-center justify-center overflow-hidden relative`}>
                  {layer.imageUrl ? (
                    <img
                      src={layer.imageUrl}
                      alt={layer.label}
                      className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <span className="text-6xl">{config?.icon || "📦"}</span>
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 bg-background/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm font-medium">
                      Explorer →
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{config?.icon || "📦"}</span>
                    <h3 className="text-lg font-semibold">{layer.label}</h3>
                  </div>
                  {layer.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{layer.description}</p>
                  )}
                  <div className="flex items-center gap-3 pt-1">
                    <Badge variant="secondary" className="text-xs">
                      {zoneCount} zone{zoneCount !== 1 ? "s" : ""}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {hotspotCount} pièce{hotspotCount !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Fallback link */}
      <div className="text-center pt-4">
        <button
          onClick={onFallbackToList}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
        >
          Voir la liste complète des pièces →
        </button>
      </div>
    </div>
  );
}

// ============================================
// ZONE EXPLORER — Vue de la couche avec zones cliquables
// ============================================

function ZoneExplorer({
  layer,
  model,
  onBack,
  onSelectZone,
}: {
  layer: any;
  model: any;
  onBack: () => void;
  onSelectZone: (zone: any) => void;
}) {
  const config = LAYER_CONFIG[layer.layerType as keyof typeof LAYER_CONFIG];
  const zones = layer.zones || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{config?.icon}</span>
            <h2 className="text-xl font-bold">{layer.label}</h2>
          </div>
          {layer.description && (
            <p className="text-sm text-muted-foreground mt-1">{layer.description}</p>
          )}
        </div>
      </div>

      {/* Interactive image with zone markers */}
      {layer.imageUrl && (
        <div className="rounded-2xl border-2 border-muted overflow-hidden bg-white dark:bg-card">
          <div className="px-4 py-3 border-b bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Cliquez sur une zone pour voir les pièces disponibles
            </p>
          </div>
          <div className="relative p-4">
            <div className="relative inline-block w-full">
              <img
                src={layer.imageUrl}
                alt={layer.label}
                className="w-full object-contain max-h-[600px]"
              />
              {/* Zone markers */}
              {zones.filter((z: any) => z.posX && z.posY && z.isActive).map((zone: any) => {
                const hotspotCount = zone.hotspots?.length || 0;
                return (
                  <TooltipProvider key={zone.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 group/zone z-10"
                          style={{ left: `${zone.posX}%`, top: `${zone.posY}%` }}
                          onClick={() => onSelectZone(zone)}
                        >
                          {/* Pulse ring */}
                          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: "2.5s", width: "48px", height: "48px", marginLeft: "-8px", marginTop: "-8px" }} />
                          {/* Main marker */}
                          <div className="relative w-10 h-10 rounded-full bg-primary border-3 border-white dark:border-gray-900 shadow-xl flex items-center justify-center group-hover/zone:scale-125 transition-all duration-300 cursor-pointer">
                            <span className="text-white text-xs font-bold">{hotspotCount}</span>
                          </div>
                          {/* Label below */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap">
                            <span className="bg-background/95 backdrop-blur-sm text-foreground text-[11px] font-medium px-2 py-0.5 rounded-full shadow-sm border opacity-0 group-hover/zone:opacity-100 transition-opacity">
                              {zone.label}
                            </span>
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="font-medium">{zone.label}</p>
                        {zone.description && <p className="text-xs text-muted-foreground">{zone.description}</p>}
                        <p className="text-xs text-muted-foreground mt-1">{hotspotCount} pièce{hotspotCount !== 1 ? "s" : ""}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Zone cards grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Zones disponibles ({zones.filter((z: any) => z.isActive).length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.filter((z: any) => z.isActive).map((zone: any) => {
            const hotspotCount = zone.hotspots?.length || 0;
            return (
              <button
                key={zone.id}
                onClick={() => onSelectZone(zone)}
                className="group text-left rounded-xl border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{zone.label}</h4>
                    {zone.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{zone.description}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all shrink-0 mt-0.5" />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary" className="text-[10px]">
                    <MapPin className="w-2.5 h-2.5 mr-0.5" />
                    {hotspotCount} pièce{hotspotCount !== 1 ? "s" : ""}
                  </Badge>
                  {zone.imageUrl && (
                    <Badge variant="secondary" className="text-[10px]">
                      <ZoomIn className="w-2.5 h-2.5 mr-0.5" /> Vue détaillée
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================
// HOTSPOT EXPLORER — Vue d'une zone avec pièces
// ============================================

function HotspotExplorer({
  zone,
  layer,
  model,
  onBack,
  onViewPart,
}: {
  zone: any;
  layer: any;
  model: any;
  onBack: () => void;
  onViewPart: (part: any) => void;
}) {
  const config = LAYER_CONFIG[layer.layerType as keyof typeof LAYER_CONFIG];
  const hotspots = zone.hotspots || [];
  const displayImage = zone.imageUrl || layer.imageUrl;
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">{zone.label}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hotspots.length} pièce{hotspots.length !== 1 ? "s" : ""} identifiée{hotspots.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Image with hotspot markers */}
      {displayImage && (
        <div className="rounded-2xl border-2 border-muted overflow-hidden bg-white dark:bg-card">
          <div className="relative p-4">
            <div className="relative inline-block w-full">
              <img
                src={displayImage}
                alt={zone.label}
                className="w-full object-contain max-h-[500px]"
              />
              {/* Hotspot markers */}
              {hotspots.map((hs: any, idx: number) => (
                <TooltipProvider key={hs.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-300 ${
                          hoveredId === hs.id ? "scale-150" : "hover:scale-125"
                        }`}
                        style={{ left: `${hs.posX}%`, top: `${hs.posY}%` }}
                        onClick={() => onViewPart(hs)}
                        onMouseEnter={() => setHoveredId(hs.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        <div className="relative">
                          <div className={`w-9 h-9 rounded-full border-2 border-white dark:border-gray-900 shadow-xl flex items-center justify-center text-white text-xs font-bold transition-colors ${
                            hoveredId === hs.id ? "bg-primary ring-4 ring-primary/20" : "bg-primary/80"
                          }`}>
                            {idx + 1}
                          </div>
                          {hoveredId !== hs.id && (
                            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: "3s" }} />
                          )}
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="font-medium text-sm">{hs.label || hs.partName}</p>
                      <p className="text-xs text-muted-foreground">{hs.partReference}</p>
                      <p className="text-xs font-medium mt-1">{parseFloat(hs.partPriceHT || 0).toFixed(2)} € HT</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Parts list */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Pièces de cette zone
        </h3>
        <div className="space-y-2">
          {hotspots.map((hs: any, idx: number) => (
            <button
              key={hs.id}
              onClick={() => onViewPart(hs)}
              onMouseEnter={() => setHoveredId(hs.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`w-full text-left flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 ${
                hoveredId === hs.id
                  ? "border-primary/50 bg-primary/5 shadow-md"
                  : "bg-card hover:bg-muted/30 hover:shadow-sm"
              }`}
            >
              {/* Number */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                hoveredId === hs.id ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
              }`}>
                {idx + 1}
              </div>

              {/* Image */}
              {hs.partImageUrl && (
                <div className="w-14 h-14 rounded-lg bg-muted/30 overflow-hidden shrink-0">
                  <img src={hs.partImageUrl} alt="" className="w-full h-full object-contain p-1" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{hs.label || hs.partName}</p>
                <p className="text-xs text-muted-foreground font-mono">{hs.partReference}</p>
                {hs.partCategory && (
                  <Badge variant="secondary" className="text-[10px] mt-1">{hs.partCategory}</Badge>
                )}
              </div>

              {/* Price */}
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm">{parseFloat(hs.partPriceHT || 0).toFixed(2)} €</p>
                <p className="text-[10px] text-muted-foreground">HT</p>
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// PART DETAIL DIALOG
// ============================================

function PartDetailDialog({
  part,
  onClose,
}: {
  part: any;
  onClose: () => void;
}) {
  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{part.label || part.partName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {part.partImageUrl && (
            <div className="rounded-lg border bg-muted/20 overflow-hidden">
              <img src={part.partImageUrl} alt="" className="w-full max-h-48 object-contain p-4" />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Référence</span>
              <span className="text-sm font-mono font-medium">{part.partReference}</span>
            </div>
            {part.partCategory && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Catégorie</span>
                <Badge variant="secondary" className="text-xs">{part.partCategory}</Badge>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Prix HT</span>
              <span className="text-lg font-bold">{parseFloat(part.partPriceHT || 0).toFixed(2)} €</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
