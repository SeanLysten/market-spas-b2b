import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Waves, Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.auth.loginLocal.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (err) => {
      setError(err.message);
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top brand bar */}
      <div className="bg-primary px-4 py-5 text-center">
        <div className="flex items-center justify-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Market Spas</span>
        </div>
        <p className="text-primary-foreground/80 text-sm">Portail Partenaires B2B</p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Title */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-1">Connexion</h1>
            <p className="text-muted-foreground text-sm">Accédez à votre espace partenaire</p>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                Adresse email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
                className="h-12 text-base border-2 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                  Mot de passe
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 hover:underline font-medium"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="h-12 text-base border-2 focus:border-primary pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit button — large, high contrast */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Connexion en cours...
                </span>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          {/* Footer note */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Accès réservé aux partenaires Market Spas.<br />
            Contactez-nous pour obtenir vos identifiants.
          </p>
        </div>
      </div>

      {/* Bottom brand footer */}
      <div className="px-4 py-4 text-center border-t border-border/50">
        <p className="text-xs text-muted-foreground">© 2026 Market Spas — Tous droits réservés</p>
      </div>
    </div>
  );
}
