import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Package, Users, ShoppingBag, FileText, TrendingUp, AlertCircle } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  const statsCards = [
    {
      title: "Total Partenaires",
      value: stats?.totalPartners || 0,
      icon: Users,
      description: "Partenaires actifs",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Commandes",
      value: stats?.totalOrders || 0,
      icon: ShoppingBag,
      description: "Toutes les commandes",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Chiffre d'affaires",
      value: `€${(stats?.totalRevenue || 0).toLocaleString("fr-FR")}`,
      icon: TrendingUp,
      description: "Revenu total",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Produits",
      value: stats?.totalProducts || 0,
      icon: Package,
      description: "Dans le catalogue",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard Administration</h1>
          <p className="text-muted-foreground mt-2">
            Vue d'ensemble de la plateforme Market Spas
          </p>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="skeleton h-4 w-24 mb-2" />
                  <div className="skeleton h-8 w-16" />
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="card-hover cursor-pointer" onClick={() => window.location.href = "/admin/products"}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Gérer les produits</CardTitle>
              <CardDescription>
                Ajouter, modifier ou supprimer des produits du catalogue
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-hover cursor-pointer" onClick={() => window.location.href = "/admin/resources"}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Gérer les ressources</CardTitle>
              <CardDescription>
                Uploader et organiser les contenus média et PLV
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-hover cursor-pointer" onClick={() => window.location.href = "/admin/users"}>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Gérer les utilisateurs</CardTitle>
              <CardDescription>
                Inviter de nouveaux utilisateurs et gérer les accès
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Alerts */}
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-orange-900">Alertes système</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-orange-800">
              <p>• Aucune alerte pour le moment</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
