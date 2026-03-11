import { AdminLayout } from "@/components/AdminLayout";
import AdminGoogleAnalytics from "@/components/AdminGoogleAnalytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  Package, 
  Users, 
  ShoppingBag, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  AlertCircle, 
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Euro,
  BarChart3,
  Activity,
  Target,
  Megaphone,
  Wrench,
  Mail,
  Calendar,
  Settings,
  Map,
  HeadphonesIcon,
} from "lucide-react";
import { Link } from "wouter";
import SalesChart from "@/components/charts/SalesChart";
import TopProductsChart from "@/components/charts/TopProductsChart";

// Helper to check admin module access
function hasModule(
  userRole: string | undefined,
  adminPermissions: any,
  module: string
): boolean {
  if (userRole === "SUPER_ADMIN") return true;
  if (userRole !== "ADMIN" || !adminPermissions) return false;
  const modulePerms = adminPermissions?.modules?.[module];
  return modulePerms?.view === true;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const userRole = user?.role;
  const adminPerms = (user as any)?.adminPermissions;

  // Check module access
  const canOrders = hasModule(userRole, adminPerms, "orders");
  const canPartners = hasModule(userRole, adminPerms, "partners");
  const canProducts = hasModule(userRole, adminPerms, "products");
  const canStock = hasModule(userRole, adminPerms, "stock");
  const canMarketing = hasModule(userRole, adminPerms, "marketing");
  const canSav = hasModule(userRole, adminPerms, "sav");
  const canSpareParts = hasModule(userRole, adminPerms, "spare_parts");
  const canResources = hasModule(userRole, adminPerms, "resources");
  const canTechnicalResources = hasModule(userRole, adminPerms, "technical_resources");
  const canNewsletter = hasModule(userRole, adminPerms, "newsletter");
  const canCalendar = hasModule(userRole, adminPerms, "calendar");
  const canUsers = hasModule(userRole, adminPerms, "users");
  const canSettings = hasModule(userRole, adminPerms, "settings");
  const canReports = hasModule(userRole, adminPerms, "reports");
  const canTerritories = hasModule(userRole, adminPerms, "territories");
  const canPartnerMap = hasModule(userRole, adminPerms, "partner_map");

  // Only fetch data for modules the user has access to
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: recentOrders } = trpc.orders.list.useQuery({ limit: 5 }, { enabled: canOrders });
  const recentOrdersSafe = useSafeQuery(recentOrders);
  const { data: lowStockProducts } = trpc.products.list.useQuery({ limit: 100 }, { enabled: canStock || canProducts });
  const lowStockProductsSafe = useSafeQuery(lowStockProducts);
  
  // Analytics data - only fetch if relevant modules accessible
  const { data: salesData } = trpc.admin.analytics.salesByMonth.useQuery({ months: 6 }, { enabled: canOrders || canReports });
  const salesDataSafe = useSafeQuery(salesData);
  const { data: topProductsData } = trpc.admin.analytics.topProducts.useQuery({ limit: 5 }, { enabled: canProducts || canReports });
  const topProductsDataSafe = useSafeQuery(topProductsData);

  // Filter low stock products
  const lowStock = lowStockProducts?.filter((p: any) => (p.stockQuantity || 0) <= 5) || [];

  // Build stats cards dynamically based on permissions
  const statsCards = [];
  
  if (canPartners) {
    statsCards.push({
      title: "Partenaires actifs",
      value: stats?.totalPartners || 0,
      icon: Users,
      description: "+12% ce mois",
      trend: "up" as const,
      color: "text-info dark:text-info-dark",
      bgColor: "bg-info/10 dark:bg-info-light",
    });
  }
  
  if (canOrders) {
    statsCards.push({
      title: "Commandes ce mois",
      value: stats?.totalOrders || 0,
      icon: ShoppingBag,
      description: "vs. mois dernier",
      trend: "up" as const,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    });
    statsCards.push({
      title: "Chiffre d'affaires",
      value: `${(stats?.totalRevenue || 0).toLocaleString("fr-FR")} €`,
      icon: Euro,
      description: "+8% ce mois",
      trend: "up" as const,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
    });
  }
  
  if (canStock || canProducts) {
    statsCards.push({
      title: "Produits en stock",
      value: stats?.totalProducts || 0,
      icon: Package,
      description: `${lowStock.length} en stock bas`,
      trend: (lowStock.length > 0 ? "warning" : "neutral") as "warning" | "neutral",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-500/10 dark:bg-orange-500/20",
    });
  }

  // Build quick action cards based on permissions
  const quickActions = [];
  if (canProducts || canStock) {
    quickActions.push({
      href: "/admin/products",
      icon: Package,
      title: "Produits",
      description: "Gérer le catalogue produits",
      color: "text-primary",
      bgColor: "bg-primary/10",
      hoverBg: "group-hover:bg-primary/20",
    });
  }
  if (canPartners) {
    quickActions.push({
      href: "/admin/partners",
      icon: Users,
      title: "Partenaires",
      description: "Gérer les comptes partenaires",
      color: "text-info dark:text-info-dark",
      bgColor: "bg-info/10 dark:bg-info-light",
      hoverBg: "group-hover:bg-info/20 dark:group-hover:bg-info-light/80",
    });
  }
  if (canOrders) {
    quickActions.push({
      href: "/admin/orders",
      icon: ShoppingBag,
      title: "Commandes",
      description: "Gérer les commandes",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
      hoverBg: "group-hover:bg-emerald-500/20 dark:group-hover:bg-emerald-500/30",
    });
  }
  if (canMarketing) {
    quickActions.push({
      href: "/admin/leads",
      icon: Target,
      title: "Marketing & Leads",
      description: "Gérer les leads et campagnes",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
      hoverBg: "group-hover:bg-blue-500/20 dark:group-hover:bg-blue-500/30",
    });
  }
  if (canSav) {
    quickActions.push({
      href: "/admin/after-sales",
      icon: HeadphonesIcon,
      title: "Service Après-Vente",
      description: "Gérer les tickets SAV",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-500/10 dark:bg-red-500/20",
      hoverBg: "group-hover:bg-red-500/20 dark:group-hover:bg-red-500/30",
    });
  }
  if (canSpareParts) {
    quickActions.push({
      href: "/admin/spare-parts",
      icon: Wrench,
      title: "Pièces Détachées",
      description: "Gérer les pièces et modèles",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-500/10 dark:bg-orange-500/20",
      hoverBg: "group-hover:bg-orange-500/20 dark:group-hover:bg-orange-500/30",
    });
  }
  if (canResources) {
    quickActions.push({
      href: "/admin/resources",
      icon: FileText,
      title: "Ressources Médias",
      description: "Gérer les médias et PLV",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
      hoverBg: "group-hover:bg-purple-500/20 dark:group-hover:bg-purple-500/30",
    });
  }
  if (canTechnicalResources) {
    quickActions.push({
      href: "/admin/technical-resources",
      icon: Wrench,
      title: "Ressources Techniques",
      description: "Guides et vidéos techniques",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
      hoverBg: "group-hover:bg-amber-500/20 dark:group-hover:bg-amber-500/30",
    });
  }
  if (canNewsletter) {
    quickActions.push({
      href: "/admin/newsletter",
      icon: Mail,
      title: "Newsletter",
      description: "Gérer les campagnes email",
      color: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-500/10 dark:bg-teal-500/20",
      hoverBg: "group-hover:bg-teal-500/20 dark:group-hover:bg-teal-500/30",
    });
  }
  if (canCalendar) {
    quickActions.push({
      href: "/admin/calendar",
      icon: Calendar,
      title: "Agenda",
      description: "Événements et promotions",
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-500/10 dark:bg-indigo-500/20",
      hoverBg: "group-hover:bg-indigo-500/20 dark:group-hover:bg-indigo-500/30",
    });
  }
  if (canTerritories) {
    quickActions.push({
      href: "/admin/territories",
      icon: Map,
      title: "Territoires",
      description: "Gérer les zones commerciales",
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-500/10 dark:bg-cyan-500/20",
      hoverBg: "group-hover:bg-cyan-500/20 dark:group-hover:bg-cyan-500/30",
    });
  }
  if (canPartnerMap) {
    quickActions.push({
      href: "/admin/partner-map",
      icon: Map,
      title: "Carte du Réseau",
      description: "Visualiser le réseau partenaires",
      color: "text-sky-600 dark:text-sky-400",
      bgColor: "bg-sky-500/10 dark:bg-sky-500/20",
      hoverBg: "group-hover:bg-sky-500/20 dark:group-hover:bg-sky-500/30",
    });
  }
  if (canReports) {
    quickActions.push({
      href: "/admin/reports",
      icon: BarChart3,
      title: "Rapports",
      description: "Exporter les données",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
      hoverBg: "group-hover:bg-emerald-500/20 dark:group-hover:bg-emerald-500/30",
    });
  }
  if (canUsers) {
    quickActions.push({
      href: "/admin/users",
      icon: Users,
      title: "Utilisateurs",
      description: "Gérer les accès",
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-500/10 dark:bg-violet-500/20",
      hoverBg: "group-hover:bg-violet-500/20 dark:group-hover:bg-violet-500/30",
    });
  }
  if (canSettings) {
    quickActions.push({
      href: "/admin/settings",
      icon: Settings,
      title: "Paramètres",
      description: "Configuration du portail",
      color: "text-gray-600 dark:text-gray-400",
      bgColor: "bg-gray-500/10 dark:bg-gray-500/20",
      hoverBg: "group-hover:bg-gray-500/20 dark:group-hover:bg-gray-500/30",
    });
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      PENDING_APPROVAL: { label: "En attente", variant: "secondary" },
      PENDING_DEPOSIT: { label: "Acompte requis", variant: "outline" },
      DEPOSIT_PAID: { label: "Acompte payé", variant: "default" },
      IN_PRODUCTION: { label: "En production", variant: "default" },
      READY_TO_SHIP: { label: "Prêt à expédier", variant: "default" },
      SHIPPED: { label: "Expédié", variant: "default" },
      DELIVERED: { label: "Livré", variant: "default" },
      COMPLETED: { label: "Terminé", variant: "default" },
      CANCELLED: { label: "Annulé", variant: "destructive" },
    };
    const config = statusConfig[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (price: number | string | null) => {
    if (!price) return "0.00 €";
    return `${Number(price).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`;
  };

  // Determine role label for header
  const getRoleLabel = () => {
    if (userRole === "SUPER_ADMIN") return "Super Administrateur";
    if (!adminPerms?.modules) return "Administrateur";
    const preset = (user as any)?.adminRolePreset;
    const presetLabels: Record<string, string> = {
      SUPER_ADMIN: "Super Administrateur",
      ADMIN_FULL: "Administrateur Complet",
      ADMIN_STOCK: "Gestionnaire Stock",
      ADMIN_SAV: "Gestionnaire SAV",
      ADMIN_MARKETING: "Gestionnaire Marketing",
      ADMIN_ORDERS: "Gestionnaire Commandes",
      ADMIN_CUSTOM: "Administrateur",
    };
    return presetLabels[preset] || "Administrateur";
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard Administration</h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              {getRoleLabel()} — {user?.firstName || user?.name || "Admin"}
            </p>
          </div>
          {/* Boutons empilés sur mobile, côte à côte sur desktop */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/dashboard" className="flex-1 sm:flex-none">
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <Activity className="w-4 h-4" />
                Dashboard Utilisateur
              </Button>
            </Link>
            {canReports && (
              <Link href="/admin/reports" className="flex-1 sm:flex-none">
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <BarChart3 className="w-4 h-4" />
                  Rapports
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid - only show cards for accessible modules */}
        {statsCards.length > 0 && (
          isLoading ? (
            <div className={`grid gap-4 md:p-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(statsCards.length, 4)}`}>
              {statsCards.map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <div className="skeleton h-4 w-24 mb-2 bg-muted animate-pulse rounded" />
                    <div className="skeleton h-8 w-16 bg-muted animate-pulse rounded" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className={`grid gap-4 md:p-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(statsCards.length, 4)}`}>
              {statsCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.title} className="card-hover">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl text-display font-bold">{stat.value}</div>
                      <div className="flex items-center gap-1 mt-1">
                        {stat.trend === "up" && <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                        {stat.trend === "down" && <TrendingDown className="w-3 h-3 text-destructive" />}
                        {stat.trend === "warning" && <AlertTriangle className="w-3 h-3 text-orange-600 dark:text-orange-400" />}
                        <p className={`text-xs ${
                          stat.trend === "up" ? "text-emerald-600 dark:text-emerald-400" : 
                          stat.trend === "down" ? "text-destructive" : 
                          stat.trend === "warning" ? "text-orange-600 dark:text-orange-400" : 
                          "text-muted-foreground"
                        }`}>
                          {stat.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        )}

        {/* Main Content Grid - conditional sections */}
        {(canOrders || canStock || canProducts) && (
          <div className="grid gap-4 md:p-6 grid-cols-1 md:grid-cols-2">
            {/* Recent Orders - only if orders access */}
            {canOrders && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Commandes récentes
                    </CardTitle>
                    <CardDescription>Les 5 dernières commandes</CardDescription>
                  </div>
                  <Link href="/admin/orders">
                    <Button variant="ghost" size="sm" className="gap-1 w-full sm:w-auto">
                      Voir tout <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {recentOrders && recentOrders.length > 0 ? (
                    <div className="space-y-4">
                      {recentOrdersSafe.map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <ShoppingBag className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{order.orderNumber}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatPrice(order.totalTTC)}</p>
                            {getStatusBadge(order.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune commande récente</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Low Stock Alert - only if stock/products access */}
            {(canStock || canProducts) && (
              <Card className={lowStock.length > 0 ? "border-orange-500/20 dark:border-orange-500/30" : ""}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className={`w-5 h-5 ${lowStock.length > 0 ? "text-orange-600 dark:text-orange-400" : ""}`} />
                      Alertes de stock
                    </CardTitle>
                    <CardDescription>Produits avec stock bas (&le; 5 unités)</CardDescription>
                  </div>
                  <Link href="/admin/products">
                    <Button variant="ghost" size="sm" className="gap-1 w-full sm:w-auto">
                      Gérer <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {lowStock.length > 0 ? (
                    <div className="space-y-3">
                      {lowStock.slice(0, 5).map((product: any) => (
                        <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-500/20 dark:bg-orange-500/30 flex items-center justify-center">
                              <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                            </div>
                          </div>
                          <Badge variant="destructive" className="bg-orange-600 dark:bg-orange-500">
                            {product.stockQuantity || 0} en stock
                          </Badge>
                        </div>
                      ))}
                      {lowStock.length > 5 && (
                        <p className="text-sm text-center text-muted-foreground">
                          +{lowStock.length - 5} autres produits en stock bas
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-500 dark:text-emerald-400 opacity-70" />
                      <p>Tous les stocks sont à niveau</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Analytics Charts - only if orders or reports access */}
        {(canOrders || canReports) && (
          <div className="grid gap-4 md:p-6 grid-cols-1 md:grid-cols-2">
            {/* Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution des ventes</CardTitle>
                <CardDescription>Chiffre d'affaires et nombre de commandes sur 6 mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {salesData && salesData.length > 0 ? (
                    <SalesChart data={salesData} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>Aucune donnée de vente disponible</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Products Chart */}
            {(canProducts || canReports) && (
              <Card>
                <CardHeader>
                  <CardTitle>Top 5 produits</CardTitle>
                  <CardDescription>Produits les plus vendus par quantité et CA</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {topProductsData && topProductsData.length > 0 ? (
                      <TopProductsChart data={topProductsData} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>Aucune donnée de produit disponible</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Quick Actions - dynamically built based on permissions */}
        {quickActions.length > 0 && (
          <div className={`grid gap-4 md:p-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(quickActions.length, 4)}`}>
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card key={action.href} className="card-hover cursor-pointer group" onClick={() => window.location.href = action.href}>
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-4 ${action.hoverBg} transition-colors`}>
                      <Icon className={`w-6 h-6 ${action.color}`} />
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}

        {/* Google Analytics link - only if marketing access */}
        {canMarketing && (
          <div className="mt-6 p-4 rounded-lg border border-dashed border-muted-foreground/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 192 192" className="h-8 w-8 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="192" height="192" rx="96" fill="#F9AB00"/>
                <path d="M130 29v134a14 14 0 0 0 28 0V29a14 14 0 0 0-28 0z" fill="#E37400"/>
                <path d="M82 96v67a14 14 0 0 0 28 0V96a14 14 0 0 0-28 0z" fill="white"/>
                <circle cx="48" cy="163" r="14" fill="white"/>
              </svg>
              <div>
                <p className="font-medium text-sm">Google Analytics 4 — marketspas.com</p>
                <p className="text-xs text-muted-foreground">Consultez les métriques de trafic dans l'onglet Campagnes</p>
              </div>
            </div>
            <a
              href="/admin/leads"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline shrink-0"
            >
              Voir Analytics
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </a>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
