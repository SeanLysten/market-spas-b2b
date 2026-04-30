import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import { useWebSocket } from "./hooks/useWebSocket";
import React, { Suspense } from "react";

// ─── Critical path pages (loaded eagerly for instant navigation) ─────────────
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// ─── Loading fallback ────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    </div>
  );
}

// ─── Lazy-loaded pages (code-split into separate chunks) ─────────────────────
// Auth pages
const Register = React.lazy(() => import("./pages/Register"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));
const Privacy = React.lazy(() => import("./pages/Privacy"));
const Terms = React.lazy(() => import("./pages/Terms"));
const AcceptInvitation = React.lazy(() => import("./pages/AcceptInvitation"));

// Onboarding
const PartnerOnboarding = React.lazy(() => import("./pages/PartnerOnboarding"));
const PartnerPending = React.lazy(() => import("./pages/PartnerPending"));

// Partner pages
const Catalog = React.lazy(() => import("./pages/Catalog"));
const Orders = React.lazy(() => import("./pages/Orders"));
const Resources = React.lazy(() => import("./pages/Resources"));
const Cart = React.lazy(() => import("./pages/Cart"));
const Checkout = React.lazy(() => import("./pages/Checkout"));
const OrderConfirmation = React.lazy(() => import("./pages/OrderConfirmation"));
const Profile = React.lazy(() => import("./pages/Profile"));
const ProductDetail = React.lazy(() => import("./pages/ProductDetail"));
const OrderTracking = React.lazy(() => import("./pages/OrderTracking"));
const OrderSummary = React.lazy(() => import("./pages/OrderSummary"));
const Favorites = React.lazy(() => import("./pages/Favorites"));
const Calendar = React.lazy(() => import("./pages/Calendar"));
const Leads = React.lazy(() => import("./pages/Leads"));
const AfterSales = React.lazy(() => import("./pages/AfterSales"));
const SpareParts = React.lazy(() => import("./pages/SpareParts"));
const TechnicalResources = React.lazy(() => import("./pages/TechnicalResources"));
const ForumNewTopic = React.lazy(() => import("./pages/ForumNewTopic"));
const ForumTopicDetail = React.lazy(() => import("./pages/ForumTopicDetail"));
const Notifications = React.lazy(() => import("./pages/Notifications"));
const NotificationPreferences = React.lazy(() => import("./pages/NotificationPreferences"));
const TeamManagement = React.lazy(() => import("./pages/TeamManagement"));
const CompanyProfile = React.lazy(() => import("./pages/CompanyProfile"));
const InvitePartner = React.lazy(() => import("./pages/InvitePartner"));

// Admin pages
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const AdminResources = React.lazy(() => import("./pages/admin/AdminResources"));
const AdminUsers = React.lazy(() => import("./pages/admin/AdminUsers"));
const AdminProducts = React.lazy(() => import("./pages/admin/AdminProducts"));
const AdminStockForecast = React.lazy(() => import("./pages/admin/AdminStockForecast"));
const AdminTerritories = React.lazy(() => import("./pages/admin/AdminTerritories"));
const AdminPartners = React.lazy(() => import("./pages/admin/AdminPartners"));
const AdminPartnerDetail = React.lazy(() => import("./pages/admin/AdminPartnerDetail"));
const AdminReports = React.lazy(() => import("./pages/admin/AdminReports"));
const AdminOrders = React.lazy(() => import("./pages/admin/AdminOrders"));
const AdminSettings = React.lazy(() => import("./pages/admin/AdminSettings"));
const AdminLeads = React.lazy(() => import("./pages/admin/AdminLeads"));
const AdminAfterSales = React.lazy(() => import("./pages/admin/AdminAfterSales"));
const AdminPartnerMap = React.lazy(() => import("./pages/admin/AdminPartnerMap"));
const AdminSpareParts = React.lazy(() => import("./pages/admin/AdminSpareParts"));
const AdminNewsletter = React.lazy(() => import("./pages/admin/AdminNewsletter"));
const AdminCalendar = React.lazy(() => import("./pages/admin/AdminCalendar"));
const AdminTechnicalResources = React.lazy(() => import("./pages/admin/TechnicalResources"));
const AdminSupplierIntegration = React.lazy(() => import("./pages/admin/AdminSupplierIntegration"));
const AdminShippingZones = React.lazy(() => import("./pages/admin/AdminShippingZones"));
const AdminWebhookLogs = React.lazy(() => import("./pages/admin/AdminWebhookLogs"));
const AdminSupplierLogs = React.lazy(() => import("./pages/admin/AdminSupplierLogs"));

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
        <Suspense fallback={<PageLoader />}>
          <Component {...props} />
        </Suspense>
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
      <Route path="/register">{(props: any) => <Suspense fallback={<PageLoader />}><Register {...props} /></Suspense>}</Route>
      <Route path="/forgot-password">{(props: any) => <Suspense fallback={<PageLoader />}><ForgotPassword {...props} /></Suspense>}</Route>
      <Route path="/reset-password">{(props: any) => <Suspense fallback={<PageLoader />}><ResetPassword {...props} /></Suspense>}</Route>
      <Route path="/privacy">{(props: any) => <Suspense fallback={<PageLoader />}><Privacy {...props} /></Suspense>}</Route>
      <Route path="/terms">{(props: any) => <Suspense fallback={<PageLoader />}><Terms {...props} /></Suspense>}</Route>
      <Route path="/accept-invitation">{(props: any) => <Suspense fallback={<PageLoader />}><AcceptInvitation {...props} /></Suspense>}</Route>
      
      {/* Landing / onboarding (no sidebar) */}
      <Route path="/" component={Home} />
      <Route path="/partner-onboarding">{(props: any) => <Suspense fallback={<PageLoader />}><PartnerOnboarding {...props} /></Suspense>}</Route>
      <Route path="/partner-pending">{(props: any) => <Suspense fallback={<PageLoader />}><PartnerPending {...props} /></Suspense>}</Route>

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
      <Route path="/admin">{(props: any) => <Suspense fallback={<PageLoader />}><AdminDashboard {...props} /></Suspense>}</Route>
      <Route path="/admin/resources">{(props: any) => <Suspense fallback={<PageLoader />}><AdminResources {...props} /></Suspense>}</Route>
      <Route path="/admin/users">{(props: any) => <Suspense fallback={<PageLoader />}><AdminUsers {...props} /></Suspense>}</Route>
      <Route path="/admin/invite-partner">{(props: any) => <Suspense fallback={<PageLoader />}><InvitePartner {...props} /></Suspense>}</Route>
      <Route path="/admin/products">{(props: any) => <Suspense fallback={<PageLoader />}><AdminProducts {...props} /></Suspense>}</Route>
      <Route path="/admin/forecast">{(props: any) => <Suspense fallback={<PageLoader />}><AdminStockForecast {...props} /></Suspense>}</Route>
      <Route path="/admin/territories">{(props: any) => <Suspense fallback={<PageLoader />}><AdminTerritories {...props} /></Suspense>}</Route>
      <Route path="/admin/partners/:id">{(props: any) => <Suspense fallback={<PageLoader />}><AdminPartnerDetail {...props} /></Suspense>}</Route>
      <Route path="/admin/partners">{(props: any) => <Suspense fallback={<PageLoader />}><AdminPartners {...props} /></Suspense>}</Route>
      <Route path="/admin/reports">{(props: any) => <Suspense fallback={<PageLoader />}><AdminReports {...props} /></Suspense>}</Route>
      <Route path="/admin/orders/:id">{(props: any) => <Suspense fallback={<PageLoader />}><AdminOrders {...props} /></Suspense>}</Route>
      <Route path="/admin/orders">{(props: any) => <Suspense fallback={<PageLoader />}><AdminOrders {...props} /></Suspense>}</Route>
      <Route path="/admin/settings">{(props: any) => <Suspense fallback={<PageLoader />}><AdminSettings {...props} /></Suspense>}</Route>
      <Route path="/admin/leads">{(props: any) => <Suspense fallback={<PageLoader />}><AdminLeads {...props} /></Suspense>}</Route>
      <Route path="/admin/after-sales">{(props: any) => <Suspense fallback={<PageLoader />}><AdminAfterSales {...props} /></Suspense>}</Route>
      <Route path="/admin/sav">{() => <Redirect to="/admin/after-sales" />}</Route>
      <Route path="/admin/partner-map">{(props: any) => <Suspense fallback={<PageLoader />}><AdminPartnerMap {...props} /></Suspense>}</Route>
      <Route path="/admin/spare-parts">{(props: any) => <Suspense fallback={<PageLoader />}><AdminSpareParts {...props} /></Suspense>}</Route>
      <Route path="/admin/newsletter">{(props: any) => <Suspense fallback={<PageLoader />}><AdminNewsletter {...props} /></Suspense>}</Route>
      <Route path="/admin/calendar">{(props: any) => <Suspense fallback={<PageLoader />}><AdminCalendar {...props} /></Suspense>}</Route>
      <Route path="/admin/supplier-integration">{(props: any) => <Suspense fallback={<PageLoader />}><AdminSupplierIntegration {...props} /></Suspense>}</Route>
      <Route path="/admin/shipping-zones">{(props: any) => <Suspense fallback={<PageLoader />}><AdminShippingZones {...props} /></Suspense>}</Route>
      <Route path="/admin/webhook-logs">{(props: any) => <Suspense fallback={<PageLoader />}><AdminWebhookLogs {...props} /></Suspense>}</Route>
      <Route path="/admin/supplier-logs">{(props: any) => <Suspense fallback={<PageLoader />}><AdminSupplierLogs {...props} /></Suspense>}</Route>
      <Route path="/admin/technical-resources">{(props: any) => <Suspense fallback={<PageLoader />}><AdminTechnicalResources {...props} /></Suspense>}</Route>

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
