import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Clock, CheckCircle, XCircle, Package, MessageSquare, Download } from "lucide-react";
import { generateSAVPDF } from "@/components/SAVPDFExport";
import { useState } from "react";

interface AfterSalesDetailProps {
  serviceId: number;
  onClose: () => void;
}

export default function AfterSalesDetail({ serviceId, onClose }: AfterSalesDetailProps) {
  const [newNote, setNewNote] = useState("");

  const { data: serviceData, isLoading, refetch } = trpc.afterSales.getById.useQuery({ id: serviceId });

  const addNoteMutation = trpc.afterSales.addNote.useMutation({
    onSuccess: () => {
      setNewNote("");
      refetch();
      alert("Note ajoutée avec succès");
    },
    onError: (error) => {
      alert(`Erreur: ${error.message}`);
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      NEW: { variant: "default", icon: AlertCircle },
      IN_PROGRESS: { variant: "default", icon: Clock },
      WAITING_PARTS: { variant: "secondary", icon: Package },
      RESOLVED: { variant: "outline", icon: CheckCircle },
      CLOSED: { variant: "outline", icon: XCircle },
    };
    const config = variants[status] || variants.NEW;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status === "NEW" && "Nouveau"}
        {status === "IN_PROGRESS" && "En cours"}
        {status === "WAITING_PARTS" && "Attente pièces"}
        {status === "RESOLVED" && "Résolu"}
        {status === "CLOSED" && "Fermé"}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    if (urgency === "CRITICAL") return <Badge variant="destructive">Critique</Badge>;
    if (urgency === "URGENT") return <Badge className="bg-orange-500">Urgent</Badge>;
    return <Badge variant="secondary">Normal</Badge>;
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNoteMutation.mutate({
      id: serviceId,
      note: newNote,
      isInternal: false,
    });
  };

  // Timeline steps
  const timelineSteps = [
    { status: "NEW", label: "Nouveau", date: service.createdAt },
    { status: "IN_PROGRESS", label: "En cours", date: service.assignedAt },
    { status: "WAITING_PARTS", label: "Attente pièces", date: null },
    { status: "RESOLVED", label: "Résolu", date: service.resolvedAt },
    { status: "CLOSED", label: "Fermé", date: service.closedAt },
  ];

  const currentStepIndex = timelineSteps.findIndex((step) => step.status === service.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{service.ticketNumber}</h2>
          <p className="text-muted-foreground">
            Créé le {new Date(service.createdAt).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateSAVPDF(serviceData)}
          >
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          {getStatusBadge(service.status)}
          {getUrgencyBadge(service.urgency)}
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Statut</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {timelineSteps.map((step, index) => (
              <div key={step.status} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index <= currentStepIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index < currentStepIndex ? "✓" : index + 1}
                </div>
                <p className="text-xs mt-2 text-center">{step.label}</p>
                {step.date && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(step.date).toLocaleDateString("fr-FR")}
                  </p>
                )}
                {index < timelineSteps.length - 1 && (
                  <div
                    className={`h-0.5 w-full absolute top-4 left-1/2 ${
                      index < currentStepIndex ? "bg-primary" : "bg-muted"
                    }`}
                    style={{ zIndex: -1 }}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle>Détails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <strong>Numéro de série:</strong> {service.serialNumber}
          </div>
          <div>
            <strong>Type de problème:</strong>{" "}
            {service.issueType === "TECHNICAL" && "Technique"}
            {service.issueType === "LEAK" && "Fuite"}
            {service.issueType === "ELECTRICAL" && "Électrique"}
            {service.issueType === "HEATING" && "Chauffage"}
            {service.issueType === "JETS" && "Jets"}
            {service.issueType === "CONTROL_PANEL" && "Panneau de contrôle"}
            {service.issueType === "OTHER" && "Autre"}
          </div>
          <div>
            <strong>Description:</strong>
            <p className="mt-1 text-muted-foreground">{service.description}</p>
          </div>
          {service.customerName && (
            <div>
              <strong>Client:</strong> {service.customerName}
              {service.customerPhone && ` • ${service.customerPhone}`}
              {service.customerEmail && ` • ${service.customerEmail}`}
            </div>
          )}
          {service.customerAddress && (
            <div>
              <strong>Adresse:</strong> {service.customerAddress}
            </div>
          )}
          {service.installationDate && (
            <div>
              <strong>Date d'installation:</strong>{" "}
              {new Date(service.installationDate).toLocaleDateString("fr-FR")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media */}
      {media.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Photos et vidéos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {media.map((item) => (
                <div key={item.id} className="relative">
                  {item.mediaType === "IMAGE" ? (
                    <a href={item.mediaUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={item.mediaUrl}
                        alt={item.description || "Photo"}
                        className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                      />
                    </a>
                  ) : (
                    <video src={item.mediaUrl} controls className="w-full h-32 object-cover rounded" />
                  )}
                  {item.description && <p className="text-xs mt-1 text-muted-foreground">{item.description}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notes et échanges
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notes.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Aucune note pour le moment</p>
          ) : (
            notes.map((noteItem) => {
              const note = noteItem.note;
              const user = noteItem.user;
              return (
                <div key={note.id} className="border-l-2 border-primary pl-4 py-2">
                  <div className="flex justify-between items-start mb-1">
                    <strong>{user?.name || "Utilisateur"}</strong>
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.createdAt).toLocaleString("fr-FR")}
                    </span>
                  </div>
                  <p className="text-sm">{note.note}</p>
                  {note.isInternal && <Badge variant="secondary" className="mt-1">Note interne</Badge>}
                </div>
              );
            })
          )}

          {/* Add note */}
          <div className="border-t pt-4 space-y-2">
            <Label htmlFor="newNote">Ajouter une note</Label>
            <Textarea
              id="newNote"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Ajoutez un commentaire ou une question..."
              rows={3}
            />
            <Button onClick={handleAddNote} disabled={!newNote.trim() || addNoteMutation.isPending}>
              {addNoteMutation.isPending ? "Envoi..." : "Ajouter la note"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </div>
  );
}
