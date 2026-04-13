import { useState, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { LAYERS, groupPartsByLayer, getLayerPartCount, classifyPart, type LayerKey } from "@/lib/spare-parts-layers";
import { motion, AnimatePresence } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search, Package, ChevronRight, Info,
  Users, Ruler, Box, ArrowLeft, Loader2, FileImage, ShoppingCart
} from "lucide-react";

/* ─── Animation tokens (Emil Kowalski philosophy) ─── */
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0, filter: "blur(4px)" }),
  center: { x: 0, opacity: 1, filter: "blur(0px)" },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0, filter: "blur(4px)" }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: EASE_OUT as unknown as number[] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

/* ─── Layer images (placeholder gradients when no image configured) ─── */
const LAYER_VISUALS: Record<string, { gradient: string; pattern: string }> = {
  SHELL: {
    gradient: "from-blue-500/90 via-cyan-500/80 to-teal-500/70",
    pattern: "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.1) 0%, transparent 60%)",
  },
  TECHNICAL: {
    gradient: "from-orange-500/90 via-amber-500/80 to-yellow-500/70",
    pattern: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.1) 0%, transparent 60%)",
  },
  EXTERIOR: {
    gradient: "from-emerald-600/90 via-green-500/80 to-lime-500/70",
    pattern: "radial-gradient(circle at 50% 60%, rgba(255,255,255,0.1) 0%, transparent 60%)",
  },
};

/* ═══════════════════════════════════════════════════════════
   MODEL SELECTION — Grid of spa models
   ═══════════════════════════════════════════════════════════ */
function ModelSelection({ onSelect }: { onSelect: (model: any) => void }) {
  const [search, setSearch] = useState("");
  const { data: models, isLoading } = trpc.spaModels.listWithPartCount.useQuery({ brand: "MARKET_SPAS" });

  const filtered = useMemo(() => {
    return (models || []).filter((m: any) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return m.name.toLowerCase().includes(s) || (m.series || "").toLowerCase().includes(s);
    });
  }, [models, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const m of filtered) {
      const series = m.series || "Autres";
      const list = map.get(series) || [];
      list.push(m);
      map.set(series, list);
    }
    return map;
  }, [filtered]);

  const totalParts = useMemo(() => (models || []).reduce((sum: number, m: any) => sum + (m.partCount || 0), 0), [models]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="text-center space-y-3">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Pièces détachées</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Sélectionnez votre modèle de spa pour accéder aux pièces détachées organisées par zone.
        </p>
        {!isLoading && (
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>{models?.length || 0} modèle{(models?.length || 0) !== 1 ? "s" : ""}</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <span>{totalParts} pièce{totalParts !== 1 ? "s" : ""} au catalogue</span>
          </div>
        )}
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp} custom={1} className="relative max-w-sm mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un modèle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-11 rounded-xl border-muted-foreground/20 focus-visible:ring-primary/30"
        />
      </motion.div>

      {/* Models */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div variants={fadeUp} custom={2} className="text-center py-20">
          <Package className="w-14 h-14 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Aucun modèle trouvé</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {search ? "Essayez un autre terme de recherche" : "Aucun modèle n'a été enregistré"}
          </p>
        </motion.div>
      ) : (
        Array.from(grouped.entries()).map(([series, seriesModels]) => (
          <motion.div key={series} variants={fadeUp} custom={2} className="space-y-4">
            {grouped.size > 1 && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest pl-1">{series}</h3>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {seriesModels.map((model: any, i: number) => (
                <motion.button
                  key={model.id}
                  variants={fadeUp}
                  custom={i + 3}
                  onClick={() => model.partCount > 0 ? onSelect(model) : null}
                  disabled={model.partCount === 0}
                  whileHover={model.partCount > 0 ? { y: -4, transition: { duration: 0.25, ease: EASE_OUT as unknown as number[] } } : undefined}
                  whileTap={model.partCount > 0 ? { scale: 0.97 } : undefined}
                  className={`group relative overflow-hidden rounded-2xl border bg-card text-left transition-shadow duration-300 ${
                    model.partCount > 0 ? "hover:shadow-xl hover:shadow-primary/5 cursor-pointer" : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  {/* Image */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center overflow-hidden relative">
                    {model.imageUrl || model.schemaImageUrl ? (
                      <img
                        src={model.imageUrl || model.schemaImageUrl}
                        alt={model.name}
                        className="w-full h-full object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <Box className="w-16 h-16 text-muted-foreground/20" />
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-2.5">
                    <h4 className="font-semibold text-base tracking-tight">{model.name}</h4>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {model.seats && (
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> {model.seats} places
                        </span>
                      )}
                      {model.dimensions && (
                        <span className="flex items-center gap-1.5">
                          <Ruler className="w-3.5 h-3.5" /> {model.dimensions}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <Badge
                        variant={model.partCount > 0 ? "default" : "secondary"}
                        className="text-xs font-medium"
                      >
                        {model.partCount} pièce{model.partCount !== 1 ? "s" : ""}
                      </Badge>
                      {model.partCount > 0 && (
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform duration-200" />
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LAYER EXPLORER — Visual layer cards with slide navigation
   ═══════════════════════════════════════════════════════════ */

type ExplorerStep = "layers" | "subcategories" | "parts";

function LayerExplorer({ model, onBack }: { model: any; onBack: () => void }) {
  const [step, setStep] = useState<ExplorerStep>("layers");
  const [selectedLayer, setSelectedLayer] = useState<LayerKey | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);
  const [search, setSearch] = useState("");
  const [detailPart, setDetailPart] = useState<any>(null);

  const { data: parts, isLoading } = trpc.spaModels.getParts.useQuery({ spaModelId: model.id });

  const tree = useMemo(() => groupPartsByLayer(parts || []), [parts]);

  // Navigation helpers
  const goToLayer = useCallback((key: LayerKey) => {
    setDirection(1);
    setSelectedLayer(key);
    setStep("subcategories");
  }, []);

  const goToSub = useCallback((subKey: string) => {
    setDirection(1);
    setSelectedSub(subKey);
    setStep("parts");
  }, []);

  const goBackToLayers = useCallback(() => {
    setDirection(-1);
    setSelectedLayer(null);
    setSelectedSub(null);
    setStep("layers");
  }, []);

  const goBackToSubs = useCallback(() => {
    setDirection(-1);
    setSelectedSub(null);
    setStep("subcategories");
  }, []);

  // Current layer and subcategory config
  const currentLayer = LAYERS.find((l) => l.key === selectedLayer);
  const currentSub = currentLayer?.subcategories.find((s) => s.key === selectedSub);

  // Parts for current subcategory
  const currentParts = useMemo(() => {
    if (!selectedLayer || !selectedSub) return [];
    const layerMap = tree.get(selectedLayer);
    return layerMap?.get(selectedSub) || [];
  }, [tree, selectedLayer, selectedSub]);

  // Filtered parts for search
  const filteredParts = useMemo(() => {
    if (!search) return currentParts;
    const s = search.toLowerCase();
    return currentParts.filter((p: any) =>
      p.name.toLowerCase().includes(s) || p.reference.toLowerCase().includes(s)
    );
  }, [currentParts, search]);

  // Global search across all parts
  const globalSearchResults = useMemo(() => {
    if (!search || step !== "layers") return null;
    const s = search.toLowerCase();
    const results = (parts || []).filter((p: any) =>
      p.name.toLowerCase().includes(s) || p.reference.toLowerCase().includes(s)
    );
    return results.length > 0 ? results : null;
  }, [parts, search, step]);

  // Breadcrumb
  const breadcrumbItems = useMemo(() => {
    const items: { label: string; onClick?: () => void }[] = [
      { label: "Pièces détachées", onClick: onBack },
      { label: model.name, onClick: step !== "layers" ? goBackToLayers : undefined },
    ];
    if (currentLayer && step !== "layers") {
      items.push({
        label: currentLayer.label,
        onClick: step === "parts" ? goBackToSubs : undefined,
      });
    }
    if (currentSub && step === "parts") {
      items.push({ label: currentSub.label });
    }
    return items;
  }, [step, model, currentLayer, currentSub, onBack, goBackToLayers, goBackToSubs]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE_OUT as unknown as number[] }}
        className="flex items-center gap-1.5 text-sm flex-wrap"
      >
        {breadcrumbItems.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground/50" />}
            {item.onClick ? (
              <button
                onClick={item.onClick}
                className="text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-foreground font-medium">{item.label}</span>
            )}
          </span>
        ))}
      </motion.nav>

      {/* Back button + model info */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT as unknown as number[] }}
        className="flex items-center gap-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={step === "layers" ? onBack : step === "subcategories" ? goBackToLayers : goBackToSubs}
          className="shrink-0 rounded-xl h-10 w-10 hover:bg-muted/80"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight truncate">
            {step === "layers" && model.name}
            {step === "subcategories" && currentLayer?.label}
            {step === "parts" && currentSub?.label}
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-0.5">
            {step === "layers" && (
              <>
                {model.seats && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {model.seats} places</span>}
                {model.dimensions && <span className="flex items-center gap-1"><Ruler className="w-3 h-3" /> {model.dimensions}</span>}
                <span>{parts?.length || 0} pièce{(parts?.length || 0) !== 1 ? "s" : ""}</span>
              </>
            )}
            {step === "subcategories" && currentLayer && (
              <span>{getLayerPartCount(tree, currentLayer.key)} pièce{getLayerPartCount(tree, currentLayer.key) !== 1 ? "s" : ""} dans cette couche</span>
            )}
            {step === "parts" && (
              <span>{currentParts.length} pièce{currentParts.length !== 1 ? "s" : ""}</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Search (visible at layers and parts level) */}
      {(step === "layers" || step === "parts") && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative max-w-sm"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={step === "layers" ? "Rechercher une pièce dans tout le catalogue..." : "Filtrer les pièces..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl border-muted-foreground/20"
          />
        </motion.div>
      )}

      {/* Animated content area */}
      <AnimatePresence mode="wait" custom={direction}>
        {/* ─── STEP: LAYERS ─── */}
        {step === "layers" && !globalSearchResults && (
          <motion.div
            key="layers"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: EASE_OUT as unknown as number[] }}
            className="space-y-5"
          >
            {/* Layer cards — large visual cards */}
            <div className="grid grid-cols-1 gap-4">
              {LAYERS.map((layer, i) => {
                const count = getLayerPartCount(tree, layer.key);
                const LayerIcon = layer.icon;
                const vis = LAYER_VISUALS[layer.key];

                return (
                  <motion.button
                    key={layer.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4, ease: EASE_OUT as unknown as number[] }}
                    onClick={() => count > 0 && goToLayer(layer.key)}
                    disabled={count === 0}
                    whileHover={count > 0 ? { scale: 1.01, transition: { duration: 0.2, ease: EASE_OUT as unknown as number[] } } : undefined}
                    whileTap={count > 0 ? { scale: 0.98 } : undefined}
                    className={`group relative overflow-hidden rounded-2xl text-left transition-shadow duration-300 ${
                      count > 0 ? "cursor-pointer hover:shadow-xl" : "opacity-50 cursor-not-allowed"
                    }`}
                  >
                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${vis.gradient}`} />
                    <div className="absolute inset-0" style={{ backgroundImage: vis.pattern }} />

                    {/* Content */}
                    <div className="relative z-10 flex items-center gap-5 p-6 md:p-8">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                        <LayerIcon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg md:text-xl font-bold text-white">{layer.label}</h3>
                        <p className="text-sm text-white/80 mt-0.5">{layer.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium text-white">
                            {count} pièce{count !== 1 ? "s" : ""}
                          </span>
                          {layer.subcategories.filter((s) => {
                            const layerMap = tree.get(layer.key);
                            return (layerMap?.get(s.key)?.length || 0) > 0;
                          }).length > 0 && (
                            <span className="text-xs text-white/60">
                              {layer.subcategories.filter((s) => {
                                const layerMap = tree.get(layer.key);
                                return (layerMap?.get(s.key)?.length || 0) > 0;
                              }).length} catégorie{layer.subcategories.filter((s) => {
                                const layerMap = tree.get(layer.key);
                                return (layerMap?.get(s.key)?.length || 0) > 0;
                              }).length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-white/60 group-hover:translate-x-1 group-hover:text-white transition-all duration-200 shrink-0" />
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Schema image (collapsible) */}
            {model.schemaImageUrl && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <details className="group rounded-xl border overflow-hidden">
                  <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                    <FileImage className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium flex-1">Schéma technique</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="p-4 bg-white dark:bg-card flex items-center justify-center">
                    <img
                      src={model.schemaImageUrl}
                      alt={`Schéma ${model.name}`}
                      className="max-w-full max-h-[400px] object-contain"
                    />
                  </div>
                </details>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ─── GLOBAL SEARCH RESULTS ─── */}
        {step === "layers" && globalSearchResults && (
          <motion.div
            key="search-results"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: EASE_OUT as unknown as number[] }}
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground">
              {globalSearchResults.length} résultat{globalSearchResults.length !== 1 ? "s" : ""} pour "{search}"
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {globalSearchResults.map((part: any, i: number) => (
                <PartCard key={part.sparePartId || part.linkId || i} part={part} index={i} onClick={() => setDetailPart(part)} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── STEP: SUBCATEGORIES ─── */}
        {step === "subcategories" && currentLayer && (
          <motion.div
            key={`subs-${selectedLayer}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: EASE_OUT as unknown as number[] }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentLayer.subcategories.map((sub, i) => {
                const layerMap = tree.get(currentLayer.key);
                const subParts = layerMap?.get(sub.key) || [];
                if (subParts.length === 0) return null;
                const SubIcon = sub.icon;

                return (
                  <motion.button
                    key={sub.key}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.35, ease: EASE_OUT as unknown as number[] }}
                    onClick={() => goToSub(sub.key)}
                    whileHover={{ y: -3, transition: { duration: 0.2, ease: EASE_OUT as unknown as number[] } }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative overflow-hidden rounded-xl border bg-card text-left p-5 transition-shadow duration-300 hover:shadow-lg cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${sub.color}`}>
                        <SubIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base">{sub.label}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {subParts.length} pièce{subParts.length !== 1 ? "s" : ""} disponible{subParts.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform duration-200 shrink-0" />
                    </div>

                    {/* Preview: first 3 part names */}
                    {subParts.length > 0 && (
                      <div className="mt-3 pt-3 border-t flex flex-wrap gap-1.5">
                        {subParts.slice(0, 3).map((p: any, j: number) => (
                          <span key={j} className="text-xs bg-muted/60 text-muted-foreground rounded-md px-2 py-0.5 truncate max-w-[140px]">
                            {p.name}
                          </span>
                        ))}
                        {subParts.length > 3 && (
                          <span className="text-xs text-muted-foreground/60">+{subParts.length - 3}</span>
                        )}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ─── STEP: PARTS ─── */}
        {step === "parts" && currentSub && (
          <motion.div
            key={`parts-${selectedLayer}-${selectedSub}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: EASE_OUT as unknown as number[] }}
            className="space-y-5"
          >
            {filteredParts.length === 0 ? (
              <div className="text-center py-16">
                <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Aucune pièce trouvée</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredParts.map((part: any, i: number) => (
                  <PartCard key={part.sparePartId || part.linkId || i} part={part} index={i} onClick={() => setDetailPart(part)} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/50 rounded-xl">
          <CardContent className="p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Comment commander des pièces ?</h4>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                Pour commander des pièces détachées, créez un <strong>ticket SAV</strong> en précisant le modèle et le composant concerné.
                Si la pièce est couverte par la garantie, elle sera envoyée gratuitement.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detail Dialog */}
      <PartDetailDialog part={detailPart} onClose={() => setDetailPart(null)} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PART CARD — Individual part card with hover animation
   ═══════════════════════════════════════════════════════════ */
function PartCard({ part, index, onClick }: { part: any; index: number; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: EASE_OUT as unknown as number[] }}
      whileHover={{ y: -3, transition: { duration: 0.2, ease: EASE_OUT as unknown as number[] } }}
      whileTap={{ scale: 0.97 }}
    >
      <Card
        className="overflow-hidden cursor-pointer transition-shadow duration-300 hover:shadow-lg rounded-xl h-full"
        onClick={onClick}
      >
        <CardContent className="p-0 flex flex-col h-full">
          {/* Image */}
          <div className="aspect-[4/3] bg-gradient-to-br from-muted/30 to-muted/60 flex items-center justify-center overflow-hidden relative">
            {part.imageUrl ? (
              <img
                src={part.imageUrl}
                alt={part.name}
                className="w-full h-full object-contain p-3 transition-transform duration-500 ease-out hover:scale-105"
              />
            ) : (
              <Package className="w-10 h-10 text-muted-foreground/20" />
            )}
            {/* Category badge */}
            <div className="absolute top-2 left-2">
              <span className="text-[10px] font-medium bg-black/50 text-white backdrop-blur-sm rounded-md px-2 py-0.5">
                {part.reference}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="p-4 flex-1 flex flex-col justify-between gap-2">
            <div>
              <h4 className="font-semibold text-sm leading-snug line-clamp-2">{part.name}</h4>
              {part.quantity && (
                <p className="text-xs text-muted-foreground mt-1">Qté : {part.quantity}</p>
              )}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-muted/50">
              <span className="text-lg font-bold tracking-tight">
                {parseFloat(part.priceHT || "0").toFixed(2)} <span className="text-xs font-normal text-muted-foreground">EUR HT</span>
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PART DETAIL DIALOG
   ═══════════════════════════════════════════════════════════ */
function PartDetailDialog({ part, onClose }: { part: any; onClose: () => void }) {
  if (!part) return null;

  // Determine which layer/subcategory this part belongs to
  const classification = classifyPart(part);
  const layer = LAYERS.find((l) => l.key === classification.layerKey);
  const sub = layer?.subcategories.find((s) => s.key === classification.subcategoryKey);

  return (
    <Dialog open={!!part} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">{part.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Image */}
          {part.imageUrl && (
            <div className="rounded-xl overflow-hidden bg-muted/30">
              <img src={part.imageUrl} alt={part.name} className="w-full h-52 object-contain" />
            </div>
          )}

          {/* Classification */}
          {layer && sub && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${sub.color}`}>
                {sub.label}
              </span>
              <span className="text-muted-foreground/40">/</span>
              <span>{layer.label}</span>
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground text-xs">Référence</Label>
              <p className="font-medium font-mono mt-0.5">{part.reference}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Catégorie</Label>
              <p className="font-medium mt-0.5">{part.category}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Prix HT</Label>
              <p className="font-bold text-xl mt-0.5">{parseFloat(part.priceHT || "0").toFixed(2)} <span className="text-sm font-normal text-muted-foreground">EUR</span></p>
            </div>
            {part.quantity && (
              <div>
                <Label className="text-muted-foreground text-xs">Quantité</Label>
                <p className="font-medium mt-0.5">{part.quantity} PCS</p>
              </div>
            )}
          </div>

          {/* Description */}
          {part.description && (
            <div>
              <Label className="text-muted-foreground text-xs">Description</Label>
              <p className="text-sm mt-1 leading-relaxed">{part.description}</p>
            </div>
          )}

          {/* CTA */}
          <div className="pt-3 border-t space-y-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Pour commander cette pièce, créez un ticket SAV ou contactez votre gestionnaire de compte.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function SpareParts() {
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [direction, setDirection] = useState(1);

  const handleSelectModel = useCallback((model: any) => {
    setDirection(1);
    setSelectedModel(model);
  }, []);

  const handleBackToModels = useCallback(() => {
    setDirection(-1);
    setSelectedModel(null);
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <AnimatePresence mode="wait" custom={direction}>
        {!selectedModel ? (
          <motion.div
            key="models"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: EASE_OUT as unknown as number[] }}
          >
            <ModelSelection onSelect={handleSelectModel} />
          </motion.div>
        ) : (
          <motion.div
            key={`explorer-${selectedModel.id}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: EASE_OUT as unknown as number[] }}
          >
            <LayerExplorer model={selectedModel} onBack={handleBackToModels} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
