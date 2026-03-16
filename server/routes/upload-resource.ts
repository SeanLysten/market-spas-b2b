import { Router, Request, Response } from "express";
import multer from "multer";
import { storagePut } from "../storage";
import { getDb } from "../db";
import { resources } from "../../drizzle/schema";
import { sdk } from "../_core/sdk";

const router = Router();

// Multer config: memory storage, 50 MB max per file (reduced from 500MB to avoid proxy timeouts)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB per file
    files: 5, // max 5 files at once to avoid timeout
  },
});

// Single file upload endpoint - more reliable for large files
const uploadSingle = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB per file
    files: 1,
  },
});

// POST /api/upload/resource/single
// Upload a single file - more reliable for large files (avoids proxy timeouts)
router.post(
  "/api/upload/resource/single",
  (req: Request, res: Response, next) => {
    // Extend timeout for upload requests (5 minutes)
    req.setTimeout(300000);
    res.setTimeout(300000);
    next();
  },
  uploadSingle.single("file"),
  async (req: Request, res: Response) => {
    try {
      // Auth check via session cookie
      let user: Awaited<ReturnType<typeof sdk.authenticateRequest>>;
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        return res.status(401).json({ error: "Non autorisé" });
      }

      // Only admins can upload resources
      const adminRoles = ["SUPER_ADMIN", "ADMIN"];
      if (!adminRoles.includes(user.role)) {
        return res.status(403).json({ error: "Accès refusé" });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "Aucun fichier reçu" });
      }

      const db = await getDb();

      const sanitizedName = file.originalname.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
      const fileKey = `resources/${Date.now()}-${sanitizedName}`;

      console.log(`[upload-resource/single] Uploading ${file.originalname} (${(file.size / 1024 / 1024).toFixed(1)} MB) to S3...`);

      // Upload to S3
      const { url } = await storagePut(fileKey, file.buffer, file.mimetype);

      console.log(`[upload-resource/single] S3 upload complete: ${url}`);

      // Parse metadata from form fields
      const title = (req.body.title as string) || file.originalname.replace(/\.[^/.]+$/, "");
      const category = (req.body.category as string) || "general";
      const language = (req.body.language as string) || "fr";
      const isPublic = req.body.isPublic !== "false";
      const requiredPartnerLevel = (req.body.requiredPartnerLevel as string) || "BRONZE";
      const folderId = req.body.folderId && req.body.folderId !== "null"
        ? parseInt(req.body.folderId as string)
        : null;

      // Insert into DB
      const [created] = await db.insert(resources).values({
        title,
        description: null,
        category,
        language,
        fileUrl: url,
        fileType: file.mimetype,
        fileSize: file.size,
        isPublic,
        isActive: true,
        requiredPartnerLevel,
        uploadedBy: user.id,
        folderId,
      });

      return res.json({
        success: true,
        file: {
          id: (created as any)?.insertId || null,
          title,
          fileUrl: url,
          fileType: file.mimetype,
          fileSize: file.size,
          folderId,
        },
      });
    } catch (error: any) {
      console.error("[upload-resource/single] Error:", error);
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "Fichier trop volumineux (max 50 MB)" });
      }
      return res.status(500).json({ error: error.message || "Erreur lors de l'upload" });
    }
  }
);

// POST /api/upload/resource (legacy multi-file endpoint, kept for backward compatibility)
router.post(
  "/api/upload/resource",
  (req: Request, res: Response, next) => {
    // Extend timeout for upload requests (5 minutes)
    req.setTimeout(300000);
    res.setTimeout(300000);
    next();
  },
  upload.array("files", 5),
  async (req: Request, res: Response) => {
    try {
      // Auth check via session cookie
      let user: Awaited<ReturnType<typeof sdk.authenticateRequest>>;
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        return res.status(401).json({ error: "Non autorisé" });
      }

      // Only admins can upload resources
      const adminRoles = ["SUPER_ADMIN", "ADMIN"];
      if (!adminRoles.includes(user.role)) {
        return res.status(403).json({ error: "Accès refusé" });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "Aucun fichier reçu" });
      }

      const db = await getDb();
      const results = [];

      for (const file of files) {
        const sanitizedName = file.originalname.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
        const fileKey = `resources/${Date.now()}-${sanitizedName}`;

        console.log(`[upload-resource] Uploading ${file.originalname} (${(file.size / 1024 / 1024).toFixed(1)} MB) to S3...`);

        // Upload to S3
        const { url } = await storagePut(fileKey, file.buffer, file.mimetype);

        console.log(`[upload-resource] S3 upload complete: ${url}`);

        // Parse metadata from form fields
        const title = (req.body.title as string) || file.originalname.replace(/\.[^/.]+$/, "");
        const category = (req.body.category as string) || "general";
        const language = (req.body.language as string) || "fr";
        const isPublic = req.body.isPublic !== "false";
        const requiredPartnerLevel = (req.body.requiredPartnerLevel as string) || "BRONZE";
        const folderId = req.body.folderId && req.body.folderId !== "null"
          ? parseInt(req.body.folderId as string)
          : null;

        // Insert into DB
        const [created] = await db.insert(resources).values({
          title,
          description: null,
          category,
          language,
          fileUrl: url,
          fileType: file.mimetype,
          fileSize: file.size,
          isPublic,
          isActive: true,
          requiredPartnerLevel,
          uploadedBy: user.id,
          folderId,
        });

        results.push({
          id: (created as any)?.insertId || null,
          title,
          fileUrl: url,
          fileType: file.mimetype,
          fileSize: file.size,
          folderId,
        });
      }

      return res.json({ success: true, uploaded: results.length, files: results });
    } catch (error: any) {
      console.error("[upload-resource] Error:", error);
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "Fichier trop volumineux (max 50 MB)" });
      }
      return res.status(500).json({ error: error.message || "Erreur lors de l'upload" });
    }
  }
);

export { router as uploadResourceRouter };
