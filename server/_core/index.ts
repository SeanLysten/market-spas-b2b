import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { verifyMetaWebhook, processMetaWebhook } from "../meta-leads";
import { handleStripeWebhook } from "../stripe-webhook";
import { initializeWebSocket } from "./websocket";
import { webhooksRouter } from "../webhooks";
import { getPrivacyHTML, getTermsHTML } from "../static-pages";
import { inboundLeadsRouter } from "../routes/inbound-leads";
import { uploadResourceRouter } from "../routes/upload-resource";
import { validateEnv } from "./env";

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

  // Security headers with Helmet
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP to allow Vite/React to work
    crossOriginEmbedderPolicy: false, // Allow embedding for OAuth popups
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
  app.use("/api/oauth", authLimiter);
  app.use("/api/auth", authLimiter);
  
  // Apply rate limiting to API routes
  app.use("/api/trpc", apiLimiter);
  
  // Initialize WebSocket
  initializeWebSocket(server);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Stripe Webhook - Must be before express.json() middleware
  app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), handleStripeWebhook);

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

  // Webhooks Make (routes HTTP standard)
  app.use("/api/webhooks", webhooksRouter);
  // Inbound leads (formulaire Shopify + emails entrants)
  app.use(inboundLeadsRouter);
  // Resource upload - multipart/form-data for large files (videos, etc.)
  app.use(uploadResourceRouter);
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

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Serve static HTML pages for Google OAuth validation (MUST be before Vite/React routes)
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

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Démarrer le job périodique de traitement des arrivages
    import("../jobs/processIncomingStock").then(({ startIncomingStockJob }) => {
      startIncomingStockJob();
    }).catch(console.error);

    // Démarrer la synchronisation automatique des leads Meta (toutes les 60 secondes)
    import("../jobs/syncMetaLeads").then(({ startMetaLeadsSyncJob }) => {
      startMetaLeadsSyncJob();
    }).catch(console.error);

    // Démarrer le job d'envoi des newsletters programmées (toutes les 60 secondes)
    import("../jobs/sendScheduledNewsletters").then(({ startScheduledNewsletterJob }) => {
      startScheduledNewsletterJob();
    }).catch(console.error);
  });
}

startServer().catch(console.error);
