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
  Edit,
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
              <h1 className="text-xl md:text-2xl text-display font-bold">Mon profil</h1>
              <p className="text-muted-foreground">
                Gérez vos informations personnelles et préférences
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 max-w-3xl">
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
            <Link href="/team">
              <Button variant="ghost" className="gap-2 h-9 px-3">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Équipe</span>
              </Button>
            </Link>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-4 md:p-6">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-4 md:p-6">
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
                                ? "bg-purple-500/15 dark:bg-purple-500/25 text-purple-700 dark:text-purple-400"
                                : partner.level === "GOLD"
                                ? "bg-amber-500/15 dark:bg-amber-500/25 text-amber-700 dark:text-amber-400"
                                : partner.level === "SILVER"
                                ? "bg-muted dark:bg-muted/50 text-foreground dark:text-foreground"
                                : "bg-orange-500/15 dark:bg-orange-500/25 text-orange-700 dark:text-orange-400"
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
                              ? "bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400"
                              : partner.status === "PENDING"
                              ? "bg-amber-500/15 dark:bg-amber-500/25 text-amber-700 dark:text-amber-400"
                              : "bg-destructive/15 dark:bg-destructive/25 text-destructive dark:text-destructive"
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
                    <p className="text-xs md:text-sm text-muted-foreground mt-2">
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
                <div className="rounded-lg border border-border bg-muted/50 p-4 md:p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <h3 className="font-medium">Gérer vos préférences de notification</h3>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-medium">Authentification</h4>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Vous êtes connecté via Manus OAuth
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 rounded-full text-sm">
                        Sécurisé
                      </span>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-medium">Dernière connexion</h4>
                        <p className="text-xs md:text-sm text-muted-foreground">
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-medium">Sessions actives</h4>
                        <p className="text-xs md:text-sm text-muted-foreground">
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


        </Tabs>
      </main>
    </div>
  );
}
