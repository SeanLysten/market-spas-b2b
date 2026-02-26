import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { 
  Building2, 
  User, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Upload,
  Phone,
  Mail,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type Step = 1 | 2 | 3 | 4;

export default function PartnerOnboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Company Info
    companyName: "",
    tradeName: "",
    vatNumber: "",
    companyType: "",
    website: "",
    
    // Step 2: Contact Info
    contactName: user?.name || "",
    contactEmail: user?.email || "",
    contactPhone: "",
    contactPosition: "",
    
    // Step 3: Address
    street: "",
    street2: "",
    city: "",
    postalCode: "",
    country: "BE",
    
    // Step 4: Business Info
    businessDescription: "",
    expectedVolume: "",
    howDidYouHear: "",
    acceptTerms: false,
    acceptNewsletter: false,
  });

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const createPartnerMutation = trpc.partners.register.useMutation();

  const handleSubmit = async () => {
    if (!formData.acceptTerms) {
      toast.error("Veuillez accepter les conditions générales");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPartnerMutation.mutateAsync({
        companyName: formData.companyName,
        tradeName: formData.tradeName || undefined,
        vatNumber: formData.vatNumber,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        street: formData.street,
        street2: formData.street2 || undefined,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country,
        website: formData.website || undefined,
        businessDescription: formData.businessDescription || undefined,
      });

      toast.success("Demande de partenariat envoyée avec succès !");
      setLocation("/partner-pending");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi de la demande");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, title: "Entreprise", icon: Building2 },
    { id: 2, title: "Contact", icon: User },
    { id: 3, title: "Adresse", icon: MapPin },
    { id: 4, title: "Finalisation", icon: FileText },
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.companyName && formData.vatNumber;
      case 2:
        return formData.contactName && formData.contactEmail && formData.contactPhone;
      case 3:
        return formData.street && formData.city && formData.postalCode && formData.country;
      case 4:
        return formData.acceptTerms;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12">
      <div className="container max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Devenir partenaire Market Spas</h1>
          <p className="text-muted-foreground">
            Complétez votre inscription pour accéder à notre catalogue professionnel
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isActive ? "bg-primary text-white" :
                    isCompleted ? "bg-emerald-500 dark:bg-emerald-400 text-white" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className={`text-sm mt-2 ${isActive ? "font-semibold" : "text-muted-foreground"}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-full h-1 mx-4 rounded ${
                    isCompleted ? "bg-emerald-500 dark:bg-emerald-400" : "bg-muted"
                  }`} style={{ minWidth: "60px" }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Informations de l'entreprise"}
              {currentStep === 2 && "Informations de contact"}
              {currentStep === 3 && "Adresse de facturation"}
              {currentStep === 4 && "Finalisation de l'inscription"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Renseignez les informations légales de votre entreprise"}
              {currentStep === 2 && "Indiquez les coordonnées du contact principal"}
              {currentStep === 3 && "Adresse utilisée pour la facturation et les livraisons"}
              {currentStep === 4 && "Vérifiez vos informations et acceptez les conditions"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Company Info */}
            {currentStep === 1 && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Raison sociale *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => updateFormData("companyName", e.target.value)}
                      placeholder="Nom légal de l'entreprise"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tradeName">Nom commercial</Label>
                    <Input
                      id="tradeName"
                      value={formData.tradeName}
                      onChange={(e) => updateFormData("tradeName", e.target.value)}
                      placeholder="Si différent de la raison sociale"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vatNumber">Numéro de TVA *</Label>
                    <Input
                      id="vatNumber"
                      value={formData.vatNumber}
                      onChange={(e) => updateFormData("vatNumber", e.target.value)}
                      placeholder="BE0123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyType">Type d'entreprise</Label>
                    <Select value={formData.companyType} onValueChange={(v) => updateFormData("companyType", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retailer">Revendeur / Magasin</SelectItem>
                        <SelectItem value="installer">Installateur</SelectItem>
                        <SelectItem value="builder">Constructeur / Promoteur</SelectItem>
                        <SelectItem value="hotel">Hôtel / Spa</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Site web</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => updateFormData("website", e.target.value)}
                      placeholder="https://www.example.com"
                      className="pl-10"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Contact Info */}
            {currentStep === 2 && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Nom complet *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="contactName"
                        value={formData.contactName}
                        onChange={(e) => updateFormData("contactName", e.target.value)}
                        placeholder="Prénom Nom"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPosition">Fonction</Label>
                    <Input
                      id="contactPosition"
                      value={formData.contactPosition}
                      onChange={(e) => updateFormData("contactPosition", e.target.value)}
                      placeholder="Gérant, Directeur commercial..."
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email professionnel *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => updateFormData("contactEmail", e.target.value)}
                        placeholder="contact@entreprise.be"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Téléphone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="contactPhone"
                        value={formData.contactPhone}
                        onChange={(e) => updateFormData("contactPhone", e.target.value)}
                        placeholder="+32 xxx xx xx xx"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Address */}
            {currentStep === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="street">Adresse *</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => updateFormData("street", e.target.value)}
                    placeholder="Rue et numéro"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street2">Complément d'adresse</Label>
                  <Input
                    id="street2"
                    value={formData.street2}
                    onChange={(e) => updateFormData("street2", e.target.value)}
                    placeholder="Bâtiment, étage, etc."
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Code postal *</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => updateFormData("postalCode", e.target.value)}
                      placeholder="1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateFormData("city", e.target.value)}
                      placeholder="Bruxelles"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Pays *</Label>
                    <Select value={formData.country} onValueChange={(v) => updateFormData("country", v)}>
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
              </>
            )}

            {/* Step 4: Finalization */}
            {currentStep === 4 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="businessDescription">Description de votre activité</Label>
                  <Textarea
                    id="businessDescription"
                    value={formData.businessDescription}
                    onChange={(e) => updateFormData("businessDescription", e.target.value)}
                    placeholder="Décrivez brièvement votre activité et vos besoins..."
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="expectedVolume">Volume de commandes estimé</Label>
                    <Select value={formData.expectedVolume} onValueChange={(v) => updateFormData("expectedVolume", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-5">1 à 5 produits/an</SelectItem>
                        <SelectItem value="5-10">5 à 10 produits/an</SelectItem>
                        <SelectItem value="10-25">10 à 25 produits/an</SelectItem>
                        <SelectItem value="25+">Plus de 25 produits/an</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="howDidYouHear">Comment nous avez-vous connu ?</Label>
                    <Select value={formData.howDidYouHear} onValueChange={(v) => updateFormData("howDidYouHear", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="search">Recherche internet</SelectItem>
                        <SelectItem value="referral">Recommandation</SelectItem>
                        <SelectItem value="tradeshow">Salon professionnel</SelectItem>
                        <SelectItem value="social">Réseaux sociaux</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold">Récapitulatif</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entreprise:</span>
                      <span>{formData.companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TVA:</span>
                      <span>{formData.vatNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contact:</span>
                      <span>{formData.contactName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{formData.contactEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Adresse:</span>
                      <span>{formData.city}, {formData.country}</span>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="acceptTerms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => updateFormData("acceptTerms", !!checked)}
                    />
                    <Label htmlFor="acceptTerms" className="text-sm leading-relaxed cursor-pointer">
                      J'accepte les <a href="#" className="text-primary underline">conditions générales de vente</a> et la <a href="#" className="text-primary underline">politique de confidentialité</a> de Market Spas. *
                    </Label>
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="acceptNewsletter"
                      checked={formData.acceptNewsletter}
                      onCheckedChange={(checked) => updateFormData("acceptNewsletter", !!checked)}
                    />
                    <Label htmlFor="acceptNewsletter" className="text-sm leading-relaxed cursor-pointer">
                      Je souhaite recevoir les actualités et offres promotionnelles de Market Spas par email.
                    </Label>
                  </div>
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1) as Step)}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Précédent
              </Button>

              {currentStep < 4 ? (
                <Button
                  onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1) as Step)}
                  disabled={!canProceed()}
                  className="gap-2"
                >
                  Suivant
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Envoyer ma demande
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
