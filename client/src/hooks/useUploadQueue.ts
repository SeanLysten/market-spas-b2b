import { useState, useCallback, useRef } from "react";

export interface UploadItem {
  id: string;
  name: string;
  size: number;
  status: "queued" | "uploading" | "done" | "error";
  progress: number; // 0-100
  errorMessage?: string;
}

interface QueueTask {
  file: File;
  id: string;
  folderId: number | null | undefined;
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
 * - Supports retry for failed uploads
 * - Provides per-file progress and overall progress
 */
export function useUploadQueue({ folderId, onFileUploaded }: UseUploadQueueOptions) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const isUploadingRef = useRef(false);
  const queueRef = useRef<QueueTask[]>([]);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  // Keep original files for retry
  const fileMapRef = useRef<Map<string, QueueTask>>(new Map());

  const updateItem = useCallback((id: string, updates: Partial<UploadItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  const uploadSingleFile = useCallback(
    (task: QueueTask): Promise<void> => {
      const { file, id, folderId: targetFolderId } = task;

      updateItem(id, { status: "uploading", progress: 0 });

      return new Promise<void>((resolve, reject) => {
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
                // Clean up file reference on success
                fileMapRef.current.delete(id);
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
          updateItem(id, { status: "error", errorMessage: "Timeout - fichier trop volumineux" });
          reject(new Error("Timeout"));
        });

        // Build FormData
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", "CATALOG");
        formData.append("language", "fr");
        formData.append("isPublic", "false");
        formData.append("requiredPartnerLevel", "BRONZE");
        if (targetFolderId !== null && targetFolderId !== undefined) {
          formData.append("folderId", String(targetFolderId));
        }

        xhr.open("POST", "/api/upload/resource/single");
        xhr.withCredentials = true;
        xhr.timeout = 600000; // 10 minutes for very large files
        xhr.send(formData);
      });
    },
    [updateItem, onFileUploaded]
  );

  const processQueue = useCallback(async () => {
    if (isUploadingRef.current) return;
    isUploadingRef.current = true;

    while (queueRef.current.length > 0) {
      const task = queueRef.current.shift();
      if (!task) break;

      try {
        await uploadSingleFile(task);
      } catch {
        // Error already handled in updateItem, continue with next file
      }
    }

    isUploadingRef.current = false;
  }, [uploadSingleFile]);

  const addFiles = useCallback(
    (files: File[], targetFolderId?: number | null | undefined) => {
      const resolvedFolderId = targetFolderId !== undefined ? targetFolderId : folderId;
      const newItems: UploadItem[] = [];
      const newTasks: QueueTask[] = [];

      for (const file of files) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
        const task: QueueTask = { file, id, folderId: resolvedFolderId };

        newItems.push({
          id,
          name: file.name,
          size: file.size,
          status: "queued",
          progress: 0,
        });
        newTasks.push(task);
        // Store for retry
        fileMapRef.current.set(id, task);
      }

      // Append to existing items (don't replace)
      setItems((prev) => [...prev, ...newItems]);
      queueRef.current.push(...newTasks);

      // Start processing if not already running
      processQueue();
    },
    [folderId, processQueue]
  );

  const retryFailed = useCallback(() => {
    const failedItems = items.filter((item) => item.status === "error");
    if (failedItems.length === 0) return;

    const retryTasks: QueueTask[] = [];

    for (const item of failedItems) {
      const originalTask = fileMapRef.current.get(item.id);
      if (originalTask) {
        retryTasks.push(originalTask);
        // Reset item status
        updateItem(item.id, { status: "queued", progress: 0, errorMessage: undefined });
      }
    }

    if (retryTasks.length > 0) {
      queueRef.current.push(...retryTasks);
      processQueue();
    }
  }, [items, updateItem, processQueue]);

  const retrySingle = useCallback(
    (itemId: string) => {
      const originalTask = fileMapRef.current.get(itemId);
      if (!originalTask) return;

      updateItem(itemId, { status: "queued", progress: 0, errorMessage: undefined });
      queueRef.current.push(originalTask);
      processQueue();
    },
    [updateItem, processQueue]
  );

  const dismissCompleted = useCallback(() => {
    setItems((prev) => {
      const kept = prev.filter((item) => item.status !== "done" && item.status !== "error");
      // Clean up file references for dismissed items
      for (const item of prev) {
        if (item.status === "done" || item.status === "error") {
          fileMapRef.current.delete(item.id);
        }
      }
      return kept;
    });
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
    fileMapRef.current.clear();
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
    retryFailed,
    retrySingle,
    dismissCompleted,
    dismissAll,
    isUploading,
    completedCount,
    errorCount,
    totalCount,
    overallProgress,
  };
}
