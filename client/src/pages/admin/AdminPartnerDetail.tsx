import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Euro,
  Users,
  Award,
  Globe,
  FileText,
  Package,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Edit,
  CreditCard,
  Truck,
  Receipt,
  ShieldCheck,
  UserPlus,
  UserMinus,
  Shield,
  StickyNote,
  MoreHorizontal,
  Eye,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// INLINE EDITABLE FIELD
// ============================================
function SupplierCodeField({ partnerId, currentCode }: { partnerId: number; currentCode?: string | null }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentCode || "");
  const utils = trpc.useUtils();

  const updateMutation = trpc.admin.partners.update.useMutation({
    onSuccess: () => {
      toast.success("Code client fournisseur mis à jour");
      setIsEditing(false);
      utils.admin.partners.invalidate();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur lors de la mise à jour");
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      id: partnerId,
      supplierClientCode: value.trim() || null,
    });
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold text-blue-700 dark:text-blue-400">{currentCode || "Non défini"}</span>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setValue(currentCode || ""); setIsEditing(true); }}>
          <Edit className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ex: 5611"
        className="h-7 w-24 text-xs font-mono"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") setIsEditing(false);
        }}
      />
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-green-600" onClick={handleSave} disabled={updateMutation.isPending}>
        <CheckCircle className="w-3.5 h-3.5" />
      </Button>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => setIsEditing(false)}>
        <XCircle className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

// ============================================
// CONSTANTS
// ============================================
const statusLabels: Record<string, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvé",
  SUSPENDED: "Suspendu",
  TERMINATED: "Résilié",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  TERMINATED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const levelColors: Record<string, string> = {
  BRONZE: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  SILVER: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
  GOLD: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  PLATINUM: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  VIP: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

const orderStatusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  PENDING_DEPOSIT: "En attente d'acompte",
  PAYMENT_PENDING: "Paiement en cours",
  DEPOSIT_PAID: "Acompte payé",
  PAYMENT_FAILED: "Paiement échoué",
  IN_PRODUCTION: "En production",
  SHIPPED: "Expédié",
  DELIVERED: "Livré",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
  REFUNDED: "Remboursé",
  REFUSED: "Refusé",
};

const teamRoleLabels: Record<string, string> = {
  OWNER: "Propriétaire",
  FULL_MANAGER: "Gestionnaire complet",
  ORDER_MANAGER: "Gestionnaire commandes",
  SALES_REP: "Commercial",
  ACCOUNTANT: "Comptable",
};

const teamRoleColors: Record<string, string> = {
  OWNER: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  FULL_MANAGER: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  ORDER_MANAGER: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  SALES_REP: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  ACCOUNTANT: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function AdminPartnerDetail() {
  const [, params] = useRoute("/admin/partners/:id");
  const [, navigate] = useLocation();
  const partnerId = params?.id ? parseInt(params.id) : 0;
  const [activeTab, setActiveTab] = useState("overview");

  // Invite member dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("SALES_REP");

  // Edit role dialog
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [editMemberId, setEditMemberId] = useState<number | null>(null);
  const [editRole, setEditRole] = useState<string>("");

  // Remove member dialog
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeMemberId, setRemoveMemberId] = useState<number | null>(null);
  const [removeMemberName, setRemoveMemberName] = useState("");

  const utils = trpc.useUtils();

  // ============================================
  // QUERIES
  // ============================================
  const { data: partner, isLoading } = trpc.partners.getById.useQuery(
    { id: partnerId },
    { enabled: partnerId > 0 }
  );

  const { data: orders } = trpc.orders.list.useQuery(
    { partnerId: partnerId, limit: 20 },
    { enabled: partnerId > 0 }
  );

  const { data: productDiscounts } = trpc.admin.partners.getProductDiscounts.useQuery(
    { partnerId: partnerId },
    { enabled: partnerId > 0 }
  );

  const { data: teamMembersList, isLoading: membersLoading } = trpc.team.list.useQuery(
    { partnerId: partnerId },
    { enabled: partnerId > 0 }
  );

  const { data: teamInvitationsList } = trpc.team.listInvitations.useQuery(
    { partnerId: partnerId },
    { enabled: partnerId > 0 }
  );

  // ============================================
  // MUTATIONS
  // ============================================
  const approveMutation = trpc.admin.partners.approve.useMutation({
    onSuccess: () => {
      toast.success("Partenaire approuvé");
      utils.partners.getById.invalidate({ id: partnerId });
    },
  });

  const inviteMutation = trpc.team.invite.useMutation({
    onSuccess: () => {
      toast.success("Invitation envoyée avec succès");
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("SALES_REP");
      utils.team.listInvitations.invalidate({ partnerId });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur lors de l'envoi de l'invitation");
    },
  });

  const updateRoleMutation = trpc.team.updatePermissions.useMutation({
    onSuccess: () => {
      toast.success("Rôle mis à jour");
      setEditRoleOpen(false);
      utils.team.list.invalidate({ partnerId });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur lors de la mise à jour du rôle");
    },
  });

  const removeMemberMutation = trpc.team.remove.useMutation({
    onSuccess: () => {
      toast.success("Membre retiré du partenaire");
      setRemoveOpen(false);
      utils.team.list.invalidate({ partnerId });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur lors du retrait du membre");
    },
  });

  const cancelInvitationMutation = trpc.team.cancelInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation annulée");
      utils.team.listInvitations.invalidate({ partnerId });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erreur lors de l'annulation");
    },
  });

  // ============================================
  // HELPERS
  // ============================================
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (date: string | Date | null | undefined) => {
    if (!date) return "Jamais";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: string | number | null | undefined) => {
    if (!amount) return "0,00 €";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return num.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  };

  // ============================================
  // LOADING / NOT FOUND
  // ============================================
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!partner) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Partenaire introuvable</h2>
          <p className="text-muted-foreground mb-4">Le partenaire #{partnerId} n'existe pas ou a été supprimé.</p>
          <Button variant="outline" onClick={() => navigate("/admin/partners")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la liste
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const members = teamMembersList || [];
  const invitations = (teamInvitationsList || []).filter((i: any) => i.status === "PENDING");

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ============================================ */}
        {/* HEADER */}
        {/* ============================================ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/partners")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{partner.companyName}</h1>
                <Badge className={statusColors[partner.status] || ""}>
                  {statusLabels[partner.status] || partner.status}
                </Badge>
                <Badge className={levelColors[partner.level] || ""}>
                  <Award className="w-3 h-3 mr-1" />
                  {partner.level}
                </Badge>
              </div>
              {partner.tradeName && (
                <p className="text-muted-foreground text-sm mt-1">{partner.tradeName}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {partner.status === "PENDING" && (
              <Button
                onClick={() => approveMutation.mutate({ id: partnerId })}
                disabled={approveMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approuver
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/admin/partners")}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>

        {/* ============================================ */}
        {/* KPI CARDS */}
        {/* ============================================ */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Package className="w-4 h-4" />
                Commandes
              </div>
              <p className="text-2xl font-bold">{partner.totalOrders || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Euro className="w-4 h-4" />
                Chiffre d'affaires
              </div>
              <p className="text-2xl font-bold">{formatCurrency(partner.totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                Remise globale
              </div>
              <p className="text-2xl font-bold text-emerald-600">{partner.discountPercent || 0}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <CreditCard className="w-4 h-4" />
                Crédit utilisé
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(partner.creditUsed)}
                <span className="text-sm font-normal text-muted-foreground"> / {formatCurrency(partner.creditLimit)}</span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Users className="w-4 h-4" />
                Membres
              </div>
              <p className="text-2xl font-bold">{members.length}</p>
              {invitations.length > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">+{invitations.length} invitation{invitations.length > 1 ? "s" : ""} en attente</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ============================================ */}
        {/* TABS */}
        {/* ============================================ */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview" className="gap-1.5">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
              <span className="sm:hidden">Infos</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-1.5">
              <Users className="w-4 h-4" />
              Membres
              {members.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{members.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-1.5">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Contacts & Adresses</span>
              <span className="sm:hidden">Contacts</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-1.5">
              <Package className="w-4 h-4" />
              Commandes
              {orders && orders.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{orders.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-1.5">
              <StickyNote className="w-4 h-4" />
              <span className="hidden sm:inline">Notes internes</span>
              <span className="sm:hidden">Notes</span>
            </TabsTrigger>
          </TabsList>

          {/* ============================================ */}
          {/* TAB: VUE D'ENSEMBLE */}
          {/* ============================================ */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Informations société */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="w-5 h-5" />
                    Informations société
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Forme juridique</p>
                      <p className="font-medium">{partner.legalForm || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">N° TVA</p>
                      <p className="font-medium">{partner.vatNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">N° d'entreprise</p>
                      <p className="font-medium">{partner.registrationNumber || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Site web</p>
                      {partner.website ? (
                        <a href={partner.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {partner.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <p className="font-medium">—</p>
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground">Code client fournisseur</p>
                      <SupplierCodeField partnerId={partnerId} currentCode={(partner as any).supplierClientCode} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conditions commerciales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="w-5 h-5" />
                    Conditions commerciales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Niveau</p>
                      <Badge className={levelColors[partner.level] || ""}>
                        <Award className="w-3 h-3 mr-1" />
                        {partner.level}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Remise globale</p>
                      <p className="font-bold text-lg text-emerald-600">{partner.discountPercent || 0}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Délai de paiement</p>
                      <p className="font-medium">{partner.paymentTermsDays || 30} jours</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Limite de crédit</p>
                      <p className="font-medium">{formatCurrency(partner.creditLimit)}</p>
                    </div>
                  </div>
                  {productDiscounts && productDiscounts.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="font-semibold text-sm mb-2">Remises par produit ({productDiscounts.length})</p>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {productDiscounts.map((d: any) => (
                            <div key={d.productId} className="flex justify-between text-sm py-1 border-b border-muted/50 last:border-0">
                              <span className="text-muted-foreground">Produit #{d.productId}</span>
                              <span className="font-medium text-emerald-600">{d.discountPercent}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Langue</p>
                      <p className="font-medium">{partner.preferredLanguage === "fr" ? "Français" : partner.preferredLanguage}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Devise</p>
                      <p className="font-medium">{partner.preferredCurrency || "EUR"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Newsletter</p>
                      <p className="font-medium">{partner.newsletterOptIn ? "Oui" : "Non"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Dernière commande</p>
                      <p className="font-medium">{formatDate(partner.lastOrderAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dates */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Créé le</span>
                    <span className="font-medium">{formatDate(partner.createdAt)}</span>
                  </div>
                  {partner.approvedAt && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-muted-foreground">Approuvé le</span>
                      <span className="font-medium">{formatDate(partner.approvedAt)}</span>
                    </div>
                  )}
                  {partner.suspendedAt && (
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-muted-foreground">Suspendu le</span>
                      <span className="font-medium">{formatDate(partner.suspendedAt)}</span>
                      {partner.suspendedReason && (
                        <span className="text-xs text-muted-foreground italic">({partner.suspendedReason})</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Mis à jour le</span>
                    <span className="font-medium">{formatDate(partner.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================ */}
          {/* TAB: MEMBRES */}
          {/* ============================================ */}
          <TabsContent value="members" className="space-y-6 mt-6">
            {/* Actions header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Membres de l'équipe</h3>
                <p className="text-sm text-muted-foreground">
                  {members.length} membre{members.length !== 1 ? "s" : ""} actif{members.length !== 1 ? "s" : ""}
                  {invitations.length > 0 && ` · ${invitations.length} invitation${invitations.length > 1 ? "s" : ""} en attente`}
                </p>
              </div>
              <Button onClick={() => setInviteOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Inviter un membre
              </Button>
            </div>

            {/* Members list */}
            <Card>
              <CardContent className="p-0">
                {membersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : members.length === 0 && invitations.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Aucun membre dans cette équipe</p>
                    <p className="text-sm mt-1">Invitez le premier membre pour commencer</p>
                    <Button className="mt-4" variant="outline" onClick={() => setInviteOpen(true)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Inviter un membre
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Mobile view */}
                    <div className="md:hidden divide-y">
                      {members.map((m: any) => (
                        <div key={m.id} className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                {(m.user?.name || m.user?.email || "?").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{m.user?.name || "Sans nom"}</p>
                                <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                              </div>
                            </div>
                            <Badge className={teamRoleColors[m.teamRole] || ""} variant="secondary">
                              {teamRoleLabels[m.teamRole] || m.teamRole}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Dernière connexion : {formatDateTime(m.user?.lastLoginAt)}</span>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => {
                                  setEditMemberId(m.id);
                                  setEditRole(m.teamRole);
                                  setEditRoleOpen(true);
                                }}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              {m.teamRole !== "OWNER" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-red-500 hover:text-red-700"
                                  onClick={() => {
                                    setRemoveMemberId(m.id);
                                    setRemoveMemberName(m.user?.name || m.user?.email || "ce membre");
                                    setRemoveOpen(true);
                                  }}
                                >
                                  <UserMinus className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {/* Pending invitations */}
                      {invitations.map((inv: any) => (
                        <div key={inv.id} className="p-4 bg-amber-50/50 dark:bg-amber-900/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-sm">
                                <Mail className="w-4 h-4 text-amber-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{inv.email}</p>
                                <p className="text-xs text-amber-600 dark:text-amber-400">Invitation en attente</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                              {teamRoleLabels[inv.role] || inv.role}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Expire le {formatDate(inv.expiresAt)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-red-500 hover:text-red-700"
                              onClick={() => cancelInvitationMutation.mutate({ invitationId: inv.id })}
                              disabled={cancelInvitationMutation.isPending}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop view */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Membre</TableHead>
                            <TableHead>Rôle</TableHead>
                            <TableHead>Téléphone</TableHead>
                            <TableHead>Dernière connexion</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {members.map((m: any) => (
                            <TableRow key={m.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium shrink-0">
                                    {(m.user?.name || m.user?.email || "?").charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium">{m.user?.name || "Sans nom"}</p>
                                    <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={teamRoleColors[m.teamRole] || ""} variant="secondary">
                                  {teamRoleLabels[m.teamRole] || m.teamRole}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {m.user?.phone ? (
                                  <a href={`tel:${m.user.phone}`} className="hover:underline">{m.user.phone}</a>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDateTime(m.user?.lastLoginAt)}
                              </TableCell>
                              <TableCell>
                                {m.user?.isActive !== false ? (
                                  <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                                    <UserCheck className="w-3 h-3 mr-1" />
                                    Actif
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-red-600 border-red-300">
                                    <UserX className="w-3 h-3 mr-1" />
                                    Inactif
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditMemberId(m.id);
                                      setEditRole(m.teamRole);
                                      setEditRoleOpen(true);
                                    }}
                                  >
                                    <Shield className="w-4 h-4 mr-1" />
                                    Rôle
                                  </Button>
                                  {m.teamRole !== "OWNER" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-500 hover:text-red-700"
                                      onClick={() => {
                                        setRemoveMemberId(m.id);
                                        setRemoveMemberName(m.user?.name || m.user?.email || "ce membre");
                                        setRemoveOpen(true);
                                      }}
                                    >
                                      <UserMinus className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {/* Pending invitations */}
                          {invitations.map((inv: any) => (
                            <TableRow key={`inv-${inv.id}`} className="bg-amber-50/50 dark:bg-amber-900/10">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                                    <Mail className="w-4 h-4 text-amber-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{inv.email}</p>
                                    <p className="text-xs text-amber-600 dark:text-amber-400">Invitation en attente</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-amber-600 border-amber-300">
                                  {teamRoleLabels[inv.role] || inv.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">—</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                Expire le {formatDate(inv.expiresAt)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-amber-600 border-amber-300">
                                  <Clock className="w-3 h-3 mr-1" />
                                  En attente
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => cancelInvitationMutation.mutate({ invitationId: inv.id })}
                                  disabled={cancelInvitationMutation.isPending}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Annuler
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================ */}
          {/* TAB: CONTACTS & ADRESSES */}
          {/* ============================================ */}
          <TabsContent value="contacts" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Contacts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5" />
                    Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-sm mb-2">Contact principal</p>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        {partner.primaryContactName}
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <a href={`mailto:${partner.primaryContactEmail}`} className="text-blue-600 hover:underline">
                          {partner.primaryContactEmail}
                        </a>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a href={`tel:${partner.primaryContactPhone}`} className="hover:underline">
                          {partner.primaryContactPhone}
                        </a>
                      </p>
                    </div>
                  </div>
                  {(partner.accountingEmail || partner.orderEmail) && (
                    <>
                      <Separator />
                      <div className="space-y-2 text-sm">
                        {partner.accountingEmail && (
                          <div>
                            <p className="text-muted-foreground">Email comptabilité</p>
                            <a href={`mailto:${partner.accountingEmail}`} className="text-blue-600 hover:underline">
                              {partner.accountingEmail}
                            </a>
                          </div>
                        )}
                        {partner.orderEmail && (
                          <div>
                            <p className="text-muted-foreground">Email commandes</p>
                            <a href={`mailto:${partner.orderEmail}`} className="text-blue-600 hover:underline">
                              {partner.orderEmail}
                            </a>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Adresses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="w-5 h-5" />
                    Adresses
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-sm mb-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> Adresse principale
                    </p>
                    <p className="text-sm">
                      {partner.addressStreet}
                      {partner.addressStreet2 && <><br />{partner.addressStreet2}</>}
                      <br />
                      {partner.addressPostalCode} {partner.addressCity}
                      {partner.addressCountry && `, ${partner.addressCountry}`}
                    </p>
                  </div>
                  {!partner.billingAddressSame && partner.billingStreet && (
                    <>
                      <Separator />
                      <div>
                        <p className="font-semibold text-sm mb-1 flex items-center gap-1">
                          <Receipt className="w-3 h-3" /> Adresse de facturation
                        </p>
                        <p className="text-sm">
                          {partner.billingStreet}
                          {partner.billingStreet2 && <><br />{partner.billingStreet2}</>}
                          <br />
                          {partner.billingPostalCode} {partner.billingCity}
                          {partner.billingCountry && `, ${partner.billingCountry}`}
                        </p>
                      </div>
                    </>
                  )}
                  {partner.deliveryStreet && (
                    <>
                      <Separator />
                      <div>
                        <p className="font-semibold text-sm mb-1 flex items-center gap-1">
                          <Truck className="w-3 h-3" /> Adresse de livraison
                        </p>
                        <p className="text-sm">
                          {partner.deliveryStreet}
                          {partner.deliveryStreet2 && <><br />{partner.deliveryStreet2}</>}
                          <br />
                          {partner.deliveryPostalCode} {partner.deliveryCity}
                          {partner.deliveryCountry && `, ${partner.deliveryCountry}`}
                        </p>
                        {partner.deliveryInstructions && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{partner.deliveryInstructions}</p>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ============================================ */}
          {/* TAB: COMMANDES */}
          {/* ============================================ */}
          <TabsContent value="orders" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5" />
                  Commandes récentes
                </CardTitle>
                <CardDescription>
                  Les 20 dernières commandes de ce partenaire
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orders && orders.length > 0 ? (
                  <>
                    {/* Mobile */}
                    <div className="md:hidden space-y-3">
                      {orders.map((order: any) => (
                        <Card
                          key={order.id}
                          className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => navigate(`/order/${order.id}/summary`)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-sm">#{order.orderNumber}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                            </div>
                            <Badge variant="outline" className="text-[10px]">
                              {orderStatusLabels[order.status] || order.status}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium mt-1">{formatCurrency(order.totalTTC)}</p>
                        </Card>
                      ))}
                    </div>
                    {/* Desktop */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>N° Commande</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Montant TTC</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order: any) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                              <TableCell>{formatDate(order.createdAt)}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {orderStatusLabels[order.status] || order.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(order.totalTTC)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/order/${order.id}/summary`)}
                                >
                                  <FileText className="w-4 h-4 mr-1" />
                                  Voir
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune commande pour ce partenaire</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================ */}
          {/* TAB: NOTES INTERNES */}
          {/* ============================================ */}
          <TabsContent value="notes" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <StickyNote className="w-5 h-5" />
                  Notes internes
                </CardTitle>
                <CardDescription>
                  Notes visibles uniquement par l'équipe Market Spas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {partner.internalNotes ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {partner.internalNotes}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune note interne pour ce partenaire</p>
                    <p className="text-sm mt-1">Les notes peuvent être ajoutées depuis la page de modification du partenaire</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ============================================ */}
      {/* DIALOG: INVITER UN MEMBRE */}
      {/* ============================================ */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inviter un membre</DialogTitle>
            <DialogDescription>
              Envoyez une invitation par email pour ajouter un nouveau membre à l'équipe de {partner.companyName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Adresse email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="nom@entreprise.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_MANAGER">Gestionnaire complet</SelectItem>
                  <SelectItem value="ORDER_MANAGER">Gestionnaire commandes</SelectItem>
                  <SelectItem value="SALES_REP">Commercial</SelectItem>
                  <SelectItem value="ACCOUNTANT">Comptable</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {inviteRole === "FULL_MANAGER" && "Accès complet : commandes, catalogue, équipe, paramètres"}
                {inviteRole === "ORDER_MANAGER" && "Gestion des commandes et du panier uniquement"}
                {inviteRole === "SALES_REP" && "Consultation du catalogue et passage de commandes"}
                {inviteRole === "ACCOUNTANT" && "Accès aux factures, paiements et historique des commandes"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Annuler</Button>
            <Button
              onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole as any, partnerId })}
              disabled={!inviteEmail || inviteMutation.isPending}
            >
              {inviteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
              Envoyer l'invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* DIALOG: MODIFIER LE RÔLE */}
      {/* ============================================ */}
      <Dialog open={editRoleOpen} onOpenChange={setEditRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>
              Changez le rôle de ce membre au sein de l'équipe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nouveau rôle</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">Propriétaire</SelectItem>
                  <SelectItem value="FULL_MANAGER">Gestionnaire complet</SelectItem>
                  <SelectItem value="ORDER_MANAGER">Gestionnaire commandes</SelectItem>
                  <SelectItem value="SALES_REP">Commercial</SelectItem>
                  <SelectItem value="ACCOUNTANT">Comptable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleOpen(false)}>Annuler</Button>
            <Button
              onClick={() => editMemberId && updateRoleMutation.mutate({ memberId: editMemberId, role: editRole as any })}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================ */}
      {/* DIALOG: RETIRER UN MEMBRE */}
      {/* ============================================ */}
      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer un membre</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir retirer <strong>{removeMemberName}</strong> de l'équipe de {partner.companyName} ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveOpen(false)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={() => removeMemberId && removeMemberMutation.mutate({ memberId: removeMemberId })}
              disabled={removeMemberMutation.isPending}
            >
              {removeMemberMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserMinus className="w-4 h-4 mr-2" />}
              Retirer le membre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
