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
import AdminProducts from "./pages/admin/AdminProducts";
import AdminPartners from "@/pages/admin/AdminPartners";
import AdminReports from "@/pages/admin/AdminReports";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminLeads from "@/pages/admin/AdminLeads";
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
import Favorites from "./pages/Favorites";
import Calendar from "./pages/Calendar";
import Leads from "./pages/Leads";

function Router() {
  return (
    <Switch>
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
      <Route path="/favorites" component={Favorites} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/leads" component={Leads} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/resources" component={AdminResources} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/partners" component={AdminPartners} />
      <Route path="/admin/reports" component={AdminReports} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/leads" component={AdminLeads} />
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
