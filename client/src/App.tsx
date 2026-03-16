import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
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
import TeamManagement from "./pages/TeamManagement";
import CompanyProfile from "./pages/CompanyProfile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import { useWebSocket } from "./hooks/useWebSocket";

function Router() {
  // Initialize WebSocket connection for real-time notifications
  useWebSocket();
  return (
    <Switch>
      {/* Authentication routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/catalog" component={Catalog} />
      <Route path="/orders" component={Orders} />
      <Route path="/resources" component={Resources} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-confirmation/:orderId" component={OrderConfirmation} />
      <Route path="/profile" component={Profile} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/partner-onboarding" component={PartnerOnboarding} />
      <Route path="/partner-pending" component={PartnerPending} />
      <Route path="/order/:orderId" component={OrderTracking} />
      <Route path="/order/:orderId/summary" component={OrderSummary} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/leads" component={Leads} />
      <Route path="/after-sales" component={AfterSales} />
      <Route path="/after-sales/:id" component={AfterSales} />
      <Route path="/spare-parts" component={SpareParts} />
      <Route path="/technical-resources" component={TechnicalResources} />
      <Route path="/technical-resources/forum/new" component={ForumNewTopic} />
      <Route path="/technical-resources/forum/:id" component={ForumTopicDetail} />
      <Route path="/accept-invitation" component={AcceptInvitation} />
      <Route path="/notification-preferences" component={NotificationPreferences} />
      <Route path="/team" component={TeamManagement} />
      <Route path="/company-profile" component={CompanyProfile} />
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
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/leads" component={AdminLeads} />
      <Route path="/admin/after-sales" component={AdminAfterSales} />
      <Route path="/admin/partner-map" component={AdminPartnerMap} />
      <Route path="/admin/spare-parts" component={AdminSpareParts} />
      <Route path="/admin/newsletter" component={AdminNewsletter} />
      <Route path="/admin/calendar" component={AdminCalendar} />
      <Route path="/admin/supplier-integration" component={AdminSupplierIntegration} />

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
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
