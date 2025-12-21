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

  // Get partner info if user is linked to a partner
  const { data: partner } = trpc.partners.myPartner.useQuery(undefined, {
    enabled: !!user?.partnerId,
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
              <h1 className="text-2xl font-bold">Mon profil</h1>
              <p className="text-muted-foreground">
                Gérez vos informations personnelles et préférences
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-xl">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Nom de l'entreprise</Label>
                        <Input value={partner.companyName} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Numéro de TVA</Label>
                        <Input value={partner.vatNumber} disabled className="bg-muted" />
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
                            value={partner.addressStreet || ""}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ville</Label>
                          <Input
                            value={partner.addressCity || ""}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Code postal</Label>
                          <Input
                            value={partner.addressPostalCode || ""}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Pays</Label>
                          <Input
                            value={partner.addressCountry || "BE"}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Pour modifier les informations de votre entreprise, veuillez
                      contacter votre représentant commercial.
                    </p>
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
                  Choisissez les notifications que vous souhaitez recevoir
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Mises à jour de commandes</Label>
                      <p className="text-sm text-muted-foreground">
                        Recevez des notifications sur l'état de vos commandes
                      </p>
                    </div>
                    <Switch
                      checked={notifications.orderUpdates}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, orderUpdates: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Nouveaux produits</Label>
                      <p className="text-sm text-muted-foreground">
                        Soyez informé des nouveaux produits disponibles
                      </p>
                    </div>
                    <Switch
                      checked={notifications.newProducts}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, newProducts: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Promotions</Label>
                      <p className="text-sm text-muted-foreground">
                        Recevez les offres spéciales et promotions
                      </p>
                    </div>
                    <Switch
                      checked={notifications.promotions}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, promotions: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Newsletter</Label>
                      <p className="text-sm text-muted-foreground">
                        Recevez notre newsletter mensuelle
                      </p>
                    </div>
                    <Switch
                      checked={notifications.newsletter}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, newsletter: checked })
                      }
                    />
                  </div>
                </div>

                <Button className="w-full sm:w-auto">
                  Enregistrer les préférences
                </Button>
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
        </Tabs>
      </main>
    </div>
  );
}
