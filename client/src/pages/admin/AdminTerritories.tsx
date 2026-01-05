import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MapPin, Plus, Trash2, Search, AlertCircle } from "lucide-react";

export default function AdminTerritories() {
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Queries
  const { data: partners = [] } = trpc.admin.partners.list.useQuery({});
  const { data: countries = [] } = trpc.admin.territories.countries.useQuery();
  const { data: allRegions = [] } = trpc.admin.territories.allRegions.useQuery();
  const { data: allPartnerTerritories = [] } = trpc.admin.territories.allPartnerTerritories.useQuery();

  // Mutations
  const assignMutation = trpc.admin.territories.assign.useMutation({
    onSuccess: () => {
      toast.success("Territoire attribué avec succès");
      setIsAssignDialogOpen(false);
      utils.admin.territories.allPartnerTerritories.invalidate();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const removeMutation = trpc.admin.territories.remove.useMutation({
    onSuccess: () => {
      toast.success("Territoire retiré avec succès");
      utils.admin.territories.allPartnerTerritories.invalidate();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const utils = trpc.useContext();

  // Form state for assignment
  const [assignForm, setAssignForm] = useState({
    partnerId: "",
    regionId: "",
    priority: 1,
    isExclusive: false,
    notes: "",
  });

  // Filter regions by selected country
  const filteredRegions = selectedCountryId
    ? allRegions.filter((r: any) => r.countryId === selectedCountryId)
    : allRegions;

  // Filter partner territories by search term
  const filteredPartnerTerritories = allPartnerTerritories.filter((pt: any) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      pt.partner?.companyName?.toLowerCase().includes(searchLower) ||
      pt.region?.name?.toLowerCase().includes(searchLower) ||
      pt.country?.name?.toLowerCase().includes(searchLower)
    );
  });

  const handleAssign = () => {
    if (!assignForm.partnerId || !assignForm.regionId) {
      toast.error("Veuillez sélectionner un partenaire et une région");
      return;
    }

    assignMutation.mutate({
      partnerId: parseInt(assignForm.partnerId),
      regionId: parseInt(assignForm.regionId),
      priority: assignForm.priority,
      isExclusive: assignForm.isExclusive,
      notes: assignForm.notes || undefined,
    });
  };

  const handleRemove = (territoryId: number) => {
    if (confirm("Êtes-vous sûr de vouloir retirer ce territoire ?")) {
      removeMutation.mutate({ territoryId });
    }
  };

  // Group territories by partner
  const territoriesByPartner = filteredPartnerTerritories.reduce((acc: any, pt: any) => {
    const partnerId = pt.partnerId;
    if (!acc[partnerId]) {
      acc[partnerId] = {
        partner: pt.partner,
        territories: [],
      };
    }
    acc[partnerId].territories.push(pt);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des territoires</h1>
          <p className="text-muted-foreground mt-1">
            Attribuez des territoires géographiques aux partenaires pour l'attribution automatique des leads
          </p>
        </div>
        <Button onClick={() => setIsAssignDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Attribuer un territoire
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un partenaire ou une région..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pays couverts</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countries.length}</div>
            <p className="text-xs text-muted-foreground">
              {countries.map((c: any) => c.name).join(", ")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Régions disponibles</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allRegions.length}</div>
            <p className="text-xs text-muted-foreground">
              Provinces, départements, cantons
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attributions actives</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allPartnerTerritories.length}</div>
            <p className="text-xs text-muted-foreground">
              Territoires attribués aux partenaires
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Partner Territories List */}
      <Card>
        <CardHeader>
          <CardTitle>Attributions par partenaire</CardTitle>
          <CardDescription>
            Liste des territoires attribués à chaque partenaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(territoriesByPartner).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun territoire attribué pour le moment</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsAssignDialogOpen(true)}
              >
                Attribuer le premier territoire
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.values(territoriesByPartner).map((group: any) => (
                <div key={group.partner.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{group.partner.companyName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {group.territories.length} territoire(s) attribué(s)
                      </p>
                    </div>
                    <Badge variant={group.partner.status === "APPROVED" ? "default" : "secondary"}>
                      {group.partner.status}
                    </Badge>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pays</TableHead>
                        <TableHead>Région</TableHead>
                        <TableHead>Priorité</TableHead>
                        <TableHead>Exclusivité</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.territories.map((territory: any) => (
                        <TableRow key={territory.id}>
                          <TableCell>
                            <Badge variant="outline">{territory.country?.code}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {territory.region?.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{territory.priority}</Badge>
                          </TableCell>
                          <TableCell>
                            {territory.isExclusive ? (
                              <Badge variant="destructive">Exclusif</Badge>
                            ) : (
                              <Badge variant="outline">Partagé</Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {territory.notes || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemove(territory.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Territory Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Attribuer un territoire à un partenaire</DialogTitle>
            <DialogDescription>
              Sélectionnez un partenaire et une région géographique pour l'attribution automatique des leads
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="partner">Partenaire</Label>
              <Select
                value={assignForm.partnerId}
                onValueChange={(value) => setAssignForm({ ...assignForm, partnerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un partenaire" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((partner: any) => (
                    <SelectItem key={partner.id} value={partner.id.toString()}>
                      {partner.companyName} ({partner.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="country">Pays</Label>
              <Select
                value={selectedCountryId?.toString() || ""}
                onValueChange={(value) => {
                  setSelectedCountryId(parseInt(value));
                  setAssignForm({ ...assignForm, regionId: "" });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un pays" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country: any) => (
                    <SelectItem key={country.id} value={country.id.toString()}>
                      {country.name} ({country.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="region">Région / Province / Département</Label>
              <Select
                value={assignForm.regionId}
                onValueChange={(value) => setAssignForm({ ...assignForm, regionId: value })}
                disabled={!selectedCountryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une région" />
                </SelectTrigger>
                <SelectContent>
                  {filteredRegions.map((region: any) => (
                    <SelectItem key={region.id} value={region.id.toString()}>
                      {region.name} ({region.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priorité</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="10"
                  value={assignForm.priority}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, priority: parseInt(e.target.value) || 1 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Plus la priorité est élevée, plus le partenaire sera privilégié
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="exclusive">Exclusivité</Label>
                <Select
                  value={assignForm.isExclusive.toString()}
                  onValueChange={(value) =>
                    setAssignForm({ ...assignForm, isExclusive: value === "true" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Partagé</SelectItem>
                    <SelectItem value="true">Exclusif</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Exclusif = seul ce partenaire reçoit les leads
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                placeholder="Informations complémentaires sur cette attribution..."
                value={assignForm.notes}
                onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAssign} disabled={assignMutation.isPending}>
              {assignMutation.isPending ? "Attribution..." : "Attribuer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
