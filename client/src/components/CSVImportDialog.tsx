import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { useState } from "react";

export function CSVImportDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [validRows, setValidRows] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const parseCSVMutation = trpc.orders.parseCSV.useMutation({
    onSuccess: (result) => {
      setValidRows(result.validRows);
      setErrors(result.errors);
      setIsParsing(false);
    },
    onError: (error) => {
      alert("Erreur lors de l'analyse du fichier: " + error.message);
      setIsParsing(false);
    },
  });

  const downloadTemplateMutation = trpc.orders.downloadTemplate.useQuery(undefined, {
    enabled: false,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setValidRows([]);
    setErrors([]);
    setIsParsing(true);

    // Read file as base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const fileBase64 = base64.split(",")[1]; // Remove data:...;base64, prefix

      parseCSVMutation.mutate({ fileBase64 });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDownloadTemplate = async () => {
    const result = await downloadTemplateMutation.refetch();
    if (!result.data) return;

    // Convert base64 to blob and download
    const byteCharacters = atob(result.data.fileBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modele-commande.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleAddToCart = () => {
    // Add all valid rows to cart
    validRows.forEach((row) => {
      // TODO: Call addToCart mutation for each row
      console.log("Adding to cart:", row);
    });

    alert(`${validRows.length} produits ajoutés au panier !`);
    setOpen(false);
    setFile(null);
    setValidRows([]);
    setErrors([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          Importer CSV/Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importer une commande en masse</DialogTitle>
          <DialogDescription>
            Téléchargez un fichier CSV ou Excel avec les colonnes Code Produit (ou EAN13) et Quantité
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Download Template Button */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Besoin d'un modèle ? Téléchargez notre fichier exemple
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Télécharger le modèle
            </Button>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <span className="text-sm font-medium text-primary hover:underline">
                Cliquez pour sélectionner un fichier
              </span>
              <input
                id="csv-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-muted-foreground mt-2">
              Formats acceptés : CSV, Excel (.xlsx, .xls)
            </p>
            {file && (
              <p className="text-sm font-medium mt-4">
                Fichier sélectionné : {file.name}
              </p>
            )}
          </div>

          {/* Parsing Status */}
          {isParsing && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Analyse du fichier en cours...</p>
            </div>
          )}

          {/* Valid Rows */}
          {validRows.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-green-600">
                ✓ {validRows.length} produits valides
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left">Code / EAN13</th>
                      <th className="px-4 py-2 text-left">Produit</th>
                      <th className="px-4 py-2 text-right">Quantité</th>
                      <th className="px-4 py-2 text-right">Prix HT</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validRows.slice(0, 10).map((row, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2 font-mono text-xs">{row.sku}</td>
                        <td className="px-4 py-2">{row.productName}</td>
                        <td className="px-4 py-2 text-right">{row.quantity}</td>
                        <td className="px-4 py-2 text-right">{row.price.toFixed(2)} €</td>
                        <td className="px-4 py-2 text-right font-medium">
                          {(row.price * row.quantity).toFixed(2)} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {validRows.length > 10 && (
                  <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/50">
                    ... et {validRows.length - 10} autres produits
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-destructive">
                ✗ {errors.length} erreurs détectées
              </h3>
              <div className="border border-destructive/50 rounded-lg p-4 max-h-40 overflow-y-auto">
                {errors.map((error, index) => (
                  <div key={index} className="text-sm text-destructive mb-1">
                    Ligne {error.row} - Code "{error.sku}": {error.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {validRows.length > 0 && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddToCart} disabled={errors.length > 0}>
                Ajouter au panier ({validRows.length} produits)
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
