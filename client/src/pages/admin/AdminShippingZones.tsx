import { AdminLayout } from "@/components/AdminLayout";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

import { TableSkeleton } from "@/components/TableSkeleton";
import { Plus, Edit, Trash2, Truck, Search, Filter, MapPin } from "lucide-react";
import { toast } from "sonner";

const COUNTRIES = [
  { code: "BE", name: "Belgique" },
  { code: "FR", name: "France" },
  { code: "LU", name: "Luxembourg" },
  { code: "NL", name: "Pays-Bas" },
  { code: "DE", name: "Allemagne" },
  { code: "ES", name: "Espagne" },
  { code: "IT", name: "Italie" },
  { code: "CH", name: "Suisse" },
  { code: "AT", name: "Autriche" },
  { code: "PT", name: "Portugal" },
  { code: "GB", name: "Royaume-Uni" },
];

function getCountryName(code: string) {
  return COUNTRIES.find((c) => c.code === code)?.name || code;
}

function getCountryFlag(code: string) {
  const flags: Record<string, string> = {
    BE: "\u{1F1E7}\u{1F1EA}",
    FR: "\u{1F1EB}\u{1F1F7}",
    LU: "\u{1F1F1}\u{1F1FA}",
    NL: "\u{1F1F3}\u{1F1F1}",
    DE: "\u{1F1E9}\u{1F1EA}",
    ES: "\u{1F1EA}\u{1F1F8}",
    IT: "\u{1F1EE}\u{1F1F9}",
    CH: "\u{1F1E8}\u{1F1ED}",
    AT: "\u{1F1E6}\u{1F1F9}",
    PT: "\u{1F1F5}\u{1F1F9}",
    GB: "\u{1F1EC}\u{1F1E7}",
  };
  return flags[code] || "";
}

interface ShippingZoneForm {
  name: string;
  country: string;
  postalCodeFrom: string;
  postalCodeTo: string;
  postalCodePrefix: string;
  shippingCostHT: string;
  isActive: boolean;
  notes: string;
}

const emptyForm: ShippingZoneForm = {
  name: "",
  country: "BE",
  postalCodeFrom: "",
  postalCodeTo: "",
  postalCodePrefix: "",
  shippingCostHT: "",
  isActive: true,
  notes: "",
};

export default function AdminShippingZones() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ShippingZoneForm>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCountry, setFilterCountry] = useState<string>("all");

  const zonesQuery = trpc.shippingZones.list.useQuery();
  const createMutation = trpc.shippingZones.create.useMutation({
    onSuccess: () => {
      toast.success("Zone de transport créée avec succès");
      zonesQuery.refetch();
      setShowDialog(false);
      setForm(emptyForm);
    },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.shippingZones.update.useMutation({
    onSuccess: () => {
      toast.success("Zone de transport mise à jour");
      zonesQuery.refetch();
      setShowDialog(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.shippingZones.delete.useMutation({
    onSuccess: () => {
      toast.success("Zone de transport supprimée");
      zonesQuery.refetch();
      setDeleteConfirmId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const zones = Array.isArray(zonesQuery.data) ? zonesQuery.data : [];

  const filteredZones = zones.filter((zone: any) => {
    const matchesSearch =
      !searchTerm ||
      zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (zone.postalCodePrefix || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (zone.postalCodeFrom || "").includes(searchTerm) ||
      (zone.postalCodeTo || "").includes(searchTerm);
    const matchesCountry = filterCountry === "all" || zone.country === filterCountry;
    return matchesSearch && matchesCountry;
  });

  // Group zones by country for summary
  const countrySummary = zones.reduce((acc: Record<string, { count: number; active: number }>, zone: any) => {
    if (!acc[zone.country]) acc[zone.country] = { count: 0, active: 0 };
    acc[zone.country].count++;
    if (zone.isActive) acc[zone.country].active++;
    return acc;
  }, {});

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openEdit(zone: any) {
    setEditingId(zone.id);
    setForm({
      name: zone.name,
      country: zone.country,
      postalCodeFrom: zone.postalCodeFrom || "",
      postalCodeTo: zone.postalCodeTo || "",
      postalCodePrefix: zone.postalCodePrefix || "",
      shippingCostHT: zone.shippingCostHT?.toString() || "",
      isActive: zone.isActive ?? true,
      notes: zone.notes || "",
    });
    setShowDialog(true);
  }

  function handleSubmit() {
    const cost = parseFloat(form.shippingCostHT);
    if (!form.name.trim()) {
      toast.error("Le nom de la zone est requis");
      return;
    }
    if (isNaN(cost) || cost < 0) {
      toast.error("Le tarif HT doit être un nombre positif");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        name: form.name,
        country: form.country,
        postalCodeFrom: form.postalCodeFrom || null,
        postalCodeTo: form.postalCodeTo || null,
        postalCodePrefix: form.postalCodePrefix || null,
        shippingCostHT: cost,
        isActive: form.isActive,
        notes: form.notes || null,
      });
    } else {
      createMutation.mutate({
        name: form.name,
        country: form.country,
        postalCodeFrom: form.postalCodeFrom || undefined,
        postalCodeTo: form.postalCodeTo || undefined,
        postalCodePrefix: form.postalCodePrefix || undefined,
        shippingCostHT: cost,
        isActive: form.isActive,
        notes: form.notes || undefined,
      });
    }
  }

  function getZoneTypeLabel(zone: any) {
    if (zone.postalCodePrefix) return `Préfixe: ${zone.postalCodePrefix}*`;
    if (zone.postalCodeFrom && zone.postalCodeTo) return `${zone.postalCodeFrom} - ${zone.postalCodeTo}`;
    return "Tout le pays";
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="h-7 w-7 text-blue-600" />
              Frais de transport
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gérez les tarifs de livraison par zone géographique
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle zone
          </Button>
        </div>

        {/* Country summary cards */}
        {Object.keys(countrySummary).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(countrySummary)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([country, stats]) => (
                <Card
                  key={country}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    filterCountry === country ? "ring-2 ring-blue-500 bg-blue-50" : ""
                  }`}
                  onClick={() => setFilterCountry(filterCountry === country ? "all" : country)}
                >
                  <CardContent className="p-3 text-center">
                    <div className="text-xl mb-1">{getCountryFlag(country)}</div>
                    <div className="font-semibold text-sm">{getCountryName(country)}</div>
                    <div className="text-xs text-gray-500">
                      {(stats as any).active}/{(stats as any).count} zones actives
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, pays, code postal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterCountry} onValueChange={setFilterCountry}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tous les pays" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les pays</SelectItem>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {getCountryFlag(c.code)} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Zones table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Zones de transport ({filteredZones.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {zonesQuery.isLoading ? (
              <TableSkeleton rows={5} cols={6} />
            ) : filteredZones.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">Aucune zone de transport</p>
                <p className="text-gray-400 text-sm mt-1">
                  {zones.length === 0
                    ? "Créez votre première zone pour définir les tarifs de livraison"
                    : "Aucune zone ne correspond aux filtres sélectionnés"}
                </p>
                {zones.length === 0 && (
                  <Button onClick={openCreate} className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Créer une zone
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom de la zone</TableHead>
                      <TableHead>Pays</TableHead>
                      <TableHead>Couverture</TableHead>
                      <TableHead className="text-right">Tarif HT</TableHead>
                      <TableHead className="text-center">Statut</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredZones.map((zone: any) => (
                      <TableRow key={zone.id} className={!zone.isActive ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{zone.name}</TableCell>
                        <TableCell>
                          <span className="whitespace-nowrap">
                            {getCountryFlag(zone.country)} {getCountryName(zone.country)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getZoneTypeLabel(zone)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {parseFloat(zone.shippingCostHT).toFixed(2)} €
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={zone.isActive ? "default" : "secondary"}
                            className={zone.isActive ? "bg-green-100 text-green-800" : ""}
                          >
                            {zone.isActive ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-gray-500">
                          {zone.notes || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(zone)}
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirmId(zone.id)}
                              title="Supprimer"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Modifier la zone" : "Nouvelle zone de transport"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Modifiez les paramètres de cette zone de livraison"
                  : "Définissez une zone géographique et son tarif de livraison"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la zone *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Belgique - Bruxelles, France - Île-de-France"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Pays *</Label>
                  <Select
                    value={form.country}
                    onValueChange={(v) => setForm({ ...form, country: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {getCountryFlag(c.code)} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingCostHT">Tarif HT (€) *</Label>
                  <Input
                    id="shippingCostHT"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="150.00"
                    value={form.shippingCostHT}
                    onChange={(e) => setForm({ ...form, shippingCostHT: e.target.value })}
                  />
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-3 bg-gray-50">
                <p className="text-sm font-medium text-gray-700">
                  Filtrage par code postal (optionnel)
                </p>
                <p className="text-xs text-gray-500">
                  Laissez vide pour appliquer le tarif à tout le pays. Utilisez le préfixe pour cibler une région (ex: "75" pour Paris), ou une plage pour un intervalle.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="postalCodePrefix">Préfixe de code postal</Label>
                  <Input
                    id="postalCodePrefix"
                    placeholder="Ex: 75, 10, 40"
                    value={form.postalCodePrefix}
                    onChange={(e) => setForm({ ...form, postalCodePrefix: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="postalCodeFrom">Code postal début</Label>
                    <Input
                      id="postalCodeFrom"
                      placeholder="Ex: 1000"
                      value={form.postalCodeFrom}
                      onChange={(e) => setForm({ ...form, postalCodeFrom: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCodeTo">Code postal fin</Label>
                    <Input
                      id="postalCodeTo"
                      placeholder="Ex: 1999"
                      value={form.postalCodeTo}
                      onChange={(e) => setForm({ ...form, postalCodeTo: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Zone active</Label>
                  <p className="text-xs text-gray-500">
                    Les zones inactives ne sont pas utilisées pour le calcul
                  </p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes internes</Label>
                <Textarea
                  id="notes"
                  placeholder="Notes ou commentaires sur cette zone..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Enregistrement..."
                  : editingId
                  ? "Mettre à jour"
                  : "Créer la zone"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer cette zone de transport ? Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmId && deleteMutation.mutate({ id: deleteConfirmId })}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
