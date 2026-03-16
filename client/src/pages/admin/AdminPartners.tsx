import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Euro,
  Users,
  TrendingUp,
  Award,
  AlertTriangle,
  Loader2,
  UserX,
  Map,
  Target,
  UsersRound,
  MailX,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Eye } from "lucide-react";



const statusColors: Record<string, string> = {
  PENDING: "bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-400",
  APPROVED: "bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400",
  SUSPENDED: "bg-destructive/15 dark:bg-destructive/25 text-destructive dark:text-destructive",
  TERMINATED: "bg-muted dark:bg-muted/50 text-gray-800",
};

const statusLabels: Record<string, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvé",
  SUSPENDED: "Suspendu",
  TERMINATED: "Résilié",
};

export default function AdminPartners() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<number | null>(null);
  const [productDiscountPartnerId, setProductDiscountPartnerId] = useState<number | null>(null);
  const [productDiscountPartnerName, setProductDiscountPartnerName] = useState<string>("");

  const [formData, setFormData] = useState({
    companyName: "",
    tradeName: "",
    vatNumber: "",
    addressStreet: "",
    addressCity: "",
    addressPostalCode: "",
    addressCountry: "BE",
    primaryContactName: "",
    primaryContactEmail: "",
    primaryContactPhone: "",
    discountPercent: "0",
    status: "PENDING",
    internalNotes: "",
  });

  const { data: partners, isLoading, refetch } = trpc.admin.partners.list.useQuery({
    search: searchQuery || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,

  });

  const createPartnerMutation = trpc.admin.partners.create.useMutation({
    onSuccess: () => {
      toast.success("Partenaire créé avec succès");
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la création");
    },
  });

  const updatePartnerMutation = trpc.admin.partners.update.useMutation({
    onSuccess: () => {
      toast.success("Partenaire mis à jour avec succès");
      setIsEditDialogOpen(false);
      setSelectedPartner(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la mise à jour");
    },
  });

  const deletePartnerMutation = trpc.admin.partners.delete.useMutation({
    onSuccess: () => {
      toast.success("Partenaire supprimé avec succès");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la suppression");
    },
  });

  const approvePartnerMutation = trpc.admin.partners.approve.useMutation({
    onSuccess: () => {
      toast.success("Partenaire approuvé");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de l'approbation");
    },
  });

  const resetForm = () => {
    setFormData({
      companyName: "",
      tradeName: "",
      vatNumber: "",
      addressStreet: "",
      addressCity: "",
      addressPostalCode: "",
      addressCountry: "BE",
      primaryContactName: "",
      primaryContactEmail: "",
      primaryContactPhone: "",
      discountPercent: "0",
      status: "PENDING",
      internalNotes: "",
    });
  };

  const handleCreatePartner = () => {
    if (!formData.companyName || !formData.vatNumber || !formData.primaryContactEmail) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    createPartnerMutation.mutate({
      companyName: formData.companyName,
      tradeName: formData.tradeName || undefined,
      vatNumber: formData.vatNumber,
      addressStreet: formData.addressStreet,
      addressCity: formData.addressCity,
      addressPostalCode: formData.addressPostalCode,
      addressCountry: formData.addressCountry,
      primaryContactName: formData.primaryContactName,
      primaryContactEmail: formData.primaryContactEmail,
      primaryContactPhone: formData.primaryContactPhone,
      discountPercent: parseFloat(formData.discountPercent),
      status: formData.status as any,
      internalNotes: formData.internalNotes || undefined,
    });
  };

  const handleEditPartner = (partner: any) => {
    setSelectedPartner(partner);
    setFormData({
      companyName: partner.companyName || "",
      tradeName: partner.tradeName || "",
      vatNumber: partner.vatNumber || "",
      addressStreet: partner.addressStreet || "",
      addressCity: partner.addressCity || "",
      addressPostalCode: partner.addressPostalCode || "",
      addressCountry: partner.addressCountry || "BE",
      primaryContactName: partner.primaryContactName || "",
      primaryContactEmail: partner.primaryContactEmail || "",
      primaryContactPhone: partner.primaryContactPhone || "",
      discountPercent: partner.discountPercent?.toString() || "0",
      status: partner.status || "PENDING",
      internalNotes: partner.internalNotes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdatePartner = () => {
    if (!selectedPartner) return;

    updatePartnerMutation.mutate({
      id: selectedPartner.id,
      companyName: formData.companyName,
      tradeName: formData.tradeName || undefined,
      vatNumber: formData.vatNumber,
      addressStreet: formData.addressStreet,
      addressCity: formData.addressCity,
      addressPostalCode: formData.addressPostalCode,
      addressCountry: formData.addressCountry,
      primaryContactName: formData.primaryContactName,
      primaryContactEmail: formData.primaryContactEmail,
      primaryContactPhone: formData.primaryContactPhone,
      discountPercent: parseFloat(formData.discountPercent),
      status: formData.status as any,
      internalNotes: formData.internalNotes || undefined,
    });
  };

  const handleDeletePartner = (partnerId: number) => {
    setPartnerToDelete(partnerId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (partnerToDelete) {
      deletePartnerMutation.mutate({ id: partnerToDelete });
      setDeleteConfirmOpen(false);
      setPartnerToDelete(null);
    }
  };

  const handleApprovePartner = (partnerId: number) => {
    approvePartnerMutation.mutate({ id: partnerId });
  };

  const pendingCount = partners?.filter((p: any) => p.status === "PENDING").length || 0;
  const approvedCount = partners?.filter((p: any) => p.status === "APPROVED").length || 0;

  const PartnerForm = () => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Nom de l'entreprise *</Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            placeholder="Market Spas SPRL"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tradeName">Nom commercial</Label>
          <Input
            id="tradeName"
            value={formData.tradeName}
            onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
            placeholder="Market Spas"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vatNumber">Numéro de TVA *</Label>
        <Input
          id="vatNumber"
          value={formData.vatNumber}
          onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
          placeholder="BE0123456789"
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="addressStreet">Adresse</Label>
        <Input
          id="addressStreet"
          value={formData.addressStreet}
          onChange={(e) => setFormData({ ...formData, addressStreet: e.target.value })}
          placeholder="Rue de l'Industrie 123"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="addressPostalCode">Code postal</Label>
          <Input
            id="addressPostalCode"
            value={formData.addressPostalCode}
            onChange={(e) => setFormData({ ...formData, addressPostalCode: e.target.value })}
            placeholder="1000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="addressCity">Ville</Label>
          <Input
            id="addressCity"
            value={formData.addressCity}
            onChange={(e) => setFormData({ ...formData, addressCity: e.target.value })}
            placeholder="Bruxelles"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="addressCountry">Pays</Label>
          <Select
            value={formData.addressCountry}
            onValueChange={(value) => setFormData({ ...formData, addressCountry: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BE">Belgique</SelectItem>
              <SelectItem value="FR">France</SelectItem>
              <SelectItem value="LU">Luxembourg</SelectItem>
              <SelectItem value="NL">Pays-Bas</SelectItem>
              <SelectItem value="DE">Allemagne</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="primaryContactName">Nom du contact *</Label>
          <Input
            id="primaryContactName"
            value={formData.primaryContactName}
            onChange={(e) => setFormData({ ...formData, primaryContactName: e.target.value })}
            placeholder="Jean Dupont"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="primaryContactEmail">Email *</Label>
          <Input
            id="primaryContactEmail"
            type="email"
            value={formData.primaryContactEmail}
            onChange={(e) => setFormData({ ...formData, primaryContactEmail: e.target.value })}
            placeholder="contact@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="primaryContactPhone">Téléphone *</Label>
          <Input
            id="primaryContactPhone"
            value={formData.primaryContactPhone}
            onChange={(e) => setFormData({ ...formData, primaryContactPhone: e.target.value })}
            placeholder="+32 2 123 45 67"
          />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="discountPercent">Remise globale par défaut (%)</Label>
          <Input
            id="discountPercent"
            type="number"
            min="0"
            max="50"
            step="0.5"
            value={formData.discountPercent}
            onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Appliquée sur tous les produits sauf ceux avec une remise spécifique
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="APPROVED">Approuvé</SelectItem>
              <SelectItem value="SUSPENDED">Suspendu</SelectItem>
              <SelectItem value="TERMINATED">Résilié</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="internalNotes">Notes internes</Label>
        <Textarea
          id="internalNotes"
          value={formData.internalNotes}
          onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
          placeholder="Notes visibles uniquement par les administrateurs..."
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Gestion des partenaires</h1>
            <p className="text-muted-foreground">
              Gérez vos partenaires revendeurs et leurs conditions commerciales
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nouveau partenaire
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un nouveau partenaire</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouveau partenaire revendeur à votre réseau
                </DialogDescription>
              </DialogHeader>
              <PartnerForm />
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreatePartner} disabled={createPartnerMutation.isPending}>
                  {createPartnerMutation.isPending ? "Création..." : "Créer le partenaire"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total partenaires</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-display text-display font-bold">{partners?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <XCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-display text-display font-bold text-yellow-600">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approuvés</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-display text-display font-bold text-emerald-600 dark:text-emerald-400">{approvedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avec remise</CardTitle>
              <Award className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-display text-display font-bold text-purple-600 dark:text-purple-400">
                {partners?.filter((p: any) => parseFloat(p.discountPercent || 0) > 0).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email ou TVA..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="APPROVED">Approuvé</SelectItem>
                  <SelectItem value="SUSPENDED">Suspendu</SelectItem>
                  <SelectItem value="TERMINATED">Résilié</SelectItem>
                </SelectContent>
              </Select>

            </div>
          </CardContent>
        </Card>

        {/* Partners Table */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : partners && partners.length > 0 ? (
              <>
              <div className="md:hidden space-y-3">
                {partners.map((partner: any) => (
                  <Card key={partner.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{partner.companyName}</p>
                        <p className="text-xs text-muted-foreground">{partner.contactName} • {partner.email}</p>
                      </div>
                      <Badge variant={partner.isActive ? 'default' : 'secondary'} className="text-[10px] flex-shrink-0">
                        {partner.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant="outline" className="text-[10px]">{partner.discountPercent || 0}% remise</Badge>
                      <Badge variant="outline" className="text-[10px]">{partner.orderCount || 0} cmd</Badge>
                    </div>
                    <div className="flex gap-1 mt-3">
                      <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => navigate(`/admin/partners/${partner.id}`)}>
                        <Eye className="w-3 h-3 mr-1" />Fiche
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleEditPartner(partner)}>Modifier</Button>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Remise globale</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Commandes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner: any) => (
                    <TableRow key={partner.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{partner.companyName}</p>
                          <p className="text-xs md:text-sm text-muted-foreground">{partner.vatNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{partner.primaryContactName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {partner.primaryContactEmail}
                          </p>
                          <a href="/admin/users" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                            Voir le compte utilisateur
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{partner.discountPercent || 0}%</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[partner.status] || "bg-muted dark:bg-muted/50"}>
                          {statusLabels[partner.status] || partner.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{partner.totalOrders || 0} commandes</p>
                          <p className="text-muted-foreground">
                            {parseFloat(partner.totalRevenue || 0).toFixed(2)} €
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/admin/partners/${partner.id}`)}
                            title="Voir la fiche"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {partner.status === "PENDING" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-600 dark:text-emerald-400 w-full sm:w-auto"
                              onClick={() => handleApprovePartner(partner.id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPartner(partner)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive dark:text-destructive w-full sm:w-auto"
                            onClick={() => handleDeletePartner(partner.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Aucun partenaire</h3>
                <p className="text-muted-foreground">
                  Commencez par créer votre premier partenaire revendeur
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier le partenaire</DialogTitle>
              <DialogDescription>
                Modifiez les informations du partenaire
              </DialogDescription>
            </DialogHeader>
            <PartnerForm />
            {selectedPartner && (
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Réductions par produit</p>
                    <p className="text-xs text-muted-foreground">Gérer les remises spécifiques pour chaque produit</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setProductDiscountPartnerId(selectedPartner.id);
                      setProductDiscountPartnerName(selectedPartner.companyName);
                      setIsEditDialogOpen(false);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Gérer
                  </Button>
                </div>
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdatePartner} disabled={updatePartnerMutation.isPending}>
                {updatePartnerMutation.isPending ? "Mise à jour..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Product Discounts Dialog */}
        <ProductDiscountsDialog
          partnerId={productDiscountPartnerId}
          partnerName={productDiscountPartnerName}
          open={!!productDiscountPartnerId}
          onOpenChange={(open) => {
            if (!open) setProductDiscountPartnerId(null);
          }}
        />

        {/* Delete Confirmation Dialog with Impact Preview */}
        <DeleteConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={(open) => {
            setDeleteConfirmOpen(open);
            if (!open) setPartnerToDelete(null);
          }}
          partnerId={partnerToDelete}
          onConfirm={confirmDelete}
          isDeleting={deletePartnerMutation.isPending}
        />
      </div>
    </AdminLayout>
  );
}

// ============================================
// DELETE CONFIRMATION DIALOG WITH IMPACT PREVIEW
// ============================================

function DeleteConfirmDialog({
  open,
  onOpenChange,
  partnerId,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: number | null;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  const { data: impact, isLoading } = trpc.admin.partners.deleteImpact.useQuery(
    { id: partnerId! },
    { enabled: open && !!partnerId }
  );

  const totalImpact = impact
    ? impact.usersCount + impact.territoriesCount + impact.leadsCount + impact.teamMembersCount + impact.pendingInvitationsCount
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Supprimer le partenaire
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Veuillez vérifier les éléments impactés ci-dessous.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Analyse de l'impact...</span>
          </div>
        ) : impact ? (
          <div className="space-y-4 py-2">
            {/* Partner name */}
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="font-semibold text-lg">{impact.partnerName}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {totalImpact === 0
                  ? "Aucun élément ne sera impacté par cette suppression."
                  : `${totalImpact} élément(s) seront impacté(s) par cette suppression.`}
              </p>
            </div>

            {/* Impact grid */}
            <div className="grid grid-cols-2 gap-3">
              <ImpactCard
                icon={<UserX className="w-4 h-4" />}
                label="Utilisateurs désactivés"
                count={impact.activeUsersCount}
                total={impact.usersCount}
                color="text-red-600 dark:text-red-400"
                bgColor="bg-red-50 dark:bg-red-950/30"
              />
              <ImpactCard
                icon={<Map className="w-4 h-4" />}
                label="Territoires réassignés"
                count={impact.territoriesCount}
                color="text-blue-600 dark:text-blue-400"
                bgColor="bg-blue-50 dark:bg-blue-950/30"
              />
              <ImpactCard
                icon={<Target className="w-4 h-4" />}
                label="Leads réassignés"
                count={impact.leadsCount}
                color="text-amber-600 dark:text-amber-400"
                bgColor="bg-amber-50 dark:bg-amber-950/30"
              />
              <ImpactCard
                icon={<UsersRound className="w-4 h-4" />}
                label="Membres d'équipe"
                count={impact.teamMembersCount}
                color="text-purple-600 dark:text-purple-400"
                bgColor="bg-purple-50 dark:bg-purple-950/30"
              />
            </div>

            {/* Users detail list */}
            {impact.users.length > 0 && (
              <div className="border rounded-lg p-3">
                <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Comptes utilisateurs impactés
                </p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {impact.users.map((u: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="truncate">{u.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">{u.email}</span>
                        {u.isActive ? (
                          <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 text-[10px]">Actif</Badge>
                        ) : (
                          <Badge className="bg-muted text-gray-600 text-[10px]">Inactif</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {impact.pendingInvitationsCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                <MailX className="w-4 h-4 flex-shrink-0" />
                <span>{impact.pendingInvitationsCount} invitation(s) en attente seront annulée(s)</span>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading || isDeleting}
            className="w-full sm:w-auto gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Supprimer définitivement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImpactCard({
  icon,
  label,
  count,
  total,
  color,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  total?: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={`rounded-lg p-3 ${bgColor}`}>
      <div className={`flex items-center gap-1.5 ${color}`}>
        {icon}
        <span className="text-2xl font-bold">{count}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {label}
        {total !== undefined && total !== count && ` (${total} total)`}
      </p>
    </div>
  );
}

// ============================================
// PRODUCT DISCOUNTS DIALOG
// ============================================

function ProductDiscountsDialog({
  partnerId,
  partnerName,
  open,
  onOpenChange,
}: {
  partnerId: number | null;
  partnerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [searchProduct, setSearchProduct] = useState("");
  const [editingDiscounts, setEditingDiscounts] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all products
  const { data: productsData } = trpc.products.list.useQuery(
    { search: searchProduct || undefined },
    { enabled: open }
  );

  // Fetch existing discounts for this partner
  const { data: existingDiscounts, refetch: refetchDiscounts } = trpc.admin.partners.getProductDiscounts.useQuery(
    { partnerId: partnerId! },
    { enabled: open && !!partnerId }
  );

  const bulkUpsertMutation = trpc.admin.partners.bulkUpsertProductDiscounts.useMutation({
    onSuccess: () => {
      toast.success("Réductions enregistrées avec succès");
      refetchDiscounts();
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la sauvegarde");
      setIsSaving(false);
    },
  });

  // Initialize editing state from existing discounts
  useEffect(() => {
    if (existingDiscounts) {
      const map: Record<number, string> = {};
      for (const d of existingDiscounts) {
        map[d.productId] = d.discountPercent.toString();
      }
      setEditingDiscounts(map);
    }
  }, [existingDiscounts]);

  const handleSave = () => {
    if (!partnerId) return;
    setIsSaving(true);
    const discounts = Object.entries(editingDiscounts)
      .map(([productId, percent]) => ({
        productId: parseInt(productId),
        discountPercent: parseFloat(percent) || 0,
      }));
    bulkUpsertMutation.mutate({ partnerId, discounts });
  };

  const products = (productsData as any)?.products || productsData || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] sm:w-full max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Réductions par produit — {partnerName}</DialogTitle>
          <DialogDescription>
            Définissez une remise spécifique pour chaque produit. Les produits sans remise spécifique utiliseront la remise globale du partenaire.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchProduct}
            onChange={(e) => setSearchProduct(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead className="w-[100px]">Prix HT</TableHead>
                <TableHead className="w-[140px]">Remise (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(products) && products.map((product: any) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {parseFloat(product.pricePartnerHT || 0).toFixed(2)} €
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="0"
                      value={editingDiscounts[product.id] || ""}
                      onChange={(e) => {
                        setEditingDiscounts(prev => ({
                          ...prev,
                          [product.id]: e.target.value,
                        }));
                      }}
                      className="h-8 w-24"
                    />
                  </TableCell>
                </TableRow>
              ))}
              {(!products || products.length === 0) && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    Aucun produit trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer les réductions"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
