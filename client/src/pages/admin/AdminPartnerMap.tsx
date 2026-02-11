import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import InteractivePartnerMap from '@/components/InteractivePartnerMap';
import { trpc } from '@/lib/trpc';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, MapPin, Target, Filter, Loader2 } from 'lucide-react';

const LEVEL_COLORS: Record<string, string> = {
  VIP: 'bg-violet-100 text-violet-800',
  PLATINUM: 'bg-blue-100 text-blue-800',
  GOLD: 'bg-amber-100 text-amber-800',
  SILVER: 'bg-gray-100 text-gray-800',
  BRONZE: 'bg-orange-100 text-orange-800',
};

export default function AdminPartnerMap() {
  const [filter, setFilter] = useState<'all' | 'partners' | 'leads'>('all');
  const [partnerStatusFilter, setPartnerStatusFilter] = useState('all');
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');

  const { data: mapData, isLoading } = trpc.admin.territories.mapData.useQuery();

  const partners = mapData?.partners || [];
  const leads = mapData?.leads || [];
  const territories = mapData?.territories || [];

  // Stats
  const approvedPartners = partners.filter((p: any) => p.status === 'APPROVED').length;
  const pendingPartners = partners.filter((p: any) => p.status === 'PENDING').length;
  const totalLeads = leads.length;
  const assignedLeads = leads.filter((l: any) => l.leads?.assignedPartnerId || l.assignedPartnerId).length;
  const totalTerritories = territories.length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Carte du Réseau</h1>
          <p className="text-muted-foreground mt-1">
            Visualisez vos partenaires, leads et territoires sur une carte interactive
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Partenaires actifs</p>
                  <p className="text-2xl font-bold">{approvedPartners}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-2xl font-bold">{pendingPartners}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Leads</p>
                  <p className="text-2xl font-bold">{totalLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Leads assignés</p>
                  <p className="text-2xl font-bold">{assignedLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Territoires</p>
                  <p className="text-2xl font-bold">{totalTerritories}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Carte Interactive
              </CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tout afficher</SelectItem>
                      <SelectItem value="partners">Partenaires</SelectItem>
                      <SelectItem value="leads">Leads</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(filter === 'all' || filter === 'partners') && (
                  <Select value={partnerStatusFilter} onValueChange={setPartnerStatusFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Statut partenaire" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="APPROVED">Approuvés</SelectItem>
                      <SelectItem value="PENDING">En attente</SelectItem>
                      <SelectItem value="SUSPENDED">Suspendus</SelectItem>
                      <SelectItem value="TERMINATED">Résiliés</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {(filter === 'all' || filter === 'leads') && (
                  <Select value={leadStatusFilter} onValueChange={setLeadStatusFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Statut lead" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les leads</SelectItem>
                      <SelectItem value="NEW">Nouveaux</SelectItem>
                      <SelectItem value="CONTACTED">Contactés</SelectItem>
                      <SelectItem value="QUALIFIED">Qualifiés</SelectItem>
                      <SelectItem value="WON">Gagnés</SelectItem>
                      <SelectItem value="LOST">Perdus</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-[600px]">
                <div className="text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Chargement des données...</p>
                </div>
              </div>
            ) : (
              <div className="h-[600px] md:h-[700px]">
                <InteractivePartnerMap
                  partners={partners}
                  leads={leads}
                  territories={territories}
                  filter={filter}
                  partnerStatusFilter={partnerStatusFilter}
                  leadStatusFilter={leadStatusFilter}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Légende</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Partner levels */}
              <div>
                <h4 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Niveaux Partenaires</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(LEVEL_COLORS).map(([level, classes]) => (
                    <Badge key={level} className={classes}>
                      {level}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Partner status */}
              <div>
                <h4 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Statut Partenaires</h4>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm">Approuvé</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-sm">En attente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm">Suspendu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500" />
                    <span className="text-sm">Résilié</span>
                  </div>
                </div>
              </div>

              {/* Lead status */}
              <div>
                <h4 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Statut Leads</h4>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm">Nouveau</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-violet-500" />
                    <span className="text-sm">Contacté</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-sm">Qualifié</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm">Gagné</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm">Perdu</span>
                  </div>
                </div>
              </div>

              {/* Map tools */}
              <div>
                <h4 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Outils</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Utilisez le bouton <strong>Me localiser</strong> pour voir votre position</p>
                  <p>Utilisez le bouton <strong>Mesurer distance</strong> pour calculer la distance entre deux points</p>
                  <p>Cliquez sur un marqueur pour voir les détails et les actions rapides</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
