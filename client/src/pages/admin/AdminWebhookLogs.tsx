import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertTriangle,
  Zap,
  Timer,
  Globe,
} from "lucide-react";

export default function AdminWebhookLogs() {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [successFilter, setSuccessFilter] = useState<string>("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [orderNumberFilter, setOrderNumberFilter] = useState("");
  const [paymentIdFilter, setPaymentIdFilter] = useState("");
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);

  const filters = {
    page,
    limit,
    success: successFilter === "all" ? undefined : successFilter === "true",
    eventType: eventTypeFilter || undefined,
    orderNumber: orderNumberFilter || undefined,
    molliePaymentId: paymentIdFilter || undefined,
  };

  const { data, isLoading, refetch } = trpc.admin.webhookLogs.list.useQuery(filters);
  const { data: stats } = trpc.admin.webhookLogs.stats.useQuery();
  const { data: selectedLog, isLoading: loadingDetail } = trpc.admin.webhookLogs.getById.useQuery(
    { id: selectedLogId! },
    { enabled: !!selectedLogId }
  );

  const totalPages = Math.ceil((data?.total || 0) / limit);

  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getEventBadge = (eventType: string) => {
    if (eventType.startsWith("error")) {
      return <Badge variant="destructive" className="text-xs">{eventType}</Badge>;
    }
    if (eventType.startsWith("order.paid")) {
      return <Badge className="bg-green-100 text-green-800 text-xs">{eventType}</Badge>;
    }
    if (eventType.startsWith("order.pending")) {
      return <Badge className="bg-yellow-100 text-yellow-800 text-xs">{eventType}</Badge>;
    }
    if (eventType.startsWith("order.failed") || eventType.startsWith("order.expired") || eventType.startsWith("order.cancelled")) {
      return <Badge className="bg-red-100 text-red-800 text-xs">{eventType}</Badge>;
    }
    if (eventType.startsWith("sav")) {
      return <Badge className="bg-blue-100 text-blue-800 text-xs">{eventType}</Badge>;
    }
    if (eventType.startsWith("info")) {
      return <Badge className="bg-gray-100 text-gray-800 text-xs">{eventType}</Badge>;
    }
    return <Badge variant="outline" className="text-xs">{eventType}</Badge>;
  };

  const resetFilters = () => {
    setSuccessFilter("all");
    setEventTypeFilter("");
    setOrderNumberFilter("");
    setPaymentIdFilter("");
    setPage(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Logs Webhooks Mollie</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Traçabilité complète des retours de paiement Mollie
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-xs sm:text-sm text-muted-foreground">Total</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold mt-1">{stats?.total ?? "-"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs sm:text-sm text-muted-foreground">Succès</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold mt-1 text-green-600">{stats?.success ?? "-"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs sm:text-sm text-muted-foreground">Erreurs</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold mt-1 text-red-600">{stats?.errors ?? "-"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-orange-500" />
                <span className="text-xs sm:text-sm text-muted-foreground">Temps moy.</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold mt-1">{stats?.avgProcessingTime ?? "-"}<span className="text-xs font-normal ml-1">ms</span></p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <Select value={successFilter} onValueChange={(v) => { setSuccessFilter(v); setPage(1); }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="true">Succès uniquement</SelectItem>
                  <SelectItem value="false">Erreurs uniquement</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Type d'événement..."
                value={eventTypeFilter}
                onChange={(e) => { setEventTypeFilter(e.target.value); setPage(1); }}
                className="h-9"
              />
              <Input
                placeholder="N° commande..."
                value={orderNumberFilter}
                onChange={(e) => { setOrderNumberFilter(e.target.value); setPage(1); }}
                className="h-9"
              />
              <Input
                placeholder="ID paiement Mollie..."
                value={paymentIdFilter}
                onChange={(e) => { setPaymentIdFilter(e.target.value); setPage(1); }}
                className="h-9"
              />
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9">
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardContent className="p-0">
            {/* Mobile view */}
            <div className="block sm:hidden">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : data?.logs && data.logs.length > 0 ? (
                <div className="divide-y">
                  {data.logs.map((log: any) => (
                    <div
                      key={log.id}
                      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedLogId(log.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {log.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                          )}
                          {getEventBadge(log.eventType)}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {log.molliePaymentId && (
                          <span className="font-mono truncate max-w-[120px]">{log.molliePaymentId}</span>
                        )}
                        {log.orderNumber && (
                          <span className="font-medium text-foreground">{log.orderNumber}</span>
                        )}
                        {log.processingTimeMs != null && (
                          <span>{log.processingTimeMs}ms</span>
                        )}
                      </div>
                      {log.errorMessage && (
                        <p className="text-xs text-red-600 mt-1 truncate">{log.errorMessage}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun log webhook trouvé</p>
                </div>
              )}
            </div>

            {/* Desktop view */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">OK</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Paiement Mollie</TableHead>
                    <TableHead>Statut Mollie</TableHead>
                    <TableHead>Commande</TableHead>
                    <TableHead>Transition</TableHead>
                    <TableHead className="text-right">Temps</TableHead>
                    <TableHead className="text-right">HTTP</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(10)].map((_, i) => (
                      <TableRow key={i}>
                        {[...Array(10)].map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : data?.logs && data.logs.length > 0 ? (
                    data.logs.map((log: any) => (
                      <TableRow
                        key={log.id}
                        className={`cursor-pointer hover:bg-muted/50 ${!log.success ? "bg-red-50/50 dark:bg-red-950/10" : ""}`}
                        onClick={() => setSelectedLogId(log.id)}
                      >
                        <TableCell>
                          {log.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{formatDate(log.createdAt)}</TableCell>
                        <TableCell>{getEventBadge(log.eventType)}</TableCell>
                        <TableCell className="font-mono text-xs">{log.molliePaymentId || "-"}</TableCell>
                        <TableCell>
                          {log.mollieStatus ? (
                            <Badge variant="outline" className="text-xs">{log.mollieStatus}</Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="font-medium text-xs">{log.orderNumber || (log.savTicketId ? `SAV #${log.savTicketId}` : "-")}</TableCell>
                        <TableCell className="text-xs">
                          {log.previousOrderStatus && log.newOrderStatus ? (
                            <span>
                              <span className="text-muted-foreground">{log.previousOrderStatus}</span>
                              {" → "}
                              <span className="font-medium">{log.newOrderStatus}</span>
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {log.processingTimeMs != null ? `${log.processingTimeMs}ms` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={log.httpStatusCode === 200 ? "outline" : "destructive"}
                            className="text-xs"
                          >
                            {log.httpStatusCode}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Aucun log webhook trouvé</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t">
                <span className="text-xs text-muted-foreground">
                  {data?.total || 0} résultat{(data?.total || 0) > 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page <= 1}
                    onClick={() => setPage(1)}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm px-2">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= totalPages}
                    onClick={() => setPage(totalPages)}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!selectedLogId} onOpenChange={(open) => { if (!open) setSelectedLogId(null); }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Détail du log webhook
              </DialogTitle>
              <DialogDescription>
                Log #{selectedLog?.id} — {formatDate(selectedLog?.createdAt)}
              </DialogDescription>
            </DialogHeader>

            {loadingDetail ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : selectedLog ? (
              <div className="space-y-4">
                {/* Status & Event */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Statut</p>
                    <div className="flex items-center gap-2">
                      {selectedLog.success ? (
                        <Badge className="bg-green-100 text-green-800">Succès</Badge>
                      ) : (
                        <Badge variant="destructive">Erreur</Badge>
                      )}
                      <Badge variant="outline">HTTP {selectedLog.httpStatusCode}</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Type d'événement</p>
                    {getEventBadge(selectedLog.eventType)}
                  </div>
                </div>

                {/* Payment Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">ID Paiement Mollie</p>
                    <p className="font-mono text-sm">{selectedLog.molliePaymentId || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Statut Mollie</p>
                    <p className="text-sm">{selectedLog.mollieStatus || "-"}</p>
                  </div>
                </div>

                {/* Order Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">N° Commande</p>
                    <p className="text-sm font-medium">{selectedLog.orderNumber || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">ID Commande</p>
                    <p className="text-sm">{selectedLog.orderId || (selectedLog.savTicketId ? `SAV #${selectedLog.savTicketId}` : "-")}</p>
                  </div>
                </div>

                {/* Status Transition */}
                {(selectedLog.previousOrderStatus || selectedLog.newOrderStatus) && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Transition de statut</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{selectedLog.previousOrderStatus || "?"}</Badge>
                      <span>→</span>
                      <Badge className="bg-blue-100 text-blue-800">{selectedLog.newOrderStatus || "?"}</Badge>
                    </div>
                  </div>
                )}

                {/* Processing */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Temps de traitement</p>
                    <p className="text-sm">{selectedLog.processingTimeMs != null ? `${selectedLog.processingTimeMs}ms` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Adresse IP</p>
                    <p className="font-mono text-sm">{selectedLog.ipAddress || "-"}</p>
                  </div>
                </div>

                {/* Error Message */}
                {selectedLog.errorMessage && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      Message d'erreur
                    </p>
                    <pre className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded p-3 text-xs text-red-800 dark:text-red-300 overflow-x-auto whitespace-pre-wrap">
                      {selectedLog.errorMessage}
                    </pre>
                  </div>
                )}

                {/* Raw Payload */}
                {selectedLog.rawPayload && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Payload brut (requête)</p>
                    <pre className="bg-muted rounded p-3 text-xs overflow-x-auto whitespace-pre-wrap max-h-32">
                      {(() => {
                        try { return JSON.stringify(JSON.parse(selectedLog.rawPayload), null, 2); }
                        catch { return selectedLog.rawPayload; }
                      })()}
                    </pre>
                  </div>
                )}

                {/* Mollie Response */}
                {selectedLog.mollieResponsePayload && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Réponse Mollie (paiement)</p>
                    <pre className="bg-muted rounded p-3 text-xs overflow-x-auto whitespace-pre-wrap max-h-48">
                      {(() => {
                        try { return JSON.stringify(JSON.parse(selectedLog.mollieResponsePayload), null, 2); }
                        catch { return selectedLog.mollieResponsePayload; }
                      })()}
                    </pre>
                  </div>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
