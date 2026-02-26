import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { trpc } from "@/lib/trpc";
import { Plus, Upload, FileText, Video, Image as ImageIcon, Trash2, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminResources() {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "TECHNICAL_DOC" as const,
    language: "fr",
    isPublic: false,
    requiredPartnerLevel: "BRONZE" as const,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: resources, isLoading, refetch } = trpc.resources.list.useQuery({});
  const createMutation = trpc.resources.create.useMutation();
  const deleteMutation = trpc.resources.delete.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Le fichier est trop volumineux (max 50MB)");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    setUploading(true);

    try {
      // Convertir le fichier en base64 pour l'upload
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        await createMutation.mutateAsync({
          ...formData,
          fileData: base64,
          fileName: selectedFile.name,
          fileType: selectedFile.type || "application/octet-stream",
          fileSize: selectedFile.size,
        });

        toast.success("Ressource ajoutée avec succès");
        setOpen(false);
        setFormData({
          title: "",
          description: "",
          category: "TECHNICAL_DOC",
          language: "fr",
          isPublic: false,
          requiredPartnerLevel: "BRONZE",
        });
        setSelectedFile(null);
        refetch();
      };
      reader.readAsDataURL(selectedFile);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'ajout de la ressource");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette ressource ?")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Ressource supprimée");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      TECHNICAL_DOC: FileText,
      VIDEO_TUTORIAL: Video,
      MARKETING_IMAGE: ImageIcon,
      CATALOG: FileText,
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des ressources média</h1>
            <p className="text-muted-foreground mt-2">
              Gérez les catalogues, vidéos, images marketing et supports PLV
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Ajouter une ressource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Ajouter une nouvelle ressource</DialogTitle>
                  <DialogDescription>
                    Uploadez un fichier et renseignez les informations
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="file">Fichier *</Label>
                    <div 
                      className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          if (file.size > 50 * 1024 * 1024) {
                            toast.error("Le fichier est trop volumineux (max 50MB)");
                            return;
                          }
                          setSelectedFile(file);
                        }
                      }}
                      onClick={() => document.getElementById('file')?.click()}
                    >
                      <Input
                        id="file"
                        type="file"
                        onChange={handleFileSelect}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mov,.jpg,.jpeg,.png,.zip"
                        className="hidden"
                        required
                      />
                      {selectedFile ? (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 mx-auto text-green-500" />
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {selectedFile.type.includes('image') && (
                            <img 
                              src={URL.createObjectURL(selectedFile)} 
                              alt="Preview" 
                              className="max-w-xs mx-auto rounded-lg mt-2"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Glissez-déposez un fichier ou cliquez pour sélectionner
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF, DOC, PPT, MP4, JPG, PNG, ZIP (max 50MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Titre *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Catalogue 2025"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description de la ressource..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Catégorie *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TECHNICAL_DOC">Documentation technique</SelectItem>
                          <SelectItem value="VIDEO_TUTORIAL">Vidéo tutoriel</SelectItem>
                          <SelectItem value="MARKETING_IMAGE">Image marketing</SelectItem>
                          <SelectItem value="CATALOG">Catalogue</SelectItem>
                          <SelectItem value="PLV">PLV</SelectItem>
                          <SelectItem value="SALES_GUIDE">Guide de vente</SelectItem>
                          <SelectItem value="INSTALLATION">Installation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Langue</Label>
                      <Select
                        value={formData.language}
                        onValueChange={(value) => setFormData({ ...formData, language: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="nl">Néerlandais</SelectItem>
                          <SelectItem value="en">Anglais</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level">Niveau partenaire minimum</Label>
                    <Select
                      value={formData.requiredPartnerLevel}
                      onValueChange={(value: any) => setFormData({ ...formData, requiredPartnerLevel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? (
                      <>
                        <Upload className="w-4 h-4 mr-2 animate-spin" />
                        Upload en cours...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Ajouter
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
              </Card>
            ))}
          </div>
        ) : resources && resources.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => {
              const Icon = getCategoryIcon(resource.category);
              return (
                <Card key={resource.id} className="card-hover">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => window.open(resource.fileUrl, "_blank")}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(resource.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {resource.description || "Aucune description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{getCategoryLabel(resource.category)}</span>
                      <span className="text-muted-foreground">{resource.language?.toUpperCase() || "FR"}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{resource.viewCount} vues</span>
                      <span>{resource.downloadCount} téléchargements</span>
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
                <h3 className="text-lg font-semibold mb-2">Aucune ressource</h3>
                <p className="text-muted-foreground">
                  Commencez par ajouter votre première ressource média
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
