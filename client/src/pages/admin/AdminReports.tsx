import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useSafeQuery } from "@/hooks/useSafeQuery";
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  Calendar,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

type ReportType = "orders" | "products" | "partners" | "sales";

export default function AdminReports() {
  const [reportType, setReportType] = useState<ReportType>("orders");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Fetch data based on report type
  const { data: ordersData } = trpc.orders.list.useQuery(
    { limit: 1000 },
    { enabled: reportType === "orders" || reportType === "sales" }
  );
  const ordersDataSafe = useSafeQuery(ordersData);

  const { data: productsData } = trpc.products.list.useQuery(
    { limit: 1000 },
    { enabled: reportType === "products" }
  );
  const productsDataSafe = useSafeQuery(productsData);

  const { data: partnersData } = trpc.admin.partners.list.useQuery(
    {},
    { enabled: reportType === "partners" }
  );
  const partnersDataSafe = useSafeQuery(partnersData);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("fr-FR");
  };

  const formatPrice = (price: number | string | null) => {
    if (price === null || price === undefined) return "0.00";
    return Number(price).toFixed(2);
  };

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(";"),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] ?? "";
          // Escape quotes and wrap in quotes if contains special chars
          const stringValue = String(value);
          if (stringValue.includes(";") || stringValue.includes('"') || stringValue.includes("\n")) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(";")
      )
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const handleExport = async (format: "csv" | "excel") => {
    setIsExporting(true);
    
    try {
      let data: any[] = [];
      let headers: string[] = [];
      let filename = "";

      switch (reportType) {
        case "orders":
          data = (ordersData || []).map((order: any) => ({
            "Numéro": order.orderNumber,
            "Date": formatDate(order.createdAt),
            "Partenaire": order.partner?.companyName || "N/A",
            "Statut": order.status,
            "Total HT": formatPrice(order.totalHT),
            "TVA": formatPrice(order.totalVAT),
            "Total TTC": formatPrice(order.totalTTC),
            "Acompte": formatPrice(order.depositAmount),
            "Acompte payé": order.depositPaid ? "Oui" : "Non",
          }));
          headers = ["Numéro", "Date", "Partenaire", "Statut", "Total HT", "TVA", "Total TTC", "Acompte", "Acompte payé"];
          filename = "rapport_commandes";
          break;

        case "products":
          data = (productsData || []).map((product: any) => ({
            "SKU": product.sku,
            "Nom": product.name,
            "Catégorie": product.category?.name || "N/A",
            "Prix Public HT": formatPrice(product.pricePublicHT),
            "Prix Partenaire HT": formatPrice(product.pricePartnerHT),
            "Stock": product.stockQuantity || 0,
            "Actif": product.isActive ? "Oui" : "Non",
          }));
          headers = ["SKU", "Nom", "Catégorie", "Prix Public HT", "Prix Partenaire HT", "Stock", "Actif"];
          filename = "rapport_produits";
          break;

        case "partners":
          data = (partnersData || []).map((partner: any) => ({
            "Entreprise": partner.companyName,
            "Contact": partner.contactName || "N/A",
            "Email": partner.contactEmail || "N/A",
            "Téléphone": partner.contactPhone || "N/A",
            "TVA": partner.vatNumber || "N/A",
            "Niveau": partner.partnerLevel || "Bronze",
            "Statut": partner.status,
            "Remise %": partner.discountPercent || 0,
            "Total commandes": partner.totalOrders || 0,
            "Date inscription": formatDate(partner.createdAt),
          }));
          headers = ["Entreprise", "Contact", "Email", "Téléphone", "TVA", "Niveau", "Statut", "Remise %", "Total commandes", "Date inscription"];
          filename = "rapport_partenaires";
          break;

        case "sales":
          // Group orders by month for sales report
          const salesByMonth: Record<string, { month: string; orders: number; totalHT: number; totalTTC: number }> = {};
          (ordersData || []).forEach((order: any) => {
            if (order.status === "CANCELLED") return;
            const date = new Date(order.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            const monthLabel = date.toLocaleDateString("fr-FR", { year: "numeric", month: "long" });
            
            if (!salesByMonth[monthKey]) {
              salesByMonth[monthKey] = { month: monthLabel, orders: 0, totalHT: 0, totalTTC: 0 };
            }
            salesByMonth[monthKey].orders += 1;
            salesByMonth[monthKey].totalHT += Number(order.totalHT || 0);
            salesByMonth[monthKey].totalTTC += Number(order.totalTTC || 0);
          });

          data = Object.values(salesByMonth)
            .sort((a, b) => a.month.localeCompare(b.month))
            .map(item => ({
              "Mois": item.month,
              "Nombre commandes": item.orders,
              "Total HT": formatPrice(item.totalHT),
              "Total TTC": formatPrice(item.totalTTC),
            }));
          headers = ["Mois", "Nombre commandes", "Total HT", "Total TTC"];
          filename = "rapport_ventes";
          break;
      }

      if (data.length === 0) {
        toast.error("Aucune donnée à exporter");
        return;
      }

      if (format === "csv") {
        exportToCSV(data, filename, headers);
        toast.success(`Rapport ${filename} exporté avec succès`);
      } else {
        // For Excel, we'll use CSV with .xlsx extension (basic compatibility)
        exportToCSV(data, filename.replace(".csv", ".xlsx"), headers);
        toast.success(`Rapport ${filename} exporté avec succès`);
      }
    } catch (error) {
      toast.error("Erreur lors de l'export du rapport");
    } finally {
      setIsExporting(false);
    }
  };

  const reportTypes = [
    { value: "orders", label: "Commandes", icon: ShoppingCart, description: "Liste de toutes les commandes" },
    { value: "products", label: "Produits", icon: Package, description: "Inventaire complet des produits" },
    { value: "partners", label: "Partenaires", icon: Users, description: "Liste des partenaires et contacts" },
    { value: "sales", label: "Ventes", icon: TrendingUp, description: "Analyse des ventes par période" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Rapports & Exports</h1>
          <p className="text-muted-foreground mt-1">
            Générez et exportez des rapports détaillés
          </p>
        </div>

        {/* Report Type Selection */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {reportTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.value}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  reportType === type.value ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setReportType(type.value as ReportType)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${
                      reportType === type.value ? "bg-primary text-white" : "bg-muted"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-lg">{type.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Options d'export
            </CardTitle>
            <CardDescription>
              Configurez les paramètres de votre rapport
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Range (optional) */}
            <div className="grid gap-4 md:grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Date de début (optionnel)</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">Date de fin (optionnel)</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => handleExport("csv")}
                disabled={isExporting}
                className="gap-2"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                Exporter en CSV
              </Button>
              <Button
                onClick={() => handleExport("excel")}
                disabled={isExporting}
                variant="outline"
                className="gap-2"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
                Exporter en Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Aperçu des données</CardTitle>
            <CardDescription>
              {reportType === "orders" && `${ordersData?.length || 0} commandes`}
              {reportType === "products" && `${productsData?.length || 0} produits`}
              {reportType === "partners" && `${partnersData?.length || 0} partenaires`}
              {reportType === "sales" && `Analyse des ventes`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {reportType === "orders" && ordersData && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Numéro</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Statut</th>
                      <th className="text-right p-2">Total TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersData.slice(0, 10).map((order: any) => (
                      <tr key={order.id} className="border-b">
                        <td className="p-2 font-mono">{order.orderNumber}</td>
                        <td className="p-2">{formatDate(order.createdAt)}</td>
                        <td className="p-2">{order.status}</td>
                        <td className="p-2 text-right">{formatPrice(order.totalTTC)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {reportType === "products" && productsData && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">SKU</th>
                      <th className="text-left p-2">Nom</th>
                      <th className="text-right p-2">Prix HT</th>
                      <th className="text-right p-2">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsData.slice(0, 10).map((product: any) => (
                      <tr key={product.id} className="border-b">
                        <td className="p-2 font-mono">{product.sku}</td>
                        <td className="p-2">{product.name}</td>
                        <td className="p-2 text-right">{formatPrice(product.pricePartnerHT)} €</td>
                        <td className="p-2 text-right">{product.stockQuantity || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {reportType === "partners" && partnersData && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Entreprise</th>
                      <th className="text-left p-2">Contact</th>
                      <th className="text-left p-2">Niveau</th>
                      <th className="text-left p-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partnersData.slice(0, 10).map((partner: any) => (
                      <tr key={partner.id} className="border-b">
                        <td className="p-2">{partner.companyName}</td>
                        <td className="p-2">{partner.contactEmail || "N/A"}</td>
                        <td className="p-2">{partner.partnerLevel || "Bronze"}</td>
                        <td className="p-2">{partner.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {reportType === "sales" && (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>L'analyse des ventes sera générée lors de l'export</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
