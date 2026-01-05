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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Plus, Edit, Trash2, Package, Palette, TruckIcon, Pencil, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";

export default function AdminProducts() {
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [incomingDialogOpen, setIncomingDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const [productForm, setProductForm] = useState({
    sku: "",
    name: "",
    description: "",
    category: "OTHER" as "SPAS" | "SWIM_SPAS" | "MAINTENANCE" | "COVERS" | "ACCESSORIES" | "OTHER",
    priceHT: "",
    vatRate: "21",
    stockQuantity: "0",
    weight: "",
    imageUrl: "",
    isActive: true,
    isVisible: true,
  });

  const [variantForm, setVariantForm] = useState({
    sku: "",
    name: "",
    color: "",
    size: "",
    voltage: "",
    material: "",
    stockQuantity: "0",
    imageUrl: "",
  });

  const [incomingForm, setIncomingForm] = useState({
    productId: "",
    variantId: "",
    quantity: "",
    expectedWeek: "",
    expectedYear: new Date().getFullYear().toString(),
    notes: "",
  });

  const { data: products, isLoading, refetch } = trpc.admin.products.list.useQuery({});
  const safeProducts = Array.isArray(products) ? products : [];
  const createProductMutation = trpc.admin.products.create.useMutation();
  const updateProductMutation = trpc.admin.products.update.useMutation();
  const deleteProductMutation = trpc.admin.products.delete.useMutation();

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        sku: productForm.sku,
        name: productForm.name,
        description: productForm.description || undefined,
        priceHT: parseFloat(productForm.priceHT),
        vatRate: parseFloat(productForm.vatRate),
        stockQuantity: parseInt(productForm.stockQuantity),
        weight: productForm.weight ? parseFloat(productForm.weight) : undefined,
        imageUrl: productForm.imageUrl || undefined,
        isActive: productForm.isActive,
        isVisible: productForm.isVisible,
      };

      if (editingProduct) {
        await updateProductMutation.mutateAsync({
          id: editingProduct.id,
          ...data,
        });
        toast.success("Produit modifié avec succès");
      } else {
        await createProductMutation.mutateAsync(data);
        toast.success("Produit créé avec succès");
      }

      setProductDialogOpen(false);
      setEditingProduct(null);
      resetProductForm();
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement");
    }
  };

  const resetProductForm = () => {
    setProductForm({
      sku: "",
      name: "",
      description: "",
      category: "OTHER" as "SPAS" | "SWIM_SPAS" | "MAINTENANCE" | "COVERS" | "ACCESSORIES" | "OTHER",
      priceHT: "",
      vatRate: "21",
      stockQuantity: "0",
      weight: "",
      imageUrl: "",
      isActive: true,
      isVisible: true,
    });
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      sku: product.sku || "",
      name: product.name || "",
      description: product.description || "",
      category: product.category || "OTHER",
      priceHT: product.pricePublicHT?.toString() || "",
      vatRate: product.vatRate?.toString() || "21",
      stockQuantity: product.stockQuantity?.toString() || "0",
      weight: product.weight?.toString() || "",
      imageUrl: product.imageUrl || "",
      isActive: product.isActive ?? true,
      isVisible: product.isVisible ?? true,
    });
    setProductDialogOpen(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;

    try {
      await deleteProductMutation.mutateAsync({ id });
      toast.success("Produit supprimé");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  const handleManageVariants = (product: any) => {
    setSelectedProduct(product);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion des produits</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos produits, variantes et arrivages programmés
          </p>
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList>
            <TabsTrigger value="products">Produits en stock</TabsTrigger>
            <TabsTrigger value="incoming">Arrivages programmés</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <div className="flex items-center justify-between">
          <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingProduct(null); resetProductForm(); }}>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau produit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Modifier le produit" : "Nouveau produit"}
                </DialogTitle>
                <DialogDescription>
                  Remplissez les informations du produit
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Nom *</Label>
                    <Input
                      id="name"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Catégorie *</Label>
                  <select
                    id="category"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value as any })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    <option value="SPAS">Spas</option>
                    <option value="SWIM_SPAS">Spas de nage</option>
                    <option value="MAINTENANCE">Produits d'entretien</option>
                    <option value="COVERS">Couvertures</option>
                    <option value="ACCESSORIES">Accessoires</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="priceHT">Prix HT *</Label>
                    <Input
                      id="priceHT"
                      type="number"
                      step="0.01"
                      value={productForm.priceHT}
                      onChange={(e) => setProductForm({ ...productForm, priceHT: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="vatRate">TVA (%)</Label>
                    <Input
                      id="vatRate"
                      type="number"
                      step="0.01"
                      value={productForm.vatRate}
                      onChange={(e) => setProductForm({ ...productForm, vatRate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stockQuantity">Stock</Label>
                    <Input
                      id="stockQuantity"
                      type="number"
                      value={productForm.stockQuantity}
                      onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="weight">Poids (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    value={productForm.weight}
                    onChange={(e) => setProductForm({ ...productForm, weight: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Image du produit</Label>
                  <ImageUpload
                    currentImageUrl={productForm.imageUrl}
                    onImageUploaded={(url) => setProductForm({ ...productForm, imageUrl: url })}
                    productId={editingProduct?.id}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingProduct ? "Modifier" : "Créer"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {selectedProduct ? (
          <ProductVariantsManager
            product={selectedProduct}
            onBack={() => setSelectedProduct(null)}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Liste des produits</CardTitle>
              <CardDescription>
                {products?.length || 0} produit(s) au total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : products && products.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Prix HT</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeProducts.map((product: any) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{typeof product.pricePublicHT === 'number' ? product.pricePublicHT.toFixed(2) : '0.00'} €</TableCell>
                        <TableCell>
                          <Badge variant={product.stockQuantity > 0 ? "default" : "secondary"}>
                            {product.stockQuantity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {product.isActive ? (
                            <Badge variant="default">Actif</Badge>
                          ) : (
                            <Badge variant="secondary">Inactif</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleManageVariants(product)}
                          >
                            <Palette className="h-4 w-4 mr-1" />
                            Variantes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun produit. Créez-en un pour commencer.
                </div>
              )}
            </CardContent>
          </Card>
        )}
          </TabsContent>

          <TabsContent value="incoming" className="space-y-6">
            <GlobalIncomingStockView />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function ProductVariantsManager({ product, onBack }: { product: any; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          ← Retour
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{product.name}</h2>
          <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
        </div>
      </div>

      <Tabs defaultValue="variants" className="w-full">
        <TabsList>
          <TabsTrigger value="variants">Variantes</TabsTrigger>
          <TabsTrigger value="incoming">Arrivages programmés</TabsTrigger>
        </TabsList>

        <TabsContent value="variants">
          <VariantsTab productId={product.id} />
        </TabsContent>

        <TabsContent value="incoming">
          <IncomingStockTab productId={product.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VariantsTab({ productId }: { productId: number }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    sku: "",
    name: "",
    color: "",
    size: "",
    voltage: "",
    material: "",
    stockQuantity: "0",
    imageUrl: "",
  });

  const { data: variants, refetch } = trpc.admin.products.getVariants.useQuery({ productId });
  const safeVariants = Array.isArray(variants) ? variants : [];
  const createMutation = trpc.admin.products.createVariant.useMutation();
  const deleteMutation = trpc.admin.products.deleteVariant.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const options = [];
      if (form.color) options.push({ optionName: "Couleur", optionValue: form.color });
      if (form.size) options.push({ optionName: "Taille", optionValue: form.size });
      if (form.voltage) options.push({ optionName: "Voltage", optionValue: form.voltage });
      if (form.material) options.push({ optionName: "Matériau", optionValue: form.material });

      await createMutation.mutateAsync({
        productId,
        sku: form.sku,
        name: form.name,
        stockQuantity: parseInt(form.stockQuantity),
        options,
      });

      toast.success("Variante créée");
      setDialogOpen(false);
      setForm({
        sku: "",
        name: "",
        color: "",
        size: "",
        voltage: "",
        material: "",
        stockQuantity: "0",
        imageUrl: "",
      });
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette variante ?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Variante supprimée");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Variantes du produit</CardTitle>
            <CardDescription>Gérez les différentes variantes (couleurs, tailles, etc.)</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle variante
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle variante</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="variant-sku">SKU *</Label>
                  <Input
                    id="variant-sku"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="variant-name">Nom *</Label>
                  <Input
                    id="variant-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="color">Couleur</Label>
                    <Input
                      id="color"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="size">Taille</Label>
                    <Input
                      id="size"
                      value={form.size}
                      onChange={(e) => setForm({ ...form, size: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="voltage">Voltage</Label>
                    <Input
                      id="voltage"
                      value={form.voltage}
                      onChange={(e) => setForm({ ...form, voltage: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="material">Matériau</Label>
                    <Input
                      id="material"
                      value={form.material}
                      onChange={(e) => setForm({ ...form, material: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="variant-stock">Stock</Label>
                  <Input
                    id="variant-stock"
                    type="number"
                    value={form.stockQuantity}
                    onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Image de la variante</Label>
                  <ImageUpload
                    currentImageUrl={form.imageUrl}
                    onImageUploaded={(url) => setForm({ ...form, imageUrl: url })}
                    productId={productId}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Créer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {variants && variants.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Options</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeVariants.map((variant: any) => (
                <TableRow key={variant.id}>
                  <TableCell className="font-mono text-sm">{variant.sku}</TableCell>
                  <TableCell>{variant.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {variant.color && <Badge variant="outline">Couleur: {variant.color}</Badge>}
                      {variant.size && <Badge variant="outline">Taille: {variant.size}</Badge>}
                      {variant.voltage && <Badge variant="outline">Voltage: {variant.voltage}</Badge>}
                      {variant.material && <Badge variant="outline">Matériau: {variant.material}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={variant.stockQuantity > 0 ? "default" : "secondary"}>
                      {variant.stockQuantity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(variant.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Aucune variante. Créez-en une pour commencer.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function IncomingStockTab({ productId }: { productId: number }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    variantId: "",
    quantity: "",
    expectedWeek: "",
    expectedYear: new Date().getFullYear().toString(),
    notes: "",
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Arrivages programmés</CardTitle>
            <CardDescription>
              Gérez les arrivages de spas en production avec leur semaine d'arrivée prévue
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <TruckIcon className="mr-2 h-4 w-4" />
                Nouvel arrivage
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Programmer un arrivage</DialogTitle>
                <DialogDescription>
                  Les produits seront automatiquement ajoutés au stock à la semaine indiquée
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantité *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="expectedWeek">Semaine *</Label>
                    <Input
                      id="expectedWeek"
                      type="number"
                      min="1"
                      max="53"
                      placeholder="1-53"
                      value={form.expectedWeek}
                      onChange={(e) => setForm({ ...form, expectedWeek: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="expectedYear">Année</Label>
                  <Input
                    id="expectedYear"
                    type="number"
                    value={form.expectedYear}
                    onChange={(e) => setForm({ ...form, expectedYear: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Programmer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          Fonctionnalité en cours de développement
        </div>
      </CardContent>
    </Card>
  );
}


function GlobalIncomingStockView() {
  const [weekFilter, setWeekFilter] = useState("");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form, setForm] = useState({
    productId: "",
    quantity: "",
    expectedWeek: "",
    expectedYear: new Date().getFullYear().toString(),
    notes: "",
  });
  const [editForm, setEditForm] = useState({
    quantity: "",
    expectedWeek: "",
    expectedYear: "",
    status: "",
    notes: "",
  });

  const { data: products } = trpc.admin.products.list.useQuery({});
  const { data: incomingStock, refetch } = trpc.admin.incomingStock.list.useQuery({});
  const safeProducts2 = Array.isArray(products) ? products : [];
  const safeIncomingStock = Array.isArray(incomingStock) ? incomingStock : [];
  const createMutation = trpc.admin.incomingStock.create.useMutation();
  const updateMutation = trpc.admin.incomingStock.update.useMutation();
  const deleteMutation = trpc.admin.incomingStock.delete.useMutation();
  const processArrivedMutation = trpc.admin.incomingStock.processArrived.useMutation();

  const handleProcessArrived = async () => {
    try {
      await processArrivedMutation.mutateAsync();
      toast.success("Arrivages traités avec succès");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du traitement");
    }
  };

  const filteredStock = safeIncomingStock.filter((item: any) => {
    const matchesWeek = !weekFilter || item.expectedWeek.toString() === weekFilter;
    const matchesYear = !yearFilter || item.expectedYear.toString() === yearFilter;
    return matchesWeek && matchesYear;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        productId: parseInt(form.productId),
        quantity: parseInt(form.quantity),
        expectedWeek: parseInt(form.expectedWeek),
        expectedYear: parseInt(form.expectedYear),
        notes: form.notes || undefined,
      });
      toast.success("Arrivage programmé avec succès");
      setDialogOpen(false);
      setForm({
        productId: "",
        quantity: "",
        expectedWeek: "",
        expectedYear: new Date().getFullYear().toString(),
        notes: "",
      });
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur");
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setEditForm({
      quantity: item.quantity.toString(),
      expectedWeek: item.expectedWeek.toString(),
      expectedYear: item.expectedYear.toString(),
      status: item.status,
      notes: item.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      await updateMutation.mutateAsync({
        id: editingItem.id,
        quantity: parseInt(editForm.quantity),
        expectedWeek: parseInt(editForm.expectedWeek),
        expectedYear: parseInt(editForm.expectedYear),
        status: editForm.status as "PENDING" | "ARRIVED" | "CANCELLED",
        notes: editForm.notes || undefined,
      });
      toast.success("Arrivage modifié avec succès");
      setEditDialogOpen(false);
      setEditingItem(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cet arrivage ?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Arrivage supprimé");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Arrivages programmés</CardTitle>
            <CardDescription>
              Vue globale de tous les arrivages programmés avec filtres par semaine et année
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleProcessArrived}
              variant="outline"
              disabled={processArrivedMutation.isPending}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {processArrivedMutation.isPending ? "Traitement..." : "Traiter les arrivages"}
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <TruckIcon className="mr-2 h-4 w-4" />
                  Nouvel arrivage
                </Button>
              </DialogTrigger>
              <DialogContent>
              <DialogHeader>
                <DialogTitle>Programmer un arrivage</DialogTitle>
                <DialogDescription>
                  Ajoutez un arrivage programmé pour un produit
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="productId">Produit *</Label>
                  <select
                    id="productId"
                    value={form.productId}
                    onChange={(e) => setForm({ ...form, productId: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Sélectionnez un produit</option>
                    {safeProducts2.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantité *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expectedWeek">Semaine *</Label>
                    <Input
                      id="expectedWeek"
                      type="number"
                      min="1"
                      max="53"
                      placeholder="1-53"
                      value={form.expectedWeek}
                      onChange={(e) => setForm({ ...form, expectedWeek: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="expectedYear">Année *</Label>
                    <Input
                      id="expectedYear"
                      type="number"
                      value={form.expectedYear}
                      onChange={(e) => setForm({ ...form, expectedYear: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Programmer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="weekFilter">Filtrer par semaine</Label>
              <Input
                id="weekFilter"
                type="number"
                min="1"
                max="53"
                placeholder="Toutes les semaines"
                value={weekFilter}
                onChange={(e) => setWeekFilter(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="yearFilter">Filtrer par année</Label>
              <Input
                id="yearFilter"
                type="number"
                placeholder="Toutes les années"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              />
            </div>
          </div>

          {filteredStock && filteredStock.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Semaine</TableHead>
                  <TableHead>Année</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStock.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product?.name || "N/A"}</TableCell>
                    <TableCell>{item.product?.sku || "N/A"}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>Semaine {item.expectedWeek}</TableCell>
                    <TableCell>{item.expectedYear}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "PENDING" ? "default" : item.status === "ARRIVED" ? "secondary" : "destructive"}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucun arrivage programmé
            </div>
          )}
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'arrivage</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label>Quantité</Label>
              <Input
                type="number"
                value={editForm.quantity}
                onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Semaine</Label>
              <Input
                type="number"
                min="1"
                max="53"
                value={editForm.expectedWeek}
                onChange={(e) => setEditForm({ ...editForm, expectedWeek: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Année</Label>
              <Input
                type="number"
                value={editForm.expectedYear}
                onChange={(e) => setEditForm({ ...editForm, expectedYear: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Statut</Label>
              <select
                className="w-full border rounded-md p-2"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                required
              >
                <option value="PENDING">PENDING</option>
                <option value="ARRIVED">ARRIVED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
            <div>
              <Label>Notes (optionnel)</Label>
              <Input
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
