/**
 * VisualExplorerAdmin — Éditeur admin pour configurer les couches, zones et hotspots
 * d'un modèle de spa, permettant aux partenaires de naviguer visuellement dans les pièces.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Trash2,
  Edit,
  Upload,
  Eye,
  Layers,
  MapPin,
  Target,
  ChevronRight,
  ArrowLeft,
  GripVertical,
  ImageIcon,
  Loader2,
  Check,
  X,
  Crosshair,
  Move,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// TYPES & CONSTANTS
// ============================================

const LAYER_TYPES = {
  SHELL: { label: "Coque intérieure", description: "Jets, écran, oreillers, éclairage, audio", icon: "🛁", color: "bg-blue-50 border-blue-200 text-blue-700" },
  TECHNICAL: { label: "Pompes & Électronique", description: "Pompes, chauffage, plomberie, ozone", icon: "⚙️", color: "bg-amber-50 border-amber-200 text-amber-700" },
  EXTERIOR: { label: "Extérieur", description: "Panneaux, coins, couverture, habillage", icon: "🏠", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
} as const;

type LayerType = keyof typeof LAYER_TYPES;
type EditorView = "layers" | "zones" | "hotspots";

// ============================================
// MAIN COMPONENT
// ============================================

export default function VisualExplorerAdmin({ model }: { model: any }) {
  const [view, setView] = useState<EditorView>("layers");
  const [selectedLayer, setSelectedLayer] = useState<any>(null);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [showLayerForm, setShowLayerForm] = useState(false);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [editingLayer, setEditingLayer] = useState<any>(null);
  const [editingZone, setEditingZone] = useState<any>(null);

  // Queries
  const { data: layers, refetch: refetchLayers } = trpc.spaModels.getLayers.useQuery({ spaModelId: model.id });
  const { data: parts } = trpc.spaModels.getParts.useQuery({ spaModelId: model.id });

  const configuredLayers = (layers || []).filter((l: any) => l.imageUrl);
  const isConfigured = configuredLayers.length > 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        <button
          onClick={() => { setView("layers"); setSelectedLayer(null); setSelectedZone(null); }}
          className={`transition-colors ${view === "layers" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
        >
          Couches
        </button>
        {selectedLayer && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            <button
              onClick={() => { setView("zones"); setSelectedZone(null); }}
              className={`transition-colors ${view === "zones" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              {selectedLayer.label}
            </button>
          </>
        )}
        {selectedZone && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-foreground font-medium">{selectedZone.label}</span>
          </>
        )}
      </div>

      {/* Status banner */}
      {!isConfigured && view === "layers" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
          <div className="flex items-start gap-3">
            <Layers className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Explorateur non configuré</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Ajoutez des couches avec des images pour activer l'explorateur visuel interactif pour les partenaires. 
                Sans configuration, ils verront la liste classique des pièces.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Views */}
      {view === "layers" && (
        <LayersView
          model={model}
          layers={layers || []}
          onSelectLayer={(layer: any) => { setSelectedLayer(layer); setView("zones"); }}
          onRefetch={refetchLayers}
          showForm={showLayerForm}
          setShowForm={setShowLayerForm}
          editingLayer={editingLayer}
          setEditingLayer={setEditingLayer}
        />
      )}

      {view === "zones" && selectedLayer && (
        <ZonesView
          layer={selectedLayer}
          model={model}
          onBack={() => { setView("layers"); setSelectedLayer(null); }}
          onSelectZone={(zone: any) => { setSelectedZone(zone); setView("hotspots"); }}
          onRefetch={refetchLayers}
          showForm={showZoneForm}
          setShowForm={setShowZoneForm}
          editingZone={editingZone}
          setEditingZone={setEditingZone}
        />
      )}

      {view === "hotspots" && selectedZone && selectedLayer && (
        <HotspotsView
          zone={selectedZone}
          layer={selectedLayer}
          model={model}
          parts={parts || []}
          onBack={() => { setView("zones"); setSelectedZone(null); }}
          onRefetch={refetchLayers}
        />
      )}
    </div>
  );
}

// ============================================
// LAYERS VIEW
// ============================================

function LayersView({
  model,
  layers,
  onSelectLayer,
  onRefetch,
  showForm,
  setShowForm,
  editingLayer,
  setEditingLayer,
}: {
  model: any;
  layers: any[];
  onSelectLayer: (layer: any) => void;
  onRefetch: () => void;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  editingLayer: any;
  setEditingLayer: (v: any) => void;
}) {
  const deleteMutation = trpc.spaModels.deleteLayer.useMutation({
    onSuccess: () => { toast.success("Couche supprimée"); onRefetch(); },
    onError: (err) => toast.error(err.message),
  });

  // Show all 3 layer types, mark which ones exist
  const layerMap = new Map(layers.map((l: any) => [l.layerType, l]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Couches du modèle</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configurez les 3 couches pour l'explorateur visuel
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.entries(LAYER_TYPES) as [LayerType, typeof LAYER_TYPES[LayerType]][]).map(([type, config]) => {
          const existing = layerMap.get(type);
          const hasImage = existing?.imageUrl;

          return (
            <div
              key={type}
              className={`rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                hasImage
                  ? "border-primary/30 bg-card hover:shadow-md cursor-pointer"
                  : existing
                  ? "border-dashed border-muted-foreground/30 bg-card"
                  : "border-dashed border-muted-foreground/20 bg-muted/20"
              }`}
              onClick={() => {
                if (existing) onSelectLayer(existing);
              }}
            >
              {/* Image preview */}
              <div className="h-40 bg-muted/30 flex items-center justify-center relative overflow-hidden">
                {hasImage ? (
                  <img src={existing.imageUrl} alt={config.label} className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="text-center p-4">
                    <span className="text-4xl">{config.icon}</span>
                    <p className="text-xs text-muted-foreground mt-2">Aucune image</p>
                  </div>
                )}
                {hasImage && (
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors flex items-center justify-center">
                    <span className="opacity-0 hover:opacity-100 transition-opacity text-xs font-medium bg-background/90 px-3 py-1.5 rounded-full shadow-sm">
                      Gérer les zones →
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">{config.label}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
                  </div>
                  <Badge variant={hasImage ? "default" : "secondary"} className="text-[10px] shrink-0">
                    {hasImage ? "Configuré" : "Non configuré"}
                  </Badge>
                </div>

                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {existing ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => { setEditingLayer(existing); setShowForm(true); }}
                      >
                        <Edit className="w-3 h-3 mr-1" /> Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Supprimer cette couche et toutes ses zones/hotspots ?")) {
                            deleteMutation.mutate({ id: existing.id });
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => {
                        setEditingLayer({ layerType: type, label: config.label, description: config.description });
                        setShowForm(true);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Créer cette couche
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Layer Form Dialog */}
      {showForm && (
        <LayerFormDialog
          open={showForm}
          onOpenChange={(v) => { setShowForm(v); if (!v) setEditingLayer(null); }}
          model={model}
          editLayer={editingLayer}
          onSuccess={() => { onRefetch(); setShowForm(false); setEditingLayer(null); }}
        />
      )}
    </div>
  );
}

// ============================================
// LAYER FORM DIALOG
// ============================================

function LayerFormDialog({
  open,
  onOpenChange,
  model,
  editLayer,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  model: any;
  editLayer: any;
  onSuccess: () => void;
}) {
  const isEdit = editLayer?.id;
  const [label, setLabel] = useState(editLayer?.label || "");
  const [description, setDescription] = useState(editLayer?.description || "");
  const [imageUrl, setImageUrl] = useState(editLayer?.imageUrl || "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const createMutation = trpc.spaModels.createLayer.useMutation({
    onSuccess: () => { toast.success("Couche créée"); onSuccess(); },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.spaModels.updateLayer.useMutation({
    onSuccess: () => { toast.success("Couche mise à jour"); onSuccess(); },
    onError: (err) => toast.error(err.message),
  });

  const uploadMutation = trpc.spaModels.uploadImage.useMutation();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const result = await uploadMutation.mutateAsync({
          imageData: reader.result as string,
          fileName: file.name,
        });
        setImageUrl(result.url);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Erreur lors de l'upload");
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!label.trim()) return toast.error("Le label est requis");
    if (isEdit) {
      updateMutation.mutate({ id: editLayer.id, data: { label, description, imageUrl } });
    } else {
      createMutation.mutate({
        spaModelId: model.id,
        layerType: editLayer.layerType,
        label,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        sortOrder: editLayer.layerType === "SHELL" ? 0 : editLayer.layerType === "TECHNICAL" ? 1 : 2,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la couche" : "Créer la couche"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Label affiché</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Coque intérieure" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description courte..." rows={2} />
          </div>
          <div>
            <Label>Image de la couche</Label>
            <div className="mt-2">
              {imageUrl ? (
                <div className="relative rounded-lg border overflow-hidden bg-muted/30">
                  <img src={imageUrl} alt="Preview" className="w-full max-h-48 object-contain p-2" />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-7 w-7 p-0"
                    onClick={() => setImageUrl("")}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">Cliquez pour uploader une image</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP recommandé</p>
                    </>
                  )}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
            {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// ZONES VIEW
// ============================================

function ZonesView({
  layer,
  model,
  onBack,
  onSelectZone,
  onRefetch,
  showForm,
  setShowForm,
  editingZone,
  setEditingZone,
}: {
  layer: any;
  model: any;
  onBack: () => void;
  onSelectZone: (zone: any) => void;
  onRefetch: () => void;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  editingZone: any;
  setEditingZone: (v: any) => void;
}) {
  const { data: zones, refetch: refetchZones } = trpc.spaModels.getZones.useQuery({ layerId: layer.id });

  const deleteMutation = trpc.spaModels.deleteZone.useMutation({
    onSuccess: () => { toast.success("Zone supprimée"); refetchZones(); },
    onError: (err) => toast.error(err.message),
  });

  const layerConfig = LAYER_TYPES[layer.layerType as LayerType];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 mt-0.5 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{layerConfig?.icon}</span>
              <h3 className="text-lg font-semibold">{layer.label}</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {(zones || []).length} zone{(zones || []).length !== 1 ? "s" : ""} configurée{(zones || []).length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button onClick={() => { setEditingZone(null); setShowForm(true); }} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Ajouter une zone
        </Button>
      </div>

      {/* Layer image with zone overlays */}
      {layer.imageUrl && (
        <div className="rounded-xl border bg-white dark:bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Image de la couche</span>
            <span className="text-xs text-muted-foreground ml-auto">Cliquez sur une zone pour gérer ses hotspots</span>
          </div>
          <div className="relative p-4 bg-white dark:bg-muted/10">
            <div className="relative inline-block w-full">
              <img src={layer.imageUrl} alt={layer.label} className="w-full object-contain max-h-[500px]" />
              {/* Zone overlays */}
              {(zones || []).map((zone: any) => {
                if (!zone.posX || !zone.posY) return null;
                return (
                  <TooltipProvider key={zone.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                          style={{
                            left: `${zone.posX}%`,
                            top: `${zone.posY}%`,
                            width: zone.width ? `${zone.width}%` : "auto",
                            height: zone.height ? `${zone.height}%` : "auto",
                          }}
                          onClick={() => onSelectZone(zone)}
                        >
                          {zone.width && zone.height ? (
                            <div className="w-full h-full rounded-lg border-2 border-primary/50 bg-primary/10 hover:bg-primary/20 transition-colors" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/80 border-2 border-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                              <MapPin className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{zone.label}</p>
                        {zone.description && <p className="text-xs text-muted-foreground">{zone.description}</p>}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Zones list */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Zones ({(zones || []).length})</h4>
        {(zones || []).length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <MapPin className="w-8 h-8 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground mt-3">Aucune zone configurée</p>
            <p className="text-xs text-muted-foreground mt-1">Ajoutez des zones pour définir les emplacements cliquables</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => { setEditingZone(null); setShowForm(true); }}>
              <Plus className="w-3 h-3 mr-1" /> Créer la première zone
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(zones || []).map((zone: any) => (
              <div
                key={zone.id}
                className="rounded-lg border bg-card p-4 hover:shadow-sm transition-all cursor-pointer group"
                onClick={() => onSelectZone(zone)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-sm truncate">{zone.label}</h5>
                    {zone.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{zone.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {zone.imageUrl && (
                        <Badge variant="secondary" className="text-[10px]">
                          <ImageIcon className="w-2.5 h-2.5 mr-0.5" /> Image
                        </Badge>
                      )}
                      {zone.posX && zone.posY && (
                        <Badge variant="secondary" className="text-[10px]">
                          <Target className="w-2.5 h-2.5 mr-0.5" /> Positionné
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditingZone(zone); setShowForm(true); }}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Supprimer la zone « ${zone.label} » et tous ses hotspots ?`)) {
                          deleteMutation.mutate({ id: zone.id });
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Zone Form Dialog */}
      {showForm && (
        <ZoneFormDialog
          open={showForm}
          onOpenChange={(v) => { setShowForm(v); if (!v) setEditingZone(null); }}
          layer={layer}
          editZone={editingZone}
          onSuccess={() => { refetchZones(); setShowForm(false); setEditingZone(null); }}
        />
      )}
    </div>
  );
}

// ============================================
// ZONE FORM DIALOG
// ============================================

function ZoneFormDialog({
  open,
  onOpenChange,
  layer,
  editZone,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  layer: any;
  editZone: any;
  onSuccess: () => void;
}) {
  const isEdit = !!editZone?.id;
  const [name, setName] = useState(editZone?.name || "");
  const [label, setLabel] = useState(editZone?.label || "");
  const [description, setDescription] = useState(editZone?.description || "");
  const [imageUrl, setImageUrl] = useState(editZone?.imageUrl || "");
  const [posX, setPosX] = useState(editZone?.posX || "");
  const [posY, setPosY] = useState(editZone?.posY || "");
  const [width, setWidth] = useState(editZone?.width || "");
  const [height, setHeight] = useState(editZone?.height || "");
  const [uploading, setUploading] = useState(false);
  const [pickingPosition, setPickingPosition] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const createMutation = trpc.spaModels.createZone.useMutation({
    onSuccess: () => { toast.success("Zone créée"); onSuccess(); },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.spaModels.updateZone.useMutation({
    onSuccess: () => { toast.success("Zone mise à jour"); onSuccess(); },
    onError: (err) => toast.error(err.message),
  });

  const uploadMutation = trpc.spaModels.uploadImage.useMutation();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const result = await uploadMutation.mutateAsync({
          imageData: reader.result as string,
          fileName: file.name,
        });
        setImageUrl(result.url);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Erreur lors de l'upload");
      setUploading(false);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!pickingPosition || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(2);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(2);
    setPosX(x);
    setPosY(y);
    setPickingPosition(false);
    toast.success(`Position définie : ${x}%, ${y}%`);
  };

  const handleSubmit = () => {
    if (!name.trim()) return toast.error("Le nom est requis");
    if (!label.trim()) return toast.error("Le label est requis");

    if (isEdit) {
      updateMutation.mutate({
        id: editZone.id,
        data: {
          name,
          label,
          description: description || undefined,
          imageUrl: imageUrl || undefined,
          posX: posX || undefined,
          posY: posY || undefined,
          width: width || undefined,
          height: height || undefined,
        },
      });
    } else {
      createMutation.mutate({
        layerId: layer.id,
        name,
        label,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        posX: posX || undefined,
        posY: posY || undefined,
        width: width || undefined,
        height: height || undefined,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la zone" : "Nouvelle zone"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nom interne *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: lounger_1" />
            </div>
            <div>
              <Label>Label affiché *</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Lounger 1" />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description de la zone..." rows={2} />
          </div>

          {/* Position picker on layer image */}
          {layer.imageUrl && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Position sur l'image de la couche</Label>
                <Button
                  variant={pickingPosition ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setPickingPosition(!pickingPosition)}
                >
                  <Crosshair className="w-3 h-3 mr-1" />
                  {pickingPosition ? "Cliquez sur l'image..." : "Placer sur l'image"}
                </Button>
              </div>
              <div className={`relative rounded-lg border overflow-hidden ${pickingPosition ? "cursor-crosshair ring-2 ring-primary" : ""}`}>
                <img
                  ref={imgRef}
                  src={layer.imageUrl}
                  alt="Layer"
                  className="w-full object-contain max-h-64"
                  onClick={handleImageClick}
                />
                {posX && posY && (
                  <div
                    className="absolute w-6 h-6 rounded-full bg-primary border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                    style={{ left: `${posX}%`, top: `${posY}%` }}
                  >
                    <MapPin className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2 mt-2">
                <div>
                  <Label className="text-xs">X (%)</Label>
                  <Input value={posX} onChange={(e) => setPosX(e.target.value)} placeholder="50" className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Y (%)</Label>
                  <Input value={posY} onChange={(e) => setPosY(e.target.value)} placeholder="50" className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Largeur (%)</Label>
                  <Input value={width} onChange={(e) => setWidth(e.target.value)} placeholder="20" className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Hauteur (%)</Label>
                  <Input value={height} onChange={(e) => setHeight(e.target.value)} placeholder="20" className="h-8 text-xs" />
                </div>
              </div>
            </div>
          )}

          {/* Zone detail image */}
          <div>
            <Label>Image de détail de la zone (optionnel)</Label>
            <p className="text-xs text-muted-foreground mb-2">Image zoomée de cette zone pour placer les hotspots précisément</p>
            <div className="mt-1">
              {imageUrl ? (
                <div className="relative rounded-lg border overflow-hidden bg-muted/30">
                  <img src={imageUrl} alt="Zone preview" className="w-full max-h-36 object-contain p-2" />
                  <Button variant="destructive" size="sm" className="absolute top-2 right-2 h-7 w-7 p-0" onClick={() => setImageUrl("")}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 mx-auto animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mx-auto text-muted-foreground" />
                      <p className="text-xs text-muted-foreground mt-1">Cliquez pour uploader</p>
                    </>
                  )}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
            {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// HOTSPOTS VIEW
// ============================================

function HotspotsView({
  zone,
  layer,
  model,
  parts,
  onBack,
  onRefetch,
}: {
  zone: any;
  layer: any;
  model: any;
  parts: any[];
  onBack: () => void;
  onRefetch: () => void;
}) {
  const { data: hotspots, refetch: refetchHotspots } = trpc.spaModels.getHotspots.useQuery({ zoneId: zone.id });
  const [placingHotspot, setPlacingHotspot] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<string>("");
  const [hotspotLabel, setHotspotLabel] = useState("");
  const [partSearch, setPartSearch] = useState("");
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const createMutation = trpc.spaModels.createHotspot.useMutation({
    onSuccess: () => {
      toast.success("Hotspot créé");
      refetchHotspots();
      setPlacingHotspot(false);
      setSelectedPartId("");
      setHotspotLabel("");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.spaModels.updateHotspot.useMutation({
    onSuccess: () => { refetchHotspots(); setDraggingId(null); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.spaModels.deleteHotspot.useMutation({
    onSuccess: () => { toast.success("Hotspot supprimé"); refetchHotspots(); },
    onError: (err) => toast.error(err.message),
  });

  // Use zone image if available, otherwise layer image
  const displayImage = zone.imageUrl || layer.imageUrl;

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!placingHotspot || !imgRef.current || !selectedPartId) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(2);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(2);

    createMutation.mutate({
      zoneId: zone.id,
      sparePartId: parseInt(selectedPartId),
      label: hotspotLabel || undefined,
      posX: x,
      posY: y,
    });
  };

  const handleDrag = useCallback((hotspotId: number, e: React.MouseEvent) => {
    if (!imgRef.current) return;
    e.preventDefault();
    setDraggingId(hotspotId);

    const img = imgRef.current;
    const rect = img.getBoundingClientRect();

    const onMove = (moveEvent: MouseEvent) => {
      const x = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width * 100)));
      const y = Math.max(0, Math.min(100, ((moveEvent.clientY - rect.top) / rect.height * 100)));
      // Visual update via DOM
      const el = document.getElementById(`hotspot-${hotspotId}`);
      if (el) {
        el.style.left = `${x}%`;
        el.style.top = `${y}%`;
      }
    };

    const onUp = (upEvent: MouseEvent) => {
      const x = ((upEvent.clientX - rect.left) / rect.width * 100).toFixed(2);
      const y = ((upEvent.clientY - rect.top) / rect.height * 100).toFixed(2);
      updateMutation.mutate({ id: hotspotId, data: { posX: x, posY: y } });
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [updateMutation]);

  // Filter parts for selection
  const filteredParts = parts.filter((p: any) => {
    if (!partSearch) return true;
    const s = partSearch.toLowerCase();
    return p.name.toLowerCase().includes(s) || p.reference.toLowerCase().includes(s);
  });

  const layerConfig = LAYER_TYPES[layer.layerType as LayerType];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 mt-0.5 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h3 className="text-lg font-semibold">{zone.label}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {(hotspots || []).length} hotspot{(hotspots || []).length !== 1 ? "s" : ""} · {layerConfig?.label}
            </p>
          </div>
        </div>
      </div>

      {/* Hotspot placement controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <h4 className="font-medium text-sm">Placer un hotspot</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Pièce détachée *</Label>
              <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Sélectionner une pièce..." />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Rechercher..."
                      value={partSearch}
                      onChange={(e) => setPartSearch(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <ScrollArea className="max-h-48">
                    {filteredParts.map((p: any) => (
                      <SelectItem key={p.sparePartId} value={p.sparePartId.toString()} className="text-xs">
                        {p.name} ({p.reference})
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Label (optionnel)</Label>
              <Input
                value={hotspotLabel}
                onChange={(e) => setHotspotLabel(e.target.value)}
                placeholder="Label personnalisé..."
                className="h-9 text-xs"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant={placingHotspot ? "default" : "outline"}
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  if (!selectedPartId) return toast.error("Sélectionnez d'abord une pièce");
                  setPlacingHotspot(!placingHotspot);
                }}
                disabled={!selectedPartId}
              >
                <Crosshair className="w-3 h-3 mr-1" />
                {placingHotspot ? "Cliquez sur l'image..." : "Placer sur l'image"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image with hotspots */}
      {displayImage ? (
        <div className={`rounded-xl border overflow-hidden ${placingHotspot ? "ring-2 ring-primary" : ""}`}>
          <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{zone.imageUrl ? "Image de la zone" : "Image de la couche"}</span>
            </div>
            {placingHotspot && (
              <Badge className="bg-primary text-primary-foreground animate-pulse text-xs">
                <Crosshair className="w-3 h-3 mr-1" /> Mode placement actif
              </Badge>
            )}
          </div>
          <div className="relative p-4 bg-white dark:bg-muted/10">
            <div className="relative inline-block w-full">
              <img
                ref={imgRef}
                src={displayImage}
                alt={zone.label}
                className={`w-full object-contain max-h-[600px] ${placingHotspot ? "cursor-crosshair" : ""}`}
                onClick={handleImageClick}
              />
              {/* Hotspot markers */}
              {(hotspots || []).map((hs: any, idx: number) => (
                <TooltipProvider key={hs.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        id={`hotspot-${hs.id}`}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-10 ${
                          draggingId === hs.id ? "cursor-grabbing scale-125" : "cursor-grab hover:scale-110"
                        } transition-transform`}
                        style={{ left: `${hs.posX}%`, top: `${hs.posY}%` }}
                        onMouseDown={(e) => handleDrag(hs.id, e)}
                      >
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-primary border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
                            {idx + 1}
                          </div>
                          {/* Pulse animation */}
                          <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: "2s" }} />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="font-medium text-sm">{hs.label || hs.partName}</p>
                      <p className="text-xs text-muted-foreground">{hs.partReference} · {parseFloat(hs.partPriceHT || 0).toFixed(2)} € HT</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground mt-3">Aucune image disponible</p>
          <p className="text-xs text-muted-foreground mt-1">Ajoutez une image à la zone ou à la couche pour placer des hotspots</p>
        </div>
      )}

      {/* Hotspots list */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Hotspots ({(hotspots || []).length})
        </h4>
        {(hotspots || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun hotspot. Sélectionnez une pièce et cliquez sur l'image pour en placer.</p>
        ) : (
          <div className="space-y-1">
            {(hotspots || []).map((hs: any, idx: number) => (
              <div key={hs.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {idx + 1}
                </div>
                {hs.partImageUrl && (
                  <div className="w-10 h-10 rounded bg-muted/30 overflow-hidden shrink-0">
                    <img src={hs.partImageUrl} alt="" className="w-full h-full object-contain p-0.5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{hs.label || hs.partName}</p>
                  <p className="text-xs text-muted-foreground">{hs.partReference} · {parseFloat(hs.partPriceHT || 0).toFixed(2)} € HT</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ({parseFloat(hs.posX).toFixed(1)}%, {parseFloat(hs.posY).toFixed(1)}%)
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("Supprimer ce hotspot ?")) deleteMutation.mutate({ id: hs.id });
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
