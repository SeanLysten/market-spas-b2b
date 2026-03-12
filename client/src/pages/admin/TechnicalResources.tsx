import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import PDFViewer from "@/components/PDFViewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  FileText,
  Video,
  Link as LinkIcon,
  Upload,
  FolderPlus,
  Folder,
  FolderOpen,
  ArrowLeft,
  Download,
  Eye,
  File,
  X,
  GripVertical,
  Wrench,
  Settings,
  AlertTriangle,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

const FOLDER_ICONS: Record<string, any> = {
  wrench: Wrench,
  settings: Settings,
  "alert-triangle": AlertTriangle,
  "file-text": FileText,
  "graduation-cap": GraduationCap,
  folder: Folder,
  "book-open": BookOpen,
};

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminTechnicalResources() {
  const [search, setSearch] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any>(null);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [viewingPdf, setViewingPdf] = useState<{ url: string; name: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [folderForm, setFolderForm] = useState({ name: "", slug: "", description: "", icon: "folder" });
  const [resourceForm, setResourceForm] = useState({
    title: "",
    description: "",
    productCategory: "",
  });

  const { data: folders = [], refetch: refetchFolders } = trpc.admin.techFolders.list.useQuery();
  const { data: resources = [], refetch: refetchResources } = trpc.admin.technicalResources.list.useQuery(
    currentFolderId !== null ? { folderId: currentFolderId } : {}
  );

  const createFolderMutation = trpc.admin.techFolders.create.useMutation();
  const updateFolderMutation = trpc.admin.techFolders.update.useMutation();
  const deleteFolderMutation = trpc.admin.techFolders.delete.useMutation();
  const uploadMutation = trpc.admin.technicalResources.upload.useMutation();
  const updateResourceMutation = trpc.admin.technicalResources.update.useMutation();
  const deleteResourceMutation = trpc.admin.technicalResources.delete.useMutation();

  const currentFolder = folders.find((f: any) => f.id === currentFolderId);

  // Filter resources by search
  const filteredResources = search
    ? resources.filter((r: any) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase())
      )
    : resources;

  // Count resources per folder
  const allResources = trpc.admin.technicalResources.list.useQuery({});
  const getResourceCount = (folderId: number) => {
    return (allResources.data || []).filter((r: any) => r.folderId === folderId).length;
  };

  // ---- FILE UPLOAD ----
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploadProgress({ current: 0, total: fileArray.length });

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        await uploadMutation.mutateAsync({
          fileData: base64,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          title: file.name.replace(/\.[^/.]+$/, ""),
          folderId: currentFolderId,
        });

        setUploadProgress({ current: i + 1, total: fileArray.length });
      } catch (error) {
        toast.error(`Erreur lors de l'upload de ${file.name}`);
      }
    }

    setUploadProgress(null);
    toast.success(`${fileArray.length} fichier(s) uploadé(s) avec succès`);
    refetchResources();
    allResources.refetch();
  }, [currentFolderId, uploadMutation, refetchResources, allResources]);

  // ---- DRAG & DROP ----
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  // ---- FOLDER CRUD ----
  const handleFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFolder) {
        await updateFolderMutation.mutateAsync({ id: editingFolder.id, ...folderForm });
        toast.success("Dossier mis à jour");
      } else {
        const slug = folderForm.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        await createFolderMutation.mutateAsync({ ...folderForm, slug, sortOrder: folders.length });
        toast.success("Dossier créé");
      }
      setIsFolderDialogOpen(false);
      setEditingFolder(null);
      setFolderForm({ name: "", slug: "", description: "", icon: "folder" });
      refetchFolders();
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde du dossier");
    }
  };

  const handleDeleteFolder = async (id: number) => {
    if (!confirm("Supprimer ce dossier ? Les fichiers seront déplacés vers 'Non classés'.")) return;
    try {
      await deleteFolderMutation.mutateAsync({ id });
      toast.success("Dossier supprimé");
      if (currentFolderId === id) setCurrentFolderId(null);
      refetchFolders();
      refetchResources();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleEditFolder = (folder: any) => {
    setEditingFolder(folder);
    setFolderForm({ name: folder.name, slug: folder.slug, description: folder.description || "", icon: folder.icon || "folder" });
    setIsFolderDialogOpen(true);
  };

  // ---- RESOURCE CRUD ----
  const handleEditResource = (resource: any) => {
    setEditingResource(resource);
    setResourceForm({
      title: resource.title,
      description: resource.description || "",
      productCategory: resource.productCategory || "",
    });
    setIsUploadDialogOpen(true);
  };

  const handleUpdateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;
    try {
      await updateResourceMutation.mutateAsync({
        id: editingResource.id,
        title: resourceForm.title,
        description: resourceForm.description || undefined,
        productCategory: resourceForm.productCategory || undefined,
      });
      toast.success("Ressource mise à jour");
      setIsUploadDialogOpen(false);
      setEditingResource(null);
      refetchResources();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDeleteResource = async (id: number) => {
    if (!confirm("Supprimer cette ressource ?")) return;
    try {
      await deleteResourceMutation.mutateAsync({ id });
      toast.success("Ressource supprimée");
      refetchResources();
      allResources.refetch();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "PDF": return <FileText className="h-5 w-5 text-red-500" />;
      case "VIDEO": return <Video className="h-5 w-5 text-blue-500" />;
      case "LINK": return <LinkIcon className="h-5 w-5 text-green-500" />;
      default: return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  // If viewing a PDF, show the PDF viewer overlay
  if (viewingPdf) {
    return (
      <PDFViewer
        fileUrl={viewingPdf.url}
        fileName={viewingPdf.name}
        onClose={() => setViewingPdf(null)}
      />
    );
  }

  return (
    <AdminLayout>
      <div
        className="p-4 md:p-6 space-y-6 min-h-[80vh]"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {currentFolderId !== null && (
              <Button variant="ghost" size="sm" onClick={() => setCurrentFolderId(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {currentFolder ? currentFolder.name : "Ressources Techniques"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {currentFolder
                  ? currentFolder.description || `Fichiers dans ${currentFolder.name}`
                  : "Gérez les documentations techniques par dossier — glissez-déposez vos PDFs"}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setEditingFolder(null);
              setFolderForm({ name: "", slug: "", description: "", icon: "folder" });
              setIsFolderDialogOpen(true);
            }}>
              <FolderPlus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nouveau dossier</span>
            </Button>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Uploader des fichiers</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,.mov,.avi,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {/* Upload progress */}
        {uploadProgress && (
          <Card className="p-4 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-primary animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-medium">Upload en cours... {uploadProgress.current}/{uploadProgress.total}</p>
                <div className="w-full bg-muted rounded-full h-2 mt-1">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Drag overlay */}
        {isDragging && (
          <div className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
            <div className="bg-background border-2 border-dashed border-primary rounded-2xl p-12 text-center shadow-xl">
              <Upload className="h-16 w-16 text-primary mx-auto mb-4" />
              <p className="text-xl font-semibold">Déposez vos fichiers ici</p>
              <p className="text-muted-foreground mt-1">
                {currentFolder ? `Dans le dossier "${currentFolder.name}"` : "Les fichiers seront ajoutés sans dossier"}
              </p>
            </div>
          </div>
        )}

        {/* Search (only when inside a folder or viewing all) */}
        {(currentFolderId !== null || resources.length > 0) && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un fichier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Folders grid (only at root level) */}
        {currentFolderId === null && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Dossiers</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {folders.map((folder: any) => {
                const IconComp = FOLDER_ICONS[folder.icon] || Folder;
                const count = getResourceCount(folder.id);
                return (
                  <Card
                    key={folder.id}
                    className="p-4 cursor-pointer hover:bg-accent/50 transition-colors group relative"
                    onClick={() => setCurrentFolderId(folder.id)}
                  >
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => { e.stopPropagation(); handleEditFolder(folder); }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                      <IconComp className="h-10 w-10 text-primary/70" />
                      <p className="font-medium text-sm leading-tight">{folder.name}</p>
                      <p className="text-xs text-muted-foreground">{count} fichier{count !== 1 ? "s" : ""}</p>
                    </div>
                  </Card>
                );
              })}

              {/* Add folder card */}
              <Card
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors border-dashed"
                onClick={() => {
                  setEditingFolder(null);
                  setFolderForm({ name: "", slug: "", description: "", icon: "folder" });
                  setIsFolderDialogOpen(true);
                }}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <FolderPlus className="h-10 w-10 text-muted-foreground/50" />
                  <p className="font-medium text-sm text-muted-foreground">Nouveau dossier</p>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Files list */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {currentFolderId !== null ? "Fichiers" : "Tous les fichiers"}
            <span className="text-muted-foreground font-normal text-sm ml-2">
              ({filteredResources.length})
            </span>
          </h2>

          {filteredResources.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Upload className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-lg font-medium text-muted-foreground">Aucun fichier</p>
              <p className="text-sm text-muted-foreground mt-1">
                Glissez-déposez des fichiers ici ou cliquez sur "Uploader"
              </p>
            </Card>
          ) : (
            <>
              {/* Mobile view */}
              <div className="md:hidden space-y-2">
                {filteredResources.map((resource: any) => (
                  <Card key={resource.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">{getTypeIcon(resource.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{resource.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{formatFileSize(resource.fileSize)}</span>
                          <span>•</span>
                          <span>{resource.downloadCount || 0} <Download className="h-3 w-3 inline" /></span>
                          <span>•</span>
                          <span>{resource.viewCount} <Eye className="h-3 w-3 inline" /></span>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {resource.type === "PDF" && resource.fileUrl && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Prévisualiser" onClick={() => setViewingPdf({ url: resource.fileUrl, name: resource.title || "document.pdf" })}>
                            <Eye className="h-3.5 w-3.5 text-primary" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditResource(resource)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteResource(resource.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop view */}
              <Card className="hidden md:block overflow-hidden">
                <div className="divide-y">
                  {filteredResources.map((resource: any) => (
                    <div key={resource.id} className="flex items-center gap-4 px-4 py-3 hover:bg-accent/30 transition-colors group">
                      <div className="flex-shrink-0">{getTypeIcon(resource.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{resource.title}</p>
                        {resource.description && (
                          <p className="text-xs text-muted-foreground truncate">{resource.description}</p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatFileSize(resource.fileSize)}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {resource.downloadCount || 0}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {resource.viewCount}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(resource.createdAt).toLocaleDateString("fr-FR")}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {resource.type === "PDF" && resource.fileUrl && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Prévisualiser" onClick={() => setViewingPdf({ url: resource.fileUrl, name: resource.title || "document.pdf" })}>
                            <Eye className="h-3.5 w-3.5 text-primary" />
                          </Button>
                        )}
                        {resource.fileUrl && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditResource(resource)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteResource(resource.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Folder Dialog */}
      <Dialog open={isFolderDialogOpen} onOpenChange={(open) => {
        setIsFolderDialogOpen(open);
        if (!open) { setEditingFolder(null); setFolderForm({ name: "", slug: "", description: "", icon: "folder" }); }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingFolder ? "Modifier le dossier" : "Nouveau dossier"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFolderSubmit} className="space-y-4">
            <div>
              <Label>Nom du dossier *</Label>
              <Input
                value={folderForm.name}
                onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                placeholder="Ex: Installation"
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={folderForm.description}
                onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                placeholder="Description du dossier..."
                rows={2}
              />
            </div>
            <div>
              <Label>Icône</Label>
              <Select value={folderForm.icon} onValueChange={(v) => setFolderForm({ ...folderForm, icon: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="wrench">Clé (Installation)</SelectItem>
                  <SelectItem value="settings">Engrenage (Maintenance)</SelectItem>
                  <SelectItem value="alert-triangle">Alerte (Dépannage)</SelectItem>
                  <SelectItem value="file-text">Document (Spécifications)</SelectItem>
                  <SelectItem value="graduation-cap">Diplôme (Formation)</SelectItem>
                  <SelectItem value="folder">Dossier (Autre)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsFolderDialogOpen(false)}>Annuler</Button>
              <Button type="submit">{editingFolder ? "Mettre à jour" : "Créer"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Resource Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
        setIsUploadDialogOpen(open);
        if (!open) setEditingResource(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la ressource</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateResource} className="space-y-4">
            <div>
              <Label>Titre</Label>
              <Input
                value={resourceForm.title}
                onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={resourceForm.description}
                onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Catégorie produit</Label>
              <Select
                value={resourceForm.productCategory || "NONE"}
                onValueChange={(v) => setResourceForm({ ...resourceForm, productCategory: v === "NONE" ? "" : v })}
              >
                <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Aucune</SelectItem>
                  <SelectItem value="SPAS">Spas</SelectItem>
                  <SelectItem value="SWIM_SPAS">Spas de nage</SelectItem>
                  <SelectItem value="MAINTENANCE">Produits d'entretien</SelectItem>
                  <SelectItem value="COVERS">Couvertures</SelectItem>
                  <SelectItem value="ACCESSORIES">Accessoires</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editingResource && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Fichier : {editingResource.fileName || "N/A"}</p>
                <p>Taille : {formatFileSize(editingResource.fileSize)}</p>
                <p>Type : {editingResource.fileType || editingResource.type}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Annuler</Button>
              <Button type="submit">Mettre à jour</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
