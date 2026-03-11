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
import { Checkbox } from "@/components/ui/checkbox";
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
  Box,
  Users,
  Ruler,
  Loader2,
  Check,
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

const BRAND_COLORS: Record<string, string> = {
  MARKET_SPAS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  WELLIS_CLASSIC: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  WELLIS_LIFE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  WELLIS_WIBES: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  PASSION_SPAS: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  PLATINUM_SPAS: "bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300",
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
  const [mainTab, setMainTab] = useState("catalogue");

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl md:text-2xl text-display font-bold">Pièces Détachées</h1>
          <p className="text-muted-foreground">
            Gérez le catalogue de pièces détachées et les modèles de spa
          </p>
        </div>

        {/* Onglets principaux */}
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="catalogue" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Catalogue de pièces</span>
              <span className="sm:hidden">Pièces</span>
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center gap-2">
              <Box className="h-4 w-4" />
              <span className="hidden sm:inline">Modèles de Spa</span>
              <span className="sm:hidden">Modèles</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalogue" className="mt-4">
            <CatalogueTab />
          </TabsContent>

          <TabsContent value="models" className="mt-4">
            <SpaModelsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// ============================================
// ONGLET CATALOGUE DE PIÈCES
// ============================================

function CatalogueTab() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPart, setEditingPart] = useState<any>(null);
  const [compatDialog, setCompatDialog] = useState<any>(null);

  const partsQuery = trpc.spareParts.list.useQuery({
    search: search || undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
  });

  const utils = trpc.useUtils();

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
    <div className="space-y-6">
      {/* Action button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une pièce
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total pièces</p>
                <p className="text-2xl text-display font-bold">{parts.filter((p: any) => p.isActive).length}</p>
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
                <p className="text-2xl text-display font-bold text-orange-600 dark:text-orange-400">{lowStockParts.length}</p>
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
                <p className="text-2xl text-display font-bold">
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
                <p className="text-2xl text-display font-bold">{parts.filter((p: any) => !p.isActive).length}</p>
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
        {/* Vue mobile en cartes */}
        <div className="md:hidden p-3 space-y-3">
          {parts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {partsQuery.isLoading ? "Chargement..." : "Aucune pièce trouvée."}
            </div>
          ) : (
            parts.map((part: any) => (
              <Card key={part.id} className={`p-3 ${!part.isActive ? 'opacity-50' : ''}`}>
                <div className="flex items-start gap-3">
                  {part.imageUrl && <img src={part.imageUrl} alt={part.name} className="w-12 h-12 rounded object-cover flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{part.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{part.reference}</p>
                      </div>
                      <p className="font-semibold text-sm flex-shrink-0">{parseFloat(part.priceHT).toFixed(2)} €</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant="outline" className="text-[10px]">{CATEGORIES[part.category] || part.category}</Badge>
                      <Badge variant={part.stockQuantity <= (part.lowStockThreshold || 3) ? 'destructive' : 'default'} className="text-[10px]">Stock: {part.stockQuantity}</Badge>
                      <Badge variant={part.isActive ? 'default' : 'secondary'} className="text-[10px]">{part.isActive ? 'Actif' : 'Inactif'}</Badge>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button variant="ghost" size="sm" onClick={() => setCompatDialog(part)}><Link2 className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingPart(part)}><Edit className="h-3 w-3" /></Button>
                      {part.isActive && <Button variant="ghost" size="sm" onClick={() => { if (confirm('Désactiver ?')) deleteMutation.mutate({ id: part.id }); }}><Trash2 className="h-3 w-3 text-destructive" /></Button>}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Vue desktop en tableau */}
        <CardContent className="p-0 hidden md:block">
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
                          <img src={part.imageUrl} alt={part.name} className="w-10 h-10 rounded object-cover" />
                        )}
                        <div>
                          <p className="font-medium">{part.name}</p>
                          {part.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{part.description}</p>
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
                      <Badge variant={part.stockQuantity <= (part.lowStockThreshold || 3) ? "destructive" : "default"}>
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
                        <Button variant="ghost" size="sm" onClick={() => setCompatDialog(part)} title="Gérer les compatibilités">
                          <Link2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingPart(part)} title="Modifier">
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
  );
}

// ============================================
// ONGLET MODÈLES DE SPA
// ============================================

function SpaModelsTab() {
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
    <div className="space-y-6">
      {/* Action button */}
      <div className="flex justify-end">
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
                  <div className="h-40 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center overflow-hidden">
                    {model.imageUrl ? (
                      <img src={model.imageUrl} alt={model.name} className="w-full h-full object-contain p-2" />
                    ) : (
                      <Package className="w-12 h-12 text-gray-300 dark:text-gray-600" />
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
          <Package className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-lg font-medium text-gray-500">Aucun modèle de spa</p>
          <p className="text-sm text-muted-foreground mb-4">Commencez par créer vos modèles de spa</p>
          <Button onClick={() => { setEditModel(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Créer un modèle
          </Button>
        </div>
      )}

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
    </div>
  );
}

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
              <img src={imageUrl} alt="Preview" className="mt-2 h-32 w-full object-contain rounded-lg bg-gray-50 dark:bg-gray-800" />
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

  const { data: assignedParts, refetch: refetchAssigned } = trpc.spaModels.getParts.useQuery(
    { spaModelId: model?.id },
    { enabled: !!model }
  );

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
            <div className="flex-1 overflow-y-auto space-y-1 border rounded-lg p-2 bg-green-50/30 dark:bg-green-900/10">
              {(!assignedParts || assignedParts.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-8">Aucune pièce attribuée</p>
              ) : (
                assignedParts.map((p: any) => (
                  <div key={p.linkId} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-md px-3 py-2 border">
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
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
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
                    className={`flex items-center gap-3 bg-white dark:bg-gray-800 rounded-md px-3 py-2 border cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors ${
                      selectedIds.has(p.id) ? "border-blue-400 bg-blue-50/30 dark:bg-blue-900/30" : ""
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
// FORMULAIRE CRÉATION/ÉDITION PIÈCE
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
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
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

        <DialogFooter className="flex-col sm:flex-row gap-2">
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

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
