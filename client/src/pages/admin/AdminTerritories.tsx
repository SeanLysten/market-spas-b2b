import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Save, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminTerritories() {
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [selectedRegionIds, setSelectedRegionIds] = useState<Set<number>>(new Set());

  // Queries
  const { data: partners, isLoading: partnersLoading } = trpc.admin.partners.list.useQuery({});
  const { data: countries, isLoading: countriesLoading } = trpc.admin.territories.countries.useQuery();
  const { data: regions, isLoading: regionsLoading } = trpc.admin.territories.regions.useQuery(
    { countryCode: selectedCountryCode || "" },
    { enabled: !!selectedCountryCode }
  );
  const { data: allTerritories, isLoading: territoriesLoading } = trpc.admin.territories.list.useQuery();
  const { data: partnerTerritories, refetch: refetchPartnerTerritories } = trpc.admin.territories.byPartner.useQuery(
    { partnerId: selectedPartnerId || 0 },
    { enabled: !!selectedPartnerId }
  );

  // Mutations
  const assignMutation = trpc.admin.territories.assign.useMutation({
    onSuccess: () => {
      toast.success("Territoires attribués avec succès");
      refetchPartnerTerritories();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const unassignMutation = trpc.admin.territories.unassign.useMutation({
    onSuccess: () => {
      toast.success("Territoire retiré avec succès");
      refetchPartnerTerritories();
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Map des régions déjà attribuées (regionId -> partnerId)
  const assignedRegionsMap = useMemo(() => {
    const map = new Map<number, { partnerId: number; partnerName: string }>();
    if (allTerritories) {
      allTerritories.forEach((t: any) => {
        map.set(t.regionId, { partnerId: t.partnerId, partnerName: t.partnerName });
      });
    }
    return map;
  }, [allTerritories]);

  // Initialiser les régions sélectionnées quand on change de partenaire
  useMemo(() => {
    if (partnerTerritories && selectedCountryCode) {
      const regionIds = partnerTerritories
        .filter((t: any) => t.countryCode === selectedCountryCode)
        .map((t: any) => t.regionId);
      setSelectedRegionIds(new Set(regionIds));
    } else {
      setSelectedRegionIds(new Set());
    }
  }, [partnerTerritories, selectedCountryCode]);

  const handleToggleRegion = (regionId: number, isAssigned: boolean) => {
    const newSet = new Set(selectedRegionIds);
    if (newSet.has(regionId)) {
      newSet.delete(regionId);
    } else {
      // Vérifier si la région est déjà attribuée à un autre partenaire
      const assigned = assignedRegionsMap.get(regionId);
      if (assigned && assigned.partnerId !== selectedPartnerId) {
        toast.error(`Cette région est déjà attribuée à ${assigned.partnerName}`);
        return;
      }
      newSet.add(regionId);
    }
    setSelectedRegionIds(newSet);
  };

  const handleSave = async () => {
    if (!selectedPartnerId || !selectedCountryCode) {
      toast.error("Veuillez sélectionner un partenaire et un pays");
      return;
    }

    // Régions actuellement attribuées au partenaire dans ce pays
    const currentRegionIds = new Set(
      (partnerTerritories || [])
        .filter((t: any) => t.countryCode === selectedCountryCode)
        .map((t: any) => t.regionId)
    );

    // Régions à ajouter
    const toAdd = Array.from(selectedRegionIds).filter((id) => !currentRegionIds.has(id));

    // Régions à retirer
    const toRemove = (Array.from(currentRegionIds) as number[]).filter((id) => !selectedRegionIds.has(id));

    // Exécuter les mutations
    for (const regionId of toAdd) {
      await assignMutation.mutateAsync({
        partnerId: selectedPartnerId,
        regionId,
        assignedBy: 1, // TODO: Utiliser l'ID de l'utilisateur connecté
      });
    }

    for (const regionId of toRemove) {
      const territory = (partnerTerritories || []).find((t: any) => t.regionId === regionId);
      if (territory) {
        await unassignMutation.mutateAsync({ territoryId: territory.id });
      }
    }

    toast.success("Modifications enregistrées");
  };

  const selectedPartner = partners?.find((p) => p.id === selectedPartnerId);
  const selectedCountry = countries?.find((c) => c.code === selectedCountryCode);

  const isLoading = partnersLoading || countriesLoading || regionsLoading || territoriesLoading;
  const isSaving = assignMutation.isPending || unassignMutation.isPending;

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="h-8 w-8" />
            Gestion des Territoires
          </h1>
          <p className="text-muted-foreground mt-2">
            Attribuez des provinces/départements/cantons exclusifs à chaque partenaire
          </p>
        </div>

        <div className="grid gap-6">
          {/* Sélection du partenaire */}
          <Card>
            <CardHeader>
              <CardTitle>1. Sélectionner le partenaire</CardTitle>
              <CardDescription>Choisissez le partenaire pour lequel vous souhaitez gérer les territoires</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedPartnerId?.toString() || ""}
                onValueChange={(value) => {
                  setSelectedPartnerId(parseInt(value));
                  setSelectedCountryCode(null);
                  setSelectedRegionIds(new Set());
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir un partenaire..." />
                </SelectTrigger>
                <SelectContent>
                  {partners?.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id.toString()}>
                      {partner.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Sélection du pays */}
          {selectedPartnerId && (
            <Card>
              <CardHeader>
                <CardTitle>2. Sélectionner le pays</CardTitle>
                <CardDescription>Choisissez le pays pour lequel vous souhaitez attribuer des territoires</CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedCountryCode || ""}
                  onValueChange={(value) => {
                    setSelectedCountryCode(value);
                    setSelectedRegionIds(new Set());
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir un pays..." />
                  </SelectTrigger>
                  <SelectContent>
                    {countries?.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name} ({country.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Liste des provinces/départements/cantons */}
          {selectedPartnerId && selectedCountryCode && (
            <Card>
              <CardHeader>
                <CardTitle>3. Sélectionner les territoires</CardTitle>
                <CardDescription>
                  Cochez les provinces/départements/cantons à attribuer à <strong>{selectedPartner?.companyName}</strong> en{" "}
                  <strong>{selectedCountry?.name}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {regions?.map((region: any) => {
                        const assigned = assignedRegionsMap.get(region.id);
                        const isOwnedByOther = assigned && assigned.partnerId !== selectedPartnerId;
                        const isChecked = selectedRegionIds.has(region.id);

                        return (
                          <div
                            key={region.id}
                            className={`flex items-start space-x-3 p-4 border rounded-lg ${
                              isOwnedByOther ? "bg-muted opacity-60" : "bg-background"
                            }`}
                          >
                            <Checkbox
                              id={`region-${region.id}`}
                              checked={isChecked}
                              disabled={isOwnedByOther}
                              onCheckedChange={() => handleToggleRegion(region.id, !!assigned)}
                            />
                            <div className="flex-1">
                              <Label
                                htmlFor={`region-${region.id}`}
                                className={`font-medium ${isOwnedByOther ? "cursor-not-allowed" : "cursor-pointer"}`}
                              >
                                {region.name}
                              </Label>
                              <p className="text-sm text-muted-foreground">{region.code}</p>
                              {isOwnedByOther && (
                                <Badge variant="secondary" className="mt-2">
                                  Attribué à {assigned.partnerName}
                                </Badge>
                              )}
                              {isChecked && !isOwnedByOther && (
                                <Badge variant="default" className="mt-2">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Sélectionné
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t">
                      <p className="text-sm text-muted-foreground">
                        {selectedRegionIds.size} territoire(s) sélectionné(s)
                      </p>
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Sauvegarder les territoires
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
