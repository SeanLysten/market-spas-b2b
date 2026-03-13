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
  Code,
  Copy,
  ExternalLink,
  History,
  Clock,
  CheckCircle,
  XOctagon,
  Eye,
  ChevronLeft,
  ChevronRight,
  Key,
  Shield,
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
                  Réductions partenaires
                </CardTitle>
                <CardDescription>
                  Le système de réductions est géré par produit et par revendeur
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-medium mb-2">Comment fonctionnent les réductions ?</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">&bull;</span>
                        <span><strong>Remise globale</strong> : chaque partenaire a une remise par défaut appliquée sur tous les produits.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">&bull;</span>
                        <span><strong>Remise par produit</strong> : vous pouvez définir une remise spécifique pour chaque produit et chaque partenaire. Elle remplace la remise globale.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">&bull;</span>
                        <span><strong>Priorité</strong> : remise produit spécifique &gt; remise globale du partenaire.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Pour gérer les réductions, allez dans <strong>Partenaires</strong> &rarr; <strong>Modifier</strong> un partenaire &rarr; <strong>Réductions par produit</strong>.
                    </p>
                  </div>
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
              <>
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

              {/* Supplier API Documentation */}
              <Card className="mt-6 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Code className="w-5 h-5" />
                    API Fournisseur (Import Stock & Export Commandes)
                  </CardTitle>
                  <CardDescription>
                    Documentation des endpoints API pour l'intégration avec le système fournisseur
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Authentication */}
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <h4 className="font-semibold text-sm text-blue-800 dark:text-blue-300">Authentification requise</h4>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Tous les endpoints nécessitent le header <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded font-mono">X-API-Key</code> avec la clé API fournie.
                    </p>
                    <div className="bg-white dark:bg-slate-900 rounded p-2 flex items-center justify-between">
                      <code className="text-xs font-mono text-blue-800 dark:text-blue-300">X-API-Key: ••••••••••••••••</code>
                      <span className="text-xs text-muted-foreground ml-2">(Clé fournie séparément)</span>
                    </div>
                  </div>

                  {/* POST Import Stock */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-bold rounded">POST</span>
                      <h4 className="font-semibold text-sm">Import Stock</h4>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono text-primary break-all">
                          {window.location.origin}/api/supplier/stock/import
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 ml-2"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/api/supplier/stock/import`);
                            toast.success("URL copiée dans le presse-papier");
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Met à jour le stock et les quantités en transit des produits/variantes.
                        Le matching se fait par <strong>CodeProduit</strong> (supplierProductCode) ou <strong>Ean13</strong>.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground">Format JSON attendu :</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const example = JSON.stringify({
                              key: "ExportStockVotreSociete",
                              data: [
                                { Ean13: 3700691427168, CodeProduit: "662200 077 38", EnStock: 5, EnTransit: 2 },
                                { Ean13: 3700691427175, CodeProduit: "662200 078 38", EnStock: 0, EnTransit: 3 }
                              ]
                            }, null, 2);
                            navigator.clipboard.writeText(example);
                            toast.success("Exemple JSON copié dans le presse-papier");
                          }}
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          <span className="text-xs">Copier l'exemple</span>
                        </Button>
                      </div>
                      <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs overflow-x-auto">
{`{
  "key": "ExportStockVotreSociete",
  "data": [
    {
      "Ean13": 3700691427168,
      "CodeProduit": "662200 077 38",
      "EnStock": 5,
      "EnTransit": 2
    },
    {
      "Ean13": 3700691427175,
      "CodeProduit": "662200 078 38",
      "EnStock": 0,
      "EnTransit": 3
    }
  ]
}`}
                      </pre>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        <strong>Important :</strong> Le matching se fait d'abord par <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">CodeProduit</code> (champ "Code fournisseur" de chaque variante),
                        puis par <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">Ean13</code> si aucun match par code.
                        Assurez-vous que les codes fournisseur sont bien renseignés dans l'admin produits pour chaque variante.
                      </p>
                    </div>
                  </div>

                  <hr className="border-border" />

                  {/* GET Export Orders */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-bold rounded">GET</span>
                      <h4 className="font-semibold text-sm">Export Commandes</h4>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono text-primary break-all">
                          {window.location.origin}/api/supplier/orders/export
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 ml-2"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/api/supplier/orders/export`);
                            toast.success("URL copiée dans le presse-papier");
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Retourne les commandes, paiements et informations clients au format JSON.
                        Paramètres optionnels : <code className="bg-muted px-1 rounded">?limit=50&offset=0</code>
                      </p>
                    </div>
                  </div>

                  <hr className="border-border" />

                  {/* cURL Example */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">Exemple cURL (Import Stock)</h4>
                    </div>
                    <div className="relative">
                      <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs overflow-x-auto">
{`curl -X POST ${window.location.origin}/api/supplier/stock/import \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: VOTRE_CLE_API" \\
  -d '{
    "key": "ExportStockVotreSociete",
    "data": [
      {
        "Ean13": 3700691427168,
        "CodeProduit": "662200 077 38",
        "EnStock": 5,
        "EnTransit": 2
      }
    ]
  }'`}
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 text-slate-400 hover:text-white"
                        onClick={() => {
                          const curl = `curl -X POST ${window.location.origin}/api/supplier/stock/import -H "Content-Type: application/json" -H "X-API-Key: VOTRE_CLE_API" -d '{"key":"ExportStockVotreSociete","data":[{"Ean13":3700691427168,"CodeProduit":"662200 077 38","EnStock":5,"EnTransit":2}]}'`;
                          navigator.clipboard.writeText(curl);
                          toast.success("Commande cURL copiée dans le presse-papier");
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Supplier API Logs */}
              <SupplierApiLogsCard />
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}


// ─── Supplier API Logs Component ─────────────────────────────────────────────

function SupplierApiLogsCard() {
  const [page, setPage] = useState(0);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const pageSize = 10;

  const { data: logsData, isLoading } = trpc.supplierApiLogs.list.useQuery({
    limit: pageSize,
    offset: page * pageSize,
  });

  const { data: selectedLog } = trpc.supplierApiLogs.getById.useQuery(
    { id: selectedLogId! },
    { enabled: !!selectedLogId }
  );

  const logs = logsData?.logs ?? [];
  const total = logsData?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const formatDate = (date: string | Date | null) => {
    if (!date) return "—";
    const d = new Date(date);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Card className="mt-6 lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="w-5 h-5" />
          Historique des appels API Fournisseur
        </CardTitle>
        <CardDescription>
          Journal de tous les appels POST reçus sur l'endpoint d'import stock
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun appel API enregistré pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Logs Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-3 font-medium text-muted-foreground text-xs">Date</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground text-xs">Clé</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground text-xs text-center">Total</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground text-xs text-center">Matchés</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground text-xs text-center">Non matchés</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground text-xs text-center">Statut</th>
                    <th className="pb-2 font-medium text-muted-foreground text-xs text-center">Détail</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 pr-3 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {formatDate(log.createdAt)}
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-xs font-mono truncate max-w-[150px]">
                        {log.importKey || "—"}
                      </td>
                      <td className="py-2 pr-3 text-xs text-center font-medium">
                        {log.totalItems}
                      </td>
                      <td className="py-2 pr-3 text-xs text-center">
                        <span className="text-green-600 font-medium">{log.matchedItems}</span>
                      </td>
                      <td className="py-2 pr-3 text-xs text-center">
                        {log.unmatchedItems > 0 ? (
                          <span className="text-amber-600 font-medium">{log.unmatchedItems}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-center">
                        {log.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <XOctagon className="w-4 h-4 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="py-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setSelectedLogId(log.id === selectedLogId ? null : log.id)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  {total} appel{total > 1 ? "s" : ""} au total
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7"
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Selected Log Detail */}
            {selectedLogId && selectedLog && (
              <div className="mt-4 border rounded-lg p-4 space-y-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Détail de l'appel #{selectedLog.id}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7"
                    onClick={() => setSelectedLogId(null)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Date :</span>
                    <p className="font-medium">{formatDate(selectedLog.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Clé d'import :</span>
                    <p className="font-mono font-medium">{selectedLog.importKey || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">IP :</span>
                    <p className="font-mono font-medium">{selectedLog.ipAddress || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Résultat :</span>
                    <p className="font-medium">
                      <span className="text-green-600">{selectedLog.matchedItems} matchés</span>
                      {selectedLog.unmatchedItems > 0 && (
                        <>, <span className="text-amber-600">{selectedLog.unmatchedItems} non matchés</span></>
                      )}
                      {selectedLog.errorItems > 0 && (
                        <>, <span className="text-red-600">{selectedLog.errorItems} erreurs</span></>
                      )}
                    </p>
                  </div>
                </div>

                {selectedLog.errorMessage && (
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded p-2">
                    <p className="text-xs text-red-700 dark:text-red-400">
                      <strong>Erreur :</strong> {selectedLog.errorMessage}
                    </p>
                  </div>
                )}

                {/* Raw Payload */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Données JSON reçues :</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedLog.rawPayload);
                        toast.success("JSON copié dans le presse-papier");
                      }}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      <span className="text-xs">Copier</span>
                    </Button>
                  </div>
                  <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 text-xs overflow-x-auto max-h-[300px] overflow-y-auto">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedLog.rawPayload), null, 2);
                      } catch {
                        return selectedLog.rawPayload;
                      }
                    })()}
                  </pre>
                </div>

                {/* Results */}
                {selectedLog.resultsJson && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Résultats du matching :</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedLog.resultsJson!);
                          toast.success("Résultats copiés dans le presse-papier");
                        }}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        <span className="text-xs">Copier</span>
                      </Button>
                    </div>
                    <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 text-xs overflow-x-auto max-h-[300px] overflow-y-auto">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(selectedLog.resultsJson), null, 2);
                        } catch {
                          return selectedLog.resultsJson;
                        }
                      })()}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
