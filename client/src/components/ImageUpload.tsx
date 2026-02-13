import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Progress } from "@/components/ui/progress";

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  productId?: number;
  variantId?: number;
}

export function ImageUpload({ currentImageUrl, onImageUploaded, productId, variantId }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "reading" | "uploading" | "processing" | "complete">("idle");
  const [fileSize, setFileSize] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImageMutation = trpc.admin.products.uploadImage.useMutation();

  // Synchronize previewUrl when currentImageUrl changes (e.g., when opening edit dialog)
  useEffect(() => {
    setPreviewUrl(currentImageUrl || null);
  }, [currentImageUrl]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 10MB");
      return;
    }

    setFileSize(formatFileSize(file.size));
    setUploading(true);
    setUploadProgress(0);
    setUploadStatus("reading");

    try {
      // Simulate reading progress
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 30); // 0-30% for reading
          setUploadProgress(progress);
        }
      };
      
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setUploadProgress(30);
      };
      
      reader.readAsDataURL(file);

      // Wait for reader to complete
      await new Promise((resolve) => {
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
          setUploadProgress(30);
          resolve(null);
        };
      });

      // Convert to base64
      setUploadStatus("uploading");
      const base64 = await fileToBase64(file);
      setUploadProgress(60); // 60% after base64 conversion

      // Upload to server
      setUploadStatus("processing");
      const result = await uploadImageMutation.mutateAsync({
        imageData: base64,
        fileName: file.name,
        productId,
        variantId,
      });
      
      setUploadProgress(90);
      
      // Simulate final processing
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setUploadProgress(100);
      setUploadStatus("complete");
      
      onImageUploaded(result.url);
      toast.success("Image uploadée avec succès");
      
      // Reset status after a short delay
      setTimeout(() => {
        setUploadStatus("idle");
        setUploadProgress(0);
      }, 1500);
      
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors de l'upload de l'image");
      setPreviewUrl(currentImageUrl || null);
      setUploadStatus("idle");
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onImageUploaded("");
    setUploadStatus("idle");
    setUploadProgress(0);
    setFileSize("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case "reading":
        return "Lecture du fichier...";
      case "uploading":
        return "Upload en cours...";
      case "processing":
        return "Traitement de l'image...";
      case "complete":
        return "Terminé !";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {previewUrl ? (
        <div className="space-y-2">
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-48 h-48 object-contain rounded-lg border-2 border-border bg-muted/30"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-7 w-7"
              onClick={handleRemove}
              disabled={uploading}
              title="Supprimer l'image"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Upload Progress Indicator */}
          {uploading && (
            <div className="space-y-2 w-48">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{getStatusMessage()}</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              {fileSize && (
                <p className="text-xs text-muted-foreground">{fileSize}</p>
              )}
            </div>
          )}
          
          {uploadStatus === "complete" && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Image uploadée avec succès</span>
            </div>
          )}
          
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {getStatusMessage()}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Remplacer l'image
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-48 h-48 flex flex-col items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin" />
                <span>{getStatusMessage()}</span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8" />
                <span>Ajouter une image</span>
              </>
            )}
          </Button>
          
          {/* Upload Progress Indicator for initial upload */}
          {uploading && (
            <div className="space-y-2 w-48">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{getStatusMessage()}</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              {fileSize && (
                <p className="text-xs text-muted-foreground">{fileSize}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
