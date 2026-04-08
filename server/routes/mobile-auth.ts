import { Router } from "express";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import type { Request, Response } from "express";

const router = Router();

// ============================================
// CONSTANTS
// ============================================
const ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_EXPIRY_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || process.env.COOKIE_SECRET || "fallback-secret";
  return new TextEncoder().encode(secret);
}

// ============================================
// HELPERS
// ============================================
async function createMobileAccessToken(user: {
  id: number;
  openId: string;
  name: string | null;
  role: string;
  partnerId: number | null;
}): Promise<string> {
  const secret = getJwtSecret();
  const now = Date.now();
  const expirationSeconds = Math.floor((now + ACCESS_TOKEN_EXPIRY_MS) / 1000);

  return new SignJWT({
    sub: user.id.toString(),
    openId: user.openId,
    name: user.name || "",
    role: user.role,
    partnerId: user.partnerId,
    type: "access",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(expirationSeconds)
    .sign(secret);
}

async function createMobileRefreshToken(
  userId: number,
  deviceId?: string,
  deviceName?: string,
  platform?: string
): Promise<{ token: string; expiresAt: Date }> {
  const { getDb } = await import("../db");
  const { mobileRefreshTokens } = await import("../../drizzle/schema");

  const drizzleDb = await getDb();
  const token = nanoid(64);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  await drizzleDb.insert(mobileRefreshTokens).values({
    userId,
    token,
    deviceId: deviceId || null,
    deviceName: deviceName || null,
    platform: platform || null,
    expiresAt,
  });

  return { token, expiresAt };
}

async function verifyMobileAccessToken(token: string): Promise<{
  sub: string;
  openId: string;
  name: string;
  role: string;
  partnerId: number | null;
} | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    if (payload.type !== "access") return null;

    return {
      sub: payload.sub as string,
      openId: payload.openId as string,
      name: payload.name as string,
      role: payload.role as string,
      partnerId: (payload.partnerId as number) || null,
    };
  } catch {
    return null;
  }
}

// ============================================
// POST /api/mobile/auth/login
// Login with email/password, returns access + refresh tokens
// ============================================
router.post("/api/mobile/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password, deviceId, deviceName, platform } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "EMAIL_PASSWORD_REQUIRED",
        message: "Email et mot de passe requis",
      });
    }

    const { getUserByEmail, updateUserLastLogin } = await import("../db");
    const user = await getUserByEmail(email);

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Email ou mot de passe incorrect",
      });
    }

    // Verify password
    const bcrypt = await import("bcryptjs");
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Email ou mot de passe incorrect",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        error: "ACCOUNT_DISABLED",
        message: "Votre compte a été désactivé",
      });
    }

    // Update last login
    await updateUserLastLogin(user.id, req.ip || "mobile");

    // Create tokens
    const accessToken = await createMobileAccessToken({
      id: user.id,
      openId: user.openId,
      name: user.name,
      role: user.role,
      partnerId: user.partnerId,
    });

    const refreshTokenData = await createMobileRefreshToken(
      user.id,
      deviceId,
      deviceName,
      platform
    );

    console.log(`[Mobile Auth] Login success for user #${user.id} (${user.email}) from ${platform || "unknown"}`);

    return res.json({
      accessToken,
      refreshToken: refreshTokenData.token,
      refreshTokenExpiresAt: refreshTokenData.expiresAt.toISOString(),
      user: {
        id: user.id,
        openId: user.openId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        partnerId: user.partnerId,
        locale: user.locale,
      },
    });
  } catch (err) {
    console.error("[Mobile Auth] Login error:", err);
    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Erreur interne du serveur",
    });
  }
});

// ============================================
// POST /api/mobile/auth/refresh
// Exchange refresh token for new access + refresh tokens
// ============================================
router.post("/api/mobile/auth/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: "REFRESH_TOKEN_REQUIRED",
        message: "Refresh token requis",
      });
    }

    const { getDb } = await import("../db");
    const { mobileRefreshTokens, users } = await import("../../drizzle/schema");
    const { eq, and, isNull } = await import("drizzle-orm");

    const drizzleDb = await getDb();

    // Find the refresh token
    const [storedToken] = await drizzleDb
      .select()
      .from(mobileRefreshTokens)
      .where(
        and(
          eq(mobileRefreshTokens.token, refreshToken),
          isNull(mobileRefreshTokens.revokedAt)
        )
      )
      .limit(1);

    if (!storedToken) {
      return res.status(401).json({
        error: "INVALID_REFRESH_TOKEN",
        message: "Token de rafraîchissement invalide ou révoqué",
      });
    }

    // Check expiration
    if (new Date() > storedToken.expiresAt) {
      // Revoke expired token
      await drizzleDb
        .update(mobileRefreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(mobileRefreshTokens.id, storedToken.id));

      return res.status(401).json({
        error: "REFRESH_TOKEN_EXPIRED",
        message: "Token de rafraîchissement expiré, veuillez vous reconnecter",
      });
    }

    // Get user
    const [user] = await drizzleDb
      .select()
      .from(users)
      .where(eq(users.id, storedToken.userId))
      .limit(1);

    if (!user || !user.isActive) {
      return res.status(403).json({
        error: "ACCOUNT_DISABLED",
        message: "Votre compte a été désactivé",
      });
    }

    // Rotate refresh token: revoke old, create new
    await drizzleDb
      .update(mobileRefreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(mobileRefreshTokens.id, storedToken.id));

    const newAccessToken = await createMobileAccessToken({
      id: user.id,
      openId: user.openId,
      name: user.name,
      role: user.role,
      partnerId: user.partnerId,
    });

    const newRefreshTokenData = await createMobileRefreshToken(
      user.id,
      storedToken.deviceId || undefined,
      storedToken.deviceName || undefined,
      storedToken.platform || undefined
    );

    // Update last used
    console.log(`[Mobile Auth] Token refreshed for user #${user.id}`);

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshTokenData.token,
      refreshTokenExpiresAt: newRefreshTokenData.expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("[Mobile Auth] Refresh error:", err);
    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Erreur interne du serveur",
    });
  }
});

// ============================================
// POST /api/mobile/auth/logout
// Revoke the refresh token
// ============================================
router.post("/api/mobile/auth/logout", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      const { getDb } = await import("../db");
      const { mobileRefreshTokens } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const drizzleDb = await getDb();
      await drizzleDb
        .update(mobileRefreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(mobileRefreshTokens.token, refreshToken));
    }

    console.log("[Mobile Auth] Logout");
    return res.json({ success: true });
  } catch (err) {
    console.error("[Mobile Auth] Logout error:", err);
    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Erreur interne du serveur",
    });
  }
});

// ============================================
// GET /api/mobile/auth/me
// Get current user info from access token
// ============================================
router.get("/api/mobile/auth/me", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Token d'accès requis",
      });
    }

    const token = authHeader.slice(7);
    const payload = await verifyMobileAccessToken(token);

    if (!payload) {
      return res.status(401).json({
        error: "INVALID_TOKEN",
        message: "Token d'accès invalide ou expiré",
      });
    }

    const db = await import("../db");
      const user = await db.getUserById(parseInt(payload.sub));

      if (!user || !user.isActive) {
        return res.status(403).json({
          error: "ACCOUNT_DISABLED",
          message: "Votre compte a été désactivé",
        });
      }

      // Get partner info if applicable
      let partner = null;
      if (user.partnerId) {
        try {
          const partnerData = await db.getPartnerById(user.partnerId);
          if (partnerData) {
            partner = {
              id: partnerData.id,
              companyName: partnerData.companyName,
              partnerLevel: partnerData.partnerLevel,
              partnerStatus: partnerData.partnerStatus,
            };
          }
        } catch (e) {
          // Partner not found, ignore
        }
      }

      return res.json({
        user: {
          id: user.id,
          openId: user.openId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          partnerId: user.partnerId,
          locale: user.locale || "fr",
        },
        partner,
      });
  } catch (err) {
    console.error("[Mobile Auth] Me error:", err?.message, err?.stack);
    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Erreur interne du serveur",
    });
  }
});

// ============================================
// POST /api/mobile/push/register
// Register a device push token for notifications
// ============================================
router.post("/api/mobile/push/register", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    const token = authHeader.slice(7);
    const payload = await verifyMobileAccessToken(token);
    if (!payload) {
      return res.status(401).json({ error: "INVALID_TOKEN" });
    }

    const { pushToken, platform, deviceId, deviceName } = req.body;

    if (!pushToken || !platform) {
      return res.status(400).json({
        error: "MISSING_FIELDS",
        message: "pushToken et platform sont requis",
      });
    }

    const { getDb } = await import("../db");
    const { devicePushTokens } = await import("../../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    const drizzleDb = await getDb();
    const userId = parseInt(payload.sub);

    // Check if this push token already exists for this user
    const [existing] = await drizzleDb
      .select()
      .from(devicePushTokens)
      .where(
        and(
          eq(devicePushTokens.userId, userId),
          eq(devicePushTokens.pushToken, pushToken)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing
      await drizzleDb
        .update(devicePushTokens)
        .set({
          platform,
          deviceId: deviceId || null,
          deviceName: deviceName || null,
          isActive: true,
        })
        .where(eq(devicePushTokens.id, existing.id));
    } else {
      // Insert new
      await drizzleDb.insert(devicePushTokens).values({
        userId,
        pushToken,
        platform,
        deviceId: deviceId || null,
        deviceName: deviceName || null,
      });
    }

    console.log(`[Mobile Push] Token registered for user #${userId} (${platform})`);
    return res.json({ success: true });
  } catch (err) {
    console.error("[Mobile Push] Register error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// ============================================
// POST /api/mobile/push/unregister
// Remove a device push token
// ============================================
router.post("/api/mobile/push/unregister", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    const token = authHeader.slice(7);
    const payload = await verifyMobileAccessToken(token);
    if (!payload) {
      return res.status(401).json({ error: "INVALID_TOKEN" });
    }

    const { pushToken } = req.body;
    if (!pushToken) {
      return res.status(400).json({ error: "MISSING_PUSH_TOKEN" });
    }

    const { getDb } = await import("../db");
    const { devicePushTokens } = await import("../../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    const drizzleDb = await getDb();
    const userId = parseInt(payload.sub);

    await drizzleDb
      .update(devicePushTokens)
      .set({ isActive: false })
      .where(
        and(
          eq(devicePushTokens.userId, userId),
          eq(devicePushTokens.pushToken, pushToken)
        )
      );

    console.log(`[Mobile Push] Token unregistered for user #${userId}`);
    return res.json({ success: true });
  } catch (err) {
    console.error("[Mobile Push] Unregister error:", err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// Export the helper for use in other modules (e.g., tRPC context)
export { verifyMobileAccessToken, createMobileAccessToken };
export const mobileAuthRouter = router;
