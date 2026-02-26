import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, AlertCircle, Clock, CheckCircle, XCircle, Package, ArrowUpDown, ArrowUp, ArrowDown,
  RotateCcw, BarChart3, Shield, ShieldCheck, ShieldX, ShieldAlert, Truck, CreditCard, Info,
  Eye, Wrench, Plus, Trash2, ExternalLink
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AfterSalesDetail from "@/components/AfterSalesDetail";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

// ===== CONSTANTS =====
const BRAND_LABELS: Record<string, string> = {
  MARKET_SPAS: "Market Spas", WELLIS_CLASSIC: "Wellis Classic", WELLIS_LIFE: "Wellis Life",
  WELLIS_WIBES: "Wellis Wibes", PASSION_SPAS: "Passion Spas", PLATINUM_SPAS: "Platinum Spas",
};

const STATUS_CONFIG: Record<string, { label: string; icon: any; variant: "default" | "secondary" | "destructive" | "outline"; color?: string }> = {
  NEW: { label: "Nouveau", icon: AlertCircle, variant: "default" },
  ANALYZING: { label: "En analyse", icon: Eye, variant: "default", color: "bg-blue-500" },
  INFO_REQUIRED: { label: "Infos requises", icon: Info, variant: "secondary", color: "bg-amber-500 dark:bg-amber-400" },
  QUOTE_PENDING: { label: "Devis en attente", icon: CreditCard, variant: "secondary" },
  PAYMENT_PENDING: { label: "Paiement en attente", icon: CreditCard, variant: "destructive" },
  PAYMENT_CONFIRMED: { label: "Paiement confirmé", icon: CheckCircle, variant: "default", color: "bg-emerald-500 dark:bg-emerald-400" },
  PARTS_ORDERED: { label: "Pièces commandées", icon: Package, variant: "secondary" },
  SHIPPED: { label: "Expédié", icon: Truck, variant: "default", color: "bg-indigo-500" },
  RESOLVED: { label: "Résolu", icon: CheckCircle, variant: "outline" },
  CLOSED: { label: "Fermé", icon: XCircle, variant: "outline" },
};

const WARRANTY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  COVERED: { label: "Sous garantie", icon: ShieldCheck, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20 dark:border-emerald-500/30" },
  PARTIAL: { label: "Garantie partielle", icon: Shield, color: "text-yellow-600 bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20 dark:border-amber-500/30" },
  EXPIRED: { label: "Garantie expirée", icon: ShieldX, color: "text-destructive dark:text-destructive bg-destructive/10 dark:bg-destructive/20 border-destructive/20 dark:border-destructive/30" },
  EXCLUDED: { label: "Hors garantie", icon: ShieldAlert, color: "text-destructive dark:text-destructive bg-destructive/10 dark:bg-destructive/20 border-destructive/20 dark:border-destructive/30" },
  REVIEW_NEEDED: { label: "Analyse requise", icon: Info, color: "text-info dark:text-info-dark bg-info/10 dark:bg-info-light border-info/20 dark:border-info/30" },
};

// ===== ADMIN MANAGE DIALOG =====
function AdminManageDialog({ serviceId, open, onOpenChange, onSuccess }: {
  serviceId: number; open: boolean; onOpenChange: (open: boolean) => void; onSuccess: () => void;
}) {
  const { data: serviceData, refetch } = trpc.afterSales.getById.useQuery({ id: serviceId }, { enabled: open });
  const { data: allSpareParts } = trpc.spareParts.list.useQuery({}, { enabled: open });

  const [newStatus, setNewStatus] = useState("");
  const [warrantyDecision, setWarrantyDecision] = useState("");
  const [warrantyNotes, setWarrantyNotes] = useState("");
  const [warrantyPercentage, setWarrantyPercentage] = useState(100);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [selectedParts, setSelectedParts] = useState<Array<{ sparePartId: number; quantity: number; unitPrice: number }>>([]);
  const [adminNote, setAdminNote] = useState("");

  // Mutations
  const updateStatusMutation = trpc.afterSales.updateStatus.useMutation({
    onSuccess: () => { alert("Statut mis à jour"); refetch(); onSuccess(); },
    onError: (e) => alert(`Erreur: ${e.message}`),
  });

  const updateWarrantyMutation = trpc.afterSales.updateWarrantyDecision.useMutation({
    onSuccess: () => { alert("Garantie mise à jour"); refetch(); onSuccess(); },
    onError: (e) => alert(`Erreur: ${e.message}`),
  });

  const linkPartMutation = trpc.afterSales.linkSparePart.useMutation({
    onSuccess: () => { alert("Pièce ajoutée"); refetch(); onSuccess(); },
    onError: (e) => alert(`Erreur: ${e.message}`),
  });

  const updateShippingMutation = trpc.afterSales.addTracking.useMutation({
    onSuccess: () => { alert("Expédition mise à jour"); refetch(); onSuccess(); },
    onError: (e) => alert(`Erreur: ${e.message}`),
  });

  const addNoteMutation = trpc.afterSales.addNote.useMutation({
    onSuccess: () => { setAdminNote(""); alert("Note ajoutée"); refetch(); },
    onError: (e) => alert(`Erreur: ${e.message}`),
  });

  const setShippingCostMutation = trpc.afterSales.setShippingCost.useMutation({
    onSuccess: () => { alert("Devis envoyé au partenaire"); refetch(); onSuccess(); },
    onError: (e) => alert(`Erreur: ${e.message}`),
  });

  if (!serviceData) return null;
  const service = serviceData.service;
  const existingParts = serviceData.spareParts || [];

  const handleAddPart = () => {
    setSelectedParts([...selectedParts, { sparePartId: 0, quantity: 1, unitPrice: 0 }]);
  };

  const handleRemovePart = (index: number) => {
    setSelectedParts(selectedParts.filter((_, i) => i !== index));
  };

  const handlePartChange = (index: number, field: string, value: any) => {
    const updated = [...selectedParts];
    (updated[index] as any)[field] = value;
    // Auto-fill price from spare part catalog
    if (field === "sparePartId" && allSpareParts) {
      const part = allSpareParts.find((p: any) => p.id === value);
      if (part) {
        updated[index].unitPrice = part.price || 0;
      }
    }
    setSelectedParts(updated);
  };

  const totalPartsAmount = selectedParts.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0) +
    existingParts.reduce((sum: number, p: any) => sum + ((p.unitPrice || 0) * p.quantity), 0);
  const totalWithShipping = totalPartsAmount + (shippingCost * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-display text-display flex items-center gap-2">
            Gestion du ticket {service.ticketNumber}
            <Badge variant="outline">{BRAND_LABELS[service.brand] || service.brand}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="warranty" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="warranty">Garantie</TabsTrigger>
            <TabsTrigger value="parts">Pièces</TabsTrigger>
            <TabsTrigger value="quote">Devis</TabsTrigger>
            <TabsTrigger value="shipping">Expédition</TabsTrigger>
            <TabsTrigger value="status">Statut</TabsTrigger>
          </TabsList>

          {/* TAB: WARRANTY */}
          <TabsContent value="warranty" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Analyse automatique</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {service.warrantyStatus && (
                  <div className={`border rounded-lg p-3 ${WARRANTY_CONFIG[service.warrantyStatus]?.color || ""}`}>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const cfg = WARRANTY_CONFIG[service.warrantyStatus];
                        const Icon = cfg?.icon || Info;
                        return <Icon className="h-5 w-5" />;
                      })()}
                      <strong>{WARRANTY_CONFIG[service.warrantyStatus]?.label || service.warrantyStatus}</strong>
                      {service.warrantyPercentage > 0 && service.warrantyPercentage < 100 && (
                        <Badge variant="secondary">{service.warrantyPercentage}%</Badge>
                      )}
                    </div>
                    {service.warrantyDetails && <p className="text-sm mt-1">{service.warrantyDetails}</p>}
                  </div>
                )}

                <div className="text-sm space-y-1 bg-muted/30 p-3 rounded">
                  <p><strong>Marque :</strong> {BRAND_LABELS[service.brand] || service.brand}</p>
                  <p><strong>Composant :</strong> {service.component || "-"}</p>
                  <p><strong>Défaut :</strong> {service.defectType || "-"}</p>
                  <p><strong>Date d'achat :</strong> {service.purchaseDate ? new Date(service.purchaseDate).toLocaleDateString("fr-FR") : "-"}</p>
                  <p><strong>Date de livraison :</strong> {service.deliveryDate ? new Date(service.deliveryDate).toLocaleDateString("fr-FR") : "-"}</p>
                  <p><strong>Usage :</strong> {service.usageType === "PRIVATE" ? "Privé" : service.usageType === "COMMERCIAL" ? "Commercial" : service.usageType === "HOLIDAY_LET" ? "Location saisonnière" : "-"}</p>
                  <p><strong>Acheteur initial :</strong> {service.isOriginalBuyer ? "Oui" : "Non"}</p>
                  <p><strong>Spa modifié :</strong> {service.isModified ? "OUI ⚠️" : "Non"}</p>
                  <p><strong>Entretien conforme :</strong> {service.isMaintenanceConform ? "Oui" : "Non ⚠️"}</p>
                  <p><strong>Chimie conforme :</strong> {service.isChemistryConform ? "Oui" : "Non ⚠️"}</p>
                  {service.brand === "PLATINUM_SPAS" && (
                    <p><strong>Peroxyde d'hydrogène :</strong> {service.usesHydrogenPeroxide ? "OUI ⚠️" : "Non"}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Décision admin</CardTitle>
                <CardDescription>Confirmez ou modifiez la décision de garantie après examen des photos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Décision de garantie</Label>
                  <Select value={warrantyDecision || service.warrantyStatus || ""} onValueChange={setWarrantyDecision}>
                    <SelectTrigger><SelectValue placeholder="Sélectionnez la décision" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COVERED">Sous garantie (100%)</SelectItem>
                      <SelectItem value="PARTIAL">Garantie partielle</SelectItem>
                      <SelectItem value="EXPIRED">Garantie expirée</SelectItem>
                      <SelectItem value="EXCLUDED">Hors garantie (exclusion)</SelectItem>
                      <SelectItem value="REVIEW_NEEDED">Analyse complémentaire requise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {warrantyDecision === "PARTIAL" && (
                  <div className="space-y-2">
                    <Label>Pourcentage de couverture (%)</Label>
                    <Input type="number" min={1} max={99} value={warrantyPercentage} onChange={(e) => setWarrantyPercentage(parseInt(e.target.value) || 0)} />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Notes de garantie (visibles par le partenaire)</Label>
                  <Textarea value={warrantyNotes} onChange={(e) => setWarrantyNotes(e.target.value)} rows={3} placeholder="Expliquez la décision de garantie..." />
                </div>

                <Button
                  onClick={() => updateWarrantyMutation.mutate({
                    id: serviceId,
                    warrantyStatus: warrantyDecision as any,
                    warrantyPercentage: warrantyDecision === "PARTIAL" ? warrantyPercentage : warrantyDecision === "COVERED" ? 100 : 0,
                    adminNotes: warrantyNotes,
                    adminOverride: true,
                  })}
                  disabled={!warrantyDecision || updateWarrantyMutation.isPending}
                >
                  {updateWarrantyMutation.isPending ? "Mise à jour..." : "Confirmer la décision de garantie"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: PARTS */}
          <TabsContent value="parts" className="space-y-4">
            {existingParts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pièces déjà assignées</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="text-left py-2">Pièce</th><th className="text-left py-2">Réf.</th><th className="text-center py-2">Qté</th><th className="text-right py-2">Prix</th></tr></thead>
                    <tbody>
                      {existingParts.map((sp: any, i: number) => (
                        <tr key={i} className="border-b"><td className="py-2">{sp.sparePart?.name || "Pièce"}</td><td className="py-2">{sp.sparePart?.sku || "-"}</td><td className="py-2 text-center">{sp.quantity}</td><td className="py-2 text-right">{sp.unitPrice ? `${(sp.unitPrice / 100).toFixed(2)} €` : "Gratuit"}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Ajouter des pièces
                </CardTitle>
                <CardDescription>Sélectionnez les pièces nécessaires pour la réparation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedParts.map((part, index) => (
                  <div key={index} className="flex gap-3 items-end border p-3 rounded">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Pièce</Label>
                      <Select value={part.sparePartId?.toString() || ""} onValueChange={(v) => handlePartChange(index, "sparePartId", parseInt(v))}>
                        <SelectTrigger><SelectValue placeholder="Sélectionnez une pièce" /></SelectTrigger>
                        <SelectContent>
                          {(allSpareParts || []).map((sp: any) => (
                            <SelectItem key={sp.id} value={sp.id.toString()}>
                              {sp.name} ({sp.sku}) — {(sp.price / 100).toFixed(2)} €
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20 space-y-1">
                      <Label className="text-xs">Qté</Label>
                      <Input type="number" min={1} value={part.quantity} onChange={(e) => handlePartChange(index, "quantity", parseInt(e.target.value) || 1)} />
                    </div>
                    <div className="w-28 space-y-1">
                      <Label className="text-xs">Prix unit. (€)</Label>
                      <Input type="number" min={0} step={0.01} value={(part.unitPrice / 100).toFixed(2)} onChange={(e) => handlePartChange(index, "unitPrice", Math.round(parseFloat(e.target.value) * 100) || 0)} />
                    </div>
                    <Button variant="destructive" size="icon" onClick={() => handleRemovePart(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button variant="outline" onClick={handleAddPart} className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Ajouter une pièce
                </Button>

                {selectedParts.length > 0 && (
                  <Button
                    onClick={async () => {
                      for (const part of selectedParts.filter(p => p.sparePartId > 0)) {
                        await linkPartMutation.mutateAsync({
                          serviceId,
                          sparePartId: part.sparePartId,
                          quantity: part.quantity,
                          unitPrice: part.unitPrice.toString(),
                          isCoveredByWarranty: service.warrantyStatus === "COVERED",
                          coveragePercentage: service.warrantyPercentage || 0,
                        });
                      }
                      setSelectedParts([]);
                      alert("Pièces ajoutées avec succès");
                      refetch();
                      onSuccess();
                    }}
                    disabled={linkPartMutation.isPending || selectedParts.every(p => p.sparePartId === 0)}
                  >
                    {linkPartMutation.isPending ? "Ajout..." : "Confirmer les pièces"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: QUOTE */}
          <TabsContent value="quote" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Envoyer un devis au partenaire</CardTitle>
                <CardDescription>
                  {service.warrantyStatus === "COVERED"
                    ? "Ce ticket est sous garantie. Les pièces seront envoyées gratuitement."
                    : "Ce ticket nécessite un paiement. Configurez le devis ci-dessous."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/30 p-4 rounded space-y-2 text-sm">
                  <h4 className="font-medium">Récapitulatif</h4>
                  {existingParts.length > 0 && (
                    <div>
                      <strong>Pièces :</strong>
                      <ul className="ml-4">
                        {existingParts.map((sp: any, i: number) => (
                          <li key={i}>{sp.sparePart?.name} x{sp.quantity} — {sp.unitPrice ? `${((sp.unitPrice * sp.quantity) / 100).toFixed(2)} €` : "Gratuit"}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p><strong>Sous-total pièces :</strong> {(totalPartsAmount / 100).toFixed(2)} €</p>
                </div>

                {service.warrantyStatus !== "COVERED" && (
                  <>
                    <div className="space-y-2">
                      <Label>Frais de livraison (€)</Label>
                      <Input type="number" min={0} step={0.01} value={shippingCost} onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)} />
                    </div>

                    <div className="bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/20 dark:border-orange-500/30 p-4 rounded">
                      <p className="text-base font-semibold text-display">Total TTC : {((totalPartsAmount + shippingCost * 100) / 100).toFixed(2)} €</p>
                      {service.warrantyStatus === "PARTIAL" && service.warrantyPercentage > 0 && (
                        <p className="text-sm text-orange-700 dark:text-orange-400">
                          Couverture garantie : {service.warrantyPercentage}% → Le partenaire paiera {100 - service.warrantyPercentage}% soit {(((totalPartsAmount + shippingCost * 100) * (100 - service.warrantyPercentage) / 100) / 100).toFixed(2)} €
                        </p>
                      )}
                    </div>

                    <Button
                    onClick={() => setShippingCostMutation.mutate({
                      serviceId,
                      shippingCost: shippingCost.toString(),
                    })}
                    disabled={setShippingCostMutation.isPending || existingParts.length === 0}
                      className="bg-orange-600 dark:bg-orange-500 hover:bg-orange-700"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {setShippingCostMutation.isPending ? "Envoi..." : "Envoyer le devis au partenaire"}
                    </Button>
                  </>
                )}

                {service.warrantyStatus === "COVERED" && (
                  <div className="bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 dark:border-emerald-500/30 p-4 rounded">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="h-5 w-5" />
                      <strong>Prise en charge sous garantie</strong>
                    </div>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">Les pièces seront envoyées gratuitement. Passez directement à l'onglet "Expédition".</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: SHIPPING */}
          <TabsContent value="shipping" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4" /> Informations d'expédition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {service.trackingNumber && (
                  <div className="bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-200 p-3 rounded text-sm">
                    <p><strong>Suivi actuel :</strong> {service.trackingNumber}</p>
                    {service.shippingCarrier && <p><strong>Transporteur :</strong> {service.shippingCarrier}</p>}
                    {service.shippedAt && <p><strong>Expédié le :</strong> {new Date(service.shippedAt).toLocaleDateString("fr-FR")}</p>}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Numéro de suivi *</Label>
                    <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Ex: 1Z999AA10123456784" />
                  </div>
                  <div className="space-y-2">
                    <Label>Transporteur</Label>
                    <Select value={shippingCarrier} onValueChange={setShippingCarrier}>
                      <SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DPD">DPD</SelectItem>
                        <SelectItem value="UPS">UPS</SelectItem>
                        <SelectItem value="DHL">DHL</SelectItem>
                        <SelectItem value="Chronopost">Chronopost</SelectItem>
                        <SelectItem value="Colissimo">Colissimo</SelectItem>
                        <SelectItem value="GLS">GLS</SelectItem>
                        <SelectItem value="TNT">TNT</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>URL de suivi (optionnel)</Label>
                  <Input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="https://tracking.dpd.de/..." />
                </div>

                <Button
                  onClick={() => updateShippingMutation.mutate({
                    serviceId,
                    trackingNumber,
                    trackingCarrier: (shippingCarrier || "OTHER") as any,
                  })}
                  disabled={!trackingNumber || updateShippingMutation.isPending}
                >
                  <Truck className="mr-2 h-4 w-4" />
                  {updateShippingMutation.isPending ? "Mise à jour..." : "Confirmer l'expédition"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: STATUS */}
          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Changer le statut</CardTitle>
                <CardDescription>Statut actuel : {STATUS_CONFIG[service.status]?.label || service.status}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nouveau statut</Label>
                  <Select value={newStatus || service.status} onValueChange={setNewStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(newStatus === "RESOLVED" || newStatus === "CLOSED") && (
                  <div className="space-y-2">
                    <Label>Notes de résolution</Label>
                    <Textarea value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} rows={3} placeholder="Décrivez la résolution..." />
                  </div>
                )}

                <Button
                  onClick={() => updateStatusMutation.mutate({
                    id: serviceId,
                    status: newStatus as any,
                    resolutionNotes: resolutionNotes || undefined,
                  })}
                  disabled={!newStatus || newStatus === service.status || updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? "Mise à jour..." : "Mettre à jour le statut"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ajouter une note admin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={3} placeholder="Note visible par le partenaire..." />
                <Button onClick={() => addNoteMutation.mutate({ id: serviceId, note: adminNote, isInternal: true })} disabled={!adminNote.trim() || addNoteMutation.isPending}>
                  {addNoteMutation.isPending ? "Envoi..." : "Ajouter la note"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ===== MAIN ADMIN PAGE =====
export default function AdminAfterSales() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [warrantyFilter, setWarrantyFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [customerNameFilter, setCustomerNameFilter] = useState<string>("");
  const [orderBy, setOrderBy] = useState<string>("createdAt");
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("desc");
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [manageServiceId, setManageServiceId] = useState<number | null>(null);
  const [statsPeriod, setStatsPeriod] = useState<string>("8weeks");

  const handleSort = (column: string) => {
    if (orderBy === column) setOrderDirection(orderDirection === "asc" ? "desc" : "asc");
    else { setOrderBy(column); setOrderDirection("desc"); }
  };

  const handleResetFilters = () => {
    setSearchQuery(""); setStatusFilter("all"); setUrgencyFilter("all"); setWarrantyFilter("all");
    setDateFrom(""); setDateTo(""); setCustomerNameFilter(""); setOrderBy("createdAt"); setOrderDirection("desc");
  };

  const { data: services, isLoading, refetch } = trpc.afterSales.list.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    urgency: urgencyFilter !== "all" ? urgencyFilter : undefined,
    warrantyStatus: warrantyFilter !== "all" ? warrantyFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    customerName: customerNameFilter || undefined,
    search: searchQuery || undefined,
    orderBy, orderDirection,
  });

  const { data: statsData } = trpc.afterSales.stats.useQuery({ period: statsPeriod });
  const { data: weeklyStats } = trpc.afterSales.weeklyStats.useQuery({ period: statsPeriod });
  const { data: partners } = trpc.partners.list.useQuery({});

  const filteredServices = (services || []).filter((s: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const svc = s.service;
    return svc.ticketNumber?.toLowerCase().includes(q) || svc.serialNumber?.toLowerCase().includes(q) ||
      svc.description?.toLowerCase().includes(q) || svc.brand?.toLowerCase().includes(q) ||
      svc.modelName?.toLowerCase().includes(q) || svc.customerName?.toLowerCase().includes(q);
  });

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.NEW;
    const Icon = config.icon;
    return <Badge variant={config.variant} className={`gap-1 ${config.color || ""}`}><Icon className="h-3 w-3" />{config.label}</Badge>;
  };

  const getWarrantyBadge = (ws: string | null) => {
    if (!ws) return null;
    const cfg = WARRANTY_CONFIG[ws];
    if (!cfg) return null;
    const Icon = cfg.icon;
    return <Badge variant="outline" className={`gap-1 ${cfg.color}`}><Icon className="h-3 w-3" />{cfg.label}</Badge>;
  };

  const getUrgencyBadge = (u: string) => {
    if (u === "CRITICAL") return <Badge variant="destructive">Critique</Badge>;
    if (u === "URGENT") return <Badge className="bg-orange-500 text-white">Urgent</Badge>;
    return <Badge variant="secondary">Normal</Badge>;
  };

  // Stats
  const stats = {
    total: filteredServices.length,
    new: filteredServices.filter((s: any) => s.service.status === "NEW").length,
    analyzing: filteredServices.filter((s: any) => s.service.status === "ANALYZING").length,
    paymentPending: filteredServices.filter((s: any) => s.service.status === "PAYMENT_PENDING").length,
    shipped: filteredServices.filter((s: any) => s.service.status === "SHIPPED").length,
  };

  // Charts
  const partnerStatsData = useMemo(() => {
    if (!statsData?.byPartner || !partners) return null;
    const pm = new Map(partners.map((p: any) => [p.id, p.companyName]));
    return { labels: statsData.byPartner.map((p: any) => pm.get(p.partnerId) || `#${p.partnerId}`), datasets: [{ label: "Tickets", data: statsData.byPartner.map((p: any) => p.count), backgroundColor: "rgba(59,130,246,0.5)", borderColor: "rgba(59,130,246,1)", borderWidth: 1 }] };
  }, [statsData?.byPartner, partners]);

  const statusData = useMemo(() => {
    if (!statsData?.byStatus) return null;
    const colors = ["#3b82f6", "#6366f1", "#f59e0b", "#ef4444", "#22c55e", "#8b5cf6", "#06b6d4", "#ec4899", "#10b981", "#6b7280"];
    return {
      labels: statsData.byStatus.map((s: any) => STATUS_CONFIG[s.status]?.label || s.status),
      datasets: [{ data: statsData.byStatus.map((s: any) => s.count), backgroundColor: statsData.byStatus.map((_: any, i: number) => colors[i % colors.length] + "80"), borderColor: statsData.byStatus.map((_: any, i: number) => colors[i % colors.length]), borderWidth: 1 }],
    };
  }, [statsData?.byStatus]);

  const weeklyChartData = useMemo(() => {
    if (!weeklyStats) return null;
    return { labels: weeklyStats.map((w: any) => w.week || "N/A"), datasets: [{ label: "Tickets créés", data: weeklyStats.map((w: any) => w.count), borderColor: "rgba(59,130,246,1)", backgroundColor: "rgba(59,130,246,0.1)", borderWidth: 2, tension: 0.4 }] };
  }, [weeklyStats]);

  const resolvedCount = statsData?.byStatus?.find((s: any) => s.status === "RESOLVED")?.count || 0;
  const closedCount = statsData?.byStatus?.find((s: any) => s.status === "CLOSED")?.count || 0;
  const resolutionRate = statsData?.totalTickets ? Math.round(((resolvedCount + closedCount) / statsData.totalTickets) * 100) : 0;

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Gestion SAV</h1>
          <p className="text-muted-foreground">Gérez toutes les demandes avec analyse de garantie, pièces et expédition</p>
        </div>

        <Tabs defaultValue="tickets" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="tickets">Tickets ({stats.total})</TabsTrigger>
            <TabsTrigger value="stats"><BarChart3 className="h-4 w-4 mr-2" />Statistiques</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets">
            {/* Quick Stats */}
            <div className="grid grid-cols-5 gap-4 mb-6">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle></CardHeader><CardContent><div className="text-2xl text-display text-display font-bold">{stats.total}</div></CardContent></Card>
              <Card className="border-info/20 dark:border-info/30"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-info dark:text-info-dark">Nouveaux</CardTitle></CardHeader><CardContent><div className="text-2xl text-display text-display font-bold text-info dark:text-info-dark">{stats.new}</div></CardContent></Card>
              <Card className="border-amber-500/20 dark:border-amber-500/30"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-yellow-600">En analyse</CardTitle></CardHeader><CardContent><div className="text-2xl text-display text-display font-bold text-yellow-600">{stats.analyzing}</div></CardContent></Card>
              <Card className="border-destructive/20 dark:border-destructive/30"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-destructive dark:text-destructive">Paiement en attente</CardTitle></CardHeader><CardContent><div className="text-2xl text-display text-display font-bold text-destructive dark:text-destructive">{stats.paymentPending}</div></CardContent></Card>
              <Card className="border-indigo-200"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-indigo-600">Expédiés</CardTitle></CardHeader><CardContent><div className="text-2xl text-display text-display font-bold text-indigo-600">{stats.shipped}</div></CardContent></Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Rechercher par ticket, série, marque, modèle, client..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                      </div>
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Statut" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        {Object.entries(STATUS_CONFIG).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="Urgence" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="NORMAL">Normale</SelectItem>
                        <SelectItem value="URGENT">Urgente</SelectItem>
                        <SelectItem value="CRITICAL">Critique</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={warrantyFilter} onValueChange={setWarrantyFilter}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Garantie" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        {Object.entries(WARRANTY_CONFIG).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 items-end">
                    <Input type="text" placeholder="Nom du client..." value={customerNameFilter} onChange={(e) => setCustomerNameFilter(e.target.value)} />
                    <div><label className="text-xs text-muted-foreground mb-1 block">Du</label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
                    <div><label className="text-xs text-muted-foreground mb-1 block">Au</label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div>
                    <Button variant="outline" onClick={handleResetFilters}><RotateCcw className="h-4 w-4 mr-2" />Réinitialiser</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sort */}
            {!isLoading && filteredServices.length > 0 && (
              <Card className="mb-4">
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-wrap gap-2 md:gap-4 md:p-6 items-center text-xs sm:text-sm font-medium">
                    {[{ key: "createdAt", label: "Date" }, { key: "status", label: "Statut" }, { key: "urgency", label: "Urgence" }, { key: "brand", label: "Marque" }, { key: "warrantyStatus", label: "Garantie" }].map(({ key, label }) => (
                      <button key={key} onClick={() => handleSort(key)} className="flex items-center gap-1 hover:text-primary transition-colors">
                        {label}
                        {orderBy === key ? (orderDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />) : <ArrowUpDown className="h-4 w-4 opacity-50" />}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ticket List */}
            {isLoading ? (
              <div className="text-center py-12">Chargement...</div>
            ) : filteredServices.length === 0 ? (
              <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">Aucun ticket SAV trouvé</p></CardContent></Card>
            ) : (
              <div className="grid gap-4">
                {filteredServices.map((item: any) => {
                  const svc = item.service;
                  return (
                    <Card key={svc.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {svc.ticketNumber}
                              <span className="text-sm font-normal text-muted-foreground">
                                {BRAND_LABELS[svc.brand] || svc.brand}{svc.modelName && ` — ${svc.modelName}`}
                              </span>
                            </CardTitle>
                            <CardDescription>
                              N° série: {svc.serialNumber} • {new Date(svc.createdAt).toLocaleDateString("fr-FR")}
                              {svc.component && ` • ${svc.component}`}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1.5 flex-wrap">
                            {getStatusBadge(svc.status)}
                            {getUrgencyBadge(svc.urgency)}
                            {getWarrantyBadge(svc.warrantyStatus)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-3">{svc.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                          {svc.customerName && <span>Client: {svc.customerName}</span>}
                          {svc.defectType && <span>Défaut: {svc.defectType}</span>}
                          {svc.trackingNumber && <span className="flex items-center gap-1 text-indigo-600"><Truck className="h-3 w-3" />{svc.trackingNumber}</span>}
                          {svc.totalAmount > 0 && <span className="font-medium">{(svc.totalAmount / 100).toFixed(2)} €</span>}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedServiceId(svc.id)}>
                            <Eye className="mr-1 h-3 w-3" /> Détails
                          </Button>
                          <Button size="sm" onClick={() => setManageServiceId(svc.id)}>
                            <Wrench className="mr-1 h-3 w-3" /> Gérer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats">
            <div className="mb-6 flex items-center gap-4">
              <Label className="text-sm font-medium">Période :</Label>
              <Select value={statsPeriod} onValueChange={setStatsPeriod}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="4weeks">4 semaines</SelectItem>
                  <SelectItem value="8weeks">8 semaines</SelectItem>
                  <SelectItem value="3months">3 mois</SelectItem>
                  <SelectItem value="1year">1 an</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Tickets</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{statsData?.totalTickets || 0}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Critiques</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-destructive dark:text-destructive">{statsData?.byUrgency?.find((u: any) => u.urgency === "CRITICAL")?.count || 0}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Urgents</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{statsData?.byUrgency?.find((u: any) => u.urgency === "URGENT")?.count || 0}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Taux Résolution</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{resolutionRate}%</div></CardContent></Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Card><CardHeader><CardTitle>Par Partenaire</CardTitle></CardHeader><CardContent>{partnerStatsData ? <Bar data={partnerStatsData} options={{ responsive: true, plugins: { legend: { position: "top" as const } }, scales: { y: { beginAtZero: true } } }} /> : <div className="text-center py-8 text-muted-foreground">Chargement...</div>}</CardContent></Card>
              <Card><CardHeader><CardTitle>Par Statut</CardTitle></CardHeader><CardContent>{statusData ? <Pie data={statusData} options={{ responsive: true, plugins: { legend: { position: "top" as const } } }} /> : <div className="text-center py-8 text-muted-foreground">Chargement...</div>}</CardContent></Card>
              <Card className="md:col-span-2"><CardHeader><CardTitle>Évolution Hebdomadaire</CardTitle></CardHeader><CardContent>{weeklyChartData ? <Line data={weeklyChartData} options={{ responsive: true, plugins: { legend: { position: "top" as const } }, scales: { y: { beginAtZero: true } } }} /> : <div className="text-center py-8 text-muted-foreground">Chargement...</div>}</CardContent></Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Detail Dialog */}
        {selectedServiceId && (
          <Dialog open={!!selectedServiceId} onOpenChange={() => setSelectedServiceId(null)}>
            <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
              <DialogHeader className="sr-only"><DialogTitle>Détail SAV</DialogTitle></DialogHeader>
              <AfterSalesDetail serviceId={selectedServiceId} onClose={() => setSelectedServiceId(null)} />
            </DialogContent>
          </Dialog>
        )}

        {/* Manage Dialog */}
        {manageServiceId && (
          <AdminManageDialog
            serviceId={manageServiceId}
            open={!!manageServiceId}
            onOpenChange={() => setManageServiceId(null)}
            onSuccess={refetch}
          />
        )}
      </div>
    </AdminLayout>
  );
}
