import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
// Authentication: local email/password + JWT sessions
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { verifyMetaWebhook, processMetaWebhook } from "../meta-leads";

import { initializeWebSocket } from "./websocket";
import { webhooksRouter } from "../webhooks";
import { handleMollieWebhook } from "../mollie-webhook";
import { getPrivacyHTML, getTermsHTML } from "../static-pages";
import { inboundLeadsRouter } from "../routes/inbound-leads";
import { uploadResourceRouter } from "../routes/upload-resource";
import { supplierStockRouter } from "../routes/supplier-stock";
import { orderPdfRouter } from "../routes/order-pdf";
import { validateEnv } from "./env";
import { mobileAuthRouter } from "../routes/mobile-auth";
import { mobileApiRouter } from "../routes/mobile-api";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Validate environment variables at startup
  validateEnv();

  const app = express();
  const server = createServer(app);

  // Trust proxy (required for rate limiting behind reverse proxy)
  app.set("trust proxy", 1);

  // CORS middleware (manual implementation for ESM compatibility)
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    // Allow all origins for mobile API, specific patterns for web
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With,X-Device-Id,X-Platform");
    res.setHeader("Access-Control-Expose-Headers", "X-Total-Count");
    res.setHeader("Access-Control-Max-Age", "86400");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  // Security headers with Helmet
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP to allow Vite/React to work
    crossOriginEmbedderPolicy: false,
  }));

  // Rate limiting for authentication endpoints (20 requests per 15 minutes)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per window
    message: "Too many authentication attempts, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Rate limiting for API endpoints (1000 requests per minute)
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // 1000 requests per window (augmenté pour éviter les faux positifs avec le polling)
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: { json: { message: "Too many requests, please try again later.", code: -32000, data: { code: "TOO_MANY_REQUESTS", httpStatus: 429 } } }
      });
    },
  });

  // Apply rate limiting to auth routes
  app.use("/api/auth", authLimiter);
  
  // Apply rate limiting to API routes
  app.use("/api/trpc", apiLimiter);
  
  // Initialize WebSocket
  initializeWebSocket(server);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ limit: "100mb", extended: true }));


  // Meta OAuth Callback - Redirects to frontend with code parameter
  app.get("/api/auth/meta/callback", (req, res) => {
    console.log(`[Meta OAuth Callback] Full URL: ${req.originalUrl}`);
    console.log(`[Meta OAuth Callback] Query params:`, JSON.stringify(req.query));
    
    const code = req.query.code as string;
    const state = req.query.state as string;
    const error = req.query.error as string;
    const errorReason = req.query.error_reason as string;
    const errorDescription = req.query.error_description as string;

    if (error) {
      console.error(`[Meta OAuth] Error: ${error} - ${errorReason} - ${errorDescription}`);
      res.redirect(302, `/admin/leads?meta_error=${encodeURIComponent(errorDescription || error)}`);
      return;
    }

    if (!code) {
      console.warn(`[Meta OAuth] No code received. State: ${state}. All query params:`, req.query);
      // Instead of showing error, redirect with state so frontend can handle
      // Facebook Login for Business may not return code in some configurations
      if (state) {
        res.redirect(302, `/admin/leads?state=${encodeURIComponent(state)}&meta_error=no_code_received`);
      } else {
        res.redirect(302, "/admin/leads?meta_error=no_code");
      }
      return;
    }

    console.log(`[Meta OAuth] Code received (length: ${code.length}), redirecting to frontend`);
    // Redirect to frontend with code and state
    const params = new URLSearchParams();
    params.set("code", code);
    if (state) params.set("state", state);
    res.redirect(302, `/admin/leads?${params.toString()}`);
  });

  // Google Analytics 4 OAuth Callback
  app.get("/api/google-analytics/callback", (req, res) => {
    console.log(`[GA4 OAuth Callback] Full URL: ${req.originalUrl}`);
    const code = req.query.code as string;
    const state = req.query.state as string;
    const error = req.query.error as string;
    const errorDescription = req.query.error_description as string;

    if (error) {
      console.error(`[GA4 OAuth] Error: ${error} - ${errorDescription}`);
      res.redirect(302, `/admin/leads?ga4_error=${encodeURIComponent(errorDescription || error)}`);
      return;
    }

    if (!code) {
      res.redirect(302, "/admin/leads?ga4_error=no_code");
      return;
    }

    const params = new URLSearchParams();
    params.set("code", code);
    params.set("ga4", "true");
    if (state) params.set("state", state);
    res.redirect(302, `/admin/leads?${params.toString()}`);
  });

  // Google Ads / Google Analytics 4 OAuth Callback
  // Les deux flux partagent la même URI de redirection pour éviter d'en ajouter une nouvelle dans la console OAuth.
  // Le flux GA4 est distingué par le préfixe "ga4:" dans le paramètre `state`.
  app.get("/api/google-ads/callback", (req, res) => {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const error = req.query.error as string;
    const errorDescription = req.query.error_description as string;

    // Déterminer si c'est un callback GA4 ou Google Ads
    const isGa4Callback = state && state.startsWith("ga4:");
    const logPrefix = isGa4Callback ? "[GA4 OAuth Callback]" : "[Google Ads OAuth Callback]";

    console.log(`${logPrefix} Full URL: ${req.originalUrl}`);
    console.log(`${logPrefix} Query params:`, JSON.stringify(req.query));

    if (error) {
      console.error(`${logPrefix} Error: ${error} - ${errorDescription}`);
      if (isGa4Callback) {
        res.redirect(302, `/admin/leads?ga4_error=${encodeURIComponent(errorDescription || error)}`);
      } else {
        res.redirect(302, `/admin/leads?google_error=${encodeURIComponent(errorDescription || error)}`);
      }
      return;
    }

    if (!code) {
      console.warn(`${logPrefix} No code received. State: ${state}. All query params:`, req.query);
      if (isGa4Callback) {
        res.redirect(302, "/admin/leads?ga4_error=no_code");
      } else if (state) {
        res.redirect(302, `/admin/leads?state=${encodeURIComponent(state)}&google_error=no_code_received`);
      } else {
        res.redirect(302, "/admin/leads?google_error=no_code");
      }
      return;
    }

    console.log(`${logPrefix} Code received (length: ${code.length}), redirecting to frontend`);

    const params = new URLSearchParams();
    params.set("code", code);
    if (isGa4Callback) {
      // Flux GA4 : rediriger vers la page leads avec flag ga4=true
      params.set("ga4", "true");
      // Transmettre le state sans le préfixe "ga4:"
      const cleanState = state.slice(4); // retire "ga4:"
      if (cleanState) params.set("state", cleanState);
      res.redirect(302, `/admin/leads?${params.toString()}`);
    } else {
      // Flux Google Ads : rediriger vers la page leads
      params.set("google_ads", "true");
      if (state) params.set("state", state);
      res.redirect(302, `/admin/leads?${params.toString()}`);
    }
  });

  // Shopify OAuth Callback
  app.get("/api/shopify/callback", async (req, res) => {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const hmac = req.query.hmac as string;
    const shop = req.query.shop as string;
    const error = req.query.error as string;

    console.log("[Shopify OAuth Callback] Query params:", JSON.stringify(req.query));

    if (error) {
      console.error("[Shopify OAuth Callback] Error:", error);
      res.redirect(302, `/admin/leads?shopify_error=${encodeURIComponent(error)}`);
      return;
    }

    if (!code || !shop) {
      console.warn("[Shopify OAuth Callback] Missing code or shop");
      res.redirect(302, "/admin/leads?shopify_error=missing_code");
      return;
    }

    try {
      // Importer les modules nécessaires
      const { exchangeShopifyCode, getShopInfo } = await import("../shopify-api");
      const { upsertShopifyAccount } = await import("../db");

      const clientId = process.env.SHOPIFY_CLIENT_ID || '';
      const clientSecret = process.env.SHOPIFY_CLIENT_SECRET || '';

      if (!clientId || !clientSecret) {
        throw new Error('SHOPIFY_CLIENT_ID ou SHOPIFY_CLIENT_SECRET non configuré');
      }

      // Échanger le code contre un token
      const tokenData = await exchangeShopifyCode(shop, code, clientId, clientSecret);
      console.log("[Shopify OAuth Callback] Token obtained, scope:", tokenData.scope);

      // Récupérer les infos de la boutique
      let shopInfo: { name?: string; email?: string; currencyCode?: string } = {};
      try {
        shopInfo = await getShopInfo(shop, tokenData.access_token);
      } catch (e) {
        console.warn("[Shopify OAuth Callback] Could not fetch shop info:", e);
      }

      // Extraire l'userId du state (format: "shopify:userId")
      let userId = 1; // fallback admin
      if (state && state.startsWith('shopify:')) {
        const parsed = parseInt(state.slice(8), 10);
        if (!isNaN(parsed)) userId = parsed;
      }

      // Sauvegarder en BDD
      await upsertShopifyAccount(
        userId,
        shop,
        tokenData.access_token,
        tokenData.scope,
        shopInfo.name,
        shopInfo.email,
        shopInfo.currencyCode
      );

      console.log(`[Shopify OAuth Callback] Account saved for user ${userId}, shop: ${shop}`);
      res.redirect(302, "/admin/leads?shopify=true");
    } catch (err) {
      console.error("[Shopify OAuth Callback] Error:", err);
      const msg = err instanceof Error ? err.message : 'unknown_error';
      res.redirect(302, `/admin/leads?shopify_error=${encodeURIComponent(msg)}`);
    }
  });

  // Meta Lead Ads Webhook
  // GET - Vérification du webhook par Meta
  app.get("/api/webhooks/meta-leads", (req, res) => {
    const mode = req.query["hub.mode"] as string;
    const token = req.query["hub.verify_token"] as string;
    const challenge = req.query["hub.challenge"] as string;

    const result = verifyMetaWebhook(mode, token, challenge);
    if (result) {
      console.log("[Meta Webhook] Vérification réussie");
      res.status(200).send(result);
    } else {
      console.log("[Meta Webhook] Vérification échouée");
      res.status(403).send("Forbidden");
    }
  });

  // POST - Réception des leads
  app.post("/api/webhooks/meta-leads", async (req, res) => {
    try {
      console.log("[Meta Webhook] Lead reçu:", JSON.stringify(req.body));
      await processMetaWebhook(req.body);
      res.status(200).send("EVENT_RECEIVED");
    } catch (error) {
      console.error("[Meta Webhook] Erreur:", error);
      res.status(500).send("Error processing webhook");
    }
  });

  // Mollie Webhook - payment status updates
  app.post("/api/webhooks/mollie", handleMollieWebhook);

  // Admin: Simulate Mollie payment received (TEST MODE ONLY)
  app.post("/api/admin/simulate-payment", express.json(), async (req, res) => {
    try {
      const { isMollieTestMode } = await import("../mollie");
      if (!isMollieTestMode()) {
        return res.status(403).json({ error: "Simulation only available in test mode" });
      }

      // Verify admin auth via JWT
      const authHeader = req.headers.authorization;
      const cookieToken = req.cookies?.token;
      const token = authHeader?.replace('Bearer ', '') || cookieToken;
      if (!token) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const jwt = await import("jsonwebtoken");
      let decoded: any;
      try {
        decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'dev-secret');
      } catch {
        return res.status(401).json({ error: "Invalid token" });
      }

      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({ error: "orderId is required" });
      }

      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: "Database not available" });
      }

      const { orders, molliePayments, orderStatusHistory } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      // Get the order
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.status !== 'PAYMENT_PENDING') {
        return res.status(400).json({ error: `Order status is '${order.status}', expected 'PAYMENT_PENDING'` });
      }

      // Update order status to DEPOSIT_PAID
      await db.update(orders).set({
        status: 'DEPOSIT_PAID',
        depositPaid: true,
        mollieStatus: 'paid',
      }).where(eq(orders.id, orderId));

      // Update mollie_payments table if exists
      if (order.molliePaymentId) {
        await db.update(molliePayments).set({
          mollieStatus: 'paid',
          paidAt: new Date(),
        }).where(eq(molliePayments.molliePaymentId, order.molliePaymentId));
      }

      // Add status history
      await db.insert(orderStatusHistory).values({
        orderId,
        oldStatus: order.status,
        newStatus: 'DEPOSIT_PAID',
        note: `[TEST] Paiement simulé par admin (${decoded.email})`,
      });

      // Send notification
      try {
        const { notifyPaymentReceived } = await import("../notification-service");
        await notifyPaymentReceived(orderId, order.orderNumber, "deposit");
      } catch (e) {
        console.log("[Simulate] Notification skipped:", (e as any).message);
      }

      console.log(`[Simulate Payment] Admin ${decoded.email} simulated payment for order ${order.orderNumber} (ID: ${orderId})`);

      return res.json({
        success: true,
        message: `Paiement simulé avec succès pour la commande ${order.orderNumber}`,
        order: {
          id: orderId,
          orderNumber: order.orderNumber,
          oldStatus: order.status,
          newStatus: 'DEPOSIT_PAID',
        },
      });
    } catch (error: any) {
      console.error("[Simulate Payment] Error:", error.message);
      return res.status(500).json({ error: error.message });
    }
  });

  // Webhooks Make (routes HTTP standard)
  app.use("/api/webhooks", webhooksRouter);
  // Inbound leads (formulaire Shopify + emails entrants)
  app.use(inboundLeadsRouter);
  // Mobile auth routes (login, refresh, logout, push tokens)
  app.use(mobileAuthRouter);
  // Mobile optimized API endpoints (v1)
  app.use(mobileApiRouter);
  // Resource upload - multipart/form-data for large files (videos, etc.)
  app.use(uploadResourceRouter);
  // Supplier stock integration API
  app.use(supplierStockRouter);
  // Order PDF export
  app.use(orderPdfRouter);
  // Download ZIP - multiple resources
  app.get("/api/resources/download-zip", async (req, res) => {
    try {
      const idsParam = req.query.ids as string;
      if (!idsParam) {
        return res.status(400).json({ error: "Missing ids parameter" });
      }
      const ids = idsParam.split(",").map(Number).filter(n => !isNaN(n));
      if (ids.length === 0) {
        return res.status(400).json({ error: "No valid ids provided" });
      }
      if (ids.length > 50) {
        return res.status(400).json({ error: "Maximum 50 files per ZIP" });
      }

      const { default: archiver } = await import("archiver");
      const { getAllResources, incrementResourceDownload } = await import("../db");
      
      const allResources = await getAllResources({ isActive: true });
      const toZip = allResources.filter(r => ids.includes(r.id));
      
      if (toZip.length === 0) {
        return res.status(404).json({ error: "No resources found" });
      }

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="ressources-market-spas-${Date.now()}.zip"`);

      const archive = archiver("zip", { zlib: { level: 5 } });
      archive.on("error", (err: Error) => {
        console.error("[ZIP] Archive error:", err.message);
        if (!res.headersSent) res.status(500).json({ error: "ZIP creation failed" });
      });
      archive.pipe(res);

      for (const resource of toZip) {
        try {
          const fileResponse = await fetch(resource.fileUrl);
          if (!fileResponse.ok) continue;
          const buffer = Buffer.from(await fileResponse.arrayBuffer());
          const ext = resource.fileUrl.split(".").pop()?.split("?")[0] ?? "bin";
          const safeName = resource.title.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ\s\-_]/g, "").trim();
          archive.append(buffer, { name: `${safeName}.${ext}` });
          await incrementResourceDownload(resource.id);
        } catch (err) {
          console.error(`[ZIP] Failed to fetch ${resource.title}:`, (err as Error).message);
        }
      }

      await archive.finalize();
    } catch (err) {
      console.error("[ZIP] Error:", (err as Error).message);
      if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
    }
  });

  // Thumbnail on-the-fly generation with S3 caching
  app.get("/api/resources/thumbnail/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

      const { getDb } = await import("../db");
      const { resources } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const { generateThumbnailFromUrl, isThumbableImage, setCachedThumb } = await import("../thumbnail");

      const drizzleDb = await getDb();
      const [resource] = await drizzleDb.select({
        id: resources.id,
        fileUrl: resources.fileUrl,
        fileType: resources.fileType,
        thumbnailUrl: resources.thumbnailUrl,
      }).from(resources).where(eq(resources.id, id)).limit(1);

      if (!resource) return res.status(404).json({ error: "Not found" });

      // If thumbnail already exists, redirect to it
      if (resource.thumbnailUrl) {
        return res.redirect(301, resource.thumbnailUrl);
      }

      // If not an image, redirect to original
      if (!isThumbableImage(resource.fileType)) {
        return res.redirect(302, resource.fileUrl);
      }

      // Generate thumbnail on-the-fly
      const thumbUrl = await generateThumbnailFromUrl(resource.fileUrl, resource.id);

      // Save to DB for future requests
      await drizzleDb.update(resources).set({ thumbnailUrl: thumbUrl }).where(eq(resources.id, id));
      setCachedThumb(id, thumbUrl);

      // Redirect to the generated thumbnail
      return res.redirect(301, thumbUrl);
    } catch (err) {
      console.error("[Thumbnail] Error:", (err as Error).message);
      // Fallback: redirect to original
      try {
        const { getDb } = await import("../db");
        const { resources } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const drizzleDb = await getDb();
        const [resource] = await drizzleDb.select({ fileUrl: resources.fileUrl }).from(resources).where(eq(resources.id, parseInt(req.params.id))).limit(1);
        if (resource) return res.redirect(302, resource.fileUrl);
      } catch {}
      return res.status(500).json({ error: "Thumbnail generation failed" });
    }
  });

  // Batch thumbnail generation endpoint (admin only)
  app.post("/api/resources/generate-thumbnails", async (req, res) => {
    try {
      const { sdk: authSdk } = await import("./sdk");
      const user = await authSdk.authenticateRequest(req);
      if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
        return res.status(403).json({ error: "Admin only" });
      }

      const { getDb } = await import("../db");
      const { resources } = await import("../../drizzle/schema");
      const { isNull, eq, or, sql } = await import("drizzle-orm");
      const { generateThumbnailFromUrl, isThumbableImage } = await import("../thumbnail");

      const drizzleDb = await getDb();
      const allResources = await drizzleDb.select({
        id: resources.id,
        fileUrl: resources.fileUrl,
        fileType: resources.fileType,
        thumbnailUrl: resources.thumbnailUrl,
      }).from(resources).where(
        or(isNull(resources.thumbnailUrl), sql`${resources.thumbnailUrl} = ''`)
      );

      const imagesToProcess = allResources.filter(r => isThumbableImage(r.fileType));
      let generated = 0;
      let failed = 0;

      // Process in batches of 3 to avoid overwhelming the server
      for (let i = 0; i < imagesToProcess.length; i += 3) {
        const batch = imagesToProcess.slice(i, i + 3);
        const results = await Promise.allSettled(
          batch.map(async (r) => {
            const thumbUrl = await generateThumbnailFromUrl(r.fileUrl, r.id);
            await drizzleDb.update(resources).set({ thumbnailUrl: thumbUrl }).where(eq(resources.id, r.id));
            return thumbUrl;
          })
        );
        for (const result of results) {
          if (result.status === "fulfilled") generated++;
          else failed++;
        }
      }

      return res.json({ success: true, total: imagesToProcess.length, generated, failed });
    } catch (err) {
      console.error("[Batch Thumbnails] Error:", (err as Error).message);
      return res.status(500).json({ error: "Batch thumbnail generation failed" });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Serve static HTML pages (MUST be before Vite/React routes)
  // These pages are served as pure HTML without requiring authentication
  app.get("/privacy", (_req, res) => {
    res.status(200).set({ "Content-Type": "text/html" }).send(getPrivacyHTML());
  });
  
  app.get("/terms", (_req, res) => {
    res.status(200).set({ "Content-Type": "text/html" }).send(getTermsHTML());
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Extend server timeouts for large file uploads (5 minutes)
  server.keepAliveTimeout = 300000;
  server.headersTimeout = 305000;
  server.timeout = 300000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Démarrer la synchronisation automatique des leads Meta (toutes les 60 secondes)
    import("../jobs/syncMetaLeads").then(({ startMetaLeadsSyncJob }) => {
      startMetaLeadsSyncJob();
    }).catch(console.error);

    // Démarrer le job d'envoi des newsletters programmées (toutes les 60 secondes)
    import("../jobs/sendScheduledNewsletters").then(({ startScheduledNewsletterJob }) => {
      startScheduledNewsletterJob();
    }).catch(console.error);

    // Démarrer le job de libération des réservations de panier expirées (toutes les 60 secondes)
    import("../cart-reservation").then(({ releaseExpiredCartReservations }) => {
      setInterval(async () => {
        try {
          await releaseExpiredCartReservations();
        } catch (err) {
          console.error("[Cart Reservation Job] Error:", err);
        }
      }, 60 * 1000); // Every 60 seconds
      console.log("[Cart Reservation] Cleanup job started (every 60s)");
    }).catch(console.error);
  });
}

startServer().catch(console.error);
