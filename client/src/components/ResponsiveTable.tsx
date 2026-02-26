import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useMobile";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  className?: string;
  mobileLabel?: string; // Label personnalisé pour mobile
  hideOnMobile?: boolean; // Cacher cette colonne sur mobile
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  keyExtractor: (row: any) => string | number;
  onRowClick?: (row: any) => void;
  emptyMessage?: string;
  mobileCardRender?: (row: any, columns: Column[]) => React.ReactNode; // Rendu personnalisé pour mobile
}

export function ResponsiveTable({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = "Aucune donnée disponible",
  mobileCardRender,
}: ResponsiveTableProps) {
  const isMobile = useIsMobile();

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Rendu mobile : cartes empilées
  if (isMobile) {
    return (
      <div className="space-y-4">
        {data.map((row) => {
          const key = keyExtractor(row);
          
          // Si un rendu personnalisé est fourni, l'utiliser
          if (mobileCardRender) {
            return (
              <Card
                key={key}
                className={onRowClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
                onClick={() => onRowClick?.(row)}
              >
                {mobileCardRender(row, columns)}
              </Card>
            );
          }

          // Sinon, rendu par défaut
          return (
            <Card
              key={key}
              className={onRowClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
              onClick={() => onRowClick?.(row)}
            >
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {columns
                    .filter((col) => !col.hideOnMobile)
                    .map((col) => {
                      const value = row[col.key];
                      const displayValue = col.render ? col.render(value, row) : value;

                      return (
                        <div key={col.key} className="flex justify-between items-start gap-4">
                          <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                            {col.mobileLabel || col.label}
                          </span>
                          <span className="text-sm text-right flex-1">{displayValue}</span>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Rendu desktop : tableau classique
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-left p-4 text-sm font-medium text-muted-foreground ${col.className || ""}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const key = keyExtractor(row);
            return (
              <tr
                key={key}
                className={`border-b hover:bg-muted/50 transition-colors ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => {
                  const value = row[col.key];
                  const displayValue = col.render ? col.render(value, row) : value;

                  return (
                    <td key={col.key} className={`p-4 text-sm ${col.className || ""}`}>
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
