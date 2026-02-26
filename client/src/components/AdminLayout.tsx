import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Image as ImageIcon,
  ShoppingBag,
  Building2,
  FileSpreadsheet,
  Target,
  BookOpen,
  Calendar,
  TrendingUp,
  MapPin,
  Wrench,
  Map,
  Cog,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/";
  };

  // Vérifier que l'utilisateur est admin
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center space-y-4">
          <h1 className="text-2xl text-display text-display font-bold">Accès refusé</h1>
          <p className="text-muted-foreground">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <Link href="/dashboard">
            <Button>Retour au dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      name: "Produits",
      href: "/admin/products",
      icon: Package,
    },
    {
      name: "Prévisions Stock",
      href: "/admin/forecast",
      icon: TrendingUp,
    },
    {
      name: "Territoires",
      href: "/admin/territories",
      icon: MapPin,
    },
    {
      name: "Ressources média",
      href: "/admin/resources",
      icon: ImageIcon,
    },
    {
      name: "Utilisateurs",
      href: "/admin/users",
      icon: Users,
    },
    {
      name: "Commandes",
      href: "/admin/orders",
      icon: ShoppingBag,
    },
    {
      name: "Partenaires",
      href: "/admin/partners",
      icon: Building2,
    },
    {
      name: "Rapports",
      href: "/admin/reports",
      icon: FileSpreadsheet,
    },
    {
      name: "Leads",
      href: "/admin/leads",
      icon: Target,
    },
    {
      name: "Ressources Techniques",
      href: "/admin/technical-resources",
      icon: BookOpen,
    },
    {
      name: "Carte du Réseau",
      href: "/admin/partner-map",
      icon: Map,
    },
    {
      name: "SAV",
      href: "/admin/after-sales",
      icon: Wrench,
    },
    {
      name: "Pièces Détachées",
      href: "/admin/spare-parts",
      icon: Cog,
    },
    {
      name: "Paramètres",
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Administration</p>
                <p className="text-xs text-muted-foreground">Market Spas</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.name?.charAt(0) || user.email?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name || user.email}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role?.toLowerCase().replace("_", " ")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 bg-card/50 backdrop-blur-sm border-b lg:hidden">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Administration</p>
            <div className="w-10" /> {/* Spacer for alignment */}
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
