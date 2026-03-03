import { Router, Request, Response } from "express";
import multer from "multer";
import { storagePut } from "../storage";
import { getDb } from "../db";
import { resources } from "../../drizzle/schema";
import { sdk } from "../_core/sdk";

const router = Router();

// Multer config: memory storage, 500 MB max per file
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB
    files: 20, // max 20 files at once
  },
});

// POST /api/upload/resource
// Accepts multipart/form-data with fields:
//   - files[]: one or more files
//   - title: string (optional, defaults to filename)
//   - category: string (default "general")
//   - language: string (default "fr")
//   - isPublic: "true" | "false" (default "true")
//   - requiredPartnerLevel: string (default "BRONZE")
//   - folderId: number | null (optional)
router.post(
  "/api/upload/resource",
  upload.array("files", 20),
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

        // Upload to S3
        const { url } = await storagePut(fileKey, file.buffer, file.mimetype);

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
        return res.status(413).json({ error: "Fichier trop volumineux (max 500 MB)" });
      }
      return res.status(500).json({ error: error.message || "Erreur lors de l'upload" });
    }
  }
);

export { router as uploadResourceRouter };
