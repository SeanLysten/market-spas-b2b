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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { TableSkeleton } from "@/components/TableSkeleton";
import {
  Plus, Mail, UserX, Shield, ShieldCheck, Settings2, Users,
  Trash2, RotateCw, Clock, CheckCircle2, AlertCircle, X, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

// ============================================
// TYPES
// ============================================

type TeamRole = "OWNER" | "SALES_REP" | "ORDER_MANAGER" | "ACCOUNTANT" | "FULL_MANAGER";

const ROLE_LABELS: Record<TeamRole, string> = {
  OWNER: "Propriétaire",
  SALES_REP: "Commercial",
  ORDER_MANAGER: "Gestionnaire Commandes",
  ACCOUNTANT: "Comptable",
  FULL_MANAGER: "Gestionnaire Complet",
};

const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  OWNER: "Accès complet à toutes les fonctionnalités du compte",
  SALES_REP: "Consultation des leads et du catalogue (sans prix)",
  ORDER_MANAGER: "Gestion du catalogue, commandes, SAV et pièces détachées",
  ACCOUNTANT: "Consultation des commandes et export des factures",
  FULL_MANAGER: "Accès complet sauf gestion d'équipe",
};

const ROLE_COLORS: Record<TeamRole, string> = {
  OWNER: "bg-destructive/15 text-destructive",
  SALES_REP: "bg-blue-500/15 text-blue-800 dark:text-blue-400",
  ORDER_MANAGER: "bg-orange-500/15 text-orange-800 dark:text-orange-400",
  ACCOUNTANT: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-400",
  FULL_MANAGER: "bg-purple-500/15 text-purple-800 dark:text-purple-400",
};

interface PermissionCategory {
  label: string;
  actions: Record<string, string>;
}

const PERMISSION_CATEGORIES: Record<string, PermissionCategory> = {
  leads: { label: "Leads", actions: { view: "Voir", edit: "Modifier", delete: "Supprimer" } },
  orders: { label: "Commandes", actions: { view: "Voir", create: "Créer", edit: "Modifier", cancel: "Annuler" } },
  spas: { label: "Commande de Spas", actions: { view: "Voir le catalogue", order: "Commander des spas" } },
  invoices: { label: "Factures", actions: { view: "Voir", export: "Exporter" } },
  catalog: { label: "Catalogue", actions: { view: "Voir", viewPrices: "Voir les prix" } },
  sav: { label: "Service Après-Vente", actions: { view: "Voir les tickets", create: "Créer un ticket", edit: "Modifier" } },
  spareParts: { label: "Pièces Détachées", actions: { view: "Voir", order: "Commander" } },
  resources: { label: "Ressources", actions: { view: "Voir", download: "Télécharger" } },
  team: { label: "Équipe", actions: { invite: "Inviter", manage: "Gérer" } },
  profile: { label: "Profil", actions: { edit: "Modifier" } },
};

function getDefaultPermissions(role: TeamRole): Record<string, any> {
  switch (role) {
    case "OWNER":
      return {
        leads: { view: "all", edit: true, delete: true },
        orders: { view: true, create: true, edit: true, cancel: true },
        spas: { view: true, order: true },
        invoices: { view: true, export: true },
        catalog: { view: true, viewPrices: true },
        sav: { view: true, create: true, edit: true },
        spareParts: { view: true, order: true },
        resources: { view: true, download: true },
        team: { invite: true, manage: true },
        profile: { edit: true },
      };
    case "SALES_REP":
      return {
        leads: { view: "assigned", edit: true, delete: false },
        orders: { view: false, create: false, edit: false, cancel: false },
        spas: { view: false, order: false },
        invoices: { view: false, export: false },
        catalog: { view: true, viewPrices: false },
        sav: { view: false, create: false, edit: false },
        spareParts: { view: false, order: false },
        resources: { view: false, download: false },
        team: { invite: false, manage: false },
        profile: { edit: false },
      };
    case "ORDER_MANAGER":
      return {
        leads: { view: "none", edit: false, delete: false },
        orders: { view: true, create: true, edit: true, cancel: true },
        spas: { view: true, order: true },
        invoices: { view: true, export: false },
        catalog: { view: true, viewPrices: true },
        sav: { view: true, create: true, edit: false },
        spareParts: { view: true, order: true },
        resources: { view: true, download: true },
        team: { invite: false, manage: false },
        profile: { edit: false },
      };
    case "ACCOUNTANT":
      return {
        leads: { view: "none", edit: false, delete: false },
        orders: { view: true, create: false, edit: false, cancel: false },
        spas: { view: false, order: false },
        invoices: { view: true, export: true },
        catalog: { view: false, viewPrices: false },
        sav: { view: false, create: false, edit: false },
        spareParts: { view: false, order: false },
        resources: { view: false, download: false },
        team: { invite: false, manage: false },
        profile: { edit: false },
      };
    case "FULL_MANAGER":
      return {
        leads: { view: "all", edit: true, delete: true },
        orders: { view: true, create: true, edit: true, cancel: true },
        spas: { view: true, order: true },
        invoices: { view: true, export: true },
        catalog: { view: true, viewPrices: true },
        sav: { view: true, create: true, edit: true },
        spareParts: { view: true, order: true },
        resources: { view: true, download: true },
        team: { invite: false, manage: false },
        profile: { edit: false },
      };
    default:
      return {
        leads: { view: "none", edit: false, delete: false },
        orders: { view: false, create: false, edit: false, cancel: false },
        spas: { view: false, order: false },
        invoices: { view: false, export: false },
        catalog: { view: false, viewPrices: false },
        sav: { view: false, create: false, edit: false },
        spareParts: { view: false, order: false },
        resources: { view: false, download: false },
        team: { invite: false, manage: false },
        profile: { edit: false },
      };
  }
}

// ============================================
// INVITE DIALOG
// ============================================

function InviteDialog({
  open,
  onOpenChange,
  onInvite,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string, role: TeamRole, permissions: string) => void;
  isPending: boolean;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("SALES_REP");
  const [permissions, setPermissions] = useState<Record<string, any>>(getDefaultPermissions("SALES_REP"));
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail("");
      setRole("SALES_REP");
      setPermissions(getDefaultPermissions("SALES_REP"));
      setShowCustom(false);
    }
  }, [open]);

  const handleRoleChange = (newRole: TeamRole) => {
    setRole(newRole);
    setPermissions(getDefaultPermissions(newRole));
    setShowCustom(false);
  };

  const handlePermToggle = (category: string, action: string, value: boolean) => {
    setShowCustom(true);
    setPermissions((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [action]: value,
        // If enabling edit, also enable view
        ...(action !== "view" && value && prev[category]?.view === false ? { view: true } : {}),
        ...(action !== "view" && value && prev[category]?.view === "none" ? { view: "all" } : {}),
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInvite(email, role, JSON.stringify(permissions));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Inviter un collaborateur
            </DialogTitle>
            <DialogDescription>
              Ajoutez un membre à votre équipe avec un rôle et des permissions spécifiques
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email *</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="collaborateur@entreprise.com"
                required
              />
            </div>

            {/* Role selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Rôle</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.entries(ROLE_LABELS) as [TeamRole, string][])
                  .filter(([key]) => key !== "OWNER")
                  .map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleRoleChange(key)}
                      className={`text-left p-3 rounded-lg border-2 transition-all ${
                        role === key
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <span className="font-medium text-sm">{label}</span>
                      <p className="text-xs text-muted-foreground mt-1">{ROLE_DESCRIPTIONS[key]}</p>
                    </button>
                  ))}
              </div>
            </div>

            <Separator />

            {/* Permissions grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  Permissions détaillées
                  {showCustom && <span className="text-xs text-muted-foreground ml-2">(personnalisé)</span>}
                </Label>
              </div>
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {Object.entries(PERMISSION_CATEGORIES)
                  .filter(([key]) => key !== "team" && key !== "profile")
                  .map(([catKey, cat]) => (
                    <div key={catKey} className="py-2 px-3 rounded-md hover:bg-muted/50">
                      <div className="font-medium text-sm mb-1.5">{cat.label}</div>
                      <div className="flex flex-wrap gap-3">
                        {Object.entries(cat.actions).map(([actKey, actLabel]) => {
                          const val = permissions[catKey]?.[actKey];
                          const isOn = val === true || val === "all" || val === "assigned";
                          return (
                            <label key={actKey} className="flex items-center gap-1.5 text-xs cursor-pointer">
                              <Switch
                                checked={isOn}
                                onCheckedChange={(v) => handlePermToggle(catKey, actKey, v)}
                                className="scale-75"
                              />
                              <span className={isOn ? "text-foreground" : "text-muted-foreground"}>{actLabel}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending || !email}>
              {isPending ? (
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
  );
}

// ============================================
// EDIT PERMISSIONS DIALOG
// ============================================

function EditPermissionsDialog({
  member,
  open,
  onOpenChange,
  onSave,
  isPending,
}: {
  member: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (memberId: number, role: TeamRole, permissions: string) => void;
  isPending: boolean;
}) {
  const [role, setRole] = useState<TeamRole>(member?.role || "SALES_REP");
  const [permissions, setPermissions] = useState<Record<string, any>>(
    member?.permissions ? (typeof member.permissions === "string" ? JSON.parse(member.permissions) : member.permissions) : getDefaultPermissions(member?.role || "SALES_REP")
  );

  useEffect(() => {
    if (open && member) {
      setRole(member.role || "SALES_REP");
      const perms = member.permissions
        ? typeof member.permissions === "string"
          ? JSON.parse(member.permissions)
          : member.permissions
        : getDefaultPermissions(member.role || "SALES_REP");
      setPermissions(perms);
    }
  }, [open, member]);

  const handleRoleChange = (newRole: TeamRole) => {
    setRole(newRole);
    setPermissions(getDefaultPermissions(newRole));
  };

  const handlePermToggle = (category: string, action: string, value: boolean) => {
    setPermissions((prev: Record<string, any>) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [action]: value,
        ...(action !== "view" && value && prev[category]?.view === false ? { view: true } : {}),
        ...(action !== "view" && value && prev[category]?.view === "none" ? { view: "all" } : {}),
      },
    }));
  };

  const handleSave = () => {
    onSave(member.id, role, JSON.stringify(permissions));
    onOpenChange(false);
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Permissions de {member.userName || member.userEmail || "Membre"}
          </DialogTitle>
          <DialogDescription>
            Modifiez le rôle et les permissions de ce collaborateur
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Role */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Rôle</Label>
            <Select value={role} onValueChange={(v) => handleRoleChange(v as TeamRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(ROLE_LABELS) as [TeamRole, string][])
                  .filter(([key]) => key !== "OWNER")
                  .map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Permissions */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Permissions détaillées</Label>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {Object.entries(PERMISSION_CATEGORIES)
                .filter(([key]) => key !== "team" && key !== "profile")
                .map(([catKey, cat]) => (
                  <div key={catKey} className="py-2 px-3 rounded-md hover:bg-muted/50">
                    <div className="font-medium text-sm mb-1.5">{cat.label}</div>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(cat.actions).map(([actKey, actLabel]) => {
                        const val = permissions[catKey]?.[actKey];
                        const isOn = val === true || val === "all" || val === "assigned";
                        return (
                          <label key={actKey} className="flex items-center gap-1.5 text-xs cursor-pointer">
                            <Switch
                              checked={isOn}
                              onCheckedChange={(v) => handlePermToggle(catKey, actKey, v)}
                              className="scale-75"
                            />
                            <span className={isOn ? "text-foreground" : "text-muted-foreground"}>{actLabel}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            <ShieldCheck className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function TeamManagement() {
  const [, setLocation] = useLocation();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editMember, setEditMember] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);

  const { data: meData } = trpc.auth.me.useQuery();
  const isAdmin = meData?.role === "SUPER_ADMIN" || meData?.role === "ADMIN";
  const isOwner = meData?.role === "PARTNER_ADMIN" || meData?.role === "PARTNER" || isAdmin;

  const { data: membersData, isLoading, refetch } = trpc.team.list.useQuery();
  const members = useSafeQuery(membersData);

  const { data: invitationsData, isLoading: invLoading, refetch: refetchInv } = trpc.team.listInvitations.useQuery();
  const invitations = useSafeQuery(invitationsData);

  const inviteMutation = trpc.team.invite.useMutation();
  const updatePermsMutation = trpc.team.updatePermissions.useMutation();
  const removeMutation = trpc.team.remove.useMutation();
  const cancelInvMutation = trpc.team.cancelInvitation.useMutation();

  const handleInvite = async (email: string, role: TeamRole, permissions: string) => {
    try {
      await inviteMutation.mutateAsync({ email, role, customPermissions: permissions });
      toast.success("Invitation envoyée avec succès");
      setInviteOpen(false);
      refetch();
      refetchInv();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi de l'invitation");
    }
  };

  const handleUpdatePermissions = async (memberId: number, role: TeamRole, permissions: string) => {
    try {
      await updatePermsMutation.mutateAsync({ memberId, role, permissions });
      toast.success("Permissions mises à jour");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    }
  };

  const handleRemove = async (memberId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer ce membre de l'équipe ?")) return;
    try {
      await removeMutation.mutateAsync({ memberId });
      toast.success("Membre retiré de l'équipe");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  const handleCancelInvitation = async (invitationId: number) => {
    try {
      await cancelInvMutation.mutateAsync({ invitationId });
      toast.success("Invitation annulée");
      refetchInv();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'annulation");
    }
  };

  const pendingInvitations = invitations?.filter((inv: any) => inv.status === "PENDING") || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-display flex items-center gap-2">
                <Users className="w-6 h-6 sm:w-7 sm:h-7" />
                Mon Équipe
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Gérez les accès de vos collaborateurs
              </p>
            </div>
          </div>
          {isOwner && !isAdmin && (
            <Button className="gap-2" onClick={() => setInviteOpen(true)}>
              <Plus className="w-4 h-4" />
              Inviter un collaborateur
            </Button>
          )}
        </div>

        {/* Members */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Membres de l'équipe</CardTitle>
            <CardDescription>
              {members?.length || 0} membre(s) dans votre équipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={4} columns={4} />
            ) : members && members.length > 0 ? (
              <div className="space-y-3">
                {members.map((member: any) => {
                  const roleLabel = ROLE_LABELS[member.role as TeamRole] || member.role;
                  const roleColor = ROLE_COLORS[member.role as TeamRole] || "bg-muted text-foreground";
                  const perms = member.permissions
                    ? typeof member.permissions === "string"
                      ? JSON.parse(member.permissions)
                      : member.permissions
                    : null;

                  // Count active permissions
                  let activePerms = 0;
                  let totalPerms = 0;
                  if (perms) {
                    for (const [catKey, cat] of Object.entries(PERMISSION_CATEGORIES)) {
                      if (catKey === "team" || catKey === "profile") continue;
                      for (const actKey of Object.keys(cat.actions)) {
                        totalPerms++;
                        const val = perms[catKey]?.[actKey];
                        if (val === true || val === "all" || val === "assigned") activePerms++;
                      }
                    }
                  }

                  return (
                    <div
                      key={member.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-primary">
                            {(member.userName || member.userEmail || "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{member.userName || "—"}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.userEmail || "—"}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            <Badge className={roleColor + " text-[10px]"}>{roleLabel}</Badge>
                            {perms && (
                              <Badge variant="outline" className="text-[10px]">
                                {activePerms}/{totalPerms} permissions
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {isOwner && member.role !== "OWNER" && (
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setEditMember(member); setEditOpen(true); }}
                          >
                            <Settings2 className="w-3.5 h-3.5 mr-1" />
                            Permissions
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemove(member.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                {isAdmin ? (
                  <>
                    <p className="text-muted-foreground">Gestion d'équipe admin</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Pour gérer les équipes des partenaires, rendez-vous dans la section
                      <a href="/admin/users" className="text-primary hover:underline ml-1">Utilisateurs</a> du panneau admin.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cette page est destinée aux comptes partenaires pour gérer leurs collaborateurs internes.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground">Aucun membre dans votre équipe</p>
                    {isOwner && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Cliquez sur "Inviter un collaborateur" pour ajouter des membres
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Invitations en attente
              </CardTitle>
              <CardDescription>
                {pendingInvitations.length} invitation(s) en attente de réponse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingInvitations.map((inv: any) => (
                  <div
                    key={inv.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card gap-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{inv.email}</p>
                      <div className="flex gap-1.5 mt-1">
                        <Badge className={ROLE_COLORS[inv.role as TeamRole] || "bg-muted text-foreground"} >
                          {ROLE_LABELS[inv.role as TeamRole] || inv.role}
                        </Badge>
                        <Badge variant="secondary" className="bg-amber-500/15 text-amber-800 dark:text-amber-400 text-[10px]">
                          <Clock className="w-3 h-3 mr-1" />
                          En attente
                        </Badge>
                      </div>
                    </div>
                    {isOwner && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleCancelInvitation(inv.id)}
                        disabled={cancelInvMutation.isPending}
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Annuler
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        <InviteDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          onInvite={handleInvite}
          isPending={inviteMutation.isPending}
        />

        {editMember && (
          <EditPermissionsDialog
            member={editMember}
            open={editOpen}
            onOpenChange={(open) => {
              setEditOpen(open);
              if (!open) setEditMember(null);
            }}
            onSave={handleUpdatePermissions}
            isPending={updatePermsMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
