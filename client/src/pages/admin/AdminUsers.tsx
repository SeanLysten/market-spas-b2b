import { useState, useEffect, useMemo } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { TableSkeleton } from "@/components/TableSkeleton";
import { Plus, Mail, UserCheck, UserX, Edit, RotateCw, X, Clock, CheckCircle2, AlertCircle, Shield, ShieldCheck, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/AdminLayout";

// ============================================
// ADMIN PERMISSIONS TYPES (mirrored from server)
// ============================================

const ADMIN_MODULES: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Produits & Catalogue",
  stock: "Gestion du Stock",
  orders: "Commandes",
  partners: "Partenaires",
  marketing: "Marketing & Leads",
  territories: "Territoires",
  sav: "Service Après-Vente",
  spare_parts: "Pièces Détachées",
  resources: "Ressources Médias",
  technical_resources: "Ressources Techniques",
  newsletter: "Newsletter",
  calendar: "Agenda",
  users: "Gestion Utilisateurs",
  settings: "Paramètres",
  reports: "Rapports",
  partner_map: "Carte du Réseau",
};

type AdminModule = keyof typeof ADMIN_MODULES;

interface ModulePermission {
  view: boolean;
  edit: boolean;
}

interface AdminPermissions {
  modules: Record<string, ModulePermission>;
}

const ADMIN_ROLE_PRESETS: Record<string, { label: string; description: string }> = {
  SUPER_ADMIN: { label: "Super Administrateur", description: "Accès total + gestion des administrateurs" },
  ADMIN_FULL: { label: "Administrateur Complet", description: "Accès à tous les modules sauf gestion des utilisateurs admin" },
  ADMIN_STOCK: { label: "Gestionnaire Stock", description: "Produits, stock, prévisions, pièces détachées" },
  ADMIN_SAV: { label: "Gestionnaire SAV", description: "Service après-vente, pièces détachées, ressources techniques" },
  ADMIN_MARKETING: { label: "Gestionnaire Marketing", description: "Marketing, leads, territoires, newsletter, agenda, carte réseau" },
  ADMIN_ORDERS: { label: "Gestionnaire Commandes", description: "Commandes, partenaires, rapports" },
  ADMIN_CUSTOM: { label: "Personnalisé", description: "Permissions personnalisées par module" },
};

function allModulesAccess(view: boolean, edit: boolean): Record<string, ModulePermission> {
  const modules: Record<string, ModulePermission> = {};
  for (const key of Object.keys(ADMIN_MODULES)) {
    modules[key] = { view, edit };
  }
  return modules;
}

function getPresetPermissions(preset: string): AdminPermissions {
  switch (preset) {
    case "SUPER_ADMIN":
      return { modules: allModulesAccess(true, true) };
    case "ADMIN_FULL": {
      const m = allModulesAccess(true, true);
      m.users = { view: true, edit: false };
      return { modules: m };
    }
    case "ADMIN_STOCK":
      return { modules: { ...allModulesAccess(false, false), dashboard: { view: true, edit: false }, products: { view: true, edit: true }, stock: { view: true, edit: true }, spare_parts: { view: true, edit: true }, orders: { view: true, edit: false } } };
    case "ADMIN_SAV":
      return { modules: { ...allModulesAccess(false, false), dashboard: { view: true, edit: false }, sav: { view: true, edit: true }, spare_parts: { view: true, edit: true }, technical_resources: { view: true, edit: true }, partners: { view: true, edit: false } } };
    case "ADMIN_MARKETING":
      return { modules: { ...allModulesAccess(false, false), dashboard: { view: true, edit: false }, marketing: { view: true, edit: true }, territories: { view: true, edit: true }, newsletter: { view: true, edit: true }, calendar: { view: true, edit: true }, resources: { view: true, edit: true }, partner_map: { view: true, edit: true }, partners: { view: true, edit: false } } };
    case "ADMIN_ORDERS":
      return { modules: { ...allModulesAccess(false, false), dashboard: { view: true, edit: false }, orders: { view: true, edit: true }, partners: { view: true, edit: true }, reports: { view: true, edit: true }, products: { view: true, edit: false } } };
    default:
      return { modules: allModulesAccess(false, false) };
  }
}

// ============================================
// ROLE PERMISSIONS DIALOG
// ============================================

function RolePermissionsDialog({
  userId,
  userName,
  currentRole,
  currentPreset,
  currentPermissions,
  open,
  onOpenChange,
  onSave,
}: {
  userId: number;
  userName: string;
  currentRole: string;
  currentPreset: string | null;
  currentPermissions: AdminPermissions | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (userId: number, role: string, preset: string, permissions: AdminPermissions) => void;
}) {
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [selectedPreset, setSelectedPreset] = useState(currentPreset || "ADMIN_FULL");
  const [permissions, setPermissions] = useState<AdminPermissions>(
    currentPermissions || getPresetPermissions("ADMIN_FULL")
  );

  useEffect(() => {
    if (open) {
      setSelectedRole(currentRole);
      setSelectedPreset(currentPreset || (currentRole === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN_FULL"));
      setPermissions(currentPermissions || getPresetPermissions(currentRole === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN_FULL"));
    }
  }, [open, currentRole, currentPreset, currentPermissions]);

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    if (preset !== "ADMIN_CUSTOM") {
      setPermissions(getPresetPermissions(preset));
    }
    if (preset === "SUPER_ADMIN") {
      setSelectedRole("SUPER_ADMIN");
    } else {
      setSelectedRole("ADMIN");
    }
  };

  const handleModuleToggle = (module: string, field: "view" | "edit", value: boolean) => {
    setSelectedPreset("ADMIN_CUSTOM");
    setPermissions((prev) => ({
      modules: {
        ...prev.modules,
        [module]: {
          ...prev.modules[module],
          [field]: value,
          ...(field === "edit" && value ? { view: true } : {}),
          ...(field === "view" && !value ? { edit: false } : {}),
        },
      },
    }));
  };

  const handleSave = () => {
    onSave(userId, selectedRole, selectedPreset, permissions);
    onOpenChange(false);
  };

  const isAdmin = selectedRole === "ADMIN" || selectedRole === "SUPER_ADMIN";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Permissions de {userName}
          </DialogTitle>
          <DialogDescription>
            Configurez le rôle et les permissions d'accès au dashboard admin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Role selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Type de compte</Label>
            <Select value={isAdmin ? "admin" : "partner"} onValueChange={(v) => {
              if (v === "partner") {
                setSelectedRole("PARTNER");
                setSelectedPreset("");
              } else {
                setSelectedRole("ADMIN");
                setSelectedPreset("ADMIN_FULL");
                setPermissions(getPresetPermissions("ADMIN_FULL"));
              }
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="partner">Partenaire / Utilisateur</SelectItem>
                <SelectItem value="admin">Administrateur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isAdmin && (
            <>
              <Separator />
              {/* Preset selection */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Profil de permissions</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(ADMIN_ROLE_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePresetChange(key)}
                      className={`text-left p-3 rounded-lg border-2 transition-all ${
                        selectedPreset === key
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {key === "SUPER_ADMIN" ? (
                          <ShieldCheck className="w-4 h-4 text-destructive flex-shrink-0" />
                        ) : (
                          <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                        <span className="font-medium text-sm">{preset.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Module permissions grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Permissions par module</Label>
                  <div className="flex gap-8 text-xs text-muted-foreground">
                    <span>Voir</span>
                    <span>Modifier</span>
                  </div>
                </div>
                <div className="space-y-1">
                  {Object.entries(ADMIN_MODULES).map(([key, label]) => {
                    const perm = permissions.modules[key] || { view: false, edit: false };
                    return (
                      <div key={key} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50">
                        <span className="text-sm">{label}</span>
                        <div className="flex gap-8">
                          <Switch
                            checked={perm.view}
                            onCheckedChange={(v) => handleModuleToggle(key, "view", v)}
                            disabled={selectedPreset === "SUPER_ADMIN"}
                          />
                          <Switch
                            checked={perm.edit}
                            onCheckedChange={(v) => handleModuleToggle(key, "edit", v)}
                            disabled={selectedPreset === "SUPER_ADMIN"}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            <ShieldCheck className="w-4 h-4 mr-2" />
            Enregistrer les permissions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminUsers() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "USER" as const,
    partnerId: "",
  });

  const { data: meData } = trpc.auth.me.useQuery();
  const isSuperAdmin = meData?.role === "SUPER_ADMIN";

  const { data: usersData, isLoading, refetch } = trpc.admin.users.list.useQuery();
  const users = useSafeQuery(usersData);
  
  const { data: invitationsData, isLoading: invitationsLoading, refetch: refetchInvitations } = trpc.admin.users.listInvitations.useQuery();
  const invitations = useSafeQuery(invitationsData);
  
  const { data: partnersData } = trpc.admin.partners.list.useQuery({});
  const partnersList = useSafeQuery(partnersData);

  const inviteMutation = trpc.admin.users.invite.useMutation();
  const toggleActiveMutation = trpc.admin.users.toggleActive.useMutation();
  const updateRoleMutation = trpc.admin.users.updateRole.useMutation();
  const cancelInvitationMutation = trpc.admin.users.cancelInvitation.useMutation();
  const resendInvitationMutation = trpc.admin.users.resendInvitation.useMutation();
  const linkPartnerMutation = trpc.admin.users.linkPartner.useMutation();
  
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkingUser, setLinkingUser] = useState<any>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");

  // Auto-refresh invitations every 30 seconds
  useEffect(() => {
    if (activeTab === "invitations") {
      const interval = setInterval(() => {
        refetchInvitations();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, refetchInvitations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await inviteMutation.mutateAsync({
        email: formData.email,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        partnerId: formData.partnerId && formData.partnerId !== 'none' ? parseInt(formData.partnerId) : undefined,
        role: formData.role === 'ADMIN' ? 'ADMIN' : 'PARTNER',
      });

      toast.success("Invitation envoyée avec succès");
      setOpen(false);
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        role: "USER",
        partnerId: "",
      });
      refetch();
      refetchInvitations();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi de l'invitation");
    }
  };

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    try {
      await toggleActiveMutation.mutateAsync({
        userId,
        isActive: !currentStatus,
      });
      toast.success(currentStatus ? "Utilisateur désactivé" : "Utilisateur activé");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la modification");
    }
  };

  const handleSavePermissions = async (userId: number, role: string, preset: string, permissions: AdminPermissions) => {
    try {
      await updateRoleMutation.mutateAsync({
        userId,
        role: role as any,
        adminRolePreset: preset,
        adminPermissions: JSON.stringify(permissions),
      });
      toast.success("Rôle et permissions mis à jour avec succès");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la modification du rôle");
    }
  };

  const handleCancelInvitation = async (tokenId: number) => {
    try {
      await cancelInvitationMutation.mutateAsync({ tokenId });
      toast.success("Invitation annulée avec succès");
      refetchInvitations();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'annulation");
    }
  };

  const handleResendInvitation = async (tokenId: number) => {
    try {
      await resendInvitationMutation.mutateAsync({ tokenId });
      toast.success("Invitation renvoyée avec succès");
      refetchInvitations();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du renvoi");
    }
  };

  const getRoleBadge = (role: string, preset?: string | null) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: "bg-destructive/15 dark:bg-destructive/25 text-destructive dark:text-destructive",
      ADMIN: "bg-orange-500/15 dark:bg-orange-500/25 text-orange-800 dark:text-orange-400",
      PARTNER: "bg-info/15 dark:bg-info-light text-info dark:text-info-dark",
      PARTNER_ADMIN: "bg-purple-500/15 dark:bg-purple-500/25 text-purple-800 dark:text-purple-400",
      PARTNER_USER: "bg-blue-500/15 dark:bg-blue-500/25 text-blue-800 dark:text-blue-400",
      USER: "bg-muted dark:bg-muted/50 text-gray-800",
    };
    const roleLabels: Record<string, string> = {
      SUPER_ADMIN: "Super Admin",
      ADMIN: preset && ADMIN_ROLE_PRESETS[preset] ? ADMIN_ROLE_PRESETS[preset].label : "Admin",
      PARTNER: "Partenaire",
      PARTNER_ADMIN: "Admin Partenaire",
      PARTNER_USER: "Utilisateur",
    };
    return {
      color: colors[role] || colors.USER,
      label: roleLabels[role] || role?.replace("_", " ") || "USER",
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-400">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
      case 'ACCEPTED':
        return (
          <Badge variant="secondary" className="bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Accepté
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge variant="secondary" className="bg-muted dark:bg-muted/50 text-gray-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Expiré
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Separate admin and partner users
  const adminUsers = useMemo(() => users?.filter((u: any) => u.role === "SUPER_ADMIN" || u.role === "ADMIN") || [], [users]);
  const partnerUsers = useMemo(() => users?.filter((u: any) => u.role !== "SUPER_ADMIN" && u.role !== "ADMIN") || [], [users]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-display">Gestion des utilisateurs</h1>
            <p className="text-muted-foreground mt-2">
              Invitez de nouveaux utilisateurs et gérez les accès
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Inviter un utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-[95vw] sm:w-full">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Inviter un nouvel utilisateur</DialogTitle>
                  <DialogDescription>
                    Un email d'invitation sera envoyé à l'adresse indiquée
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="utilisateur@example.com"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="Jean"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Dupont"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Type de compte</Label>
                    <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as any })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">Partenaire</SelectItem>
                        {isSuperAdmin && <SelectItem value="ADMIN">Administrateur</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.role === "USER" && (
                    <div className="space-y-2">
                      <Label>Associer à un partenaire</Label>
                      <Select value={formData.partnerId} onValueChange={(v) => setFormData({ ...formData, partnerId: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un partenaire (optionnel)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun partenaire</SelectItem>
                          {(partnersList || []).map((p: any) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.companyName} ({p.vatNumber})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">L'utilisateur sera automatiquement lié à cette fiche partenaire lors de son inscription</p>
                    </div>
                  )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? (
                      <>
                        <Mail className="w-4 h-4 mr-2 animate-pulse" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Envoyer l'invitation
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="admins" className="gap-1">
              <Shield className="w-3.5 h-3.5" />
              Admins ({adminUsers.length})
            </TabsTrigger>
            <TabsTrigger value="users">
              Partenaires ({partnerUsers.length})
            </TabsTrigger>
            <TabsTrigger value="invitations">
              Invitations ({invitations?.filter((inv: any) => inv.status === 'PENDING').length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Admins Tab */}
          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Équipe administrative
                </CardTitle>
                <CardDescription>
                  {adminUsers.length} administrateur(s) avec accès au dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <TableSkeleton rows={4} columns={5} />
                ) : adminUsers.length > 0 ? (
                  <>
                    {/* Mobile */}
                    <div className="md:hidden space-y-3">
                      {adminUsers.map((user: any) => {
                        const badge = getRoleBadge(user.role, user.adminRolePreset);
                        return (
                          <Card key={user.id} className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-sm truncate">{user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || '—'}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email || '—'}</p>
                              </div>
                              {isSuperAdmin && (
                                <Button variant="ghost" size="sm" onClick={() => { setEditingUser(user); setPermDialogOpen(true); }}>
                                  <Settings2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <Badge className={badge.color + ' text-[10px]'}>{badge.label}</Badge>
                              {user.isActive ? <Badge className="bg-emerald-500/15 text-emerald-800 text-[10px]">Actif</Badge> : <Badge className="bg-muted text-gray-800 text-[10px]">Inactif</Badge>}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                    {/* Desktop */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Utilisateur</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rôle Admin</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Dernière connexion</TableHead>
                            {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {adminUsers.map((user: any) => {
                            const badge = getRoleBadge(user.role, user.adminRolePreset);
                            return (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                  {user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "—"}
                                </TableCell>
                                <TableCell>{user.email || "—"}</TableCell>
                                <TableCell>
                                  <Badge className={badge.color}>{badge.label}</Badge>
                                </TableCell>
                                <TableCell>
                                  {user.isActive ? (
                                    <Badge className="bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400">Actif</Badge>
                                  ) : (
                                    <Badge className="bg-muted dark:bg-muted/50 text-gray-800">Inactif</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {user.lastSignedIn
                                    ? new Date(user.lastSignedIn).toLocaleDateString("fr-FR")
                                    : "Jamais"}
                                </TableCell>
                                {isSuperAdmin && (
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => { setEditingUser(user); setPermDialogOpen(true); }}
                                        title="Gérer les permissions"
                                      >
                                        <Settings2 className="w-4 h-4 text-info dark:text-info-dark" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToggleActive(user.id, user.isActive || false)}
                                        disabled={toggleActiveMutation.isPending}
                                      >
                                        {user.isActive ? (
                                          <UserX className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                        ) : (
                                          <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        )}
                                      </Button>
                                    </div>
                                  </TableCell>
                                )}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Aucun administrateur</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Partner Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Partenaires & Utilisateurs</CardTitle>
                <CardDescription>
                  {partnerUsers.length} utilisateur(s) partenaire(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <TableSkeleton rows={8} columns={7} />
                ) : partnerUsers.length > 0 ? (
                  <>
                    {/* Mobile */}
                    <div className="md:hidden space-y-3">
                      {partnerUsers.map((user: any) => {
                        const badge = getRoleBadge(user.role, user.adminRolePreset);
                        return (
                          <Card key={user.id} className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-sm truncate">{user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || '—'}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email || '—'}</p>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                {isSuperAdmin && (
                                  <Button variant="ghost" size="sm" onClick={() => { setEditingUser(user); setPermDialogOpen(true); }}>
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => handleToggleActive(user.id, user.isActive || false)}>
                                  {user.isActive ? <UserX className="w-3 h-3 text-orange-600" /> : <UserCheck className="w-3 h-3 text-emerald-600" />}
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <Badge className={badge.color + ' text-[10px]'}>{badge.label}</Badge>
                              {user.isActive ? <Badge className="bg-emerald-500/15 text-emerald-800 text-[10px]">Actif</Badge> : <Badge className="bg-muted text-gray-800 text-[10px]">Inactif</Badge>}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                    {/* Desktop */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Utilisateur</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rôle</TableHead>
                            <TableHead>Partenaire</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Dernière connexion</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {partnerUsers.map((user: any) => {
                            const badge = getRoleBadge(user.role, user.adminRolePreset);
                            return (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                  {user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "—"}
                                </TableCell>
                                <TableCell>{user.email || "—"}</TableCell>
                                <TableCell>
                                  <Badge className={badge.color}>{badge.label}</Badge>
                                </TableCell>
                                <TableCell>
                                {user.partnerCompanyName ? (
                                  <div className="flex items-center gap-1">
                                    <a href={`/admin/partners`} className="text-emerald-700 dark:text-emerald-400 hover:underline font-medium">
                                      {user.partnerCompanyName}
                                    </a>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Changer le partenaire" onClick={() => { setLinkingUser(user); setSelectedPartnerId(String(user.partnerId || '')); setLinkDialogOpen(true); }}>
                                      <Edit className="w-3 h-3 text-muted-foreground" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-emerald-700" onClick={() => { setLinkingUser(user); setSelectedPartnerId(''); setLinkDialogOpen(true); }}>
                                    + Associer
                                  </Button>
                                )}
                              </TableCell>
                                <TableCell>
                                  {user.isActive ? (
                                    <Badge className="bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400">Actif</Badge>
                                  ) : (
                                    <Badge className="bg-muted dark:bg-muted/50 text-gray-800">Inactif</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {user.lastSignedIn
                                    ? new Date(user.lastSignedIn).toLocaleDateString("fr-FR")
                                    : "Jamais"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    {isSuperAdmin && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => { setEditingUser(user); setPermDialogOpen(true); }}
                                        title="Modifier le rôle"
                                      >
                                        <Edit className="w-4 h-4 text-info dark:text-info-dark" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleToggleActive(user.id, user.isActive || false)}
                                      disabled={toggleActiveMutation.isPending}
                                    >
                                      {user.isActive ? (
                                        <UserX className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                      ) : (
                                        <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                      )}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Aucun utilisateur partenaire</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <CardTitle>Invitations en cours</CardTitle>
                <CardDescription>
                  {invitations?.length || 0} invitation(s) envoyée(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invitationsLoading ? (
                  <TableSkeleton rows={5} columns={6} />
                ) : invitations && invitations.length > 0 ? (
                  <>
                    {/* Mobile */}
                    <div className="md:hidden space-y-3">
                      {invitations.map((invitation: any) => (
                        <Card key={invitation.id} className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{invitation.email}</p>
                              <p className="text-xs text-muted-foreground">
                                {invitation.firstName || invitation.lastName ? `${invitation.firstName || ''} ${invitation.lastName || ''}`.trim() : '—'}
                              </p>
                            </div>
                            {getStatusBadge(invitation.status)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                            <p>Envoyé le {new Date(invitation.createdAt).toLocaleDateString('fr-FR')}</p>
                            <p>Expire le {new Date(invitation.expiresAt).toLocaleDateString('fr-FR')}</p>
                          </div>
                          {invitation.status === 'PENDING' && (
                            <div className="flex gap-2 mt-3">
                              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleResendInvitation(invitation.id)} disabled={resendInvitationMutation.isPending}><RotateCw className="w-3 h-3 mr-1" />Renvoyer</Button>
                              <Button variant="outline" size="sm" className="flex-1 text-xs text-destructive" onClick={() => handleCancelInvitation(invitation.id)} disabled={cancelInvitationMutation.isPending}><X className="w-3 h-3 mr-1" />Annuler</Button>
                            </div>
                          )}
                          {invitation.status === 'EXPIRED' && (
                            <Button variant="outline" size="sm" className="w-full mt-3 text-xs" onClick={() => handleResendInvitation(invitation.id)} disabled={resendInvitationMutation.isPending}><RotateCw className="w-3 h-3 mr-1" />Renvoyer</Button>
                          )}
                        </Card>
                      ))}
                    </div>
                    {/* Desktop */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Nom</TableHead>
                            <TableHead>Invité par</TableHead>
                            <TableHead>Date d'envoi</TableHead>
                            <TableHead>Expire le</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invitations.map((invitation: any) => (
                            <TableRow key={invitation.id}>
                              <TableCell className="font-medium">{invitation.email}</TableCell>
                              <TableCell>
                                {invitation.firstName || invitation.lastName
                                  ? `${invitation.firstName || ""} ${invitation.lastName || ""}`.trim()
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                {invitation.inviterName || invitation.inviterEmail || "—"}
                              </TableCell>
                              <TableCell>
                                {new Date(invitation.createdAt).toLocaleDateString("fr-FR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </TableCell>
                              <TableCell>
                                {new Date(invitation.expiresAt).toLocaleDateString("fr-FR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </TableCell>
                              <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                              <TableCell className="text-right">
                                {invitation.status === 'PENDING' && (
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleResendInvitation(invitation.id)}
                                      disabled={resendInvitationMutation.isPending}
                                      title="Renvoyer l'invitation"
                                    >
                                      <RotateCw className="w-4 h-4 text-info dark:text-info-dark" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCancelInvitation(invitation.id)}
                                      disabled={cancelInvitationMutation.isPending}
                                      title="Annuler l'invitation"
                                    >
                                      <X className="w-4 h-4 text-destructive dark:text-destructive" />
                                    </Button>
                                  </div>
                                )}
                                {invitation.status === 'EXPIRED' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleResendInvitation(invitation.id)}
                                    disabled={resendInvitationMutation.isPending}
                                    title="Renvoyer l'invitation"
                                  >
                                    <RotateCw className="w-4 h-4 text-info dark:text-info-dark" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Mail className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Aucune invitation envoyée</p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-2">
                      Cliquez sur "Inviter un utilisateur" pour commencer
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Permissions Dialog */}
        {editingUser && (
          <RolePermissionsDialog
            userId={editingUser.id}
            userName={editingUser.name || editingUser.email || "Utilisateur"}
            currentRole={editingUser.role || "PARTNER"}
            currentPreset={editingUser.adminRolePreset}
            currentPermissions={editingUser.adminPermissions ? (typeof editingUser.adminPermissions === 'string' ? JSON.parse(editingUser.adminPermissions) : editingUser.adminPermissions) : null}
            open={permDialogOpen}
            onOpenChange={(open) => {
              setPermDialogOpen(open);
              if (!open) setEditingUser(null);
            }}
            onSave={handleSavePermissions}
          />
        )}

        {/* Link Partner Dialog */}
        <Dialog open={linkDialogOpen} onOpenChange={(open) => { setLinkDialogOpen(open); if (!open) setLinkingUser(null); }}>
          <DialogContent className="max-w-md w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>Associer un partenaire</DialogTitle>
              <DialogDescription>
                {linkingUser ? `Associer ${linkingUser.name || linkingUser.email} à une fiche partenaire` : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Partenaire</Label>
                <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un partenaire" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun (dissocier)</SelectItem>
                    {(partnersList || []).map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.companyName} ({p.vatNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Annuler</Button>
              <Button onClick={async () => {
                if (!linkingUser) return;
                try {
                  await linkPartnerMutation.mutateAsync({
                    userId: linkingUser.id,
                    partnerId: selectedPartnerId && selectedPartnerId !== 'none' ? parseInt(selectedPartnerId) : null,
                  });
                  toast.success('Partenaire associé avec succès');
                  setLinkDialogOpen(false);
                  setLinkingUser(null);
                  refetch();
                } catch (error: any) {
                  toast.error(error.message || 'Erreur lors de l\'association');
                }
              }} disabled={linkPartnerMutation.isPending}>
                {linkPartnerMutation.isPending ? 'Association...' : 'Associer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
