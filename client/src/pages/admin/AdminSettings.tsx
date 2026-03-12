import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  Building2, 
  Mail, 
  CreditCard, 
  Bell, 
  Globe,
  Save,
  Percent,
  Truck,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3,
  ShoppingBag,
  Megaphone,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompanySettings {
  companyName: string;
  legalName: string;
  vatNumber: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
}

interface PartnerLevel {
  level: string;
  discount: number;
  minOrders: number;
}

interface NotificationSettings {
  emailNewOrder: boolean;
  emailOrderStatus: boolean;
  emailLowStock: boolean;
  emailNewPartner: boolean;
  stockAlertThreshold: number;
}

interface ShippingSettings {
  defaultShippingCost: number;
  expressShippingCost: number;
  estimatedDeliveryDays: number;
}

interface TaxSettings {
  vatRate: number;
  vatLabel: string;
}

const DEFAULT_COMPANY: CompanySettings = {
  companyName: "",
  legalName: "",
  vatNumber: "",
  address: "",
  city: "",
  postalCode: "",
  country: "BE",
  phone: "",
  email: "",
  website: "",
};

const DEFAULT_LEVELS: PartnerLevel[] = [
  { level: "BRONZE", discount: 0, minOrders: 0 },
  { level: "SILVER", discount: 5, minOrders: 5 },
  { level: "GOLD", discount: 10, minOrders: 15 },
  { level: "PLATINUM", discount: 15, minOrders: 30 },
  { level: "VIP", discount: 20, minOrders: 50 },
];

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  emailNewOrder: true,
  emailOrderStatus: true,
  emailLowStock: true,
  emailNewPartner: true,
  stockAlertThreshold: 5,
};

const DEFAULT_SHIPPING: ShippingSettings = {
  defaultShippingCost: 150,
  expressShippingCost: 300,
  estimatedDeliveryDays: 14,
};

const DEFAULT_TAX: TaxSettings = {
  vatRate: 0,
  vatLabel: "TVA",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // State for each settings group
  const [companySettings, setCompanySettings] = useState<CompanySettings>(DEFAULT_COMPANY);
  const [partnerLevels, setPartnerLevels] = useState<PartnerLevel[]>(DEFAULT_LEVELS);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(DEFAULT_TAX);

  // ─── Data fetching ──────────────────────────────────────────────────────────

  const { data: allSettings, isLoading } = trpc.settings.getAll.useQuery();
  const { data: integrations, isLoading: integrationsLoading } = trpc.settings.integrationStatus.useQuery();
  const updateMultipleMutation = trpc.settings.updateMultiple.useMutation();
  const utils = trpc.useUtils();

  // Populate state from server data
  useEffect(() => {
    if (allSettings) {
      if (allSettings.company) {
        setCompanySettings({ ...DEFAULT_COMPANY, ...allSettings.company });
      }
      if (allSettings.partner_levels && Array.isArray(allSettings.partner_levels)) {
        setPartnerLevels(allSettings.partner_levels);
      }
      if (allSettings.notifications) {
        setNotificationSettings({ ...DEFAULT_NOTIFICATIONS, ...allSettings.notifications });
      }
      if (allSettings.shipping) {
        // Remove freeShippingThreshold from old settings if present
        const { freeShippingThreshold, ...cleanShipping } = allSettings.shipping as any;
        setShippingSettings({ ...DEFAULT_SHIPPING, ...cleanShipping });
      }
      if (allSettings.tax) {
        setTaxSettings({ ...DEFAULT_TAX, ...allSettings.tax });
      }
    }
  }, [allSettings]);

  // Track changes
  const updateCompany = (patch: Partial<CompanySettings>) => {
    setCompanySettings((prev) => ({ ...prev, ...patch }));
    setHasChanges(true);
  };

  const updateLevel = (index: number, field: "discount" | "minOrders", value: number) => {
    setPartnerLevels((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setHasChanges(true);
  };

  const updateNotification = (patch: Partial<NotificationSettings>) => {
    setNotificationSettings((prev) => ({ ...prev, ...patch }));
    setHasChanges(true);
  };

  const updateShipping = (patch: Partial<ShippingSettings>) => {
    setShippingSettings((prev) => ({ ...prev, ...patch }));
    setHasChanges(true);
  };

  const updateTax = (patch: Partial<TaxSettings>) => {
    setTaxSettings((prev) => ({ ...prev, ...patch }));
    setHasChanges(true);
  };

  // ─── Save handler ───────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMultipleMutation.mutateAsync({
        settings: [
          { key: "company", value: companySettings, description: "Informations entreprise" },
          { key: "partner_levels", value: partnerLevels, description: "Niveaux partenaires et remises" },
          { key: "shipping", value: shippingSettings, description: "Paramètres de livraison" },
          { key: "tax", value: taxSettings, description: "Paramètres de TVA" },
          { key: "notifications", value: notificationSettings, description: "Paramètres de notifications" },
        ],
      });
      utils.settings.getAll.invalidate();
      setHasChanges(false);
      toast.success("Paramètres enregistrés avec succès");
    } catch {
      toast.error("Erreur lors de l'enregistrement des paramètres");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Integration status helper ──────────────────────────────────────────────

  const IntegrationCard = ({
    title,
    description,
    icon: Icon,
    connected,
    statusLabel,
    details,
  }: {
    title: string;
    description: string;
    icon: React.ElementType;
    connected: boolean;
    statusLabel: string;
    details?: string;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          className={`flex items-center justify-between p-4 rounded-lg border ${
            connected
              ? "bg-emerald-500/10 border-emerald-500/20"
              : "bg-muted/50 border-border"
          }`}
        >
          <div className="flex items-center gap-2">
            {connected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 text-muted-foreground" />
            )}
            <span
              className={`font-medium text-sm ${
                connected ? "text-emerald-800" : "text-muted-foreground"
              }`}
            >
              {statusLabel}
            </span>
          </div>
        </div>
        {details && (
          <p className="text-xs text-muted-foreground">{details}</p>
        )}
      </CardContent>
    </Card>
  );

  // ─── Loading state ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Chargement des paramètres…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Paramètres</h1>
            <p className="text-muted-foreground mt-1">
              Configuration générale de la plateforme
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="flex items-center gap-1 text-sm text-amber-600">
                <AlertCircle className="w-4 h-4" />
                Modifications non enregistrées
              </span>
            )}
            <Button onClick={handleSave} disabled={isSaving || !hasChanges} className="gap-2">
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="w-4 h-4" />
              Entreprise
            </TabsTrigger>
            <TabsTrigger value="partners" className="gap-2">
              <Percent className="w-4 h-4" />
              Niveaux
            </TabsTrigger>
            <TabsTrigger value="tax" className="gap-2">
              <Percent className="w-4 h-4" />
              TVA
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

          {/* ── Company Settings ─────────────────────────────────────────── */}
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
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nom commercial</Label>
                    <Input
                      id="companyName"
                      value={companySettings.companyName}
                      onChange={(e) => updateCompany({ companyName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legalName">Raison sociale</Label>
                    <Input
                      id="legalName"
                      value={companySettings.legalName}
                      onChange={(e) => updateCompany({ legalName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vatNumber">Numéro de TVA</Label>
                    <Input
                      id="vatNumber"
                      value={companySettings.vatNumber}
                      onChange={(e) => updateCompany({ vatNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={companySettings.phone}
                      onChange={(e) => updateCompany({ phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={companySettings.address}
                    onChange={(e) => updateCompany({ address: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Code postal</Label>
                    <Input
                      id="postalCode"
                      value={companySettings.postalCode}
                      onChange={(e) => updateCompany({ postalCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={companySettings.city}
                      onChange={(e) => updateCompany({ city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Pays</Label>
                    <Select 
                      value={companySettings.country} 
                      onValueChange={(v) => updateCompany({ country: v })}
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
                        <SelectItem value="CH">Suisse</SelectItem>
                        <SelectItem value="ES">Espagne</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de contact</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companySettings.email}
                      onChange={(e) => updateCompany({ email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Site web</Label>
                    <Input
                      id="website"
                      value={companySettings.website}
                      onChange={(e) => updateCompany({ website: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Partner Levels ────────────────────────────────────────────── */}
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
                      <div className="flex-1 grid gap-4 grid-cols-1 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Remise (%)</Label>
                          <Input
                            type="number"
                            value={level.discount}
                            onChange={(e) => updateLevel(index, "discount", Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Commandes min. requises</Label>
                          <Input
                            type="number"
                            value={level.minOrders}
                            onChange={(e) => updateLevel(index, "minOrders", Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tax Settings ─────────────────────────────────────────────── */}
          <TabsContent value="tax">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5" />
                  Paramètres de TVA
                </CardTitle>
                <CardDescription>
                  Configurez le taux de TVA général appliqué à tous les produits du site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Taux de TVA général (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={taxSettings.vatRate}
                      onChange={(e) => updateTax({ vatRate: Number(e.target.value) })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Taux appliqué à tous les produits et services. Actuellement à {taxSettings.vatRate}%.
                      Exemples : 0% (exonéré), 20% (France), 21% (Belgique)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Libellé de la taxe</Label>
                    <Input
                      value={taxSettings.vatLabel}
                      onChange={(e) => updateTax({ vatLabel: e.target.value })}
                      placeholder="TVA"
                    />
                    <p className="text-xs text-muted-foreground">
                      Nom affiché sur les factures et récapitulatifs (ex: TVA, VAT, Tax)
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Le taux de TVA est actuellement à <strong>{taxSettings.vatRate}%</strong>. 
                      Toute modification sera appliquée immédiatement à toutes les nouvelles commandes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Shipping Settings ─────────────────────────────────────────── */}
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
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Frais de livraison standard (€)</Label>
                    <Input
                      type="number"
                      value={shippingSettings.defaultShippingCost}
                      onChange={(e) => updateShipping({ defaultShippingCost: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frais de livraison express (€)</Label>
                    <Input
                      type="number"
                      value={shippingSettings.expressShippingCost}
                      onChange={(e) => updateShipping({ expressShippingCost: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Délai de livraison estimé (jours)</Label>
                    <Input
                      type="number"
                      value={shippingSettings.estimatedDeliveryDays}
                      onChange={(e) => updateShipping({ estimatedDeliveryDays: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Notification Settings ─────────────────────────────────────── */}
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
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Recevoir un email à chaque nouvelle commande
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNewOrder}
                      onCheckedChange={(checked) => updateNotification({ emailNewOrder: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Changement de statut</p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Notifier les partenaires des changements de statut
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailOrderStatus}
                      onCheckedChange={(checked) => updateNotification({ emailOrderStatus: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Alerte stock bas</p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Recevoir une alerte quand le stock est bas
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailLowStock}
                      onCheckedChange={(checked) => updateNotification({ emailLowStock: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Nouveau partenaire</p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Recevoir un email pour chaque nouvelle inscription
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNewPartner}
                      onCheckedChange={(checked) => updateNotification({ emailNewPartner: checked })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Seuil d'alerte de stock</Label>
                  <Input
                    type="number"
                    value={notificationSettings.stockAlertThreshold}
                    onChange={(e) => updateNotification({ stockAlertThreshold: Number(e.target.value) })}
                    className="w-32"
                  />
                  <p className="text-xs text-muted-foreground">
                    Alerte quand le stock descend en dessous de cette quantité
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Integrations ──────────────────────────────────────────────── */}
          <TabsContent value="integrations">
            {integrationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <IntegrationCard
                  title="Stripe (Paiements)"
                  description="Traitement des paiements et acomptes"
                  icon={CreditCard}
                  connected={integrations?.stripe?.connected ?? false}
                  statusLabel={
                    integrations?.stripe?.connected
                      ? `Connecté (Mode ${integrations.stripe.mode === "live" ? "production" : "test"})`
                      : "Non connecté"
                  }
                  details={
                    integrations?.stripe?.connected
                      ? integrations.stripe.mode === "test"
                        ? "Les paiements sont en mode test. Aucun paiement réel ne sera traité."
                        : "Mode production actif. Les paiements réels sont traités."
                      : "Configurez la clé API Stripe dans les secrets pour activer les paiements."
                  }
                />

                <IntegrationCard
                  title="Resend (Emails)"
                  description="Service d'envoi d'emails transactionnels"
                  icon={Mail}
                  connected={integrations?.resend?.connected ?? false}
                  statusLabel={
                    integrations?.resend?.connected
                      ? "Connecté"
                      : "Non configuré"
                  }
                  details={
                    integrations?.resend?.connected
                      ? `Emails envoyés depuis : ${integrations.resend.from || "adresse par défaut"}`
                      : "Configurez la clé API Resend dans les secrets pour activer les emails automatiques."
                  }
                />

                <IntegrationCard
                  title="Meta Ads (Leads)"
                  description="Intégration Meta Lead Ads pour la génération de leads"
                  icon={Megaphone}
                  connected={integrations?.meta?.connected ?? false}
                  statusLabel={
                    integrations?.meta?.connected
                      ? "Connecté"
                      : "Non connecté"
                  }
                  details={
                    integrations?.meta?.connected
                      ? "Les leads Meta sont automatiquement importés et distribués aux partenaires."
                      : "Connectez votre compte Meta Ads depuis le dashboard Marketing."
                  }
                />

                <IntegrationCard
                  title="Google Ads"
                  description="Suivi des campagnes Google Ads"
                  icon={BarChart3}
                  connected={integrations?.googleAds?.connected ?? false}
                  statusLabel={
                    integrations?.googleAds?.connected
                      ? "Connecté"
                      : "Non connecté"
                  }
                  details={
                    integrations?.googleAds?.connected
                      ? "Les données Google Ads sont synchronisées automatiquement."
                      : "Connectez votre compte Google Ads depuis le dashboard Marketing."
                  }
                />

                <IntegrationCard
                  title="Google Analytics 4"
                  description="Analyse du trafic et des conversions"
                  icon={BarChart3}
                  connected={integrations?.ga4?.connected ?? false}
                  statusLabel={
                    integrations?.ga4?.connected
                      ? `Connecté (Property: ${integrations.ga4.propertyId})`
                      : "Non connecté"
                  }
                  details={
                    integrations?.ga4?.connected
                      ? "Les données GA4 sont disponibles dans le dashboard Marketing."
                      : "Configurez le GA4 Property ID dans les secrets pour activer l'analytics."
                  }
                />

                <IntegrationCard
                  title="Shopify"
                  description="Synchronisation avec votre boutique Shopify"
                  icon={ShoppingBag}
                  connected={integrations?.shopify?.connected ?? false}
                  statusLabel={
                    integrations?.shopify?.connected
                      ? `Connecté (${integrations.shopify.storeDomain})`
                      : "Non connecté"
                  }
                  details={
                    integrations?.shopify?.connected
                      ? "Les commandes et produits Shopify sont synchronisés."
                      : "Configurez les identifiants Shopify dans les secrets pour activer la synchronisation."
                  }
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
