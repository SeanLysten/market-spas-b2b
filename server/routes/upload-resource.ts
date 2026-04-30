import { Router, Request, Response } from "express";
import multer from "multer";
import sharp from "sharp";
import { storagePut } from "../storage";
import { getDb } from "../db";
import { resources } from "../../drizzle/schema";
import { sdk } from "../_core/sdk";
import { generateThumbnailFromBuffer, isThumbableImage } from "../thumbnail";
import { eq } from "drizzle-orm";

const router = Router();

// ─── Image compression helper ─────────────────────────────────────────────────
// Compresses images to reduce file size before S3 upload
// PNG/WebP images are converted to high-quality JPEG (quality 85)
// Already-small images (<2MB) are kept as-is
async function compressImage(
  buffer: Buffer,
  mimetype: string
): Promise<{ buffer: Buffer; mimetype: string; wasCompressed: boolean }> {
  const isImage = mimetype.startsWith("image/");
  const isCompressible = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/tiff"].includes(mimetype);

  // Skip non-images or small files
  if (!isImage || !isCompressible || buffer.length < 2 * 1024 * 1024) {
    return { buffer, mimetype, wasCompressed: false };
  }

  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    const maxDimension = 4096; // Max 4K resolution

    let pipeline = sharp(buffer);

    // Resize if very large (>4096px on any side)
    if (metadata.width && metadata.width > maxDimension) {
      pipeline = pipeline.resize({ width: maxDimension, withoutEnlargement: true });
    } else if (metadata.height && metadata.height > maxDimension) {
      pipeline = pipeline.resize({ height: maxDimension, withoutEnlargement: true });
    }

    // Convert PNG to high-quality JPEG (biggest size savings)
    if (mimetype === "image/png") {
      const compressed = await pipeline
        .jpeg({ quality: 88, progressive: true, mozjpeg: true })
        .toBuffer();

      // Only use compressed version if it's actually smaller
      if (compressed.length < buffer.length * 0.9) {
        console.info(`[compress] PNG→JPEG: ${(buffer.length / 1024 / 1024).toFixed(1)}MB → ${(compressed.length / 1024 / 1024).toFixed(1)}MB (${Math.round((1 - compressed.length / buffer.length) * 100)}% saved)`);
        return { buffer: compressed, mimetype: "image/jpeg", wasCompressed: true };
      }
    }

    // For JPEG/WebP, re-compress with optimized settings
    if (mimetype === "image/jpeg" || mimetype === "image/jpg") {
      const compressed = await pipeline
        .jpeg({ quality: 88, progressive: true, mozjpeg: true })
        .toBuffer();

      if (compressed.length < buffer.length * 0.9) {
        console.info(`[compress] JPEG optimized: ${(buffer.length / 1024 / 1024).toFixed(1)}MB → ${(compressed.length / 1024 / 1024).toFixed(1)}MB`);
        return { buffer: compressed, mimetype: "image/jpeg", wasCompressed: true };
      }
    }

    if (mimetype === "image/webp") {
      const compressed = await pipeline
        .webp({ quality: 88 })
        .toBuffer();

      if (compressed.length < buffer.length * 0.9) {
        console.info(`[compress] WebP optimized: ${(buffer.length / 1024 / 1024).toFixed(1)}MB → ${(compressed.length / 1024 / 1024).toFixed(1)}MB`);
        return { buffer: compressed, mimetype: "image/webp", wasCompressed: true };
      }
    }

    // Fallback: no significant compression achieved
    return { buffer, mimetype, wasCompressed: false };
  } catch (err) {
    console.warn("[compress] Failed to compress image, using original:", err);
    return { buffer, mimetype, wasCompressed: false };
  }
}

// ─── Multer config ────────────────────────────────────────────────────────────
// Accept up to 100MB per file (will be compressed server-side before S3 upload)
const uploadSingle = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB per file (before compression)
    files: 1,
  },
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB per file
    files: 5,
  },
});

// ─── Shared upload logic ──────────────────────────────────────────────────────
async function processFileUpload(
  file: Express.Multer.File,
  body: Record<string, any>,
  userId: number
) {
  const db = await getDb();

  // Compress image if applicable
  const { buffer: finalBuffer, mimetype: finalMimetype, wasCompressed } = await compressImage(
    file.buffer,
    file.mimetype
  );

  // Determine file extension based on final mimetype
  let ext = file.originalname.match(/\.[^/.]+$/)?.[0] || "";
  if (wasCompressed && finalMimetype === "image/jpeg" && ext.toLowerCase() === ".png") {
    ext = ".jpg";
  }

  const baseName = file.originalname.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
  const fileKey = `resources/${Date.now()}-${baseName}${ext}`;

  const originalSizeMB = (file.size / 1024 / 1024).toFixed(1);
  const finalSizeMB = (finalBuffer.length / 1024 / 1024).toFixed(1);
  console.info(`[upload-resource] Uploading ${file.originalname} (${originalSizeMB}MB${wasCompressed ? ` → ${finalSizeMB}MB compressed` : ""}) to S3...`);

  // Upload to S3
  const { url } = await storagePut(fileKey, finalBuffer, finalMimetype);

  console.info(`[upload-resource] S3 upload complete: ${url}`);

  // Parse metadata from form fields
  const title = (body.title as string) || file.originalname.replace(/\.[^/.]+$/, "");
  const category = (body.category as string) || "CATALOG";
  const language = (body.language as string) || "fr";
  const isPublic = body.isPublic !== "false";
  const requiredPartnerLevel = (body.requiredPartnerLevel as string) || "BRONZE";
  const folderId = body.folderId && body.folderId !== "null"
    ? parseInt(body.folderId as string)
    : null;

  // Validate requiredPartnerLevel against enum
  const validLevels = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "VIP"];
  const resolvedLevel = validLevels.includes(requiredPartnerLevel) ? requiredPartnerLevel : "BRONZE";

  // Insert into DB
  const [created] = await db.insert(resources).values({
    title,
    description: null,
    category: category as any,
    language,
    fileUrl: url,
    fileType: finalMimetype,
    fileSize: finalBuffer.length,
    isPublic,
    isActive: true,
    requiredPartnerLevel: resolvedLevel as any,
    uploadedById: userId,
    folderId,
  });

  const insertId = (created as any)?.insertId || null;

  // Generate thumbnail for images (async, non-blocking)
  if (insertId && isThumbableImage(finalMimetype)) {
    generateThumbnailFromBuffer(finalBuffer, insertId)
      .then(async (thumbUrl) => {
        try {
          await db.update(resources).set({ thumbnailUrl: thumbUrl }).where(eq(resources.id, insertId));
          console.info(`[upload-resource] Thumbnail generated for resource ${insertId}`);
        } catch (err) {
          console.error(`[upload-resource] Failed to save thumbnail URL:`, err);
        }
      })
      .catch((err) => console.error(`[upload-resource] Thumbnail generation failed:`, err));
  }

  return {
    id: insertId,
    title,
    fileUrl: url,
    fileType: finalMimetype,
    fileSize: finalBuffer.length,
    originalSize: file.size,
    wasCompressed,
    folderId,
  };
}

// ─── Auth middleware ───────────────────────────────────────────────────────────
async function authenticateAdmin(req: Request, res: Response): Promise<Awaited<ReturnType<typeof sdk.authenticateRequest>> | null> {
  try {
    const user = await sdk.authenticateRequest(req);
    const adminRoles = ["SUPER_ADMIN", "ADMIN"];
    if (!adminRoles.includes(user.role)) {
      res.status(403).json({ error: "Accès refusé" });
      return null;
    }
    return user;
  } catch {
    res.status(401).json({ error: "Non autorisé" });
    return null;
  }
}

// ─── POST /api/upload/resource/single ─────────────────────────────────────────
// Single file upload - most reliable for large files
router.post(
  "/api/upload/resource/single",
  (req: Request, res: Response, next) => {
    req.setTimeout(600000); // 10 minutes
    res.setTimeout(600000);
    next();
  },
  uploadSingle.single("file"),
  async (req: Request, res: Response) => {
    try {
      const user = await authenticateAdmin(req, res);
      if (!user) return;

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "Aucun fichier reçu" });
      }

      const result = await processFileUpload(file, req.body, user.id);

      return res.json({
        success: true,
        file: result,
      });
    } catch (error: any) {
      console.error("[upload-resource/single] Error:", error);
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "Fichier trop volumineux (max 100 MB)" });
      }
      return res.status(500).json({ error: error.message || "Erreur lors de l'upload" });
    }
  }
);

// ─── POST /api/upload/resource ────────────────────────────────────────────────
// Legacy multi-file endpoint (kept for backward compatibility)
router.post(
  "/api/upload/resource",
  (req: Request, res: Response, next) => {
    req.setTimeout(600000);
    res.setTimeout(600000);
    next();
  },
  upload.array("files", 5),
  async (req: Request, res: Response) => {
    try {
      const user = await authenticateAdmin(req, res);
      if (!user) return;

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "Aucun fichier reçu" });
      }

      const results = [];
      for (const file of files) {
        const result = await processFileUpload(file, req.body, user.id);
        results.push(result);
      }

      return res.json({ success: true, uploaded: results.length, files: results });
    } catch (error: any) {
      console.error("[upload-resource] Error:", error);
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "Fichier trop volumineux (max 100 MB)" });
      }
      return res.status(500).json({ error: error.message || "Erreur lors de l'upload" });
    }
  }
);

export { router as uploadResourceRouter };
