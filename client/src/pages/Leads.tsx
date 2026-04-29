import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChevronLeft,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  User,
  Target,
  CheckCircle,
  XCircle,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Filter,
  MoreVertical
} from "lucide-react";
import { Link } from "wouter";
import { OnboardingTour } from "@/components/OnboardingTour";
import { useOnboarding } from "@/hooks/useOnboarding";
import { leadsTour } from "@/config/onboarding-tours";
import { ExportButton } from "@/components/ExportButton";

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
  productInterest: string | null;
  budget: string | null;
  message: string | null;
  contactAttempts: number;
  receivedAt: string;
  firstContactAt: string | null;
  lastContactAt: string | null;
  notes: string | null;
}

const LEAD_STATUSES = {
  NEW: { label: "Nouveau", color: "bg-info/10 text-info dark:bg-info-light dark:text-info-dark border border-info/20", icon: Target },
  ASSIGNED: { label: "Assigné", color: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border border-primary/20", icon: User },
  CONTACTED: { label: "Contacté", color: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20", icon: Phone },
  NO_RESPONSE: { label: "Sans réponse", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 dark:bg-orange-500/20 dark:text-orange-400 border border-orange-500/20", icon: AlertCircle },
  QUALIFIED: { label: "Qualifié", color: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20", icon: CheckCircle },
  NOT_QUALIFIED: { label: "Non qualifié", color: "bg-muted text-muted-foreground border border-border", icon: XCircle },
  MEETING_SCHEDULED: { label: "RDV planifié", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/20", icon: Calendar },
  QUOTE_SENT: { label: "Devis envoyé", color: "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400 border border-cyan-500/20", icon: Mail },
  NEGOTIATION: { label: "Négociation", color: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20", icon: MessageSquare },
  CONVERTED: { label: "Converti", color: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20", icon: TrendingUp },
  LOST: { label: "Perdu", color: "bg-destructive/10 text-destructive dark:bg-destructive/20 border border-destructive/20", icon: XCircle },
};

const LEAD_SOURCES = {
  META_ADS: "Facebook/Instagram",
  GOOGLE_ADS: "Google Ads",
  WEBSITE: "Site web",
  REFERRAL: "Recommandation",
  PHONE: "Téléphone",
  EMAIL: "Email",
  TRADE_SHOW: "Salon",
  OTHER: "Autre",
};

export default function Leads() {
  const { user } = useAuth();
  const onboarding = useOnboarding("leads");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");

  // Fetch leads from backend
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
  
  const adminLeadsQuery = trpc.admin.leads.list.useQuery(
    { status: statusFilter !== "all" ? statusFilter : undefined },
    { enabled: isAdmin }
  );
  const partnerLeadsQuery = trpc.leads.myLeads.useQuery(
    { status: statusFilter, limit: 100 },
    { enabled: !isAdmin }
  );
  const { data: leads, isLoading, refetch } = isAdmin ? adminLeadsQuery : partnerLeadsQuery;

  const exportQuery = trpc.leads.export.useQuery(
    { status: statusFilter },
    { enabled: false }
  );

  const { data: stats } = trpc.leads.myStats.useQuery();

  const updateStatusMutation = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      setShowStatusDialog(false);
      setSelectedLead(null);
    },
  });

  const handleUpdateStatus = () => {
    if (!selectedLead || !newStatus) return;
    updateStatusMutation.mutate({
      id: selectedLead.id,
      status: newStatus,
      notes: statusNote,
    });
  };

  // Helper function to normalize lead data (handles both direct and joined structures)
  const normalizeLead = (lead: any) => {
    // If lead has 'leads' property, it's from a join
    if (lead.leads) {
      return {
        ...lead.leads,
        partner: lead.partners,
      };
    }
    // Otherwise it's direct
    return lead;
  };

  // Normalize all leads
  const normalizedLeads = (leads || []).map(normalizeLead);

  // Filter leads by search query
  const filteredLeads = normalizedLeads.filter((lead: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.firstName?.toLowerCase().includes(query) ||
      lead.lastName?.toLowerCase().includes(query) ||
      lead.email?.toLowerCase().includes(query) ||
      lead.phone?.toLowerCase().includes(query) ||
      lead.city?.toLowerCase().includes(query)
    );
  });

  // Remove demo data below
  const _demoLeads: Lead[] = [
    {
      id: 1,
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean.dupont@email.com",
      phone: "+32 470 12 34 56",
      city: "Bruxelles",
      postalCode: "1000",
      status: "NEW",
      source: "META_ADS",
      productInterest: "Jacuzzi 6 places",
      budget: "5000-10000€",
      message: "Je recherche un jacuzzi pour mon jardin, livraison possible ?",
      contactAttempts: 0,
      receivedAt: new Date().toISOString(),
      firstContactAt: null,
      lastContactAt: null,
      notes: null,
    },
    {
      id: 2,
      firstName: "Marie",
      lastName: "Martin",
      email: "marie.martin@email.com",
      phone: "+32 475 98 76 54",
      city: "Liège",
      postalCode: "4000",
      status: "CONTACTED",
      source: "META_ADS",
      productInterest: "Sauna infrarouge",
      budget: "3000-5000€",
      message: "Intéressée par un sauna 2 places pour usage personnel",
      contactAttempts: 2,
      receivedAt: new Date(Date.now() - 86400000).toISOString(),
      firstContactAt: new Date(Date.now() - 43200000).toISOString(),
      lastContactAt: new Date(Date.now() - 3600000).toISOString(),
      notes: "A rappeler demain matin, intéressée mais veut comparer les prix",
    },
    {
      id: 3,
      firstName: "Pierre",
      lastName: "Leroy",
      email: "pierre.leroy@email.com",
      phone: "+32 478 11 22 33",
      city: "Namur",
      postalCode: "5000",
      status: "QUALIFIED",
      source: "META_ADS",
      productInterest: "Swim Spa",
      budget: "15000-20000€",
      message: "Projet de construction, besoin d'un swim spa pour la nouvelle maison",
      contactAttempts: 3,
      receivedAt: new Date(Date.now() - 172800000).toISOString(),
      firstContactAt: new Date(Date.now() - 86400000).toISOString(),
      lastContactAt: new Date(Date.now() - 7200000).toISOString(),
      notes: "Client très intéressé, RDV prévu pour visite showroom",
    },
  ];

  // Stats are now fetched from backend via trpc.leads.myStats.useQuery()
  // filteredLeads is now computed above after fetching data

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { 
      day: "numeric", 
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getTimeSince = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
    if (diffHours > 0) return `Il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`;
    return "À l'instant";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header data-tour="leads-header" className="bg-card border-b sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Retour
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl text-display text-display font-bold text-gray-900">Mes Leads</h1>
                <p className="text-xs md:text-sm text-muted-foreground dark:text-muted-foreground">Gérez vos prospects et suivez vos conversions</p>
              </div>
            </div>
            <ExportButton
              onExport={async () => {
                const result = await exportQuery.refetch();
                return result.data || { fileBase64: "" };
              }}
              filename={`leads-${new Date().toISOString().split('T')[0]}.xlsx`}
            />
          </div>
        </div>
      </header>

      <main className="container py-6">
        {/* Stats */}
        <div data-tour="leads-stats" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground dark:text-muted-foreground">Total leads</p>
                  <p className="text-2xl text-display text-display font-bold">{stats?.total || 0}</p>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground dark:text-muted-foreground">Nouveaux</p>
                  <p className="text-2xl text-display text-display font-bold text-info dark:text-info-dark">{(stats as any)?.new || 0}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground dark:text-muted-foreground">En cours</p>
                  <p className="text-2xl text-display text-display font-bold text-yellow-600">{(stats as any)?.inProgress || 0}</p>
                </div>
                <Phone className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground dark:text-muted-foreground">Convertis</p>
                  <p className="text-2xl text-display text-display font-bold text-emerald-600 dark:text-emerald-400">{(stats as any)?.converted || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, email, téléphone, ville..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.entries(LEAD_STATUSES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des leads */}
        <div data-tour="leads-list" className="space-y-4">
          {filteredLeads.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun lead trouvé</h3>
                <p className="text-muted-foreground dark:text-muted-foreground">
                  {searchQuery || statusFilter !== "all" 
                    ? "Essayez de modifier vos filtres"
                    : "Les leads de vos campagnes apparaîtront ici"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredLeads.map(lead => {
              const statusConfig = LEAD_STATUSES[lead.status as keyof typeof LEAD_STATUSES] || LEAD_STATUSES.NEW;
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card 
                  key={lead.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedLead(lead)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                      <div className="flex items-start gap-3 w-full sm:w-auto">
                        <div className={`p-2 rounded-full ${statusConfig.color} flex-shrink-0`}>
                          <StatusIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {lead.firstName} {lead.lastName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="outline" className={`${statusConfig.color} text-xs`}>
                              {statusConfig.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {LEAD_SOURCES[lead.source as keyof typeof LEAD_SOURCES]}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground dark:text-muted-foreground">
                            {lead.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {lead.email}
                              </span>
                            )}
                            {lead.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {lead.phone}
                              </span>
                            )}
                            {lead.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {lead.postalCode} {lead.city}
                              </span>
                            )}
                          </div>
                          {lead.productInterest && (
                            <p className="text-xs md:text-sm text-muted-foreground dark:text-muted-foreground mt-2">
                              <strong>Intérêt :</strong> {lead.productInterest}
                              {lead.budget && ` • Budget : ${lead.budget}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground dark:text-muted-foreground">{getTimeSince(lead.receivedAt || lead.createdAt)}</p>
                        {(lead.contactAttempts || 0) > 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            {lead.contactAttempts} contact{lead.contactAttempts > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>

      {/* Modal détail lead */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          {selectedLead && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={LEAD_STATUSES[selectedLead.status as keyof typeof LEAD_STATUSES]?.color}>
                    {LEAD_STATUSES[selectedLead.status as keyof typeof LEAD_STATUSES]?.label}
                  </Badge>
                  <Badge variant="outline">
                    {LEAD_SOURCES[selectedLead.source as keyof typeof LEAD_SOURCES]}
                  </Badge>
                </div>
                <DialogTitle className="text-xl text-display text-display">
                  {selectedLead.firstName} {selectedLead.lastName}
                </DialogTitle>
                <DialogDescription>
                  Reçu {formatDate(selectedLead.receivedAt)}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="info" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Informations</TabsTrigger>
                  <TabsTrigger value="history">Historique</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4 mt-4">
                  {/* Coordonnées */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Coordonnées</h4>
                      {selectedLead.email && (
                        <a 
                          href={`mailto:${selectedLead.email}`}
                          className="flex items-center gap-2 text-sm text-info dark:text-info-dark hover:underline"
                        >
                          <Mail className="w-4 h-4" />
                          {selectedLead.email}
                        </a>
                      )}
                      {selectedLead.phone && (
                        <a 
                          href={`tel:${selectedLead.phone}`}
                          className="flex items-center gap-2 text-sm text-info dark:text-info-dark hover:underline"
                        >
                          <Phone className="w-4 h-4" />
                          {selectedLead.phone}
                        </a>
                      )}
                      {selectedLead.city && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {selectedLead.postalCode} {selectedLead.city}
                        </p>
                      )}
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Projet</h4>
                      {selectedLead.productInterest && (
                        <p className="text-xs md:text-sm text-muted-foreground dark:text-muted-foreground">
                          <strong>Produit :</strong> {selectedLead.productInterest}
                        </p>
                      )}
                      {selectedLead.budget && (
                        <p className="text-xs md:text-sm text-muted-foreground dark:text-muted-foreground">
                          <strong>Budget :</strong> {selectedLead.budget}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  {selectedLead.message && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium text-foreground mb-2">Message du prospect</h4>
                      <p className="text-xs md:text-sm text-muted-foreground whitespace-pre-line break-words">{selectedLead.message}</p>
                    </div>
                  )}

                  {/* Actions rapides */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setNewStatus("CONTACTED");
                        setShowStatusDialog(true);
                      }}
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Marquer contacté
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setNewStatus("NO_RESPONSE");
                        setShowStatusDialog(true);
                      }}
                    >
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Sans réponse
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setNewStatus("QUALIFIED");
                        setShowStatusDialog(true);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Qualifié
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setNewStatus("NOT_QUALIFIED");
                        setShowStatusDialog(true);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Non qualifié
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="w-2 h-2 mt-2 rounded-full bg-info" />
                      <div>
                        <p className="text-sm font-medium">Lead reçu</p>
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground">{formatDate(selectedLead.receivedAt)}</p>
                      </div>
                    </div>
                    {selectedLead.firstContactAt && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 mt-2 rounded-full bg-amber-500" />
                        <div>
                          <p className="text-sm font-medium">Premier contact</p>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground">{formatDate(selectedLead.firstContactAt)}</p>
                        </div>
                      </div>
                    )}
                    {selectedLead.lastContactAt && selectedLead.lastContactAt !== selectedLead.firstContactAt && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500" />
                        <div>
                          <p className="text-sm font-medium">Dernier contact</p>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground">{formatDate(selectedLead.lastContactAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-4">
                  <div className="space-y-4">
                    {selectedLead.notes ? (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                        <p className="text-sm text-foreground">{selectedLead.notes}</p>
                      </div>
                    ) : (
                      <p className="text-xs md:text-sm text-muted-foreground dark:text-muted-foreground text-center py-4">
                        Aucune note pour ce lead
                      </p>
                    )}
                    <Textarea 
                      placeholder="Ajouter une note..."
                      className="min-h-[100px]"
                    />
                    <Button className="w-full">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Ajouter la note
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setSelectedLead(null)}>
                  Fermer
                </Button>
                <Button onClick={() => setShowStatusDialog(true)}>
                  Changer le statut
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog changement de statut */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le statut</DialogTitle>
            <DialogDescription>
              Sélectionnez le nouveau statut pour ce lead
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LEAD_STATUSES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${config.color.split(" ")[0]}`} />
                      {config.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Ajouter une note (optionnel)..."
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateStatus} disabled={!newStatus}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <OnboardingTour
        steps={leadsTour}
        isActive={onboarding.isActive}
        currentStep={onboarding.currentStep}
        onNext={onboarding.nextStep}
        onPrev={onboarding.prevStep}
        onSkip={onboarding.skipTour}
        onComplete={onboarding.markCompleted}
      />
    </div>
  );
}
