import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSafeQuery, useSafeQueryObject } from "@/hooks/useSafeQuery";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  Calendar,
  Search,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AdminStockForecast() {
  const [weeks, setWeeks] = useState(8);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Fetch summary data
  const { data: summary, isLoading: summaryLoading } = trpc.admin.forecast.getSummary.useQuery({
    weeks,
  });

  // Fetch all forecasts
  const { data: forecasts, isLoading: forecastsLoading } = trpc.admin.forecast.getAll.useQuery({
    weeks,
  });

  // Fetch product detail if selected
  const { data: productForecast } = trpc.admin.forecast.getProduct.useQuery(
    { productId: selectedProductId!, weeks },
    { enabled: !!selectedProductId }
  );
  // productForecast est un objet unique, pas un tableau
  // On ne peut pas utiliser useSafeQuery ici, on garde la logique existante

  // Filter forecasts by search query
  const filteredForecasts = forecasts?.filter(
    (f) =>
      f.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.productSku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Prepare chart data for weekly breakdown
  const weeklyChartData = summary?.weeklyBreakdown.map((week) => ({
    week: week.weekLabel,
    arrivages: week.totalIncoming,
    alertes: week.productsWithAlerts,
  }));

  const handleExport = () => {
    if (!forecasts) return;

    const csv = [
      ["SKU", "Produit", "Stock actuel", ...Array.from({ length: weeks }, (_, i) => `S${i + 1}`)].join(","),
      ...forecasts.map((f) =>
        [
          f.productSku,
          f.productName,
          f.currentStock,
          ...f.weeks.map((w) => w.projectedStock),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `previsions-stock-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (summaryLoading || forecastsLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prévisions de stock</h1>
          <p className="text-muted-foreground mt-1">
            Visualisez l'évolution des stocks sur les {weeks} prochaines semaines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="weeks" className="text-sm">Horizon :</Label>
          <Select value={weeks.toString()} onValueChange={(v) => setWeeks(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">4 semaines</SelectItem>
              <SelectItem value="8">8 semaines</SelectItem>
              <SelectItem value="12">12 semaines</SelectItem>
              <SelectItem value="16">16 semaines</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Produits suivis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arrivages prévus</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalIncomingQuantity || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Unités attendues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits avec alertes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.productsWithAlerts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.productsWithRupture || 0} ruptures prévues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock bas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.productsWithLowStock || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Produits à surveiller</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution hebdomadaire</CardTitle>
          <CardDescription>
            Arrivages programmés et alertes par semaine
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="arrivages" fill="#3b82f6" name="Arrivages" />
              <Bar yAxisId="right" dataKey="alertes" fill="#f59e0b" name="Produits avec alertes" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Product Forecast Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Prévisions par produit</CardTitle>
              <CardDescription>
                Cliquez sur un produit pour voir les détails
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par SKU ou nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">SKU</th>
                  <th className="text-left p-2 font-medium">Produit</th>
                  <th className="text-center p-2 font-medium">Stock actuel</th>
                  {filteredForecasts?.[0]?.weeks.slice(0, 4).map((week) => (
                    <th key={week.weekLabel} className="text-center p-2 font-medium">
                      {week.weekLabel}
                    </th>
                  ))}
                  <th className="text-center p-2 font-medium">Alertes</th>
                </tr>
              </thead>
              <tbody>
                {filteredForecasts?.map((forecast) => {
                  const hasAlerts = forecast.weeks.some((w) => w.alerts.length > 0);
                  const hasRupture = forecast.weeks.some((w) => w.alerts.includes("RUPTURE"));

                  return (
                    <tr
                      key={forecast.productId}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedProductId(forecast.productId)}
                    >
                      <td className="p-2 font-mono text-sm">{forecast.productSku}</td>
                      <td className="p-2">{forecast.productName}</td>
                      <td className="p-2 text-center font-medium">{forecast.currentStock}</td>
                      {forecast.weeks.slice(0, 4).map((week) => (
                        <td
                          key={week.weekLabel}
                          className={`p-2 text-center ${
                            week.alerts.includes("RUPTURE")
                              ? "text-red-600 font-bold"
                              : week.alerts.includes("STOCK_CRITIQUE")
                              ? "text-orange-600 font-semibold"
                              : week.alerts.includes("STOCK_BAS")
                              ? "text-yellow-600"
                              : ""
                          }`}
                        >
                          {week.projectedStock}
                          {week.incomingQuantity > 0 && (
                            <span className="text-green-600 text-xs ml-1">
                              (+{week.incomingQuantity})
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="p-2 text-center">
                        {hasRupture ? (
                          <Badge variant="destructive">Rupture</Badge>
                        ) : hasAlerts ? (
                          <Badge variant="secondary">Alerte</Badge>
                        ) : (
                          <Badge variant="outline">OK</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Product Detail Modal */}
      {selectedProductId && productForecast && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{productForecast.product.name}</CardTitle>
                <CardDescription>SKU: {productForecast.product.sku}</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setSelectedProductId(null)}>
                Fermer
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Product Forecast Chart */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Évolution du stock projeté</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={productForecast.forecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="weekLabel" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="projectedStock"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Stock projeté"
                  />
                  <Line
                    type="monotone"
                    dataKey="incomingQuantity"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Arrivages"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Weekly Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Détails hebdomadaires</h3>
              <div className="space-y-2">
                {productForecast.forecast.map((week) => (
                  <div
                    key={week.weekLabel}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{week.weekLabel}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {week.incomingQuantity > 0 && (
                        <Badge variant="outline" className="bg-green-50">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          +{week.incomingQuantity} arrivage
                        </Badge>
                      )}
                      <span
                        className={`font-semibold ${
                          week.alerts.includes("RUPTURE")
                            ? "text-red-600"
                            : week.alerts.includes("STOCK_CRITIQUE")
                            ? "text-orange-600"
                            : week.alerts.includes("STOCK_BAS")
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {week.projectedStock} unités
                      </span>
                      {week.alerts.length > 0 && (
                        <Badge variant="destructive">
                          {week.alerts[0].replace("_", " ")}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
