import { useState } from "react";
import { Upload, Check, X, AlertCircle, ChevronDown, ChevronUp, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UploadItem } from "@/hooks/useUploadQueue";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadProgressPanelProps {
  items: UploadItem[];
  isUploading: boolean;
  completedCount: number;
  errorCount: number;
  totalCount: number;
  overallProgress: number;
  onRetryFailed: () => void;
  onRetrySingle: (itemId: string) => void;
  onDismissCompleted: () => void;
  onDismissAll: () => void;
}

export default function UploadProgressPanel({
  items,
  isUploading,
  completedCount,
  errorCount,
  totalCount,
  overallProgress,
  onRetryFailed,
  onRetrySingle,
  onDismissCompleted,
  onDismissAll,
}: UploadProgressPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[70vh] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isUploading ? (
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          ) : errorCount > 0 ? (
            <AlertCircle className="w-4 h-4 text-orange-500" />
          ) : (
            <Check className="w-4 h-4 text-green-600" />
          )}
          <span className="text-sm font-semibold text-gray-800">
            {isUploading
              ? `Import en cours (${completedCount}/${totalCount})`
              : errorCount > 0
              ? `${completedCount} importé(s), ${errorCount} en erreur`
              : `${completedCount} fichier(s) importé(s)`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!isUploading && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                onDismissAll();
              }}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Overall progress bar */}
      {isUploading && (
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      )}

      {/* File list */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto max-h-80">
          {items.map((item) => (
            <div
              key={item.id}
              className="px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
            >
              <div className="flex items-center gap-2">
                {/* Status icon */}
                {item.status === "done" ? (
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : item.status === "error" ? (
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                ) : item.status === "uploading" ? (
                  <Upload className="w-4 h-4 text-blue-500 flex-shrink-0 animate-pulse" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                )}

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-700 truncate">{item.name}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {item.status === "uploading" && (
                        <span className="text-xs text-blue-600 font-medium">{item.progress}%</span>
                      )}
                      {item.status === "queued" && (
                        <span className="text-xs text-gray-400">En attente</span>
                      )}
                      {item.status === "done" && (
                        <span className="text-xs text-gray-400">{formatSize(item.size)}</span>
                      )}
                      {item.status === "error" && !isUploading && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRetrySingle(item.id);
                          }}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Réessayer
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar for uploading files */}
                  {item.status === "uploading" && (
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Error message */}
                  {item.status === "error" && item.errorMessage && (
                    <p className="text-xs text-red-500 mt-0.5">{item.errorMessage}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer actions */}
      {!isUploading && isExpanded && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex justify-between">
          <div>
            {errorCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={onRetryFailed}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Tout réessayer ({errorCount})
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {errorCount > 0 && completedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={onDismissCompleted}
              >
                Masquer terminés
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={onDismissAll}
            >
              Fermer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
