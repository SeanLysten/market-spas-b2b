import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { verifyMetaWebhook, processMetaWebhook } from "../meta-leads";
import { handleStripeWebhook } from "../stripe-webhook";
import { initializeWebSocket } from "./websocket";
import { webhooksRouter } from "../webhooks";

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
  const app = express();
  const server = createServer(app);
  
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
      res.redirect(302, "/admin/leads?meta_error=no_code");
      return;
    }

    // Redirect to frontend with code and state
    const params = new URLSearchParams();
    params.set("code", code);
    if (state) params.set("state", state);
    res.redirect(302, `/admin/leads?${params.toString()}`);
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
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
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
  });
}

startServer().catch(console.error);
