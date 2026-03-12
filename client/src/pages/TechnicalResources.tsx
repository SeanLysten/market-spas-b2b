import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PDFViewer from "@/components/PDFViewer";
import {
  ArrowLeft,
  Search,
  FileText,
  Video,
  Link as LinkIcon,
  Download,
  Eye,
  MessageSquare,
  BookOpen,
  Folder,
  FolderOpen,
  File,
  Wrench,
  Settings,
  AlertTriangle,
  GraduationCap,
  ChevronRight,
  Star,
  Heart,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
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
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TechnicalResources() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [viewingPdf, setViewingPdf] = useState<{ url: string; name: string } | null>(null);

  // Lire le paramètre tab de l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam === "forum" ? "forum" : "resources");

  const { data: folders = [] } = trpc.admin.techFolders.list.useQuery();
  const { data: resources = [] } = trpc.admin.technicalResources.list.useQuery(
    currentFolderId !== null ? { folderId: currentFolderId } : {}
  );
  const { data: forumTopics = [] } = trpc.admin.forum.listTopics.useQuery({});

  // Favorites
  const { data: favoriteIds = [], refetch: refetchFavorites } = trpc.resourceFavorites.list.useQuery();
  const { data: favoriteResources = [], refetch: refetchFavoriteResources } = trpc.resourceFavorites.listWithDetails.useQuery();
  const toggleFavoriteMutation = trpc.resourceFavorites.toggle.useMutation({
    onSuccess: (result) => {
      refetchFavorites();
      refetchFavoriteResources();
      if (result.isFavorite) {
        toast.success("Ajouté aux favoris");
      } else {
        toast.success("Retiré des favoris");
      }
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour des favoris");
    },
  });

  const isFavorite = (resourceId: number) => favoriteIds.includes(resourceId);

  const handleToggleFavorite = (e: React.MouseEvent, resourceId: number) => {
    e.stopPropagation();
    toggleFavoriteMutation.mutate({ resourceId });
  };

  const currentFolder = folders.find((f: any) => f.id === currentFolderId);

  // Count resources per folder
  const allResources = trpc.admin.technicalResources.list.useQuery({});
  const getResourceCount = (folderId: number) => {
    return (allResources.data || []).filter((r: any) => r.folderId === folderId).length;
  };

  // Filter resources by search
  const filteredResources = search
    ? resources.filter(
        (r: any) =>
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.description?.toLowerCase().includes(search.toLowerCase())
      )
    : resources;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "VIDEO":
        return <Video className="h-5 w-5 text-blue-500" />;
      case "LINK":
        return <LinkIcon className="h-5 w-5 text-green-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      INSTALLATION: "Installation",
      MAINTENANCE: "Maintenance",
      TROUBLESHOOTING: "Dépannage",
      TECHNICAL_SPECS: "Spécifications techniques",
      TRAINING: "Formation",
      OTHER: "Autre",
    };
    return labels[category] || category;
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <BookOpen className="h-7 w-7 md:h-8 md:w-8 text-primary" />
                Ressources Techniques
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Documentations, guides et forum d'entraide
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="resources">
              <FileText className="h-4 w-4 mr-2" />
              Documentations
            </TabsTrigger>
            <TabsTrigger value="forum">
              <MessageSquare className="h-4 w-4 mr-2" />
              Forum d'entraide
            </TabsTrigger>
          </TabsList>

          {/* Onglet Ressources */}
          <TabsContent value="resources" className="space-y-6">

            {/* Favorites section */}
            {favoriteResources.length > 0 && currentFolderId === null && !search && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  Mes favoris
                  <span className="text-muted-foreground font-normal text-sm">
                    ({favoriteResources.length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {favoriteResources.map((resource: any) => (
                    <Card
                      key={`fav-${resource.id}`}
                      className="hover:shadow-md transition-shadow border-amber-200/50 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-800/30"
                    >
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">{getTypeIcon(resource.type)}</div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{resource.title}</h3>
                            {resource.fileSize && (
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(resource.fileSize)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => handleToggleFavorite(e, resource.id)}
                            >
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            </Button>
                            {resource.type === "PDF" && resource.fileUrl && (
                              <Button
                                size="sm"
                                variant="default"
                                className="h-8"
                                onClick={() =>
                                  setViewingPdf({
                                    url: resource.fileUrl,
                                    name: resource.title || "document.pdf",
                                  })
                                }
                              >
                                <BookOpen className="h-3.5 w-3.5 mr-1" />
                                Lire
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Breadcrumb */}
            {currentFolderId !== null && (
              <div className="flex items-center gap-2 text-sm">
                <button
                  className="text-primary hover:underline cursor-pointer"
                  onClick={() => setCurrentFolderId(null)}
                >
                  Tous les dossiers
                </button>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{currentFolder?.name}</span>
              </div>
            )}

            {/* Folders grid (only at root level) */}
            {currentFolderId === null && folders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Dossiers</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {folders.map((folder: any) => {
                    const IconComp = FOLDER_ICONS[folder.icon] || Folder;
                    const count = getResourceCount(folder.id);
                    return (
                      <Card
                        key={folder.id}
                        className="p-4 cursor-pointer hover:bg-accent/50 hover:shadow-md transition-all group"
                        onClick={() => setCurrentFolderId(folder.id)}
                      >
                        <div className="flex flex-col items-center text-center gap-2">
                          <IconComp className="h-10 w-10 text-primary/70 group-hover:text-primary transition-colors" />
                          <p className="font-medium text-sm leading-tight">{folder.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {count} fichier{count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un document..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Files list */}
            {filteredResources.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                  <h3 className="text-lg font-semibold mb-2">Aucun document trouvé</h3>
                  <p className="text-muted-foreground text-sm">
                    {search
                      ? "Essayez de modifier votre recherche"
                      : currentFolderId
                      ? "Ce dossier est vide"
                      : "Aucune ressource disponible pour le moment"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredResources.map((resource: any) => (
                  <Card
                    key={resource.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        {/* Favorite star button */}
                        <button
                          className="flex-shrink-0 focus:outline-none transition-transform hover:scale-110"
                          onClick={(e) => handleToggleFavorite(e, resource.id)}
                          title={isFavorite(resource.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                        >
                          <Star
                            className={`h-5 w-5 transition-colors ${
                              isFavorite(resource.id)
                                ? "text-amber-500 fill-amber-500"
                                : "text-muted-foreground/40 hover:text-amber-400"
                            }`}
                          />
                        </button>
                        <div className="flex-shrink-0">{getTypeIcon(resource.type)}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm md:text-base truncate">
                            {resource.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                            {resource.fileSize && (
                              <span>{formatFileSize(resource.fileSize)}</span>
                            )}
                            {resource.description && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span className="hidden sm:inline truncate max-w-[200px]">
                                  {resource.description}
                                </span>
                              </>
                            )}
                            {resource.productCategory && (
                              <>
                                <span>•</span>
                                <span className="bg-muted px-1.5 py-0.5 rounded">
                                  {resource.productCategory}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            {resource.viewCount}
                          </div>
                          {resource.type === "PDF" && resource.fileUrl && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() =>
                                setViewingPdf({
                                  url: resource.fileUrl,
                                  name: resource.title || "document.pdf",
                                })
                              }
                            >
                              <BookOpen className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Lire</span>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(resource.fileUrl, "_blank")}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Télécharger</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Onglet Forum */}
          <TabsContent value="forum" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-muted-foreground text-sm">
                Posez vos questions et partagez vos solutions avec la communauté
              </p>
              <Link href="/technical-resources/forum/new">
                <Button>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Nouveau sujet
                </Button>
              </Link>
            </div>

            {/* Liste des topics */}
            <div className="space-y-3">
              {forumTopics.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Aucune discussion</h3>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Soyez le premier à poser une question !
                    </p>
                    <Link href="/technical-resources/forum/new">
                      <Button>Créer un sujet</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                forumTopics.map((topic: any) => (
                  <Link key={topic.id} href={`/technical-resources/forum/${topic.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-base md:text-lg mb-1">
                              {topic.title}
                            </h3>
                            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-2">
                              {topic.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                                {getCategoryLabel(topic.category)}
                              </span>
                              {topic.productCategory && (
                                <span className="bg-muted px-2 py-1 rounded">
                                  {topic.productCategory}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {topic.viewCount} vues
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {topic.replyCount} réponses
                              </span>
                            </div>
                          </div>
                          {topic.status === "RESOLVED" && (
                            <span className="bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400 text-xs px-2 py-1 rounded whitespace-nowrap">
                              ✓ Résolu
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
