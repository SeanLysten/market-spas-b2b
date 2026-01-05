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
import { Plus, Mail, UserCheck, UserX, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminUsers() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "USER" as const,
    partnerId: "",
  });

  const { data: users, isLoading, refetch } = trpc.admin.users.list.useQuery();
  const safeUsers = Array.isArray(users) ? users : [];
  const inviteMutation = trpc.admin.users.invite.useMutation();
  const toggleActiveMutation = trpc.admin.users.toggleActive.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await inviteMutation.mutateAsync({
        email: formData.email,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        role: formData.role,
        partnerId: formData.partnerId ? parseInt(formData.partnerId) : undefined,
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

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: "bg-red-100 text-red-800",
      ADMIN: "bg-orange-100 text-orange-800",
      PARTNER: "bg-blue-100 text-blue-800",
      USER: "bg-gray-100 text-gray-800",
    };
    return colors[role] || colors.USER;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
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

                  <div className="space-y-2">
                    <Label htmlFor="role">Rôle *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">Utilisateur</SelectItem>
                        <SelectItem value="PARTNER">Partenaire</SelectItem>
                        <SelectItem value="ADMIN">Administrateur</SelectItem>
                        <SelectItem value="SUPER_ADMIN">Super Administrateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="partnerId">ID Partenaire (optionnel)</Label>
                    <Input
                      id="partnerId"
                      type="number"
                      value={formData.partnerId}
                      onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                      placeholder="Laisser vide si non applicable"
                    />
                    <p className="text-xs text-muted-foreground">
                      Associer cet utilisateur à un partenaire existant
                    </p>
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

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des utilisateurs</CardTitle>
            <CardDescription>
              {users?.length || 0} utilisateur(s) enregistré(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="skeleton h-16 w-full" />
                ))}
              </div>
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
                  {safeUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "—"}
                      </TableCell>
                      <TableCell>{user.email || "—"}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadge(user.role || "USER")}>
                          {user.role?.replace("_", " ") || "USER"}
                        </Badge>
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
      </div>
    </AdminLayout>
  );
}
