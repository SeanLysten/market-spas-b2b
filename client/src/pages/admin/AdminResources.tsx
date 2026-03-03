import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  Plus,
  Upload,
  FileText,
  Video,
  Image as ImageIcon,
  Trash2,
  Eye,
  Search,
  Grid3X3,
  List,
  ChevronRight,
  FolderOpen,
  File,
  FileImage,
  FileVideo,
  Package,
  BookOpen,
  Wrench,
  Shield,
  Award,
  CheckSquare,
  Square,
  SortAsc,
  SortDesc,
  X,
  Download,
  Pencil,
} from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = "title" | "fileSize" | "createdAt" | "downloadCount";
type SortDir = "asc" | "desc";
type ViewMode = "grid" | "list";

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "ALL", label: "Tous les fichiers", icon: FolderOpen, color: "text-primary" },
  { value: "CATALOG", label: "Catalogues", icon: BookOpen, color: "text-emerald-600" },
  { value: "MARKETING_IMAGE", label: "Marketing & PLV", icon: ImageIcon, color: "text-pink-600" },
  { value: "VIDEO_TUTORIAL", label: "Vidéos tutoriels", icon: Video, color: "text-purple-600" },
  { value: "TECHNICAL_DOC", label: "Documentation", icon: FileText, color: "text-blue-600" },
  { value: "SALES_GUIDE", label: "Guides de vente", icon: BookOpen, color: "text-amber-600" },
  { value: "INSTALLATION", label: "Installation", icon: Wrench, color: "text-orange-600" },
  { value: "TROUBLESHOOTING", label: "Dépannage", icon: Wrench, color: "text-red-600" },
  { value: "WARRANTY", label: "Garanties", icon: Shield, color: "text-teal-600" },
  { value: "CERTIFICATE", label: "Certificats", icon: Award, color: "text-yellow-600" },
  { value: "PLV", label: "PLV", icon: Package, color: "text-indigo-600" },
];

const getCatConfig = (value: string) =>
  CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[0];

const getFileIcon = (fileType: string, category: string) => {
  if (fileType.includes("image")) return FileImage;
  if (fileType.includes("video")) return FileVideo;
  if (category === "VIDEO_TUTORIAL") return FileVideo;
  return File;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminResources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [previewResource, setPreviewResource] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "CATALOG" as string,
    language: "fr",
    isPublic: false,
    requiredPartnerLevel: "BRONZE" as string,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: resources, isLoading, refetch } = trpc.resources.list.useQuery({ limit: 500 });
  const createMutation = trpc.resources.create.useMutation();
  const deleteMutation = trpc.resources.delete.useMutation();

  // ─── Filtering & sorting ────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = resources ?? [];
    if (activeCategory !== "ALL") list = list.filter((r) => r.category === activeCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === "title") cmp = a.title.localeCompare(b.title);
      else if (sortField === "fileSize") cmp = a.fileSize - b.fileSize;
      else if (sortField === "downloadCount") cmp = a.downloadCount - b.downloadCount;
      else if (sortField === "createdAt")
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [resources, activeCategory, searchQuery, sortField, sortDir]);

  const counts = useMemo(() => {
    const all = resources ?? [];
    const map: Record<string, number> = { ALL: all.length };
    all.forEach((r) => { map[r.category] = (map[r.category] ?? 0) + 1; });
    return map;
  }, [resources]);

  // ─── Selection ──────────────────────────────────────────────────────────────

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  };

  const clearSelection = () => setSelected(new Set());

  // ─── File handling ──────────────────────────────────────────────────────────

  const processFile = (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 50 MB)");
      return;
    }
    setSelectedFile(file);
    if (!formData.title) setFormData((f) => ({ ...f, title: file.name.replace(/\.[^.]+$/, "") }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) { toast.error("Veuillez sélectionner un fichier"); return; }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          await createMutation.mutateAsync({
            ...formData,
            fileData: reader.result as string,
            fileName: selectedFile.name,
            fileType: selectedFile.type || "application/octet-stream",
            fileSize: selectedFile.size,
          });
          toast.success("Ressource ajoutée");
          setUploadOpen(false);
          setSelectedFile(null);
          setFormData({ title: "", description: "", category: "CATALOG", language: "fr", isPublic: false, requiredPartnerLevel: "BRONZE" });
          refetch();
        } catch (err: any) {
          toast.error(err.message || "Erreur lors de l'upload");
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette ressource ?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Ressource supprimée");
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Supprimer ${selected.size} ressource(s) ?`)) return;
    for (const id of Array.from(selected)) {
      await deleteMutation.mutateAsync({ id }).catch(() => {});
    }
    toast.success(`${selected.size} ressource(s) supprimée(s)`);
    clearSelection();
    refetch();
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = sortDir === "asc" ? SortAsc : SortDesc;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] -m-6">
        {/* Top bar */}
        <div className="border-b bg-card/80 px-4 py-3 flex items-center gap-3 shrink-0">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              className="gap-1.5 ml-2"
              size="sm"
              onClick={() => setUploadOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-52 shrink-0 border-r bg-muted/30 hidden md:flex flex-col py-3 gap-0.5 overflow-y-auto">
            <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Médiathèque
            </p>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.value;
              const count = counts[cat.value] ?? 0;
              return (
                <button
                  key={cat.value}
                  onClick={() => { setActiveCategory(cat.value); clearSelection(); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 mx-1 rounded-md text-sm transition-colors text-left",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent text-foreground"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary-foreground" : cat.color)} />
                  <span className="flex-1 truncate">{cat.label}</span>
                  {count > 0 && (
                    <span className={cn("text-xs tabular-nums", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </aside>

          {/* Main */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="border-b bg-card/50 px-4 py-2 flex items-center gap-2 flex-wrap shrink-0">
              <div className="flex items-center gap-1 text-sm text-muted-foreground flex-1 min-w-0">
                <span className="font-medium text-foreground truncate">
                  {getCatConfig(activeCategory).label}
                </span>
                <ChevronRight className="w-3 h-3 shrink-0" />
                <span className="text-xs">{filtered.length} fichier{filtered.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-1">
                {(["title", "fileSize", "createdAt"] as SortField[]).map((f) => (
                  <Button
                    key={f}
                    variant={sortField === f ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={() => toggleSort(f)}
                  >
                    {f === "title" ? "Nom" : f === "fileSize" ? "Taille" : "Date"}
                    {sortField === f && <SortIcon className="w-3 h-3" />}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1"
                onClick={selectAll}
              >
                {selected.size === filtered.length && filtered.length > 0 ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Tout sélectionner</span>
              </Button>
            </div>

            {/* Selection bar */}
            {selected.size > 0 && (
              <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center gap-3 shrink-0">
                <span className="text-sm font-medium text-destructive">
                  {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 gap-1"
                  onClick={handleDeleteSelected}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer la sélection
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 ml-auto"
                  onClick={clearSelection}
                >
                  <X className="w-3.5 h-3.5" />
                  Désélectionner
                </Button>
              </div>
            )}

            {/* Mobile category pills */}
            <div className="md:hidden flex gap-2 px-4 py-2 overflow-x-auto border-b shrink-0">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    onClick={() => { setActiveCategory(cat.value); clearSelection(); }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors",
                      activeCategory === cat.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-foreground"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {cat.label}
                    {(counts[cat.value] ?? 0) > 0 && (
                      <span className="opacity-70">{counts[cat.value]}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* File area */}
            <div
              className="flex-1 overflow-y-auto p-4"
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) { processFile(file); setUploadOpen(true); }
              }}
            >
              {isDragging && (
                <div className="absolute inset-0 z-50 bg-primary/10 border-4 border-dashed border-primary rounded-lg flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-primary mx-auto mb-2" />
                    <p className="text-primary font-semibold">Déposez le fichier ici</p>
                  </div>
                </div>
              )}

              {isLoading ? (
                <div className={cn(
                  viewMode === "grid"
                    ? "grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                    : "space-y-1"
                )}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={cn("rounded-lg bg-muted animate-pulse", viewMode === "grid" ? "h-32" : "h-12")} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
                  <FolderOpen className="w-16 h-16 text-muted-foreground/30" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "Aucun résultat" : "Ce dossier est vide"}
                  </p>
                  <Button size="sm" onClick={() => setUploadOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter un fichier
                  </Button>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {filtered.map((resource) => {
                    const Icon = getFileIcon(resource.fileType, resource.category);
                    const catCfg = getCatConfig(resource.category);
                    const isSelected = selected.has(resource.id);
                    const isImage = resource.fileType.includes("image");
                    return (
                      <div
                        key={resource.id}
                        className={cn(
                          "group relative rounded-xl border-2 transition-all cursor-pointer select-none",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-transparent bg-card hover:border-border hover:shadow-sm"
                        )}
                        onClick={() => toggleSelect(resource.id)}
                        onDoubleClick={() => { setPreviewResource(resource); setPreviewOpen(true); }}
                      >
                        <div
                          className={cn(
                            "absolute top-2 left-2 z-10 transition-opacity",
                            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          )}
                          onClick={(e) => { e.stopPropagation(); toggleSelect(resource.id); }}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-primary drop-shadow" />
                          ) : (
                            <Square className="w-5 h-5 text-muted-foreground bg-background/80 rounded" />
                          )}
                        </div>

                        <div className="aspect-square rounded-t-xl overflow-hidden bg-muted/50 flex items-center justify-center">
                          {isImage ? (
                            <img
                              src={resource.fileUrl}
                              alt={resource.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 p-4">
                              <Icon className={cn("w-10 h-10", catCfg.color)} />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                {resource.fileType.split("/")[1]?.toUpperCase() || "FILE"}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-2">
                          <p className="text-xs font-medium line-clamp-2 leading-tight">{resource.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{formatSize(resource.fileSize)}</p>
                        </div>

                        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-6 w-6"
                            onClick={(e) => { e.stopPropagation(); setPreviewResource(resource); setPreviewOpen(true); }}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-6 w-6"
                            onClick={(e) => { e.stopPropagation(); handleDelete(resource.id); }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
                    <span className="w-5" />
                    <span>Nom</span>
                    <span className="w-24 text-right hidden sm:block">Taille</span>
                    <span className="w-28 text-right hidden md:block">Date</span>
                    <span className="w-20 text-right hidden sm:block">Télécharg.</span>
                    <span className="w-20 text-right">Actions</span>
                  </div>
                  {filtered.map((resource, idx) => {
                    const Icon = getFileIcon(resource.fileType, resource.category);
                    const catCfg = getCatConfig(resource.category);
                    const isSelected = selected.has(resource.id);
                    return (
                      <div
                        key={resource.id}
                        className={cn(
                          "grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 px-3 py-2 items-center cursor-pointer transition-colors select-none",
                          isSelected ? "bg-primary/10" : idx % 2 === 0 ? "bg-background" : "bg-muted/20",
                          "hover:bg-primary/5"
                        )}
                        onClick={() => toggleSelect(resource.id)}
                        onDoubleClick={() => { setPreviewResource(resource); setPreviewOpen(true); }}
                      >
                        <div onClick={(e) => { e.stopPropagation(); toggleSelect(resource.id); }}>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className={cn("w-4 h-4 shrink-0", catCfg.color)} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{resource.title}</p>
                            <p className="text-xs text-muted-foreground truncate hidden sm:block">{catCfg.label}</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground w-24 text-right hidden sm:block tabular-nums">
                          {formatSize(resource.fileSize)}
                        </span>
                        <span className="text-xs text-muted-foreground w-28 text-right hidden md:block">
                          {formatDate(resource.createdAt)}
                        </span>
                        <span className="text-xs text-muted-foreground w-20 text-right hidden sm:block tabular-nums">
                          {resource.downloadCount}
                        </span>
                        <div className="flex gap-1 w-20 justify-end" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => { setPreviewResource(resource); setPreviewOpen(true); }}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(resource.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Status bar */}
            <div className="border-t bg-muted/30 px-4 py-1.5 flex items-center justify-between text-xs text-muted-foreground shrink-0">
              <span>{filtered.length} élément{filtered.length !== 1 ? "s" : ""}</span>
              {selected.size > 0 && (
                <span className="text-destructive font-medium">
                  {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
                </span>
              )}
              <span className="text-xs">Glissez-déposez pour uploader</span>
            </div>
          </main>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={(v) => { setUploadOpen(v); if (!v) setSelectedFile(null); }}>
        <DialogContent className="max-w-2xl w-[95vw]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Ajouter une ressource</DialogTitle>
              <DialogDescription>Uploadez un fichier et renseignez les informations</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Drop zone */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  isDragging ? "border-primary bg-primary/5" : "hover:border-primary"
                )}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mov,.jpg,.jpeg,.png,.zip"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
                />
                {selectedFile ? (
                  <div className="space-y-1">
                    <Upload className="w-8 h-8 mx-auto text-green-500" />
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
                    {selectedFile.type.includes("image") && (
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="Preview"
                        className="max-h-32 mx-auto rounded-lg mt-2 object-contain"
                      />
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Glissez-déposez ou cliquez pour sélectionner</p>
                    <p className="text-xs text-muted-foreground">PDF, DOC, PPT, MP4, JPG, PNG, ZIP (max 50 MB)</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Titre *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Catalogue 2025"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description…"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Catégorie *</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter((c) => c.value !== "ALL").map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Langue</Label>
                  <Select value={formData.language} onValueChange={(v) => setFormData({ ...formData, language: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="nl">Néerlandais</SelectItem>
                      <SelectItem value="en">Anglais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Niveau partenaire minimum</Label>
                  <Select value={formData.requiredPartnerLevel} onValueChange={(v) => setFormData({ ...formData, requiredPartnerLevel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRONZE">Bronze</SelectItem>
                      <SelectItem value="SILVER">Silver</SelectItem>
                      <SelectItem value="GOLD">Gold</SelectItem>
                      <SelectItem value="PLATINUM">Platinum</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={uploading || !selectedFile}>
                {uploading ? (
                  <><Upload className="w-4 h-4 mr-2 animate-spin" />Upload en cours…</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" />Ajouter</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{previewResource?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {previewResource?.fileType.includes("image") ? (
              <img src={previewResource.fileUrl} alt={previewResource.title} className="w-full h-auto rounded-lg" />
            ) : previewResource?.fileType.includes("pdf") ? (
              <iframe src={previewResource.fileUrl} className="w-full h-[65vh] rounded-lg" title={previewResource.title} />
            ) : previewResource?.fileType.includes("video") ? (
              <video src={previewResource.fileUrl} controls className="w-full rounded-lg" />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <File className="w-16 h-16 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">Aperçu non disponible pour ce type de fichier</p>
                <Button variant="outline" onClick={() => window.open(previewResource?.fileUrl, "_blank")}>
                  Ouvrir dans un nouvel onglet
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(previewResource?.fileUrl, "_blank")}
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (previewResource) {
                  handleDelete(previewResource.id);
                  setPreviewOpen(false);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
