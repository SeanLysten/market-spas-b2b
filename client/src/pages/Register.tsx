import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, Package, CheckCircle2, Building2, User, MapPin, Lock,
  ArrowRight, ArrowLeft, Phone, Mail, Globe
} from "lucide-react";
import { Link } from "wouter";

type Step = 1 | 2 | 3 | 4;

export default function Register() {
  const [, setLocation] = useLocation();
  
  // Extract token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const invitationToken = urlParams.get('token');
  
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal info & password
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    // Step 2: Company info
    companyName: "",
    tradeName: "",
    vatNumber: "",
    website: "",
    // Step 3: Billing address
    billingStreet: "",
    billingStreet2: "",
    billingCity: "",
    billingPostalCode: "",
    billingCountry: "FR",
    // Shipping address (can be same as billing)
    shippingSameAsBilling: true,
    shippingStreet: "",
    shippingStreet2: "",
    shippingCity: "",
    shippingPostalCode: "",
    shippingCountry: "FR",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValidated, setTokenValidated] = useState(false);
  const [invitationEmail, setInvitationEmail] = useState("");
  const [isTeamInvitation, setIsTeamInvitation] = useState(false);

  // Validate token and get email
  const { data: tokenData, isLoading: tokenLoading, error: tokenError } = trpc.auth.validateInvitationToken.useQuery(
    { token: invitationToken || "" },
    { enabled: !!invitationToken }
  );

  // Redirect to login if no token provided
  useEffect(() => {
    if (!invitationToken) {
      setError("Accès refusé. Cette page n'est accessible que sur invitation.");
      setTimeout(() => {
        setLocation("/login");
      }, 3000);
    }
  }, [invitationToken, setLocation]);

  // Pre-fill email and names when token is validated
  useEffect(() => {
    if (tokenData) {
      setInvitationEmail(tokenData.email);
      const isTeam = tokenData.isTeamInvitation || false;
      setIsTeamInvitation(isTeam);
      setFormData(prev => ({
        ...prev,
        email: tokenData.email,
        firstName: tokenData.firstName || "",
        lastName: tokenData.lastName || "",
      }));
      setTokenValidated(true);
    }
  }, [tokenData]);

  // Show error if token is invalid
  useEffect(() => {
    if (tokenError) {
      setError(tokenError.message);
      setTimeout(() => {
        setLocation("/login");
      }, 3000);
    }
  }, [tokenError, setLocation]);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setIsLoading(false);
      setTimeout(() => {
        setLocation("/login");
      }, 3000);
    },
    onError: (err) => {
      setError(err.message);
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (formData.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setIsLoading(true);

    registerMutation.mutate({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || undefined,
      companyName: formData.companyName || undefined,
      invitationToken: invitationToken || undefined,
      // Company fields for partner registration
      tradeName: formData.tradeName || undefined,
      vatNumber: formData.vatNumber || undefined,
      website: formData.website || undefined,
      billingStreet: formData.billingStreet || undefined,
      billingStreet2: formData.billingStreet2 || undefined,
      billingCity: formData.billingCity || undefined,
      billingPostalCode: formData.billingPostalCode || undefined,
      billingCountry: formData.billingCountry || undefined,
      shippingSameAsBilling: formData.shippingSameAsBilling,
      shippingStreet: formData.shippingSameAsBilling ? undefined : formData.shippingStreet || undefined,
      shippingStreet2: formData.shippingSameAsBilling ? undefined : formData.shippingStreet2 || undefined,
      shippingCity: formData.shippingSameAsBilling ? undefined : formData.shippingCity || undefined,
      shippingPostalCode: formData.shippingSameAsBilling ? undefined : formData.shippingPostalCode || undefined,
      shippingCountry: formData.shippingSameAsBilling ? undefined : formData.shippingCountry || undefined,
    });
  };

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // For team invitations, only show step 1 (personal info + password)
  const totalSteps = isTeamInvitation ? 1 : 3;

  const steps = isTeamInvitation
    ? [{ id: 1, title: "Compte", icon: User }]
    : [
        { id: 1, title: "Compte", icon: User },
        { id: 2, title: "Entreprise", icon: Building2 },
        { id: 3, title: "Adresses", icon: MapPin },
      ];

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName && formData.lastName && formData.email && 
               formData.password && formData.confirmPassword && 
               formData.password === formData.confirmPassword && formData.password.length >= 8;
      case 2:
        return formData.companyName && formData.vatNumber;
      case 3:
        return formData.billingStreet && formData.billingCity && formData.billingPostalCode && formData.billingCountry;
      default:
        return false;
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-stone-50 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Compte créé avec succès !
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Vous allez être redirigé vers la page de connexion...
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (tokenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-stone-50 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <CardTitle className="mt-4">Vérification de l'invitation...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-white to-stone-50 p-4 py-8">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center">
              <Package className="h-7 w-7 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Market Spas
            </CardTitle>
            <CardDescription className="text-base mt-1">
              {isTeamInvitation ? "Créer votre compte collaborateur" : "Créer votre compte partenaire"}
            </CardDescription>
          </div>
        </CardHeader>

        {/* Progress Steps - only show if more than 1 step */}
        {totalSteps > 1 && (
          <div className="flex justify-center gap-8 px-6 pb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive ? "bg-primary text-white" :
                      isCompleted ? "bg-emerald-500 text-white" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-xs mt-1 ${isActive ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 rounded mb-5 ${
                      isCompleted ? "bg-emerald-500" : "bg-muted"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <CardContent className="space-y-5 pt-2">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Personal Info & Password */}
          {currentStep === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Jean"
                    value={formData.firstName}
                    onChange={handleChange("firstName")}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Dupont"
                    value={formData.lastName}
                    onChange={handleChange("lastName")}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleChange("email")}
                  required
                  disabled={isLoading || !!invitationEmail}
                  autoComplete="email"
                  className={invitationEmail ? "bg-muted" : ""}
                />
                {invitationEmail && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Email verrouillé par l'invitation
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  value={formData.phone}
                  onChange={handleChange("phone")}
                  disabled={isLoading}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange("password")}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground">Minimum 8 caractères</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange("confirmPassword")}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
              )}
            </>
          )}

          {/* Step 2: Company Info (only for partner registration) */}
          {currentStep === 2 && !isTeamInvitation && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Raison sociale *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={handleChange("companyName")}
                    placeholder="Nom légal de l'entreprise"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tradeName">Nom commercial</Label>
                  <Input
                    id="tradeName"
                    value={formData.tradeName}
                    onChange={handleChange("tradeName")}
                    placeholder="Si différent de la raison sociale"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vatNumber">N° SIREN / TVA *</Label>
                  <Input
                    id="vatNumber"
                    value={formData.vatNumber}
                    onChange={handleChange("vatNumber")}
                    placeholder="FR12345678901 ou 123 456 789"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">Numéro de TVA intracommunautaire ou SIREN</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Site web</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={handleChange("website")}
                      placeholder="https://www.example.com"
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Addresses (only for partner registration) */}
          {currentStep === 3 && !isTeamInvitation && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Adresse de facturation</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="billingStreet">Adresse *</Label>
                    <Input
                      id="billingStreet"
                      value={formData.billingStreet}
                      onChange={handleChange("billingStreet")}
                      placeholder="Rue et numéro"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingStreet2">Complément d'adresse</Label>
                    <Input
                      id="billingStreet2"
                      value={formData.billingStreet2}
                      onChange={handleChange("billingStreet2")}
                      placeholder="Bâtiment, étage, etc."
                      disabled={isLoading}
                    />
                  </div>
                  <div className="grid gap-3 grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="billingPostalCode">Code postal *</Label>
                      <Input
                        id="billingPostalCode"
                        value={formData.billingPostalCode}
                        onChange={handleChange("billingPostalCode")}
                        placeholder="75001"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingCity">Ville *</Label>
                      <Input
                        id="billingCity"
                        value={formData.billingCity}
                        onChange={handleChange("billingCity")}
                        placeholder="Paris"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingCountry">Pays *</Label>
                      <Select value={formData.billingCountry} onValueChange={(v) => updateFormData("billingCountry", v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[10001]">
                          <SelectItem value="FR">France</SelectItem>
                          <SelectItem value="BE">Belgique</SelectItem>
                          <SelectItem value="LU">Luxembourg</SelectItem>
                          <SelectItem value="ES">Espagne</SelectItem>
                          <SelectItem value="NL">Pays-Bas</SelectItem>
                          <SelectItem value="DE">Allemagne</SelectItem>
                          <SelectItem value="CH">Suisse</SelectItem>
                          <SelectItem value="IT">Italie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <Checkbox
                    id="shippingSameAsBilling"
                    checked={formData.shippingSameAsBilling}
                    onCheckedChange={(checked) => updateFormData("shippingSameAsBilling", !!checked)}
                  />
                  <Label htmlFor="shippingSameAsBilling" className="text-sm cursor-pointer">
                    L'adresse de livraison est identique à l'adresse de facturation
                  </Label>
                </div>

                {!formData.shippingSameAsBilling && (
                  <div className="space-y-3 mt-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Adresse de livraison</h3>
                    <div className="space-y-2">
                      <Label htmlFor="shippingStreet">Adresse *</Label>
                      <Input
                        id="shippingStreet"
                        value={formData.shippingStreet}
                        onChange={handleChange("shippingStreet")}
                        placeholder="Rue et numéro"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shippingStreet2">Complément d'adresse</Label>
                      <Input
                        id="shippingStreet2"
                        value={formData.shippingStreet2}
                        onChange={handleChange("shippingStreet2")}
                        placeholder="Bâtiment, étage, etc."
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-3 grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="shippingPostalCode">Code postal *</Label>
                        <Input
                          id="shippingPostalCode"
                          value={formData.shippingPostalCode}
                          onChange={handleChange("shippingPostalCode")}
                          placeholder="75001"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shippingCity">Ville *</Label>
                        <Input
                          id="shippingCity"
                          value={formData.shippingCity}
                          onChange={handleChange("shippingCity")}
                          placeholder="Paris"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shippingCountry">Pays *</Label>
                        <Select value={formData.shippingCountry} onValueChange={(v) => updateFormData("shippingCountry", v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[10001]">
                            <SelectItem value="FR">France</SelectItem>
                            <SelectItem value="BE">Belgique</SelectItem>
                            <SelectItem value="LU">Luxembourg</SelectItem>
                            <SelectItem value="ES">Espagne</SelectItem>
                            <SelectItem value="NL">Pays-Bas</SelectItem>
                            <SelectItem value="DE">Allemagne</SelectItem>
                            <SelectItem value="CH">Suisse</SelectItem>
                            <SelectItem value="IT">Italie</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1) as Step)}
                disabled={isLoading}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Précédent
              </Button>
            ) : (
              <div />
            )}

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(totalSteps, prev + 1) as Step)}
                disabled={!canProceed()}
                className="gap-2"
              >
                Suivant
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!canProceed() || isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Créer mon compte
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link href="/login">
              <a className="text-primary font-medium hover:underline">
                Se connecter
              </a>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
