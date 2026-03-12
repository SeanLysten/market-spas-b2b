import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { ArrowLeft, Building2, MapPin, Truck, Users, Save, CheckCircle, Globe, Mail, Phone } from "lucide-react";

const COUNTRIES = [
  { code: "FR", name: "France" },
  { code: "BE", name: "Belgique" },
  { code: "CH", name: "Suisse" },
  { code: "LU", name: "Luxembourg" },
  { code: "ES", name: "Espagne" },
  { code: "DE", name: "Allemagne" },
  { code: "IT", name: "Italie" },
  { code: "NL", name: "Pays-Bas" },
  { code: "PT", name: "Portugal" },
  { code: "GB", name: "Royaume-Uni" },
];

export default function CompanyProfile() {
  const [, navigate] = useLocation();
  const { data: partner, isLoading } = trpc.partners.myPartner.useQuery();
  const updateMutation = trpc.partners.updateMyPartner.useMutation();

  const [activeTab, setActiveTab] = useState("company");
  const [saved, setSaved] = useState(false);
  const [billingAddressSame, setBillingAddressSame] = useState(true);

  // Form state
  const [form, setForm] = useState({
    // Company
    companyName: "",
    tradeName: "",
    vatNumber: "",
    registrationNumber: "",
    website: "",
    // Primary address
    addressStreet: "",
    addressStreet2: "",
    addressCity: "",
    addressPostalCode: "",
    addressCountry: "FR",
    addressRegion: "",
    // Billing
    billingAddressSame: true,
    billingStreet: "",
    billingStreet2: "",
    billingCity: "",
    billingPostalCode: "",
    billingCountry: "FR",
    // Delivery
    deliveryStreet: "",
    deliveryStreet2: "",
    deliveryCity: "",
    deliveryPostalCode: "",
    deliveryCountry: "FR",
    deliveryInstructions: "",
    // Contacts
    primaryContactName: "",
    primaryContactEmail: "",
    primaryContactPhone: "",
    accountingEmail: "",
    orderEmail: "",
  });

  // Populate form when partner data loads
  useEffect(() => {
    if (partner) {
      setForm({
        companyName: partner.companyName || "",
        tradeName: partner.tradeName || "",
        vatNumber: partner.vatNumber || "",
        registrationNumber: partner.registrationNumber || "",
        website: partner.website || "",
        addressStreet: partner.addressStreet || "",
        addressStreet2: partner.addressStreet2 || "",
        addressCity: partner.addressCity || "",
        addressPostalCode: partner.addressPostalCode || "",
        addressCountry: partner.addressCountry || "FR",
        addressRegion: partner.addressRegion || "",
        billingAddressSame: partner.billingAddressSame ?? true,
        billingStreet: partner.billingStreet || "",
        billingStreet2: partner.billingStreet2 || "",
        billingCity: partner.billingCity || "",
        billingPostalCode: partner.billingPostalCode || "",
        billingCountry: partner.billingCountry || "FR",
        deliveryStreet: partner.deliveryStreet || "",
        deliveryStreet2: partner.deliveryStreet2 || "",
        deliveryCity: partner.deliveryCity || "",
        deliveryPostalCode: partner.deliveryPostalCode || "",
        deliveryCountry: partner.deliveryCountry || "FR",
        deliveryInstructions: partner.deliveryInstructions || "",
        primaryContactName: partner.primaryContactName || "",
        primaryContactEmail: partner.primaryContactEmail || "",
        primaryContactPhone: partner.primaryContactPhone || "",
        accountingEmail: partner.accountingEmail || "",
        orderEmail: partner.orderEmail || "",
      });
      setBillingAddressSame(partner.billingAddressSame ?? true);
    }
  }, [partner]);

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        ...form,
        billingAddressSame,
        tradeName: form.tradeName || null,
        registrationNumber: form.registrationNumber || null,
        website: form.website || null,
        addressStreet2: form.addressStreet2 || null,
        addressRegion: form.addressRegion || null,
        billingStreet: billingAddressSame ? null : form.billingStreet || null,
        billingStreet2: billingAddressSame ? null : form.billingStreet2 || null,
        billingCity: billingAddressSame ? null : form.billingCity || null,
        billingPostalCode: billingAddressSame ? null : form.billingPostalCode || null,
        billingCountry: billingAddressSame ? null : form.billingCountry || null,
        deliveryStreet: form.deliveryStreet || null,
        deliveryStreet2: form.deliveryStreet2 || null,
        deliveryCity: form.deliveryCity || null,
        deliveryPostalCode: form.deliveryPostalCode || null,
        deliveryCountry: form.deliveryCountry || null,
        deliveryInstructions: form.deliveryInstructions || null,
        accountingEmail: form.accountingEmail || null,
        orderEmail: form.orderEmail || null,
      } as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Erreur lors de la mise à jour:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a2e1a]" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg text-gray-600">Aucune société associée à votre compte</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1a2e1a]">
              Ma Société
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gérez les informations de votre entreprise
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={partner.status === "APPROVED" ? "default" : "secondary"} className={partner.status === "APPROVED" ? "bg-green-100 text-green-800" : ""}>
            {partner.status === "APPROVED" ? "Approuvé" : partner.status === "PENDING" ? "En attente" : partner.status}
          </Badge>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-[#1a2e1a] hover:bg-[#2a4e2a] text-white"
          >
            {saved ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Enregistré
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="company" className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Entreprise</span>
            <span className="sm:hidden">Société</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            <span>Adresses</span>
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center gap-1.5">
            <Truck className="h-4 w-4" />
            <span>Livraison</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>Contacts</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Info Tab */}
        <TabsContent value="company" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#1a2e1a]" />
                Informations de l'entreprise
              </CardTitle>
              <CardDescription>
                Raison sociale, numéros d'identification et coordonnées principales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Raison sociale *</Label>
                  <Input
                    id="companyName"
                    value={form.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    placeholder="Nom de la société"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tradeName">Nom commercial</Label>
                  <Input
                    id="tradeName"
                    value={form.tradeName}
                    onChange={(e) => updateField("tradeName", e.target.value)}
                    placeholder="Nom commercial (optionnel)"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vatNumber">Numéro de TVA *</Label>
                  <Input
                    id="vatNumber"
                    value={form.vatNumber}
                    onChange={(e) => updateField("vatNumber", e.target.value)}
                    placeholder="Ex: FR12345678901"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">SIREN / N° d'immatriculation</Label>
                  <Input
                    id="registrationNumber"
                    value={form.registrationNumber}
                    onChange={(e) => updateField("registrationNumber", e.target.value)}
                    placeholder="Ex: 123 456 789"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  Site web
                </Label>
                <Input
                  id="website"
                  value={form.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  placeholder="https://www.example.com"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Addresses Tab */}
        <TabsContent value="addresses" className="space-y-4 mt-4">
          {/* Primary / Billing Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#1a2e1a]" />
                Adresse principale
              </CardTitle>
              <CardDescription>
                Adresse du siège social de votre entreprise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="addressStreet">Rue *</Label>
                <Input
                  id="addressStreet"
                  value={form.addressStreet}
                  onChange={(e) => updateField("addressStreet", e.target.value)}
                  placeholder="Numéro et nom de rue"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressStreet2">Complément d'adresse</Label>
                <Input
                  id="addressStreet2"
                  value={form.addressStreet2}
                  onChange={(e) => updateField("addressStreet2", e.target.value)}
                  placeholder="Bâtiment, étage, etc."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="addressPostalCode">Code postal *</Label>
                  <Input
                    id="addressPostalCode"
                    value={form.addressPostalCode}
                    onChange={(e) => updateField("addressPostalCode", e.target.value)}
                    placeholder="75001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressCity">Ville *</Label>
                  <Input
                    id="addressCity"
                    value={form.addressCity}
                    onChange={(e) => updateField("addressCity", e.target.value)}
                    placeholder="Paris"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressCountry">Pays *</Label>
                  <Select value={form.addressCountry} onValueChange={(v) => updateField("addressCountry", v)}>
                    <SelectTrigger id="addressCountry">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressRegion">Région / Province</Label>
                <Input
                  id="addressRegion"
                  value={form.addressRegion}
                  onChange={(e) => updateField("addressRegion", e.target.value)}
                  placeholder="Île-de-France"
                />
              </div>
            </CardContent>
          </Card>

          {/* Billing Address */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    Adresse de facturation
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Adresse utilisée pour vos factures
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="billingAddressSame" className="text-sm text-gray-500">
                    Identique
                  </Label>
                  <Switch
                    id="billingAddressSame"
                    checked={billingAddressSame}
                    onCheckedChange={(v) => {
                      setBillingAddressSame(v);
                      updateField("billingAddressSame", v);
                    }}
                  />
                </div>
              </div>
            </CardHeader>
            {!billingAddressSame && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="billingStreet">Rue *</Label>
                  <Input
                    id="billingStreet"
                    value={form.billingStreet}
                    onChange={(e) => updateField("billingStreet", e.target.value)}
                    placeholder="Numéro et nom de rue"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingStreet2">Complément d'adresse</Label>
                  <Input
                    id="billingStreet2"
                    value={form.billingStreet2}
                    onChange={(e) => updateField("billingStreet2", e.target.value)}
                    placeholder="Bâtiment, étage, etc."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingPostalCode">Code postal *</Label>
                    <Input
                      id="billingPostalCode"
                      value={form.billingPostalCode}
                      onChange={(e) => updateField("billingPostalCode", e.target.value)}
                      placeholder="75001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingCity">Ville *</Label>
                    <Input
                      id="billingCity"
                      value={form.billingCity}
                      onChange={(e) => updateField("billingCity", e.target.value)}
                      placeholder="Paris"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingCountry">Pays *</Label>
                    <Select value={form.billingCountry} onValueChange={(v) => updateField("billingCountry", v)}>
                      <SelectTrigger id="billingCountry">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Delivery Tab */}
        <TabsContent value="delivery" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-600" />
                Adresse de livraison par défaut
              </CardTitle>
              <CardDescription>
                Adresse utilisée par défaut pour vos livraisons de commandes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryStreet">Rue</Label>
                <Input
                  id="deliveryStreet"
                  value={form.deliveryStreet}
                  onChange={(e) => updateField("deliveryStreet", e.target.value)}
                  placeholder="Numéro et nom de rue"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryStreet2">Complément d'adresse</Label>
                <Input
                  id="deliveryStreet2"
                  value={form.deliveryStreet2}
                  onChange={(e) => updateField("deliveryStreet2", e.target.value)}
                  placeholder="Bâtiment, zone industrielle, etc."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryPostalCode">Code postal</Label>
                  <Input
                    id="deliveryPostalCode"
                    value={form.deliveryPostalCode}
                    onChange={(e) => updateField("deliveryPostalCode", e.target.value)}
                    placeholder="75001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryCity">Ville</Label>
                  <Input
                    id="deliveryCity"
                    value={form.deliveryCity}
                    onChange={(e) => updateField("deliveryCity", e.target.value)}
                    placeholder="Paris"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryCountry">Pays</Label>
                  <Select value={form.deliveryCountry} onValueChange={(v) => updateField("deliveryCountry", v)}>
                    <SelectTrigger id="deliveryCountry">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="deliveryInstructions">Instructions de livraison</Label>
                <Textarea
                  id="deliveryInstructions"
                  value={form.deliveryInstructions}
                  onChange={(e) => updateField("deliveryInstructions", e.target.value)}
                  placeholder="Instructions particulières pour le livreur (code portail, horaires, etc.)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#1a2e1a]" />
                Contact principal
              </CardTitle>
              <CardDescription>
                Personne de contact principale pour votre entreprise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryContactName">Nom complet *</Label>
                  <Input
                    id="primaryContactName"
                    value={form.primaryContactName}
                    onChange={(e) => updateField("primaryContactName", e.target.value)}
                    placeholder="Prénom Nom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryContactPhone" className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    Téléphone *
                  </Label>
                  <Input
                    id="primaryContactPhone"
                    value={form.primaryContactPhone}
                    onChange={(e) => updateField("primaryContactPhone", e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryContactEmail" className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  Email principal *
                </Label>
                <Input
                  id="primaryContactEmail"
                  type="email"
                  value={form.primaryContactEmail}
                  onChange={(e) => updateField("primaryContactEmail", e.target.value)}
                  placeholder="contact@entreprise.com"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Emails spécialisés
              </CardTitle>
              <CardDescription>
                Adresses email dédiées pour la comptabilité et les commandes (optionnel)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountingEmail">Email comptabilité</Label>
                  <Input
                    id="accountingEmail"
                    type="email"
                    value={form.accountingEmail}
                    onChange={(e) => updateField("accountingEmail", e.target.value)}
                    placeholder="compta@entreprise.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orderEmail">Email commandes</Label>
                  <Input
                    id="orderEmail"
                    type="email"
                    value={form.orderEmail}
                    onChange={(e) => updateField("orderEmail", e.target.value)}
                    placeholder="commandes@entreprise.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bottom save button for mobile */}
      <div className="sm:hidden pb-4">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full bg-[#1a2e1a] hover:bg-[#2a4e2a] text-white"
        >
          {saved ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Enregistré
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
