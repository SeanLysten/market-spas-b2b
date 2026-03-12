import { AdminLayout } from "@/components/AdminLayout";
import React from "react";
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
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { TableSkeleton } from "@/components/TableSkeleton";
import { Plus, Edit, Trash2, Package, Palette, TruckIcon, Pencil, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";

export default function AdminProducts() {
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [incomingDialogOpen, setIncomingDialogOpen] = useState(false);
  const [colorsDialogOpen, setColorsDialogOpen] = useState(false);
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
    supplierProductCode: "",
    ean13: "",
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
    supplierProductCode: "",
    ean13: "",
  });

  const [incomingForm, setIncomingForm] = useState({
    productId: "",
    variantId: "",
    quantity: "",
    expectedWeek: "",
    expectedYear: new Date().getFullYear().toString(),
    notes: "",
  });

  const { data: productsData, isLoading, refetch } = trpc.admin.products.list.useQuery({});
  const products = useSafeQuery(productsData);
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
        supplierProductCode: productForm.supplierProductCode || undefined,
        ean13: productForm.ean13 || undefined,
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
      supplierProductCode: "",
      ean13: "",
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
      supplierProductCode: product.supplierProductCode || "",
      ean13: product.ean13 || "",
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

  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);

  const handleManageVariants = (product: any) => {
    setSelectedProduct(product);
  };

  const handleToggleExpand = (productId: number) => {
    setExpandedProductId(expandedProductId === productId ? null : productId);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Gestion des produits</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos produits, variantes et arrivages programmés. Cliquez sur un produit pour voir et modifier le stock de chaque variante.
          </p>
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList>
            <TabsTrigger value="products">Produits en stock</TabsTrigger>
            <TabsTrigger value="incoming">Arrivages programmés</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex gap-2">
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
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

                {/* Supplier Integration */}
                <div className="col-span-2 border-t pt-4 mt-2">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">Intégration fournisseur</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="supplierProductCode">Code Produit Fournisseur</Label>
                      <Input
                        id="supplierProductCode"
                        value={productForm.supplierProductCode}
                        onChange={(e) => setProductForm({ ...productForm, supplierProductCode: e.target.value })}
                        placeholder="Ex: 662201 078 38"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ean13">Code EAN13</Label>
                      <Input
                        id="ean13"
                        value={productForm.ean13}
                        onChange={(e) => setProductForm({ ...productForm, ean13: e.target.value })}
                        placeholder="Ex: 3364549284619"
                      />
                    </div>
                  </div>
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
          
          <Button variant="outline" onClick={() => setColorsDialogOpen(true)}>
            <Palette className="mr-2 h-4 w-4" />
            Gérer les couleurs
          </Button>
        </div>
      </div>

          <Card>
            <CardHeader>
              <CardTitle>Liste des produits</CardTitle>
              <CardDescription>
                {products?.length || 0} produit(s) au total — Cliquez sur un produit pour voir/modifier le stock de chaque variante
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <TableSkeleton rows={10} columns={6} />
              ) : products && products.length > 0 ? (
                <>
                  {/* Vue Desktop - Tableau */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10"></TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead>Prix HT</TableHead>
                          <TableHead>Stock total</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product: any) => (
                          <React.Fragment key={product.id}>
                            <TableRow
                              className={`cursor-pointer hover:bg-muted/50 transition-colors ${expandedProductId === product.id ? "bg-muted/30 border-b-0" : ""}`}
                              onClick={() => handleToggleExpand(product.id)}
                            >
                              <TableCell className="w-10 px-2">
                                {expandedProductId === product.id ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell>{Number(product.pricePublicHT || 0).toFixed(2)} €</TableCell>
                              <TableCell>
                                <ProductStockCell productId={product.id} />
                              </TableCell>
                              <TableCell>
                                {product.isActive ? (
                                  <Badge variant="default">Actif</Badge>
                                ) : (
                                  <Badge variant="secondary">Inactif</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditProduct(product)}
                                  title="Modifier le produit"
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
                            {expandedProductId === product.id && (
                              <TableRow className="bg-muted/10 hover:bg-muted/10">
                                <TableCell colSpan={7} className="p-0">
                                  <ExpandedVariantsRow productId={product.id} />
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Vue Mobile - Cartes */}
                  <div className="md:hidden space-y-3">
                    {products.map((product: any) => (
                      <div key={product.id}>
                        <Card
                          className={`cursor-pointer transition-all ${expandedProductId === product.id ? "ring-2 ring-primary/30" : ""}`}
                          onClick={() => handleToggleExpand(product.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{product.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {product.isActive ? (
                                  <Badge variant="default" className="text-xs">Actif</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">Inactif</Badge>
                                )}
                                {expandedProductId === product.id ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t">
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-semibold">{Number(product.pricePublicHT || 0).toFixed(2)} €</span>
                                <span className="text-xs text-muted-foreground"><ProductStockCell productId={product.id} /></span>
                              </div>
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button size="sm" variant="outline" onClick={() => handleEditProduct(product)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(product.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        {expandedProductId === product.id && (
                          <div className="mt-1 ml-2 border-l-2 border-primary/20 pl-3">
                            <ExpandedVariantsRow productId={product.id} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun produit. Créez-en un pour commencer.
                </div>
              )}
            </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="incoming" className="space-y-6">
            <GlobalIncomingStockView />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Colors Management Dialog */}
      <ColorsManagementDialog 
        open={colorsDialogOpen} 
        onOpenChange={setColorsDialogOpen}
      />
    </AdminLayout>
  );
}

const ADMIN_COLOR_MAP: Record<string, string> = {
  "blanc": "#ffffff",
  "white": "#ffffff",
  "noir": "#1a1a1a",
  "black": "#1a1a1a",
  "gris": "#808080",
  "grey": "#808080",
  "gray": "#808080",
  "sterling silver": "#C0C0C0",
  "silver": "#C0C0C0",
  "beige": "#D4B896",
  "brun": "#6B3A2A",
  "brown": "#6B3A2A",
};

function ProductStockCell({ productId }: { productId: number }) {
  const { data: variantsData } = trpc.admin.products.getVariants.useQuery({ productId });
  const variants = useSafeQuery(variantsData);
  
  const totalStock = variants?.reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0) || 0;
  
  return (
    <Badge variant={totalStock > 0 ? "default" : "secondary"}>
      {totalStock}
    </Badge>
  );
}

function ExpandedVariantsRow({ productId }: { productId: number }) {
  const { data: variantsData, refetch } = trpc.admin.products.getVariants.useQuery({ productId });
  const variants = useSafeQuery(variantsData);
  const updateMutation = trpc.admin.products.updateVariant.useMutation();
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [editStockValue, setEditStockValue] = useState("");
  const [uploadingVariantId, setUploadingVariantId] = useState<number | null>(null);

  const handleStartEdit = (variant: any) => {
    setEditingVariantId(variant.id);
    setEditStockValue(variant.stockQuantity?.toString() || "0");
  };

  const handleSaveStock = async (variantId: number) => {
    try {
      await updateMutation.mutateAsync({
        id: variantId,
        stockQuantity: parseInt(editStockValue) || 0,
      });
      toast.success("Stock mis \u00e0 jour");
      setEditingVariantId(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise \u00e0 jour du stock");
    }
  };

  const handleCancelEdit = () => {
    setEditingVariantId(null);
    setEditStockValue("");
  };

  const handleImageUploaded = async (variantId: number, url: string) => {
    try {
      await updateMutation.mutateAsync({
        id: variantId,
        imageUrl: url,
      });
      toast.success("Image mise \u00e0 jour");
      setUploadingVariantId(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise \u00e0 jour de l'image");
    }
  };

  const handleRemoveImage = async (variantId: number) => {
    try {
      await updateMutation.mutateAsync({
        id: variantId,
        imageUrl: null,
      });
      toast.success("Image supprim\u00e9e");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression de l'image");
    }
  };

  const handleToggleActive = async (variantId: number, currentActive: boolean) => {
    try {
      await updateMutation.mutateAsync({
        id: variantId,
        isActive: !currentActive,
      });
      toast.success(!currentActive ? "Variante activée" : "Variante désactivée");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    }
  };

  if (!variants || variants.length === 0) {
    return (
      <div className="px-6 py-4 text-sm text-muted-foreground italic">
        Aucune variante pour ce produit.
      </div>
    );
  }

  const totalStock = variants.reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0);

  return (
    <div className="px-6 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Variantes &mdash; Stock total : {totalStock}</p>
      </div>
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground w-12">Actif</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground w-16">Image</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Couleur</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">SKU</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Stock</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant: any) => (
              <tr key={variant.id} className={`border-t border-border/30 hover:bg-muted/20 ${variant.isActive === false ? 'opacity-50' : ''}`}>
                <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleToggleActive(variant.id, variant.isActive !== false)}
                    className={`w-8 h-5 rounded-full relative transition-colors duration-200 ${variant.isActive !== false ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-gray-300'}`}
                    title={variant.isActive !== false ? 'Désactiver cette couleur' : 'Activer cette couleur'}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${variant.isActive !== false ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                  </button>
                </td>
                <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                  {uploadingVariantId === variant.id ? (
                    <div className="w-40">
                      <ImageUpload
                        currentImageUrl={variant.imageUrl}
                        onImageUploaded={(url) => handleImageUploaded(variant.id, url)}
                        productId={productId}
                        variantId={variant.id}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-1 h-6 text-xs w-full"
                        onClick={() => setUploadingVariantId(null)}
                      >
                        Fermer
                      </Button>
                    </div>
                  ) : variant.imageUrl ? (
                    <div className="relative group w-12 h-12">
                      <img
                        src={variant.imageUrl}
                        alt={variant.color || variant.name}
                        className="w-12 h-12 object-cover rounded border border-border/50 cursor-pointer"
                        onClick={() => setUploadingVariantId(variant.id)}
                      />
                      <button
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(variant.id)}
                        title="Supprimer l'image"
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <button
                      className="w-12 h-12 rounded border-2 border-dashed border-border/50 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                      onClick={() => setUploadingVariantId(variant.id)}
                      title="Ajouter une image"
                    >
                      <Package className="h-4 w-4" />
                    </button>
                  )}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full border border-border/50"
                      style={{
                        backgroundColor: ADMIN_COLOR_MAP[variant.color?.toLowerCase()] || "#e5e5e5",
                      }}
                    />
                    <span className="font-medium">{variant.color || variant.name}</span>
                    {variant.isActive === false && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 text-muted-foreground">Masqué</Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{variant.sku}</td>
                <td className="px-4 py-2">
                  {editingVariantId === variant.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={editStockValue}
                        onChange={(e) => setEditStockValue(e.target.value)}
                        className="w-20 h-7 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveStock(variant.id);
                          }
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                      />
                      <Button size="sm" variant="ghost" className="h-7 px-1.5 w-full sm:w-auto" onClick={() => handleSaveStock(variant.id)}>
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-1.5 w-full sm:w-auto" onClick={handleCancelEdit}>
                        <span className="text-xs">&times;</span>
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(variant);
                      }}
                    >
                      <Badge variant={variant.stockQuantity > 0 ? "default" : "secondary"} className="text-xs">
                        {variant.stockQuantity || 0}
                      </Badge>
                      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
          <h2 className="text-2xl text-display text-display font-bold">{product.name}</h2>
          <p className="text-xs md:text-sm text-muted-foreground">SKU: {product.sku}</p>
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
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [editStockValue, setEditStockValue] = useState("");
  const [form, setForm] = useState({
    sku: "",
    name: "",
    color: "",
    size: "",
    voltage: "",
    material: "",
    stockQuantity: "0",
    imageUrl: "",
    supplierProductCode: "",
    ean13: "",
  });

  const { data: variantsData, refetch } = trpc.admin.products.getVariants.useQuery({ productId });
  const variants = useSafeQuery(variantsData);
  const createMutation = trpc.admin.products.createVariant.useMutation();
  const updateMutation = trpc.admin.products.updateVariant.useMutation();
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
        supplierProductCode: form.supplierProductCode || undefined,
        ean13: form.ean13 || undefined,
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
        supplierProductCode: "",
        ean13: "",
      });
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur");
    }
  };

  const handleStartEditStock = (variant: any) => {
    setEditingVariantId(variant.id);
    setEditStockValue(variant.stockQuantity?.toString() || "0");
  };

  const handleSaveStock = async (variantId: number) => {
    try {
      await updateMutation.mutateAsync({
        id: variantId,
        stockQuantity: parseInt(editStockValue) || 0,
      });
      toast.success("Stock mis à jour");
      setEditingVariantId(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour du stock");
    }
  };

  const handleCancelEditStock = () => {
    setEditingVariantId(null);
    setEditStockValue("");
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

  // Compute total stock across all variants
  const totalStock = variants?.reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0) || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle>Variantes du produit</CardTitle>
            <CardDescription>
              Gérez les différentes variantes (couleurs, tailles, etc.) — Stock total : <strong>{totalStock}</strong>
            </CardDescription>
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
                  <Label htmlFor="variant-stock">Stock initial</Label>
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

                {/* Supplier Integration */}
                <div className="border-t pt-3 mt-2">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">Intégration fournisseur</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="variant-supplierCode">Code Produit Fournisseur</Label>
                      <Input
                        id="variant-supplierCode"
                        value={form.supplierProductCode}
                        onChange={(e) => setForm({ ...form, supplierProductCode: e.target.value })}
                        placeholder="Ex: 662201 078 38"
                      />
                    </div>
                    <div>
                      <Label htmlFor="variant-ean13">Code EAN13</Label>
                      <Input
                        id="variant-ean13"
                        value={form.ean13}
                        onChange={(e) => setForm({ ...form, ean13: e.target.value })}
                        placeholder="Ex: 3364549284619"
                      />
                    </div>
                  </div>
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
                <TableHead>Couleur</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant: any) => (
                <TableRow key={variant.id}>
                  <TableCell className="font-mono text-sm">{variant.sku}</TableCell>
                  <TableCell className="font-medium">{variant.name}</TableCell>
                  <TableCell>
                    {variant.color ? (
                      <Badge variant="outline">{variant.color}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingVariantId === variant.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={editStockValue}
                          onChange={(e) => setEditStockValue(e.target.value)}
                          className="w-20 h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSaveStock(variant.id);
                            }
                            if (e.key === "Escape") handleCancelEditStock();
                          }}
                        />
                        <Button size="sm" variant="ghost" className="h-8 px-2 w-full sm:w-auto" onClick={() => handleSaveStock(variant.id)}>
                          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 px-2 w-full sm:w-auto" onClick={handleCancelEditStock}>
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 cursor-pointer group" onClick={() => handleStartEditStock(variant)}>
                        <Badge variant={variant.stockQuantity > 0 ? "default" : "secondary"}>
                          {variant.stockQuantity || 0}
                        </Badge>
                        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
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

  const { data: variantsData } = trpc.admin.products.getVariants.useQuery({ productId });
  const variants = useSafeQuery(variantsData);
  const { data: incomingData, refetch } = trpc.admin.incomingStock.list.useQuery({ productId });
  const incomingList = useSafeQuery(incomingData);
  const createMutation = trpc.admin.incomingStock.create.useMutation();
  const deleteMutation = trpc.admin.incomingStock.delete.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        productId,
        variantId: form.variantId ? parseInt(form.variantId) : undefined,
        quantity: parseInt(form.quantity),
        expectedWeek: parseInt(form.expectedWeek),
        expectedYear: parseInt(form.expectedYear),
        notes: form.notes || undefined,
      });
      toast.success("Arrivage programmé");
      setDialogOpen(false);
      setForm({ variantId: "", quantity: "", expectedWeek: "", expectedYear: new Date().getFullYear().toString(), notes: "" });
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

  const statusLabels: Record<string, string> = {
    PENDING: "En attente",
    ARRIVED: "Arrivé",
    CANCELLED: "Annulé",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle>Arrivages programmés</CardTitle>
            <CardDescription>
              Gérez les arrivages par variante (couleur) avec leur semaine d'arrivée prévue
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
                  Sélectionnez la variante (couleur) et la quantité attendue
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {variants.length > 0 && (
                  <div>
                    <Label htmlFor="variantId">Variante (couleur)</Label>
                    <select
                      id="variantId"
                      value={form.variantId}
                      onChange={(e) => setForm({ ...form, variantId: e.target.value })}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Global (toutes variantes)</option>
                      {variants.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          {v.name} {v.color ? `(${v.color})` : ""} — Stock: {v.stockQuantity || 0}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
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
                    rows={2}
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
        {incomingList.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variante</TableHead>
                <TableHead>Quantité</TableHead>
                <TableHead>Semaine</TableHead>
                <TableHead>Année</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomingList.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.variant ? (
                      <Badge variant="outline">
                        {item.variant.color || item.variant.name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Global</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">{item.quantity}</TableCell>
                  <TableCell>S{item.expectedWeek}</TableCell>
                  <TableCell>{item.expectedYear}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === "PENDING" ? "default" : item.status === "ARRIVED" ? "secondary" : "destructive"}>
                      {statusLabels[item.status] || item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {item.notes || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
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
            Aucun arrivage programmé pour ce produit
          </div>
        )}
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
    variantId: "",
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
  const products2 = useSafeQuery(products);
  const incomingStockList = useSafeQuery(incomingStock);
  const createMutation = trpc.admin.incomingStock.create.useMutation();
  const updateMutation = trpc.admin.incomingStock.update.useMutation();
  const deleteMutation = trpc.admin.incomingStock.delete.useMutation();
  const processArrivedMutation = trpc.admin.incomingStock.processArrived.useMutation();

  // Fetch variants for the selected product in the create form
  const selectedProductId = form.productId ? parseInt(form.productId) : undefined;
  const { data: variantsForProduct } = trpc.admin.products.getVariants.useQuery(
    { productId: selectedProductId! },
    { enabled: !!selectedProductId }
  );
  const variantsList = useSafeQuery(variantsForProduct);

  const handleProcessArrived = async () => {
    try {
      await processArrivedMutation.mutateAsync();
      toast.success("Arrivages traités avec succès");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du traitement");
    }
  };

  const filteredStock = incomingStockList.filter((item: any) => {
    const matchesWeek = !weekFilter || item.expectedWeek.toString() === weekFilter;
    const matchesYear = !yearFilter || item.expectedYear.toString() === yearFilter;
    return matchesWeek && matchesYear;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        productId: parseInt(form.productId),
        variantId: form.variantId ? parseInt(form.variantId) : undefined,
        quantity: parseInt(form.quantity),
        expectedWeek: parseInt(form.expectedWeek),
        expectedYear: parseInt(form.expectedYear),
        notes: form.notes || undefined,
      });
      toast.success("Arrivage programmé avec succès");
      setDialogOpen(false);
      setForm({
        productId: "",
        variantId: "",
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

  const statusLabels: Record<string, string> = {
    PENDING: "En attente",
    ARRIVED: "Arrivé",
    CANCELLED: "Annulé",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                  Ajoutez un arrivage programmé pour un produit et sa variante (couleur)
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="productId">Produit *</Label>
                  <select
                    id="productId"
                    value={form.productId}
                    onChange={(e) => setForm({ ...form, productId: e.target.value, variantId: "" })}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Sélectionnez un produit</option>
                    {products2.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedProductId && variantsList.length > 0 && (
                  <div>
                    <Label htmlFor="variantId">Variante (couleur)</Label>
                    <select
                      id="variantId"
                      value={form.variantId}
                      onChange={(e) => setForm({ ...form, variantId: e.target.value })}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Toutes les variantes (global)</option>
                      {variantsList.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          {v.name} {v.color ? `(${v.color})` : ""} — Stock: {v.stockQuantity || 0}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sélectionnez une variante pour préciser la couleur de l'arrivage
                    </p>
                  </div>
                )}
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
                  <TableHead>Variante</TableHead>
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
                    <TableCell>
                      <div>
                        <span className="font-medium">{item.product?.name || "N/A"}</span>
                        <span className="text-xs text-muted-foreground ml-2">{item.product?.sku || ""}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.variant ? (
                        <Badge variant="outline">
                          {item.variant.color || item.variant.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Global</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{item.quantity}</span>
                    </TableCell>
                    <TableCell>S{item.expectedWeek}</TableCell>
                    <TableCell>{item.expectedYear}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "PENDING" ? "default" : item.status === "ARRIVED" ? "secondary" : "destructive"}>
                        {statusLabels[item.status] || item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
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
            {editingItem && (
              <DialogDescription>
                {editingItem.product?.name}{editingItem.variant ? ` — ${editingItem.variant.color || editingItem.variant.name}` : ""}
              </DialogDescription>
            )}
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
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div>
              <Label>Statut</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                required
              >
                <option value="PENDING">En attente</option>
                <option value="ARRIVED">Arrivé</option>
                <option value="CANCELLED">Annulé</option>
              </select>
            </div>
            <div>
              <Label>Notes (optionnel)</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={2}
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


// Colors Management Dialog Component
function ColorsManagementDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [colors, setColors] = useState<Array<{ name: string; hex: string }>>([
    { name: "Blanc", hex: "#FFFFFF" },
    { name: "Noir", hex: "#1A1A1A" },
    { name: "Gris", hex: "#808080" },
    { name: "Sterling Silver", hex: "#C0C0C0" },
    { name: "Beige", hex: "#D4B896" },
    { name: "Brun", hex: "#6B3A2A" },
  ]);
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newColor, setNewColor] = useState({ name: "", hex: "#000000" });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddColor = () => {
    if (newColor.name.trim() && newColor.hex) {
      setColors([...colors, { name: newColor.name.trim(), hex: newColor.hex }]);
      setNewColor({ name: "", hex: "#000000" });
      setIsAdding(false);
      toast.success("Couleur ajoutée");
    }
  };

  const handleUpdateColor = (index: number, updated: { name: string; hex: string }) => {
    const newColors = [...colors];
    newColors[index] = updated;
    setColors(newColors);
    setEditingIndex(null);
    toast.success("Couleur modifiée");
  };

  const handleDeleteColor = (index: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette couleur ?")) {
      setColors(colors.filter((_, i) => i !== index));
      toast.success("Couleur supprimée");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestion des couleurs</DialogTitle>
          <DialogDescription>
            Ajoutez, modifiez ou supprimez les couleurs disponibles pour les variantes de produits
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Existing Colors List */}
          <div className="space-y-2">
            {colors.map((color, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                {editingIndex === index ? (
                  <>
                    <input
                      type="color"
                      value={color.hex}
                      onChange={(e) => handleUpdateColor(index, { ...color, hex: e.target.value })}
                      className="w-12 h-12 rounded border cursor-pointer"
                    />
                    <Input
                      value={color.name}
                      onChange={(e) => handleUpdateColor(index, { ...color, name: e.target.value })}
                      className="flex-1"
                      placeholder="Nom de la couleur"
                    />
                    <Button size="sm" variant="ghost" onClick={() => setEditingIndex(null)}>
                      <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div
                      className="w-12 h-12 rounded border border-border/50 shadow-sm"
                      style={{ backgroundColor: color.hex }}
                      title={color.hex}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{color.name}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">{color.hex}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setEditingIndex(index)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteColor(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add New Color */}
          {isAdding ? (
            <div className="flex items-center gap-3 p-3 border-2 border-dashed rounded-lg">
              <input
                type="color"
                value={newColor.hex}
                onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                className="w-12 h-12 rounded border cursor-pointer"
              />
              <Input
                value={newColor.name}
                onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                className="flex-1"
                placeholder="Nom de la couleur"
                autoFocus
              />
              <Button size="sm" onClick={handleAddColor}>
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                ✕
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setIsAdding(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une couleur
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
