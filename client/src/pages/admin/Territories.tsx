import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Plus, Trash2, Search, Globe, Map } from "lucide-react";
import { toast } from "sonner";

export default function Territories() {
  const [selectedCountry, setSelectedCountry] = useState<number | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    partnerId: "",
    regionId: "",
    priority: "1",
    isExclusive: false,
    notes: "",
  });

  // Queries
  const { data: countries } = trpc.admin.territories.countries.useQuery();
  const { data: allRegions } = trpc.admin.territories.allRegions.useQuery();
  const { data: partners } = trpc.admin.partners.list.useQuery({});
  const { data: allTerritories } = trpc.admin.territories.allPartnerTerritories.useQuery();
  const { data: postalCodeRanges, refetch: refetchPostalCodes } = trpc.admin.territories.postalCodeRanges.useQuery(
    { regionId: selectedCountry || 0 },
    { enabled: !!selectedCountry }
  );

  // Mutations
  const assignMutation = trpc.admin.territories.assign.useMutation({
    onSuccess: () => {
      toast.success("Territoire assigné avec succès");
      setIsAssignDialogOpen(false);
      setAssignForm({
        partnerId: "",
        regionId: "",
        priority: "1",
        isExclusive: false,
        notes: "",
      });
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const removeMutation = trpc.admin.territories.remove.useMutation({
    onSuccess: () => {
      toast.success("Territoire retiré avec succès");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleAssign = () => {
    if (!assignForm.partnerId || !assignForm.regionId) {
      toast.error("Veuillez sélectionner un partenaire et une région");
      return;
    }

    assignMutation.mutate({
      partnerId: parseInt(assignForm.partnerId),
      regionId: parseInt(assignForm.regionId),
      priority: parseInt(assignForm.priority),
      isExclusive: assignForm.isExclusive,
      notes: assignForm.notes || undefined,
    });
  };

  const handleRemove = (territoryId: number) => {
    if (confirm("Êtes-vous sûr de vouloir retirer ce territoire ?")) {
      removeMutation.mutate({ territoryId });
    }
  };

  // Filter regions by country
  const filteredRegions = allRegions?.filter((r) =>
    selectedCountry ? r.countryId === selectedCountry : true
  );

  // Filter territories by partner
  const filteredTerritories = allTerritories?.filter((t) =>
    selectedPartner ? t.partnerId === selectedPartner : true
  );

  // Search territories
  const searchedTerritories = filteredTerritories?.filter((t) =>
    searchTerm
      ? t.partnerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.regionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.countryName.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Territoires</h1>
          <p className="text-muted-foreground mt-1">
            Assignez des régions aux partenaires pour la distribution automatique des leads
          </p>
        </div>
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Assigner un territoire
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Assigner un territoire</DialogTitle>
              <DialogDescription>
                Assignez une région à un partenaire pour qu'il reçoive automatiquement les leads de cette zone
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="partner">Partenaire *</Label>
                <Select value={assignForm.partnerId} onValueChange={(v) => setAssignForm({ ...assignForm, partnerId: v })}>
                  <SelectTrigger id="partner">
                    <SelectValue placeholder="Sélectionnez un partenaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {partners?.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Région *</Label>
                <Select value={assignForm.regionId} onValueChange={(v) => setAssignForm({ ...assignForm, regionId: v })}>
                  <SelectTrigger id="region">
                    <SelectValue placeholder="Sélectionnez une région" />
                  </SelectTrigger>
                  <SelectContent>
                    {allRegions?.map((r) => (
                      <SelectItem key={r.id} value={r.id.toString()}>
                        {r.countryCode} - {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priorité</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="10"
                  value={assignForm.priority}
                  onChange={(e) => setAssignForm({ ...assignForm, priority: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Plus la priorité est élevée, plus le partenaire sera favorisé (1-10)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Input
                  id="notes"
                  placeholder="Notes internes..."
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAssign} disabled={assignMutation.isPending}>
                {assignMutation.isPending ? "Assignation..." : "Assigner"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="territories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="territories">
            <MapPin className="h-4 w-4 mr-2" />
            Territoires assignés
          </TabsTrigger>
          <TabsTrigger value="regions">
            <Map className="h-4 w-4 mr-2" />
            Régions disponibles
          </TabsTrigger>
          <TabsTrigger value="countries">
            <Globe className="h-4 w-4 mr-2" />
            Pays
          </TabsTrigger>
        </TabsList>

        {/* Territoires assignés */}
        <TabsContent value="territories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Territoires assignés aux partenaires</CardTitle>
              <CardDescription>
                {allTerritories?.length || 0} territoire(s) assigné(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par partenaire, région ou pays..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={selectedPartner?.toString() || "all"} onValueChange={(v) => setSelectedPartner(v === "all" ? null : parseInt(v))}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Tous les partenaires" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les partenaires</SelectItem>
                    {partners?.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                {searchedTerritories?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun territoire assigné
                  </div>
                ) : (
                  searchedTerritories?.map((territory) => (
                    <div
                      key={territory.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{territory.countryCode}</Badge>
                          <span className="font-medium">{territory.regionName}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-sm">{territory.partnerName}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>Priorité: {territory.priority}</span>
                          {territory.isExclusive && (
                            <Badge variant="secondary" className="text-xs">
                              Exclusif
                            </Badge>
                          )}
                          <span>Assigné le {new Date(territory.assignedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(territory.id)}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Régions disponibles */}
        <TabsContent value="regions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Régions disponibles</CardTitle>
              <CardDescription>
                {allRegions?.length || 0} région(s) disponible(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select value={selectedCountry?.toString() || "all"} onValueChange={(v) => setSelectedCountry(v === "all" ? null : parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les pays" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les pays</SelectItem>
                    {countries?.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.code} - {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {filteredRegions?.map((region) => (
                  <Card key={region.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {region.name}
                        </CardTitle>
                        <Badge variant="outline">{region.countryCode}</Badge>
                      </div>
                      <CardDescription>Code: {region.code}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        {region.nameEn && <div>EN: {region.nameEn}</div>}
                        {region.nameFr && <div>FR: {region.nameFr}</div>}
                        {region.nameNl && <div>NL: {region.nameNl}</div>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pays */}
        <TabsContent value="countries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pays actifs</CardTitle>
              <CardDescription>
                {countries?.length || 0} pays configuré(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {countries?.map((country) => (
                  <Card key={country.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{country.name}</CardTitle>
                        <Badge>{country.code}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-1">
                        <div>EN: {country.nameEn}</div>
                        <div>FR: {country.nameFr}</div>
                        <div>NL: {country.nameNl}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
