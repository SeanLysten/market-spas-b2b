import { AdminLayout } from "@/components/AdminLayout";
import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Folder,
  FolderOpen,
  FolderPlus,
  File,
  FileText,
  FileImage,
  FileVideo,
  Upload,
  Search,
  Grid3X3,
  List,
  MoreVertical,
  Trash2,
  Edit2,
  Download,
  ChevronRight,
  ChevronDown,
  X,
  Move,
  Eye,
  FolderInput,
  Check,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MediaFolder {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  parentId?: number | null;
  sortOrder?: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Resource {
  id: number;
  title: string;
  description?: string | null;
  category: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  folderId?: number | null;
  downloadCount?: number | null;
  viewCount?: number | null;
  isActive?: boolean | null;
  createdAt: string;
}

type ViewMode = "grid" | "list";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return <FileImage className="w-5 h-5 text-blue-500" />;
  if (fileType.startsWith("video/")) return <FileVideo className="w-5 h-5 text-purple-500" />;
  if (fileType === "application/pdf") return <FileText className="w-5 h-5 text-red-500" />;
  return <File className="w-5 h-5 text-gray-500" />;
}

function getFileThumbnail(resource: Resource): string | null {
  if (resource.fileType.startsWith("image/")) return resource.fileUrl;
  return null;
}

// ─── FolderTree Node ─────────────────────────────────────────────────────────

function FolderTreeNode({
  folder,
  allFolders,
  selectedFolderId,
  onSelect,
  onCreateSubfolder,
  onRename,
  onDelete,
  depth = 0,
  resourceCounts,
  dragOverFolderId,
  onDragOver,
  onDrop,
}: {
  folder: MediaFolder;
  allFolders: MediaFolder[];
  selectedFolderId: number | null | "all";
  onSelect: (id: number | null) => void;
  onCreateSubfolder: (parentId: number) => void;
  onRename: (folder: MediaFolder) => void;
  onDelete: (folder: MediaFolder) => void;
  depth?: number;
  resourceCounts: Record<number, number>;
  dragOverFolderId: number | null;
  onDragOver: (id: number | null) => void;
  onDrop: (folderId: number | null) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const children = allFolders.filter((f) => f.parentId === folder.id);
  const isSelected = selectedFolderId === folder.id;
  const isDragOver = dragOverFolderId === folder.id;
  const count = resourceCounts[folder.id] || 0;

  return (
    <div>
      <div
        className={`group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer transition-colors select-none ${
          isSelected
            ? "bg-emerald-600 text-white"
            : isDragOver
            ? "bg-emerald-100 border border-emerald-400"
            : "hover:bg-gray-100"
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => onSelect(folder.id)}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); onDragOver(folder.id); }}
        onDragLeave={() => onDragOver(null)}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop(folder.id); }}
      >
        {children.length > 0 ? (
          <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="p-0.5 rounded hover:bg-black/10">
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        ) : (
          <span className="w-4" />
        )}
        {isSelected ? (
          <FolderOpen className="w-4 h-4 flex-shrink-0" />
        ) : (
          <Folder className="w-4 h-4 flex-shrink-0" style={{ color: folder.color || "#6b7280" }} />
        )}
        <span className="flex-1 text-sm truncate">{folder.name}</span>
        {count > 0 && (
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}>
            {count}
          </span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 ${isSelected ? "text-white" : ""}`} onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onCreateSubfolder(folder.id)}>
              <FolderPlus className="w-4 h-4 mr-2" />Nouveau sous-dossier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRename(folder)}>
              <Edit2 className="w-4 h-4 mr-2" />Renommer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={() => onDelete(folder)}>
              <Trash2 className="w-4 h-4 mr-2" />Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {expanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <FolderTreeNode
              key={child.id}
              folder={child}
              allFolders={allFolders}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              onCreateSubfolder={onCreateSubfolder}
              onRename={onRename}
              onDelete={onDelete}
              depth={depth + 1}
              resourceCounts={resourceCounts}
              dragOverFolderId={dragOverFolderId}
              onDragOver={onDragOver}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminResources() {

  const [selectedFolderId, setSelectedFolderId] = useState<number | null | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverFolderId, setDragOverFolderId] = useState<number | null>(null);
  const [draggingFileIds, setDraggingFileIds] = useState<Set<number>>(new Set());
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ name: string; done: boolean }[]>([]);

  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<number | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#6b7280");
  const [editingFolder, setEditingFolder] = useState<MediaFolder | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [deletingFolder, setDeletingFolder] = useState<MediaFolder | null>(null);
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null);
  const [movingFiles, setMovingFiles] = useState(false);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: folders = [], refetch: refetchFolders } = trpc.mediaFolders.list.useQuery();
  const { data: allResources = [], refetch: refetchResources } = trpc.resources.list.useQuery({ limit: 1000 });

  const createFolder = trpc.mediaFolders.create.useMutation({
    onSuccess: () => { refetchFolders(); toast.success("Dossier créé"); },
    onError: (e) => toast.error(e.message),
  });
  const updateFolder = trpc.mediaFolders.update.useMutation({
    onSuccess: () => { refetchFolders(); toast.success("Dossier modifié"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteFolder = trpc.mediaFolders.delete.useMutation({
    onSuccess: () => { refetchFolders(); refetchResources(); toast.success("Dossier supprimé"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteResource = trpc.resources.delete.useMutation({
    onSuccess: () => { refetchResources(); toast.success("Fichier supprimé"); },
    onError: (e) => toast.error(e.message),
  });
  const moveToFolder = trpc.resources.moveToFolder.useMutation({
    onSuccess: () => { refetchResources(); },
    onError: (e) => toast.error(e.message),
  });

  // Counts per folder
  const resourceCounts: Record<number, number> = {};
  for (const r of allResources as Resource[]) {
    if (r.folderId) resourceCounts[r.folderId] = (resourceCounts[r.folderId] || 0) + 1;
  }

  // Sub-folders of the current folder
  const subFolders = (folders as MediaFolder[]).filter((f) =>
    selectedFolderId === "all"
      ? false
      : selectedFolderId === null
      ? !f.parentId
      : f.parentId === selectedFolderId
  );

  // Filtered resources
  const displayedResources = (allResources as Resource[]).filter((r) => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (selectedFolderId === "all") return true;
    if (selectedFolderId === null) return !r.folderId;
    return r.folderId === selectedFolderId;
  });

  const rootFolders = (folders as MediaFolder[]).filter((f) => !f.parentId);

  // Upload files one by one (sequential) to avoid proxy timeout 503 errors
  const uploadFiles = useCallback(
    async (files: File[]) => {
      const targetFolderId = selectedFolderId === "all" ? null : selectedFolderId;
      setUploadProgress(files.map((f) => ({ name: f.name, done: false })));

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", "CATALOG");
        formData.append("language", "fr");
        formData.append("isPublic", "false");
        formData.append("requiredPartnerLevel", "ALL");
        if (targetFolderId !== null && targetFolderId !== undefined) {
          formData.append("folderId", String(targetFolderId));
        }

        try {
          const response = await fetch("/api/upload/resource/single", {
            method: "POST",
            body: formData,
            credentials: "include",
          });

          if (!response.ok) {
            let errMsg = `Erreur ${response.status}`;
            try { const d = await response.json(); errMsg = d.error || errMsg; } catch {}
            throw new Error(errMsg);
          }

          const result = await response.json();
          if (result.success) {
            successCount++;
            setUploadProgress((prev) =>
              prev.map((p, idx) => idx === i ? { ...p, done: true } : p)
            );
          }
        } catch (err: any) {
          failCount++;
          toast.error(`Échec: ${file.name} - ${err.message || "Erreur"}`);
          setUploadProgress((prev) =>
            prev.map((p, idx) => idx === i ? { ...p, done: true } : p)
          );
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} fichier(s) importé(s)${failCount > 0 ? `, ${failCount} en échec` : ""}`);
      }

      setTimeout(() => setUploadProgress([]), 2000);
      refetchResources();
    },
    [selectedFolderId, refetchResources]
  );

  const handleZoneDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) { await uploadFiles(files); return; }
    const fileIdsStr = e.dataTransfer.getData("application/x-file-ids");
    if (fileIdsStr) {
      const ids = JSON.parse(fileIdsStr) as number[];
      const targetFolderId = selectedFolderId === "all" ? null : selectedFolderId;
      for (const id of ids) await moveToFolder.mutateAsync({ id, folderId: targetFolderId });
      setDraggingFileIds(new Set());
      refetchResources();
    }
  };

  const handleFolderDrop = async (folderId: number | null) => {
    setDragOverFolderId(null);
    const ids = Array.from(draggingFileIds);
    if (ids.length === 0) return;
    for (const id of ids) await moveToFolder.mutateAsync({ id, folderId });
    setDraggingFileIds(new Set());
    setSelectedFiles(new Set());
    refetchResources();
    toast.success(`${ids.length} fichier(s) déplacé(s)`);
  };

  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedFiles(new Set(displayedResources.map((r) => r.id)));
  const clearSelection = () => setSelectedFiles(new Set());

  const handleBulkDelete = async () => {
    for (const id of selectedFiles) await deleteResource.mutateAsync({ id });
    setSelectedFiles(new Set());
    refetchResources();
  };

  const handleBulkMove = async () => {
    for (const id of selectedFiles) await moveToFolder.mutateAsync({ id, folderId: moveTargetFolderId });
    setSelectedFiles(new Set());
    setMovingFiles(false);
    setMoveTargetFolderId(null);
    refetchResources();
    toast.success(`${selectedFiles.size} fichier(s) déplacé(s)`);
  };

  const getBreadcrumb = (): MediaFolder[] => {
    if (selectedFolderId === "all" || selectedFolderId === null) return [];
    const path: MediaFolder[] = [];
    let current = (folders as MediaFolder[]).find((f) => f.id === selectedFolderId);
    while (current) {
      path.unshift(current);
      current = current.parentId ? (folders as MediaFolder[]).find((f) => f.id === current!.parentId) : undefined;
    }
    return path;
  };

  const breadcrumb = getBreadcrumb();

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden -m-6">

        {/* ── Sidebar ── */}
        <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Médiathèque</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" title="Nouveau dossier"
              onClick={() => { setCreateFolderParentId(null); setNewFolderName(""); setShowCreateFolder(true); }}>
              <FolderPlus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {/* All */}
            <div
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${selectedFolderId === "all" ? "bg-emerald-600 text-white" : "hover:bg-gray-100"}`}
              onClick={() => setSelectedFolderId("all")}
            >
              <FolderOpen className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-sm font-medium">Tous les fichiers</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedFolderId === "all" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}>
                {(allResources as Resource[]).length}
              </span>
            </div>

            {/* Unclassified */}
            <div
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${selectedFolderId === null ? "bg-emerald-600 text-white" : dragOverFolderId === 0 ? "bg-emerald-100 border border-emerald-400" : "hover:bg-gray-100"}`}
              onClick={() => setSelectedFolderId(null)}
              onDragOver={(e) => { e.preventDefault(); setDragOverFolderId(0); }}
              onDragLeave={() => setDragOverFolderId(null)}
              onDrop={async (e) => { e.preventDefault(); setDragOverFolderId(null); await handleFolderDrop(null); }}
            >
              <Folder className="w-4 h-4 flex-shrink-0 text-gray-400" />
              <span className="flex-1 text-sm">Non classés</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedFolderId === null ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}>
                {(allResources as Resource[]).filter((r) => !r.folderId).length}
              </span>
            </div>

            {rootFolders.length > 0 && <div className="border-t border-gray-100 my-1" />}

            {rootFolders.map((folder) => (
              <FolderTreeNode
                key={folder.id}
                folder={folder}
                allFolders={folders as MediaFolder[]}
                selectedFolderId={selectedFolderId}
                onSelect={setSelectedFolderId}
                onCreateSubfolder={(parentId) => { setCreateFolderParentId(parentId); setNewFolderName(""); setShowCreateFolder(true); }}
                onRename={(f) => { setEditingFolder(f); setEditFolderName(f.name); }}
                onDelete={setDeletingFolder}
                resourceCounts={resourceCounts}
                dragOverFolderId={dragOverFolderId}
                onDragOver={setDragOverFolderId}
                onDrop={handleFolderDrop}
              />
            ))}
          </div>

          <div className="p-3 border-t border-gray-100">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />Importer des fichiers
            </Button>
            <input ref={fileInputRef} type="file" multiple className="hidden"
              onChange={(e) => { const files = Array.from(e.target.files || []); if (files.length > 0) uploadFiles(files); e.target.value = ""; }} />
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm text-gray-600 flex-1 min-w-0">
              <button className="hover:text-emerald-600 font-medium" onClick={() => setSelectedFolderId("all")}>Médiathèque</button>
              {breadcrumb.map((f, i) => (
                <span key={f.id} className="flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                  <button className={`hover:text-emerald-600 ${i === breadcrumb.length - 1 ? "font-semibold text-gray-900" : ""}`} onClick={() => setSelectedFolderId(f.id)}>{f.name}</button>
                </span>
              ))}
              {selectedFolderId === null && <><ChevronRight className="w-3 h-3 text-gray-400" /><span className="font-semibold text-gray-900">Non classés</span></>}
            </div>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
            </div>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button className={`p-1.5 ${viewMode === "grid" ? "bg-emerald-50 text-emerald-600" : "text-gray-500 hover:bg-gray-50"}`} onClick={() => setViewMode("grid")}><Grid3X3 className="w-4 h-4" /></button>
              <button className={`p-1.5 ${viewMode === "list" ? "bg-emerald-50 text-emerald-600" : "text-gray-500 hover:bg-gray-50"}`} onClick={() => setViewMode("list")}><List className="w-4 h-4" /></button>
            </div>
            {selectedFolderId !== "all" && (
              <Button variant="outline" size="sm" className="h-8"
                onClick={() => { setCreateFolderParentId(typeof selectedFolderId === "number" ? selectedFolderId : null); setNewFolderName(""); setShowCreateFolder(true); }}>
                <FolderPlus className="w-3.5 h-3.5 mr-1.5" />Nouveau dossier
              </Button>
            )}
          </div>

          {/* Selection bar */}
          {selectedFiles.size > 0 && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center gap-3">
              <span className="text-sm font-medium text-emerald-800">{selectedFiles.size} fichier(s) sélectionné(s)</span>
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" size="sm" className="h-7 text-xs border-emerald-300" onClick={() => { setMovingFiles(true); setMoveTargetFolderId(null); }}>
                  <Move className="w-3 h-3 mr-1" />Déplacer
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50" onClick={handleBulkDelete}>
                  <Trash2 className="w-3 h-3 mr-1" />Supprimer
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearSelection}>
                  <X className="w-3 h-3 mr-1" />Désélectionner
                </Button>
              </div>
            </div>
          )}

          {/* Upload progress */}
          {uploadProgress.length > 0 && (
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 space-y-1">
              {uploadProgress.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-sm">
                  <Upload className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                  <span className="text-blue-700 truncate flex-1">{p.name}</span>
                  {p.done ? <Check className="w-3.5 h-3.5 text-green-500" /> : <span className="text-blue-500 text-xs">En cours...</span>}
                </div>
              ))}
            </div>
          )}

          {/* Drop zone */}
          <div
            className={`flex-1 overflow-y-auto p-4 relative transition-colors ${isDragOver ? "bg-emerald-50 ring-2 ring-inset ring-emerald-400" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false); }}
            onDrop={handleZoneDrop}
          >
            {isDragOver && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-3 border-2 border-emerald-400">
                  <Upload className="w-12 h-12 text-emerald-500" />
                  <p className="text-lg font-semibold text-emerald-700">Déposer les fichiers ici</p>
                </div>
              </div>
            )}

            {/* Sub-folders section */}
            {subFolders.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sous-dossiers</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {subFolders.map((sf) => (
                    <div
                      key={sf.id}
                      className="group flex flex-col items-center gap-2 p-3 bg-white rounded-xl border-2 border-gray-200 hover:border-emerald-400 hover:shadow-sm cursor-pointer transition-all"
                      onClick={() => setSelectedFolderId(sf.id)}
                      onDragOver={(e) => { e.preventDefault(); setDragOverFolderId(sf.id); }}
                      onDragLeave={() => setDragOverFolderId(null)}
                      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleFolderDrop(sf.id); }}
                    >
                      <FolderOpen className="w-10 h-10" style={{ color: sf.color || "#6b7280" }} />
                      <span className="text-xs font-medium text-gray-700 text-center truncate w-full text-center">{sf.name}</span>
                      {resourceCounts[sf.id] != null && (
                        <span className="text-xs text-gray-400">{resourceCounts[sf.id]} fichier(s)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {displayedResources.length === 0 && subFolders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <Folder className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">Ce dossier est vide</p>
                <p className="text-gray-400 text-sm mt-1">Glissez des fichiers ici ou cliquez sur "Importer des fichiers"</p>
                <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />Importer
                </Button>
              </div>
            ) : displayedResources.length === 0 ? null
            : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {displayedResources.map((resource) => {
                  const isSelected = selectedFiles.has(resource.id);
                  const thumb = getFileThumbnail(resource);
                  return (
                    <div
                      key={resource.id}
                      className={`group relative bg-white rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${isSelected ? "border-emerald-500 shadow-md" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"}`}
                      draggable
                      onDragStart={(e) => {
                        const ids = isSelected ? Array.from(selectedFiles) : [resource.id];
                        setDraggingFileIds(new Set(ids));
                        e.dataTransfer.setData("application/x-file-ids", JSON.stringify(ids));
                      }}
                      onClick={(e) => toggleSelect(resource.id, e)}
                      onDoubleClick={() => setPreviewResource(resource)}
                    >
                      <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                        {thumb ? (
                          <img src={thumb} alt={resource.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 p-4">
                            {getFileIcon(resource.fileType)}
                            <span className="text-xs text-gray-400 uppercase font-mono">{resource.fileType.split("/")[1]?.substring(0, 4) || "file"}</span>
                          </div>
                        )}
                      </div>
                      <div className={`absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? "bg-emerald-500 border-emerald-500" : "bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100"}`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="bg-white/90 rounded-full p-1 shadow hover:bg-white" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setPreviewResource(resource); }}><Eye className="w-4 h-4 mr-2" />Aperçu</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(resource.fileUrl, "_blank"); }}><Download className="w-4 h-4 mr-2" />Télécharger</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); setDeletingResource(resource); }}><Trash2 className="w-4 h-4 mr-2" />Supprimer</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-800 truncate">{resource.title}</p>
                        <p className="text-xs text-gray-400">{formatSize(resource.fileSize)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="w-8 px-3 py-2">
                        <input type="checkbox" checked={selectedFiles.size === displayedResources.length && displayedResources.length > 0} onChange={(e) => e.target.checked ? selectAll() : clearSelection()} className="rounded border-gray-300" />
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Nom</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600 hidden md:table-cell">Type</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600 hidden md:table-cell">Taille</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600 hidden lg:table-cell">Date</th>
                      <th className="w-10 px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayedResources.map((resource) => {
                      const isSelected = selectedFiles.has(resource.id);
                      return (
                        <tr key={resource.id} className={`group cursor-pointer transition-colors ${isSelected ? "bg-emerald-50" : "hover:bg-gray-50"}`}
                          draggable
                          onDragStart={(e) => { const ids = isSelected ? Array.from(selectedFiles) : [resource.id]; setDraggingFileIds(new Set(ids)); e.dataTransfer.setData("application/x-file-ids", JSON.stringify(ids)); }}
                          onClick={(e) => toggleSelect(resource.id, e)}
                          onDoubleClick={() => setPreviewResource(resource)}
                        >
                          <td className="px-3 py-2"><input type="checkbox" checked={isSelected} onChange={() => {}} className="rounded border-gray-300" /></td>
                          <td className="px-3 py-2"><div className="flex items-center gap-2">{getFileIcon(resource.fileType)}<span className="font-medium text-gray-800 truncate max-w-xs">{resource.title}</span></div></td>
                          <td className="px-3 py-2 text-gray-500 hidden md:table-cell">{resource.fileType.split("/")[1]?.toUpperCase() || "—"}</td>
                          <td className="px-3 py-2 text-gray-500 hidden md:table-cell">{formatSize(resource.fileSize)}</td>
                          <td className="px-3 py-2 text-gray-500 hidden lg:table-cell">{new Date(resource.createdAt).toLocaleDateString("fr-FR")}</td>
                          <td className="px-3 py-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200" onClick={(e) => e.stopPropagation()}><MoreVertical className="w-4 h-4" /></button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setPreviewResource(resource); }}><Eye className="w-4 h-4 mr-2" />Aperçu</DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(resource.fileUrl, "_blank"); }}><Download className="w-4 h-4 mr-2" />Télécharger</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); setDeletingResource(resource); }}><Trash2 className="w-4 h-4 mr-2" />Supprimer</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Status bar */}
          <div className="bg-white border-t border-gray-200 px-4 py-1.5 flex items-center justify-between text-xs text-gray-500">
            <span>{displayedResources.length} élément(s)</span>
            {selectedFiles.size > 0 && <span className="text-emerald-600 font-medium">{selectedFiles.size} sélectionné(s)</span>}
          </div>
        </main>
      </div>

      {/* ── Dialogs ── */}

      {/* Create folder */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{createFolderParentId ? "Nouveau sous-dossier" : "Nouveau dossier"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input placeholder="Nom du dossier" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} autoFocus
              onKeyDown={(e) => { if (e.key === "Enter" && newFolderName.trim()) { createFolder.mutate({ name: newFolderName.trim(), parentId: createFolderParentId, color: newFolderColor }); setShowCreateFolder(false); } }} />
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Couleur :</label>
              <input type="color" value={newFolderColor} onChange={(e) => setNewFolderColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFolder(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!newFolderName.trim()}
              onClick={() => { createFolder.mutate({ name: newFolderName.trim(), parentId: createFolderParentId, color: newFolderColor }); setShowCreateFolder(false); }}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename folder */}
      <Dialog open={!!editingFolder} onOpenChange={() => setEditingFolder(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Renommer le dossier</DialogTitle></DialogHeader>
          <Input value={editFolderName} onChange={(e) => setEditFolderName(e.target.value)} autoFocus className="mt-2"
            onKeyDown={(e) => { if (e.key === "Enter" && editFolderName.trim() && editingFolder) { updateFolder.mutate({ id: editingFolder.id, name: editFolderName.trim() }); setEditingFolder(null); } }} />
          <DialogFooter className="mt-3">
            <Button variant="outline" onClick={() => setEditingFolder(null)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!editFolderName.trim()}
              onClick={() => { if (editingFolder) { updateFolder.mutate({ id: editingFolder.id, name: editFolderName.trim() }); setEditingFolder(null); } }}>
              Renommer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete folder */}
      <AlertDialog open={!!deletingFolder} onOpenChange={() => setDeletingFolder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le dossier "{deletingFolder?.name}" ?</AlertDialogTitle>
            <AlertDialogDescription>Les fichiers seront déplacés vers le dossier parent. Les sous-dossiers seront remontés. Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={() => { if (deletingFolder) { deleteFolder.mutate({ id: deletingFolder.id }); if (selectedFolderId === deletingFolder.id) setSelectedFolderId("all"); setDeletingFolder(null); } }}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete resource */}
      <AlertDialog open={!!deletingResource} onOpenChange={() => setDeletingResource(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer "{deletingResource?.title}" ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={() => { if (deletingResource) { deleteResource.mutate({ id: deletingResource.id }); setDeletingResource(null); } }}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move files */}
      <Dialog open={movingFiles} onOpenChange={setMovingFiles}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Déplacer {selectedFiles.size} fichier(s) vers...</DialogTitle></DialogHeader>
          <div className="space-y-1 max-h-64 overflow-y-auto py-2">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${moveTargetFolderId === null ? "bg-emerald-50 border border-emerald-300" : "hover:bg-gray-50"}`} onClick={() => setMoveTargetFolderId(null)}>
              <Folder className="w-4 h-4 text-gray-400" /><span className="text-sm">Non classés (racine)</span>
            </div>
            {(folders as MediaFolder[]).map((f) => (
              <div key={f.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${moveTargetFolderId === f.id ? "bg-emerald-50 border border-emerald-300" : "hover:bg-gray-50"}`}
                style={{ paddingLeft: `${12 + (f.parentId ? 16 : 0)}px` }} onClick={() => setMoveTargetFolderId(f.id)}>
                <Folder className="w-4 h-4 flex-shrink-0" style={{ color: f.color || "#6b7280" }} /><span className="text-sm">{f.name}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovingFiles(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleBulkMove}>
              <FolderInput className="w-4 h-4 mr-2" />Déplacer ici
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview */}
      <Dialog open={!!previewResource} onOpenChange={() => setPreviewResource(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{previewResource && getFileIcon(previewResource.fileType)}{previewResource?.title}</DialogTitle>
          </DialogHeader>
          {previewResource && (
            <div className="mt-2">
              {previewResource.fileType.startsWith("image/") ? (
                <img src={previewResource.fileUrl} alt={previewResource.title} className="max-h-96 mx-auto rounded-lg object-contain" />
              ) : previewResource.fileType.startsWith("video/") ? (
                <video src={previewResource.fileUrl} controls className="w-full max-h-96 rounded-lg" />
              ) : previewResource.fileType === "application/pdf" ? (
                <iframe src={previewResource.fileUrl} className="w-full h-96 rounded-lg border" title={previewResource.title} />
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">{getFileIcon(previewResource.fileType)}<p className="text-gray-500">Aperçu non disponible pour ce type de fichier</p></div>
              )}
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>{formatSize(previewResource.fileSize)}</span>
                <Button size="sm" onClick={() => window.open(previewResource.fileUrl, "_blank")}><Download className="w-4 h-4 mr-2" />Télécharger</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
