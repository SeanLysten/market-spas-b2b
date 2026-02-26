import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { 
  Package, 
  ShoppingCart, 
  FileText, 
  TrendingUp, 
  Users, 
  Image,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl text-display text-display font-bold">Market Spas</h1>
                  <p className="text-xs text-muted-foreground">Portail Partenaires B2B</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium">{user.name || user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role?.toLowerCase().replace('_', ' ')}</p>
                </div>
                <LanguageSwitcher />
                {user.role === 'SUPER_ADMIN' && (
                  <Link href="/admin">
                    <Button variant="outline" className="gap-2">
                      <Users className="w-4 h-4" />
                      {t('nav.admin')}
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard">
                  <Button>
                    {t('home.accessPortal')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Connecté avec succès
              </div>
              <h2 className="text-5xl font-bold tracking-tight">
                Bienvenue sur votre portail B2B
              </h2>
              <p className="text-xl text-display text-display text-muted-foreground">
                Gérez vos commandes, consultez le catalogue et accédez à toutes vos ressources en un seul endroit.
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <Link href="/dashboard">
                  <Button size="lg" className="gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Tableau de bord
                  </Button>
                </Link>
                <Link href="/catalog">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Package className="w-5 h-5" />
                    Catalogue produits
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 bg-card/30">
          <div className="container">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="card-hover border-2">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Commandes simplifiées</CardTitle>
                  <CardDescription>
                    Passez vos commandes en quelques clics avec suivi en temps réel
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="card-hover border-2">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Catalogue complet</CardTitle>
                  <CardDescription>
                    Accédez à tous nos produits avec stock en temps réel
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="card-hover border-2">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Facturation automatique</CardTitle>
                  <CardDescription>
                    Devis et factures générés automatiquement
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="card-hover border-2">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Analytics détaillés</CardTitle>
                  <CardDescription>
                    Suivez vos performances avec des rapports complets
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="card-hover border-2">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Support dédié</CardTitle>
                  <CardDescription>
                    Une équipe à votre écoute pour vous accompagner
                  </CardDescription>
                </CardHeader>
              </Card>

              <Link href="/resources" className="block">
                <Card className="card-hover border-2 h-full transition-all hover:border-primary">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Image className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Ressources média & PLV</CardTitle>
                    <CardDescription>
                      Accédez à tous vos contenus marketing, catalogues et supports PLV
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" size="sm" className="w-full">
                      Voir les ressources
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t bg-card/50 py-8">
          <div className="container">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © 2026 Market Spas. Tous droits réservés.
              </p>
              <div className="flex items-center gap-6">
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Politique de confidentialité
                </Link>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Conditions d'utilisation
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Public landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Package className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl text-display text-display font-bold">Market Spas</h1>
                <p className="text-xs text-muted-foreground">Portail Partenaires B2B</p>
              </div>
            </div>
            <a href={getLoginUrl()}>
              <Button>Connexion</Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Package className="w-4 h-4" />
              Plateforme B2B professionnelle
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight">
              Votre portail partenaire
              <span className="block text-primary mt-2">nouvelle génération</span>
            </h1>
            <p className="text-xl text-display text-display text-muted-foreground">
              Simplifiez vos commandes, gérez votre activité et accédez à toutes vos ressources depuis une plateforme unique et élégante.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <a href={getLoginUrl()}>
                <Button size="lg" className="gap-2">
                  Se connecter
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </a>
              <Button size="lg" variant="outline">
                Devenir partenaire
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une plateforme complète pour gérer efficacement votre activité de revendeur
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: ShoppingCart,
                title: "Commandes simplifiées",
                description: "Passez vos commandes en quelques clics avec un panier intelligent et un suivi en temps réel de vos livraisons."
              },
              {
                icon: Package,
                title: "Catalogue temps réel",
                description: "Consultez notre catalogue complet avec stock actualisé toutes les 5 minutes et informations détaillées sur les arrivages."
              },
              {
                icon: FileText,
                title: "Facturation automatique",
                description: "Recevez automatiquement vos devis, factures d'acompte et factures de solde. Compatible Peppol pour la facturation électronique."
              },
              {
                icon: TrendingUp,
                title: "Analytics puissants",
                description: "Suivez vos performances avec des tableaux de bord détaillés, des rapports exportables et des prévisions commerciales."
              },
              {
                icon: Users,
                title: "Gestion multi-utilisateurs",
                description: "Ajoutez vos collaborateurs avec des rôles personnalisés et gérez les permissions d'accès facilement."
              },
              {
                icon: Image,
                title: "Ressources média & PLV",
                description: "Accédez à une bibliothèque complète de contenus marketing, catalogues, vidéos tutoriels et supports PLV pour votre point de vente."
              },
            ].map((feature, index) => (
              <Card key={index} className="card-hover border-2">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-display text-display">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="border-2 bg-gradient-to-br from-primary/10 to-accent/10">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Prêt à commencer ?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Rejoignez notre réseau de partenaires et bénéficiez d'une plateforme professionnelle pour développer votre activité.
              </p>
              <div className="flex gap-4 justify-center">
                <a href={getLoginUrl()}>
                  <Button size="lg" className="gap-2">
                    Se connecter
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </a>
                <Button size="lg" variant="outline">
                  Nous contacter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Package className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold">Market Spas</p>
                <p className="text-xs text-muted-foreground">Portail B2B</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Politique de confidentialité
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Conditions d'utilisation
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Market Spas. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
