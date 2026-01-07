import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, AlertCircle, Clock, CheckCircle, XCircle, Package, ArrowLeft, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AfterSalesDetail from "@/components/AfterSalesDetail";


export default function AfterSales() {
  const { data: user } = trpc.auth.me.useQuery();
  const { data: partners } = trpc.partners.list.useQuery({});
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [customerNameFilter, setCustomerNameFilter] = useState<string>("");
  const [orderBy, setOrderBy] = useState<string>("createdAt");
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("desc");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const toast = (opts: { title: string; description: string; variant?: string }) => {
    alert(`${opts.title}: ${opts.description}`);
  };

  // Handle sort
  const handleSort = (column: string) => {
    if (orderBy === column) {
      setOrderDirection(orderDirection === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(column);
      setOrderDirection("desc");
    }
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setUrgencyFilter("all");
    setDateFrom("");
    setDateTo("");
    setCustomerNameFilter("");
    setOrderBy("createdAt");
    setOrderDirection("desc");
  };

  // Fetch SAV list
  const { data: services, isLoading, refetch } = trpc.afterSales.list.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    urgency: urgencyFilter !== "all" ? urgencyFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    customerName: customerNameFilter || undefined,
    orderBy,
    orderDirection,
  });

  // Create SAV mutation
  const createMutation = trpc.afterSales.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Demande SAV créée",
        description: "Votre demande a été enregistrée avec succès.",
      });
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    serialNumber: "",
    issueType: "TECHNICAL" as const,
    description: "",
    urgency: "NORMAL" as const,
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    installationDate: "",
  });

  const [mediaFiles, setMediaFiles] = useState<Array<{ file: File; type: "IMAGE" | "VIDEO"; preview: string }>>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newMedia = files.map((file) => ({
      file,
      type: file.type.startsWith("video/") ? ("VIDEO" as const) : ("IMAGE" as const),
      preview: URL.createObjectURL(file),
    }));
    setMediaFiles([...mediaFiles, ...newMedia]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert files to base64
    const mediaPromises = mediaFiles.map(async (media) => {
      return new Promise<{ base64: string; mimeType: string; type: "IMAGE" | "VIDEO" }>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve({
            base64,
            mimeType: media.file.type,
            type: media.type,
          });
        };
        reader.readAsDataURL(media.file);
      });
    });

    const mediaData = await Promise.all(mediaPromises);

    createMutation.mutate({
      ...formData,
      media: mediaData.length > 0 ? mediaData : undefined,
      partnerId: selectedPartnerId || undefined,
    });
  };

  // Filter services
  const filteredServices = (services || []).filter((s) => {
    const service = s.service;
    const matchesSearch =
      searchQuery === "" ||
      service.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Service Après-Vente</h1>
            <p className="text-muted-foreground">Gérez vos demandes de SAV</p>
          </div>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle demande SAV
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer une demande de SAV</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Numéro de série *</Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issueType">Type de problème *</Label>
                  <Select
                    value={formData.issueType}
                    onValueChange={(value: any) => setFormData({ ...formData, issueType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TECHNICAL">Technique</SelectItem>
                      <SelectItem value="LEAK">Fuite</SelectItem>
                      <SelectItem value="ELECTRICAL">Électrique</SelectItem>
                      <SelectItem value="HEATING">Chauffage</SelectItem>
                      <SelectItem value="JETS">Jets</SelectItem>
                      <SelectItem value="CONTROL_PANEL">Panneau de contrôle</SelectItem>
                      <SelectItem value="OTHER">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description du problème *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                  minLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Urgence</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value: any) => setFormData({ ...formData, urgency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">Normale</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                    <SelectItem value="CRITICAL">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Informations client</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Nom du client</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Téléphone</Label>
                    <Input
                      id="customerPhone"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="installationDate">Date d'installation</Label>
                    <Input
                      id="installationDate"
                      type="date"
                      value={formData.installationDate}
                      onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="customerAddress">Adresse</Label>
                  <Textarea
                    id="customerAddress"
                    value={formData.customerAddress}
                    onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Photos et vidéos</h3>
                <Input type="file" accept="image/*,video/*" multiple onChange={handleFileUpload} />
                {mediaFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {mediaFiles.map((media, index) => (
                      <div key={index} className="relative">
                        {media.type === "IMAGE" ? (
                          <img src={media.preview} alt="Preview" className="w-full h-24 object-cover rounded" />
                        ) : (
                          <video src={media.preview} className="w-full h-24 object-cover rounded" />
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1"
                          onClick={() => setMediaFiles(mediaFiles.filter((_, i) => i !== index))}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Création..." : "Créer la demande"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par numéro de ticket, numéro de série..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="NEW">Nouveau</SelectItem>
                  <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                  <SelectItem value="WAITING_PARTS">Attente pièces</SelectItem>
                  <SelectItem value="RESOLVED">Résolu</SelectItem>
                  <SelectItem value="CLOSED">Fermé</SelectItem>
                </SelectContent>
              </Select>

              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Urgence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les urgences</SelectItem>
                  <SelectItem value="NORMAL">Normale</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                  <SelectItem value="CRITICAL">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtres avancés */}
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Nom du client..."
                  value={customerNameFilter}
                  onChange={(e) => setCustomerNameFilter(e.target.value)}
                />
              </div>
              <div className="w-48">
                <Input
                  type="date"
                  placeholder="Date de début"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="w-48">
                <Input
                  type="date"
                  placeholder="Date de fin"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sort Headers */}
      {!isLoading && filteredServices.length > 0 && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center text-sm font-medium">
              <button
                onClick={() => handleSort("createdAt")}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                Date de création
                {orderBy === "createdAt" ? (
                  orderDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                ) : (
                  <ArrowUpDown className="h-4 w-4 opacity-50" />
                )}
              </button>
              <button
                onClick={() => handleSort("status")}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                Statut
                {orderBy === "status" ? (
                  orderDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                ) : (
                  <ArrowUpDown className="h-4 w-4 opacity-50" />
                )}
              </button>
              <button
                onClick={() => handleSort("urgency")}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                Urgence
                {orderBy === "urgency" ? (
                  orderDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                ) : (
                  <ArrowUpDown className="h-4 w-4 opacity-50" />
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SAV List */}
      {isLoading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : filteredServices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Aucune demande de SAV trouvée</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredServices.map((item) => {
            const service = item.service;
            return (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{service.ticketNumber}</CardTitle>
                      <CardDescription>
                        Numéro de série: {service.serialNumber} • Créé le{" "}
                        {new Date(service.createdAt).toLocaleDateString("fr-FR")}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(service.status)}
                      {getUrgencyBadge(service.urgency)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mb-3"
                    onClick={() => setSelectedServiceId(service.id)}
                  >
                    Voir les détails
                  </Button>
                  <p className="text-sm mb-2">
                    <strong>Type:</strong>{" "}
                    {service.issueType === "TECHNICAL" && "Technique"}
                    {service.issueType === "LEAK" && "Fuite"}
                    {service.issueType === "ELECTRICAL" && "Électrique"}
                    {service.issueType === "HEATING" && "Chauffage"}
                    {service.issueType === "JETS" && "Jets"}
                    {service.issueType === "CONTROL_PANEL" && "Panneau de contrôle"}
                    {service.issueType === "OTHER" && "Autre"}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                  {service.customerName && (
                    <p className="text-sm mt-2">
                      <strong>Client:</strong> {service.customerName}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      {selectedServiceId && (
        <Dialog open={!!selectedServiceId} onOpenChange={() => setSelectedServiceId(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <AfterSalesDetail serviceId={selectedServiceId} onClose={() => setSelectedServiceId(null)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
