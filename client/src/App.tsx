import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminResources from "./pages/admin/AdminResources";
import AdminUsers from "./pages/admin/AdminUsers";
import InvitePartner from "./pages/InvitePartner";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminStockForecast from "./pages/admin/AdminStockForecast";
import AdminTerritories from "./pages/admin/AdminTerritories";
import AdminPartners from "@/pages/admin/AdminPartners";
import AdminPartnerDetail from "@/pages/admin/AdminPartnerDetail";
import AdminReports from "@/pages/admin/AdminReports";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminLeads from "@/pages/admin/AdminLeads";
import AdminAfterSales from "@/pages/admin/AdminAfterSales";
import AdminPartnerMap from "@/pages/admin/AdminPartnerMap";
import AdminSpareParts from "@/pages/admin/AdminSpareParts";
import AdminNewsletter from "@/pages/admin/AdminNewsletter";
import AdminCalendar from "@/pages/admin/AdminCalendar";

import AdminTechnicalResources from "@/pages/admin/TechnicalResources";
import AdminSupplierIntegration from "@/pages/admin/AdminSupplierIntegration";
import AdminShippingZones from "@/pages/admin/AdminShippingZones";
import AdminWebhookLogs from "@/pages/admin/AdminWebhookLogs";
import AdminSupplierLogs from "@/pages/admin/AdminSupplierLogs";

import Dashboard from "./pages/Dashboard";
import Catalog from "./pages/Catalog";
import Orders from "./pages/Orders";
import Resources from "./pages/Resources";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Profile from "./pages/Profile";
import ProductDetail from "./pages/ProductDetail";
import PartnerOnboarding from "./pages/PartnerOnboarding";
import PartnerPending from "./pages/PartnerPending";
import OrderTracking from "./pages/OrderTracking";
import OrderSummary from "./pages/OrderSummary";
import Favorites from "./pages/Favorites";
import Calendar from "./pages/Calendar";
import Leads from "./pages/Leads";
import AfterSales from "./pages/AfterSales";
import SpareParts from "./pages/SpareParts";
import TechnicalResources from "./pages/TechnicalResources";
import ForumNewTopic from "./pages/ForumNewTopic";
import ForumTopicDetail from "./pages/ForumTopicDetail";
import AcceptInvitation from "./pages/AcceptInvitation";
import NotificationPreferences from "./pages/NotificationPreferences";
import Notifications from "./pages/Notifications";
import TeamManagement from "./pages/TeamManagement";
import CompanyProfile from "./pages/CompanyProfile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import { useWebSocket } from "./hooks/useWebSocket";
import React from "react";

/**
 * CRITICAL FIX: Create wrapped components at MODULE level (outside any component).
 * Previously, withDashboard() was called INLINE inside <Route>, which created a
 * NEW wrapper function on every render of Router, causing React to unmount/remount
 * the entire DashboardLayout tree on every re-render — the root cause of the
 * flickering, multi-click, and rapid refresh bugs.
 */
function withDashboard(Component: React.ComponentType<any>) {
  const Wrapped = React.memo(function DashboardWrapped(props: any) {
    return (
      <DashboardLayout>
        <Component {...props} />
      </DashboardLayout>
    );
  });
  Wrapped.displayName = `withDashboard(${Component.displayName || Component.name || "Component"})`;
  return Wrapped;
}

// Pre-create all dashboard-wrapped components at module level (stable references)
const DashboardPage = withDashboard(Dashboard);
const CatalogPage = withDashboard(Catalog);
const OrdersPage = withDashboard(Orders);
const ResourcesPage = withDashboard(Resources);
const CartPage = withDashboard(Cart);
const CheckoutPage = withDashboard(Checkout);
const OrderConfirmationPage = withDashboard(OrderConfirmation);
const ProfilePage = withDashboard(Profile);
const ProductDetailPage = withDashboard(ProductDetail);
const OrderTrackingPage = withDashboard(OrderTracking);
const OrderSummaryPage = withDashboard(OrderSummary);
const FavoritesPage = withDashboard(Favorites);
const CalendarPage = withDashboard(Calendar);
const LeadsPage = withDashboard(Leads);
const AfterSalesPage = withDashboard(AfterSales);
const SparePartsPage = withDashboard(SpareParts);
const TechnicalResourcesPage = withDashboard(TechnicalResources);
const ForumNewTopicPage = withDashboard(ForumNewTopic);
const ForumTopicDetailPage = withDashboard(ForumTopicDetail);
const NotificationsPage = withDashboard(Notifications);
const NotificationPreferencesPage = withDashboard(NotificationPreferences);
const TeamManagementPage = withDashboard(TeamManagement);
const CompanyProfilePage = withDashboard(CompanyProfile);

function Router() {
  // Initialize WebSocket connection for real-time notifications
  useWebSocket();
  return (
    <Switch>
      {/* Authentication routes (no sidebar) */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/accept-invitation" component={AcceptInvitation} />
      
      {/* Landing / onboarding (no sidebar) */}
      <Route path="/" component={Home} />
      <Route path="/partner-onboarding" component={PartnerOnboarding} />
      <Route path="/partner-pending" component={PartnerPending} />

      {/* Partner pages (with sidebar) — using pre-created stable components */}
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/catalog" component={CatalogPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/resources" component={ResourcesPage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/order-confirmation/:orderId" component={OrderConfirmationPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/product/:id" component={ProductDetailPage} />
      <Route path="/order/:orderId" component={OrderTrackingPage} />
      <Route path="/order/:orderId/summary" component={OrderSummaryPage} />
      <Route path="/favorites" component={FavoritesPage} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/leads" component={LeadsPage} />
      <Route path="/after-sales" component={AfterSalesPage} />
      <Route path="/after-sales/:id" component={AfterSalesPage} />
      <Route path="/spare-parts" component={SparePartsPage} />
      <Route path="/technical-resources" component={TechnicalResourcesPage} />
      <Route path="/technical-resources/forum/new" component={ForumNewTopicPage} />
      <Route path="/technical-resources/forum/:id" component={ForumTopicDetailPage} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/notification-preferences" component={NotificationPreferencesPage} />
      <Route path="/team" component={TeamManagementPage} />
      <Route path="/company-profile" component={CompanyProfilePage} />

      {/* Admin routes (admin has its own layout) */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/resources" component={AdminResources} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/invite-partner" component={InvitePartner} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/forecast" component={AdminStockForecast} />
      <Route path="/admin/territories" component={AdminTerritories} />
      <Route path="/admin/partners/:id" component={AdminPartnerDetail} />
      <Route path="/admin/partners" component={AdminPartners} />
      <Route path="/admin/reports" component={AdminReports} />
      <Route path="/admin/orders/:id" component={AdminOrders} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/leads" component={AdminLeads} />
      <Route path="/admin/after-sales" component={AdminAfterSales} />
      <Route path="/admin/sav">{() => <Redirect to="/admin/after-sales" />}</Route>
      <Route path="/admin/partner-map" component={AdminPartnerMap} />
      <Route path="/admin/spare-parts" component={AdminSpareParts} />
      <Route path="/admin/newsletter" component={AdminNewsletter} />
      <Route path="/admin/calendar" component={AdminCalendar} />
      <Route path="/admin/supplier-integration" component={AdminSupplierIntegration} />
      <Route path="/admin/shipping-zones" component={AdminShippingZones} />
      <Route path="/admin/webhook-logs" component={AdminWebhookLogs} />
      <Route path="/admin/supplier-logs" component={AdminSupplierLogs} />

      <Route path="/admin/technical-resources" component={AdminTechnicalResources} />

      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-right" toastOptions={{ className: "!rounded-xl !shadow-lg !border" }} />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
