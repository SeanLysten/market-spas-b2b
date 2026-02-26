import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
// Note: Using alert for now, can be replaced with toast component
import { useState, useEffect } from "react";
import {
  User,
  Building2,
  MapPin,
  Bell,
  Shield,
  Save,
  ArrowLeft,
  Users,
  Mail,
  Trash2,
  Edit,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Link } from "wouter";

export default function Profile() {
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    preferredLanguage: "fr",
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    newProducts: true,
    promotions: false,
    newsletter: true,
  });

  // Company form state
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyData, setCompanyData] = useState({
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
  });

  // Get partner info if user is linked to a partner
  const { data: partner, refetch: refetchPartner } = trpc.partners.myPartner.useQuery(undefined, {
    enabled: !!user?.partnerId,
  });

  // Update company mutation
  const updateCompanyMutation = trpc.partners.updateMyPartner.useMutation({
    onSuccess: () => {
      alert("Informations entreprise mises à jour avec succès!");
      setIsEditingCompany(false);
      refetchPartner();
    },
    onError: (error) => {
      alert("Erreur lors de la mise à jour: " + error.message);
    },
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        preferredLanguage: "fr",
      });
    }
  }, [user]);

  useEffect(() => {
    if (partner) {
      setCompanyData({
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
      });
    }
  }, [partner]);

  // Note: updateProfile mutation would need to be added to the router
  const handleSaveProfile = () => {
    alert("Profil mis à jour avec succès!");
    setIsEditing(false);
  };

  const handleSave = () => {
    handleSaveProfile();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl text-display text-display font-bold">Mon profil</h1>
              <p className="text-muted-foreground">
                Gérez vos informations personnelles et préférences
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl">
            <TabsTrigger value="personal" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Personnel</span>
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Entreprise</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Sécurité</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Équipe</span>
            </TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Informations personnelles</CardTitle>
                    <CardDescription>
                      Vos informations de contact et préférences
                    </CardDescription>
                  </div>
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                  >
                    {isEditing ? (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer
                      </>
                    ) : (
                      "Modifier"
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      L'email ne peut pas être modifié
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      disabled={!isEditing}
                      placeholder="+32 XXX XX XX XX"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Langue préférée</Label>
                  <div className="flex gap-2">
                    {[
                      { code: "fr", label: "Français", flag: "🇫🇷" },
                      { code: "nl", label: "Nederlands", flag: "🇳🇱" },
                      { code: "en", label: "English", flag: "🇬🇧" },
                    ].map((lang) => (
                      <Button
                        key={lang.code}
                        variant={
                          formData.preferredLanguage === lang.code
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          isEditing &&
                          setFormData({ ...formData, preferredLanguage: lang.code })
                        }
                        disabled={!isEditing}
                        className="gap-2"
                      >
                        <span>{lang.flag}</span>
                        <span className="hidden sm:inline">{lang.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Information */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Informations entreprise</CardTitle>
                <CardDescription>
                  Détails de votre entreprise partenaire
                </CardDescription>
              </CardHeader>
              <CardContent>
                {partner ? (
                  <div className="space-y-6">
                    <div className="flex justify-end mb-4">
                      {isEditingCompany ? (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsEditingCompany(false);
                              // Reset form
                              if (partner) {
                                setCompanyData({
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
                                });
                              }
                            }}
                          >
                            Annuler
                          </Button>
                          <Button
                            onClick={() => updateCompanyMutation.mutate(companyData)}
                            disabled={updateCompanyMutation.isPending}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {updateCompanyMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={() => setIsEditingCompany(true)} variant="outline">
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Nom de l'entreprise</Label>
                        <Input
                          value={companyData.companyName}
                          onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
                          disabled={!isEditingCompany}
                          className={!isEditingCompany ? "bg-muted" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Numéro de TVA</Label>
                        <Input
                          value={companyData.vatNumber}
                          onChange={(e) => setCompanyData({ ...companyData, vatNumber: e.target.value })}
                          disabled={!isEditingCompany}
                          className={!isEditingCompany ? "bg-muted" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Niveau partenaire</Label>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              partner.level === "PLATINUM" || partner.level === "VIP"
                                ? "bg-purple-100 text-purple-700"
                                : partner.level === "GOLD"
                                ? "bg-yellow-100 text-yellow-700"
                                : partner.level === "SILVER"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {partner.level}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({partner.discountPercent}% de remise)
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Statut</Label>
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                            partner.status === "APPROVED"
                              ? "bg-green-100 text-green-700"
                              : partner.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {partner.status === "APPROVED"
                            ? "Approuvé"
                            : partner.status === "PENDING"
                            ? "En attente"
                            : "Suspendu"}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Adresse
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Rue</Label>
                        <Input
                          value={companyData.addressStreet}
                          onChange={(e) => setCompanyData({ ...companyData, addressStreet: e.target.value })}
                          disabled={!isEditingCompany}
                          className={!isEditingCompany ? "bg-muted" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ville</Label>
                        <Input
                          value={companyData.addressCity}
                          onChange={(e) => setCompanyData({ ...companyData, addressCity: e.target.value })}
                          disabled={!isEditingCompany}
                          className={!isEditingCompany ? "bg-muted" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Code postal</Label>
                        <Input
                          value={companyData.addressPostalCode}
                          onChange={(e) => setCompanyData({ ...companyData, addressPostalCode: e.target.value })}
                          disabled={!isEditingCompany}
                          className={!isEditingCompany ? "bg-muted" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Pays</Label>
                        <Input
                          value={companyData.addressCountry}
                          onChange={(e) => setCompanyData({ ...companyData, addressCountry: e.target.value })}
                          disabled={!isEditingCompany}
                          className={!isEditingCompany ? "bg-muted" : ""}
                        />
                      </div>
                      </div>
                    </div>


                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Vous n'êtes pas encore associé à une entreprise partenaire.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Contactez-nous pour devenir partenaire.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Préférences de notifications</CardTitle>
                <CardDescription>
                  Personnalisez vos notifications pour chaque type d'événement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border border-border bg-muted/50 p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <h3 className="font-medium">Gérer vos préférences de notification</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Choisissez de recevoir des notifications toast (dans l'application) et/ou par email pour chaque type d'événement : commandes, SAV, leads, alertes système, etc.
                      </p>
                    </div>
                  </div>
                  <Link href="/notification-preferences">
                    <Button className="w-full sm:w-auto">
                      Configurer mes préférences
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Sécurité du compte</CardTitle>
                <CardDescription>
                  Gérez la sécurité de votre compte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Authentification</h4>
                        <p className="text-sm text-muted-foreground">
                          Vous êtes connecté via Manus OAuth
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        Sécurisé
                      </span>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Dernière connexion</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date().toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Sessions actives</h4>
                        <p className="text-sm text-muted-foreground">
                          1 session active sur cet appareil
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Voir les sessions
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Management */}
          <TabsContent value="team">
            <TeamManagementTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Team Management Component
function TeamManagementTab() {
  const { user } = useAuth();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"SALES_REP" | "ORDER_MANAGER" | "ACCOUNTANT" | "FULL_MANAGER">("SALES_REP");

  // Fetch team members and invitations
  const { data: teamMembers, refetch: refetchMembers } = trpc.team.list.useQuery();
  const { data: invitations, refetch: refetchInvitations } = trpc.team.listInvitations.useQuery();

  // Mutations
  const inviteMutation = trpc.team.invite.useMutation({
    onSuccess: () => {
      alert("Invitation envoyée avec succès!");
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteRole("SALES_REP");
      refetchInvitations();
    },
    onError: (error) => {
      alert(`Erreur: ${error.message}`);
    },
  });

  const cancelInvitationMutation = trpc.team.cancelInvitation.useMutation({
    onSuccess: () => {
      alert("Invitation annulée");
      refetchInvitations();
    },
  });

  const removeMemberMutation = trpc.team.remove.useMutation({
    onSuccess: () => {
      alert("Membre supprimé de l'équipe");
      refetchMembers();
    },
    onError: (error) => {
      alert(`Erreur: ${error.message}`);
    },
  });

  const handleInvite = () => {
    if (!inviteEmail) {
      alert("Veuillez entrer une adresse email");
      return;
    }
    inviteMutation.mutate({
      email: inviteEmail,
      role: inviteRole,
    });
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      OWNER: "Propriétaire",
      SALES_REP: "Commercial Leads",
      ORDER_MANAGER: "Gestionnaire Commandes",
      ACCOUNTANT: "Comptable",
      FULL_MANAGER: "Gestionnaire Complet",
    };
    return labels[role] || role;
  };

  const getRoleDescription = (role: string) => {
    const descriptions: Record<string, string> = {
      OWNER: "Accès complet à toutes les fonctionnalités",
      SALES_REP: "Accès uniquement aux leads assignés",
      ORDER_MANAGER: "Gestion du catalogue et des commandes",
      ACCOUNTANT: "Consultation des factures et export des données financières",
      FULL_MANAGER: "Accès complet sauf gestion d'équipe",
    };
    return descriptions[role] || "";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestion de l'équipe</CardTitle>
              <CardDescription>
                Invitez des membres de votre équipe et gérez leurs accès
              </CardDescription>
            </div>
            <Button onClick={() => setShowInviteDialog(true)}>
              <Mail className="w-4 h-4 mr-2" />
              Inviter un membre
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Team Members List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Membres de l'équipe</h3>
            {!teamMembers || teamMembers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucun membre d'équipe pour le moment
              </p>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{member.user?.name || member.user?.email}</p>
                        <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium">{getRoleLabel(member.role)}</p>
                        <p className="text-xs text-muted-foreground">
                          {getRoleDescription(member.role)}
                        </p>
                      </div>
                      {member.userId !== user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Voulez-vous vraiment supprimer ce membre?")) {
                              removeMemberMutation.mutate({ memberId: member.id });
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Pending Invitations */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Invitations en attente</h3>
            {!invitations || invitations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucune invitation en attente
              </p>
            ) : (
              <div className="space-y-3">
                {invitations.map((invitation: any) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Invité le{" "}
                          {new Date(invitation.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium">{getRoleLabel(invitation.role)}</p>
                        <p className="text-xs text-muted-foreground">
                          Expire le {new Date(invitation.expiresAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Voulez-vous annuler cette invitation?")) {
                            cancelInvitationMutation.mutate({ invitationId: invitation.id });
                          }
                        }}
                      >
                        <XCircle className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      {showInviteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Inviter un membre</CardTitle>
              <CardDescription>
                Entrez l'adresse email et sélectionnez le rôle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Adresse email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="exemple@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-role">Rôle</Label>
                <select
                  id="invite-role"
                  className="w-full p-2 border rounded-lg"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                >
                  <option value="SALES_REP">Commercial Leads</option>
                  <option value="ORDER_MANAGER">Gestionnaire Commandes</option>
                  <option value="ACCOUNTANT">Comptable</option>
                  <option value="FULL_MANAGER">Gestionnaire Complet</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  {getRoleDescription(inviteRole)}
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowInviteDialog(false);
                    setInviteEmail("");
                  }}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleInvite}
                  disabled={inviteMutation.isPending}
                >
                  {inviteMutation.isPending ? "Envoi..." : "Envoyer l'invitation"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
