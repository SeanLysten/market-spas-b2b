import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import {
  Package,
  ShoppingCart,
  FileText,
  TrendingUp,
  Users,
  Image,
  ArrowRight,
  Waves,
} from "lucide-react";
import { Link, Redirect } from "wouter";

export default function Home() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     AUTHENTICATED → redirect straight to dashboard
  ───────────────────────────────────────────────────────────── */
  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  /* ─────────────────────────────────────────────────────────────
     PUBLIC (NON-AUTHENTICATED) VIEW
  ───────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 shrink-0 rounded-lg bg-primary flex items-center justify-center">
                <Waves className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-bold text-base leading-tight">Market Spas</p>
                <p className="text-xs text-muted-foreground leading-tight hidden sm:block">Portail Partenaires B2B</p>
              </div>
            </div>
            <a href={getLoginUrl()}>
              <Button size="sm" className="gap-2 font-semibold">
                Se connecter
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Package className="w-3.5 h-3.5" />
            Plateforme B2B professionnelle
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Votre portail partenaire
            <span className="block text-primary mt-1">nouvelle génération</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto">
            Simplifiez vos commandes, gérez votre activité et accédez à toutes vos ressources depuis une plateforme unique.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <a href={getLoginUrl()} className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 h-12 text-base font-semibold">
                Se connecter
                <ArrowRight className="w-5 h-5" />
              </Button>
            </a>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 text-base">
              Devenir partenaire
            </Button>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-4 py-10 md:py-16 bg-muted/30 border-t">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Tout ce dont vous avez besoin</h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
              Une plateforme complète pour gérer efficacement votre activité de revendeur
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: ShoppingCart,
                title: "Commandes simplifiées",
                description: "Passez vos commandes en quelques clics avec suivi en temps réel.",
              },
              {
                icon: Package,
                title: "Catalogue temps réel",
                description: "Consultez notre catalogue complet avec stock actualisé en permanence.",
              },
              {
                icon: FileText,
                title: "Facturation automatique",
                description: "Devis, factures d'acompte et de solde générés automatiquement.",
              },
              {
                icon: TrendingUp,
                title: "Analytics puissants",
                description: "Tableaux de bord détaillés et rapports exportables.",
              },
              {
                icon: Users,
                title: "Multi-utilisateurs",
                description: "Ajoutez vos collaborateurs avec des rôles personnalisés.",
              },
              {
                icon: Image,
                title: "Ressources & PLV",
                description: "Bibliothèque complète de contenus marketing et supports PLV.",
              },
            ].map((feature, index) => (
              <Card key={index} className="border">
                <CardHeader className="pb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription className="text-sm">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 py-10 md:py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-6 md:p-10 text-center space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold">Prêt à commencer ?</h2>
              <p className="text-muted-foreground text-sm md:text-base">
                Rejoignez notre réseau de partenaires et développez votre activité.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <a href={getLoginUrl()} className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto gap-2 h-12 font-semibold">
                    Se connecter <ArrowRight className="w-5 h-5" />
                  </Button>
                </a>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12">
                  Nous contacter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t bg-card/50 px-4 py-5">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Waves className="w-4 h-4 text-primary-foreground" />
            </div>
            <p className="text-sm font-semibold">Market Spas</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Confidentialité
            </Link>
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Conditions
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Market Spas.</p>
        </div>
      </footer>
    </div>
  );
}
