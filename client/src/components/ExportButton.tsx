import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { useState } from "react";

interface ExportButtonProps {
  onExport: () => Promise<{ fileBase64: string }>;
  filename: string;
  label?: string;
  variant?: "default" | "outline" | "ghost";
}

export function ExportButton({ onExport, filename, label = "Exporter Excel", variant = "outline" }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await onExport();
      
      if (!result.fileBase64) {
        toast.warning("Aucune donnée à exporter");
        return;
      }

      // Convert base64 to blob and download
      const byteCharacters = atob(result.fileBase64);
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
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erreur lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className="gap-2"
    >
      <Download className="w-4 h-4" />
      {isExporting ? "Export en cours..." : label}
    </Button>
  );
}
