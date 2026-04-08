import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  Settings,
  Users,
  UsersRound,
  Package,
  ShoppingCart,
  Wrench,
  BookOpen,
  Cog,
  CalendarDays,
} from "lucide-react";
import * as React from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const SIDEBAR_WIDTH = 256;
const SIDEBAR_WIDTH_COLLAPSED = 56;
const SIDEBAR_STORAGE_KEY = "sidebar_collapsed";

const menuItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/dashboard" },
  { icon: Package, label: "Catalogue", path: "/catalog" },
  { icon: ShoppingCart, label: "Commandes", path: "/orders" },
  { icon: Users, label: "Leads", path: "/leads" },
  { icon: Wrench, label: "SAV", path: "/after-sales" },
  { icon: Cog, label: "Pièces Détachées", path: "/spare-parts" },
  { icon: CalendarDays, label: "Calendrier", path: "/calendar" },
  { icon: BookOpen, label: "Ressources", path: "/resources" },
  { icon: UsersRound, label: "Mon Équipe", path: "/team" },
];

function getInitialCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl text-display font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to
              launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-shadow"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = React.useState(getInitialCollapsed);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const toggleSidebar = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  if (isMobile) {
    return (
      <div className="flex min-h-svh w-full flex-col bg-background">
        <MobileHeader onOpenMenu={() => setMobileOpen(true)} />
        <MobileSidebar
          open={mobileOpen}
          onOpenChange={setMobileOpen}
        />
        <main className="flex-1 p-4">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full bg-background">
      <DesktopSidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <main
        className="flex-1 p-4 transition-[margin-left] duration-200 ease-linear"
        style={{
          marginLeft: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH,
        }}
      >
        {children}
      </main>
    </div>
  );
}

/* ─── Desktop Sidebar ─── */
const DesktopSidebar = React.memo(function DesktopSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH;

  return (
    <aside
      className="fixed inset-y-0 left-0 z-10 flex flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-linear overflow-hidden"
      style={{ width: sidebarWidth }}
    >
      {/* Header */}
      <div className="flex h-16 items-center shrink-0 px-3">
        <button
          onClick={onToggle}
          className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
          aria-label="Toggle navigation"
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4 text-muted-foreground" />
          ) : (
            <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {!collapsed && (
          <span className="ml-3 font-semibold tracking-tight truncate whitespace-nowrap">
            Navigation
          </span>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-1">
        <ul className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const isActive = location === item.path;
            return (
              <li key={item.path}>
                <SidebarNavButton
                  icon={item.icon}
                  label={item.label}
                  isActive={isActive}
                  collapsed={collapsed}
                  onClick={() => setLocation(item.path)}
                />
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t p-3 space-y-2">
        <div className="flex items-center gap-2 px-1">
          <ThemeToggle />
          {!collapsed && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Thème
            </span>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <Avatar className="h-9 w-9 border shrink-0">
                <AvatarFallback className="text-xs font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate leading-none">
                    {user?.name || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-1.5">
                    {user?.email || "-"}
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => setLocation("/profile")}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Paramètres</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
});

/* ─── Sidebar Nav Button ─── */
function SidebarNavButton({
  icon: Icon,
  label,
  isActive,
  collapsed,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const button = (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring outline-none ${
        isActive
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : ""
      } ${collapsed ? "justify-center" : ""}`}
      style={{
        height: "2.5rem",
        width: collapsed ? "2.5rem" : "100%",
        padding: collapsed ? "0.5rem" : undefined,
      }}
    >
      <Icon
        className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`}
      />
      {!collapsed && (
        <span className="truncate whitespace-nowrap">{label}</span>
      )}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" align="center">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}

/* ─── Mobile Header ─── */
const MobileHeader = React.memo(function MobileHeader({
  onOpenMenu,
}: {
  onOpenMenu: () => void;
}) {
  const [location] = useLocation();
  const activeMenuItem = menuItems.find((item) => item.path === location);

  return (
    <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg"
          onClick={onOpenMenu}
        >
          <PanelLeft className="h-4 w-4" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
        <span className="tracking-tight text-foreground">
          {activeMenuItem?.label ?? "Menu"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </div>
  );
});

/* ─── Mobile Sidebar (Sheet) ─── */
function MobileSidebar({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const navigate = (path: string) => {
    setLocation(path);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="bg-sidebar text-sidebar-foreground w-72 p-0 [&>button]:hidden"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Menu de navigation principal</SheetDescription>
        </SheetHeader>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center px-4 border-b">
            <span className="font-semibold tracking-tight">Navigation</span>
          </div>

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto px-2 py-2">
            <ul className="flex flex-col gap-1">
              {menuItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={`flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm h-10 transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                        isActive
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : ""
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? "text-primary" : ""
                        }`}
                      />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t p-3 space-y-2">
            <div className="flex items-center gap-2 px-1">
              <ThemeToggle />
              <span className="text-xs text-muted-foreground">Thème</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => navigate("/profile")}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Paramètres</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
