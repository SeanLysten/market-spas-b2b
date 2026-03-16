import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { CardGridSkeleton } from "@/components/CardSkeleton";
import { ListSkeleton } from "@/components/ListSkeleton";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Package,
  ShoppingCart,
  Users,
  Bell,
  LogOut,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Heart,
  FileText,
  Video,
  Wrench,
  Calendar,
  Megaphone,
  Gift,
  MessageSquare,
  Target,
  UserCog,
  Receipt,
  Building2,
  CreditCard,
  XCircle,
  RefreshCw,
  UserCheck,
  UserX,
  FolderOpen,
  ExternalLink,
} from "lucide-react";
import { OnboardingTour } from "@/components/OnboardingTour";
import { useOnboarding } from "@/hooks/useOnboarding";
import { dashboardTour } from "@/config/onboarding-tours";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const onboarding = useOnboarding("dashboard");
  const utils = trpc.useUtils();
  const { data: notificationsData, isLoading: notificationsLoading } = trpc.dashboard.notifications.useQuery({ limit: 5 });
  const notifications = useSafeQuery(notificationsData);
  const { data: unreadCount } = trpc.dashboard.unreadCount.useQuery();
  const markRead = trpc.dashboard.markNotificationRead.useMutation({
    onSuccess: () => {
      utils.dashboard.notifications.invalidate();
      utils.dashboard.unreadCount.invalidate();
    },
  });
  const { data: upcomingEventsData } = trpc.events.upcoming.useQuery({ limit: 5 });
  const upcomingEvents = upcomingEventsData || [];

  // Get team permissions for the current user
  const { data: myPerms } = trpc.team.myPermissions.useQuery();
  const perms = myPerms?.permissions;
  const isOwner = myPerms?.isOwner ?? true;

  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  // Permission helpers
  const canCatalog = perms?.catalog?.view !== false;
  const canResources = perms?.resources?.view !== false;
  const canSav = perms?.sav?.view !== false;
  const canLeads = perms?.leads?.view !== "none" && perms?.leads?.view !== false;
  const canOrders = perms?.orders?.view !== false;
  const canSpareParts = perms?.spareParts?.view !== false;
  const canInvoices = perms?.invoices?.view !== false;
  const canTeam = perms?.team?.manage !== false || perms?.team?.invite !== false;

  // Build quick access cards dynamically
  const quickAccessCards = [];

  if (canCatalog) {
    quickAccessCards.push({
      href: "/catalog",
      icon: Package,
      title: "Catalogue Produits",
      description: "Consultez et commandez vos produits",
      color: "bg-primary/10",
      iconColor: "text-primary",
    });
  }

  if (canResources) {
    quickAccessCards.push({
      href: "/resources",
      icon: FileText,
      title: "Ressources Médias",
      description: "PLV, catalogues et supports marketing",
      color: "bg-purple-500/10",
      iconColor: "text-purple-500",
    });
  }

  if (canResources) {
    quickAccessCards.push({
      href: "/technical-resources",
      icon: Wrench,
      title: "Ressources Techniques",
      description: "Guides de réparation et vidéos tutoriels",
      color: "bg-orange-500/10",
      iconColor: "text-orange-500",
    });
  }

  if (canResources) {
    quickAccessCards.push({
      href: "/technical-resources?tab=forum",
      icon: MessageSquare,
      title: "Forum d'entraide",
      description: "Posez vos questions et partagez vos solutions",
      color: "bg-blue-500/10",
      iconColor: "text-blue-500",
    });
  }

  if (canSav) {
    quickAccessCards.push({
      href: "/after-sales",
      icon: AlertCircle,
      title: "Service Après-Vente",
      description: "Déclarez et suivez vos tickets SAV",
      color: "bg-red-500/10",
      iconColor: "text-red-500",
    });
  }

  // Build secondary actions dynamically
  const secondaryActions = [];

  if (canOrders) {
    secondaryActions.push({
      href: "/orders",
      icon: ShoppingCart,
      title: "Mes commandes",
      description: "Historique et suivi",
      color: "text-primary",
    });
  }

  if (canOrders || canCatalog) {
    secondaryActions.push({
      href: "/cart",
      icon: ShoppingCart,
      title: "Mon panier",
      description: "Articles en cours",
      color: "text-primary",
    });
  }

  if (canCatalog) {
    secondaryActions.push({
      href: "/favorites",
      icon: Heart,
      title: "Mes favoris",
      description: "Produits sauvegardés",
      color: "text-red-500",
    });
  }

  // Profile is always accessible
  secondaryActions.push({
    href: "/profile",
    icon: Users,
    title: "Mon profil",
    description: "Paramètres du compte",
    color: "text-primary",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header data-tour="dashboard-header" className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="space-y-3">
            <div>
              <h1 className="text-xl md:text-2xl text-display font-bold">Tableau de bord</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                Bienvenue, {user?.firstName || user?.name || "Partenaire"}
                {myPerms?.role && !isOwner && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {myPerms.role === "SALES_REP" ? "Commercial" :
                     myPerms.role === "ORDER_MANAGER" ? "Gestionnaire Commandes" :
                     myPerms.role === "ACCOUNTANT" ? "Comptable" :
                     myPerms.role === "FULL_MANAGER" ? "Gestionnaire Complet" :
                     myPerms.role}
                  </span>
                )}
              </p>
            </div>
            {/* Boutons empilés sur mobile */}
            <div className="flex flex-wrap items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                {unreadCount && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              {user?.role === 'PARTNER_ADMIN' && user?.partnerId && (
                <Link href="/company-profile">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Building2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Ma Société</span>
                  </Button>
                </Link>
              )}
              {(isOwner || canTeam) && (
                <Link href="/team">
                  <Button variant="outline" size="sm" className="gap-2">
                    <UserCog className="w-4 h-4" />
                    <span className="hidden sm:inline">Mon Équipe</span>
                  </Button>
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
                    .then(() => { window.location.href = '/'; })
                    .catch(() => { window.location.href = '/'; });
                }}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-8">
        {/* Accès rapides principaux - filtered by permissions */}
        {quickAccessCards.length > 0 && (
          <div data-tour="quick-access" className={`grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-${Math.min(quickAccessCards.length, 5)}`}>
            {quickAccessCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.href} href={card.href}>
                  <Card className="card-hover cursor-pointer h-full hover:border-primary/50 transition-all">
                    <CardContent className="pt-6 text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${card.color} flex items-center justify-center`}>
                        <Icon className={`w-8 h-8 ${card.iconColor}`} />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{card.title}</h3>
                      <p className="text-sm text-muted-foreground">{card.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Section Leads - only if leads access */}
        {canLeads && (
          <Link href="/leads">
            <Card data-tour="leads-section" className="card-hover cursor-pointer hover:border-primary/50 transition-all bg-gradient-to-r from-blue-500/5 to-purple-500/5">
              <CardContent className="py-6">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Target className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Mes Leads</h3>
                    <p className="text-sm text-muted-foreground">
                      Gérez les prospects de votre zone et suivez vos opportunités commerciales
                    </p>
                  </div>
                  <ArrowUpRight className="w-6 h-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Événements à venir */}
          <Card data-tour="events-section">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Événements à venir
                  </CardTitle>
                  <CardDescription>Promotions et annonces</CardDescription>
                </div>
                <Link href="/calendar">
                  <Button variant="ghost" size="sm">
                    Voir tout
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingEvents && upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event: any) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        event.type === 'PROMOTION' ? 'bg-emerald-500 dark:bg-emerald-400/10' :
                        event.type === 'EVENT' ? 'bg-blue-500/10' :
                        'bg-orange-500/10'
                      }`}>
                        {event.type === 'PROMOTION' && <Gift className="w-5 h-5 text-green-500" />}
                        {event.type === 'EVENT' && <Calendar className="w-5 h-5 text-blue-500" />}
                        {event.type === 'ANNOUNCEMENT' && <Megaphone className="w-5 h-5 text-orange-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium mb-1">{event.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(event.startDate).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun événement à venir</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    Consultez le calendrier pour voir toutes les dates importantes
                  </p>
                  <Link href="/calendar">
                    <Button variant="outline" size="sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      Ouvrir le calendrier
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card data-tour="notifications-section">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Notifications
                  </CardTitle>
                  <CardDescription>Dernières mises à jour</CardDescription>
                </div>
                {unreadCount && unreadCount > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    {unreadCount} non lues
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {notifications && notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notification) => {
                    const iconMap: Record<string, React.ReactNode> = {
                      ORDER_CREATED: <ShoppingCart className="w-5 h-5 text-blue-600" />,
                      ORDER_STATUS_CHANGED: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
                      PAYMENT_RECEIVED: <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
                      PAYMENT_FAILED: <XCircle className="w-5 h-5 text-red-600" />,
                      REFUND_PROCESSED: <RefreshCw className="w-5 h-5 text-orange-600" />,
                      DEPOSIT_REMINDER: <AlertCircle className="w-5 h-5 text-yellow-600" />,
                      NEW_PARTNER: <Building2 className="w-5 h-5 text-blue-600" />,
                      PARTNER_APPROVED: <UserCheck className="w-5 h-5 text-emerald-600" />,
                      PARTNER_SUSPENDED: <UserX className="w-5 h-5 text-red-600" />,
                      SAV_CREATED: <Wrench className="w-5 h-5 text-orange-600" />,
                      SAV_STATUS_CHANGED: <Wrench className="w-5 h-5 text-blue-600" />,
                      NEW_RESOURCE: <FolderOpen className="w-5 h-5 text-purple-600" />,
                      LEAD_ASSIGNED: <Target className="w-5 h-5 text-teal-600" />,
                      STOCK_LOW: <AlertCircle className="w-5 h-5 text-yellow-600" />,
                    };
                    const icon = iconMap[notification.type] || <Bell className="w-5 h-5 text-primary" />;
                    const hasLink = !!(notification as any).linkUrl;

                    const handleClick = () => {
                      if (!notification.isRead) {
                        markRead.mutate({ id: notification.id });
                      }
                      if (hasLink) {
                        window.location.href = (notification as any).linkUrl;
                      }
                    };

                    return (
                      <div
                        key={notification.id}
                        onClick={handleClick}
                        className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
                          notification.isRead ? 'bg-card' : 'bg-accent/5 border-primary/20'
                        } ${hasLink ? 'cursor-pointer hover:bg-accent/10 hover:border-primary/30' : ''}`}
                      >
                        <div className="flex-shrink-0 mt-1">
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm mb-1 ${notification.isRead ? 'font-medium' : 'font-semibold'}`}>{notification.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {hasLink && (
                              <span className="text-xs text-primary flex items-center gap-1">
                                {(notification as any).linkText || 'Voir'}
                                <ExternalLink className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>
                        {!notification.isRead && (
                          <div className="flex-shrink-0 mt-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune notification</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions secondaires - filtered by permissions */}
        {secondaryActions.length > 0 && (
          <Card data-tour="secondary-actions">
            <CardHeader>
              <CardTitle>Autres accès</CardTitle>
              <CardDescription>Gérez vos commandes et favoris</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(secondaryActions.length, 4)}`}>
                {secondaryActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.href} href={action.href}>
                      <Button variant="outline" className="w-full h-auto py-6 flex-col gap-2">
                        <Icon className={`w-8 h-8 ${action.color}`} />
                        <span className="font-semibold">{action.title}</span>
                        <span className="text-xs text-muted-foreground">{action.description}</span>
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lien admin si applicable */}
        {isAdmin && (
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Accès Administration</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Gérer les produits, partenaires, leads et statistiques
                    </p>
                  </div>
                </div>
                <Link href="/admin" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto">
                    Ouvrir l'admin
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <OnboardingTour
        steps={dashboardTour}
        isActive={onboarding.isActive}
        currentStep={onboarding.currentStep}
        onNext={onboarding.nextStep}
        onPrev={onboarding.prevStep}
        onSkip={onboarding.skipTour}
        onComplete={onboarding.markCompleted}
      />
    </div>
  );
}
