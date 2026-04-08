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
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { TableSkeleton } from "@/components/TableSkeleton";
import { Plus, Edit, Trash2, Package, Palette, TruckIcon, Pencil, CheckCircle, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { OnboardingTour } from "@/components/OnboardingTour";
import { useOnboarding } from "@/hooks/useOnboarding";
import { adminProductsTour } from "@/config/onboarding-tours";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function AdminProducts() {
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
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
    imageUrl: "",
    supplierProductCode: "",
    ean13: "",
  });

  const { data: productsData, isLoading, refetch } = trpc.admin.products.list.useQuery({});
  const products = useSafeQuery(productsData);
  const createProductMutation = trpc.admin.products.create.useMutation();
  const updateProductMutation = trpc.admin.products.update.useMutation();
  const deleteProductMutation = trpc.admin.products.delete.useMutation();
  const reorderMutation = trpc.admin.products.reorder.useMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !products?.length) return;

    const oldIndex = products.findIndex((p: any) => p.id === active.id);
    const newIndex = products.findIndex((p: any) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(products, oldIndex, newIndex);
    const orderedIds = reordered.map((p: any) => p.id);

    try {
      await reorderMutation.mutateAsync({ orderedIds });
      refetch();
      toast.success("Ordre des produits mis à jour");
    } catch (error: any) {
      toast.error("Erreur lors de la réorganisation");
    }
  }, [products, reorderMutation, refetch]);

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Auto-generate SKU from name if not editing
      const autoSku = editingProduct?.sku || `SPA-${productForm.name.toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}`;
      const data = {
        sku: autoSku,
        name: productForm.name,
        description: productForm.description || undefined,
        priceHT: parseFloat(productForm.priceHT),
        vatRate: parseFloat(productForm.vatRate),
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

  const onboarding = useOnboarding("admin-products");

  return (
    <AdminLayout>
      <OnboardingTour
        steps={adminProductsTour}
        isActive={onboarding.isActive}
        currentStep={onboarding.currentStep}
        onNext={onboarding.nextStep}
        onPrev={onboarding.prevStep}
        onSkip={onboarding.skipTour}
        onComplete={onboarding.markCompleted}
      />
      <div className="space-y-6">
        <div data-tour="admin-products-header">
          <h1 className="text-2xl md:text-3xl font-bold">Gestion des produits</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos produits et variantes. Le stock et les quantités en transit sont mis à jour automatiquement via l'API fournisseur.
          </p>
        </div>

        <div className="w-full space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" data-tour="admin-products-actions">
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

                <div>
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                  />
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
                  {/* Vue Desktop - Tableau avec Drag & Drop */}
                  <div className="hidden md:block">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={products.map((p: any) => p.id)} strategy={verticalListSortingStrategy}>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-8"></TableHead>
                              <TableHead className="w-10"></TableHead>
                              <TableHead>Code Produit</TableHead>
                              <TableHead>Nom</TableHead>
                              <TableHead>EAN13</TableHead>
              <TableHead className="whitespace-nowrap">Prix HT</TableHead>
              <TableHead className="text-center whitespace-nowrap">Stock</TableHead>
              <TableHead className="text-center whitespace-nowrap">Transit</TableHead>
              <TableHead>Statut</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {products.map((product: any) => (
                              <SortableProductRow
                                key={product.id}
                                product={product}
                                expandedProductId={expandedProductId}
                                onToggleExpand={handleToggleExpand}
                                onEdit={handleEditProduct}
                                onDelete={handleDeleteProduct}
                              />
                            ))}
                          </TableBody>
                        </Table>
                      </SortableContext>
                    </DndContext>
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
                                <p className="text-xs text-muted-foreground font-mono">{product.supplierProductCode || product.sku}</p>
                                {product.ean13 && <p className="text-[10px] text-muted-foreground">EAN: {product.ean13}</p>}
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
                              <div className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  (product.totalStock || 0) > 0
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  S: {product.totalStock || 0}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  (product.totalTransit || 0) > 0
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  T: {product.totalTransit || 0}
                                </span>
                              </div>
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
        </div>
      </div>
      
      {/* Colors Management Dialog */}
      <ColorsManagementDialog 
        open={colorsDialogOpen} 
        onOpenChange={setColorsDialogOpen}
      />
    </AdminLayout>
  );
}

// Composant SortableProductRow pour le drag & drop
function SortableProductRow({ product, expandedProductId, onToggleExpand, onEdit, onDelete }: {
  product: any;
  expandedProductId: number | null;
  onToggleExpand: (id: number) => void;
  onEdit: (product: any) => void;
  onDelete: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <React.Fragment>
      <TableRow
        ref={setNodeRef}
        style={style}
        className={`cursor-pointer hover:bg-muted/50 transition-colors ${expandedProductId === product.id ? "bg-muted/30 border-b-0" : ""} ${isDragging ? "bg-muted/60 shadow-lg" : ""}`}
        onClick={() => onToggleExpand(product.id)}
      >
        <TableCell className="w-8 px-1" onClick={(e) => e.stopPropagation()}>
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted/80 touch-none"
            title="Glisser pour réorganiser"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </TableCell>
        <TableCell className="w-10 px-2">
          {expandedProductId === product.id ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell className="font-mono text-sm">{product.supplierProductCode || <span className="text-muted-foreground italic">Non défini</span>}</TableCell>
        <TableCell className="font-medium">{product.name}</TableCell>
        <TableCell className="font-mono text-xs">{product.ean13 || <span className="text-muted-foreground italic">—</span>}</TableCell>
        <TableCell className="whitespace-nowrap">{Number(product.pricePublicHT || 0).toFixed(2)} €</TableCell>
        <TableCell className="text-center">
          <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-semibold ${
            (product.totalStock || 0) > 0
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
              : 'bg-muted text-muted-foreground'
          }`}>
            {product.totalStock || 0}
          </span>
        </TableCell>
        <TableCell className="text-center">
          <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-semibold ${
            (product.totalTransit || 0) > 0
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
              : 'bg-muted text-muted-foreground'
          }`}>
            {product.totalTransit || 0}
          </span>
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
            onClick={() => onEdit(product)}
            title="Modifier le produit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(product.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
      {expandedProductId === product.id && (
        <TableRow className="bg-muted/10 hover:bg-muted/10">
          <TableCell colSpan={10} className="p-0">
            <ExpandedVariantsRow productId={product.id} />
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
}

const ADMIN_COLOR_MAP: Record<string, string> = {
  "sterling marble": "#E8E4E0",
  "odyssey": "#B0B0B0",
  "midnight opal": "#1a1a2e",
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

function ExpandedVariantsRow({ productId }: { productId: number }) {
  const { data: variantsData, refetch } = trpc.admin.products.getVariants.useQuery({ productId });
  const variants = useSafeQuery(variantsData);
  const updateMutation = trpc.admin.products.updateVariant.useMutation();
  const [uploadingVariantId, setUploadingVariantId] = useState<number | null>(null);
  const [editingCodeVariantId, setEditingCodeVariantId] = useState<number | null>(null);
  const [editCodeField, setEditCodeField] = useState<'supplierProductCode' | 'ean13' | null>(null);
  const [editCodeValue, setEditCodeValue] = useState("");

  const handleStartEditCode = (variant: any, field: 'supplierProductCode' | 'ean13') => {
    setEditingCodeVariantId(variant.id);
    setEditCodeField(field);
    setEditCodeValue(variant[field] || "");
  };

  const handleSaveCode = async (variantId: number) => {
    if (!editCodeField) return;
    try {
      await updateMutation.mutateAsync({
        id: variantId,
        [editCodeField]: editCodeValue || null,
      });
      toast.success(editCodeField === 'supplierProductCode' ? "Code produit mis à jour" : "EAN13 mis à jour");
      setEditingCodeVariantId(null);
      setEditCodeField(null);
      setEditCodeValue("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    }
  };

  const handleCancelEditCode = () => {
    setEditingCodeVariantId(null);
    setEditCodeField(null);
    setEditCodeValue("");
  };

  const handleImageUploaded = async (variantId: number, url: string) => {
    try {
      await updateMutation.mutateAsync({
        id: variantId,
        imageUrl: url,
      });
      toast.success("Image mise à jour");
      setUploadingVariantId(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour de l'image");
    }
  };

  const handleRemoveImage = async (variantId: number) => {
    try {
      await updateMutation.mutateAsync({
        id: variantId,
        imageUrl: null,
      });
      toast.success("Image supprimée");
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

  return (
    <div className="px-6 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Variantes</p>
      </div>
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground w-12">Actif</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground w-16">Image</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Couleur</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Code Produit</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">EAN13</th>
              <th className="text-center px-4 py-2 font-medium text-muted-foreground">Stock</th>
              <th className="text-center px-4 py-2 font-medium text-muted-foreground">Transit</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant: any) => (
              <tr key={variant.id} className={`border-t border-border/30 hover:bg-muted/20 ${variant.isActive === false ? 'opacity-50' : ''}`}>
                <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={variant.isActive !== false}
                    onCheckedChange={() => handleToggleActive(variant.id, variant.isActive !== false)}
                    className="data-[state=checked]:bg-emerald-500 dark:data-[state=checked]:bg-emerald-400"
                    title={variant.isActive !== false ? 'Désactiver cette couleur' : 'Activer cette couleur'}
                  />
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
                <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                  {editingCodeVariantId === variant.id && editCodeField === 'supplierProductCode' ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editCodeValue}
                        onChange={(e) => setEditCodeValue(e.target.value)}
                        className="w-36 h-7 text-xs font-mono"
                        autoFocus
                        placeholder="Ex: 662201 078 38"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); handleSaveCode(variant.id); }
                          if (e.key === 'Escape') handleCancelEditCode();
                        }}
                      />
                      <Button size="sm" variant="ghost" className="h-7 px-1.5" onClick={() => handleSaveCode(variant.id)}>
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-1.5" onClick={handleCancelEditCode}>
                        <span className="text-xs">&times;</span>
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-1 cursor-pointer group font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => handleStartEditCode(variant, 'supplierProductCode')}
                      title="Cliquer pour modifier le code produit"
                    >
                      <span>{variant.supplierProductCode || <span className="italic">Ajouter code</span>}</span>
                      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                  {editingCodeVariantId === variant.id && editCodeField === 'ean13' ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editCodeValue}
                        onChange={(e) => setEditCodeValue(e.target.value)}
                        className="w-36 h-7 text-xs font-mono"
                        autoFocus
                        placeholder="Ex: 3364549284619"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); handleSaveCode(variant.id); }
                          if (e.key === 'Escape') handleCancelEditCode();
                        }}
                      />
                      <Button size="sm" variant="ghost" className="h-7 px-1.5" onClick={() => handleSaveCode(variant.id)}>
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-1.5" onClick={handleCancelEditCode}>
                        <span className="text-xs">&times;</span>
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-1 cursor-pointer group font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => handleStartEditCode(variant, 'ean13')}
                      title="Cliquer pour modifier l'EAN13"
                    >
                      <span>{variant.ean13 || <span className="italic">Ajouter EAN</span>}</span>
                      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-semibold ${
                    (variant.stockQuantity || 0) > 0
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {variant.stockQuantity || 0}
                  </span>
                </td>
                <td className="px-4 py-2 text-center">
                  <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-semibold ${
                    (variant.inTransitQuantity || 0) > 0
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {variant.inTransitQuantity || 0}
                  </span>
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
          <p className="text-xs md:text-sm text-muted-foreground">Code: {product.supplierProductCode || product.sku}{product.ean13 ? ` — EAN: ${product.ean13}` : ''}</p>
        </div>
      </div>

      <VariantsTab productId={product.id} />
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

      // Auto-generate variant SKU from name
      const autoVariantSku = `VAR-${form.name.toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36).slice(-4)}`;
      await createMutation.mutateAsync({
        productId,
        sku: autoVariantSku,
        name: form.name,
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
        imageUrl: "",
        supplierProductCode: "",
        ean13: "",
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle>Variantes du produit</CardTitle>
            <CardDescription>
              Gérez les différentes variantes (couleurs, tailles, etc.)
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
                <TableHead>Code Produit</TableHead>
                <TableHead>EAN13</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Couleur</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant: any) => (
                <TableRow key={variant.id}>
                  <TableCell className="font-mono text-sm">{variant.supplierProductCode || variant.sku}</TableCell>
                  <TableCell className="font-mono text-xs">{variant.ean13 || '—'}</TableCell>
                  <TableCell className="font-medium">{variant.name}</TableCell>
                  <TableCell>
                    {variant.color ? (
                      <Badge variant="outline">{variant.color}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
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

// IncomingStockTab and GlobalIncomingStockView removed - stock/transit data comes from supplier API


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
