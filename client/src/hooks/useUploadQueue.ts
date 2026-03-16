import { useState, useCallback, useRef } from "react";

export interface UploadItem {
  id: string;
  name: string;
  size: number;
  status: "queued" | "uploading" | "done" | "error";
  progress: number; // 0-100
  errorMessage?: string;
}

interface UseUploadQueueOptions {
  folderId: number | null | undefined;
  onFileUploaded?: () => void;
}

/**
 * Upload queue hook that:
 * - Uploads files one by one sequentially
 * - Uses XMLHttpRequest for real progress tracking
 * - Allows adding more files without cancelling current uploads
 * - Provides per-file progress and overall progress
 */
export function useUploadQueue({ folderId, onFileUploaded }: UseUploadQueueOptions) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const isUploadingRef = useRef(false);
  const queueRef = useRef<{ file: File; id: string; folderId: number | null | undefined }[]>([]);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const updateItem = useCallback((id: string, updates: Partial<UploadItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  const processQueue = useCallback(async () => {
    if (isUploadingRef.current) return;
    isUploadingRef.current = true;

    while (queueRef.current.length > 0) {
      const task = queueRef.current.shift();
      if (!task) break;

      const { file, id, folderId: targetFolderId } = task;

      updateItem(id, { status: "uploading", progress: 0 });

      try {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;

          // Track upload progress
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              updateItem(id, { progress: percent });
            }
          });

          xhr.addEventListener("load", () => {
            xhrRef.current = null;
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const result = JSON.parse(xhr.responseText);
                if (result.success) {
                  updateItem(id, { status: "done", progress: 100 });
                  onFileUploaded?.();
                  resolve();
                } else {
                  updateItem(id, { status: "error", errorMessage: result.error || "Erreur serveur" });
                  reject(new Error(result.error));
                }
              } catch {
                updateItem(id, { status: "error", errorMessage: "Réponse invalide" });
                reject(new Error("Invalid response"));
              }
            } else {
              let errMsg = `Erreur ${xhr.status}`;
              try {
                const d = JSON.parse(xhr.responseText);
                errMsg = d.error || errMsg;
              } catch {}
              updateItem(id, { status: "error", errorMessage: errMsg });
              reject(new Error(errMsg));
            }
          });

          xhr.addEventListener("error", () => {
            xhrRef.current = null;
            updateItem(id, { status: "error", errorMessage: "Erreur réseau" });
            reject(new Error("Network error"));
          });

          xhr.addEventListener("abort", () => {
            xhrRef.current = null;
            updateItem(id, { status: "error", errorMessage: "Annulé" });
            reject(new Error("Aborted"));
          });

          xhr.addEventListener("timeout", () => {
            xhrRef.current = null;
            updateItem(id, { status: "error", errorMessage: "Timeout" });
            reject(new Error("Timeout"));
          });

          // Build FormData
          const formData = new FormData();
          formData.append("file", file);
          formData.append("category", "CATALOG");
          formData.append("language", "fr");
          formData.append("isPublic", "false");
          formData.append("requiredPartnerLevel", "ALL");
          if (targetFolderId !== null && targetFolderId !== undefined) {
            formData.append("folderId", String(targetFolderId));
          }

          xhr.open("POST", "/api/upload/resource/single");
          xhr.withCredentials = true;
          xhr.timeout = 300000; // 5 minutes
          xhr.send(formData);
        });
      } catch {
        // Error already handled in updateItem, continue with next file
      }
    }

    isUploadingRef.current = false;
  }, [updateItem, onFileUploaded]);

  const addFiles = useCallback(
    (files: File[], targetFolderId?: number | null | undefined) => {
      const resolvedFolderId = targetFolderId !== undefined ? targetFolderId : folderId;
      const newItems: UploadItem[] = [];
      const newTasks: typeof queueRef.current = [];

      for (const file of files) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
        newItems.push({
          id,
          name: file.name,
          size: file.size,
          status: "queued",
          progress: 0,
        });
        newTasks.push({ file, id, folderId: resolvedFolderId });
      }

      // Append to existing items (don't replace)
      setItems((prev) => [...prev, ...newItems]);
      queueRef.current.push(...newTasks);

      // Start processing if not already running
      processQueue();
    },
    [folderId, processQueue]
  );

  const dismissCompleted = useCallback(() => {
    setItems((prev) => prev.filter((item) => item.status !== "done" && item.status !== "error"));
  }, []);

  const dismissAll = useCallback(() => {
    // Cancel current upload if any
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    // Clear queue
    queueRef.current = [];
    isUploadingRef.current = false;
    setItems([]);
  }, []);

  const isUploading = items.some((item) => item.status === "uploading" || item.status === "queued");
  const completedCount = items.filter((item) => item.status === "done").length;
  const errorCount = items.filter((item) => item.status === "error").length;
  const totalCount = items.length;

  // Overall progress (average of all items)
  const overallProgress =
    totalCount > 0
      ? Math.round(items.reduce((sum, item) => sum + item.progress, 0) / totalCount)
      : 0;

  return {
    items,
    addFiles,
    dismissCompleted,
    dismissAll,
    isUploading,
    completedCount,
    errorCount,
    totalCount,
    overallProgress,
  };
}
