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
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useRef, useEffect, useMemo } from "react";
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
  Upload,
  ChevronRight,
  ArrowLeft,
  LayoutGrid,
  List,
  Eye,
  Hash,
  Layers,
  FileImage,
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

const BRAND_ACCENT: Record<string, { bg: string; text: string; ring: string }> = {
  MARKET_SPAS: { bg: "bg-sky-50 dark:bg-sky-950/40", text: "text-sky-700 dark:text-sky-300", ring: "ring-sky-200 dark:ring-sky-800" },
  WELLIS_CLASSIC: { bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-300", ring: "ring-violet-200 dark:ring-violet-800" },
  WELLIS_LIFE: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200 dark:ring-emerald-800" },
  WELLIS_WIBES: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-200 dark:ring-amber-800" },
  PASSION_SPAS: { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-200 dark:ring-rose-800" },
  PLATINUM_SPAS: { bg: "bg-zinc-100 dark:bg-zinc-800/40", text: "text-zinc-700 dark:text-zinc-300", ring: "ring-zinc-300 dark:ring-zinc-700" },
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
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pièces Détachées</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez le catalogue de pièces et les nomenclatures par modèle de spa
          </p>
        </div>

        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList>
            <TabsTrigger value="catalogue" className="gap-2">
              <Package className="h-4 w-4" />
              Catalogue
            </TabsTrigger>
            <TabsTrigger value="models" className="gap-2">
              <Layers className="h-4 w-4" />
              Modèles et nomenclatures
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalogue" className="mt-6">
            <CatalogueTab />
          </TabsContent>

          <TabsContent value="models" className="mt-6">
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
  const activeParts = parts.filter((p: any) => p.isActive);
  const lowStockParts = activeParts.filter(
    (p: any) => p.stockQuantity !== null && p.lowStockThreshold !== null && p.stockQuantity <= p.lowStockThreshold
  );

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, référence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {Object.entries(CATEGORIES).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une pièce
        </Button>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total pièces" value={activeParts.length} icon={Package} />
        <MetricCard label="Stock bas" value={lowStockParts.length} icon={AlertTriangle} accent={lowStockParts.length > 0 ? "warning" : undefined} />
        <MetricCard label="Catégories" value={new Set(activeParts.map((p: any) => p.category)).size} icon={Cog} />
        <MetricCard label="Inactives" value={parts.filter((p: any) => !p.isActive).length} icon={Link2} />
      </div>

      {/* Low stock alert */}
      {lowStockParts.length > 0 && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-4 flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {lowStockParts.length} pièce{lowStockParts.length > 1 ? "s" : ""} en stock bas
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              {lowStockParts.map((p: any) => `${p.name} (${p.stockQuantity})`).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* Parts Table */}
      <Card>
        {/* Mobile cards */}
        <div className="md:hidden p-3 space-y-2">
          {parts.length === 0 ? (
            <EmptyState loading={partsQuery.isLoading} message="Aucune pièce trouvée" sub="Cliquez sur « Ajouter une pièce » pour commencer." />
          ) : (
            parts.map((part: any) => (
              <div key={part.id} className={`rounded-lg border p-3 space-y-2 ${!part.isActive ? "opacity-50" : ""}`}>
                <div className="flex items-start gap-3">
                  {part.imageUrl && <img src={part.imageUrl} alt={part.name} className="w-12 h-12 rounded object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{part.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{part.reference}</p>
                  </div>
                  <p className="font-semibold text-sm shrink-0">{parseFloat(part.priceHT).toFixed(2)} €</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-[10px]">{CATEGORIES[part.category] || part.category}</Badge>
                    <Badge variant={part.stockQuantity <= (part.lowStockThreshold || 3) ? "destructive" : "default"} className="text-[10px]">
                      Stock: {part.stockQuantity}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setCompatDialog(part)}><Link2 className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingPart(part)}><Edit className="h-3 w-3" /></Button>
                    {part.isActive && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { if (confirm("Désactiver ?")) deleteMutation.mutate({ id: part.id }); }}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop table */}
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
                    {partsQuery.isLoading ? "Chargement..." : "Aucune pièce trouvée. Cliquez sur « Ajouter une pièce » pour commencer."}
                  </TableCell>
                </TableRow>
              ) : (
                parts.map((part: any) => (
                  <TableRow key={part.id} className={!part.isActive ? "opacity-50" : ""}>
                    <TableCell className="font-mono text-sm">{part.reference}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {part.imageUrl && <img src={part.imageUrl} alt={part.name} className="w-10 h-10 rounded object-cover" />}
                        <div>
                          <p className="font-medium">{part.name}</p>
                          {part.description && <p className="text-xs text-muted-foreground line-clamp-1">{part.description}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{CATEGORIES[part.category] || part.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{parseFloat(part.priceHT).toFixed(2)} €</TableCell>
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
                        <Button variant="ghost" size="sm" onClick={() => setCompatDialog(part)} title="Compatibilités">
                          <Link2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingPart(part)} title="Modifier">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {part.isActive && (
                          <Button variant="ghost" size="sm" onClick={() => { if (confirm("Désactiver cette pièce ?")) deleteMutation.mutate({ id: part.id }); }} title="Désactiver">
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

      {/* Dialogs */}
      <SparePartFormDialog
        open={showCreateDialog || !!editingPart}
        onClose={() => { setShowCreateDialog(false); setEditingPart(null); }}
        part={editingPart}
        onSubmit={(data) => {
          if (editingPart) updateMutation.mutate({ id: editingPart.id, data });
          else createMutation.mutate(data);
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
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
// ONGLET MODÈLES DE SPA — Affichage direct Market Spas
// ============================================

type ModelsView = "models" | "nomenclature";

function SpaModelsTab() {
  const [view, setView] = useState<ModelsView>("models");
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editModel, setEditModel] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Queries — only Market Spas models
  const { data: allModels, refetch } = trpc.spaModels.list.useQuery({});
  const { data: modelsWithCount, refetch: refetchCounts } = trpc.spaModels.listWithPartCount.useQuery({});

  const marketSpasModels = useMemo(() => {
    return (allModels || []).filter((m: any) => m.brand === "MARKET_SPAS");
  }, [allModels]);

  const partCountMap = useMemo(() => {
    return new Map((modelsWithCount || []).map((m: any) => [m.id, m.partCount]));
  }, [modelsWithCount]);

  const totalParts = useMemo(() => {
    return marketSpasModels.reduce((sum: number, m: any) => sum + (partCountMap.get(m.id) || 0), 0);
  }, [marketSpasModels, partCountMap]);

  const deleteMutation = trpc.spaModels.delete.useMutation({
    onSuccess: () => {
      toast.success("Modèle supprimé");
      refetch();
      refetchCounts();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleRefresh = () => { refetch(); refetchCounts(); };

  const filtered = marketSpasModels.filter((m: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return m.name.toLowerCase().includes(s) || (m.series || "").toLowerCase().includes(s) || (m.dimensions || "").toLowerCase().includes(s);
  });

  // Group by series
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

  // Breadcrumb
  const breadcrumb = (
    <div className="flex items-center gap-1.5 text-sm mb-6">
      <button
        onClick={() => { setView("models"); setSelectedModel(null); }}
        className={`transition-colors ${view === "models" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
      >
        Modèles Market Spas
      </button>
      {selectedModel && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-foreground font-medium">{selectedModel.name}</span>
        </>
      )}
    </div>
  );

  return (
    <div>
      {breadcrumb}

      {view === "models" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Modèles Market Spas</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {marketSpasModels.length} modèle{marketSpasModels.length !== 1 ? "s" : ""} · {totalParts} pièce{totalParts !== 1 ? "s" : ""} au total
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex border rounded-lg overflow-hidden">
                <button onClick={() => setViewMode("grid")} className={`p-2 transition-colors ${viewMode === "grid" ? "bg-muted" : "hover:bg-muted/50"}`}>
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode("list")} className={`p-2 transition-colors ${viewMode === "list" ? "bg-muted" : "hover:bg-muted/50"}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
              <Button onClick={() => { setEditModel(null); setShowForm(true); }} className="shrink-0">
                <Plus className="w-4 h-4 mr-2" /> Nouveau modèle
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Rechercher un modèle..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>

          {/* Models */}
          {filtered.length === 0 ? (
            <EmptyState
              loading={!allModels}
              message={search ? "Aucun modèle trouvé" : "Aucun modèle Market Spas"}
              sub={search ? "Essayez un autre terme" : "Créez votre premier modèle"}
              action={!search ? <Button variant="outline" onClick={() => { setEditModel(null); setShowForm(true); }}><Plus className="w-4 h-4 mr-2" /> Créer un modèle</Button> : undefined}
            />
          ) : (
            Array.from(grouped.entries()).map(([series, seriesModels]) => (
              <div key={series} className="space-y-3">
                {grouped.size > 1 && (
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{series}</h3>
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">{seriesModels.length}</span>
                  </div>
                )}

                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {seriesModels.map((model: any) => {
                      const pc = partCountMap.get(model.id) || 0;
                      return (
                        <div
                          key={model.id}
                          className="group rounded-xl border bg-card overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
                          onClick={() => { setSelectedModel(model); setView("nomenclature"); }}
                        >
                          <div className="h-36 bg-muted/30 flex items-center justify-center overflow-hidden relative">
                            {model.schemaImageUrl ? (
                              <img src={model.schemaImageUrl} alt={model.name} className="w-full h-full object-contain p-2" />
                            ) : model.imageUrl ? (
                              <img src={model.imageUrl} alt={model.name} className="w-full h-full object-contain p-3" />
                            ) : (
                              <Box className="w-10 h-10 text-muted-foreground/30" />
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium bg-background/90 px-3 py-1.5 rounded-full shadow-sm">
                                Voir la nomenclature
                              </span>
                            </div>
                          </div>
                          <div className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-sm leading-tight">{model.name}</h4>
                              <div className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditModel(model); setShowForm(true); }}>
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => {
                                  if (confirm(`Supprimer « ${model.name} » et toutes ses pièces associées ?`)) deleteMutation.mutate({ id: model.id });
                                }}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              {model.seats && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {model.seats}p</span>}
                              {model.dimensions && <span className="flex items-center gap-1"><Ruler className="w-3 h-3" /> {model.dimensions}</span>}
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <Badge variant={pc > 0 ? "default" : "secondary"} className="text-[10px]">
                                {pc} pièce{pc !== 1 ? "s" : ""}
                              </Badge>
                              {pc === 0 && <span className="text-[10px] text-amber-600 dark:text-amber-400">Nomenclature vide</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {seriesModels.map((model: any) => {
                      const pc = partCountMap.get(model.id) || 0;
                      return (
                        <div
                          key={model.id}
                          className="group flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => { setSelectedModel(model); setView("nomenclature"); }}
                        >
                          <div className="w-14 h-14 rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                            {model.schemaImageUrl ? (
                              <img src={model.schemaImageUrl} alt={model.name} className="w-full h-full object-contain p-1" />
                            ) : model.imageUrl ? (
                              <img src={model.imageUrl} alt={model.name} className="w-full h-full object-contain p-1" />
                            ) : (
                              <Box className="w-6 h-6 text-muted-foreground/30" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{model.name}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                              {model.series && <span>Série : {model.series}</span>}
                              {model.seats && <span>{model.seats} places</span>}
                              {model.dimensions && <span>{model.dimensions}</span>}
                            </div>
                          </div>
                          <Badge variant={pc > 0 ? "default" : "secondary"} className="text-xs shrink-0">
                            {pc} pièce{pc !== 1 ? "s" : ""}
                          </Badge>
                          <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditModel(model); setShowForm(true); }}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => {
                              if (confirm(`Supprimer « ${model.name} » ?`)) deleteMutation.mutate({ id: model.id });
                            }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {view === "nomenclature" && selectedModel && (
        <NomenclatureView
          model={selectedModel}
          brand="MARKET_SPAS"
          onBack={() => { setView("models"); setSelectedModel(null); }}
          onRefresh={handleRefresh}
        />
      )}

      {/* Create/Edit Model Dialog */}
      {showForm && (
        <ModelFormDialog
          open={showForm}
          onOpenChange={(v) => { setShowForm(v); if (!v) setEditModel(null); }}
          editModel={editModel}
          defaultBrand="MARKET_SPAS"
          onSuccess={() => { handleRefresh(); }}
        />
      )}
    </div>
  );
}

// BrandsOverview and BrandModelsView removed — now directly showing Market Spas models in SpaModelsTab

// ============================================
// NOMENCLATURE VIEW — Pièces d'un modèle
// ============================================

function NomenclatureView({
  model,
  brand,
  onBack,
  onRefresh,
}: {
  model: any;
  brand: string;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAssign, setShowAssign] = useState(false);

  const { data: parts, refetch } = trpc.spaModels.getParts.useQuery({ spaModelId: model.id });
  const accent = BRAND_ACCENT[brand];

  const removeMutation = trpc.spaModels.removePart.useMutation({
    onSuccess: () => {
      toast.success("Pièce retirée de la nomenclature");
      refetch();
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = (parts || []).filter((p: any) => {
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return p.name.toLowerCase().includes(s) || p.reference.toLowerCase().includes(s);
    }
    return true;
  });

  // Group by category
  const grouped = new Map<string, any[]>();
  for (const p of filtered) {
    const list = grouped.get(p.category) || [];
    list.push(p);
    grouped.set(p.category, list);
  }

  const availableCategories = [...new Set((parts || []).map((p: any) => p.category))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0 -ml-2 mt-0.5">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex gap-4">
            {model.imageUrl && (
              <div className="w-20 h-20 rounded-lg bg-muted/30 overflow-hidden shrink-0 hidden sm:block">
                <img src={model.imageUrl} alt={model.name} className="w-full h-full object-contain p-1" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold">{model.name}</h2>
                <Badge className={`${accent.bg} ${accent.text} border-0 text-xs`}>{BRANDS[brand]}</Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                {model.series && <span>Série : {model.series}</span>}
                {model.seats && <span>{model.seats} places</span>}
                {model.dimensions && <span>{model.dimensions}</span>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                <strong className="text-foreground">{parts?.length || 0}</strong> pièce{(parts?.length || 0) !== 1 ? "s" : ""} dans la nomenclature
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowAssign(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Ajouter des pièces
        </Button>
      </div>

      {/* Schema technique */}
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
                if (img.style.maxHeight === 'none') {
                  img.style.maxHeight = '500px';
                  img.style.cursor = 'zoom-in';
                } else {
                  img.style.maxHeight = 'none';
                  img.style.cursor = 'zoom-out';
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher une pièce..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        {availableCategories.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                categoryFilter === "all" ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Toutes ({parts?.length || 0})
            </button>
            {availableCategories.map((cat) => {
              const count = (parts || []).filter((p: any) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat === categoryFilter ? "all" : cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    categoryFilter === cat ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {CATEGORIES[cat] || cat} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Parts list by category */}
      {(!parts || parts.length === 0) ? (
        <EmptyState
          message="Nomenclature vide"
          sub={`Aucune pièce n'est associée à ${model.name}. Ajoutez des pièces depuis le catalogue.`}
          action={<Button variant="outline" onClick={() => setShowAssign(true)}><Plus className="w-4 h-4 mr-2" /> Ajouter des pièces</Button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState message="Aucune pièce trouvée" sub="Essayez un autre terme de recherche ou catégorie" />
      ) : (
        Array.from(grouped.entries()).map(([category, categoryParts]) => (
          <div key={category} className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {CATEGORIES[category] || category}
              </h3>
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">{categoryParts.length}</span>
            </div>
            <div className="space-y-1">
              {categoryParts.map((part: any) => (
                <div key={part.linkId} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/20 transition-colors">
                  {part.imageUrl ? (
                    <img src={part.imageUrl} alt={part.name} className="w-10 h-10 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted/30 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{part.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{part.reference}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm">{parseFloat(part.priceHT).toFixed(2)} €</p>
                    <p className="text-[10px] text-muted-foreground">HT</p>
                  </div>
                  <Badge variant={part.stockQuantity > 0 ? "default" : "destructive"} className="text-[10px] shrink-0">
                    Stock: {part.stockQuantity}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive shrink-0"
                    onClick={() => removeMutation.mutate({ linkId: part.linkId })}
                    disabled={removeMutation.isPending}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Assign parts dialog */}
      {showAssign && (
        <AssignPartsDialog
          open={showAssign}
          onOpenChange={setShowAssign}
          model={model}
          onSuccess={() => { refetch(); onRefresh(); }}
        />
      )}
    </div>
  );
}

// ============================================
// METRIC CARD
// ============================================

function MetricCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: any; accent?: "warning" }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          accent === "warning" ? "bg-amber-50 dark:bg-amber-950/40" : "bg-muted/50"
        }`}>
          <Icon className={`w-5 h-5 ${accent === "warning" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`} />
        </div>
        <div>
          <p className={`text-2xl font-semibold ${accent === "warning" && value > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState({ loading, message, sub, action }: { loading?: boolean; message: string; sub?: string; action?: React.ReactNode }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className="text-center py-16 space-y-3">
      <Package className="w-10 h-10 mx-auto text-muted-foreground/30" />
      <div>
        <p className="font-medium text-muted-foreground">{message}</p>
        {sub && <p className="text-sm text-muted-foreground/70 mt-1">{sub}</p>}
      </div>
      {action && <div className="pt-2">{action}</div>}
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
  defaultBrand,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editModel?: any;
  defaultBrand?: string;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("MARKET_SPAS");
  const [series, setSeries] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [seats, setSeats] = useState<string>("");
  const [dimensions, setDimensions] = useState("");
  const [sortOrder, setSortOrder] = useState<string>("0");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(editModel?.name || "");
      setBrand(editModel?.brand || defaultBrand || "MARKET_SPAS");
      setSeries(editModel?.series || "");
      setImageUrl(editModel?.imageUrl || "");
      setDescription(editModel?.description || "");
      setSeats(editModel?.seats?.toString() || "");
      setDimensions(editModel?.dimensions || "");
      setSortOrder(editModel?.sortOrder?.toString() || "0");
      setPreviewUrl(editModel?.imageUrl || null);
      setIsDragging(false);
      setIsUploading(false);
    }
  }, [open, editModel, defaultBrand]);

  const uploadImageMutation = trpc.spaModels.uploadImage.useMutation();

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

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Veuillez sélectionner une image"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("L'image ne doit pas dépasser 10 Mo"); return; }
    setIsUploading(true);
    try {
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await uploadImageMutation.mutateAsync({ imageData: base64, fileName: file.name });
      setImageUrl(result.url);
      setPreviewUrl(result.url);
      toast.success("Image uploadée");
    } catch {
      toast.error("Erreur lors de l'upload");
      setPreviewUrl(imageUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); const file = e.dataTransfer.files?.[0]; if (file) handleImageFile(file); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) handleImageFile(file); };
  const handleRemoveImage = () => { setImageUrl(""); setPreviewUrl(null); };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = () => {
    if (!name.trim() || !brand) { toast.error("Le nom et la marque sont requis"); return; }
    const data = {
      name: name.trim(),
      brand,
      series: series.trim() || undefined,
      imageUrl: imageUrl || undefined,
      description: description.trim() || undefined,
      seats: seats ? parseInt(seats) : undefined,
      dimensions: dimensions.trim() || undefined,
      sortOrder: sortOrder ? parseInt(sortOrder) : 0,
    };
    if (editModel) updateMutation.mutate({ id: editModel.id, data });
    else createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editModel ? "Modifier le modèle" : "Nouveau modèle de spa"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom du modèle *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Everest" />
            </div>
            <div className="space-y-2">
              <Label>Marque *</Label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(BRANDS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gamme / Série</Label>
              <Input value={series} onChange={(e) => setSeries(e.target.value)} placeholder="Ex: Cityline" />
            </div>
            <div className="space-y-2">
              <Label>Nombre de places</Label>
              <Input type="number" value={seats} onChange={(e) => setSeats(e.target.value)} placeholder="Ex: 5" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Dimensions</Label>
            <Input value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="Ex: 220 x 220 x 90 cm" />
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <Label>Image du modèle</Label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" disabled={isUploading} />
            {previewUrl ? (
              <div className="relative group">
                <img src={previewUrl} alt="Preview" className="h-36 w-full object-contain rounded-lg border bg-muted/20" />
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button type="button" variant="secondary" size="icon" className="h-7 w-7" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    <Upload className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={handleRemoveImage} disabled={isUploading}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                )}
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`h-36 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                  isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-muted-foreground/40"
                }`}
              >
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground/40" />
                    <span className="text-xs text-muted-foreground">Glissez-déposez ou cliquez</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Description du modèle..." />
          </div>
          <div className="space-y-2">
            <Label>Ordre d'affichage</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="0" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isLoading || isUploading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editModel ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// ASSIGN PARTS DIALOG
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

  const { data: allParts } = trpc.spareParts.list.useQuery({ isActive: true }, { enabled: open });

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
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Gérer la nomenclature — {model?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: assigned */}
          <div className="flex flex-col overflow-hidden">
            <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              Pièces dans la nomenclature ({assignedParts?.length || 0})
            </h3>
            <ScrollArea className="flex-1 border rounded-lg p-2">
              {(!assignedParts || assignedParts.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-8">Aucune pièce dans la nomenclature</p>
              ) : (
                <div className="space-y-1">
                  {assignedParts.map((p: any) => (
                    <div key={p.linkId} className="flex items-center justify-between rounded-md px-3 py-2 border bg-card">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono">{p.reference}</span>
                          <Badge variant="outline" className="text-[10px] px-1">{CATEGORIES[p.category] || p.category}</Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive shrink-0 h-7 w-7 p-0"
                        onClick={() => removeMutation.mutate({ linkId: p.linkId })}
                        disabled={removeMutation.isPending}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right: available */}
          <div className="flex flex-col overflow-hidden">
            <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Catalogue disponible
            </h3>
            <div className="flex gap-2 mb-2">
              <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 h-8 text-sm" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px] h-8 text-sm">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {Object.entries(CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <ScrollArea className="flex-1 border rounded-lg p-2">
              {filteredParts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Aucune pièce disponible</p>
              ) : (
                <div className="space-y-1">
                  {filteredParts.map((p: any) => (
                    <label
                      key={p.id}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 border cursor-pointer transition-colors ${
                        selectedIds.has(p.id) ? "border-primary/50 bg-primary/5" : "bg-card hover:bg-muted/30"
                      }`}
                    >
                      <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono">{p.reference}</span>
                          <Badge variant="outline" className="text-[10px] px-1">{CATEGORIES[p.category] || p.category}</Badge>
                        </div>
                      </div>
                      {p.imageUrl && <img src={p.imageUrl} alt="" className="w-8 h-8 object-contain rounded shrink-0" />}
                    </label>
                  ))}
                </div>
              )}
            </ScrollArea>
            {selectedIds.size > 0 && (
              <Button className="mt-2 w-full" onClick={handleAddSelected} disabled={addMultipleMutation.isPending}>
                {addMultipleMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Ajouter {selectedIds.size} pièce{selectedIds.size > 1 ? "s" : ""}
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
    reference: "", name: "", description: "", category: "PUMPS",
    priceHT: "", vatRate: "20", stockQuantity: 0, lowStockThreshold: 3, imageUrl: "", weight: "",
  });

  useEffect(() => {
    if (open) {
      if (part) {
        setForm({
          reference: part.reference || "", name: part.name || "", description: part.description || "",
          category: part.category || "PUMPS", priceHT: part.priceHT || "", vatRate: part.vatRate || "20",
          stockQuantity: part.stockQuantity || 0, lowStockThreshold: part.lowStockThreshold || 3,
          imageUrl: part.imageUrl || "", weight: part.weight || "",
        });
      } else {
        setForm({
          reference: "", name: "", description: "", category: "PUMPS",
          priceHT: "", vatRate: "20", stockQuantity: 0, lowStockThreshold: 3, imageUrl: "", weight: "",
        });
      }
    }
  }, [open, part]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{part ? "Modifier la pièce" : "Ajouter une pièce"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Référence *</Label>
            <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Ex: PMP-001" />
          </div>
          <div className="space-y-2">
            <Label>Nom *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Pompe de circulation 2HP" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description détaillée..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Catégorie *</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORIES).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Prix HT (€) *</Label>
            <Input type="number" step="0.01" value={form.priceHT} onChange={(e) => setForm({ ...form, priceHT: e.target.value })} placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <Label>TVA (%)</Label>
            <Input type="number" step="0.01" value={form.vatRate} onChange={(e) => setForm({ ...form, vatRate: e.target.value })} placeholder="20" />
          </div>
          <div className="space-y-2">
            <Label>Stock</Label>
            <Input type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="space-y-2">
            <Label>Seuil alerte stock</Label>
            <Input type="number" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: parseInt(e.target.value) || 3 })} />
          </div>
          <div className="space-y-2">
            <Label>Poids (kg)</Label>
            <Input type="number" step="0.001" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="0.000" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>URL de l'image</Label>
            <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
            {form.imageUrl && (
              <img src={form.imageUrl} alt="Aperçu" className="w-16 h-16 rounded object-cover mt-1" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
            )}
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            onClick={() => {
              if (!form.reference || !form.name || !form.priceHT) return;
              onSubmit({
                reference: form.reference, name: form.name, description: form.description || undefined,
                category: form.category, priceHT: form.priceHT, vatRate: form.vatRate || "20",
                stockQuantity: form.stockQuantity, lowStockThreshold: form.lowStockThreshold,
                imageUrl: form.imageUrl || undefined, weight: form.weight || undefined,
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
    brand: "MARKET_SPAS", productLine: "", modelName: "", component: "Pompes",
  });

  const compatList = (partDetail.data as any)?.compatibility || [];

  return (
    <Dialog open={true} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compatibilités — {part.name} ({part.reference})</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">Compatibilités existantes ({compatList.length})</h3>
          {compatList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Aucune compatibilité définie</p>
          ) : (
            <div className="space-y-1">
              {compatList.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge>{BRANDS[c.brand] || c.brand}</Badge>
                    {c.productLine && <Badge variant="outline">{c.productLine}</Badge>}
                    {c.modelName && <Badge variant="secondary">{c.modelName}</Badge>}
                    <span className="text-sm text-muted-foreground">→</span>
                    <span className="text-sm font-medium">{c.component}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { if (confirm("Supprimer ?")) onRemove(c.id); }}>
                    <X className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">Ajouter une compatibilité</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Marque *</Label>
              <Select value={newCompat.brand} onValueChange={(v) => setNewCompat({ ...newCompat, brand: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(BRANDS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Gamme (optionnel)</Label>
              <Input value={newCompat.productLine} onChange={(e) => setNewCompat({ ...newCompat, productLine: e.target.value })} placeholder="Ex: Deluxe, Premium..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Modèle (optionnel)</Label>
              <Input value={newCompat.modelName} onChange={(e) => setNewCompat({ ...newCompat, modelName: e.target.value })} placeholder="Ex: Everest, Kilimanjaro..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Composant *</Label>
              <Select value={newCompat.component} onValueChange={(v) => setNewCompat({ ...newCompat, component: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMPONENTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={() => {
              onAdd({
                sparePartId: part.id, brand: newCompat.brand,
                productLine: newCompat.productLine || undefined,
                modelName: newCompat.modelName || undefined,
                component: newCompat.component,
              });
              setNewCompat({ ...newCompat, productLine: "", modelName: "" });
            }}
            disabled={isAdding}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isAdding ? "Ajout..." : "Ajouter"}
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
