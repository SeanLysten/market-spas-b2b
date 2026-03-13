import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  Search,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Truck,
  PackageCheck,
  PackageX,
  Clock,
  ArrowUpDown,
} from "lucide-react";

type SortField = "name" | "stock" | "transit" | "status";
type SortDir = "asc" | "desc";

export default function AdminStockForecast() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Fetch data
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = trpc.admin.forecast.getSummary.useQuery();
  const { data: stockData, isLoading: stockLoading, refetch: refetchStock } = trpc.admin.forecast.getAll.useQuery();
  const { data: supplierLogs } = trpc.admin.forecast.getSupplierLogs.useQuery({ limit: 10 });

  const handleRefresh = () => {
    refetchSummary();
    refetchStock();
  };

  // Filter and sort products
  const products = (stockData as any)?.products || [];
  const filteredProducts = products
    .filter((p: any) => {
      const matchesSearch =
        p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.productSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.supplierProductCode || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a: any, b: any) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.productName.localeCompare(b.productName);
          break;
        case "stock":
          cmp = a.totalStock - b.totalStock;
          break;
        case "transit":
          cmp = a.totalTransit - b.totalTransit;
          break;
        case "status":
          const statusOrder: Record<string, number> = { RUPTURE: 0, EN_TRANSIT: 1, EN_STOCK: 2 };
          cmp = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleExport = () => {
    if (!products.length) return;

    const rows: string[] = [
      ["Code Fournisseur", "Produit", "SKU Variante", "Code Variante", "Couleur", "Stock", "En Transit", "Réservé", "Disponible", "Statut"].join(","),
    ];

    for (const product of products) {
      for (const variant of product.variants) {
        rows.push(
          [
            product.supplierProductCode || "",
            `"${product.productName}"`,
            variant.sku || "",
            variant.supplierProductCode || "",
            variant.color || "",
            variant.stockQuantity,
            variant.inTransitQuantity,
            variant.stockReserved,
            variant.available,
            variant.stockQuantity > 0 ? "En stock" : variant.inTransitQuantity > 0 ? "En transit" : "Rupture",
          ].join(",")
        );
      }
    }

    const csv = rows.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-fournisseur-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "EN_STOCK":
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-0"><PackageCheck className="mr-1 h-3 w-3" />En stock</Badge>;
      case "EN_TRANSIT":
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-0"><Truck className="mr-1 h-3 w-3" />En transit</Badge>;
      case "RUPTURE":
        return <Badge variant="destructive"><PackageX className="mr-1 h-3 w-3" />Rupture</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (summaryLoading || stockLoading) {
    return (
      <AdminLayout>
        <div className="p-4 md:p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Stock Fournisseur</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Vue d'ensemble des stocks et transit — données synchronisées via l'API fournisseur
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Last update info */}
          {summary?.lastSupplierUpdate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <Clock className="h-4 w-4" />
              <span>Dernière mise à jour fournisseur : <strong>{formatDate((summary.lastSupplierUpdate as any)?.createdAt)}</strong></span>
              {(summary.lastSupplierUpdate as any)?.matchedItems !== undefined && (
                <span className="ml-2">
                  ({(summary.lastSupplierUpdate as any).matchedItems} variantes matchées sur {(summary.lastSupplierUpdate as any).totalItems} reçues)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Produits suivis</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{summary?.totalProducts || 0}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                {filteredProducts.reduce((sum: number, p: any) => sum + p.variantCount, 0)} variantes au total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">En stock</CardTitle>
              <PackageCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary?.totalStock || 0}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                {summary?.productsInStock || 0} produit(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">En transit</CardTitle>
              <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">{summary?.totalTransit || 0}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                {summary?.productsInTransit || 0} produit(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Rupture</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-destructive">{summary?.productsInRupture || 0}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                {summary?.productsWithLowStock || 0} stock bas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Stock Overview + Supplier Logs */}
        <Tabs defaultValue="stock" className="space-y-4">
          <TabsList>
            <TabsTrigger value="stock">Vue des stocks</TabsTrigger>
            <TabsTrigger value="logs">Historique imports</TabsTrigger>
          </TabsList>

          <TabsContent value="stock" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, SKU ou code fournisseur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                >
                  Tous ({products.length})
                </Button>
                <Button
                  variant={statusFilter === "EN_STOCK" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("EN_STOCK")}
                  className={statusFilter === "EN_STOCK" ? "" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950"}
                >
                  <PackageCheck className="mr-1 h-3 w-3" />
                  Stock ({products.filter((p: any) => p.status === "EN_STOCK").length})
                </Button>
                <Button
                  variant={statusFilter === "EN_TRANSIT" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("EN_TRANSIT")}
                  className={statusFilter === "EN_TRANSIT" ? "" : "text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950"}
                >
                  <Truck className="mr-1 h-3 w-3" />
                  Transit ({products.filter((p: any) => p.status === "EN_TRANSIT").length})
                </Button>
                <Button
                  variant={statusFilter === "RUPTURE" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("RUPTURE")}
                  className={statusFilter === "RUPTURE" ? "" : "text-destructive border-destructive/30 hover:bg-destructive/5"}
                >
                  <PackageX className="mr-1 h-3 w-3" />
                  Rupture ({products.filter((p: any) => p.status === "RUPTURE").length})
                </Button>
              </div>
            </div>

            {/* Product Stock Table - Desktop */}
            <Card>
              <CardContent className="p-0">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="w-10 p-3"></th>
                        <th
                          className="text-left p-3 font-medium text-sm cursor-pointer hover:text-foreground"
                          onClick={() => handleSort("name")}
                        >
                          <div className="flex items-center gap-1">
                            Produit
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="text-left p-3 font-medium text-sm">Code fournisseur</th>
                        <th className="text-center p-3 font-medium text-sm">Variantes</th>
                        <th
                          className="text-center p-3 font-medium text-sm cursor-pointer hover:text-foreground"
                          onClick={() => handleSort("stock")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Stock
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th
                          className="text-center p-3 font-medium text-sm cursor-pointer hover:text-foreground"
                          onClick={() => handleSort("transit")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            En transit
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="text-center p-3 font-medium text-sm">Réservé</th>
                        <th
                          className="text-center p-3 font-medium text-sm cursor-pointer hover:text-foreground"
                          onClick={() => handleSort("status")}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Statut
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product: any) => (
                        <>
                          <tr
                            key={product.productId}
                            className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                            onClick={() =>
                              setExpandedProductId(
                                expandedProductId === product.productId ? null : product.productId
                              )
                            }
                          >
                            <td className="p-3 text-center">
                              {expandedProductId === product.productId ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground mx-auto" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground mx-auto" />
                              )}
                            </td>
                            <td className="p-3">
                              <div className="font-medium">{product.productName}</div>
                              <div className="text-xs text-muted-foreground font-mono">{product.productSku}</div>
                            </td>
                            <td className="p-3 font-mono text-sm">{product.supplierProductCode || "—"}</td>
                            <td className="p-3 text-center">{product.variantCount}</td>
                            <td className="p-3 text-center">
                              <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-full text-sm font-semibold ${
                                product.totalStock > 0
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {product.totalStock}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-full text-sm font-semibold ${
                                product.totalTransit > 0
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {product.totalTransit}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`text-sm ${product.totalReserved > 0 ? "font-semibold text-orange-600 dark:text-orange-400" : "text-muted-foreground"}`}>
                                {product.totalReserved}
                              </span>
                            </td>
                            <td className="p-3 text-center">{getStatusBadge(product.status)}</td>
                          </tr>
                          {expandedProductId === product.productId && (
                            <tr key={`${product.productId}-detail`} className="bg-muted/10">
                              <td colSpan={8} className="p-0">
                                <div className="p-4 pl-12">
                                  <h4 className="text-sm font-semibold mb-3">Détail par variante</h4>
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b">
                                        <th className="text-left p-2 font-medium text-xs text-muted-foreground">Code fournisseur</th>
                                        <th className="text-left p-2 font-medium text-xs text-muted-foreground">SKU</th>
                                        <th className="text-left p-2 font-medium text-xs text-muted-foreground">Couleur</th>
                                        <th className="text-center p-2 font-medium text-xs text-muted-foreground">Stock</th>
                                        <th className="text-center p-2 font-medium text-xs text-muted-foreground">En transit</th>
                                        <th className="text-center p-2 font-medium text-xs text-muted-foreground">Réservé</th>
                                        <th className="text-center p-2 font-medium text-xs text-muted-foreground">Disponible</th>
                                        <th className="text-center p-2 font-medium text-xs text-muted-foreground">Alerte</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {product.variants.map((v: any) => (
                                        <tr key={v.id} className="border-b last:border-0 hover:bg-muted/20">
                                          <td className="p-2 font-mono text-xs">{v.supplierProductCode || "—"}</td>
                                          <td className="p-2 font-mono text-xs">{v.sku || "—"}</td>
                                          <td className="p-2">{v.color || "—"}</td>
                                          <td className="p-2 text-center">
                                            <span className={`font-semibold ${v.stockQuantity > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                                              {v.stockQuantity}
                                            </span>
                                          </td>
                                          <td className="p-2 text-center">
                                            <span className={`font-semibold ${v.inTransitQuantity > 0 ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}>
                                              {v.inTransitQuantity}
                                            </span>
                                          </td>
                                          <td className="p-2 text-center">
                                            <span className={v.stockReserved > 0 ? "font-semibold text-orange-600 dark:text-orange-400" : "text-muted-foreground"}>
                                              {v.stockReserved}
                                            </span>
                                          </td>
                                          <td className="p-2 text-center font-semibold">{v.available}</td>
                                          <td className="p-2 text-center">
                                            {v.isLowStock ? (
                                              <Badge variant="secondary" className="text-xs">
                                                <AlertTriangle className="mr-1 h-3 w-3" />
                                                Stock bas
                                              </Badge>
                                            ) : v.stockQuantity === 0 && v.inTransitQuantity === 0 ? (
                                              <Badge variant="destructive" className="text-xs">Rupture</Badge>
                                            ) : (
                                              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">OK</span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-muted-foreground">
                            Aucun produit ne correspond aux critères de recherche
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-2 p-3">
                  {filteredProducts.map((product: any) => (
                    <div key={product.productId}>
                      <div
                        className="p-3 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() =>
                          setExpandedProductId(
                            expandedProductId === product.productId ? null : product.productId
                          )
                        }
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.productName}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {product.supplierProductCode || product.productSku}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {getStatusBadge(product.status)}
                            {expandedProductId === product.productId ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Stock:</span>
                            <span className={`font-semibold ${product.totalStock > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                              {product.totalStock}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Transit:</span>
                            <span className={`font-semibold ${product.totalTransit > 0 ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}>
                              {product.totalTransit}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Variantes:</span>
                            <span className="font-semibold">{product.variantCount}</span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded variant details - Mobile */}
                      {expandedProductId === product.productId && (
                        <div className="ml-3 mt-1 border-l-2 border-primary/20 pl-3 space-y-2 pb-2">
                          {product.variants.map((v: any) => (
                            <div key={v.id} className="p-2 bg-muted/20 rounded text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-mono font-medium">{v.supplierProductCode || v.sku || "—"}</span>
                                {v.color && <span className="text-muted-foreground">{v.color}</span>}
                              </div>
                              <div className="flex items-center gap-3">
                                <span>
                                  S: <strong className={v.stockQuantity > 0 ? "text-emerald-600 dark:text-emerald-400" : ""}>{v.stockQuantity}</strong>
                                </span>
                                <span>
                                  T: <strong className={v.inTransitQuantity > 0 ? "text-blue-600 dark:text-blue-400" : ""}>{v.inTransitQuantity}</strong>
                                </span>
                                <span>
                                  R: <strong className={v.stockReserved > 0 ? "text-orange-600 dark:text-orange-400" : ""}>{v.stockReserved}</strong>
                                </span>
                                {v.isLowStock && (
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0">Stock bas</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      Aucun produit ne correspond aux critères
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Historique des imports fournisseur</CardTitle>
                <CardDescription>
                  Chaque appel API du fournisseur est enregistré avec le nombre de variantes matchées
                </CardDescription>
              </CardHeader>
              <CardContent>
                {supplierLogs && (supplierLogs as any[]).length > 0 ? (
                  <div className="space-y-3">
                    {(supplierLogs as any[]).map((log: any, index: number) => (
                      <div
                        key={log.id || index}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg gap-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Import stock fournisseur</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(log.createdAt)} — IP: {log.ipAddress || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap ml-11 sm:ml-0">
                          <Badge variant="outline" className="text-xs">
                            {log.totalItems} reçues
                          </Badge>
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-0 text-xs">
                            {log.matchedItems} matchées
                          </Badge>
                          {log.unmatchedItems > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {log.unmatchedItems} non matchées
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun import enregistré pour le moment</p>
                    <p className="text-xs mt-1">Les imports apparaîtront ici dès que le fournisseur enverra des données via l'API</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
