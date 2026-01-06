import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Settings, 
  Building2, 
  Mail, 
  CreditCard, 
  Bell, 
  Shield, 
  Globe,
  Save,
  Percent,
  Truck,
  FileText
} from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const [isSaving, setIsSaving] = useState(false);

  // Company settings
  const [companySettings, setCompanySettings] = useState({
    companyName: "Market Spas",
    legalName: "Market Spas SPRL",
    vatNumber: "BE0123456789",
    address: "Rue du Commerce 123",
    city: "Bruxelles",
    postalCode: "1000",
    country: "BE",
    phone: "+32 2 123 45 67",
    email: "contact@marketspas.be",
    website: "https://www.marketspas.be",
  });

  // Partner levels settings
  const [partnerLevels, setPartnerLevels] = useState([
    { level: "BRONZE", discount: 0, minOrders: 0 },
    { level: "SILVER", discount: 5, minOrders: 5 },
    { level: "GOLD", discount: 10, minOrders: 15 },
    { level: "PLATINUM", discount: 15, minOrders: 30 },
    { level: "VIP", discount: 20, minOrders: 50 },
  ]);

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNewOrder: true,
    emailOrderStatus: true,
    emailLowStock: true,
    emailNewPartner: true,
    stockAlertThreshold: 5,
  });

  // Shipping settings
  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: 5000,
    defaultShippingCost: 150,
    expressShippingCost: 300,
    estimatedDeliveryDays: 14,
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Paramètres enregistrés avec succès");
    setIsSaving(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Paramètres</h1>
            <p className="text-muted-foreground mt-1">
              Configuration générale de la plateforme
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>

        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="w-4 h-4" />
              Entreprise
            </TabsTrigger>
            <TabsTrigger value="partners" className="gap-2">
              <Percent className="w-4 h-4" />
              Niveaux
            </TabsTrigger>
            <TabsTrigger value="shipping" className="gap-2">
              <Truck className="w-4 h-4" />
              Livraison
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Globe className="w-4 h-4" />
              Intégrations
            </TabsTrigger>
          </TabsList>

          {/* Company Settings */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Informations de l'entreprise
                </CardTitle>
                <CardDescription>
                  Informations légales et coordonnées de votre entreprise
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nom commercial</Label>
                    <Input
                      id="companyName"
                      value={companySettings.companyName}
                      onChange={(e) => setCompanySettings({ ...companySettings, companyName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legalName">Raison sociale</Label>
                    <Input
                      id="legalName"
                      value={companySettings.legalName}
                      onChange={(e) => setCompanySettings({ ...companySettings, legalName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vatNumber">Numéro de TVA</Label>
                    <Input
                      id="vatNumber"
                      value={companySettings.vatNumber}
                      onChange={(e) => setCompanySettings({ ...companySettings, vatNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={companySettings.phone}
                      onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Code postal</Label>
                    <Input
                      id="postalCode"
                      value={companySettings.postalCode}
                      onChange={(e) => setCompanySettings({ ...companySettings, postalCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={companySettings.city}
                      onChange={(e) => setCompanySettings({ ...companySettings, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Pays</Label>
                    <Select 
                      value={companySettings.country} 
                      onValueChange={(v) => setCompanySettings({ ...companySettings, country: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BE">Belgique</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="NL">Pays-Bas</SelectItem>
                        <SelectItem value="LU">Luxembourg</SelectItem>
                        <SelectItem value="DE">Allemagne</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de contact</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companySettings.email}
                      onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Site web</Label>
                    <Input
                      id="website"
                      value={companySettings.website}
                      onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Partner Levels */}
          <TabsContent value="partners">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5" />
                  Niveaux partenaires et remises
                </CardTitle>
                <CardDescription>
                  Configurez les remises accordées à chaque niveau de partenaire
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(partnerLevels || []).map((level, index) => (
                    <div key={level.level} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-24 font-semibold">{level.level}</div>
                      <div className="flex-1 grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Remise (%)</Label>
                          <Input
                            type="number"
                            value={level.discount}
                            onChange={(e) => {
                              const newLevels = [...partnerLevels];
                              newLevels[index].discount = Number(e.target.value);
                              setPartnerLevels(newLevels);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Commandes min. requises</Label>
                          <Input
                            type="number"
                            value={level.minOrders}
                            onChange={(e) => {
                              const newLevels = [...partnerLevels];
                              newLevels[index].minOrders = Number(e.target.value);
                              setPartnerLevels(newLevels);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shipping Settings */}
          <TabsContent value="shipping">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Paramètres de livraison
                </CardTitle>
                <CardDescription>
                  Configurez les frais et délais de livraison
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Seuil de livraison gratuite (€)</Label>
                    <Input
                      type="number"
                      value={shippingSettings.freeShippingThreshold}
                      onChange={(e) => setShippingSettings({ ...shippingSettings, freeShippingThreshold: Number(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Livraison gratuite au-dessus de ce montant
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Frais de livraison standard (€)</Label>
                    <Input
                      type="number"
                      value={shippingSettings.defaultShippingCost}
                      onChange={(e) => setShippingSettings({ ...shippingSettings, defaultShippingCost: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Frais de livraison express (€)</Label>
                    <Input
                      type="number"
                      value={shippingSettings.expressShippingCost}
                      onChange={(e) => setShippingSettings({ ...shippingSettings, expressShippingCost: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Délai de livraison estimé (jours)</Label>
                    <Input
                      type="number"
                      value={shippingSettings.estimatedDeliveryDays}
                      onChange={(e) => setShippingSettings({ ...shippingSettings, estimatedDeliveryDays: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Paramètres de notifications
                </CardTitle>
                <CardDescription>
                  Configurez les notifications email automatiques
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Nouvelle commande</p>
                      <p className="text-sm text-muted-foreground">
                        Recevoir un email à chaque nouvelle commande
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNewOrder}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNewOrder: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Changement de statut</p>
                      <p className="text-sm text-muted-foreground">
                        Notifier les partenaires des changements de statut
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailOrderStatus}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailOrderStatus: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Alerte stock bas</p>
                      <p className="text-sm text-muted-foreground">
                        Recevoir une alerte quand le stock est bas
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailLowStock}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailLowStock: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Nouveau partenaire</p>
                      <p className="text-sm text-muted-foreground">
                        Recevoir un email pour chaque nouvelle inscription
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNewPartner}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNewPartner: checked })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Seuil d'alerte de stock</Label>
                  <Input
                    type="number"
                    value={notificationSettings.stockAlertThreshold}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, stockAlertThreshold: Number(e.target.value) })}
                    className="w-32"
                  />
                  <p className="text-xs text-muted-foreground">
                    Alerte quand le stock descend en dessous de cette quantité
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Stripe (Paiements)
                  </CardTitle>
                  <CardDescription>
                    Configuration de l'intégration Stripe pour les paiements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="font-medium text-green-800">Connecté (Mode test)</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Configurer
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Les paiements sont actuellement en mode test. Aucun paiement réel ne sera traité.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Service d'emails
                  </CardTitle>
                  <CardDescription>
                    Configuration du service d'envoi d'emails transactionnels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                      <span className="font-medium text-yellow-800">Non configuré</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Configurer
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Connectez un service SMTP (SendGrid, Mailgun, etc.) pour activer les emails automatiques.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Odoo (Facturation)
                  </CardTitle>
                  <CardDescription>
                    Intégration avec Odoo pour la gestion comptable
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full" />
                      <span className="font-medium text-gray-600">Non connecté</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Connecter
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Connectez votre instance Odoo pour synchroniser les factures et contacts.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
