import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslation } from "react-i18next";
import {
  Package,
  ShoppingCart,
  FileText,
  TrendingUp,
  Users,
  Image,
  ArrowRight,
  CheckCircle2,
  Waves,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
     AUTHENTICATED VIEW
  ───────────────────────────────────────────────────────────── */
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* ── Header ── */}
        <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-sm">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              {/* Brand */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 shrink-0 rounded-lg bg-primary flex items-center justify-center">
                  <Waves className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-base leading-tight truncate">Market Spas</p>
                  <p className="text-xs text-muted-foreground leading-tight hidden sm:block">Portail Partenaires B2B</p>
                </div>
              </div>

              {/* Desktop nav */}
              <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium leading-tight">{user.name || user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize leading-tight">
                    {user.role?.toLowerCase().replace("_", " ")}
                  </p>
                </div>
                <ThemeToggle />
                <LanguageSwitcher />
                {user.role === "SUPER_ADMIN" && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Users className="w-4 h-4" />
                      {t("nav.admin")}
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard">
                  <Button size="sm" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    {t("home.accessPortal")}
                  </Button>
                </Link>
              </div>

              {/* Mobile: theme + menu toggle */}
              <div className="flex md:hidden items-center gap-2">
                <ThemeToggle />
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  aria-label="Menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Mobile dropdown menu */}
            {mobileMenuOpen && (
              <div className="md:hidden mt-3 pt-3 border-t space-y-2">
                <div className="flex items-center justify-between pb-2">
                  <div>
                    <p className="text-sm font-semibold">{user.name || user.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user.role?.toLowerCase().replace("_", " ")}
                    </p>
                  </div>
                  <LanguageSwitcher />
                </div>
                {user.role === "SUPER_ADMIN" && (
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full gap-2 justify-start">
                      <Users className="w-4 h-4" />
                      {t("nav.admin")}
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full gap-2 justify-start">
                    <LayoutDashboard className="w-4 h-4" />
                    {t("home.accessPortal")}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="px-4 py-10 md:py-16 text-center">
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Connecté avec succès
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Bienvenue sur votre<br className="hidden sm:block" /> portail B2B
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto">
              Gérez vos commandes, consultez le catalogue et accédez à toutes vos ressources en un seul endroit.
            </p>
            {/* CTA buttons — stacked on mobile */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2 h-12 text-base font-semibold">
                  <TrendingUp className="w-5 h-5" />
                  Tableau de bord
                </Button>
              </Link>
              <Link href="/catalog" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 h-12 text-base">
                  <Package className="w-5 h-5" />
                  Catalogue produits
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Quick access cards ── */}
        <section className="px-4 pb-10 md:pb-16">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Accès rapide
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: ShoppingCart, label: "Commandes", href: "/orders", color: "text-blue-500" },
                { icon: Package, label: "Catalogue", href: "/catalog", color: "text-primary" },
                { icon: FileText, label: "Factures", href: "/invoices", color: "text-amber-500" },
                { icon: TrendingUp, label: "Statistiques", href: "/dashboard", color: "text-emerald-500" },
                { icon: Users, label: "Équipe", href: "/profile", color: "text-purple-500" },
                { icon: Image, label: "Ressources", href: "/resources", color: "text-rose-500" },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <Card className="card-hover border hover:border-primary/40 transition-all cursor-pointer h-full">
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${item.color}`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium text-foreground leading-tight">{item.label}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="px-4 py-10 md:py-16 bg-muted/30 border-t">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl md:text-2xl font-bold text-center mb-8">Vos avantages partenaire</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border">
                <CardHeader className="pb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">Commandes simplifiées</CardTitle>
                  <CardDescription className="text-sm">
                    Passez vos commandes en quelques clics avec suivi en temps réel
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border">
                <CardHeader className="pb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">Catalogue complet</CardTitle>
                  <CardDescription className="text-sm">
                    Accédez à tous nos produits avec stock en temps réel
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border">
                <CardHeader className="pb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">Facturation automatique</CardTitle>
                  <CardDescription className="text-sm">
                    Devis et factures générés automatiquement
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border">
                <CardHeader className="pb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">Analytics détaillés</CardTitle>
                  <CardDescription className="text-sm">
                    Suivez vos performances avec des rapports complets
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border">
                <CardHeader className="pb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">Support dédié</CardTitle>
                  <CardDescription className="text-sm">
                    Une équipe à votre écoute pour vous accompagner
                  </CardDescription>
                </CardHeader>
              </Card>

              <Link href="/resources" className="block">
                <Card className="border hover:border-primary/40 transition-all h-full cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <Image className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Ressources & PLV</CardTitle>
                    <CardDescription className="text-sm">
                      Contenus marketing, catalogues et supports PLV
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button variant="ghost" size="sm" className="w-full text-primary gap-1 text-xs">
                      Voir les ressources <ArrowRight className="w-3 h-3" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t bg-card/50 px-4 py-5 mt-auto">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-muted-foreground">© 2026 Market Spas. Tous droits réservés.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Confidentialité
              </Link>
              <Link href="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Conditions
              </Link>
            </div>
          </div>
        </footer>
      </div>
    );
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
