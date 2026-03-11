import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Plus, Search, Edit, Trash2, Package, ChevronLeft, ChevronRight,
  Image as ImageIcon, Users, Ruler, Link2, X, Loader2, Check
} from "lucide-react";

// ============================================
// CONSTANTES
// ============================================
const BRANDS: Record<string, string> = {
  MARKET_SPAS: "Market Spas",
  WELLIS_CLASSIC: "Wellis Classic",
  WELLIS_LIFE: "Wellis Life",
  WELLIS_WIBES: "Wellis Wibes",
  PASSION_SPAS: "Passion Spas",
  PLATINUM_SPAS: "Platinum Spas",
};

const CATEGORIES: Record<string, string> = {
  PUMPS: "Pompes",
  ELECTRONICS: "Électronique",
  JETS: "Jets",
  SCREENS: "Écrans",
  HEATING: "Chauffage",
  PLUMBING: "Plomberie",
  COVERS: "Couvertures",
  CABINETS: "Habillage",
  LIGHTING: "Éclairage LED",
  AUDIO: "Audio",
  OZONE_UVC: "Ozone / UVC",
  OTHER: "Autres",
};

const BRAND_COLORS: Record<string, string> = {
  MARKET_SPAS: "bg-blue-100 text-blue-800",
  WELLIS_CLASSIC: "bg-purple-100 text-purple-800",
  WELLIS_LIFE: "bg-green-100 text-green-800",
  WELLIS_WIBES: "bg-orange-100 text-orange-800",
  PASSION_SPAS: "bg-red-100 text-red-800",
  PLATINUM_SPAS: "bg-gray-100 text-gray-800",
};

// ============================================
// MODEL FORM DIALOG
// ============================================
function ModelFormDialog({
  open,
  onOpenChange,
  editModel,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editModel?: any;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(editModel?.name || "");
  const [brand, setBrand] = useState(editModel?.brand || "MARKET_SPAS");
  const [series, setSeries] = useState(editModel?.series || "");
  const [imageUrl, setImageUrl] = useState(editModel?.imageUrl || "");
  const [description, setDescription] = useState(editModel?.description || "");
  const [seats, setSeats] = useState<string>(editModel?.seats?.toString() || "");
  const [dimensions, setDimensions] = useState(editModel?.dimensions || "");
  const [sortOrder, setSortOrder] = useState<string>(editModel?.sortOrder?.toString() || "0");

  const createMutation = trpc.spaModels.create.useMutation({
    onSuccess: () => {
      toast.success("Modèle créé avec succès");
      onSuccess();
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.spaModels.update.useMutation({
    onSuccess: () => {
      toast.success("Modèle mis à jour");
      onSuccess();
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!name.trim()) return toast.error("Le nom est requis");
    const data = {
      name: name.trim(),
      brand,
      series: series.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      description: description.trim() || undefined,
      seats: seats ? parseInt(seats) : undefined,
      dimensions: dimensions.trim() || undefined,
      sortOrder: sortOrder ? parseInt(sortOrder) : 0,
    };
    if (editModel) {
      updateMutation.mutate({ id: editModel.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editModel ? "Modifier le modèle" : "Nouveau modèle de spa"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nom du modèle *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Cityline 5" />
          </div>
          <div>
            <Label>Marque *</Label>
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(BRANDS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Gamme / Série</Label>
              <Input value={series} onChange={(e) => setSeries(e.target.value)} placeholder="Ex: Cityline" />
            </div>
            <div>
              <Label>Nombre de places</Label>
              <Input type="number" value={seats} onChange={(e) => setSeats(e.target.value)} placeholder="Ex: 5" />
            </div>
          </div>
          <div>
            <Label>Dimensions</Label>
            <Input value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="Ex: 220 x 220 x 90 cm" />
          </div>
          <div>
            <Label>URL de l'image</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            {imageUrl && (
              <img src={imageUrl} alt="Preview" className="mt-2 h-32 w-full object-contain rounded-lg bg-gray-50" />
            )}
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Description du modèle..." />
          </div>
          <div>
            <Label>Ordre d'affichage</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="0" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editModel ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// PARTS ASSIGNMENT DIALOG
// ============================================
function AssignPartsDialog({
  open,
  onOpenChange,
  model,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: any;
  onSuccess: () => void;
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Pièces déjà attribuées
  const { data: assignedParts, refetch: refetchAssigned } = trpc.spaModels.getParts.useQuery(
    { spaModelId: model?.id },
    { enabled: !!model }
  );

  // Toutes les pièces disponibles
  const { data: allParts } = trpc.spareParts.list.useQuery(
    { isActive: true },
    { enabled: open }
  );

  const addMultipleMutation = trpc.spaModels.addMultipleParts.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.added} pièce(s) ajoutée(s)${result.skipped > 0 ? `, ${result.skipped} déjà présente(s)` : ""}`);
      refetchAssigned();
      onSuccess();
      setSelectedIds(new Set());
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMutation = trpc.spaModels.removePart.useMutation({
    onSuccess: () => {
      toast.success("Pièce retirée");
      refetchAssigned();
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const assignedPartIds = new Set((assignedParts || []).map((p: any) => p.sparePartId));

  const filteredParts = (allParts || []).filter((p: any) => {
    if (assignedPartIds.has(p.id)) return false;
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return p.name.toLowerCase().includes(s) || p.reference.toLowerCase().includes(s);
    }
    return true;
  });

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleAddSelected = () => {
    if (selectedIds.size === 0) return;
    addMultipleMutation.mutate({ spaModelId: model.id, sparePartIds: Array.from(selectedIds) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Pièces détachées — {model?.name}
            <Badge className={BRAND_COLORS[model?.brand] || ""}>{BRANDS[model?.brand]}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Colonne gauche : pièces attribuées */}
          <div className="flex flex-col overflow-hidden">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Pièces attribuées ({assignedParts?.length || 0})
            </h3>
            <div className="flex-1 overflow-y-auto space-y-1 border rounded-lg p-2 bg-green-50/30">
              {(!assignedParts || assignedParts.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-8">Aucune pièce attribuée</p>
              ) : (
                assignedParts.map((p: any) => (
                  <div key={p.linkId} className="flex items-center justify-between bg-white rounded-md px-3 py-2 border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{p.reference}</span>
                        <Badge variant="outline" className="text-[10px] px-1">{CATEGORIES[p.category] || p.category}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                      onClick={() => removeMutation.mutate({ linkId: p.linkId })}
                      disabled={removeMutation.isPending}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Colonne droite : pièces disponibles */}
          <div className="flex flex-col overflow-hidden">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Pièces disponibles
            </h3>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 h-8 text-sm"
              />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px] h-8 text-sm">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {Object.entries(CATEGORIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 border rounded-lg p-2">
              {filteredParts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Aucune pièce disponible</p>
              ) : (
                filteredParts.map((p: any) => (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 bg-white rounded-md px-3 py-2 border cursor-pointer hover:bg-blue-50/50 transition-colors ${
                      selectedIds.has(p.id) ? "border-blue-400 bg-blue-50/30" : ""
                    }`}
                  >
                    <Checkbox
                      checked={selectedIds.has(p.id)}
                      onCheckedChange={() => toggleSelect(p.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{p.reference}</span>
                        <Badge variant="outline" className="text-[10px] px-1">{CATEGORIES[p.category] || p.category}</Badge>
                      </div>
                    </div>
                    {p.imageUrl && (
                      <img src={p.imageUrl} alt="" className="w-8 h-8 object-contain rounded" />
                    )}
                  </label>
                ))
              )}
            </div>
            {selectedIds.size > 0 && (
              <Button
                className="mt-2 w-full"
                onClick={handleAddSelected}
                disabled={addMultipleMutation.isPending}
              >
                {addMultipleMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Ajouter {selectedIds.size} pièce(s)
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function AdminSpaModels() {
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editModel, setEditModel] = useState<any>(null);
  const [assignModel, setAssignModel] = useState<any>(null);

  const { data: models, refetch } = trpc.spaModels.list.useQuery({
    brand: brandFilter !== "all" ? brandFilter : undefined,
    search: search || undefined,
  });

  const deleteMutation = trpc.spaModels.delete.useMutation({
    onSuccess: () => {
      toast.success("Modèle supprimé");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  // Compter les pièces par modèle
  const { data: modelsWithCount } = trpc.spaModels.listWithPartCount.useQuery({
    brand: brandFilter !== "all" ? brandFilter : undefined,
  });

  const partCountMap = new Map((modelsWithCount || []).map((m: any) => [m.id, m.partCount]));

  const filteredModels = (models || []).filter((m: any) => {
    if (search) {
      const s = search.toLowerCase();
      return m.name.toLowerCase().includes(s) || (m.series || "").toLowerCase().includes(s);
    }
    return true;
  });

  // Grouper par marque
  const grouped = new Map<string, any[]>();
  for (const m of filteredModels) {
    const list = grouped.get(m.brand) || [];
    list.push(m);
    grouped.set(m.brand, list);
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Modèles de Spa</h1>
            <p className="text-sm text-muted-foreground">
              Gérez les modèles et attribuez les pièces détachées à chaque modèle
            </p>
          </div>
          <Button onClick={() => { setEditModel(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Nouveau modèle
          </Button>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un modèle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Marque" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les marques</SelectItem>
              {Object.entries(BRANDS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{filteredModels.length}</p>
              <p className="text-xs text-muted-foreground">Modèles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{grouped.size}</p>
              <p className="text-xs text-muted-foreground">Marques</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">
                {filteredModels.filter((m: any) => (partCountMap.get(m.id) || 0) > 0).length}
              </p>
              <p className="text-xs text-muted-foreground">Avec pièces</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">
                {filteredModels.filter((m: any) => (partCountMap.get(m.id) || 0) === 0).length}
              </p>
              <p className="text-xs text-muted-foreground">Sans pièces</p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des modèles groupés par marque */}
        {Array.from(grouped.entries()).map(([brand, brandModels]) => (
          <div key={brand} className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Badge className={BRAND_COLORS[brand] || ""}>{BRANDS[brand] || brand}</Badge>
              <span className="text-sm text-muted-foreground">({brandModels.length} modèles)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {brandModels.map((model: any) => {
                const pc = partCountMap.get(model.id) || 0;
                return (
                  <Card key={model.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    {/* Image */}
                    <div className="h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                      {model.imageUrl ? (
                        <img src={model.imageUrl} alt={model.name} className="w-full h-full object-contain p-2" />
                      ) : (
                        <Package className="w-12 h-12 text-gray-300" />
                      )}
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-base">{model.name}</h3>
                        {model.series && (
                          <p className="text-xs text-muted-foreground">Gamme : {model.series}</p>
                        )}
                      </div>
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
                        <Badge variant={pc > 0 ? "default" : "secondary"} className="text-xs">
                          {pc} pièce{pc !== 1 ? "s" : ""}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => setAssignModel(model)}
                          >
                            <Link2 className="w-3 h-3 mr-1" /> Pièces
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => { setEditModel(model); setShowForm(true); }}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            onClick={() => {
                              if (confirm(`Supprimer "${model.name}" ?`)) {
                                deleteMutation.mutate({ id: model.id });
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {filteredModels.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-500">Aucun modèle de spa</p>
            <p className="text-sm text-muted-foreground mb-4">Commencez par créer vos modèles de spa</p>
            <Button onClick={() => { setEditModel(null); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Créer un modèle
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showForm && (
        <ModelFormDialog
          open={showForm}
          onOpenChange={(v) => { setShowForm(v); if (!v) setEditModel(null); }}
          editModel={editModel}
          onSuccess={refetch}
        />
      )}
      {assignModel && (
        <AssignPartsDialog
          open={!!assignModel}
          onOpenChange={(v) => { if (!v) setAssignModel(null); }}
          model={assignModel}
          onSuccess={refetch}
        />
      )}
    </AdminLayout>
  );
}
