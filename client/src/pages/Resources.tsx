import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Search,
  FileText,
  Video,
  Image as ImageIcon,
  Download,
  Eye,
  Grid3X3,
  List,
  ChevronRight,
  FolderOpen,
  Folder,
  ArrowLeft,
  CheckSquare,
  Square,
  SortAsc,
  SortDesc,
  File,
  FileImage,
  FileVideo,
  X,
  ChevronDown,
} from "lucide-react";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = "title" | "fileSize" | "createdAt";
type SortDir = "asc" | "desc";
type ViewMode = "grid" | "list";

type MediaFolder = {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  color?: string | null;
  parentId?: number | null;
  sortOrder?: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getFileIcon = (fileType: string) => {
  if (fileType.includes("image")) return FileImage;
  if (fileType.includes("video")) return FileVideo;
  if (fileType.includes("pdf") || fileType.includes("text")) return FileText;
  return File;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

// ─── Sidebar folder tree ──────────────────────────────────────────────────────

function FolderItem({
  folder,
  allFolders,
  activeId,
  onSelect,
  depth = 0,
}: {
  folder: MediaFolder;
  allFolders: MediaFolder[];
  activeId: number | null | "all" | "unclassified";
  onSelect: (id: number | null | "all" | "unclassified") => void;
  depth?: number;
}) {
  const children = allFolders.filter((f) => f.parentId === folder.id);
  const [expanded, setExpanded] = useState(true);
  const isActive = activeId === folder.id;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors select-none",
          isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent text-foreground"
        )}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => onSelect(folder.id)}
      >
        {children.length > 0 ? (
          <button
            className="shrink-0 p-0.5 rounded hover:bg-black/10"
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          >
            <ChevronDown className={cn("w-3 h-3 transition-transform", !expanded && "-rotate-90")} />
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        {isActive ? (
          <FolderOpen className="w-4 h-4 shrink-0" style={{ color: folder.color ?? "#6b7280" }} />
        ) : (
          <Folder className="w-4 h-4 shrink-0" style={{ color: folder.color ?? "#6b7280" }} />
        )}
        <span className="flex-1 truncate">{folder.name}</span>
      </div>
      {expanded && children.length > 0 && (
        <div>
          {children
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))
            .map((child) => (
              <FolderItem
                key={child.id}
                folder={child}
                allFolders={allFolders}
                activeId={activeId}
                onSelect={onSelect}
                depth={depth + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFolderId, setActiveFolderId] = useState<number | null | "all" | "unclassified">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [previewResource, setPreviewResource] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  // ─── Data ───────────────────────────────────────────────────────────────────

  const { data: folders = [] } = trpc.mediaFolders.list.useQuery();

  // Fetch resources based on active folder
  const folderQueryId = activeFolderId === "all"
    ? undefined
    : activeFolderId === "unclassified"
    ? null
    : activeFolderId;

  const { data: folderResources, isLoading: folderLoading } = trpc.resources.listByFolder.useQuery(
    { folderId: folderQueryId },
    { enabled: activeFolderId !== "all" }
  );

  const { data: allResources, isLoading: allLoading } = trpc.resources.list.useQuery(
    { limit: 500 },
    { enabled: activeFolderId === "all" }
  );

  const isLoading = activeFolderId === "all" ? allLoading : folderLoading;
  const rawResources = activeFolderId === "all" ? (allResources ?? []) : (folderResources ?? []);

  const downloadMutation = trpc.resources.download.useMutation();

  // ─── Root folders ────────────────────────────────────────────────────────────

  const rootFolders = useMemo(
    () =>
      (folders as MediaFolder[])
        .filter((f) => !f.parentId)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)),
    [folders]
  );

  // ─── Counts ──────────────────────────────────────────────────────────────────

  const { data: allForCounts } = trpc.resources.list.useQuery({ limit: 1000 });
  const counts = useMemo(() => {
    const all = allForCounts ?? [];
    const map: Record<string | number, number> = {
      all: all.length,
      unclassified: all.filter((r: any) => !r.folderId).length,
    };
    (folders as MediaFolder[]).forEach((f) => {
      map[f.id] = all.filter((r: any) => r.folderId === f.id).length;
    });
    return map;
  }, [allForCounts, folders]);

  // ─── Filtering & sorting ─────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = rawResources as any[];
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
      else if (sortField === "createdAt")
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [rawResources, searchQuery, sortField, sortDir]);

  // ─── Selection helpers ────────────────────────────────────────────────────────

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r) => r.id)));
    }
  };

  const clearSelection = () => setSelected(new Set());

  const handleFolderSelect = (id: number | null | "all" | "unclassified") => {
    setActiveFolderId(id);
    clearSelection();
  };

  // ─── Download helpers ─────────────────────────────────────────────────────────

  const handleDownload = async (id: number, fileUrl: string, title: string) => {
    try {
      await downloadMutation.mutateAsync({ id });
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = title;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error("Erreur lors du téléchargement");
    }
  };

  const handleDownloadSelected = async () => {
    const toDownload = filtered.filter((r) => selected.has(r.id));
    if (!toDownload.length) return;
    setDownloadingAll(true);
    toast.info(`Téléchargement de ${toDownload.length} fichier(s)…`);
    for (const r of toDownload) {
      await handleDownload(r.id, r.fileUrl, r.title);
      await new Promise((res) => setTimeout(res, 400));
    }
    setDownloadingAll(false);
    toast.success(`${toDownload.length} fichier(s) téléchargé(s)`);
  };

  const handleView = (resource: any) => {
    setPreviewResource(resource);
    setPreviewOpen(true);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = sortDir === "asc" ? SortAsc : SortDesc;

  // ─── Active folder label ──────────────────────────────────────────────────────

  const activeFolderLabel = useMemo(() => {
    if (activeFolderId === "all") return "Tous les fichiers";
    if (activeFolderId === "unclassified") return "Non classés";
    const f = (folders as MediaFolder[]).find((f) => f.id === activeFolderId);
    return f?.name ?? "Dossier";
  }, [activeFolderId, folders]);

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Retour</span>
            </Button>
          </Link>
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
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar – Finder-style */}
        <aside className="w-52 shrink-0 border-r bg-muted/30 hidden md:flex flex-col py-3 gap-0.5 overflow-y-auto">
          <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Médiathèque
          </p>

          {/* All files */}
          <button
            onClick={() => handleFolderSelect("all")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 mx-1 rounded-md text-sm transition-colors text-left",
              activeFolderId === "all"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent text-foreground"
            )}
          >
            <FolderOpen className={cn("w-4 h-4 shrink-0", activeFolderId === "all" ? "text-primary-foreground" : "text-primary")} />
            <span className="flex-1 truncate">Tous les fichiers</span>
            {(counts["all"] ?? 0) > 0 && (
              <span className={cn("text-xs tabular-nums", activeFolderId === "all" ? "text-primary-foreground/70" : "text-muted-foreground")}>
                {counts["all"]}
              </span>
            )}
          </button>

          {/* Dynamic folders */}
          {rootFolders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              allFolders={folders as MediaFolder[]}
              activeId={activeFolderId}
              onSelect={handleFolderSelect}
            />
          ))}

          {/* Unclassified */}
          {(counts["unclassified"] ?? 0) > 0 && (
            <button
              onClick={() => handleFolderSelect("unclassified")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 mx-1 rounded-md text-sm transition-colors text-left",
                activeFolderId === "unclassified"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent text-foreground"
              )}
            >
              <Folder className={cn("w-4 h-4 shrink-0", activeFolderId === "unclassified" ? "text-primary-foreground" : "text-muted-foreground")} />
              <span className="flex-1 truncate">Non classés</span>
              <span className={cn("text-xs tabular-nums", activeFolderId === "unclassified" ? "text-primary-foreground/70" : "text-muted-foreground")}>
                {counts["unclassified"]}
              </span>
            </button>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="border-b bg-card/50 px-4 py-2 flex items-center gap-2 flex-wrap">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground flex-1 min-w-0">
              <span className="font-medium text-foreground truncate">{activeFolderLabel}</span>
              <ChevronRight className="w-3 h-3 shrink-0" />
              <span className="text-xs">{filtered.length} fichier{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Sort buttons */}
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

            {/* Select all */}
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
            <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center gap-3">
              <span className="text-sm font-medium text-primary">
                {selected.size} fichier{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}
              </span>
              <Button
                size="sm"
                className="h-7 gap-1"
                onClick={handleDownloadSelected}
                disabled={downloadingAll}
              >
                <Download className="w-3.5 h-3.5" />
                Télécharger la sélection
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

          {/* Mobile folder pills */}
          <div className="md:hidden flex gap-2 px-4 py-2 overflow-x-auto border-b">
            <button
              onClick={() => handleFolderSelect("all")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors",
                activeFolderId === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-foreground"
              )}
            >
              <FolderOpen className="w-3 h-3" />
              Tous
              {(counts["all"] ?? 0) > 0 && <span className="opacity-70">{counts["all"]}</span>}
            </button>
            {(folders as MediaFolder[]).map((folder) => (
              <button
                key={folder.id}
                onClick={() => handleFolderSelect(folder.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors",
                  activeFolderId === folder.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-foreground"
                )}
              >
                <Folder className="w-3 h-3" />
                {folder.name}
                {(counts[folder.id] ?? 0) > 0 && <span className="opacity-70">{counts[folder.id]}</span>}
              </button>
            ))}
          </div>

          {/* File area */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className={cn(
                viewMode === "grid"
                  ? "grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                  : "space-y-1"
              )}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className={cn(
                    "rounded-lg bg-muted animate-pulse",
                    viewMode === "grid" ? "h-32" : "h-12"
                  )} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
                <FolderOpen className="w-16 h-16 text-muted-foreground/30" />
                <p className="text-muted-foreground">
                  {searchQuery ? "Aucun résultat pour cette recherche" : "Ce dossier est vide"}
                </p>
                {searchQuery && (
                  <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
                    Effacer la recherche
                  </Button>
                )}
              </div>
            ) : viewMode === "grid" ? (
              // ── Grid view ──────────────────────────────────────────────────
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filtered.map((resource: any) => {
                  const Icon = getFileIcon(resource.fileType);
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
                      onDoubleClick={() => handleView(resource)}
                    >
                      {/* Checkbox */}
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

                      {/* Thumbnail */}
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
                            <Icon className="w-10 h-10 text-muted-foreground" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              {resource.fileType.split("/")[1]?.toUpperCase() || "FILE"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-2">
                        <p className="text-xs font-medium line-clamp-2 leading-tight">{resource.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatSize(resource.fileSize)}</p>
                      </div>

                      {/* Hover actions */}
                      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-6 w-6"
                          onClick={(e) => { e.stopPropagation(); handleView(resource); }}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-6 w-6"
                          onClick={(e) => { e.stopPropagation(); handleDownload(resource.id, resource.fileUrl, resource.title); }}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // ── List view ───────────────────────────────────────────────────
              <div className="rounded-lg border overflow-hidden">
                {/* Header row */}
                <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
                  <span className="w-5" />
                  <span>Nom</span>
                  <span className="w-24 text-right hidden sm:block">Taille</span>
                  <span className="w-28 text-right hidden md:block">Date</span>
                  <span className="w-16 text-right">Actions</span>
                </div>
                {filtered.map((resource: any, idx: number) => {
                  const Icon = getFileIcon(resource.fileType);
                  const isSelected = selected.has(resource.id);
                  return (
                    <div
                      key={resource.id}
                      className={cn(
                        "grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 px-3 py-2 items-center cursor-pointer transition-colors select-none",
                        isSelected ? "bg-primary/10" : idx % 2 === 0 ? "bg-background" : "bg-muted/20",
                        "hover:bg-primary/5"
                      )}
                      onClick={() => toggleSelect(resource.id)}
                      onDoubleClick={() => handleView(resource)}
                    >
                      {/* Checkbox */}
                      <div onClick={(e) => { e.stopPropagation(); toggleSelect(resource.id); }}>
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>

                      {/* Name + icon */}
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{resource.title}</p>
                          <p className="text-xs text-muted-foreground truncate hidden sm:block">
                            {formatSize(resource.fileSize)}
                          </p>
                        </div>
                      </div>

                      {/* Size */}
                      <span className="text-xs text-muted-foreground w-24 text-right hidden sm:block tabular-nums">
                        {formatSize(resource.fileSize)}
                      </span>

                      {/* Date */}
                      <span className="text-xs text-muted-foreground w-28 text-right hidden md:block">
                        {formatDate(resource.createdAt)}
                      </span>

                      {/* Actions */}
                      <div className="flex gap-1 w-16 justify-end" onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleView(resource)}>
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleDownload(resource.id, resource.fileUrl, resource.title)}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status bar */}
          <div className="border-t bg-muted/30 px-4 py-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>{filtered.length} élément{filtered.length !== 1 ? "s" : ""}</span>
            {selected.size > 0 && (
              <span className="text-primary font-medium">
                {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </main>
      </div>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{previewResource?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {previewResource?.fileType.includes("image") ? (
              <img
                src={previewResource.fileUrl}
                alt={previewResource.title}
                className="w-full h-auto rounded-lg"
              />
            ) : previewResource?.fileType.includes("pdf") ? (
              <iframe
                src={previewResource.fileUrl}
                className="w-full h-[65vh] rounded-lg"
                title={previewResource.title}
              />
            ) : previewResource?.fileType.includes("video") ? (
              <video
                src={previewResource.fileUrl}
                controls
                className="w-full rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <File className="w-16 h-16 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">Aperçu non disponible pour ce type de fichier</p>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2 border-t">
            <Button
              className="flex-1"
              onClick={() => previewResource && handleDownload(previewResource.id, previewResource.fileUrl, previewResource.title)}
              disabled={downloadMutation.isPending}
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
