import AdminLayout from "@/components/AdminLayout";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminProducts() {
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    description: "",
    priceHT: "",
    vatRate: "21",
    stockQuantity: "0",
    weight: "",
    imageUrl: "",
    isActive: true,
    isVisible: true,
  });

  const { data: products, isLoading, refetch } = trpc.admin.products.list.useQuery({});
  const createMutation = trpc.admin.products.create.useMutation();
  const updateMutation = trpc.admin.products.update.useMutation();
  const deleteMutation = trpc.admin.products.delete.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        sku: formData.sku,
        name: formData.name,
        description: formData.description || undefined,
        priceHT: parseFloat(formData.priceHT),
        vatRate: parseFloat(formData.vatRate),
        stockQuantity: parseInt(formData.stockQuantity),
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        imageUrl: formData.imageUrl || undefined,
        isActive: formData.isActive,
        isVisible: formData.isVisible,
      };

      if (editingProduct) {
        await updateMutation.mutateAsync({
          id: editingProduct.id,
          ...data,
        });
        toast.success("Produit modifié avec succès");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Produit créé avec succès");
      }

      setOpen(false);
      setEditingProduct(null);
      setFormData({
        sku: "",
        name: "",
        description: "",
        priceHT: "",
        vatRate: "21",
        stockQuantity: "0",
        weight: "",
        imageUrl: "",
        isActive: true,
        isVisible: true,
      });
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement");
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || "",
      priceHT: product.pricePublicHT || "",
      vatRate: product.vatRate || "21",
      stockQuantity: product.stockQuantity?.toString() || "0",
      weight: product.weight || "",
      imageUrl: product.imageUrl || "",
      isActive: product.isActive !== false,
      isVisible: product.isVisible !== false,
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Produit supprimé");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setEditingProduct(null);
      setFormData({
        sku: "",
        name: "",
        description: "",
        priceHT: "",
        vatRate: "21",
        stockQuantity: "0",
        weight: "",
        imageUrl: "",
        isActive: true,
        isVisible: true,
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des produits</h1>
            <p className="text-muted-foreground mt-2">
              Ajoutez et gérez le catalogue de produits
            </p>
          </div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Ajouter un produit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "Modifier le produit" : "Ajouter un nouveau produit"}
                  </DialogTitle>
                  <DialogDescription>
                    Renseignez les informations du produit
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU *</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="PROD-001"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Nom du produit *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Spa 4 places"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description détaillée du produit..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priceHT">Prix HT (€) *</Label>
                      <Input
                        id="priceHT"
                        type="number"
                        step="0.01"
                        value={formData.priceHT}
                        onChange={(e) => setFormData({ ...formData, priceHT: e.target.value })}
                        placeholder="1999.99"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vatRate">TVA (%) *</Label>
                      <Input
                        id="vatRate"
                        type="number"
                        step="0.01"
                        value={formData.vatRate}
                        onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
                        placeholder="21"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stockQuantity">Stock *</Label>
                      <Input
                        id="stockQuantity"
                        type="number"
                        value={formData.stockQuantity}
                        onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                        placeholder="10"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">Poids (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.01"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        placeholder="150"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">URL de l'image</Label>
                      <Input
                        id="imageUrl"
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="isActive" className="cursor-pointer">Actif</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isVisible"
                        checked={formData.isVisible}
                        onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="isVisible" className="cursor-pointer">Visible</Label>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des produits</CardTitle>
            <CardDescription>
              {products?.length || 0} produit(s) dans le catalogue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="skeleton h-16 w-full" />
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prix HT</TableHead>
                    <TableHead>TVA</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.pricePublicHT ? `${product.pricePublicHT} €` : "—"}</TableCell>
                      <TableCell>{product.vatRate ? `${product.vatRate}%` : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={product.stockQuantity > 0 ? "default" : "destructive"}>
                          {product.stockQuantity || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {product.isActive && (
                            <Badge className="bg-green-100 text-green-800">Actif</Badge>
                          )}
                          {product.isVisible && (
                            <Badge className="bg-blue-100 text-blue-800">Visible</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun produit trouvé</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Commencez par ajouter votre premier produit
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
