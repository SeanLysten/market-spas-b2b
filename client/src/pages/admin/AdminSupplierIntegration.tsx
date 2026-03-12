import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import {
  Upload,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  FileJson,
  ArrowRightLeft,
  Package,
  Barcode,
  History,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StockUpdateResult {
  codeProduit: string;
  ean13: string;
  matched: boolean;
  matchedTo?: {
    type: "product" | "variant";
    id: number;
    name: string;
    sku: string;
  };
  previousStock?: number;
  newStock?: number;
  previousTransit?: number;
  newTransit?: number;
  error?: string;
}

interface ImportSummary {
  total: number;
  matched: number;
  unmatched: number;
  errors: number;
  importKey: string;
  importedAt: string;
}

interface ImportResult {
  success: boolean;
  summary?: ImportSummary;
  results?: StockUpdateResult[];
  error?: string;
}

interface ImportLogEntry {
  timestamp: string;
  key: string;
  total: number;
  matched: number;
  unmatched: number;
  errors: number;
}

// ─── Known Supplier Products ──────────────────────────────────────────────────

const SUPPLIER_PRODUCTS = [
  { model: "Neptune V2", color: "Sterling Silver", code: "662201 078 38", ean13: "3364549284619" },
  { model: "Neptune V2", color: "Odyssey", code: "662201 079 38", ean13: "3364549284626" },
  { model: "Neptune V2", color: "Midnight Opal", code: "662201 080 38", ean13: "3364549284633" },
  { model: "Easy relax", color: "Sterling Silver", code: "662600 078 38", ean13: "3364549284640" },
  { model: "Easy relax", color: "Odyssey", code: "662600 079 38", ean13: "3364549284657" },
  { model: "Easy relax", color: "Midnight Opal", code: "662600 080 38", ean13: "3364549284664" },
  { model: "Volcano", color: "Sterling Silver", code: "662700 078 38", ean13: "3364549284718" },
  { model: "Volcano", color: "Odyssey", code: "662700 079 38", ean13: "3364549284725" },
  { model: "Volcano", color: "Midnight Opal", code: "662700 080 38", ean13: "3364549284732" },
  { model: "Mykonos", color: "Sterling Silver", code: "662800 078 38", ean13: "3364549284749" },
  { model: "Mykonos", color: "Odyssey", code: "662800 079 38", ean13: "3364549284756" },
  { model: "Mykonos", color: "Midnight Opal", code: "662800 080 38", ean13: "3364549284763" },
  { model: "Twin Plug & Play", color: "Sterling Silver", code: "662900 078 38", ean13: "3364549284770" },
  { model: "Twin Plug & Play", color: "Odyssey", code: "662900 079 38", ean13: "3364549284787" },
  { model: "Twin Plug & Play", color: "Midnight Opal", code: "662900 080 38", ean13: "3364549284794" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminSupplierIntegration() {
  const [activeTab, setActiveTab] = useState("import");
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [exportData, setExportData] = useState<any>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [importLogs, setImportLogs] = useState<ImportLogEntry[]>([]);

  // Load import logs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("supplier-import-logs");
    if (saved) {
      try {
        setImportLogs(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const saveImportLog = (summary: ImportSummary) => {
    const entry: ImportLogEntry = {
      timestamp: summary.importedAt,
      key: summary.importKey,
      total: summary.total,
      matched: summary.matched,
      unmatched: summary.unmatched,
      errors: summary.errors,
    };
    const updated = [entry, ...importLogs].slice(0, 50);
    setImportLogs(updated);
    localStorage.setItem("supplier-import-logs", JSON.stringify(updated));
  };

  // ─── Import Stock ─────────────────────────────────────────────────────────

  const handleImportStock = async () => {
    if (!jsonInput.trim()) {
      toast.error("Veuillez coller le JSON de stock à importer");
      return;
    }

    let payload;
    try {
      payload = JSON.parse(jsonInput);
    } catch {
      toast.error("Le JSON n'est pas valide. Vérifiez le format.");
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const response = await fetch("/api/supplier/stock/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        saveImportLog(result.summary);
        toast.success(
          `Import terminé : ${result.summary.matched}/${result.summary.total} produits mis à jour`
        );
      } else {
        toast.error(result.error || "Erreur lors de l'import");
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur de connexion");
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      toast.success(`Fichier "${file.name}" chargé`);
    };
    reader.readAsText(file);
  };

  // ─── Export Orders ────────────────────────────────────────────────────────

  const handleExportOrders = async () => {
    setExporting(true);
    setExportData(null);

    try {
      const response = await fetch("/api/supplier/orders/export?limit=100");
      const result = await response.json();

      if (result.success) {
        setExportData(result);
        toast.success(`${result.count} commande(s) exportée(s)`);
      } else {
        toast.error(result.error || "Erreur lors de l'export");
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur de connexion");
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadExport = () => {
    if (!exportData) return;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export-commandes-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyExport = () => {
    if (!exportData) return;
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    toast.success("JSON copié dans le presse-papier");
  };

  // ─── API Endpoints Info ───────────────────────────────────────────────────

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Intégration Fournisseur</h1>
          <p className="text-muted-foreground mt-1">
            Synchronisation bidirectionnelle du stock et des commandes avec le système fournisseur
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="import" className="gap-2">
              <Upload className="h-4 w-4" />
              Import Stock
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2">
              <Download className="h-4 w-4" />
              Export Commandes
            </TabsTrigger>
            <TabsTrigger value="mapping" className="gap-2">
              <Barcode className="h-4 w-4" />
              Codes Produits
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Documentation API
            </TabsTrigger>
          </TabsList>

          {/* ─── TAB: Import Stock ──────────────────────────────────────────── */}
          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Importer les données de stock
                </CardTitle>
                <CardDescription>
                  Collez le JSON envoyé par le fournisseur ou chargez un fichier .json/.txt pour mettre à jour le stock et les quantités en transit.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label htmlFor="json-file">Charger un fichier</Label>
                    <Input
                      id="json-file"
                      type="file"
                      accept=".json,.txt"
                      onChange={handleFileUpload}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="json-input">JSON de stock</Label>
                  <textarea
                    id="json-input"
                    className="mt-1 w-full h-64 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder={`{\n  "key": "ExportStockValentin",\n  "data": [\n    {\n      "Ean13": 3364549284619,\n      "CodeProduit": "662201 078 38",\n      "EnStock": 10,\n      "EnTransit": 5\n    }\n  ]\n}`}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                  />
                </div>

                <Button onClick={handleImportStock} disabled={importing} className="w-full">
                  {importing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Lancer l'import
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Import Results */}
            {importResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {importResult.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    Résultat de l'import
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {importResult.success && importResult.summary && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-3 rounded-lg bg-muted">
                          <div className="text-2xl font-bold">{importResult.summary.total}</div>
                          <div className="text-sm text-muted-foreground">Total</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
                          <div className="text-2xl font-bold text-green-600">{importResult.summary.matched}</div>
                          <div className="text-sm text-muted-foreground">Matchés</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                          <div className="text-2xl font-bold text-yellow-600">{importResult.summary.unmatched}</div>
                          <div className="text-sm text-muted-foreground">Non matchés</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950">
                          <div className="text-2xl font-bold text-red-600">{importResult.summary.errors}</div>
                          <div className="text-sm text-muted-foreground">Erreurs</div>
                        </div>
                      </div>

                      {importResult.results && importResult.results.length > 0 && (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Statut</TableHead>
                                <TableHead>Code Produit</TableHead>
                                <TableHead>EAN13</TableHead>
                                <TableHead>Produit matché</TableHead>
                                <TableHead>Stock avant</TableHead>
                                <TableHead>Stock après</TableHead>
                                <TableHead>En transit</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {importResult.results.map((r, i) => (
                                <TableRow key={i}>
                                  <TableCell>
                                    {r.matched ? (
                                      <Badge variant="default" className="bg-green-600">Matché</Badge>
                                    ) : r.error ? (
                                      <Badge variant="destructive">Erreur</Badge>
                                    ) : (
                                      <Badge variant="secondary">Non trouvé</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">{r.codeProduit}</TableCell>
                                  <TableCell className="font-mono text-xs">{r.ean13}</TableCell>
                                  <TableCell>
                                    {r.matchedTo ? (
                                      <span className="text-sm">
                                        {r.matchedTo.name}
                                        <span className="text-muted-foreground ml-1">({r.matchedTo.sku})</span>
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell>{r.previousStock ?? "—"}</TableCell>
                                  <TableCell className="font-semibold">{r.newStock ?? "—"}</TableCell>
                                  <TableCell>{r.newTransit ?? "—"}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </>
                  )}

                  {!importResult.success && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      <span>{importResult.error}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Import History */}
            {importLogs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Historique des imports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Clé</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Matchés</TableHead>
                        <TableHead>Non matchés</TableHead>
                        <TableHead>Erreurs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importLogs.map((log, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">
                            {new Date(log.timestamp).toLocaleString("fr-FR")}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{log.key}</TableCell>
                          <TableCell>{log.total}</TableCell>
                          <TableCell className="text-green-600 font-medium">{log.matched}</TableCell>
                          <TableCell className="text-yellow-600">{log.unmatched}</TableCell>
                          <TableCell className="text-red-600">{log.errors}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ─── TAB: Export Commandes ──────────────────────────────────────── */}
          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Exporter les commandes
                </CardTitle>
                <CardDescription>
                  Générez un export JSON des commandes avec les informations de paiement et les données clients pour le système fournisseur.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Button onClick={handleExportOrders} disabled={exporting}>
                    {exporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Export en cours...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Générer l'export
                      </>
                    )}
                  </Button>

                  {exportData && (
                    <>
                      <Button variant="outline" onClick={handleDownloadExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger JSON
                      </Button>
                      <Button variant="outline" onClick={handleCopyExport}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copier
                      </Button>
                    </>
                  )}
                </div>

                {exportData && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Badge variant="default">{exportData.count} commande(s)</Badge>
                      <span className="text-sm text-muted-foreground">
                        Exporté le {new Date(exportData.exportedAt).toLocaleString("fr-FR")}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>N° Commande</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Total TTC</TableHead>
                            <TableHead>Acompte</TableHead>
                            <TableHead>Articles</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {exportData.data?.map((item: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="font-mono text-sm">{item.order.number}</TableCell>
                              <TableCell>
                                <div className="text-sm font-medium">{item.client.companyName || "—"}</div>
                                <div className="text-xs text-muted-foreground">{item.client.contactName}</div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  item.order.status === "DELIVERED" ? "default" :
                                  item.order.status === "CONFIRMED" ? "secondary" :
                                  "outline"
                                }>
                                  {item.order.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                {parseFloat(item.order.totalTTC || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                              </TableCell>
                              <TableCell>
                                {parseFloat(item.order.depositAmount || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                              </TableCell>
                              <TableCell>{item.items?.length || 0}</TableCell>
                              <TableCell className="text-sm">
                                {item.order.date ? new Date(item.order.date).toLocaleDateString("fr-FR") : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div>
                      <Label>Aperçu JSON</Label>
                      <pre className="mt-1 p-4 rounded-md bg-muted text-xs font-mono overflow-auto max-h-64">
                        {JSON.stringify(exportData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB: Codes Produits ────────────────────────────────────────── */}
          <TabsContent value="mapping" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Barcode className="h-5 w-5" />
                  Codes produits fournisseur
                </CardTitle>
                <CardDescription>
                  Référentiel des codes produits du fournisseur. Chaque variante (modèle + couleur) possède un code unique et un EAN13.
                  Assurez-vous que ces codes sont renseignés dans la fiche produit/variante correspondante dans l'admin produits.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Modèle</TableHead>
                      <TableHead>Couleur</TableHead>
                      <TableHead>Code Produit Fournisseur</TableHead>
                      <TableHead>EAN13</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SUPPLIER_PRODUCTS.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{p.model}</TableCell>
                        <TableCell>{p.color}</TableCell>
                        <TableCell className="font-mono text-sm">{p.code}</TableCell>
                        <TableCell className="font-mono text-sm">{p.ean13}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB: Documentation API ────────────────────────────────────── */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Documentation des endpoints API
                </CardTitle>
                <CardDescription>
                  Endpoints disponibles pour l'intégration avec le système du fournisseur. Ces URLs peuvent être appelées directement par le système externe.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Import Stock Endpoint */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-green-600 text-white">POST</Badge>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {baseUrl}/api/supplier/stock/import
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Reçoit les données de stock du fournisseur et met à jour les quantités en stock et en transit des produits/variantes correspondants.
                  </p>
                  <div>
                    <Label className="text-xs text-muted-foreground">Format du body (JSON)</Label>
                    <pre className="mt-1 p-3 rounded-md bg-muted text-xs font-mono overflow-auto">{`{
  "key": "ExportStockValentin",
  "data": [
    {
      "Ean13": 3364549284619,
      "CodeProduit": "662201 078 38",
      "EnStock": 10,
      "EnTransit": 5
    }
  ]
}`}</pre>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Réponse</Label>
                    <pre className="mt-1 p-3 rounded-md bg-muted text-xs font-mono overflow-auto">{`{
  "success": true,
  "summary": {
    "total": 19,
    "matched": 15,
    "unmatched": 4,
    "errors": 0,
    "importKey": "ExportStockValentin",
    "importedAt": "2026-03-12T10:00:00.000Z"
  },
  "results": [...]
}`}</pre>
                  </div>
                </div>

                <hr />

                {/* Export Orders Endpoint */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-600 text-white">GET</Badge>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {baseUrl}/api/supplier/orders/export
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Retourne les commandes avec les informations de paiement et les données clients. Inclut les codes produits fournisseur dans chaque ligne de commande.
                  </p>
                  <div>
                    <Label className="text-xs text-muted-foreground">Paramètres query</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Paramètre</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-mono text-xs">limit</TableCell>
                          <TableCell>number</TableCell>
                          <TableCell>Nombre max de commandes (défaut: 50)</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-mono text-xs">offset</TableCell>
                          <TableCell>number</TableCell>
                          <TableCell>Décalage pour la pagination (défaut: 0)</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Réponse (extrait)</Label>
                    <pre className="mt-1 p-3 rounded-md bg-muted text-xs font-mono overflow-auto">{`{
  "success": true,
  "exportedAt": "2026-03-12T10:00:00.000Z",
  "count": 5,
  "data": [
    {
      "order": {
        "number": "ORD-2026-001",
        "status": "CONFIRMED",
        "totalTTC": "12500.00",
        "depositAmount": "3750.00"
      },
      "items": [
        {
          "productName": "Neptune V2",
          "variantName": "Sterling Silver",
          "quantity": 1,
          "supplierProductCode": "662201 078 38",
          "ean13": "3364549284619"
        }
      ],
      "payments": [...],
      "client": {
        "companyName": "Spa Paradise SARL",
        "vatNumber": "FR12345678901",
        "email": "contact@spaparadise.fr"
      }
    }
  ]
}`}</pre>
                  </div>
                </div>

                <hr />

                {/* Matching Logic */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Logique de matching</h3>
                  <p className="text-sm text-muted-foreground">
                    Lors de l'import, le système recherche les produits/variantes dans cet ordre :
                  </p>
                  <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground">
                    <li>Match par <code className="bg-muted px-1 rounded">CodeProduit</code> sur les variantes (<code>supplierProductCode</code>)</li>
                    <li>Match par <code className="bg-muted px-1 rounded">Ean13</code> sur les variantes (<code>ean13</code>)</li>
                    <li>Match par <code className="bg-muted px-1 rounded">CodeProduit</code> sur les produits parents</li>
                    <li>Match par <code className="bg-muted px-1 rounded">Ean13</code> sur les produits parents</li>
                  </ol>
                  <p className="text-sm text-muted-foreground">
                    Le premier match trouvé est utilisé. Si aucun match n'est trouvé, l'item est marqué comme "non trouvé" dans le rapport.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
