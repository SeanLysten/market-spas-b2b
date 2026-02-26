import { useState, useEffect } from "react";
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
import { trpc } from "@/lib/trpc";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { TableSkeleton } from "@/components/TableSkeleton";
import { Plus, Mail, UserCheck, UserX, Edit, RotateCw, X, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/AdminLayout";

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

  const { data: usersData, isLoading, refetch } = trpc.admin.users.list.useQuery();
  const users = useSafeQuery(usersData);
  
  const { data: invitationsData, isLoading: invitationsLoading, refetch: refetchInvitations } = trpc.admin.users.listInvitations.useQuery();
  const invitations = useSafeQuery(invitationsData);
  
  const inviteMutation = trpc.admin.users.invite.useMutation();
  const toggleActiveMutation = trpc.admin.users.toggleActive.useMutation();
  const updateRoleMutation = trpc.admin.users.updateRole.useMutation();
  const cancelInvitationMutation = trpc.admin.users.cancelInvitation.useMutation();
  const resendInvitationMutation = trpc.admin.users.resendInvitation.useMutation();
  
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

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

  const handleUpdateRole = async (userId: number, newRole: string) => {
    try {
      await updateRoleMutation.mutateAsync({
        userId,
        role: newRole as 'SUPER_ADMIN' | 'ADMIN' | 'PARTNER',
      });
      toast.success("Rôle mis à jour avec succès");
      setEditingUserId(null);
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

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: "bg-red-100 text-red-800",
      ADMIN: "bg-orange-100 text-orange-800",
      PARTNER: "bg-blue-100 text-blue-800",
      USER: "bg-gray-100 text-gray-800",
    };
    return colors[role] || colors.USER;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
      case 'ACCEPTED':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Accepté
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Expiré
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
            <DialogContent className="max-w-md">
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

                  <div className="grid grid-cols-2 gap-4">
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
                </div>

                <DialogFooter>
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
          <TabsList>
            <TabsTrigger value="users">
              Utilisateurs ({users?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="invitations">
              Invitations ({invitations?.filter((inv: any) => inv.status === 'PENDING').length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Liste des utilisateurs</CardTitle>
                <CardDescription>
                  {users?.length || 0} utilisateur(s) enregistré(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <TableSkeleton rows={8} columns={7} />
                ) : users && users.length > 0 ? (
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
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "—"}
                          </TableCell>
                          <TableCell>{user.email || "—"}</TableCell>
                          <TableCell>
                            {editingUserId === user.id ? (
                              <Select
                                value={selectedRole}
                                onValueChange={(value) => {
                                  setSelectedRole(value);
                                  handleUpdateRole(user.id, value);
                                }}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PARTNER">Partenaire</SelectItem>
                                  <SelectItem value="ADMIN">Administrateur</SelectItem>
                                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge className={getRoleBadge(user.role || "USER")}>
                                {user.role?.replace("_", " ") || "USER"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{user.partnerId || "—"}</TableCell>
                          <TableCell>
                            {user.isActive ? (
                              <Badge className="bg-green-100 text-green-800">Actif</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">Inactif</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.lastSignedIn
                              ? new Date(user.lastSignedIn).toLocaleDateString("fr-FR")
                              : "Jamais"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingUserId(user.id);
                                  setSelectedRole(user.role || "PARTNER");
                                }}
                                title="Modifier le rôle"
                              >
                                <Edit className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(user.id, user.isActive || false)}
                                disabled={toggleActiveMutation.isPending}
                              >
                                {user.isActive ? (
                                  <UserX className="w-4 h-4 text-orange-600" />
                                ) : (
                                  <UserCheck className="w-4 h-4 text-green-600" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
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
                                  <RotateCw className="w-4 h-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelInvitation(invitation.id)}
                                  disabled={cancelInvitationMutation.isPending}
                                  title="Annuler l'invitation"
                                >
                                  <X className="w-4 h-4 text-red-600" />
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
                                <RotateCw className="w-4 h-4 text-blue-600" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Mail className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Aucune invitation envoyée</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Cliquez sur "Inviter un utilisateur" pour commencer
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
