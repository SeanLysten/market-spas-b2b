import { useState } from "react";
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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, Calendar } from "lucide-react";

export default function AdminIncomingStock() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [formData, setFormData] = useState({
    productId: "",
    variantId: "",
    quantity: "",
    expectedWeek: "",
    expectedYear: new Date().getFullYear().toString(),
    notes: "",
  });

  const { data: incomingStock, isLoading, refetch } = trpc.admin.incomingStock.list.useQuery({});
  const { data: products } = trpc.admin.products.list.useQuery({ limit: 1000 });
  
  const createMutation = trpc.admin.incomingStock.create.useMutation({
    onSuccess: () => {
      toast.success("Arrivage programmé créé avec succès");
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateMutation = trpc.admin.incomingStock.update.useMutation({
    onSuccess: () => {
      toast.success("Arrivage mis à jour avec succès");
      setSelectedStock(null);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = trpc.admin.incomingStock.delete.useMutation({
    onSuccess: () => {
      toast.success("Arrivage supprimé avec succès");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      productId: "",
      variantId: "",
      quantity: "",
      expectedWeek: "",
      expectedYear: new Date().getFullYear().toString(),
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productId || !formData.quantity || !formData.expectedWeek) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const data = {
      productId: parseInt(formData.productId),
      variantId: formData.variantId ? parseInt(formData.variantId) : undefined,
      quantity: parseInt(formData.quantity),
      expectedWeek: parseInt(formData.expectedWeek),
      expectedYear: parseInt(formData.expectedYear),
      notes: formData.notes || undefined,
    };

    if (selectedStock) {
      updateMutation.mutate({ id: selectedStock.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (stock: any) => {
    setSelectedStock(stock);
    setFormData({
      productId: stock.productId?.toString() || "",
      variantId: stock.variantId?.toString() || "",
      quantity: stock.quantity.toString(),
      expectedWeek: stock.expectedWeek.toString(),
      expectedYear: stock.expectedYear.toString(),
      notes: stock.notes || "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet arrivage ?")) {
      deleteMutation.mutate({ id });
    }
  };

  const getProductName = (productId: number) => {
    const product = products?.find((p) => p.id === productId);
    return product?.name || `Produit #${productId}`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      PENDING: "secondary",
      ARRIVED: "default",
      CANCELLED: "outline",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getCurrentWeek = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Arrivages Programmés</h1>
            <p className="text-muted-foreground mt-1">
              Gérez les stocks en arrivage par semaine
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setSelectedStock(null);
              setIsCreateDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvel arrivage
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Liste des arrivages
            </CardTitle>
            <CardDescription>
              Semaine actuelle : Semaine {getCurrentWeek()} - {new Date().getFullYear()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Chargement...</p>
            ) : !incomingStock || incomingStock.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun arrivage programmé
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Semaine</TableHead>
                    <TableHead>Année</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomingStock.map((stock) => (
                    <TableRow key={stock.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          {getProductName(stock.productId || 0)}
                          {stock.variantId && (
                            <Badge variant="outline" className="text-xs">
                              Variante #{stock.variantId}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{stock.quantity}</TableCell>
                      <TableCell>Semaine {stock.expectedWeek}</TableCell>
                      <TableCell>{stock.expectedYear}</TableCell>
                      <TableCell>{getStatusBadge(stock.status || "PENDING")}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {stock.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(stock)}
                            disabled={stock.status === "ARRIVED"}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(stock.id)}
                            disabled={stock.status === "ARRIVED"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedStock ? "Modifier l'arrivage" : "Nouvel arrivage programmé"}
              </DialogTitle>
              <DialogDescription>
                Planifiez l'arrivée de produits pour une semaine spécifique
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productId">Produit *</Label>
                <Select
                  value={formData.productId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, productId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantité *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedWeek">Semaine *</Label>
                  <Input
                    id="expectedWeek"
                    type="number"
                    min="1"
                    max="53"
                    value={formData.expectedWeek}
                    onChange={(e) =>
                      setFormData({ ...formData, expectedWeek: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedYear">Année *</Label>
                <Input
                  id="expectedYear"
                  type="number"
                  min={new Date().getFullYear()}
                  value={formData.expectedYear}
                  onChange={(e) =>
                    setFormData({ ...formData, expectedYear: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Informations complémentaires..."
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setSelectedStock(null);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {selectedStock ? "Mettre à jour" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
