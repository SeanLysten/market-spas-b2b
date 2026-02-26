import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Package, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function Register() {
  const [, setLocation] = useLocation();
  
  // Extract token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const invitationToken = urlParams.get('token');
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    companyName: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValidated, setTokenValidated] = useState(false);
  const [invitationEmail, setInvitationEmail] = useState("");

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
      setFormData(prev => ({
        ...prev,
        email: tokenData.email,
        firstName: tokenData.firstName || "",
        lastName: tokenData.lastName || ""
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
      // Redirect to login after 3 seconds
      setTimeout(() => {
        setLocation("/login");
      }, 3000);
    },
    onError: (err) => {
      setError(err.message);
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    // Validate password strength
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
    });
  };

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl text-display text-display font-bold text-gray-900">
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-info dark:bg-info-dark flex items-center justify-center">
              <Package className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Market Spas
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Créer un compte partenaire
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
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
                className={invitationEmail ? "bg-muted dark:bg-muted/50" : ""}
              />
              {invitationEmail && (
                <p className="text-xs text-muted-foreground mt-1">
                  🔒 Email verrouillé par l'invitation
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+32 123 45 67 89"
                value={formData.phone}
                onChange={handleChange("phone")}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Nom de l'entreprise</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Votre entreprise"
                value={formData.companyName}
                onChange={handleChange("companyName")}
                disabled={isLoading}
              />
            </div>
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
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">Minimum 8 caractères</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
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
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-info dark:bg-info-dark hover:bg-info hover:bg-info/90 dark:bg-info-dark dark:hover:bg-info-dark/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                "Créer mon compte"
              )}
            </Button>
            <div className="text-center text-sm text-muted-foreground dark:text-muted-foreground">
              Vous avez déjà un compte ?{" "}
              <Link href="/login">
                <a className="text-info dark:text-info-dark hover:text-info dark:text-info-dark font-medium hover:underline">
                  Se connecter
                </a>
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
