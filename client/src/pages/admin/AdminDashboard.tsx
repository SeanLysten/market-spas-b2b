import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
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
  Activity
} from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: recentOrders } = trpc.orders.list.useQuery({ limit: 5 });
  const { data: lowStockProducts } = trpc.products.list.useQuery({ limit: 100 });

  // Filter low stock products
  const lowStock = lowStockProducts?.filter((p: any) => (p.stockQuantity || 0) <= 5) || [];

  const statsCards = [
    {
      title: "Partenaires actifs",
      value: stats?.totalPartners || 0,
      icon: Users,
      description: "+12% ce mois",
      trend: "up",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Commandes ce mois",
      value: stats?.totalOrders || 0,
      icon: ShoppingBag,
      description: "vs. mois dernier",
      trend: "up",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Chiffre d'affaires",
      value: `${(stats?.totalRevenue || 0).toLocaleString("fr-FR")} €`,
      icon: Euro,
      description: "+8% ce mois",
      trend: "up",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Produits en stock",
      value: stats?.totalProducts || 0,
      icon: Package,
      description: `${lowStock.length} en stock bas`,
      trend: lowStock.length > 0 ? "warning" : "neutral",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

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

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Administration</h1>
            <p className="text-muted-foreground mt-2">
              Vue d'ensemble de la plateforme Market Spas
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/reports">
              <Button variant="outline" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Rapports
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="skeleton h-4 w-24 mb-2 bg-muted animate-pulse rounded" />
                  <div className="skeleton h-8 w-16 bg-muted animate-pulse rounded" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {stat.trend === "up" && <TrendingUp className="w-3 h-3 text-green-600" />}
                      {stat.trend === "down" && <TrendingDown className="w-3 h-3 text-red-600" />}
                      {stat.trend === "warning" && <AlertTriangle className="w-3 h-3 text-orange-600" />}
                      <p className={`text-xs ${
                        stat.trend === "up" ? "text-green-600" : 
                        stat.trend === "down" ? "text-red-600" : 
                        stat.trend === "warning" ? "text-orange-600" : 
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
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Orders */}
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
                <Button variant="ghost" size="sm" className="gap-1">
                  Voir tout <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentOrders && recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order: any) => (
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

          {/* Low Stock Alert */}
          <Card className={lowStock.length > 0 ? "border-orange-200" : ""}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className={`w-5 h-5 ${lowStock.length > 0 ? "text-orange-600" : ""}`} />
                  Alertes de stock
                </CardTitle>
                <CardDescription>Produits avec stock bas (&le; 5 unités)</CardDescription>
              </div>
              <Link href="/admin/products">
                <Button variant="ghost" size="sm" className="gap-1">
                  Gérer <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {lowStock.length > 0 ? (
                <div className="space-y-3">
                  {lowStock.slice(0, 5).map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Package className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                        </div>
                      </div>
                      <Badge variant="destructive" className="bg-orange-600">
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
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-70" />
                  <p>Tous les stocks sont à niveau</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-hover cursor-pointer group" onClick={() => window.location.href = "/admin/products"}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Produits</CardTitle>
              <CardDescription>
                Gérer le catalogue produits
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-hover cursor-pointer group" onClick={() => window.location.href = "/admin/partners"}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Partenaires</CardTitle>
              <CardDescription>
                Gérer les comptes partenaires
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-hover cursor-pointer group" onClick={() => window.location.href = "/admin/resources"}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Ressources</CardTitle>
              <CardDescription>
                Gérer les médias et PLV
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-hover cursor-pointer group" onClick={() => window.location.href = "/admin/reports"}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Rapports</CardTitle>
              <CardDescription>
                Exporter les données
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
