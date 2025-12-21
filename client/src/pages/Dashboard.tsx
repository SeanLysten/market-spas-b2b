import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  Euro,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: recentOrders, isLoading: ordersLoading } = trpc.dashboard.recentOrders.useQuery({ limit: 5 });
  const { data: notifications } = trpc.dashboard.notifications.useQuery({ limit: 5 });
  const { data: unreadCount } = trpc.dashboard.unreadCount.useQuery();

  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "text-gray-600 bg-gray-100",
      PENDING_DEPOSIT: "text-yellow-600 bg-yellow-100",
      DEPOSIT_PAID: "text-blue-600 bg-blue-100",
      IN_PRODUCTION: "text-purple-600 bg-purple-100",
      SHIPPED: "text-green-600 bg-green-100",
      DELIVERED: "text-green-700 bg-green-200",
      COMPLETED: "text-green-800 bg-green-300",
      CANCELLED: "text-red-600 bg-red-100",
    };
    return colors[status] || "text-gray-600 bg-gray-100";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: "Brouillon",
      PENDING_APPROVAL: "En attente d'approbation",
      PENDING_DEPOSIT: "En attente d'acompte",
      DEPOSIT_PAID: "Acompte payé",
      IN_PRODUCTION: "En production",
      READY_TO_SHIP: "Prêt à expédier",
      SHIPPED: "Expédié",
      DELIVERED: "Livré",
      COMPLETED: "Terminé",
      CANCELLED: "Annulé",
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Tableau de bord</h1>
              <p className="text-sm text-muted-foreground">
                Bienvenue, {user?.firstName || user?.name || "Partenaire"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                {unreadCount && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              <Link href="/">
                <Button variant="ghost" size="sm">Accueil</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Commandes totales
              </CardTitle>
              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {statsLoading ? (
                  <div className="skeleton h-9 w-20" />
                ) : (
                  stats?.totalOrders || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-green-600">+12%</span> ce mois
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Chiffre d'affaires
              </CardTitle>
              <Euro className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {statsLoading ? (
                  <div className="skeleton h-9 w-32" />
                ) : (
                  `€${(stats?.totalRevenue || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-green-600">+8%</span> ce mois
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Produits disponibles
              </CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {statsLoading ? (
                  <div className="skeleton h-9 w-20" />
                ) : (
                  stats?.totalProducts || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Catalogue complet
              </p>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Partenaires actifs
                </CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {statsLoading ? (
                    <div className="skeleton h-9 w-20" />
                  ) : (
                    stats?.totalPartners || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-green-600">+3</span> ce mois
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Commandes récentes</CardTitle>
                  <CardDescription>Vos dernières commandes</CardDescription>
                </div>
                <Link href="/orders">
                  <Button variant="ghost" size="sm">
                    Voir tout
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton h-20 w-full" />
                  ))}
                </div>
              ) : recentOrders && recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{order.orderNumber}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          €{Number(order.totalTTC).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune commande pour le moment</p>
                  <Link href="/catalog">
                    <Button className="mt-4" size="sm">
                      Parcourir le catalogue
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Notifications</CardTitle>
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
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex gap-3 p-4 rounded-lg border transition-colors ${
                        notification.isRead ? 'bg-card' : 'bg-accent/5 border-primary/20'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {notification.type === 'ORDER_STATUS_CHANGED' && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                        {notification.type === 'PAYMENT_RECEIVED' && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                        {notification.type === 'STOCK_LOW' && (
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                        )}
                        {!['ORDER_STATUS_CHANGED', 'PAYMENT_RECEIVED', 'STOCK_LOW'].includes(notification.type) && (
                          <Bell className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm mb-1">{notification.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Accédez rapidement aux fonctionnalités principales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Link href="/catalog">
                <Button variant="outline" className="w-full h-auto py-6 flex-col gap-2">
                  <Package className="w-8 h-8 text-primary" />
                  <span className="font-semibold">Catalogue</span>
                  <span className="text-xs text-muted-foreground">Parcourir les produits</span>
                </Button>
              </Link>

              <Link href="/orders/new">
                <Button variant="outline" className="w-full h-auto py-6 flex-col gap-2">
                  <ShoppingCart className="w-8 h-8 text-primary" />
                  <span className="font-semibold">Nouvelle commande</span>
                  <span className="text-xs text-muted-foreground">Passer une commande</span>
                </Button>
              </Link>

              <Link href="/resources">
                <Button variant="outline" className="w-full h-auto py-6 flex-col gap-2">
                  <Package className="w-8 h-8 text-primary" />
                  <span className="font-semibold">Ressources</span>
                  <span className="text-xs text-muted-foreground">Documentation & médias</span>
                </Button>
              </Link>

              {isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" className="w-full h-auto py-6 flex-col gap-2">
                    <Users className="w-8 h-8 text-primary" />
                    <span className="font-semibold">Administration</span>
                    <span className="text-xs text-muted-foreground">Gérer le portail</span>
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
