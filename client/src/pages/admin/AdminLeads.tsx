import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Search,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Filter,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  GitCompareArrows,
  User,
  FileText,
  Handshake,
  ShoppingBag,
  Map
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";

// Types
interface Lead {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  status: string;
  source: string;
  partnerId: number | null;
  partnerName?: string;
  productInterest: string | null;
  budget: string | null;
  timeline: string | null;
  message: string | null;
  notes: string | null;
  customFields: string | null;
  metaPageId: string | null;
  metaFormId: string | null;
  contactAttempts: number;
  receivedAt: string;
  firstContactAt: string | null;
  assignedAt: string | null;
  estimatedValue: string | null;
  assignmentReason: string | null;
}

// Helper: détecte si un lead est un candidat partenaire
function isPartnerCandidate(lead: Lead): boolean {
  if (lead.assignmentReason === "partner_candidate") return true;
  if (!lead.customFields) return false;
  try {
    const cf = JSON.parse(lead.customFields);
    return !!cf.company_name || !!cf["possédez-vous_un_showroom_?_"] || !!cf["travaillez-vous_déjà_dans_la_vente_de_spa_?_"];
  } catch { return false; }
}

interface CampaignStats {
  id: string;
  name: string;
  status: string;
  objective: string;
  objectiveLabel: string;
  isPriority: boolean;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpl: number;
  ctr: number;
  cpc: number;
  cpm: number;
  reach: number;
  frequency: number;
  linkClicks: number;
}

const LEAD_STATUSES = {
  NEW: { label: "Nouveau", color: "bg-info/15 dark:bg-info-light text-info dark:text-info-dark" },
  ASSIGNED: { label: "Assigné", color: "bg-indigo-500/15 dark:bg-indigo-500/25 text-indigo-800" },
  CONTACTED: { label: "Contacté", color: "bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-400" },
  NO_RESPONSE: { label: "Sans réponse", color: "bg-orange-500/15 dark:bg-orange-500/25 text-orange-800 dark:text-orange-400" },
  QUALIFIED: { label: "Qualifié", color: "bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400" },
  NOT_QUALIFIED: { label: "Non qualifié", color: "bg-muted dark:bg-muted/50 text-gray-800" },
  MEETING_SCHEDULED: { label: "RDV planifié", color: "bg-purple-500/15 dark:bg-purple-500/25 text-purple-800 dark:text-purple-400" },
  QUOTE_SENT: { label: "Devis envoyé", color: "bg-cyan-500/15 dark:bg-cyan-500/25 text-cyan-800" },
  NEGOTIATION: { label: "Négociation", color: "bg-amber-500/15 dark:bg-amber-500/25 text-amber-800" },
  CONVERTED: { label: "Converti", color: "bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800" },
  LOST: { label: "Perdu", color: "bg-destructive/15 dark:bg-destructive/25 text-destructive dark:text-destructive" },
};

export default function AdminLeads() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [partnerFilter, setPartnerFilter] = useState<string>("all");
  const [leadTypeFilter, setLeadTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [metaConnecting, setMetaConnecting] = useState(false);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [metaCallbackData, setMetaCallbackData] = useState<any>(null);
  
  // Detect OAuth code in URL to auto-switch to campaigns tab
  const urlParams = new URLSearchParams(window.location.search);
  const hasOAuthCode = urlParams.has('code');
  const [activeTab, setActiveTab] = useState(hasOAuthCode ? 'campaigns' : 'leads');
  const [adsTab, setAdsTab] = useState<'meta' | 'google'>('meta'); // Sous-onglet pour Meta/Google Ads
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<string>("all");
  const [campaignPriorityFilter, setCampaignPriorityFilter] = useState<string>("all");
  const [customDateFrom, setCustomDateFrom] = useState<string>("");
  const [customDateTo, setCustomDateTo] = useState<string>("");
  const [isCustomDate, setIsCustomDate] = useState(false);

  // Comparison tab state
  const [comparisonMode, setComparisonMode] = useState<"previous" | "year" | "custom">("previous");
  const [compCustomFrom, setCompCustomFrom] = useState("");
  const [compCustomTo, setCompCustomTo] = useState("");

  // Récupérer les vrais leads depuis la base de données avec polling automatique toutes les 30s
  const { data: leadsData, isLoading: leadsLoading, refetch } = trpc.admin.leads.list.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    partnerId: partnerFilter !== "all" ? parseInt(partnerFilter) : undefined,
  }, {
    refetchInterval: 30000, // Polling toutes les 30 secondes
    refetchIntervalInBackground: false, // Pas de polling quand l'onglet est en arrière-plan
  });

  // État pour l'animation du bouton refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  // WebSocket : écouter les nouveaux leads en temps réel
  const socketRef = useRef<Socket | null>(null);
  useEffect(() => {
    if (!user) return;
    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") return;

    const socket = io(window.location.origin, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join:admin");
    });

    // Quand un nouveau lead arrive, rafraîchir automatiquement
    socket.on("leads:refresh", () => {
      console.log("[Leads] Nouveau lead détecté via WebSocket, rafraîchissement...");
      refetch();
      setLastRefreshTime(new Date());
    });

    // Toast de notification pour nouveau lead
    socket.on("lead:new", (data: { leadId: number; customerName: string; city: string }) => {
      toast.success("Nouveau lead reçu !", {
        description: data.customerName + (data.city ? ` de ${data.city}` : ""),
        duration: 5000,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, refetch]);

  // Mutation pour réassigner tous les leads
  const reassignMutation = trpc.admin.leads.reassignAll.useMutation({
    onSuccess: (result) => {
      alert(`Réassignation terminée!\n\n✅ ${result.assigned} leads assignés\n❌ ${result.notFound} leads non assignés\n📊 Total: ${result.total} leads`);
      refetch();
    },
    onError: (error) => {
      alert(`Erreur lors de la réassignation: ${error.message}`);
    },
  });

  const leads: Lead[] = (leadsData || []).map((lead: any) => ({
    id: lead.leads?.id || lead.id,
    firstName: lead.leads?.firstName || lead.firstName,
    lastName: lead.leads?.lastName || lead.lastName,
    email: lead.leads?.email || lead.email,
    phone: lead.leads?.phone || lead.phone,
    address: lead.leads?.address || lead.address || null,
    city: lead.leads?.city || lead.city,
    postalCode: lead.leads?.postalCode || lead.postalCode,
    country: lead.leads?.country || lead.country || null,
    status: lead.leads?.status || lead.status,
    source: lead.leads?.source || lead.source,
    partnerId: lead.leads?.assignedPartnerId || lead.assignedPartnerId,
    partnerName: lead.partners?.companyName || null,
    productInterest: lead.leads?.productInterest || lead.productInterest,
    budget: lead.leads?.budget || lead.budget,
    timeline: lead.leads?.timeline || lead.timeline || null,
    message: lead.leads?.message || lead.message || null,
    notes: lead.leads?.notes || lead.notes || null,
    customFields: lead.leads?.customFields || lead.customFields || null,
    metaPageId: lead.leads?.metaPageId || lead.metaPageId || null,
    metaFormId: lead.leads?.metaFormId || lead.metaFormId || null,
    contactAttempts: lead.leads?.contactAttempts || lead.contactAttempts || 0,
    receivedAt: lead.leads?.receivedAt || lead.receivedAt,
    firstContactAt: lead.leads?.firstContactAt || lead.firstContactAt,
    assignedAt: lead.leads?.assignedAt || lead.assignedAt || null,
    estimatedValue: lead.leads?.estimatedValue || lead.estimatedValue || null,
    assignmentReason: lead.leads?.assignmentReason || lead.assignmentReason || null,
  }));

  // Meta Ads integration
  const metaQueryInput = isCustomDate && customDateFrom && customDateTo
    ? { since: customDateFrom, until: customDateTo }
    : { datePreset: dateRange === "7" ? "last_7d" : dateRange === "30" ? "last_30d" : dateRange === "365" ? "last_year" : "last_90d" };
  const { data: metaCampaignsData, isLoading: metaLoading, refetch: refetchMeta } = trpc.metaAds.getCampaigns.useQuery(
    metaQueryInput,
    { retry: false }
  );

  // Fonction de rafraîchissement complète (leads + campagnes Meta)
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetch(), refetchMeta()]);
      setLastRefreshTime(new Date());
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [refetch, refetchMeta]);
  const { data: dailyInsightsData } = trpc.metaAds.getDailyInsights.useQuery(
    metaQueryInput,
    { retry: false, enabled: !!metaCampaignsData?.connected }
  );
  // Comparison periods calculation
  const getComparisonPeriods = () => {
    const now = new Date();
    let currentSince: string, currentUntil: string, prevSince: string, prevUntil: string;
    
    if (isCustomDate && customDateFrom && customDateTo) {
      currentSince = customDateFrom;
      currentUntil = customDateTo;
    } else {
      const days = dateRange === "7" ? 7 : dateRange === "30" ? 30 : dateRange === "365" ? 365 : 90;
      currentUntil = now.toISOString().split('T')[0];
      const sinceDate = new Date(now);
      sinceDate.setDate(sinceDate.getDate() - days);
      currentSince = sinceDate.toISOString().split('T')[0];
    }

    if (comparisonMode === "previous") {
      const daysDiff = Math.ceil((new Date(currentUntil).getTime() - new Date(currentSince).getTime()) / (1000 * 60 * 60 * 24));
      const prevEnd = new Date(currentSince);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - daysDiff);
      prevSince = prevStart.toISOString().split('T')[0];
      prevUntil = prevEnd.toISOString().split('T')[0];
    } else if (comparisonMode === "year") {
      const prevStartDate = new Date(currentSince);
      prevStartDate.setFullYear(prevStartDate.getFullYear() - 1);
      const prevEndDate = new Date(currentUntil);
      prevEndDate.setFullYear(prevEndDate.getFullYear() - 1);
      prevSince = prevStartDate.toISOString().split('T')[0];
      prevUntil = prevEndDate.toISOString().split('T')[0];
    } else {
      prevSince = compCustomFrom || currentSince;
      prevUntil = compCustomTo || currentUntil;
    }

    return {
      currentPeriod: { since: currentSince, until: currentUntil },
      previousPeriod: { since: prevSince!, until: prevUntil! },
    };
  };

  const comparisonPeriods = getComparisonPeriods();
  const { data: comparisonData, isLoading: comparisonLoading } = trpc.metaAds.getComparisonInsights.useQuery(
    comparisonPeriods,
    { retry: false, enabled: !!metaCampaignsData?.connected && activeTab === 'comparison' }
  );

  const { data: metaOAuthUrl } = trpc.metaAds.getOAuthUrl.useQuery(undefined, { retry: false });
  const metaCallbackMutation = trpc.metaAds.handleCallback.useMutation();
  const connectAccountMutation = trpc.metaAds.connectAdAccount.useMutation({
    onSuccess: () => {
      console.log("[Meta] Account connected successfully, refetching campaigns...");
      setShowAccountSelector(false);
      setMetaCallbackData(null);
      // Force a small delay before refetching to ensure DB write is committed
      setTimeout(() => {
        refetchMeta().then((result) => {
          console.log("[Meta] Campaigns refetch result:", result.data);
          if (result.data?.connected) {
            alert("Compte publicitaire connecté avec succès ! Les campagnes sont en cours de chargement.");
          }
        });
      }, 500);
    },
    onError: (error) => {
      console.error("[Meta] Error connecting account:", error);
      alert(`Erreur lors de la connexion du compte: ${error.message}`);
    },
  });
  const disconnectMutation = trpc.metaAds.disconnectAdAccount.useMutation({
    onSuccess: () => refetchMeta(),
  });

  // Google Ads queries and mutations
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const [showGoogleAccountSelector, setShowGoogleAccountSelector] = useState(false);
  const [googleCallbackData, setGoogleCallbackData] = useState<any>(null);
  
  const [googleDatePreset, setGoogleDatePreset] = useState('last_30d');
  const { data: googleOAuthUrl } = trpc.googleAds.getOAuthUrl.useQuery(undefined, { retry: false });
  const { data: googleConnectedAccounts, refetch: refetchGoogleAccounts } = trpc.googleAds.getConnectedAccounts.useQuery();
  const googleCallbackMutation = trpc.googleAds.handleCallback.useMutation();
  const { data: googleCampaignsData, isLoading: googleCampaignsLoading, refetch: refetchGoogleCampaigns } = trpc.googleAds.getCampaigns.useQuery(
    { datePreset: googleDatePreset },
    { enabled: !!googleConnectedAccounts && googleConnectedAccounts.length > 0, retry: false }
  );
  const fetchCustomerIdMutation = trpc.googleAds.fetchCustomerId.useMutation({
    onSuccess: () => {
      console.log('[Google Ads] Customer ID fetched successfully');
      toast.success('Customer ID récupéré avec succès !');
      refetchGoogleAccounts();
      refetchGoogleCampaigns();
    },
    onError: (error) => {
      console.error('[Google Ads] Error fetching customer ID:', error);
      toast.error(`Erreur: ${error.message}`);
    },
  });
  const connectGoogleAccountMutation = trpc.googleAds.connectAdAccount.useMutation({
    onSuccess: () => {
      console.log("[Google Ads] Account connected successfully");
      setShowGoogleAccountSelector(false);
      setGoogleCallbackData(null);
      toast.success("Compte Google Ads connecté avec succès !");
      // TODO: refetch Google campaigns when implemented
    },
    onError: (error) => {
      console.error("[Google Ads] Connection error:", error);
      alert(`Erreur lors de la connexion du compte Google Ads: ${error.message}`);
    },
  });
  const disconnectGoogleMutation = trpc.googleAds.disconnectAdAccount.useMutation({
    onSuccess: () => {
      toast.success("Compte Google Ads déconnecté");
      refetchGoogleAccounts();
    },
  });

  // Handle Meta & Google Ads OAuth callbacks
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const isGoogleAds = urlParams.get("google_ads") === "true";
    const metaError = urlParams.get("meta_error");
    const googleError = urlParams.get("google_error");
    
    // Handle OAuth errors
    if (metaError) {
      console.error("Meta OAuth error:", metaError);
      alert(`Erreur de connexion Meta: ${decodeURIComponent(metaError)}`);
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }
    
    if (googleError) {
      console.error("Google Ads OAuth error:", googleError);
      alert(`Erreur de connexion Google Ads: ${decodeURIComponent(googleError)}`);
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }
    
    // Handle Google Ads callback
    if (code && isGoogleAds && !googleCallbackData) {
      console.log("[Google Ads OAuth] Code found, exchanging...");
      setGoogleConnecting(true);
      // Clean URL immediately to prevent re-processing on re-render
      window.history.replaceState({}, "", window.location.pathname);
      (async () => {
        try {
          const data = await googleCallbackMutation.mutateAsync({ code });
          console.log("[Google Ads OAuth] Token exchange successful:", JSON.stringify(data));
          setGoogleCallbackData(data);
          toast.success(`Compte Google Ads connecté : ${data.googleUserEmail}`);
          // Refresh connected accounts list and wait for it
          const refetchResult = await refetchGoogleAccounts();
          console.log("[Google Ads OAuth] Refetch result:", JSON.stringify(refetchResult.data));
          // Switch to Google Ads tab to show the connection
          setAdsTab('google');
        } catch (err: any) {
          console.error("[Google Ads OAuth] Token exchange error:", err);
          toast.error(`Erreur lors de la connexion Google Ads: ${err.message}`);
        } finally {
          setGoogleConnecting(false);
        }
      })();
      return;
    }
    
    // Handle Meta callback
    if (code && !isGoogleAds && !metaCallbackData) {
      // Build redirectUri from current origin - must match what was sent to Facebook
      const redirectUri = `${window.location.origin}/admin/leads`;
      console.log("[Meta OAuth] Code found, exchanging with redirectUri:", redirectUri);
      setMetaConnecting(true);
      // Clean URL immediately to prevent re-processing on re-render
      window.history.replaceState({}, "", window.location.pathname);
      metaCallbackMutation.mutateAsync({
        code,
        redirectUri,
      }).then((data) => {
        console.log("[Meta OAuth] Token exchange successful, accounts:", data);
        setMetaCallbackData(data);
        setShowAccountSelector(true);
        setMetaConnecting(false);
      }).catch((err) => {
        console.error("[Meta OAuth] Token exchange error:", err);
        alert(`Erreur lors de la connexion Meta: ${err.message}`);
        setMetaConnecting(false);
      });
    }
  }, []);

  const campaigns: CampaignStats[] = (metaCampaignsData?.campaigns || []).map((c: any) => ({
    id: c.campaign_id,
    name: c.campaign_name,
    status: c.status,
    objective: c.objective || "",
    spend: parseFloat(c.spend) || 0,
    impressions: parseInt(c.impressions) || 0,
    clicks: parseInt(c.clicks) || 0,
    leads: parseInt(c.leads) || 0,
    cpl: parseFloat(c.cost_per_lead) || (parseInt(c.leads) > 0 ? parseFloat(c.spend) / parseInt(c.leads) : 0),
    ctr: parseFloat(c.ctr) || 0,
    cpc: parseFloat(c.cpc) || 0,
    cpm: parseFloat(c.cpm) || 0,
    reach: parseInt(c.reach) || 0,
    frequency: parseFloat(c.frequency) || 0,
    linkClicks: parseInt(c.link_clicks) || 0,
    objectiveLabel: c.objective_label || c.objective || "",
    isPriority: c.is_priority ?? true,
  }));

  // Filtrer les campagnes par statut et priorité
  const filteredCampaigns = campaigns.filter(c => {
    const statusMatch = campaignStatusFilter === "all" || c.status === campaignStatusFilter;
    const priorityMatch = campaignPriorityFilter === "all" 
      || (campaignPriorityFilter === "priority" && c.isPriority)
      || (campaignPriorityFilter === "secondary" && !c.isPriority);
    return statusMatch && priorityMatch;
  });

  // Compteurs par statut pour les badges
  const campaignCounts = {
    all: campaigns.length,
    ACTIVE: campaigns.filter(c => c.status === "ACTIVE").length,
    PAUSED: campaigns.filter(c => c.status === "PAUSED").length,
    ARCHIVED: campaigns.filter(c => c.status === "ARCHIVED").length,
  };

  // Statistiques globales (basées sur les campagnes filtrées)
  const totalMetaLeads = filteredCampaigns.reduce((sum, c) => sum + c.leads, 0);
  const totalMetaSpend = filteredCampaigns.reduce((sum, c) => sum + c.spend, 0);
  const totalMetaClicks = filteredCampaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalMetaImpressions = filteredCampaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalMetaReach = filteredCampaigns.reduce((sum, c) => sum + c.reach, 0);
  const stats = {
    totalLeads: leads.length,
    newLeads: leads.filter(l => l.status === "NEW" || l.status === "ASSIGNED").length,
    contactedLeads: leads.filter(l => l.firstContactAt !== null).length,
    convertedLeads: leads.filter(l => l.status === "CONVERTED").length,
    conversionRate: leads.length > 0 ? Math.round((leads.filter(l => l.status === "CONVERTED").length / leads.length) * 100) : 0,
    totalSpend: totalMetaSpend,
    avgCPL: totalMetaLeads > 0 ? totalMetaSpend / totalMetaLeads : 0,
    totalImpressions: totalMetaImpressions,
    totalClicks: totalMetaClicks,
    totalReach: totalMetaReach,
    totalMetaLeads,
    avgCTR: totalMetaImpressions > 0 ? (totalMetaClicks / totalMetaImpressions) * 100 : 0,
    avgCPC: totalMetaClicks > 0 ? totalMetaSpend / totalMetaClicks : 0,
  };

  // Stats par partenaire
  const partnerStats = leads.reduce((acc, lead) => {
    const key = lead.partnerName || "Non assigné";
    if (!acc[key]) {
      acc[key] = { total: 0, contacted: 0, converted: 0 };
    }
    acc[key].total++;
    if (lead.firstContactAt) acc[key].contacted++;
    if (lead.status === "CONVERTED") acc[key].converted++;
    return acc;
  }, {} as Record<string, { total: number; contacted: number; converted: number }>);

  // Séparer les leads par type
  const partnerCandidateLeads = leads.filter(l => isPartnerCandidate(l));
  const customerLeads = leads.filter(l => !isPartnerCandidate(l));

  // Filtrer les leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchQuery === "" || 
      `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.partnerName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesPartner = partnerFilter === "all" || lead.partnerName === partnerFilter;
    const matchesType = leadTypeFilter === "all" || 
      (leadTypeFilter === "customer" && !isPartnerCandidate(lead)) ||
      (leadTypeFilter === "partner" && isPartnerCandidate(lead));
    
    return matchesSearch && matchesStatus && matchesPartner && matchesType;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", { 
      day: "numeric", 
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const exportLeadsCSV = () => {
    const headers = ["ID", "Nom", "Email", "Téléphone", "Ville", "Statut", "Partenaire", "Produit", "Budget", "Date"];
    const rows = filteredLeads.map(l => [
      l.id,
      `${l.firstName} ${l.lastName}`,
      l.email || "",
      l.phone || "",
      `${l.postalCode} ${l.city}`,
      LEAD_STATUSES[l.status as keyof typeof LEAD_STATUSES]?.label || l.status,
      l.partnerName || "Non assigné",
      l.productInterest || "",
      l.budget || "",
      formatDate(l.receivedAt)
    ]);
    
    const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-display text-display font-bold text-gray-900">Gestion des Leads</h1>
            <p className="text-muted-foreground dark:text-muted-foreground">Statistiques des campagnes Meta et suivi des prospects</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Select value={isCustomDate ? "custom" : dateRange} onValueChange={(val) => {
                if (val === "custom") {
                  setIsCustomDate(true);
                  // Set default custom range to last 30 days
                  const today = new Date();
                  const thirtyDaysAgo = new Date(today);
                  thirtyDaysAgo.setDate(today.getDate() - 30);
                  if (!customDateFrom) setCustomDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
                  if (!customDateTo) setCustomDateTo(today.toISOString().split('T')[0]);
                } else {
                  setIsCustomDate(false);
                  setDateRange(val);
                }
              }}>
                <SelectTrigger className="w-[170px]">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 derniers jours</SelectItem>
                  <SelectItem value="30">30 derniers jours</SelectItem>
                  <SelectItem value="90">90 derniers jours</SelectItem>
                  <SelectItem value="365">Cette année</SelectItem>
                  <SelectItem value="custom">Période personnalisée</SelectItem>
                </SelectContent>
              </Select>
              {isCustomDate && (
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="h-9 px-2 text-sm border rounded-lg bg-white"
                  />
                  <span className="text-gray-400 text-sm">→</span>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="h-9 px-2 text-sm border rounded-lg bg-white"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchMeta()}
                    className="text-xs"
                  >
                    Appliquer
                  </Button>
                </div>
              )}
            </div>
            <Button 
              variant="outline" 
              onClick={() => reassignMutation.mutate()}
              disabled={reassignMutation.isPending}
            >
              {reassignMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Réassignation...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Réassigner auto
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={refreshAll}
              disabled={isRefreshing}
              title={`Dernière actualisation : ${lastRefreshTime.toLocaleTimeString('fr-FR')}`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* KPIs principaux */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">Leads clients</p>
                  <p className="text-2xl text-display text-display font-bold">{customerLeads.length}</p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                    {stats.newLeads} nouveau{stats.newLeads > 1 ? 'x' : ''}
                  </p>
                </div>
                <div className="p-3 bg-info/15 dark:bg-info-light rounded-full">
                  <ShoppingBag className="w-6 h-6 text-info dark:text-info-dark" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-500/20 dark:border-orange-500/30 bg-orange-500/10 dark:bg-orange-500/20/30">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-400">Candidats partenaires</p>
                  <p className="text-2xl text-display text-display font-bold text-orange-700 dark:text-orange-400">{partnerCandidateLeads.length}</p>
                  <p className="text-xs text-orange-500 mt-1">
                    Devenir Partenaire
                  </p>
                </div>
                <div className="p-3 bg-orange-500/15 dark:bg-orange-500/25 rounded-full">
                  <Handshake className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">Taux de conversion</p>
                  <p className="text-2xl text-display text-display font-bold">{stats.conversionRate}%</p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                    {stats.convertedLeads} converti{stats.convertedLeads > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="p-3 bg-emerald-500/15 dark:bg-emerald-500/25 rounded-full">
                  <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">Budget dépensé</p>
                  <p className="text-2xl text-display text-display font-bold">{stats.totalSpend.toFixed(2)} €</p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                    CPL moyen: {stats.avgCPL > 0 ? stats.avgCPL.toFixed(2) + ' €' : '-'}
                  </p>
                </div>
                <div className="p-3 bg-amber-500/15 dark:bg-amber-500/25 rounded-full">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">Impressions</p>
                  <p className="text-2xl text-display text-display font-bold">{stats.totalImpressions > 1000 ? (stats.totalImpressions / 1000).toFixed(1) + 'K' : stats.totalImpressions}</p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                    Portée: {stats.totalReach > 1000 ? (stats.totalReach / 1000).toFixed(1) + 'K' : stats.totalReach}
                  </p>
                </div>
                <div className="p-3 bg-purple-500/15 dark:bg-purple-500/25 rounded-full">
                  <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="leads">
              <Users className="w-4 h-4 mr-2" />
              Tous les leads
            </TabsTrigger>
            <TabsTrigger value="campaigns">
              <BarChart3 className="w-4 h-4 mr-2" />
              Campagnes Meta
            </TabsTrigger>
            <TabsTrigger value="partners">
              <Building2 className="w-4 h-4 mr-2" />
              Par partenaire
            </TabsTrigger>
            <TabsTrigger value="comparison">
              <TrendingUp className="w-4 h-4 mr-2" />
              Comparaison
            </TabsTrigger>
          </TabsList>

          {/* Onglet Leads */}
          <TabsContent value="leads" className="space-y-4">
            {/* Filtres */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher par nom, email, partenaire..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      {Object.entries(LEAD_STATUSES).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={leadTypeFilter} onValueChange={setLeadTypeFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <Handshake className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="customer">Clients finaux ({customerLeads.length})</SelectItem>
                      <SelectItem value="partner">Candidats partenaires ({partnerCandidateLeads.length})</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <Building2 className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Partenaire" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les partenaires</SelectItem>
                      {Object.keys(partnerStats).map(name => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={exportLeadsCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Liste des leads */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 dark:bg-muted/30 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium text-muted-foreground dark:text-muted-foreground">Lead</th>
                        <th className="text-left p-4 font-medium text-muted-foreground dark:text-muted-foreground">Type</th>
                        <th className="text-left p-4 font-medium text-muted-foreground dark:text-muted-foreground">Contact</th>
                        <th className="text-left p-4 font-medium text-muted-foreground dark:text-muted-foreground">Partenaire</th>
                        <th className="text-left p-4 font-medium text-muted-foreground dark:text-muted-foreground">Statut</th>
                        <th className="text-left p-4 font-medium text-muted-foreground dark:text-muted-foreground">Suivi</th>
                        <th className="text-left p-4 font-medium text-muted-foreground dark:text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredLeads.map(lead => {
                        const statusConfig = LEAD_STATUSES[lead.status as keyof typeof LEAD_STATUSES];
                        return (
                          <tr 
                            key={lead.id} 
                            className="hover:bg-muted/50 dark:bg-muted/30 cursor-pointer"
                            onClick={() => setSelectedLead(lead)}
                          >
                            <td className="p-4">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {lead.firstName} {lead.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground dark:text-muted-foreground">{lead.productInterest}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              {isPartnerCandidate(lead) ? (
                                <Badge className="bg-orange-500/15 dark:bg-orange-500/25 text-orange-800 dark:text-orange-400 text-xs">
                                  <Handshake className="w-3 h-3 mr-1" />
                                  Partenaire
                                </Badge>
                              ) : (
                                <Badge className="bg-info/15 dark:bg-info-light text-info dark:text-info-dark text-xs">
                                  <ShoppingBag className="w-3 h-3 mr-1" />
                                  Client
                                </Badge>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                {lead.email && (
                                  <p className="text-sm text-muted-foreground dark:text-muted-foreground flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {lead.email}
                                  </p>
                                )}
                                {lead.phone && (
                                  <p className="text-sm text-muted-foreground dark:text-muted-foreground flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {lead.phone}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="text-sm text-gray-900">{lead.partnerName || "Non assigné"}</p>
                              <p className="text-xs text-muted-foreground dark:text-muted-foreground">{lead.postalCode} {lead.city}</p>
                            </td>
                            <td className="p-4">
                              <Badge className={statusConfig?.color}>
                                {statusConfig?.label || lead.status}
                              </Badge>
                            </td>
                            <td className="p-4">
                              {lead.firstContactAt ? (
                                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-sm">Contacté</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                  <Clock className="w-4 h-4" />
                                  <span className="text-sm">En attente</span>
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-sm text-muted-foreground dark:text-muted-foreground">
                              {formatDate(lead.receivedAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Campagnes */}
          <TabsContent value="campaigns" className="space-y-4">
            {/* Sous-onglets Meta Ads / Google Ads */}
            <Tabs value={adsTab} onValueChange={(v) => setAdsTab(v as 'meta' | 'google')} className="space-y-4">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="meta">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Meta Ads
                </TabsTrigger>
                <TabsTrigger value="google">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google Ads
                </TabsTrigger>
              </TabsList>

              {/* Onglet Meta Ads */}
              <TabsContent value="meta" className="space-y-4">
            {/* Connexion Meta */}
            {!metaCampaignsData?.connected && (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-info/15 dark:bg-info-light rounded-full flex items-center justify-center mb-4">
                    <BarChart3 className="w-8 h-8 text-info dark:text-info-dark" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Connecter votre compte Meta Ads</h3>
                  <p className="text-muted-foreground dark:text-muted-foreground mb-6 max-w-md mx-auto">
                    Connectez votre compte publicitaire Meta pour voir vos campagnes, dépenses, impressions et leads en temps réel.
                  </p>
                  <Button
                    onClick={() => {
                      if (metaOAuthUrl?.url) {
                        window.location.href = metaOAuthUrl.url;
                      }
                    }}
                    disabled={metaConnecting || !metaOAuthUrl}
                    className="bg-[#1877F2] hover:bg-[#166FE5] text-white"
                  >
                    {metaConnecting ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Connexion en cours...</>
                    ) : (
                      <><svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> Connecter avec Facebook</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Sélecteur de compte après OAuth */}
            {showAccountSelector && metaCallbackData && (
              <Card className="border-info/20 dark:border-info/30 bg-info/10 dark:bg-info-light">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Sélectionnez un compte publicitaire</h3>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-4">Connecté en tant que <strong>{metaCallbackData.metaUserName}</strong></p>
                  <div className="grid gap-3">
                    {metaCallbackData.adAccounts?.map((acc: any) => (
                      <div key={acc.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div>
                          <p className="font-medium">{acc.name}</p>
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground">ID: {acc.accountId} | {acc.currency} | {acc.timezone}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            connectAccountMutation.mutate({
                              metaUserId: metaCallbackData.metaUserId,
                              metaUserName: metaCallbackData.metaUserName,
                              adAccountId: acc.id,
                              adAccountName: acc.name,
                              currency: acc.currency,
                              timezone: acc.timezone,
                              accessToken: metaCallbackData.accessToken,
                              tokenExpiresAt: new Date(Date.now() + (metaCallbackData.expiresIn || 5184000) * 1000).toISOString(),
                            });
                          }}
                          disabled={connectAccountMutation.isPending}
                        >
                          {connectAccountMutation.isPending ? "Connexion..." : "Connecter"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Compte connecté - header */}
            {metaCampaignsData?.connected && metaCampaignsData?.currentAccount && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-info/15 dark:bg-info-light rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-info dark:text-info-dark" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      </div>
                      <div>
                        <p className="font-semibold">{metaCampaignsData.currentAccount.adAccountName}</p>
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                          {metaCampaignsData.currentAccount.currency} | 
                          Dernière sync: {metaCampaignsData.currentAccount.lastSyncedAt 
                            ? new Date(metaCampaignsData.currentAccount.lastSyncedAt).toLocaleString("fr-FR")
                            : "Jamais"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => refetchMeta()}>
                        <RefreshCw className="w-4 h-4 mr-1" /> Actualiser
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive dark:text-destructive hover:text-destructive dark:text-destructive"
                        onClick={() => {
                          if (confirm("Déconnecter ce compte publicitaire ?")) {
                            disconnectMutation.mutate({ id: metaCampaignsData.currentAccount!.id });
                          }
                        }}
                      >
                        Déconnecter
                      </Button>
                    </div>
                  </div>
                  {(metaCampaignsData as any)?.error && (
                    <div className="mt-3 p-3 bg-destructive/10 dark:bg-destructive/20 border border-destructive/20 dark:border-destructive/30 rounded-lg text-sm text-destructive dark:text-destructive">
                      Erreur: {(metaCampaignsData as any).error}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Loading */}
            {metaLoading && (
              <div className="text-center py-8 text-muted-foreground dark:text-muted-foreground">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                Chargement des campagnes...
              </div>
            )}

            {/* Campagnes */}
            {campaigns.length > 0 && (
              <div className="grid gap-4">
                {/* Résumé global */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">Dépenses totales</p>
                      <p className="text-xl text-display text-display font-bold text-info dark:text-info-dark">{filteredCampaigns.reduce((s, c) => s + c.spend, 0).toFixed(2)}€</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">Impressions</p>
                      <p className="text-xl text-display text-display font-bold">{filteredCampaigns.reduce((s, c) => s + c.impressions, 0) > 1000 ? (filteredCampaigns.reduce((s, c) => s + c.impressions, 0) / 1000).toFixed(1) + 'K' : filteredCampaigns.reduce((s, c) => s + c.impressions, 0)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">Clics totaux</p>
                      <p className="text-xl text-display text-display font-bold">{filteredCampaigns.reduce((s, c) => s + c.clicks, 0)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">Leads totaux</p>
                      <p className="text-xl text-display text-display font-bold text-emerald-600 dark:text-emerald-400">{filteredCampaigns.reduce((s, c) => s + c.leads, 0)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">Coût/Lead moyen</p>
                      <p className="text-xl text-display text-display font-bold">
                        {filteredCampaigns.reduce((s, c) => s + c.leads, 0) > 0
                          ? (filteredCampaigns.reduce((s, c) => s + c.spend, 0) / filteredCampaigns.reduce((s, c) => s + c.leads, 0)).toFixed(2)
                          : "0.00"}€
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Graphique d'évolution quotidienne */}
                {dailyInsightsData?.dailyData && dailyInsightsData.dailyData.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Évolution quotidienne</CardTitle>
                      <CardDescription>Dépenses et leads par jour sur la période sélectionnée</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={dailyInsightsData.dailyData.map((d: any) => ({
                              ...d,
                              dateLabel: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
                            }))}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <defs>
                              <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                              dataKey="dateLabel"
                              tick={{ fontSize: 11, fill: '#9ca3af' }}
                              tickLine={false}
                              axisLine={{ stroke: '#e5e7eb' }}
                              interval={dailyInsightsData.dailyData.length > 14 ? Math.floor(dailyInsightsData.dailyData.length / 7) : 0}
                            />
                            <YAxis
                              yAxisId="spend"
                              orientation="left"
                              tick={{ fontSize: 11, fill: '#9ca3af' }}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(v) => `${v}€`}
                            />
                            <YAxis
                              yAxisId="leads"
                              orientation="right"
                              tick={{ fontSize: 11, fill: '#9ca3af' }}
                              tickLine={false}
                              axisLine={false}
                              allowDecimals={false}
                            />
                            <Tooltip
                              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                              formatter={(value: any, name: string) => {
                                if (name === 'Dépenses') return [`${parseFloat(value).toFixed(2)}€`, name];
                                return [value, name];
                              }}
                            />
                            <Legend />
                            <Area
                              yAxisId="spend"
                              type="monotone"
                              dataKey="spend"
                              name="Dépenses"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              fill="url(#colorSpend)"
                            />
                            <Area
                              yAxisId="leads"
                              type="monotone"
                              dataKey="leads"
                              name="Leads"
                              stroke="#22c55e"
                              strokeWidth={2}
                              fill="url(#colorLeads)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex items-center justify-center gap-6 mt-2 text-xs text-muted-foreground dark:text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                          Dépenses (€)
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-400 inline-block"></span>
                          Leads (nombre)
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Filtres des campagnes */}
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  {/* Filtre par statut */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground dark:text-muted-foreground mr-1">Statut :</span>
                    {[
                      { value: "all", label: "Toutes", count: campaignCounts.all },
                      { value: "ACTIVE", label: "Actives", count: campaignCounts.ACTIVE },
                      { value: "PAUSED", label: "En pause", count: campaignCounts.PAUSED },
                      { value: "ARCHIVED", label: "Archivées", count: campaignCounts.ARCHIVED },
                    ].map((filter) => (
                      <Button
                        key={filter.value}
                        variant={campaignStatusFilter === filter.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCampaignStatusFilter(filter.value)}
                        className="text-xs"
                      >
                        {filter.label}
                        {filter.count > 0 && (
                          <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                            campaignStatusFilter === filter.value 
                              ? 'bg-white/20 text-white' 
                              : 'bg-muted dark:bg-muted/50 text-muted-foreground dark:text-muted-foreground'
                          }`}>
                            {filter.count}
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>

                  <div className="w-px h-6 bg-gray-200" />

                  {/* Filtre par priorité / type */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground dark:text-muted-foreground mr-1">Type :</span>
                    {[
                      { value: "all", label: "Toutes" },
                      { value: "priority", label: "Prioritaires" },
                      { value: "secondary", label: "Boost / Autres" },
                    ].map((filter) => (
                      <Button
                        key={filter.value}
                        variant={campaignPriorityFilter === filter.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCampaignPriorityFilter(filter.value)}
                        className="text-xs"
                      >
                        {filter.label}
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                          campaignPriorityFilter === filter.value 
                            ? 'bg-white/20 text-white' 
                            : 'bg-muted dark:bg-muted/50 text-muted-foreground dark:text-muted-foreground'
                        }`}>
                          {filter.value === "all" ? campaigns.length : filter.value === "priority" ? campaigns.filter(c => c.isPriority).length : campaigns.filter(c => !c.isPriority).length}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Tableau des campagnes style Meta Ads Manager */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50 dark:bg-muted/30">
                        <th className="text-left p-3 font-medium text-muted-foreground dark:text-muted-foreground">Campagne</th>
                        <th className="text-right p-3 font-medium text-muted-foreground dark:text-muted-foreground">Statut</th>
                        <th className="text-right p-3 font-medium text-muted-foreground dark:text-muted-foreground">Dépenses</th>
                        <th className="text-right p-3 font-medium text-muted-foreground dark:text-muted-foreground">Portée</th>
                        <th className="text-right p-3 font-medium text-muted-foreground dark:text-muted-foreground">Impressions</th>
                        <th className="text-right p-3 font-medium text-muted-foreground dark:text-muted-foreground">Fréquence</th>
                        <th className="text-right p-3 font-medium text-muted-foreground dark:text-muted-foreground">Clics</th>
                        <th className="text-right p-3 font-medium text-muted-foreground dark:text-muted-foreground">CTR</th>
                        <th className="text-right p-3 font-medium text-muted-foreground dark:text-muted-foreground">CPC</th>
                        <th className="text-right p-3 font-medium text-muted-foreground dark:text-muted-foreground">CPM</th>
                        <th className="text-right p-3 font-medium text-muted-foreground dark:text-muted-foreground">Leads</th>
                        <th className="text-right p-3 font-medium text-muted-foreground dark:text-muted-foreground">CPL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCampaigns.map(campaign => (
                        <tr key={campaign.id} className="border-b hover:bg-muted/50 dark:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{campaign.name}</span>
                                {campaign.isPriority && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-info/15 dark:bg-info-light text-info dark:text-info-dark">Prioritaire</span>
                                )}
                              </div>
                              {campaign.objectiveLabel && (
                                <span className={`text-xs mt-0.5 ${campaign.isPriority ? 'text-blue-500' : 'text-gray-400'}`}>{campaign.objectiveLabel}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <Badge variant={campaign.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                              {campaign.status === "ACTIVE" ? "Active" : campaign.status === "PAUSED" ? "Pause" : campaign.status === "ARCHIVED" ? "Archivée" : campaign.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right font-medium">{campaign.spend.toFixed(2)} €</td>
                          <td className="p-3 text-right">{campaign.reach > 1000 ? (campaign.reach / 1000).toFixed(1) + 'K' : campaign.reach}</td>
                          <td className="p-3 text-right">{campaign.impressions > 1000 ? (campaign.impressions / 1000).toFixed(1) + 'K' : campaign.impressions}</td>
                          <td className="p-3 text-right">{campaign.frequency.toFixed(2)}</td>
                          <td className="p-3 text-right">{campaign.clicks}</td>
                          <td className="p-3 text-right">{campaign.ctr.toFixed(2)}%</td>
                          <td className="p-3 text-right">{campaign.cpc.toFixed(2)} €</td>
                          <td className="p-3 text-right">{campaign.cpm.toFixed(2)} €</td>
                          <td className="p-3 text-right">
                            <span className={campaign.leads > 0 ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-gray-400"}>
                              {campaign.leads}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <span className={campaign.cpl > 0 ? "font-semibold" : "text-gray-400"}>
                              {campaign.cpl > 0 ? campaign.cpl.toFixed(2) + ' €' : '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Ligne de totaux */}
                    <tfoot>
                      <tr className="border-t-2 bg-muted/50 dark:bg-muted/30 font-semibold">
                        <td className="p-3">Total ({filteredCampaigns.length} campagnes)</td>
                        <td className="p-3"></td>
                        <td className="p-3 text-right">{filteredCampaigns.reduce((s, c) => s + c.spend, 0).toFixed(2)} €</td>
                        <td className="p-3 text-right">{(() => { const t = filteredCampaigns.reduce((s, c) => s + c.reach, 0); return t > 1000 ? (t/1000).toFixed(1)+'K' : t; })()}</td>
                        <td className="p-3 text-right">{(() => { const t = filteredCampaigns.reduce((s, c) => s + c.impressions, 0); return t > 1000 ? (t/1000).toFixed(1)+'K' : t; })()}</td>
                        <td className="p-3"></td>
                        <td className="p-3 text-right">{filteredCampaigns.reduce((s, c) => s + c.clicks, 0)}</td>
                        <td className="p-3 text-right">{(() => { const totalClicks = filteredCampaigns.reduce((s, c) => s + c.clicks, 0); const totalImpressions = filteredCampaigns.reduce((s, c) => s + c.impressions, 0); return totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) + '%' : '-'; })()}</td>
                        <td className="p-3 text-right">{(() => { const totalSpend = filteredCampaigns.reduce((s, c) => s + c.spend, 0); const totalClicks = filteredCampaigns.reduce((s, c) => s + c.clicks, 0); return totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) + ' €' : '-'; })()}</td>
                        <td className="p-3"></td>
                        <td className="p-3 text-right text-emerald-600 dark:text-emerald-400">{filteredCampaigns.reduce((s, c) => s + c.leads, 0)}</td>
                        <td className="p-3 text-right">{(() => { const totalSpend = filteredCampaigns.reduce((s, c) => s + c.spend, 0); const totalLeads = filteredCampaigns.reduce((s, c) => s + c.leads, 0); return totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) + ' €' : '-'; })()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Aucune campagne */}
            {metaCampaignsData?.connected && !metaLoading && campaigns.length === 0 && !metaCampaignsData?.error && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground dark:text-muted-foreground">Aucune campagne trouvée pour cette période.</p>
                  <p className="text-sm text-gray-400 mt-2">Essayez de changer la période ou vérifiez votre compte Meta Ads Manager.</p>
                </CardContent>
              </Card>
            )}
              </TabsContent>

              {/* Onglet Google Ads */}
              <TabsContent value="google" className="space-y-4">
                {!googleOAuthUrl?.url ? (
                  <Card className="border-amber-200 bg-amber-500/10 dark:bg-amber-500/20">
                    <CardContent className="p-8">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-amber-500/15 dark:bg-amber-500/25 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-amber-900 mb-2">Configuration Google Ads requise</h3>
                          <p className="text-amber-800 mb-4">
                            Pour connecter votre compte Google Ads, vous devez d'abord configurer vos identifiants OAuth dans Google Cloud Console.
                          </p>
                          <div className="bg-white rounded-lg p-4 mb-4">
                            <h4 className="font-semibold text-sm text-gray-900 mb-2">Étapes de configuration :</h4>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-foreground dark:text-foreground">
                              <li>Aller sur <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-info dark:text-info-dark hover:underline">Google Cloud Console</a></li>
                              <li>Créer un projet ou sélectionner un projet existant</li>
                              <li>Activer l'API Google Ads</li>
                              <li>Créer des identifiants OAuth 2.0 (Application Web)</li>
                              <li>Ajouter l'URL de redirection : <code className="bg-muted dark:bg-muted/50 px-1 py-0.5 rounded text-xs">{window.location.origin}/api/google-ads/callback</code></li>
                              <li>Copier le Client ID et Client Secret</li>
                              <li>Contacter l'administrateur pour ajouter ces identifiants aux variables d'environnement</li>
                            </ol>
                          </div>
                          <p className="text-sm text-amber-700">
                            Une fois configuré, rechargez cette page pour voir le bouton de connexion.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : googleConnectedAccounts && googleConnectedAccounts.length > 0 ? (
                  <div className="space-y-4">
                    <Card className="border-emerald-500/20 dark:border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/20">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-500/15 dark:bg-emerald-500/25 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-green-900">Compte Google Ads connecté</h3>
                            <p className="text-sm text-emerald-700 dark:text-emerald-400">{googleConnectedAccounts[0].googleUserEmail}</p>
                            {googleConnectedAccounts[0].customerId === 'PENDING' && (
                              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Customer ID non récupéré - Cliquez sur "Récupérer Customer ID"
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {googleConnectedAccounts[0].customerId === 'PENDING' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => fetchCustomerIdMutation.mutate({ accountId: googleConnectedAccounts[0].id })}
                                disabled={fetchCustomerIdMutation.isPending}
                              >
                                {fetchCustomerIdMutation.isPending ? 'Récupération...' : 'Récupérer Customer ID'}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('Êtes-vous sûr de vouloir déconnecter ce compte Google Ads ?')) {
                                  disconnectGoogleMutation.mutate({ accountId: googleConnectedAccounts[0].id });
                                }
                              }}
                              className="text-destructive dark:text-destructive border-destructive/20 dark:border-destructive/30 hover:bg-destructive/10 dark:bg-destructive/20"
                            >
                              Déconnecter
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    {/* Google Ads KPI Summary */}
                    {googleCampaignsLoading ? (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                          <p className="text-muted-foreground dark:text-muted-foreground">Chargement des campagnes Google Ads...</p>
                        </CardContent>
                      </Card>
                    ) : googleCampaignsData?.error ? (
                      <Card className="border-amber-200 bg-amber-500/10 dark:bg-amber-500/20">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div>
                              <h3 className="font-semibold text-amber-900">Erreur de récupération des campagnes</h3>
                              <p className="text-sm text-amber-700 mt-1">{googleCampaignsData.error}</p>
                              <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchGoogleCampaigns()}>
                                <RefreshCw className="w-4 h-4 mr-2" /> Réessayer
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <>
                        {/* Date Preset Selector */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
                            <Select value={googleDatePreset} onValueChange={setGoogleDatePreset}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="today">Aujourd'hui</SelectItem>
                                <SelectItem value="yesterday">Hier</SelectItem>
                                <SelectItem value="last_7d">7 derniers jours</SelectItem>
                                <SelectItem value="last_30d">30 derniers jours</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => refetchGoogleCampaigns()}>
                            <RefreshCw className="w-4 h-4 mr-2" /> Actualiser
                          </Button>
                        </div>

                        {/* KPI Cards */}
                        {(() => {
                          const campaigns = googleCampaignsData?.campaigns || [];
                          const totalSpend = campaigns.reduce((sum: number, c: any) => sum + (c.insights?.spend || 0), 0);
                          const totalClicks = campaigns.reduce((sum: number, c: any) => sum + (c.insights?.clicks || 0), 0);
                          const totalImpressions = campaigns.reduce((sum: number, c: any) => sum + (c.insights?.impressions || 0), 0);
                          const totalConversions = campaigns.reduce((sum: number, c: any) => sum + (c.insights?.conversions || 0), 0);
                          const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
                          const avgCpc = totalClicks > 0 ? (totalSpend / totalClicks) : 0;
                          const currency = googleCampaignsData?.currentAccount?.currency || 'EUR';
                          const formatMoney = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(v);

                          return (
                            <>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                <Card>
                                  <CardContent className="p-4">
                                    <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-1">Dépenses</p>
                                    <p className="text-base font-semibold text-display text-gray-900">{formatMoney(totalSpend)}</p>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4">
                                    <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-1">Impressions</p>
                                    <p className="text-base font-semibold text-display text-gray-900">{totalImpressions.toLocaleString('fr-FR')}</p>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4">
                                    <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-1">Clics</p>
                                    <p className="text-base font-semibold text-display text-gray-900">{totalClicks.toLocaleString('fr-FR')}</p>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4">
                                    <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-1">CTR</p>
                                    <p className="text-base font-semibold text-display text-gray-900">{avgCtr.toFixed(2)}%</p>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4">
                                    <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-1">CPC moyen</p>
                                    <p className="text-base font-semibold text-display text-gray-900">{formatMoney(avgCpc)}</p>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4">
                                    <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-1">Conversions</p>
                                    <p className="text-base font-semibold text-display text-gray-900">{totalConversions.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}</p>
                                  </CardContent>
                                </Card>
                              </div>

                              {/* Campaigns Table */}
                              {campaigns.length === 0 ? (
                                <Card>
                                  <CardContent className="p-8 text-center">
                                    <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                    <p className="text-muted-foreground dark:text-muted-foreground">Aucune campagne trouvée pour cette période</p>
                                  </CardContent>
                                </Card>
                              ) : (
                                <Card>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Campagnes ({campaigns.length})</CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-sm">
                                        <thead>
                                          <tr className="border-b bg-muted/50 dark:bg-muted/30">
                                            <th className="text-left p-3 font-medium text-muted-foreground dark:text-muted-foreground">Campagne</th>
                                            <th className="text-left p-3 font-medium text-muted-foreground dark:text-muted-foreground">Type</th>
                                            <th className="text-left p-3 font-medium text-muted-foreground dark:text-muted-foreground">Statut</th>
                                            <th className="text-right p-3 font-medium text-muted-foreground dark:text-muted-foreground">Budget/j</th>
                                            <th className="text-right p-3 font-medium text-muted-foreground dark:text-muted-foreground">Dépenses</th>
                                            <th className="text-right p-3 font-medium text-muted-foreground dark:text-muted-foreground">Impressions</th>
                                            <th className="text-right p-3 font-medium text-muted-foreground dark:text-muted-foreground">Clics</th>
                                            <th className="text-right p-3 font-medium text-muted-foreground dark:text-muted-foreground">CTR</th>
                                            <th className="text-right p-3 font-medium text-muted-foreground dark:text-muted-foreground">CPC</th>
                                            <th className="text-right p-3 font-medium text-muted-foreground dark:text-muted-foreground">Conv.</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {campaigns.map((campaign: any) => {
                                            const ins = campaign.insights || {};
                                            const ctr = ins.impressions > 0 ? (ins.clicks / ins.impressions * 100) : 0;
                                            const cpc = ins.clicks > 0 ? (ins.spend / ins.clicks) : 0;
                                            const dailyBudget = campaign.budget_micros / 1_000_000;
                                            return (
                                              <tr key={campaign.id} className="border-b hover:bg-muted/50 dark:bg-muted/30">
                                                <td className="p-3">
                                                  <div className="font-medium text-gray-900 max-w-[200px] truncate" title={campaign.name}>{campaign.name}</div>
                                                </td>
                                                <td className="p-3">
                                                  <Badge variant="outline" className="text-xs">{campaign.channel_type}</Badge>
                                                </td>
                                                <td className="p-3">
                                                  <Badge className={campaign.status === 'Active' ? 'bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400' : campaign.status === 'En pause' ? 'bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-400' : 'bg-muted dark:bg-muted/50 text-gray-800'}>
                                                    {campaign.status}
                                                  </Badge>
                                                </td>
                                                <td className="p-3 text-right text-muted-foreground dark:text-muted-foreground">{formatMoney(dailyBudget)}</td>
                                                <td className="p-3 text-right font-medium">{formatMoney(ins.spend || 0)}</td>
                                                <td className="p-3 text-right text-muted-foreground dark:text-muted-foreground">{(ins.impressions || 0).toLocaleString('fr-FR')}</td>
                                                <td className="p-3 text-right text-muted-foreground dark:text-muted-foreground">{(ins.clicks || 0).toLocaleString('fr-FR')}</td>
                                                <td className="p-3 text-right text-muted-foreground dark:text-muted-foreground">{ctr.toFixed(2)}%</td>
                                                <td className="p-3 text-right text-muted-foreground dark:text-muted-foreground">{formatMoney(cpc)}</td>
                                                <td className="p-3 text-right font-medium">{(ins.conversions || 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}</td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </>
                          );
                        })()}
                      </>
                    )}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Connecter votre compte Google Ads</h3>
                      <p className="text-muted-foreground dark:text-muted-foreground mb-6 max-w-md mx-auto">
                        Connectez votre compte Google Ads pour voir vos campagnes, dépenses, impressions et conversions en temps réel.
                      </p>
                      <Button
                        onClick={() => {
                          if (googleOAuthUrl?.url) {
                            window.location.href = googleOAuthUrl.url;
                          }
                        }}
                        disabled={googleConnecting}
                        className="bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 hover:from-blue-600 hover:via-red-600 hover:to-yellow-600 text-white"
                      >
                        {googleConnecting ? (
                          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Connexion en cours...</>
                        ) : (
                          <><svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="white"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="white"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="white"/></svg> Connecter avec Google</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Onglet Par partenaire */}
          <TabsContent value="partners" className="space-y-4">
            <div className="grid gap-4">
              {Object.entries(partnerStats).map(([name, stats]) => {
                const contactRate = stats.total > 0 ? Math.round((stats.contacted / stats.total) * 100) : 0;
                const conversionRate = stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0;
                
                return (
                  <Card key={name}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{name}</h3>
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground">{stats.total} leads assignés</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl text-display text-display font-bold text-emerald-600 dark:text-emerald-400">{conversionRate}%</p>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground">Taux de conversion</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground dark:text-muted-foreground">Taux de contact</span>
                            <span className="font-medium">{contactRate}%</span>
                          </div>
                          <Progress value={contactRate} className="h-2" />
                        </div>
                        <div className="grid grid-cols-3 gap-4 pt-2">
                          <div className="text-center">
                            <p className="text-lg font-semibold text-info dark:text-info-dark">{stats.total - stats.contacted}</p>
                            <p className="text-xs text-muted-foreground dark:text-muted-foreground">Non contactés</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-yellow-600">{stats.contacted - stats.converted}</p>
                            <p className="text-xs text-muted-foreground dark:text-muted-foreground">En cours</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{stats.converted}</p>
                            <p className="text-xs text-muted-foreground dark:text-muted-foreground">Convertis</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Onglet Comparaison */}
          <TabsContent value="comparison" className="space-y-4">
            {!metaCampaignsData?.connected ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <GitCompareArrows className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Comparaison de périodes</h3>
                  <p className="text-muted-foreground dark:text-muted-foreground">Connectez d'abord votre compte Meta Ads dans l'onglet Campagnes pour accéder à la comparaison.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Sélecteur de mode de comparaison */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <GitCompareArrows className="w-5 h-5" />
                      Mode de comparaison
                    </CardTitle>
                    <CardDescription>
                      Comparez les performances de la période actuelle ({comparisonPeriods.currentPeriod.since} au {comparisonPeriods.currentPeriod.until}) avec une autre période
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-3">
                      {[
                        { value: "previous" as const, label: "Période précédente" },
                        { value: "year" as const, label: "Même période, année précédente" },
                        { value: "custom" as const, label: "Période personnalisée" },
                      ].map((mode) => (
                        <Button
                          key={mode.value}
                          variant={comparisonMode === mode.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setComparisonMode(mode.value)}
                        >
                          {mode.label}
                        </Button>
                      ))}
                      {comparisonMode === "custom" && (
                        <div className="flex items-center gap-2 ml-2">
                          <Input
                            type="date"
                            value={compCustomFrom}
                            onChange={(e) => setCompCustomFrom(e.target.value)}
                            className="w-40 h-8 text-xs"
                          />
                          <span className="text-gray-400">→</span>
                          <Input
                            type="date"
                            value={compCustomTo}
                            onChange={(e) => setCompCustomTo(e.target.value)}
                            className="w-40 h-8 text-xs"
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                      Comparaison : {comparisonPeriods.previousPeriod.since} au {comparisonPeriods.previousPeriod.until}
                    </p>
                  </CardContent>
                </Card>

                {/* Loading */}
                {comparisonLoading && (
                  <div className="text-center py-8 text-muted-foreground dark:text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Chargement de la comparaison...
                  </div>
                )}

                {/* Résultats de la comparaison */}
                {comparisonData?.current && comparisonData?.previous && !comparisonLoading && (() => {
                  const current = comparisonData.current;
                  const previous = comparisonData.previous;
                  
                  const calcChange = (curr: number, prev: number) => {
                    if (prev === 0 && curr === 0) return 0;
                    if (prev === 0) return 100;
                    return ((curr - prev) / prev) * 100;
                  };

                  const metrics = [
                    { key: "spend", label: "Dépenses", format: (v: number) => v.toFixed(2) + " €", color: "blue", invertColor: true },
                    { key: "leads", label: "Leads", format: (v: number) => v.toString(), color: "green", invertColor: false },
                    { key: "clicks", label: "Clics", format: (v: number) => v > 1000 ? (v / 1000).toFixed(1) + 'K' : v.toString(), color: "indigo", invertColor: false },
                    { key: "impressions", label: "Impressions", format: (v: number) => v > 1000 ? (v / 1000).toFixed(1) + 'K' : v.toString(), color: "purple", invertColor: false },
                    { key: "reach", label: "Portée", format: (v: number) => v > 1000 ? (v / 1000).toFixed(1) + 'K' : v.toString(), color: "cyan", invertColor: false },
                    { key: "ctr", label: "CTR", format: (v: number) => v.toFixed(2) + " %", color: "amber", invertColor: false },
                    { key: "cpc", label: "CPC", format: (v: number) => v.toFixed(2) + " €", color: "orange", invertColor: true },
                    { key: "cpm", label: "CPM", format: (v: number) => v.toFixed(2) + " €", color: "rose", invertColor: true },
                    { key: "frequency", label: "Fréquence", format: (v: number) => v.toFixed(2), color: "teal", invertColor: true },
                    { key: "costPerLead", label: "Coût/Lead", format: (v: number) => v > 0 ? v.toFixed(2) + " €" : "-", color: "emerald", invertColor: true },
                  ];

                  return (
                    <>
                      {/* Cartes de comparaison */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {metrics.map((metric) => {
                          const currVal = (current as any)[metric.key] || 0;
                          const prevVal = (previous as any)[metric.key] || 0;
                          const change = calcChange(currVal, prevVal);
                          // For cost metrics, decrease is good (green), increase is bad (red)
                          // For performance metrics, increase is good (green), decrease is bad (red)
                          const isPositive = metric.invertColor ? change <= 0 : change >= 0;
                          
                          return (
                            <Card key={metric.key} className="relative overflow-hidden">
                              <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-1">{metric.label}</p>
                                <p className="text-base font-semibold text-display">{metric.format(currVal)}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  {change !== 0 ? (
                                    <>
                                      {change > 0 ? (
                                        <ArrowUpRight className={`w-3.5 h-3.5 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
                                      ) : (
                                        <ArrowDownRight className={`w-3.5 h-3.5 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
                                      )}
                                      <span className={`text-xs font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive dark:text-destructive'}`}>
                                        {change > 0 ? '+' : ''}{change.toFixed(1)}%
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Minus className="w-3.5 h-3.5 text-gray-400" />
                                      <span className="text-xs text-gray-400">0%</span>
                                    </>
                                  )}
                                  <span className="text-xs text-gray-400 ml-1">vs {metric.format(prevVal)}</span>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      {/* Graphique en barres groupées */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Comparaison visuelle</CardTitle>
                          <CardDescription>Métriques clés : période actuelle vs période de comparaison</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={[
                                  { name: 'Dépenses (€)', current: current.spend, previous: previous.spend },
                                  { name: 'Leads', current: current.leads, previous: previous.leads },
                                  { name: 'Clics', current: current.clicks, previous: previous.clicks },
                                  { name: 'CTR (%)', current: parseFloat(current.ctr.toFixed(2)), previous: parseFloat(previous.ctr.toFixed(2)) },
                                  { name: 'CPC (€)', current: parseFloat(current.cpc.toFixed(2)), previous: parseFloat(previous.cpc.toFixed(2)) },
                                  { name: 'CPL (€)', current: parseFloat(current.costPerLead.toFixed(2)), previous: parseFloat(previous.costPerLead.toFixed(2)) },
                                ]}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                  dataKey="name"
                                  tick={{ fontSize: 11, fill: '#6b7280' }}
                                  tickLine={false}
                                  axisLine={{ stroke: '#e5e7eb' }}
                                />
                                <YAxis
                                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                                  tickLine={false}
                                  axisLine={false}
                                />
                                <Tooltip
                                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                  formatter={(value: any, name: string) => [
                                    typeof value === 'number' ? value.toFixed(2) : value,
                                    name === 'current' ? 'Période actuelle' : 'Période précédente'
                                  ]}
                                />
                                <Legend
                                  formatter={(value: string) => value === 'current' ? 'Période actuelle' : 'Période précédente'}
                                />
                                <Bar dataKey="current" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="previous" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Tableau de comparaison détaillé */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Détail de la comparaison</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b bg-muted/50 dark:bg-muted/30">
                                  <th className="text-left p-3 font-medium text-muted-foreground dark:text-muted-foreground">Métrique</th>
                                  <th className="text-right p-3 font-medium text-muted-foreground dark:text-muted-foreground">
                                    Période actuelle
                                    <span className="block text-xs font-normal text-gray-400">{comparisonPeriods.currentPeriod.since} → {comparisonPeriods.currentPeriod.until}</span>
                                  </th>
                                  <th className="text-right p-3 font-medium text-muted-foreground dark:text-muted-foreground">
                                    Période précédente
                                    <span className="block text-xs font-normal text-gray-400">{comparisonPeriods.previousPeriod.since} → {comparisonPeriods.previousPeriod.until}</span>
                                  </th>
                                  <th className="text-right p-3 font-medium text-muted-foreground dark:text-muted-foreground">Évolution</th>
                                </tr>
                              </thead>
                              <tbody>
                                {metrics.map((metric) => {
                                  const currVal = (current as any)[metric.key] || 0;
                                  const prevVal = (previous as any)[metric.key] || 0;
                                  const change = calcChange(currVal, prevVal);
                                  const isPositive = metric.invertColor ? change <= 0 : change >= 0;
                                  
                                  return (
                                    <tr key={metric.key} className="border-b hover:bg-muted/50 dark:bg-muted/30 transition-colors">
                                      <td className="p-3 font-medium text-gray-900">{metric.label}</td>
                                      <td className="p-3 text-right font-semibold">{metric.format(currVal)}</td>
                                      <td className="p-3 text-right text-muted-foreground dark:text-muted-foreground">{metric.format(prevVal)}</td>
                                      <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          {change !== 0 ? (
                                            <>
                                              {change > 0 ? (
                                                <ArrowUpRight className={`w-4 h-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
                                              ) : (
                                                <ArrowDownRight className={`w-4 h-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
                                              )}
                                              <span className={`font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive dark:text-destructive'}`}>
                                                {change > 0 ? '+' : ''}{change.toFixed(1)}%
                                              </span>
                                            </>
                                          ) : (
                                            <span className="text-gray-400">—</span>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}

                {/* Erreur */}
                {comparisonData && !comparisonData.current && !comparisonLoading && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground dark:text-muted-foreground">Aucune donnée disponible pour cette comparaison.</p>
                      {(comparisonData as any)?.error && (
                        <p className="text-sm text-red-500 mt-2">{(comparisonData as any).error}</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal détail lead */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedLead && (() => {
            // Parse customFields JSON
            let parsedCustomFields: Record<string, string> = {};
            try {
              if (selectedLead.customFields) {
                parsedCustomFields = JSON.parse(selectedLead.customFields);
              }
            } catch { /* ignore parse errors */ }

            // Helper to format custom field keys into readable labels
            const formatFieldLabel = (key: string): string => {
              return key
                .replace(/_/g, ' ')
                .replace(/\?/g, '?')
                .replace(/\s+/g, ' ')
                .trim()
                .replace(/^./, c => c.toUpperCase());
            };

            // Helper to format custom field values
            const formatFieldValue = (value: string): string => {
              return value
                .replace(/_/g, ' ')
                .replace(/\(/g, '(')
                .replace(/\)/g, ')')
                .trim()
                .replace(/^./, c => c.toUpperCase());
            };

            // Separate known fields from Q&A fields
            const knownKeys = ['full_name', 'email', 'phone_number', 'city', 'zip', 'postal_code', 'postcode', 'post_code', 'street_address', 'state', 'country'];
            const qaFields = Object.entries(parsedCustomFields).filter(
              ([key]) => !knownKeys.includes(key.toLowerCase())
            );

            // Extract company name from customFields if available
            const companyName = parsedCustomFields.company_name || parsedCustomFields.company || parsedCustomFields.entreprise || null;

            // Build full address from customFields if not in main fields
            const displayCity = selectedLead.city || parsedCustomFields.city || null;
            const displayPostalCode = selectedLead.postalCode || parsedCustomFields.zip || parsedCustomFields.postal_code || parsedCustomFields.postcode || parsedCustomFields.post_code || null;
            const displayAddress = selectedLead.address || parsedCustomFields.street_address || null;
            const displayCountry = selectedLead.country || parsedCustomFields.country || null;

            return (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl text-display text-display flex items-center gap-2">
                  {selectedLead.firstName} {selectedLead.lastName}
                  {companyName && <span className="text-base font-normal text-muted-foreground dark:text-muted-foreground">({companyName})</span>}
                  {isPartnerCandidate(selectedLead) && (
                    <Badge className="bg-orange-500/15 dark:bg-orange-500/25 text-orange-800 dark:text-orange-400 text-xs ml-2">
                      <Handshake className="w-3 h-3 mr-1" />
                      Candidat Partenaire
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>
                  Lead reçu le {formatDate(selectedLead.receivedAt)} — Source: {selectedLead.source?.replace('_', ' ')}
                </DialogDescription>
              </DialogHeader>

              {/* Bandeau candidat partenaire */}
              {isPartnerCandidate(selectedLead) && (
                <div className="bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/20 dark:border-orange-500/30 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Handshake className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <p className="text-sm font-medium text-orange-800 dark:text-orange-400">Ce lead est un candidat partenaire</p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">Redirigé automatiquement vers la Carte du Réseau</p>
                    </div>
                  </div>
                  <a href="/admin/partner-map" className="text-sm text-orange-700 dark:text-orange-400 hover:text-orange-900 font-medium flex items-center gap-1">
                    <Map className="w-4 h-4" />
                    Voir sur la carte
                  </a>
                </div>
              )}

              <div className="space-y-5 py-4">
                {/* Section: Coordonnées */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground dark:text-foreground mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" /> Coordonnées
                  </h4>
                  <div className="grid grid-cols-2 gap-3 bg-muted/50 dark:bg-muted/30 rounded-lg p-4">
                    <div>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground uppercase tracking-wide">Email</p>
                      <p className="font-medium text-sm">{selectedLead.email || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground uppercase tracking-wide">Téléphone</p>
                      <p className="font-medium text-sm">{selectedLead.phone || "-"}</p>
                    </div>
                    {companyName && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground uppercase tracking-wide">Entreprise</p>
                        <p className="font-medium text-sm">{companyName}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section: Localisation */}
                {(displayAddress || displayCity || displayPostalCode || displayCountry) && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground dark:text-foreground mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Localisation
                    </h4>
                    <div className="grid grid-cols-2 gap-3 bg-muted/50 dark:bg-muted/30 rounded-lg p-4">
                      {displayAddress && (
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground uppercase tracking-wide">Adresse</p>
                          <p className="font-medium text-sm">{displayAddress}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground uppercase tracking-wide">Ville</p>
                        <p className="font-medium text-sm">{displayCity || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground uppercase tracking-wide">Code postal</p>
                        <p className="font-medium text-sm">{displayPostalCode || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground uppercase tracking-wide">Pays</p>
                        <p className="font-medium text-sm">{displayCountry || "-"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section: Détails du lead */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground dark:text-foreground mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" /> Détails du lead
                  </h4>
                  <div className="grid grid-cols-2 gap-3 bg-muted/50 dark:bg-muted/30 rounded-lg p-4">
                    <div>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground uppercase tracking-wide">Statut</p>
                      <Badge className={LEAD_STATUSES[selectedLead.status as keyof typeof LEAD_STATUSES]?.color + " mt-1"}>
                        {LEAD_STATUSES[selectedLead.status as keyof typeof LEAD_STATUSES]?.label}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground uppercase tracking-wide">Partenaire assigné</p>
                      <p className="font-medium text-sm">{selectedLead.partnerName || "Non assigné"}</p>
                    </div>
                    {selectedLead.productInterest && (
                      <div>
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground uppercase tracking-wide">Produit d'intérêt</p>
                        <p className="font-medium text-sm">{selectedLead.productInterest}</p>
                      </div>
                    )}
                    {selectedLead.budget && (
                      <div>
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground uppercase tracking-wide">Budget</p>
                        <p className="font-medium text-sm">{selectedLead.budget}</p>
                      </div>
                    )}
                    {selectedLead.timeline && (
                      <div>
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground uppercase tracking-wide">Délai</p>
                        <p className="font-medium text-sm">{selectedLead.timeline}</p>
                      </div>
                    )}
                    {selectedLead.estimatedValue && (
                      <div>
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground uppercase tracking-wide">Valeur estimée</p>
                        <p className="font-medium text-sm">{parseFloat(selectedLead.estimatedValue).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section: Questions-Réponses du formulaire Meta */}
                {qaFields.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground dark:text-foreground mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Réponses au formulaire
                    </h4>
                    <div className="bg-info/10 dark:bg-info-light rounded-lg p-4 space-y-3">
                      {qaFields.map(([key, value]) => (
                        <div key={key} className="border-b border-blue-100 last:border-0 pb-2 last:pb-0">
                          <p className="text-xs text-info dark:text-info-dark font-medium uppercase tracking-wide">{formatFieldLabel(key)}</p>
                          <p className="font-medium text-sm text-gray-800 mt-0.5">{formatFieldValue(String(value))}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section: Message / Notes */}
                {(selectedLead.message || selectedLead.notes) && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground dark:text-foreground mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Notes
                    </h4>
                    <div className="bg-muted/50 dark:bg-muted/30 rounded-lg p-4 space-y-2">
                      {selectedLead.message && (
                        <div>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground uppercase tracking-wide">Message</p>
                          <p className="text-sm mt-1">{selectedLead.message}</p>
                        </div>
                      )}
                      {selectedLead.notes && (
                        <div>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground uppercase tracking-wide">Notes internes</p>
                          <p className="text-sm mt-1">{selectedLead.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Section: Suivi */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground dark:text-foreground mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Suivi
                  </h4>
                  <div className="bg-muted/50 dark:bg-muted/30 rounded-lg p-4">
                    {selectedLead.firstContactAt ? (
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Premier contact: {formatDate(selectedLead.firstContactAt)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">Pas encore contacté ({selectedLead.contactAttempts} tentatives)</span>
                      </div>
                    )}
                    {selectedLead.assignedAt && (
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-2">Assigné le {formatDate(selectedLead.assignedAt)}</p>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedLead(null)}>
                  Fermer
                </Button>
              </DialogFooter>
            </>
          );
          })()}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
