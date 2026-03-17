import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
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
  Archive,
  Loader2,
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { OnboardingTour } from "@/components/OnboardingTour";
import { useOnboarding } from "@/hooks/useOnboarding";
import { resourcesTour } from "@/config/onboarding-tours";
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

/** Returns a lightweight thumbnail URL for grid/list views. Falls back to original. */
const getThumbnailUrl = (resource: { id: number; fileUrl: string; fileType: string; thumbnailUrl?: string | null }) => {
  if (!resource.fileType.includes("image")) return null;
  if (resource.thumbnailUrl) return resource.thumbnailUrl;
  return `/api/resources/thumbnail/${resource.id}`;
};

// ─── Sidebar folder tree ──────────────────────────────────────────────────────

function FolderItem({
  folder,
  allFolders,
  activeId,
  onSelect,
  counts,
  depth = 0,
}: {
  folder: MediaFolder;
  allFolders: MediaFolder[];
  activeId: number | null | "all" | "unclassified";
  onSelect: (id: number | null | "all" | "unclassified") => void;
  counts: Record<string | number, number>;
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
        {(counts[folder.id] ?? 0) > 0 && (
          <span className={cn("text-xs tabular-nums", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>
            {counts[folder.id]}
          </span>
        )}
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
                counts={counts}
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
  const onboarding = useOnboarding("resources");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFolderId, setActiveFolderId] = useState<number | null | "all" | "unclassified">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [previewResource, setPreviewResource] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number } | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

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
      try {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        const urlExt = fileUrl.split(".").pop()?.split("?")[0] ?? "";
        const hasExt = title.includes(".");
        link.download = hasExt ? title : `${title}.${urlExt}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch {
        window.open(fileUrl, "_blank");
      }
    } catch {
      toast.error("Erreur lors du téléchargement");
    }
  };

  const handleDownloadSelected = async () => {
    const toDownload = filtered.filter((r) => selected.has(r.id));
    if (!toDownload.length) return;

    if (toDownload.length === 1) {
      await handleDownload(toDownload[0].id, toDownload[0].fileUrl, toDownload[0].title);
      clearSelection();
      return;
    }

    setDownloadingAll(true);
    setZipProgress({ current: 0, total: toDownload.length });
    toast.info(`Préparation de l'archive ZIP (${toDownload.length} fichiers)…`);

    try {
      const ids = toDownload.map((r) => r.id).join(",");
      const resp = await fetch(`/api/resources/download-zip?ids=${ids}`);
      if (!resp.ok) throw new Error("ZIP download failed");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mediatheque.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Téléchargement terminé !");
    } catch {
      toast.error("Erreur lors du téléchargement ZIP");
    } finally {
      setDownloadingAll(false);
      setZipProgress(null);
      clearSelection();
    }
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

  // ─── Sub-folders of current folder ───────────────────────────────────────────

  const subFolders = useMemo(() =>
    (folders as MediaFolder[]).filter((f) =>
      activeFolderId === "all" || activeFolderId === "unclassified"
        ? false
        : f.parentId === activeFolderId
    ),
    [folders, activeFolderId]
  );

  // ─── Active folder label ──────────────────────────────────────────────────────

  const activeFolderLabel = useMemo(() => {
    if (activeFolderId === "all") return "Tous les fichiers";
    if (activeFolderId === "unclassified") return "Non classés";
    const f = (folders as MediaFolder[]).find((f) => f.id === activeFolderId);
    return f?.name ?? "Dossier";
  }, [activeFolderId, folders]);

  // ─── Breadcrumb ──────────────────────────────────────────────────────────────

  const breadcrumb = useMemo(() => {
    if (activeFolderId === "all" || activeFolderId === "unclassified" || activeFolderId === null) return [];
    const path: MediaFolder[] = [];
    let current = (folders as MediaFolder[]).find((f) => f.id === activeFolderId);
    while (current) {
      path.unshift(current);
      current = (folders as MediaFolder[]).find((f) => f.id === current!.parentId);
    }
    return path;
  }, [activeFolderId, folders]);

  // ─── Sidebar content for mobile sheet ─────────────────────────────────────────

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Médiathèque</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {/* All files */}
        <button
          onClick={() => { handleFolderSelect("all"); setMobileSheetOpen(false); }}
          className={cn(
            "flex items-center gap-2 px-3 py-2 w-full rounded-lg text-sm transition-colors text-left",
            activeFolderId === "all" ? "bg-primary text-primary-foreground" : "hover:bg-accent text-foreground"
          )}
        >
          <FolderOpen className="w-4 h-4 shrink-0" />
          <span className="flex-1">Tous les fichiers</span>
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
            onSelect={(id) => { handleFolderSelect(id); setMobileSheetOpen(false); }}
            counts={counts}
          />
        ))}

        {/* Unclassified */}
        {(counts["unclassified"] ?? 0) > 0 && (
          <button
            onClick={() => { handleFolderSelect("unclassified"); setMobileSheetOpen(false); }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 w-full rounded-lg text-sm transition-colors text-left",
              activeFolderId === "unclassified" ? "bg-primary text-primary-foreground" : "hover:bg-accent text-foreground"
            )}
          >
            <Folder className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span className="flex-1">Non classés</span>
            <span className={cn("text-xs tabular-nums", activeFolderId === "unclassified" ? "text-primary-foreground/70" : "text-muted-foreground")}>
              {counts["unclassified"]}
            </span>
          </button>
        )}
      </div>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Mobile Header (visible only on mobile) ── */}
      <div className="md:hidden bg-card border-b sticky top-0 z-40 px-3 py-2.5">
        <div className="flex items-center gap-2">
          {/* Back + Folder drawer trigger */}
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>

          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 shrink-0">
                <Menu className="w-4 h-4" />
                <Folder className="w-3.5 h-3.5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Dossiers</SheetTitle>
              </SheetHeader>
              {renderSidebarContent()}
            </SheetContent>
          </Sheet>

          {/* Current folder name */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{activeFolderLabel}</p>
            <p className="text-xs text-muted-foreground">{filtered.length} fichier(s)</p>
          </div>

          {/* Search toggle */}
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setMobileSearchOpen(!mobileSearchOpen)}>
            <Search className="w-4 h-4" />
          </Button>

          {/* View mode toggle */}
          <div className="flex border rounded-lg overflow-hidden shrink-0">
            <button className={cn("p-1.5", viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground")} onClick={() => setViewMode("grid")}><Grid3X3 className="w-4 h-4" /></button>
            <button className={cn("p-1.5", viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground")} onClick={() => setViewMode("list")}><List className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Mobile search bar (collapsible) */}
        {mobileSearchOpen && (
          <div className="mt-2 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Rechercher un fichier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
              autoFocus
            />
            {searchQuery && (
              <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => { setSearchQuery(""); setMobileSearchOpen(false); }}>
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Desktop Header (hidden on mobile) ── */}
      <header data-tour="resources-header" className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40 px-4 py-3 hidden md:block">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
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
        {/* Sidebar – Finder-style (desktop only) */}
        <aside data-tour="resources-sidebar" className="w-52 shrink-0 border-r bg-muted/30 hidden md:flex flex-col py-3 gap-0.5 overflow-y-auto">
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
              counts={counts}
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
          {/* Desktop Toolbar (hidden on mobile) */}
          <div className="hidden md:flex border-b bg-card/50 px-4 py-2 items-center gap-2 flex-wrap">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground flex-1 min-w-0">
              <button className="hover:text-primary font-medium" onClick={() => setActiveFolderId("all")}>Médiathèque</button>
              {breadcrumb.map((f, i) => (
                <span key={f.id} className="flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  <button className={cn("hover:text-primary", i === breadcrumb.length - 1 ? "font-semibold text-foreground" : "")} onClick={() => setActiveFolderId(f.id)}>{f.name}</button>
                </span>
              ))}
              {activeFolderId === "unclassified" && <><ChevronRight className="w-3 h-3 text-muted-foreground" /><span className="font-semibold text-foreground">Non classés</span></>}
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
              Tout sélectionner
            </Button>
          </div>

          {/* Selection bar */}
          {selected.size > 0 && (
            <div className="bg-primary/10 border-b border-primary/20 px-3 md:px-4 py-2 flex flex-wrap items-center gap-2 md:gap-3">
              <span className="text-sm font-medium text-primary">
                {selected.size} fichier{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}
              </span>
              <Button
                size="sm"
                className="h-7 gap-1"
                onClick={handleDownloadSelected}
                disabled={downloadingAll}
              >
                {downloadingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : selected.size > 1 ? (
                  <Archive className="w-3.5 h-3.5" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {downloadingAll && zipProgress
                  ? `ZIP (${zipProgress.current}/${zipProgress.total})`
                  : selected.size > 1
                  ? `ZIP (${selected.size})`
                  : "Télécharger"
                }
              </Button>
              {downloadingAll && zipProgress && (
                <div className="flex items-center gap-2 ml-2">
                  <div className="w-32 h-1.5 bg-primary/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${(zipProgress.current / zipProgress.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {Math.round((zipProgress.current / zipProgress.total) * 100)}%
                  </span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 ml-auto"
                onClick={clearSelection}
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Désélectionner</span>
              </Button>
            </div>
          )}

          {/* File area */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4">
            {/* Sub-folders */}
            {subFolders.length > 0 && (
              <div className="mb-4 md:mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sous-dossiers</p>

                {/* Mobile: horizontal scrollable chips (same as admin) */}
                <div className="md:hidden flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 scrollbar-hide">
                  {subFolders.map((sf) => (
                    <button
                      key={sf.id}
                      className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border hover:border-primary hover:shadow-sm cursor-pointer transition-all shrink-0 min-w-0"
                      onClick={() => handleFolderSelect(sf.id)}
                    >
                      <FolderOpen className="w-4 h-4 shrink-0" style={{ color: sf.color || undefined }} />
                      <span className="text-xs font-medium whitespace-nowrap">{sf.name}</span>
                      {(counts[sf.id] ?? 0) > 0 && (
                        <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 shrink-0">{counts[sf.id]}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Desktop: grid cards */}
                <div className="hidden md:grid gap-3 grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {subFolders.map((sf) => (
                    <button
                      key={sf.id}
                      onClick={() => handleFolderSelect(sf.id)}
                      className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border-2 border-border hover:border-primary hover:shadow-sm transition-all text-left"
                    >
                      <FolderOpen className="w-10 h-10" style={{ color: sf.color || undefined }} />
                      <span className="text-xs font-medium text-foreground text-center truncate w-full">{sf.name}</span>
                      {(counts[sf.id] ?? 0) > 0 && (
                        <span className="text-xs text-muted-foreground">{counts[sf.id]} fichier{counts[sf.id] !== 1 ? "s" : ""}</span>
                      )}
                    </button>
                  ))}
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
                  <div key={i} className={cn(
                    "rounded-lg bg-muted animate-pulse",
                    viewMode === "grid" ? "h-32" : "h-12"
                  )} />
                ))}
              </div>
            ) : filtered.length === 0 && subFolders.length === 0 ? (
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
            ) : filtered.length === 0 ? null
            : viewMode === "grid" ? (
              // ── Grid view ──────────────────────────────────────────────────
              <div className="grid gap-2 md:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filtered.map((resource: any) => {
                  const Icon = getFileIcon(resource.fileType);
                  const isSelected = selected.has(resource.id);
                  const isImage = resource.fileType.includes("image");
                  return (
                    <div
                      key={resource.id}
                      className={cn(
                        "group relative rounded-xl border-2 transition-all cursor-pointer select-none overflow-hidden",
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
                            src={getThumbnailUrl(resource) || resource.fileUrl}
                            alt={resource.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
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
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-[10px] text-muted-foreground">{formatSize(resource.fileSize)}</p>
                          {isAdmin && resource.downloadCount > 0 && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Download className="w-2.5 h-2.5" />
                              {resource.downloadCount}
                            </span>
                          )}
                        </div>
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
              <>
                {/* Desktop list */}
                <div className="hidden md:block rounded-lg border overflow-hidden">
                  {/* Header row */}
                  <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
                    <span className="w-5" />
                    <span>Nom</span>
                    <span className="w-24 text-right">Taille</span>
                    <span className="w-28 text-right">Date</span>
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
                        <div onClick={(e) => { e.stopPropagation(); toggleSelect(resource.id); }}>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                          <p className="text-sm font-medium truncate">{resource.title}</p>
                        </div>
                        <span className="text-xs text-muted-foreground w-24 text-right tabular-nums">
                          {formatSize(resource.fileSize)}
                        </span>
                        <span className="text-xs text-muted-foreground w-28 text-right">
                          {formatDate(resource.createdAt)}
                        </span>
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

                {/* Mobile list (card style like admin) */}
                <div className="md:hidden space-y-2">
                  {filtered.map((resource: any) => {
                    const Icon = getFileIcon(resource.fileType);
                    const isSelected = selected.has(resource.id);
                    const isImage = resource.fileType.includes("image");
                    return (
                      <div
                        key={resource.id}
                        className={cn(
                          "flex items-center gap-3 p-2.5 bg-card rounded-xl border-2 transition-all",
                          isSelected ? "border-primary bg-primary/5" : "border-border"
                        )}
                        onClick={() => toggleSelect(resource.id)}
                      >
                        {/* Thumbnail / Icon */}
                        <div className="w-12 h-12 rounded-lg bg-muted/50 shrink-0 overflow-hidden flex items-center justify-center">
                          {isImage ? (
                            <img src={getThumbnailUrl(resource) || resource.fileUrl} alt={resource.title} className="w-full h-full object-cover rounded-lg" loading="lazy" decoding="async" />
                          ) : (
                            <Icon className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{resource.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{formatSize(resource.fileSize)}</span>
                            <span className="text-xs text-muted-foreground/50">·</span>
                            <span className="text-xs text-muted-foreground">{formatDate(resource.createdAt)}</span>
                          </div>
                        </div>

                        {/* Selection indicator */}
                        <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center shrink-0", isSelected ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                          {isSelected && <CheckSquare className="w-3 h-3 text-primary-foreground" />}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleView(resource)}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownload(resource.id, resource.fileUrl, resource.title)}>
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Status bar */}
          <div className="border-t bg-muted/30 px-3 md:px-4 py-1.5 flex items-center justify-between text-xs text-muted-foreground">
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
      <OnboardingTour
        steps={resourcesTour}
        isActive={onboarding.isActive}
        currentStep={onboarding.currentStep}
        onNext={onboarding.nextStep}
        onPrev={onboarding.prevStep}
        onSkip={onboarding.skipTour}
        onComplete={onboarding.markCompleted}
      />
    </div>
  );
}
