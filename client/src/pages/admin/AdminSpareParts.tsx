import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  Link2,
  X,
  Cog,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// CONSTANTES
// ============================================

const CATEGORIES: Record<string, string> = {
  PUMPS: "Pompes",
  ELECTRONICS: "Électronique / Cartes mères",
  JETS: "Jets",
  SCREENS: "Écrans / Afficheurs",
  HEATING: "Chauffage",
  PLUMBING: "Plomberie",
  COVERS: "Couvertures thermiques",
  CABINETS: "Habillage (Cabinet)",
  LIGHTING: "Éclairage LED",
  AUDIO: "Système audio",
  OZONE_UVC: "Ozone / UVC",
  OTHER: "Autres",
};

const BRANDS: Record<string, string> = {
  MARKET_SPAS: "Market Spas",
  WELLIS_CLASSIC: "Wellis Classic",
  WELLIS_LIFE: "Wellis Life",
  WELLIS_WIBES: "Wellis Wibes",
  PASSION_SPAS: "Passion Spas",
  PLATINUM_SPAS: "Platinum Spas",
};

const COMPONENTS = [
  "Pompes",
  "Boîtier de commande / Afficheur",
  "Chauffage",
  "Jets",
  "Éclairage LED",
  "Système audio",
  "Générateur d'ozone / UVC",
  "Plomberie",
  "Couverture thermique",
  "Habillage (Cabinet)",
  "Pompe à chaleur",
  "Composants EVA (appuie-tête, couvercle filtre)",
  "Composants optionnels",
  "Cadre / Isolation WPS",
  "Marchepieds / Table / Tabouret",
  "Structure / Coque",
  "Surface de la coque (Shell)",
];

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function AdminSpareParts() {
  const { user } = useAuth();
  // toast from sonner is imported at top level
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPart, setEditingPart] = useState<any>(null);
  const [compatDialog, setCompatDialog] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("list");

  // Queries
  const partsQuery = trpc.spareParts.list.useQuery({
    search: search || undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
  });

  const utils = trpc.useUtils();

  // Mutations
  const createMutation = trpc.spareParts.create.useMutation({
    onSuccess: () => {
      toast.success("Pièce créée avec succès");
      utils.spareParts.list.invalidate();
      setShowCreateDialog(false);
    },
    onError: (err) => toast.error(err.message || "Erreur lors de la création"),
  });

  const updateMutation = trpc.spareParts.update.useMutation({
    onSuccess: () => {
      toast.success("Pièce mise à jour");
      utils.spareParts.list.invalidate();
      utils.spareParts.getById.invalidate();
      setEditingPart(null);
    },
    onError: (err) => toast.error(err.message || "Erreur lors de la mise à jour"),
  });

  const deleteMutation = trpc.spareParts.delete.useMutation({
    onSuccess: () => {
      toast.success("Pièce désactivée");
      utils.spareParts.list.invalidate();
    },
    onError: (err) => toast.error(err.message || "Erreur lors de la suppression"),
  });

  const addCompatMutation = trpc.spareParts.addCompatibility.useMutation({
    onSuccess: () => {
      toast.success("Compatibilité ajoutée");
      utils.spareParts.getById.invalidate();
    },
    onError: (err) => toast.error(err.message || "Erreur lors de l'ajout"),
  });

  const removeCompatMutation = trpc.spareParts.removeCompatibility.useMutation({
    onSuccess: () => {
      toast.success("Compatibilité supprimée");
      utils.spareParts.getById.invalidate();
    },
    onError: (err) => toast.error(err.message || "Erreur lors de la suppression"),
  });

  const parts = partsQuery.data || [];
  const lowStockParts = parts.filter(
    (p: any) => p.isActive && p.stockQuantity !== null && p.lowStockThreshold !== null && p.stockQuantity <= p.lowStockThreshold
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl text-display font-bold">Pièces Détachées</h1>
            <p className="text-muted-foreground">
              Gérez le catalogue de pièces détachées et leurs compatibilités
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une pièce
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Total pièces</p>
                  <p className="text-2xl text-display text-display font-bold">{parts.filter((p: any) => p.isActive).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/15 dark:bg-orange-500/25 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Stock bas</p>
                  <p className="text-2xl text-display text-display font-bold text-orange-600 dark:text-orange-400">{lowStockParts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/15 dark:bg-emerald-500/25 rounded-lg">
                  <Cog className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Catégories</p>
                  <p className="text-2xl text-display text-display font-bold">
                    {new Set(parts.filter((p: any) => p.isActive).map((p: any) => p.category)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-info/15 dark:bg-info-light rounded-lg">
                  <Link2 className="h-5 w-5 text-info dark:text-info-dark" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Inactives</p>
                  <p className="text-2xl text-display text-display font-bold">{parts.filter((p: any) => !p.isActive).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {lowStockParts.length > 0 && (
          <Card className="border-orange-500/20 dark:border-orange-500/30 bg-orange-500/10 dark:bg-orange-500/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800 dark:text-orange-400">Alerte stock bas</p>
                  <p className="text-sm text-orange-700 dark:text-orange-400">
                    {lowStockParts.length} pièce(s) en stock bas :{" "}
                    {lowStockParts.map((p: any) => `${p.name} (${p.stockQuantity})`).join(", ")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, référence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {Object.entries(CATEGORIES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Parts Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Prix HT</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      {partsQuery.isLoading
                        ? "Chargement..."
                        : "Aucune pièce trouvée. Cliquez sur 'Ajouter une pièce' pour commencer."}
                    </TableCell>
                  </TableRow>
                ) : (
                  parts.map((part: any) => (
                    <TableRow key={part.id} className={!part.isActive ? "opacity-50" : ""}>
                      <TableCell className="font-mono text-sm">{part.reference}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {part.imageUrl && (
                            <img
                              src={part.imageUrl}
                              alt={part.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium">{part.name}</p>
                            {part.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {part.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{CATEGORIES[part.category] || part.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {parseFloat(part.priceHT).toFixed(2)} €
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            part.stockQuantity <= (part.lowStockThreshold || 3)
                              ? "destructive"
                              : "default"
                          }
                        >
                          {part.stockQuantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={part.isActive ? "default" : "secondary"}>
                          {part.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCompatDialog(part)}
                            title="Gérer les compatibilités"
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPart(part)}
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {part.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Désactiver cette pièce ?")) {
                                  deleteMutation.mutate({ id: part.id });
                                }
                              }}
                              title="Désactiver"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <SparePartFormDialog
          open={showCreateDialog || !!editingPart}
          onClose={() => {
            setShowCreateDialog(false);
            setEditingPart(null);
          }}
          part={editingPart}
          onSubmit={(data) => {
            if (editingPart) {
              updateMutation.mutate({ id: editingPart.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />

        {/* Compatibility Dialog */}
        {compatDialog && (
          <CompatibilityDialog
            part={compatDialog}
            onClose={() => setCompatDialog(null)}
            onAdd={(data) => addCompatMutation.mutate(data)}
            onRemove={(id) => removeCompatMutation.mutate({ id })}
            isAdding={addCompatMutation.isPending}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// ============================================
// FORMULAIRE CRÉATION/ÉDITION
// ============================================

function SparePartFormDialog({
  open,
  onClose,
  part,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  part: any;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<any>({
    reference: "",
    name: "",
    description: "",
    category: "PUMPS",
    priceHT: "",
    vatRate: "21",
    stockQuantity: 0,
    lowStockThreshold: 3,
    imageUrl: "",
    weight: "",
  });

  // Reset form when dialog opens
  useState(() => {
    if (part) {
      setForm({
        reference: part.reference || "",
        name: part.name || "",
        description: part.description || "",
        category: part.category || "PUMPS",
        priceHT: part.priceHT || "",
        vatRate: part.vatRate || "21",
        stockQuantity: part.stockQuantity || 0,
        lowStockThreshold: part.lowStockThreshold || 3,
        imageUrl: part.imageUrl || "",
        weight: part.weight || "",
      });
    }
  });

  // Update form when part changes
  const handleOpen = () => {
    if (part) {
      setForm({
        reference: part.reference || "",
        name: part.name || "",
        description: part.description || "",
        category: part.category || "PUMPS",
        priceHT: part.priceHT || "",
        vatRate: part.vatRate || "21",
        stockQuantity: part.stockQuantity || 0,
        lowStockThreshold: part.lowStockThreshold || 3,
        imageUrl: part.imageUrl || "",
        weight: part.weight || "",
      });
    } else {
      setForm({
        reference: "",
        name: "",
        description: "",
        category: "PUMPS",
        priceHT: "",
        vatRate: "21",
        stockQuantity: 0,
        lowStockThreshold: 3,
        imageUrl: "",
        weight: "",
      });
    }
  };

  // biome-ignore lint: reset form on open
  if (open && form.reference === "" && part?.reference) {
    handleOpen();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{part ? "Modifier la pièce" : "Ajouter une pièce"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Référence *</Label>
            <Input
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="Ex: PMP-001"
            />
          </div>
          <div className="space-y-2">
            <Label>Nom *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Pompe de circulation 2HP"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description détaillée de la pièce..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Catégorie *</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORIES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Prix HT (€) *</Label>
            <Input
              type="number"
              step="0.01"
              value={form.priceHT}
              onChange={(e) => setForm({ ...form, priceHT: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label>TVA (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.vatRate}
              onChange={(e) => setForm({ ...form, vatRate: e.target.value })}
              placeholder="21"
            />
          </div>
          <div className="space-y-2">
            <Label>Stock</Label>
            <Input
              type="number"
              value={form.stockQuantity}
              onChange={(e) => setForm({ ...form, stockQuantity: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Seuil alerte stock</Label>
            <Input
              type="number"
              value={form.lowStockThreshold}
              onChange={(e) =>
                setForm({ ...form, lowStockThreshold: parseInt(e.target.value) || 3 })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Poids (kg)</Label>
            <Input
              type="number"
              step="0.001"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              placeholder="0.000"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>URL de l'image</Label>
            <Input
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://..."
            />
            {form.imageUrl && (
              <img
                src={form.imageUrl}
                alt="Aperçu"
                className="w-20 h-20 rounded object-cover mt-2"
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              if (!form.reference || !form.name || !form.priceHT) {
                return;
              }
              onSubmit({
                reference: form.reference,
                name: form.name,
                description: form.description || undefined,
                category: form.category,
                priceHT: form.priceHT,
                vatRate: form.vatRate || "21",
                stockQuantity: form.stockQuantity,
                lowStockThreshold: form.lowStockThreshold,
                imageUrl: form.imageUrl || undefined,
                weight: form.weight || undefined,
              });
            }}
            disabled={isLoading || !form.reference || !form.name || !form.priceHT}
          >
            {isLoading ? "Enregistrement..." : part ? "Mettre à jour" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// DIALOG COMPATIBILITÉS
// ============================================

function CompatibilityDialog({
  part,
  onClose,
  onAdd,
  onRemove,
  isAdding,
}: {
  part: any;
  onClose: () => void;
  onAdd: (data: any) => void;
  onRemove: (id: number) => void;
  isAdding: boolean;
}) {
  const partDetail = trpc.spareParts.getById.useQuery({ id: part.id });
  const [newCompat, setNewCompat] = useState({
    brand: "MARKET_SPAS",
    productLine: "",
    modelName: "",
    component: "Pompes",
  });

  const compatList = (partDetail.data as any)?.compatibility || [];

  return (
    <Dialog open={true} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Compatibilités — {part.name} ({part.reference})
          </DialogTitle>
        </DialogHeader>

        {/* Existing compatibilities */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">
            Compatibilités existantes ({compatList.length})
          </h3>
          {compatList.length === 0 ? (
            <p className="text-xs md:text-sm text-muted-foreground py-4 text-center">
              Aucune compatibilité définie. Ajoutez-en ci-dessous.
            </p>
          ) : (
            <div className="space-y-2">
              {compatList.map((c: any) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge>{BRANDS[c.brand] || c.brand}</Badge>
                    {c.productLine && <Badge variant="outline">{c.productLine}</Badge>}
                    {c.modelName && (
                      <Badge variant="secondary">{c.modelName}</Badge>
                    )}
                    <span className="text-sm text-muted-foreground">→</span>
                    <span className="text-sm font-medium">{c.component}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Supprimer cette compatibilité ?")) {
                        onRemove(c.id);
                      }
                    }}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add new compatibility */}
        <div className="border-t pt-4 space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">
            Ajouter une compatibilité
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Marque *</Label>
              <Select
                value={newCompat.brand}
                onValueChange={(v) => setNewCompat({ ...newCompat, brand: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BRANDS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Gamme (optionnel)</Label>
              <Input
                value={newCompat.productLine}
                onChange={(e) =>
                  setNewCompat({ ...newCompat, productLine: e.target.value })
                }
                placeholder="Ex: Deluxe, Premium..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Modèle (optionnel)</Label>
              <Input
                value={newCompat.modelName}
                onChange={(e) =>
                  setNewCompat({ ...newCompat, modelName: e.target.value })
                }
                placeholder="Ex: Everest, Kilimanjaro..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Composant *</Label>
              <Select
                value={newCompat.component}
                onValueChange={(v) => setNewCompat({ ...newCompat, component: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPONENTS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={() => {
              onAdd({
                sparePartId: part.id,
                brand: newCompat.brand,
                productLine: newCompat.productLine || undefined,
                modelName: newCompat.modelName || undefined,
                component: newCompat.component,
              });
              setNewCompat({
                ...newCompat,
                productLine: "",
                modelName: "",
              });
            }}
            disabled={isAdding}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isAdding ? "Ajout..." : "Ajouter la compatibilité"}
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
