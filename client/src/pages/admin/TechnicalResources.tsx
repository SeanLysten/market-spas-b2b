import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Pencil, Trash2, Search, FileText, Video, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export default function AdminTechnicalResources() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "PDF",
    fileUrl: "",
    category: "INSTALLATION",
    productCategory: "",
    tags: "",
  });

  const filters = {
    ...(typeFilter !== "ALL" && { type: typeFilter }),
    ...(categoryFilter !== "ALL" && { category: categoryFilter }),
    ...(search && { search }),
  };

  const { data: resources = [], refetch } = trpc.admin.technicalResources.list.useQuery(filters);
  const createMutation = trpc.admin.technicalResources.create.useMutation();
  const updateMutation = trpc.admin.technicalResources.update.useMutation();
  const deleteMutation = trpc.admin.technicalResources.delete.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingResource) {
        await updateMutation.mutateAsync({
          id: editingResource.id,
          ...formData,
        });
        toast.success("Ressource mise à jour avec succès");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Ressource créée avec succès");
      }

      setIsDialogOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      toast.error("Une erreur est survenue");
    }
  };

  const handleEdit = (resource: any) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description,
      type: resource.type,
      fileUrl: resource.fileUrl,
      category: resource.category,
      productCategory: resource.productCategory || "",
      tags: resource.tags || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette ressource ?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Ressource supprimée avec succès");
      refetch();
    } catch (error) {
      toast.error("Impossible de supprimer la ressource");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "PDF",
      fileUrl: "",
      category: "INSTALLATION",
      productCategory: "",
      tags: "",
    });
    setEditingResource(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return <FileText className="h-4 w-4" />;
      case "VIDEO":
        return <Video className="h-4 w-4" />;
      case "LINK":
        return <LinkIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Ressources Techniques</h1>
          <p className="text-muted-foreground">
            Gérez les documentations, vidéos et liens techniques
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle ressource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingResource ? "Modifier la ressource" : "Nouvelle ressource"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Titre *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="VIDEO">Vidéo</SelectItem>
                      <SelectItem value="LINK">Lien externe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Catégorie *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSTALLATION">Installation</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="TROUBLESHOOTING">Dépannage</SelectItem>
                      <SelectItem value="TECHNICAL_SPECS">Spécifications techniques</SelectItem>
                      <SelectItem value="TRAINING">Formation</SelectItem>
                      <SelectItem value="OTHER">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Catégorie produit (optionnel)</Label>
                <Select
                  value={formData.productCategory}
                  onValueChange={(value) => setFormData({ ...formData, productCategory: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Toutes les catégories</SelectItem>
                    <SelectItem value="SPAS">Spas</SelectItem>
                    <SelectItem value="SWIM_SPAS">Spas de nage</SelectItem>
                    <SelectItem value="MAINTENANCE">Produits d'entretien</SelectItem>
                    <SelectItem value="COVERS">Couvertures</SelectItem>
                    <SelectItem value="ACCESSORIES">Accessoires</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>URL du fichier/lien *</Label>
                <Input
                  type="url"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </div>

              <div>
                <Label>Tags (séparés par des virgules)</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="installation, électrique, plomberie"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit">
                  {editingResource ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les types</SelectItem>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="VIDEO">Vidéo</SelectItem>
              <SelectItem value="LINK">Lien</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
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
      </Card>

      {/* Table */}
      {/* Vue mobile en cartes */}
      <div className="md:hidden space-y-3">
        {resources.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">Aucune ressource trouvée</Card>
        ) : (
          resources.map((resource: any) => (
            <Card key={resource.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {getTypeIcon(resource.type)}
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{resource.title}</p>
                    <p className="text-xs text-muted-foreground">{resource.category} {resource.productCategory ? `• ${resource.productCategory}` : ''}</p>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(resource)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(resource.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span>{resource.type}</span>
                <span>•</span>
                <span>{resource.viewCount} vues</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Vue desktop en tableau */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead className="text-right">Vues</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Aucune ressource trouvée
                </TableCell>
              </TableRow>
            ) : (
              resources.map((resource: any) => (
                <TableRow key={resource.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(resource.type)}
                      <span className="text-sm">{resource.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{resource.title}</TableCell>
                  <TableCell>{resource.category}</TableCell>
                  <TableCell>{resource.productCategory || "-"}</TableCell>
                  <TableCell className="text-right">{resource.viewCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(resource)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(resource.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
    </AdminLayout>
  );
}
