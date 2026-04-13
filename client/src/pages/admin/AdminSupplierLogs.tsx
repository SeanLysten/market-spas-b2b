import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Database,
  ArrowDownToLine,
  ArrowUpFromLine,
  Package,
  Truck,
  CreditCard,
  AlertTriangle,
} from "lucide-react";

const IMPORT_KEY_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  stock_import: { label: "Import Stock", icon: ArrowDownToLine, color: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
  order_export: { label: "Export Commandes", icon: ArrowUpFromLine, color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  balance_paid: { label: "Solde Payé", icon: CreditCard, color: "bg-purple-500/15 text-purple-700 dark:text-purple-400" },
  balance_paid_error: { label: "Solde Payé (Erreur)", icon: AlertTriangle, color: "bg-red-500/15 text-red-700 dark:text-red-400" },
  order_update_status: { label: "Mise à jour Statut", icon: Package, color: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  order_update_status_error: { label: "Mise à jour Statut (Erreur)", icon: AlertTriangle, color: "bg-red-500/15 text-red-700 dark:text-red-400" },
  order_confirm_delivery: { label: "Confirmation Livraison", icon: Truck, color: "bg-teal-500/15 text-teal-700 dark:text-teal-400" },
  order_confirm_delivery_error: { label: "Confirmation Livraison (Erreur)", icon: AlertTriangle, color: "bg-red-500/15 text-red-700 dark:text-red-400" },
  order_mark_delivered: { label: "Livraison Effectuée", icon: CheckCircle, color: "bg-green-500/15 text-green-700 dark:text-green-400" },
  order_mark_delivered_error: { label: "Livraison Effectuée (Erreur)", icon: AlertTriangle, color: "bg-red-500/15 text-red-700 dark:text-red-400" },
};

function getImportKeyInfo(key: string) {
  return IMPORT_KEY_LABELS[key] || { label: key, icon: Database, color: "bg-gray-500/15 text-gray-700 dark:text-gray-400" };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatJson(str: string | null) {
  if (!str) return null;
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

export default function AdminSupplierLogs() {
  const [page, setPage] = useState(0);
  const [filterKey, setFilterKey] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const pageSize = 20;

  const { data, isLoading, refetch } = trpc.admin.supplierApiLogs.list.useQuery({
    limit: pageSize,
    offset: page * pageSize,
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  // Filtrer côté client par importKey
  const filteredLogs = filterKey === "all" ? logs : logs.filter((l: any) => l.importKey === filterKey);

  // Stats rapides
  const successCount = logs.filter((l: any) => l.success).length;
  const errorCount = logs.filter((l: any) => !l.success).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Logs API Fournisseur</h1>
            <p className="text-muted-foreground mt-1">Historique des échanges avec l'API fournisseur (imports stock, exports commandes, webhooks)</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 self-start">
            <RefreshCw className="w-4 h-4" />
            Rafraîchir
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/15">
                  <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{total}</p>
                  <p className="text-xs text-muted-foreground">Total logs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/15">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{successCount}</p>
                  <p className="text-xs text-muted-foreground">Succès (page)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/15">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{errorCount}</p>
                  <p className="text-xs text-muted-foreground">Erreurs (page)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/15">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{logs[0] ? formatDate(logs[0].createdAt).split(" ")[0] : "-"}</p>
                  <p className="text-xs text-muted-foreground">Dernier appel</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <Select value={filterKey} onValueChange={setFilterKey}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filtrer par type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="stock_import">Import Stock</SelectItem>
              <SelectItem value="order_export">Export Commandes</SelectItem>
              <SelectItem value="balance_paid">Solde Payé</SelectItem>
              <SelectItem value="order_update_status">Mise à jour Statut</SelectItem>
              <SelectItem value="order_confirm_delivery">Confirmation Livraison</SelectItem>
              <SelectItem value="order_mark_delivered">Livraison Effectuée</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filteredLogs.length} résultat{filteredLogs.length !== 1 ? "s" : ""} sur cette page
          </span>
        </div>

        {/* Logs Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FileText className="w-12 h-12 mb-3 opacity-40" />
                <p className="text-lg font-medium">Aucun log trouvé</p>
                <p className="text-sm">Les appels API fournisseur apparaîtront ici</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 dark:bg-muted/30 border-b">
                    <tr>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Date</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Type</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Statut</th>
                      <th className="text-right p-3 font-medium text-muted-foreground text-sm">Total</th>
                      <th className="text-right p-3 font-medium text-muted-foreground text-sm">Matched</th>
                      <th className="text-right p-3 font-medium text-muted-foreground text-sm">Erreurs</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">IP</th>
                      <th className="text-center p-3 font-medium text-muted-foreground text-sm">Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log: any) => {
                      const info = getImportKeyInfo(log.importKey);
                      const Icon = info.icon;
                      return (
                        <tr key={log.id} className="border-b hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors">
                          <td className="p-3 text-sm whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </td>
                          <td className="p-3">
                            <Badge className={`${info.color} gap-1 text-xs`}>
                              <Icon className="w-3 h-3" />
                              {info.label}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {log.success ? (
                              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 gap-1 text-xs">
                                <CheckCircle className="w-3 h-3" />
                                OK
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 gap-1 text-xs">
                                <XCircle className="w-3 h-3" />
                                Erreur
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-right text-sm font-medium">{log.totalItems}</td>
                          <td className="p-3 text-right text-sm">{log.matchedItems}</td>
                          <td className="p-3 text-right text-sm">
                            {log.errorItems > 0 ? (
                              <span className="text-red-600 dark:text-red-400 font-medium">{log.errorItems}</span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground font-mono text-xs">{log.ipAddress || "-"}</td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                              className="gap-1"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} sur {totalPages} ({total} logs au total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            {selectedLog && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Log #{selectedLog.id}
                  </DialogTitle>
                  <DialogDescription>
                    {formatDate(selectedLog.createdAt)} — {getImportKeyInfo(selectedLog.importKey).label}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Metadata */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-muted/50 dark:bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Type</p>
                      <Badge className={`${getImportKeyInfo(selectedLog.importKey).color} text-xs`}>
                        {getImportKeyInfo(selectedLog.importKey).label}
                      </Badge>
                    </div>
                    <div className="bg-muted/50 dark:bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Statut</p>
                      {selectedLog.success ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs">Succès</Badge>
                      ) : (
                        <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 text-xs">Erreur</Badge>
                      )}
                    </div>
                    <div className="bg-muted/50 dark:bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">IP</p>
                      <p className="text-sm font-mono">{selectedLog.ipAddress || "-"}</p>
                    </div>
                    <div className="bg-muted/50 dark:bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Total items</p>
                      <p className="text-sm font-semibold">{selectedLog.totalItems}</p>
                    </div>
                    <div className="bg-muted/50 dark:bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Matched</p>
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{selectedLog.matchedItems}</p>
                    </div>
                    <div className="bg-muted/50 dark:bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Unmatched / Erreurs</p>
                      <p className="text-sm">
                        <span className="text-amber-600 dark:text-amber-400">{selectedLog.unmatchedItems}</span>
                        {" / "}
                        <span className="text-red-600 dark:text-red-400">{selectedLog.errorItems}</span>
                      </p>
                    </div>
                  </div>

                  {/* Error message */}
                  {selectedLog.errorMessage && (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">Message d'erreur</p>
                      <p className="text-sm text-red-700 dark:text-red-300 font-mono">{selectedLog.errorMessage}</p>
                    </div>
                  )}

                  {/* User Agent */}
                  {selectedLog.userAgent && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">User-Agent</p>
                      <p className="text-xs font-mono bg-muted/50 dark:bg-muted/30 rounded p-2 break-all">{selectedLog.userAgent}</p>
                    </div>
                  )}

                  {/* Results JSON */}
                  {selectedLog.resultsJson && (
                    <div>
                      <p className="text-sm font-medium mb-2">Résultats</p>
                      <pre className="bg-muted/50 dark:bg-muted/30 rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-60 whitespace-pre-wrap">
                        {formatJson(selectedLog.resultsJson)}
                      </pre>
                    </div>
                  )}

                  {/* Raw Payload */}
                  {selectedLog.rawPayload && (
                    <div>
                      <p className="text-sm font-medium mb-2">Payload brut</p>
                      <pre className="bg-muted/50 dark:bg-muted/30 rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-60 whitespace-pre-wrap">
                        {formatJson(selectedLog.rawPayload)}
                      </pre>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
