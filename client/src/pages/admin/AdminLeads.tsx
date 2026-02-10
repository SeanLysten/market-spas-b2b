import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
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
  ArrowDownRight
} from "lucide-react";

// Types
interface Lead {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  postalCode: string | null;
  status: string;
  source: string;
  partnerId: number | null;
  partnerName?: string;
  productInterest: string | null;
  budget: string | null;
  contactAttempts: number;
  receivedAt: string;
  firstContactAt: string | null;
}

interface CampaignStats {
  id: string;
  name: string;
  status: string;
  objective: string;
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
  NEW: { label: "Nouveau", color: "bg-blue-100 text-blue-800" },
  ASSIGNED: { label: "Assigné", color: "bg-indigo-100 text-indigo-800" },
  CONTACTED: { label: "Contacté", color: "bg-yellow-100 text-yellow-800" },
  NO_RESPONSE: { label: "Sans réponse", color: "bg-orange-100 text-orange-800" },
  QUALIFIED: { label: "Qualifié", color: "bg-green-100 text-green-800" },
  NOT_QUALIFIED: { label: "Non qualifié", color: "bg-gray-100 text-gray-800" },
  MEETING_SCHEDULED: { label: "RDV planifié", color: "bg-purple-100 text-purple-800" },
  QUOTE_SENT: { label: "Devis envoyé", color: "bg-cyan-100 text-cyan-800" },
  NEGOTIATION: { label: "Négociation", color: "bg-amber-100 text-amber-800" },
  CONVERTED: { label: "Converti", color: "bg-emerald-100 text-emerald-800" },
  LOST: { label: "Perdu", color: "bg-red-100 text-red-800" },
};

export default function AdminLeads() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [partnerFilter, setPartnerFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [metaConnecting, setMetaConnecting] = useState(false);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [metaCallbackData, setMetaCallbackData] = useState<any>(null);
  
  // Detect OAuth code in URL to auto-switch to campaigns tab
  const urlParams = new URLSearchParams(window.location.search);
  const hasOAuthCode = urlParams.has('code');
  const [activeTab, setActiveTab] = useState(hasOAuthCode ? 'campaigns' : 'leads');
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<string>("all");
  const [customDateFrom, setCustomDateFrom] = useState<string>("");
  const [customDateTo, setCustomDateTo] = useState<string>("");
  const [isCustomDate, setIsCustomDate] = useState(false);

  // Récupérer les vrais leads depuis la base de données
  const { data: leadsData, isLoading: leadsLoading, refetch } = trpc.admin.leads.list.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    partnerId: partnerFilter !== "all" ? parseInt(partnerFilter) : undefined,
  });

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
    city: lead.leads?.city || lead.city,
    postalCode: lead.leads?.postalCode || lead.postalCode,
    status: lead.leads?.status || lead.status,
    source: lead.leads?.source || lead.source,
    partnerId: lead.leads?.assignedPartnerId || lead.assignedPartnerId,
    partnerName: lead.partners?.companyName || null,
    productInterest: lead.leads?.productInterest || lead.productInterest,
    budget: lead.leads?.budget || lead.budget,
    contactAttempts: lead.leads?.contactAttempts || lead.contactAttempts || 0,
    receivedAt: lead.leads?.receivedAt || lead.receivedAt,
    firstContactAt: lead.leads?.firstContactAt || lead.firstContactAt,
  }));

  // Meta Ads integration
  const metaQueryInput = isCustomDate && customDateFrom && customDateTo
    ? { since: customDateFrom, until: customDateTo }
    : { datePreset: dateRange === "7" ? "last_7d" : dateRange === "30" ? "last_30d" : dateRange === "365" ? "last_year" : "last_90d" };
  const { data: metaCampaignsData, isLoading: metaLoading, refetch: refetchMeta } = trpc.metaAds.getCampaigns.useQuery(
    metaQueryInput,
    { retry: false }
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

  // Handle Meta OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const metaError = urlParams.get("meta_error");
    
    // Handle OAuth errors
    if (metaError) {
      console.error("Meta OAuth error:", metaError);
      alert(`Erreur de connexion Meta: ${decodeURIComponent(metaError)}`);
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }
    
    if (code && !metaCallbackData) {
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
  }));

  // Filtrer les campagnes par statut
  const filteredCampaigns = campaignStatusFilter === "all" 
    ? campaigns 
    : campaigns.filter(c => c.status === campaignStatusFilter);

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

  // Filtrer les leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchQuery === "" || 
      `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.partnerName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesPartner = partnerFilter === "all" || lead.partnerName === partnerFilter;
    
    return matchesSearch && matchesStatus && matchesPartner;
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
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Leads</h1>
            <p className="text-gray-500">Statistiques des campagnes Meta et suivi des prospects</p>
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
                    className="h-9 px-2 text-sm border rounded-md bg-white"
                  />
                  <span className="text-gray-400 text-sm">→</span>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="h-9 px-2 text-sm border rounded-md bg-white"
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
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* KPIs principaux */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Leads</p>
                  <p className="text-2xl font-bold">{stats.totalLeads}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.newLeads} nouveau{stats.newLeads > 1 ? 'x' : ''}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Taux de conversion</p>
                  <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.convertedLeads} converti{stats.convertedLeads > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Budget dépensé</p>
                  <p className="text-2xl font-bold">{stats.totalSpend.toFixed(2)} €</p>
                  <p className="text-xs text-gray-500 mt-1">
                    CPL moyen: {stats.avgCPL > 0 ? stats.avgCPL.toFixed(2) + ' €' : '-'}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Impressions</p>
                  <p className="text-2xl font-bold">{stats.totalImpressions > 1000 ? (stats.totalImpressions / 1000).toFixed(1) + 'K' : stats.totalImpressions}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Portée: {stats.totalReach > 1000 ? (stats.totalReach / 1000).toFixed(1) + 'K' : stats.totalReach}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Eye className="w-6 h-6 text-purple-600" />
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
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium text-gray-600">Lead</th>
                        <th className="text-left p-4 font-medium text-gray-600">Contact</th>
                        <th className="text-left p-4 font-medium text-gray-600">Partenaire</th>
                        <th className="text-left p-4 font-medium text-gray-600">Statut</th>
                        <th className="text-left p-4 font-medium text-gray-600">Suivi</th>
                        <th className="text-left p-4 font-medium text-gray-600">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredLeads.map(lead => {
                        const statusConfig = LEAD_STATUSES[lead.status as keyof typeof LEAD_STATUSES];
                        return (
                          <tr 
                            key={lead.id} 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedLead(lead)}
                          >
                            <td className="p-4">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {lead.firstName} {lead.lastName}
                                </p>
                                <p className="text-sm text-gray-500">{lead.productInterest}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                {lead.email && (
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {lead.email}
                                  </p>
                                )}
                                {lead.phone && (
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {lead.phone}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="text-sm text-gray-900">{lead.partnerName || "Non assigné"}</p>
                              <p className="text-xs text-gray-500">{lead.postalCode} {lead.city}</p>
                            </td>
                            <td className="p-4">
                              <Badge className={statusConfig?.color}>
                                {statusConfig?.label || lead.status}
                              </Badge>
                            </td>
                            <td className="p-4">
                              {lead.firstContactAt ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-sm">Contacté</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-orange-600">
                                  <Clock className="w-4 h-4" />
                                  <span className="text-sm">En attente</span>
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-sm text-gray-500">
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
            {/* Connexion Meta */}
            {!metaCampaignsData?.connected && (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Connecter votre compte Meta Ads</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
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
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Sélectionnez un compte publicitaire</h3>
                  <p className="text-sm text-gray-600 mb-4">Connecté en tant que <strong>{metaCallbackData.metaUserName}</strong></p>
                  <div className="grid gap-3">
                    {metaCallbackData.adAccounts?.map((acc: any) => (
                      <div key={acc.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div>
                          <p className="font-medium">{acc.name}</p>
                          <p className="text-sm text-gray-500">ID: {acc.accountId} | {acc.currency} | {acc.timezone}</p>
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
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      </div>
                      <div>
                        <p className="font-semibold">{metaCampaignsData.currentAccount.adAccountName}</p>
                        <p className="text-sm text-gray-500">
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
                        className="text-red-600 hover:text-red-700"
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
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      Erreur: {(metaCampaignsData as any).error}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Loading */}
            {metaLoading && (
              <div className="text-center py-8 text-gray-500">
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
                      <p className="text-xs text-gray-500">Dépenses totales</p>
                      <p className="text-xl font-bold text-blue-600">{filteredCampaigns.reduce((s, c) => s + c.spend, 0).toFixed(2)}€</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-gray-500">Impressions</p>
                      <p className="text-xl font-bold">{filteredCampaigns.reduce((s, c) => s + c.impressions, 0) > 1000 ? (filteredCampaigns.reduce((s, c) => s + c.impressions, 0) / 1000).toFixed(1) + 'K' : filteredCampaigns.reduce((s, c) => s + c.impressions, 0)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-gray-500">Clics totaux</p>
                      <p className="text-xl font-bold">{filteredCampaigns.reduce((s, c) => s + c.clicks, 0)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-gray-500">Leads totaux</p>
                      <p className="text-xl font-bold text-green-600">{filteredCampaigns.reduce((s, c) => s + c.leads, 0)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-gray-500">Coût/Lead moyen</p>
                      <p className="text-xl font-bold">
                        {filteredCampaigns.reduce((s, c) => s + c.leads, 0) > 0
                          ? (filteredCampaigns.reduce((s, c) => s + c.spend, 0) / filteredCampaigns.reduce((s, c) => s + c.leads, 0)).toFixed(2)
                          : "0.00"}€
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Filtre de statut des campagnes */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-500 mr-1">Filtrer :</span>
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
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {filter.count}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>

                {/* Tableau des campagnes style Meta Ads Manager */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-medium text-gray-600">Campagne</th>
                        <th className="text-right p-3 font-medium text-gray-600">Statut</th>
                        <th className="text-right p-3 font-medium text-gray-600">Dépenses</th>
                        <th className="text-right p-3 font-medium text-gray-600">Portée</th>
                        <th className="text-right p-3 font-medium text-gray-600">Impressions</th>
                        <th className="text-right p-3 font-medium text-gray-600">Fréquence</th>
                        <th className="text-right p-3 font-medium text-gray-600">Clics</th>
                        <th className="text-right p-3 font-medium text-gray-600">CTR</th>
                        <th className="text-right p-3 font-medium text-gray-600">CPC</th>
                        <th className="text-right p-3 font-medium text-gray-600">CPM</th>
                        <th className="text-right p-3 font-medium text-gray-600">Leads</th>
                        <th className="text-right p-3 font-medium text-gray-600">CPL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCampaigns.map(campaign => (
                        <tr key={campaign.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{campaign.name}</span>
                              {campaign.objective && (
                                <span className="text-xs text-gray-400 mt-0.5">{campaign.objective.replace(/_/g, ' ').toLowerCase()}</span>
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
                            <span className={campaign.leads > 0 ? "font-semibold text-green-600" : "text-gray-400"}>
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
                      <tr className="border-t-2 bg-gray-50 font-semibold">
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
                        <td className="p-3 text-right text-green-600">{filteredCampaigns.reduce((s, c) => s + c.leads, 0)}</td>
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
                  <p className="text-gray-500">Aucune campagne trouvée pour cette période.</p>
                  <p className="text-sm text-gray-400 mt-2">Essayez de changer la période ou vérifiez votre compte Meta Ads Manager.</p>
                </CardContent>
              </Card>
            )}
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
                          <p className="text-sm text-gray-500">{stats.total} leads assignés</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">{conversionRate}%</p>
                          <p className="text-xs text-gray-500">Taux de conversion</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Taux de contact</span>
                            <span className="font-medium">{contactRate}%</span>
                          </div>
                          <Progress value={contactRate} className="h-2" />
                        </div>
                        <div className="grid grid-cols-3 gap-4 pt-2">
                          <div className="text-center">
                            <p className="text-lg font-semibold text-blue-600">{stats.total - stats.contacted}</p>
                            <p className="text-xs text-gray-500">Non contactés</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-yellow-600">{stats.contacted - stats.converted}</p>
                            <p className="text-xs text-gray-500">En cours</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-green-600">{stats.converted}</p>
                            <p className="text-xs text-gray-500">Convertis</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal détail lead */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-lg">
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedLead.firstName} {selectedLead.lastName}
                </DialogTitle>
                <DialogDescription>
                  Lead reçu le {formatDate(selectedLead.receivedAt)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedLead.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium">{selectedLead.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Localisation</p>
                    <p className="font-medium">{selectedLead.postalCode} {selectedLead.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Partenaire assigné</p>
                    <p className="font-medium">{selectedLead.partnerName || "Non assigné"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Produit d'intérêt</p>
                    <p className="font-medium">{selectedLead.productInterest || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Budget</p>
                    <p className="font-medium">{selectedLead.budget || "-"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Statut actuel</p>
                  <Badge className={LEAD_STATUSES[selectedLead.status as keyof typeof LEAD_STATUSES]?.color}>
                    {LEAD_STATUSES[selectedLead.status as keyof typeof LEAD_STATUSES]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Suivi du partenaire</p>
                  {selectedLead.firstContactAt ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Premier contact: {formatDate(selectedLead.firstContactAt)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertCircle className="w-4 h-4" />
                      <span>Pas encore contacté ({selectedLead.contactAttempts} tentatives)</span>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedLead(null)}>
                  Fermer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
