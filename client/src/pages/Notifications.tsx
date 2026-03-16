import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  Bell,
  BellOff,
  ArrowLeft,
  CheckCheck,
  Filter,
  ShoppingCart,
  CreditCard,
  AlertTriangle,
  Package,
  Users,
  FileText,
  Wrench,
  Target,
  RefreshCw,
  ExternalLink,
  Check,
  Eye,
} from "lucide-react";
import { Link } from "wouter";

// Map notification types to labels and icons
const NOTIFICATION_TYPE_MAP: Record<string, { label: string; icon: typeof Bell; color: string }> = {
  ORDER_CREATED: { label: "Nouvelle commande", icon: ShoppingCart, color: "text-blue-600 dark:text-blue-400" },
  ORDER_STATUS_CHANGED: { label: "Statut commande", icon: Package, color: "text-indigo-600 dark:text-indigo-400" },
  PAYMENT_RECEIVED: { label: "Paiement reçu", icon: CreditCard, color: "text-emerald-600 dark:text-emerald-400" },
  PAYMENT_FAILED: { label: "Paiement échoué", icon: AlertTriangle, color: "text-red-600 dark:text-red-400" },
  INVOICE_READY: { label: "Facture prête", icon: FileText, color: "text-amber-600 dark:text-amber-400" },
  STOCK_LOW: { label: "Stock bas", icon: AlertTriangle, color: "text-orange-600 dark:text-orange-400" },
  NEW_PARTNER: { label: "Nouveau partenaire", icon: Users, color: "text-purple-600 dark:text-purple-400" },
  PARTNER_APPROVED: { label: "Partenaire approuvé", icon: Users, color: "text-emerald-600 dark:text-emerald-400" },
  PARTNER_SUSPENDED: { label: "Partenaire suspendu", icon: Users, color: "text-red-600 dark:text-red-400" },
  NEW_RESOURCE: { label: "Nouvelle ressource", icon: FileText, color: "text-cyan-600 dark:text-cyan-400" },
  SAV_CREATED: { label: "Ticket SAV créé", icon: Wrench, color: "text-yellow-600 dark:text-yellow-400" },
  SAV_STATUS_CHANGED: { label: "Statut SAV modifié", icon: Wrench, color: "text-yellow-600 dark:text-yellow-400" },
  LEAD_ASSIGNED: { label: "Lead assigné", icon: Target, color: "text-pink-600 dark:text-pink-400" },
  DEPOSIT_REMINDER: { label: "Rappel acompte", icon: CreditCard, color: "text-amber-600 dark:text-amber-400" },
  REFUND_PROCESSED: { label: "Remboursement", icon: RefreshCw, color: "text-teal-600 dark:text-teal-400" },
  SYSTEM_ALERT: { label: "Alerte système", icon: AlertTriangle, color: "text-red-600 dark:text-red-400" },
};

type FilterType = "all" | "unread" | "read";
type CategoryFilter = "all" | string;

export default function Notifications() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [statusFilter, setStatusFilter] = useState<FilterType>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  // Use the notifications.list endpoint with higher limit
  const { data: allNotifications, isLoading, refetch } = trpc.notifications.list.useQuery({
    limit: 100,
    unreadOnly: statusFilter === "unread",
  });

  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.getUnreadCount.invalidate();
      utils.dashboard.unreadCount.invalidate();
    },
  });

  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.getUnreadCount.invalidate();
      utils.dashboard.unreadCount.invalidate();
    },
  });

  const { data: unreadCountData } = trpc.notifications.getUnreadCount.useQuery();
  const unreadCount = typeof unreadCountData === "object" ? (unreadCountData as any)?.count ?? 0 : unreadCountData ?? 0;

  // Filter notifications
  const filteredNotifications = (allNotifications || []).filter((n: any) => {
    // Status filter
    if (statusFilter === "read" && !n.isRead) return false;
    // Category filter
    if (categoryFilter !== "all" && n.type !== categoryFilter) return false;
    return true;
  });

  // Get unique types from notifications for the filter
  const availableTypes = [...new Set((allNotifications || []).map((n: any) => n.type as string))];

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl text-display font-bold flex items-center gap-2">
                  <Bell className="w-6 h-6" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 px-2.5 py-0.5 bg-destructive text-destructive-foreground text-sm rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h1>
                <p className="text-muted-foreground text-sm">
                  Toutes vos mises à jour et alertes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => markAllAsRead.mutate()}
                  disabled={markAllAsRead.isPending}
                  className="gap-2"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Tout marquer comme lu</span>
                  <span className="sm:hidden">Tout lu</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Status filter */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {[
              { key: "all" as FilterType, label: "Toutes" },
              { key: "unread" as FilterType, label: "Non lues" },
              { key: "read" as FilterType, label: "Lues" },
            ].map((f) => (
              <Button
                key={f.key}
                variant={statusFilter === f.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter(f.key)}
                className="text-xs sm:text-sm"
              >
                {f.label}
              </Button>
            ))}
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-1">
            <Button
              variant={categoryFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("all")}
              className="text-xs sm:text-sm gap-1"
            >
              <Filter className="w-3 h-3" />
              Tous types
            </Button>
            {availableTypes.map((type) => {
              const typeInfo = NOTIFICATION_TYPE_MAP[type];
              if (!typeInfo) return null;
              const Icon = typeInfo.icon;
              return (
                <Button
                  key={type}
                  variant={categoryFilter === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(type)}
                  className="text-xs sm:text-sm gap-1"
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden md:inline">{typeInfo.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {statusFilter === "unread" ? "Notifications non lues" : statusFilter === "read" ? "Notifications lues" : "Toutes les notifications"}
                </CardTitle>
                <CardDescription>
                  {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex gap-4 p-4 border rounded-lg">
                    <div className="w-10 h-10 bg-muted rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <BellOff className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-medium">
                  {statusFilter === "unread"
                    ? "Aucune notification non lue"
                    : "Aucune notification"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Vous serez notifié des mises à jour importantes ici
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification: any) => {
                  const typeInfo = NOTIFICATION_TYPE_MAP[notification.type] || {
                    label: notification.type,
                    icon: Bell,
                    color: "text-muted-foreground",
                  };
                  const Icon = typeInfo.icon;

                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 sm:p-4 border rounded-lg transition-colors hover:bg-accent/50 ${
                        !notification.isRead
                          ? "bg-primary/5 border-primary/20"
                          : "bg-card"
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          !notification.isRead
                            ? "bg-primary/10"
                            : "bg-muted"
                        }`}
                      >
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${typeInfo.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className={`text-sm font-medium truncate ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-xs text-muted-foreground">
                                {formatDate(notification.createdAt)}
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                !notification.isRead
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {typeInfo.label}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {notification.linkUrl && (
                              <Link href={notification.linkUrl}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </Link>
                            )}
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => markAsRead.mutate({ id: notification.id })}
                                disabled={markAsRead.isPending}
                                title="Marquer comme lu"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Link to notification preferences */}
        <div className="text-center">
          <Link href="/notification-preferences">
            <Button variant="link" className="text-muted-foreground gap-2">
              <Bell className="w-4 h-4" />
              Configurer mes préférences de notification
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
