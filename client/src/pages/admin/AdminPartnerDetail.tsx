import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Euro,
  Users,
  Award,
  Globe,
  FileText,
  Package,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Edit,
  CreditCard,
  Truck,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvé",
  SUSPENDED: "Suspendu",
  TERMINATED: "Résilié",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  TERMINATED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const levelColors: Record<string, string> = {
  BRONZE: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  SILVER: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
  GOLD: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  PLATINUM: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  VIP: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

const orderStatusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  PENDING_DEPOSIT: "En attente d'acompte",
  DEPOSIT_PAID: "Acompte payé",
  IN_PRODUCTION: "En production",
  SHIPPED: "Expédié",
  DELIVERED: "Livré",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
  REFUNDED: "Remboursé",
};

export default function AdminPartnerDetail() {
  const [, params] = useRoute("/admin/partners/:id");
  const [, navigate] = useLocation();
  const partnerId = params?.id ? parseInt(params.id) : 0;

  const { data: partner, isLoading } = trpc.partners.getById.useQuery(
    { id: partnerId },
    { enabled: partnerId > 0 }
  );

  const { data: orders } = trpc.orders.list.useQuery(
    { partnerId: partnerId, limit: 20 },
    { enabled: partnerId > 0 }
  );

  const { data: productDiscounts } = trpc.admin.partners.getProductDiscounts.useQuery(
    { partnerId: partnerId },
    { enabled: partnerId > 0 }
  );

  const approveMutation = trpc.admin.partners.approve.useMutation({
    onSuccess: () => {
      toast.success("Partenaire approuvé");
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!partner) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Partenaire introuvable</h2>
          <p className="text-muted-foreground mb-4">Le partenaire #{partnerId} n'existe pas ou a été supprimé.</p>
          <Button variant="outline" onClick={() => navigate("/admin/partners")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la liste
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: string | number | null | undefined) => {
    if (!amount) return "0,00 €";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return num.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/partners")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{partner.companyName}</h1>
                <Badge className={statusColors[partner.status] || ""}>
                  {statusLabels[partner.status] || partner.status}
                </Badge>
                <Badge className={levelColors[partner.level] || ""}>
                  <Award className="w-3 h-3 mr-1" />
                  {partner.level}
                </Badge>
              </div>
              {partner.tradeName && (
                <p className="text-muted-foreground text-sm mt-1">{partner.tradeName}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {partner.status === "PENDING" && (
              <Button
                onClick={() => approveMutation.mutate({ id: partnerId })}
                disabled={approveMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approuver
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/admin/partners")}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Package className="w-4 h-4" />
                Commandes
              </div>
              <p className="text-2xl font-bold">{partner.totalOrders || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Euro className="w-4 h-4" />
                Chiffre d'affaires
              </div>
              <p className="text-2xl font-bold">{formatCurrency(partner.totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                Remise globale
              </div>
              <p className="text-2xl font-bold text-emerald-600">{partner.discountPercent || 0}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <CreditCard className="w-4 h-4" />
                Crédit utilisé
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(partner.creditUsed)}
                <span className="text-sm font-normal text-muted-foreground"> / {formatCurrency(partner.creditLimit)}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main content grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Informations société */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5" />
                Informations société
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Forme juridique</p>
                  <p className="font-medium">{partner.legalForm || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">N° TVA</p>
                  <p className="font-medium">{partner.vatNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">N° d'entreprise</p>
                  <p className="font-medium">{partner.registrationNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Site web</p>
                  {partner.website ? (
                    <a href={partner.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {partner.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    <p className="font-medium">—</p>
                  )}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground text-sm mb-1">Stripe Customer ID</p>
                <p className="font-mono text-xs">{partner.stripeCustomerId || "Non lié"}</p>
              </div>
              {partner.internalNotes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">Notes internes</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{partner.internalNotes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" />
                Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold text-sm mb-2">Contact principal</p>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    {partner.primaryContactName}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${partner.primaryContactEmail}`} className="text-blue-600 hover:underline">
                      {partner.primaryContactEmail}
                    </a>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${partner.primaryContactPhone}`} className="hover:underline">
                      {partner.primaryContactPhone}
                    </a>
                  </p>
                </div>
              </div>
              {(partner.accountingEmail || partner.orderEmail) && (
                <>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    {partner.accountingEmail && (
                      <div>
                        <p className="text-muted-foreground">Email comptabilité</p>
                        <a href={`mailto:${partner.accountingEmail}`} className="text-blue-600 hover:underline">
                          {partner.accountingEmail}
                        </a>
                      </div>
                    )}
                    {partner.orderEmail && (
                      <div>
                        <p className="text-muted-foreground">Email commandes</p>
                        <a href={`mailto:${partner.orderEmail}`} className="text-blue-600 hover:underline">
                          {partner.orderEmail}
                        </a>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Adresses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5" />
                Adresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold text-sm mb-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Adresse principale
                </p>
                <p className="text-sm">
                  {partner.addressStreet}
                  {partner.addressStreet2 && <><br />{partner.addressStreet2}</>}
                  <br />
                  {partner.addressPostalCode} {partner.addressCity}
                  <br />
                  {partner.addressCountry}
                </p>
              </div>
              {!partner.billingAddressSame && partner.billingStreet && (
                <>
                  <Separator />
                  <div>
                    <p className="font-semibold text-sm mb-1 flex items-center gap-1">
                      <Receipt className="w-3 h-3" /> Adresse de facturation
                    </p>
                    <p className="text-sm">
                      {partner.billingStreet}
                      {partner.billingStreet2 && <><br />{partner.billingStreet2}</>}
                      <br />
                      {partner.billingPostalCode} {partner.billingCity}
                      <br />
                      {partner.billingCountry}
                    </p>
                  </div>
                </>
              )}
              {partner.deliveryStreet && (
                <>
                  <Separator />
                  <div>
                    <p className="font-semibold text-sm mb-1 flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Adresse de livraison par défaut
                    </p>
                    <p className="text-sm">
                      {partner.deliveryStreet}
                      {partner.deliveryStreet2 && <><br />{partner.deliveryStreet2}</>}
                      <br />
                      {partner.deliveryPostalCode} {partner.deliveryCity}
                      <br />
                      {partner.deliveryCountry}
                    </p>
                    {partner.deliveryInstructions && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {partner.deliveryInstructions}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Conditions commerciales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="w-5 h-5" />
                Conditions commerciales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Niveau</p>
                  <Badge className={levelColors[partner.level] || ""}>
                    <Award className="w-3 h-3 mr-1" />
                    {partner.level}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Remise globale</p>
                  <p className="font-bold text-lg text-emerald-600">{partner.discountPercent || 0}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Délai de paiement</p>
                  <p className="font-medium">{partner.paymentTermsDays || 30} jours</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Limite de crédit</p>
                  <p className="font-medium">{formatCurrency(partner.creditLimit)}</p>
                </div>
              </div>
              {productDiscounts && productDiscounts.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="font-semibold text-sm mb-2">Remises par produit ({productDiscounts.length})</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {productDiscounts.map((d: any) => (
                        <div key={d.productId} className="flex justify-between text-sm py-1 border-b border-muted/50 last:border-0">
                          <span className="text-muted-foreground">Produit #{d.productId}</span>
                          <span className="font-medium text-emerald-600">{d.discountPercent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Langue</p>
                  <p className="font-medium">{partner.preferredLanguage === "fr" ? "Français" : partner.preferredLanguage}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Devise</p>
                  <p className="font-medium">{partner.preferredCurrency || "EUR"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Newsletter</p>
                  <p className="font-medium">{partner.newsletterOptIn ? "Oui" : "Non"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dernière commande</p>
                  <p className="font-medium">{formatDate(partner.lastOrderAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dates */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Créé le</span>
                <span className="font-medium">{formatDate(partner.createdAt)}</span>
              </div>
              {partner.approvedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-muted-foreground">Approuvé le</span>
                  <span className="font-medium">{formatDate(partner.approvedAt)}</span>
                </div>
              )}
              {partner.suspendedAt && (
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-muted-foreground">Suspendu le</span>
                  <span className="font-medium">{formatDate(partner.suspendedAt)}</span>
                  {partner.suspendedReason && (
                    <span className="text-xs text-muted-foreground italic">({partner.suspendedReason})</span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Mis à jour le</span>
                <span className="font-medium">{formatDate(partner.updatedAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commandes récentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5" />
              Commandes récentes
            </CardTitle>
            <CardDescription>
              Les 20 dernières commandes de ce partenaire
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders && orders.length > 0 ? (
              <>
                {/* Mobile */}
                <div className="md:hidden space-y-3">
                  {orders.map((order: any) => (
                    <Card
                      key={order.id}
                      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/admin/orders`)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm">#{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {orderStatusLabels[order.status] || order.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium mt-1">{formatCurrency(order.totalTTC)}</p>
                    </Card>
                  ))}
                </div>
                {/* Desktop */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Commande</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Montant TTC</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {orderStatusLabels[order.status] || order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(order.totalTTC)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/order/${order.id}/summary`)}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Voir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucune commande pour ce partenaire</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
