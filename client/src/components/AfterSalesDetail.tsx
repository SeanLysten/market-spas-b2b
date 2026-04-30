import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertCircle, Clock, CheckCircle, XCircle, Package, MessageSquare, Download,
  Shield, ShieldCheck, ShieldX, ShieldAlert, Truck, CreditCard, Info, Eye,
  ExternalLink, Wrench
} from "lucide-react";
import { useState } from "react";

interface AfterSalesDetailProps {
  serviceId: number;
  onClose: () => void;
}

const BRAND_LABELS: Record<string, string> = {
  MARKET_SPAS: "Market Spas",
  OTHER_BRAND: "Autre marque",
};

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  NEW: { label: "Nouveau", icon: AlertCircle, color: "bg-gray-100 text-gray-800" },
  ANALYZING: { label: "En analyse", icon: Eye, color: "bg-blue-100 text-blue-800" },
  INFO_REQUIRED: { label: "Infos requises", icon: Info, color: "bg-yellow-100 text-yellow-800" },
  QUOTE_PENDING: { label: "Devis en attente", icon: CreditCard, color: "bg-orange-100 text-orange-800" },
  PAYMENT_PENDING: { label: "Paiement en attente", icon: CreditCard, color: "bg-red-100 text-red-800" },
  PAYMENT_CONFIRMED: { label: "Paiement confirmé", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  PARTS_ORDERED: { label: "Pièces commandées", icon: Package, color: "bg-indigo-100 text-indigo-800" },
  SHIPPED: { label: "Expédié", icon: Truck, color: "bg-purple-100 text-purple-800" },
  RESOLVED: { label: "Résolu", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  CLOSED: { label: "Fermé", icon: XCircle, color: "bg-gray-100 text-gray-600" },
};

const WARRANTY_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  COVERED: { label: "Sous garantie", icon: ShieldCheck, color: "text-green-700", bgColor: "bg-green-50 border-green-200" },
  PARTIAL: { label: "Garantie partielle", icon: Shield, color: "text-yellow-700", bgColor: "bg-yellow-50 border-yellow-200" },
  EXPIRED: { label: "Garantie expirée", icon: ShieldX, color: "text-red-700", bgColor: "bg-red-50 border-red-200" },
  EXCLUDED: { label: "Hors garantie (exclusion)", icon: ShieldAlert, color: "text-red-700", bgColor: "bg-red-50 border-red-200" },
  REVIEW_NEEDED: { label: "Analyse en cours", icon: Info, color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200" },
};

export default function AfterSalesDetail({ serviceId, onClose }: AfterSalesDetailProps) {
  const [newNote, setNewNote] = useState("");

  const { data: serviceData, isLoading, refetch } = trpc.afterSales.getById.useQuery({ id: serviceId });

  const addNoteMutation = trpc.afterSales.addNote.useMutation({
    onSuccess: () => {
      setNewNote("");
      refetch();
      toast.success("Note ajoutée avec succès");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Payment mutation
  const paymentMutation = trpc.afterSales.createPayment.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank");
        toast.info("Vous allez être redirigé vers la page de paiement par virement SEPA.");
      }
    },
    onError: (error) => {
      toast.error(`Erreur de paiement: ${error.message}`);
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  if (!serviceData) {
    return <div className="p-8 text-center">Ticket SAV introuvable</div>;
  }

  const service = serviceData.service;
  const media = serviceData.media || [];
  const notes = serviceData.notes || [];
  const spareParts = serviceData.spareParts || [];

  const statusConfig = STATUS_CONFIG[service.status] || STATUS_CONFIG.NEW;
  const StatusIcon = statusConfig.icon;

  // Timeline steps based on actual workflow
  const getTimelineSteps = () => {
    const steps = [
      { status: "NEW", label: "Soumis", date: service.createdAt, done: true },
      { status: "ANALYZING", label: "Analyse", date: service.assignedAt, done: ["ANALYZING", "INFO_REQUIRED", "QUOTE_PENDING", "PAYMENT_PENDING", "PAYMENT_CONFIRMED", "PARTS_ORDERED", "SHIPPED", "RESOLVED", "CLOSED"].includes(service.status) },
    ];

    // Add warranty-specific steps
    if (service.warrantyStatus === "EXPIRED" || service.warrantyStatus === "EXCLUDED" || service.warrantyStatus === "PARTIAL") {
      steps.push(
        { status: "PAYMENT", label: "Paiement", date: service.paymentDate, done: ["PAYMENT_CONFIRMED", "PARTS_ORDERED", "SHIPPED", "RESOLVED", "CLOSED"].includes(service.status) }
      );
    }

    steps.push(
      { status: "PARTS", label: "Pièces", date: null, done: ["PARTS_ORDERED", "SHIPPED", "RESOLVED", "CLOSED"].includes(service.status) },
      { status: "SHIPPED", label: "Expédié", date: service.shippedAt, done: ["SHIPPED", "RESOLVED", "CLOSED"].includes(service.status) },
      { status: "RESOLVED", label: "Résolu", date: service.resolvedAt, done: ["RESOLVED", "CLOSED"].includes(service.status) },
    );

    return steps;
  };

  const timelineSteps = getTimelineSteps();

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNoteMutation.mutate({
      id: serviceId,
      note: newNote,
      isInternal: false,
    });
  };

  const handlePayment = () => {
    paymentMutation.mutate({ savId: serviceId });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl text-display text-display font-bold flex items-center gap-2">
            {service.ticketNumber}
            <Badge className={`${statusConfig.color} gap-1`}>
              <StatusIcon className="h-3 w-3" />
              {statusConfig.label}
            </Badge>
          </h2>
          <p className="text-muted-foreground">
            {BRAND_LABELS[service.brand] || service.brand}
            {service.modelName && ` — ${service.modelName}`}
            {" • "}Créé le {new Date(service.createdAt).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={async () => {
            const { generateSAVPDF } = await import("@/components/SAVPDFExport");
            generateSAVPDF(serviceData);
          }}>
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Warranty Status Banner */}
      {service.warrantyStatus && (
        <div className={`border rounded-lg p-4 ${WARRANTY_CONFIG[service.warrantyStatus]?.bgColor || ""}`}>
          <div className="flex items-center gap-2">
            {(() => {
              const config = WARRANTY_CONFIG[service.warrantyStatus];
              const Icon = config?.icon || Info;
              return <Icon className={`h-5 w-5 ${config?.color || ""}`} />;
            })()}
            <span className={`font-semibold text-lg ${WARRANTY_CONFIG[service.warrantyStatus]?.color || ""}`}>
              {WARRANTY_CONFIG[service.warrantyStatus]?.label || service.warrantyStatus}
            </span>
            {service.warrantyPercentage > 0 && service.warrantyPercentage < 100 && (
              <Badge variant="secondary">{service.warrantyPercentage}% couvert</Badge>
            )}
          </div>
          {service.warrantyDetails && (
            <p className="text-sm mt-1">{service.warrantyDetails}</p>
          )}
          {service.adminWarrantyNotes && (
            <p className="text-sm mt-2 italic border-t pt-2">
              <strong>Note de l'administrateur :</strong> {service.adminWarrantyNotes}
            </p>
          )}
        </div>
      )}

      {/* Payment Required Banner */}
      {(service.status === "PAYMENT_PENDING" || service.status === "QUOTE_PENDING") && service.totalAmount && (
        <Card className="border-2 border-orange-300 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                  {service.status === "QUOTE_PENDING" ? "Devis en attente de validation" : "Paiement requis"}
                </h3>
                <div className="mt-2 space-y-1 text-sm">
                  {spareParts.length > 0 && (
                    <div>
                      <strong>Pièces :</strong>
                      <ul className="ml-4 mt-1">
                        {spareParts.map((sp: any, i: number) => (
                          <li key={i} className="flex justify-between max-w-md">
                            <span>{sp.sparePart?.name || "Pièce"} x{sp.quantity}</span>
                            <span className="font-medium">{((sp.unitPrice || 0) * sp.quantity / 100).toFixed(2)} €</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {service.shippingCost > 0 && (
                    <p><strong>Frais de livraison :</strong> {(service.shippingCost / 100).toFixed(2)} €</p>
                  )}
                  <p className="text-base font-semibold text-display mt-2">
                    Total : {(service.totalAmount / 100).toFixed(2)} € TTC
                  </p>
                </div>
              </div>
              {service.status === "PAYMENT_PENDING" && (
                <Button size="lg" onClick={handlePayment} disabled={paymentMutation.isPending} className="bg-orange-600 hover:bg-orange-700">
                  <CreditCard className="mr-2 h-5 w-5" />
                  {paymentMutation.isPending ? "Redirection..." : "Payer maintenant"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipping / Tracking Banner */}
      {service.trackingNumber && (
        <Card className="border-2 border-indigo-300 bg-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5 text-indigo-600" />
                  Colis expédié
                </h3>
                <p className="text-sm mt-1">
                  <strong>Numéro de suivi :</strong> {service.trackingNumber}
                </p>
                {service.shippingCarrier && (
                  <p className="text-sm"><strong>Transporteur :</strong> {service.shippingCarrier}</p>
                )}
                {service.shippedAt && (
                  <p className="text-sm"><strong>Date d'expédition :</strong> {new Date(service.shippedAt).toLocaleDateString("fr-FR")}</p>
                )}
              </div>
              {service.trackingUrl && (
                <Button variant="outline" onClick={() => window.open(service.trackingUrl, "_blank")}>
                  <ExternalLink className="mr-2 h-4 w-4" /> Suivre le colis
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warranty Covered Success Banner */}
      {service.warrantyStatus === "COVERED" && ["PARTS_ORDERED", "SHIPPED", "RESOLVED"].includes(service.status) && (
        <Card className="border-2 border-green-300 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-lg text-green-800">Prise en charge sous garantie</h3>
                <p className="text-sm text-green-700">
                  Votre demande est prise en charge intégralement sous garantie. Les pièces de remplacement vont être / ont été envoyées gratuitement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progression</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between relative">
            {timelineSteps.map((step, index) => (
              <div key={step.status} className="flex flex-col items-center flex-1 relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {step.done ? "✓" : index + 1}
                </div>
                <p className="text-xs mt-2 text-center font-medium">{step.label}</p>
                {step.date && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(step.date).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product & Problem Details */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4" /> Produit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><strong>Marque :</strong> {BRAND_LABELS[service.brand] || service.brand || "-"}</div>
            {service.productLine && <div><strong>Gamme :</strong> {service.productLine}</div>}
            {service.modelName && <div><strong>Modèle :</strong> {service.modelName}</div>}
            <div><strong>N° de série :</strong> {service.serialNumber}</div>
            {service.purchaseDate && <div><strong>Date d'achat :</strong> {new Date(service.purchaseDate).toLocaleDateString("fr-FR")}</div>}
            {service.deliveryDate && <div><strong>Date de livraison :</strong> {new Date(service.deliveryDate).toLocaleDateString("fr-FR")}</div>}
            {service.usageType && (
              <div><strong>Usage :</strong> {service.usageType === "PRIVATE" ? "Privé" : service.usageType === "COMMERCIAL" ? "Commercial" : "Location saisonnière"}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Problème
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {service.component && <div><strong>Composant :</strong> {service.component}</div>}
            {service.defectType && <div><strong>Type de défaut :</strong> {service.defectType}</div>}
            <div><strong>Urgence :</strong> {service.urgency === "CRITICAL" ? "Critique" : service.urgency === "URGENT" ? "Urgente" : "Normale"}</div>
            <div className="pt-2">
              <strong>Description :</strong>
              <p className="mt-1 text-muted-foreground">{service.description}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Info */}
      {service.customerName && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client final</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div><strong>Nom :</strong> {service.customerName}</div>
            {service.customerPhone && <div><strong>Téléphone :</strong> {service.customerPhone}</div>}
            {service.customerEmail && <div><strong>Email :</strong> {service.customerEmail}</div>}
            {service.customerAddress && <div><strong>Adresse :</strong> {service.customerAddress}</div>}
            {service.installationDate && <div><strong>Date d'installation :</strong> {new Date(service.installationDate).toLocaleDateString("fr-FR")}</div>}
          </CardContent>
        </Card>
      )}

      {/* Spare Parts */}
      {spareParts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" /> Pièces détachées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Pièce</th>
                  <th className="text-left py-2">Référence</th>
                  <th className="text-center py-2">Qté</th>
                  <th className="text-right py-2">Prix unit.</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {spareParts.map((sp: any, i: number) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2">{sp.sparePart?.name || "Pièce"}</td>
                    <td className="py-2 text-muted-foreground font-mono">{sp.sparePart?.ean13 || sp.sparePart?.supplierProductCode || sp.sparePart?.sku || "-"}</td>
                    <td className="py-2 text-center">{sp.quantity}</td>
                    <td className="py-2 text-right">{sp.unitPrice ? `${(sp.unitPrice / 100).toFixed(2)} €` : "-"}</td>
                    <td className="py-2 text-right font-medium">
                      {sp.unitPrice ? `${((sp.unitPrice * sp.quantity) / 100).toFixed(2)} €` : "Gratuit"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Media */}
      {media.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Photos et vidéos ({media.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {media.map((item: any) => (
                <div key={item.id} className="relative">
                  {item.mediaType === "IMAGE" ? (
                    <a href={item.mediaUrl} target="_blank" rel="noopener noreferrer">
                      <img src={item.mediaUrl} alt={item.description || "Photo"} className="w-full h-28 object-cover rounded cursor-pointer hover:opacity-80 border" />
                    </a>
                  ) : (
                    <video src={item.mediaUrl} controls className="w-full h-28 object-cover rounded border" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes & Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Échanges ({notes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notes.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Aucun échange pour le moment</p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {notes.map((noteItem: any) => {
                const note = noteItem.note;
                const noteUser = noteItem.user;
                const isAdmin = note.isInternal;
                return (
                  <div key={note.id} className={`rounded-lg p-3 ${isAdmin ? "bg-blue-50 border-l-4 border-blue-400" : "bg-gray-50 border-l-4 border-gray-300"}`}>
                    <div className="flex justify-between items-start mb-1">
                      <strong className="text-sm">{noteUser?.name || "Utilisateur"}</strong>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.createdAt).toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <p className="text-sm">{note.note}</p>
                    {isAdmin && <Badge variant="secondary" className="mt-1 text-xs">Admin</Badge>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add note */}
          <div className="border-t pt-4 space-y-2">
            <Label htmlFor="newNote">Ajouter un message</Label>
            <Textarea
              id="newNote"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Ajoutez un commentaire, une question ou des informations supplémentaires..."
              rows={3}
            />
            <Button onClick={handleAddNote} disabled={!newNote.trim() || addNoteMutation.isPending}>
              {addNoteMutation.isPending ? "Envoi..." : "Envoyer"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>Fermer</Button>
      </div>
    </div>
  );
}
