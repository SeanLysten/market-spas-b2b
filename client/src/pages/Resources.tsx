import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, 
  Search, 
  FileText, 
  Video, 
  Image as ImageIcon,
  Download,
  Eye,
  Filter
} from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();

  const { data: resources, isLoading } = trpc.resources.list.useQuery({
    category: categoryFilter,
    limit: 50,
  });

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      TECHNICAL_DOC: FileText,
      VIDEO_TUTORIAL: Video,
      MARKETING_IMAGE: ImageIcon,
      CATALOG: FileText,
      SALES_GUIDE: FileText,
      INSTALLATION: FileText,
    };
    return icons[category] || FileText;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      TECHNICAL_DOC: "Documentation technique",
      VIDEO_TUTORIAL: "Vidéo tutoriel",
      TROUBLESHOOTING: "Dépannage",
      MARKETING_IMAGE: "Image marketing",
      CATALOG: "Catalogue",
      PLV: "PLV",
      SALES_GUIDE: "Guide de vente",
      INSTALLATION: "Installation",
      WARRANTY: "Garantie",
      CERTIFICATE: "Certificat",
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      TECHNICAL_DOC: "bg-blue-100 text-blue-800",
      VIDEO_TUTORIAL: "bg-purple-100 text-purple-800",
      MARKETING_IMAGE: "bg-pink-100 text-pink-800",
      CATALOG: "bg-green-100 text-green-800",
      SALES_GUIDE: "bg-yellow-100 text-yellow-800",
      INSTALLATION: "bg-orange-100 text-orange-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const filteredResources = resources?.filter((resource) =>
    searchQuery
      ? resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Bibliothèque de ressources</h1>
                <p className="text-sm text-muted-foreground">
                  {filteredResources?.length || 0} ressources disponibles
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une ressource..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={categoryFilter === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(undefined)}
            >
              Toutes
            </Button>
            {[
              { value: "TECHNICAL_DOC", label: "Documentation" },
              { value: "VIDEO_TUTORIAL", label: "Vidéos" },
              { value: "MARKETING_IMAGE", label: "Marketing" },
              { value: "CATALOG", label: "Catalogues" },
              { value: "SALES_GUIDE", label: "Guides" },
              { value: "INSTALLATION", label: "Installation" },
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={categoryFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Resources Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="skeleton h-6 w-3/4 mb-2" />
                  <div className="skeleton h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <div className="skeleton h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredResources && filteredResources.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => {
              const Icon = getCategoryIcon(resource.category);
              return (
                <Card key={resource.id} className="card-hover flex flex-col">
                  <CardHeader className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <Badge className={getCategoryColor(resource.category)}>
                        {getCategoryLabel(resource.category)}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {resource.description || "Ressource disponible pour téléchargement"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{resource.fileType.toUpperCase()}</span>
                      <span>{formatFileSize(resource.fileSize)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {resource.viewCount} vues
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {resource.downloadCount} téléchargements
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" className="flex-1" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Voir
                      </Button>
                      <Button className="flex-1" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Aucune ressource trouvée</h3>
                <p className="text-muted-foreground">
                  {searchQuery || categoryFilter
                    ? "Essayez de modifier vos filtres"
                    : "Les ressources seront bientôt disponibles"}
                </p>
              </div>
              {(searchQuery || categoryFilter) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter(undefined);
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
