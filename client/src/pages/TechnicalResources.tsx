import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function TechnicalResources() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  
  // Lire le paramètre tab de l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam === 'forum' ? 'forum' : 'resources');

  const filters = {
    ...(typeFilter !== "ALL" && { type: typeFilter }),
    ...(categoryFilter !== "ALL" && { category: categoryFilter }),
    ...(search && { search }),
  };

  const { data: resources = [] } = trpc.admin.technicalResources.list.useQuery(filters);
  const { data: forumTopics = [] } = trpc.admin.forum.listTopics.useQuery({});

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "VIDEO":
        return <Video className="h-5 w-5 text-purple-500" />;
      case "LINK":
        return <LinkIcon className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5" />;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BookOpen className="h-8 w-8 text-primary" />
                Ressources Techniques
              </h1>
              <p className="text-muted-foreground mt-1">
                Documentations, vidéos et forum d'entraide
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
          <TabsContent value="resources" className="space-y-4">
            {/* Filtres */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher dans les ressources..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tous les types</SelectItem>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="VIDEO">Vidéo</SelectItem>
                      <SelectItem value="LINK">Lien</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Toutes les catégories</SelectItem>
                      <SelectItem value="INSTALLATION">Installation</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="TROUBLESHOOTING">Dépannage</SelectItem>
                      <SelectItem value="TECHNICAL_SPECS">Spécifications</SelectItem>
                      <SelectItem value="TRAINING">Formation</SelectItem>
                      <SelectItem value="OTHER">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Liste des ressources */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Aucune ressource trouvée</h3>
                    <p className="text-muted-foreground">
                      Essayez de modifier vos filtres de recherche
                    </p>
                  </CardContent>
                </Card>
              ) : (
                resources.map((resource: any) => (
                  <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(resource.type)}
                          <span className="text-xs font-medium text-muted-foreground">
                            {resource.type}
                          </span>
                        </div>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {getCategoryLabel(resource.category)}
                        </span>
                      </div>
                      <CardTitle className="text-lg mt-2">{resource.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {resource.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {resource.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {resource.viewCount} vues
                        </div>
                        {resource.productCategory && (
                          <span className="bg-muted px-2 py-1 rounded">
                            {resource.productCategory}
                          </span>
                        )}
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => window.open(resource.fileUrl, "_blank")}
                      >
                        {resource.type === "VIDEO" ? (
                          <>
                            <Video className="h-4 w-4 mr-2" />
                            Regarder
                          </>
                        ) : resource.type === "LINK" ? (
                          <>
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Ouvrir le lien
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Onglet Forum */}
          <TabsContent value="forum" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
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
                    <p className="text-muted-foreground mb-4">
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
                            <h3 className="font-semibold text-lg mb-1">{topic.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {topic.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded whitespace-nowrap">
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
