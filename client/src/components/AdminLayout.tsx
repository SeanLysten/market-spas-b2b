import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Image as ImageIcon,
  ShoppingBag,
  Mail,
  Building2,
  FileSpreadsheet,
  Target,
  BookOpen,
  TrendingUp,
  MapPin,
  Wrench,
  Map,
  Cog,
  ChevronDown,
  Megaphone,
  ShoppingCart,
  FolderOpen,
  HeadphonesIcon,
  MessageSquare,
  BarChart3,
  CalendarDays,
  ArrowRightLeft,
  Truck as TruckIcon,
  Activity,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  module?: string;
}

interface NavGroup {
  label: string;
  icon: any;
  items: NavItem[];
}

type NavEntry = NavItem | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return 'items' in entry;
}

const ROUTE_MODULE_MAP: Record<string, string> = {
  '/admin': 'dashboard',
  '/admin/products': 'products',
  '/admin/forecast': 'stock',
  '/admin/orders': 'orders',
  '/admin/partners': 'partners',
  '/admin/reports': 'reports',
  '/admin/territories': 'territories',
  '/admin/leads': 'marketing',
  '/admin/partner-map': 'partner_map',
  '/admin/resources': 'resources',
  '/admin/technical-resources': 'technical_resources',
  '/admin/after-sales': 'sav',
  '/admin/spare-parts': 'spare_parts',
  '/admin/calendar': 'calendar',
  '/admin/newsletter': 'newsletter',
  '/admin/users': 'users',
  '/admin/supplier-integration': 'settings',
  '/admin/settings': 'settings',
  '/admin/webhook-logs': 'settings',
};

function hasModuleAccess(user: any, module: string): boolean {
  if (user?.role === 'SUPER_ADMIN') return true;
  if (user?.role === 'ADMIN' && !user?.adminPermissions) return true;
  try {
    const perms = typeof user?.adminPermissions === 'string' 
      ? JSON.parse(user.adminPermissions) 
      : user?.adminPermissions;
    if (!perms?.modules) return true;
    return perms.modules[module]?.view === true;
  } catch {
    return true;
  }
}

const STORAGE_KEY = 'admin-sidebar-expanded';

function getInitialExpanded(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

function saveExpanded(expanded: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expanded));
  } catch {}
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(getInitialExpanded);
  const logoutMutation = trpc.auth.logout.useMutation();

  const allNavigation: NavEntry[] = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: "Produits & Stock",
      icon: Package,
      items: [
        { name: "Produits", href: "/admin/products", icon: Package },
        { name: "Prévisions Stock", href: "/admin/forecast", icon: TrendingUp },
        { name: "Frais de transport", href: "/admin/shipping-zones", icon: TruckIcon },
      ],
    },
    {
      label: "Ventes & Partenaires",
      icon: ShoppingCart,
      items: [
        { name: "Commandes", href: "/admin/orders", icon: ShoppingBag },
        { name: "Partenaires", href: "/admin/partners", icon: Building2 },
        { name: "Rapports", href: "/admin/reports", icon: FileSpreadsheet },
      ],
    },
    {
      label: "Marketing & Leads",
      icon: Megaphone,
      items: [
        { name: "Territoires", href: "/admin/territories", icon: MapPin },
        { name: "Leads", href: "/admin/leads", icon: Target },
        { name: "Carte du Réseau", href: "/admin/partner-map", icon: Map },
      ],
    },
    {
      label: "Médiathèque",
      icon: FolderOpen,
      items: [
        { name: "Ressources média", href: "/admin/resources", icon: ImageIcon },
        { name: "Ressources Techniques", href: "/admin/technical-resources", icon: BookOpen },
      ],
    },
    {
      label: "Service Après-Vente",
      icon: HeadphonesIcon,
      items: [
        { name: "SAV", href: "/admin/after-sales", icon: Wrench },
        { name: "Pièces Détachées", href: "/admin/spare-parts", icon: Cog },
      ],
    },
    {
      label: "Communication",
      icon: MessageSquare,
      items: [
        { name: "Agenda", href: "/admin/calendar", icon: CalendarDays },
        { name: "Newsletter", href: "/admin/newsletter", icon: Mail },
      ],
    },
    {
      label: "Paramètres",
      icon: Settings,
      items: [
        { name: "Paramètres généraux", href: "/admin/settings", icon: Settings },
        { name: "Équipe interne", href: "/admin/users", icon: Users, module: "users" },
        ...(user?.role === 'SUPER_ADMIN' ? [{ name: "Intégration Fournisseur", href: "/admin/supplier-integration", icon: ArrowRightLeft }] : []),
        { name: "Logs Webhooks", href: "/admin/webhook-logs", icon: Activity },
      ],
    },
  ];

  const navigation = allNavigation.reduce<NavEntry[]>((acc, entry) => {
    if (isGroup(entry)) {
      const filteredItems = entry.items.filter((item) => {
        const module = ROUTE_MODULE_MAP[item.href];
        return !module || hasModuleAccess(user, module);
      });
      if (filteredItems.length > 0) {
        acc.push({ ...entry, items: filteredItems });
      }
    } else {
      const module = ROUTE_MODULE_MAP[entry.href];
      if (!module || hasModuleAccess(user, module)) {
        acc.push(entry);
      }
    }
    return acc;
  }, []);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Ignore errors
    } finally {
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    const newExpanded = { ...expanded };
    let changed = false;
    for (const entry of navigation) {
      if (isGroup(entry)) {
        const hasActive = entry.items.some(
          (item) => location === item.href || location.startsWith(item.href + '/')
        );
        if (hasActive && !newExpanded[entry.label]) {
          newExpanded[entry.label] = true;
          changed = true;
        }
      }
    }
    if (changed) {
      setExpanded(newExpanded);
      saveExpanded(newExpanded);
    }
  }, [location]);

  const toggleGroup = (label: string) => {
    const newExpanded = { ...expanded, [label]: !expanded[label] };
    setExpanded(newExpanded);
    saveExpanded(newExpanded);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center space-y-4 animate-fade-in-up">
          <h1 className="text-2xl text-display font-bold">Accès refusé</h1>
          <p className="text-muted-foreground">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <Link href="/dashboard">
            <Button className="btn-hover">Retour au dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const renderNavItem = (item: NavItem, indent = false) => {
    const isActive =
      item.href === '/admin'
        ? location === '/admin'
        : location === item.href || location.startsWith(item.href + '/');
    const Icon = item.icon;
    return (
      <Link key={item.name} href={item.href}>
        <div
          className={`relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group ${
            indent ? 'ml-2 px-3 py-1.5' : 'px-3 py-2'
          } ${
            isActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
          onClick={() => setSidebarOpen(false)}
        >
          {/* Active indicator bar */}
          {isActive && !indent && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-primary-foreground/60"
              style={{
                height: '60%',
                animation: 'slideIndicator 300ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
              }}
            />
          )}
          <Icon className={`${indent ? 'w-4 h-4' : 'w-5 h-5'} flex-shrink-0 transition-transform duration-200 ${!isActive ? 'group-hover:scale-110' : ''}`} />
          <span className="truncate">{item.name}</span>
        </div>
      </Link>
    );
  };

  const renderNavGroup = (group: NavGroup) => {
    const isOpen = !!expanded[group.label];
    const hasActive = group.items.some(
      (item) => location === item.href || location.startsWith(item.href + '/')
    );
    const Icon = group.icon;

    return (
      <div key={group.label} className="space-y-0.5">
        <button
          onClick={() => toggleGroup(group.label)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group ${
            hasActive && !isOpen
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <Icon className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
          <span className="truncate flex-1 text-left">{group.label}</span>
          <ChevronDown
            className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ease-out ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
        <div
          className="overflow-hidden transition-all duration-300 ease-out"
          style={{
            maxHeight: isOpen ? `${group.items.length * 44}px` : '0px',
            opacity: isOpen ? 1 : 0,
          }}
        >
          <div className="ml-4 pl-3 border-l-2 border-border/40 space-y-0.5 py-0.5">
            {group.items.map((item) => renderNavItem(item, true))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          style={{ animationDuration: '150ms' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r transform transition-transform duration-300 ease-out lg:translate-x-0 custom-scrollbar ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663031645455/jX4Ppf2KXZ8z9Tppipem7T/logo-market-spa_177731cb.png" alt="Market Spas" className="w-8 h-8 rounded-md object-contain" />
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Administration
                  </p>
                  <p className="text-xs text-muted-foreground">Market Spas</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto custom-scrollbar">
            {navigation.map((entry) => {
              if (isGroup(entry)) {
                return renderNavGroup(entry);
              }
              return renderNavItem(entry);
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3 group">
              <Avatar className="ring-2 ring-transparent group-hover:ring-primary/20 transition-all duration-200">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {user.name?.charAt(0) || user.email?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.name || user.email}
                </p>
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
                className="flex-1 gap-2 transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
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
              className="transition-all duration-200 hover:scale-105 active:scale-95"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Administration
            </p>
            <div className="w-10" />
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 lg:p-8 page-enter">{children}</main>
      </div>
    </div>
  );
}
