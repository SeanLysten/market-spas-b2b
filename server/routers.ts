import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as territoriesDb from "./territories-db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { notifyOwner } from "./_core/notification";
import { notifyPartner, notifyAdmins } from "./_core/websocket";
import { sendInvitationEmail, sendPasswordResetEmail } from "./email";
import * as metaOAuth from "./meta-oauth";
import * as candidatesDb from "./candidates-db";
import { reclassifyExistingPartnerLeads } from "./meta-leads";
import * as savDb from "./sav-db";
import { analyzeWarranty, COMPONENTS_BY_BRAND, DEFECT_TYPES_BY_COMPONENT, PRODUCT_LINES_BY_BRAND, COMPONENT_TO_SPARE_CATEGORY, generateTrackingUrl, type WarrantyInput, type SavBrand, type UsageType } from "./warranty-engine";

export const appRouter = router({
  system: systemRouter,

  // ============================================
  // EVENTS (public for authenticated users)
  // ============================================
  events: router({
    list: protectedProcedure
      .input(z.object({ type: z.string().optional() }).optional())
      .query(async ({ input }) => {
        // Only return published events for non-admin users
        const allEvents = await db.getEvents(input);
        return allEvents.filter((e: any) => e.isPublished);
      }),

    upcoming: protectedProcedure
      .input(z.object({ limit: z.number().optional().default(10) }))
      .query(async ({ input }) => {
        return await db.getUpcomingEvents(input.limit);
      }),
  }),

  // ============================================
  // AUTHENTICATION
  // ============================================
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    // Validate invitation token and get email
    validateInvitationToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const validation = await db.getInvitationTokenInfo(input.token);
        if (!validation) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Token d\'invitation invalide ou expiré' });
        }
        return { email: validation.email, firstName: validation.firstName, lastName: validation.lastName };
      }),

    // Local authentication
    loginLocal: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Email ou mot de passe incorrect' });
        }

        // Verify password
        const bcrypt = await import('bcryptjs');
        const isValid = await bcrypt.compare(input.password, user.passwordHash);
        
        if (!isValid) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Email ou mot de passe incorrect' });
        }

        // Check if account is active
        if (!user.isActive) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Votre compte a été désactivé' });
        }

        // Update last login
        await db.updateUserLastLogin(user.id, ctx.req.ip || 'unknown');

        // Create session using SDK (compatible with OAuth sessions)
        const { sdk } = await import('./_core/sdk');
        const token = await sdk.createSessionToken(user.openId, {
          name: user.name || `${user.firstName} ${user.lastName}`,
          expiresInMs: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

        return { success: true, user };
      }),

    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phone: z.string().optional(),
        companyName: z.string().optional(),
        invitationToken: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Validate invitation token if provided
        if (input.invitationToken) {
          const validation = await db.validateInvitationToken(input.invitationToken, input.email);
          if (!validation.valid) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: validation.message });
          }
        } else {
          // Registration requires an invitation token
          throw new TRPCError({ 
            code: 'UNAUTHORIZED', 
            message: 'L\'inscription n\'est possible que sur invitation' 
          });
        }

        // Check if user already exists
        const existing = await db.getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Un compte existe déjà avec cet email' });
        }

        // Hash password
        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.hash(input.password, 10);

        // Create user
        const crypto = await import('crypto');
        const openId = crypto.randomBytes(32).toString('hex');
        
        const user = await db.createLocalUser({
          openId,
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          name: `${input.firstName} ${input.lastName}`,
          phone: input.phone,
          loginMethod: 'local',
        });

        // Mark invitation token as used
        if (input.invitationToken) {
          await db.markInvitationTokenAsUsed(input.invitationToken);
        }

        return { success: true, userId: user.id };
      }),

    forgotPassword: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ input }) => {
        const user = await db.getUserByEmail(input.email);
        
        // Always return success to prevent email enumeration
        if (!user) {
          return { success: true };
        }

        // Generate reset token
        const crypto = await import('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        await db.setPasswordResetToken(user.id, resetToken, resetExpires);

        // Send password reset email
        const resetUrl = `${process.env.SITE_URL || 'https://marketspas.pro'}/reset-password?token=${resetToken}`;
        const emailResult = await sendPasswordResetEmail(user.email, resetToken, resetUrl);
        
        if (!emailResult.success) {
          console.error(`[Auth] Failed to send password reset email to ${user.email}:`, emailResult.error);
        }

        return { success: true };
      }),

    resetPassword: publicProcedure
      .input(z.object({
        token: z.string(),
        password: z.string().min(8),
      }))
      .mutation(async ({ input }) => {
        const user = await db.getUserByResetToken(input.token);
        
        if (!user) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Token invalide ou expiré' });
        }

        // Hash new password
        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.hash(input.password, 10);

        // Update password and clear reset token
        await db.updateUserPassword(user.id, passwordHash);
        await db.clearPasswordResetToken(user.id);

        return { success: true };
      }),
  }),

  // ============================================
  // NOTIFICATION PREFERENCES
  // ============================================
  notificationPreferences: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      let prefs = await db.getNotificationPreferences(ctx.user.id);
      
      // If no preferences exist, create default ones
      if (!prefs) {
        await db.createDefaultNotificationPreferences(ctx.user.id);
        prefs = await db.getNotificationPreferences(ctx.user.id);
      }
      
      return prefs;
    }),

    update: protectedProcedure
      .input(
        z.object({
          orderStatusChangedToast: z.boolean().optional(),
          orderStatusChangedEmail: z.boolean().optional(),
          orderNewToast: z.boolean().optional(),
          orderNewEmail: z.boolean().optional(),
          savStatusChangedToast: z.boolean().optional(),
          savStatusChangedEmail: z.boolean().optional(),
          savNewToast: z.boolean().optional(),
          savNewEmail: z.boolean().optional(),
          leadNewToast: z.boolean().optional(),
          leadNewEmail: z.boolean().optional(),
          systemAlertToast: z.boolean().optional(),
          systemAlertEmail: z.boolean().optional(),
          stockLowToast: z.boolean().optional(),
          stockLowEmail: z.boolean().optional(),
          partnerNewToast: z.boolean().optional(),
          partnerNewEmail: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateNotificationPreferences(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ============================================
  // CRON JOBS (public with secret key)
  // ============================================
  cron: router({
    processArrivedStock: publicProcedure
      .input(z.object({ secret: z.string() }))
      .mutation(async ({ input }) => {
        // Vérifier la clé secrète
        const CRON_SECRET = process.env.CRON_SECRET || 'default-secret-change-me';
        if (input.secret !== CRON_SECRET) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid secret key' });
        }
        
        // Exécuter la conversion des arrivages
        const result = await db.processArrivedStock();
        return { success: true, result };
      }),

    // Process deposit reminders for orders pending deposit > 48h
    processDepositReminders: publicProcedure
      .input(z.object({ 
        secret: z.string(),
        hoursThreshold: z.number().optional().default(48),
      }))
      .mutation(async ({ input }) => {
        // Vérifier la clé secrète
        const CRON_SECRET = process.env.CRON_SECRET || 'default-secret-change-me';
        if (input.secret !== CRON_SECRET) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid secret key' });
        }
        
        // Importer et exécuter la fonction de rappel
        const { processDepositReminders } = await import("./alerts");
        const result = await processDepositReminders(input.hoursThreshold);
        return result;
      }),
  }),

  // ============================================
  // DASHBOARD
  // ============================================
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const isAdmin = ctx.user.role === "SUPER_ADMIN" || ctx.user.role === "ADMIN";
      const partnerId = isAdmin ? undefined : ctx.user.partnerId || undefined;
      
      return await db.getDashboardStats(partnerId);
    }),

    recentOrders: protectedProcedure
      .input(z.object({ limit: z.number().optional().default(10) }))
      .query(async ({ ctx, input }) => {
        const isAdmin = ctx.user.role === "SUPER_ADMIN" || ctx.user.role === "ADMIN";
        
        if (isAdmin) {
          return await db.getAllOrders({ limit: input.limit });
        } else if (ctx.user.partnerId) {
          return await db.getOrdersByPartnerId(ctx.user.partnerId, input.limit);
        }
        
        return [];
      }),

    notifications: protectedProcedure
      .input(z.object({ limit: z.number().optional().default(50) }))
      .query(async ({ ctx, input }) => {
        try {
          return await db.getNotificationsByUserId(ctx.user.id, input.limit) || [];
        } catch (error) {
          console.error('Error fetching notifications:', error);
          return [];
        }
      }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await db.getUnreadNotificationsCount(ctx.user.id) || 0;
      } catch (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }
    }),

    markNotificationRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.markNotificationAsRead(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ============================================
  // LEADS (for partners)
  // ============================================
  leads: router({
    // Get leads assigned to the current partner
    myLeads: protectedProcedure
      .input(
        z.object({
          status: z.string().optional(),
          limit: z.number().optional().default(50),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        if (!ctx.user.partnerId) {
          return [];
        }
        return await db.getLeads({ partnerId: ctx.user.partnerId, ...input });
      }),

    // Get lead by ID (only if assigned to partner)
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const lead = await db.getLeadById(input.id);
        
        if (!lead) return null;
        
        const isAdmin = ctx.user.role === "SUPER_ADMIN" || ctx.user.role === "ADMIN";
        
        // Partners can only view their assigned leads
        if (!isAdmin && lead.assignedPartnerId !== ctx.user.partnerId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized' });
        }
        
        return lead;
      }),

    // Update lead status (partners can update their own leads)
    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.string(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const lead = await db.getLeadById(input.id);
        
        if (!lead) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });
        }
        
        const isAdmin = ctx.user.role === "SUPER_ADMIN" || ctx.user.role === "ADMIN";
        
        // Partners can only update their assigned leads
        if (!isAdmin && lead.assignedPartnerId !== ctx.user.partnerId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized' });
        }
        
        const result = await db.updateLeadStatus(input.id, input.status, ctx.user.id, input.notes);
        
        // Notifier les admins pour rafraîchir les KPIs en temps réel
        notifyAdmins("leads:refresh", { timestamp: Date.now(), leadId: input.id, newStatus: input.status });
        
        return result;
      }),

    // Get stats for current partner (or all leads for admins)
    myStats: protectedProcedure.query(async ({ ctx }) => {
      const isAdmin = ctx.user.role === "SUPER_ADMIN" || ctx.user.role === "ADMIN";
      
      // Admins see all leads stats, partners see only their own
      if (isAdmin) {
        return await db.getLeadStats();
      }
      
      if (!ctx.user.partnerId) {
        return { total: 0, new: 0, assigned: 0, contacted: 0, qualified: 0, converted: 0, lost: 0, inProgress: 0, conversionRate: 0, contactRate: 0 };
      }
      return await db.getLeadStats(ctx.user.partnerId);
    }),

    // Export leads to Excel/CSV
    export: protectedProcedure
      .input(
        z.object({
          status: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const isAdmin = ctx.user.role === "SUPER_ADMIN" || ctx.user.role === "ADMIN";
        
        let leads;
        if (isAdmin) {
          leads = await db.getLeads({ status: input.status });
        } else if (ctx.user.partnerId) {
          leads = await db.getLeads({
            partnerId: ctx.user.partnerId,
            status: input.status,
          });
        } else {
          return { fileBase64: "" };
        }
        
        const XLSX = await import("xlsx");
        const data = (leads || []).map((lead: any) => ({
          "Nom": lead.lastName || "-",
          "Prénom": lead.firstName || "-",
          "Email": lead.email || "-",
          "Téléphone": lead.phone || "-",
          "Entreprise": lead.companyName || "-",
          "Statut": lead.status,
          "Source": lead.source || "-",
          "Produit intérêt": lead.productInterest || "-",
          "Date": new Date(lead.createdAt).toLocaleDateString("fr-FR"),
          "Partenaire": lead.partner?.companyName || "-",
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
        
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
        return { fileBase64: buffer.toString("base64") };
      }),
  }),

  // ============================================
  // PARTNERS
  // ============================================
  partners: router({
    list: adminProcedure
      .input(
        z.object({
          status: z.string().optional(),
          level: z.string().optional(),
          search: z.string().optional(),
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
        })
      )
      .query(async ({ input }) => {
        return await db.getAllPartners(input);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const isAdmin = ctx.user.role === "SUPER_ADMIN" || ctx.user.role === "ADMIN";
        
        // Partners can only view their own data
        if (!isAdmin && ctx.user.partnerId !== input.id) {
          throw new Error("Unauthorized");
        }
        
        return await db.getPartnerById(input.id);
      }),

    myPartner: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.partnerId) return null;
      return await db.getPartnerById(ctx.user.partnerId);
    }),

    updateMyPartner: protectedProcedure
      .input(
        z.object({
          companyName: z.string().optional(),
          tradeName: z.string().optional(),
          vatNumber: z.string().optional(),
          addressStreet: z.string().optional(),
          addressCity: z.string().optional(),
          addressPostalCode: z.string().optional(),
          addressCountry: z.string().optional(),
          primaryContactName: z.string().optional(),
          primaryContactEmail: z.string().email().optional(),
          primaryContactPhone: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.partnerId) {
          throw new Error("Vous n'êtes pas associé à un partenaire");
        }
        await db.updatePartner(ctx.user.partnerId, input);
        return { success: true };
      }),

    create: adminProcedure
      .input(
        z.object({
          companyName: z.string(),
          vatNumber: z.string(),
          addressStreet: z.string(),
          addressCity: z.string(),
          addressPostalCode: z.string(),
          addressCountry: z.string().default("BE"),
          primaryContactName: z.string(),
          primaryContactEmail: z.string().email(),
          primaryContactPhone: z.string(),
          level: z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM", "VIP"]).default("BRONZE"),
          status: z.enum(["PENDING", "APPROVED", "SUSPENDED", "TERMINATED"]).default("PENDING"),
        })
      )
      .mutation(async ({ input }) => {
        await db.createPartner(input as any);
        return { success: true };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            companyName: z.string().optional(),
            level: z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM", "VIP"]).optional(),
            status: z.enum(["PENDING", "APPROVED", "SUSPENDED", "TERMINATED"]).optional(),
            discountPercent: z.string().optional(),
            internalNotes: z.string().optional(),
          }),
        })
      )
      .mutation(async ({ input }) => {
        await db.updatePartner(input.id, input.data);
        return { success: true };
      }),

    // Public registration for new partners
    register: publicProcedure
      .input(
        z.object({
          companyName: z.string(),
          tradeName: z.string().optional(),
          vatNumber: z.string(),
          contactName: z.string(),
          contactEmail: z.string().email(),
          contactPhone: z.string(),
          street: z.string(),
          street2: z.string().optional(),
          city: z.string(),
          postalCode: z.string(),
          country: z.string().default("BE"),
          website: z.string().optional(),
          businessDescription: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Create partner with PENDING status
        await db.createPartner({
          companyName: input.companyName,
          tradeName: input.tradeName || null,
          vatNumber: input.vatNumber,
          addressStreet: input.street,
          addressStreet2: input.street2 || null,
          addressCity: input.city,
          addressPostalCode: input.postalCode,
          addressCountry: input.country,
          primaryContactName: input.contactName,
          primaryContactEmail: input.contactEmail,
          primaryContactPhone: input.contactPhone,
          website: input.website || null,
          status: "PENDING",
          partnerLevel: "BRONZE",
        } as any);
        return { success: true };
      }),
  }),

  // ============================================
  // PRODUCTS
  // ============================================
  products: router({
    list: protectedProcedure
      .input(
        z.object({
          category: z.string().optional(),
          search: z.string().optional(),
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
        })
      )
      .query(async ({ input }) => {
        return await db.getAllProducts({
          ...input,
          isActive: true,
          isVisible: true,
        });
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProductById(input.id);
      }),

    getBySku: protectedProcedure
      .input(z.object({ sku: z.string() }))
      .query(async ({ input }) => {
        return await db.getProductBySku(input.sku);
      }),

    getVariants: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProductVariants(input.productId);
      }),

    getIncomingStock: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return await db.getIncomingStock({ productId: input.productId, status: "PENDING" });
      }),

    // Quick search by SKU or name
    quickSearch: protectedProcedure
      .input(z.object({ query: z.string(), limit: z.number().optional().default(10) }))
      .query(async ({ input }) => {
        return await db.searchProductsBySku(input.query, input.limit);
      }),

    // Favorites
    getFavorites: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserFavorites(ctx.user.id);
      }),

    addFavorite: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.addToFavorites(ctx.user.id, input.productId);
      }),

    removeFavorite: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.removeFromFavorites(ctx.user.id, input.productId);
      }),

    isFavorite: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.isFavorite(ctx.user.id, input.productId);
      }),
  }),

  // ============================================
  // ORDERS
  // ============================================
  orders: router({
    list: protectedProcedure
      .input(
        z.object({
          status: z.string().optional(),
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        const isAdmin = ctx.user.role === "SUPER_ADMIN" || ctx.user.role === "ADMIN";
        
        if (isAdmin) {
          return await db.getAllOrders(input);
        } else if (ctx.user.partnerId) {
          return await db.getAllOrders({
            ...input,
            partnerId: ctx.user.partnerId,
          });
        }
        
        return [];
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.id);
        
        if (!order) return null;
        
        const isAdmin = ctx.user.role === "SUPER_ADMIN" || ctx.user.role === "ADMIN";
        
        // Partners can only view their own orders
        if (!isAdmin && order.partnerId !== ctx.user.partnerId) {
          throw new Error("Unauthorized");
        }
        
        return order;
      }),

    create: protectedProcedure
      .input(
        z.object({
          items: z.array(
            z.object({
              productId: z.number(),
              variantId: z.number().optional(),
              quantity: z.number(),
              isPreorder: z.boolean().optional(),
            })
          ),
          deliveryAddress: z.object({
            street: z.string(),
            street2: z.string().optional(),
            city: z.string(),
            postalCode: z.string(),
            country: z.string(),
            contactName: z.string(),
            contactPhone: z.string(),
            instructions: z.string().optional(),
          }),
          paymentMethod: z.string(),
          customerNotes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.partnerId) {
          throw new Error("Vous devez être associé à un partenaire pour passer commande");
        }

        // Get partner discount
        const partner = await db.getPartnerById(ctx.user.partnerId);
        const discountPercent = partner?.discountPercent ? parseFloat(partner.discountPercent) : 0;

        // Build order items with product details
        const orderItems = [];
        for (const item of input.items) {
          const product = await db.getProductById(item.productId);
          if (!product) {
            throw new Error(`Produit ${item.productId} non trouvé`);
          }

          let sku = product.sku;
          let name = product.name;
          let unitPriceHT = parseFloat(product.pricePartnerHT);
          let vatRate = parseFloat(product.vatRate || "21");

          // If variant is specified, get variant details
          if (item.variantId) {
            const variant = await db.getProductVariantById(item.variantId);
            if (variant) {
              sku = variant.sku;
              name = `${product.name} - ${variant.name}`;
              if (variant.pricePartnerHT) {
                unitPriceHT = parseFloat(variant.pricePartnerHT);
              }
            }
          }

          orderItems.push({
            productId: item.productId,
            variantId: item.variantId,
            sku,
            name,
            quantity: item.quantity,
            unitPriceHT,
            vatRate,
            discountPercent,
            isPreorder: item.isPreorder,
          });
        }

        // Create the order
        const result = await db.createOrder({
          partnerId: ctx.user.partnerId,
          createdById: ctx.user.id,
          items: orderItems,
          deliveryAddress: input.deliveryAddress,
          paymentMethod: input.paymentMethod,
          customerNotes: input.customerNotes,
          discountPercent,
        });

        // Clear the cart after successful order
        await db.clearCart(ctx.user.id);

        // Send new order notification
        const { notifyNewOrder } = await import("./alerts");
        await notifyNewOrder(result.orderId);

        return {
          success: true,
          orderId: result.orderId,
          orderNumber: result.orderNumber,
          totalHT: result.totalHT,
          totalTTC: result.totalTTC,
          depositAmount: result.depositAmount,
          message: "Commande créée avec succès",
        };
      }),

    getWithItems: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderWithItems(input.id);
        
        if (!order) return null;
        
        const isAdmin = ctx.user.role === "SUPER_ADMIN" || ctx.user.role === "ADMIN";
        
        // Partners can only view their own orders
        if (!isAdmin && order.partnerId !== ctx.user.partnerId) {
          throw new Error("Unauthorized");
        }
        
        return order;
      }),

    updateStatus: adminProcedure
      .input(z.object({
        orderId: z.number(),
        status: z.string(),
        note: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Get current order status before update
        const order = await db.getOrderById(input.orderId);
        const oldStatus = order?.status || "UNKNOWN";

        // Update order status
        const result = await db.updateOrderStatus(input.orderId, input.status, input.note);

        // Send status change notification
        if (order && oldStatus !== input.status) {
          const { notifyOrderStatusChange } = await import("./alerts");
          await notifyOrderStatusChange(input.orderId, oldStatus, input.status);
        }

        return result;
      }),

    // Reorder from previous order
    reorder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.reorderFromOrder(ctx.user.id, input.orderId);
      }),

    // Get today's orders (admin only)
    getToday: adminProcedure
      .query(async () => {
        return await db.getTodayOrders();
      }),

    // Quick validate order (admin only)
    quickValidate: adminProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.quickValidateOrder(input.orderId, ctx.user.id);
      }),

    // Export today's orders as CSV data (admin only)
    exportToday: adminProcedure
      .query(async () => {
        return await db.getTodayOrdersForExport();
      }),

    // Parse and validate CSV for bulk order import
    parseCSV: protectedProcedure
      .input(z.object({ fileBase64: z.string() }))
      .mutation(async ({ input }) => {
        const { parseOrderCSV } = await import("./csv-import");
        const fileBuffer = Buffer.from(input.fileBase64, "base64");
        
        return await parseOrderCSV(fileBuffer, db.getProductBySKU);
      }),

    // Download CSV template for bulk orders
    downloadTemplate: protectedProcedure
      .query(async () => {
        const { generateOrderTemplate } = await import("./csv-import");
        const buffer = generateOrderTemplate();
        return { fileBase64: buffer.toString("base64") };
      }),

    // Export orders to Excel/CSV
    export: protectedProcedure
      .input(
        z.object({
          status: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const isAdmin = ctx.user.role === "SUPER_ADMIN" || ctx.user.role === "ADMIN";
        
        let orders;
        if (isAdmin) {
          orders = await db.getAllOrders({
            status: input.status,
            limit: 10000,
          });
        } else if (ctx.user.partnerId) {
          orders = await db.getAllOrders({
            partnerId: ctx.user.partnerId,
            status: input.status,
            limit: 10000,
          });
        } else {
          return { fileBase64: "" };
        }
        
        const XLSX = await import("xlsx");
        const data = (orders || []).map((order: any) => ({
          "Numéro": order.orderNumber,
          "Date": new Date(order.createdAt).toLocaleDateString("fr-FR"),
          "Partenaire": order.partner?.companyName || "-",
          "Statut": order.status,
          "Total HT": order.totalHT,
          "Total TTC": order.totalTTC,
          "Mode paiement": order.paymentMethod,
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Commandes");
        
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
        return { fileBase64: buffer.toString("base64") };
      }),
  }),

  // ============================================
  // RESOURCES
  // ============================================
  resources: router({
    list: protectedProcedure
      .input(
        z.object({
          category: z.string().optional(),
          language: z.string().optional(),
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
        })
      )
      .query(async ({ input }) => {
        return await db.getAllResources({
          ...input,
          isActive: true,
        });
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const resource = await db.getResourceById(input.id);
        
        if (resource) {
          await db.incrementResourceView(input.id);
        }
        
        return resource;
      }),

    download: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const resource = await db.getResourceById(input.id);
        
        if (!resource) {
          throw new Error("Resource not found");
        }
        
        await db.incrementResourceDownload(input.id);
        
        return { fileUrl: resource.fileUrl };
      }),

    create: adminProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          category: z.string(),
          language: z.string(),
          isPublic: z.boolean().optional(),
          requiredPartnerLevel: z.string(),
          fileData: z.string(), // base64
          fileName: z.string(),
          fileType: z.string(),
          fileSize: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Upload to S3
        const { storagePut } = await import("./storage");
        const buffer = Buffer.from(input.fileData.split(",")[1] || input.fileData, "base64");
        const fileKey = `resources/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.fileType);

        return await db.createResource({
          title: input.title,
          description: input.description || null,
          category: input.category,
          language: input.language,
          fileUrl: url,
          fileType: input.fileType,
          fileSize: input.fileSize,
          isPublic: input.isPublic || false,
          isActive: true,
          requiredPartnerLevel: input.requiredPartnerLevel,
          uploadedBy: ctx.user.id,
        });
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteResource(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // USER PROFILE
  // ============================================
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return ctx.user;
    }),

    update: protectedProcedure
      .input(
        z.object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          phone: z.string().optional(),
          locale: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // TODO: Implement user profile update
        return { success: true };
      }),
  }),

  // ============================================
  // CART & CHECKOUT
  // ============================================
  cart: router({ get: protectedProcedure.query(async ({ ctx }) => {
      // Allow all authenticated users to have a cart (admins can test the system)
      return await db.getCart(ctx.user.id);
    }),

    add: protectedProcedure
      .input(z.object({ 
        productId: z.number(),
        variantId: z.number().optional(),
        quantity: z.number().min(1),
        isPreorder: z.boolean().optional().default(false)
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.addToCart(ctx.user.id, input.productId, input.quantity, input.isPreorder, input.variantId);
      }),

    updateQuantity: protectedProcedure
      .input(z.object({ productId: z.number(), quantity: z.number().min(1) }))
      .mutation(async ({ ctx, input }) => {
        return await db.updateCartQuantity(ctx.user.id, input.productId, input.quantity);
      }),

    removeItem: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.removeFromCart(ctx.user.id, input.productId);
      }),

    clear: protectedProcedure.mutation(async ({ ctx }) => {
      return await db.clearCart(ctx.user.id);
    }),
  }),

  // ============================================
  // NOTIFICATIONS
  // ============================================
  notifications: router({
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().optional().default(20),
          unreadOnly: z.boolean().optional().default(false),
        })
      )
      .query(async ({ ctx, input }) => {
        return await db.getUserNotifications(ctx.user.id, input);
      }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.markNotificationAsRead(input.id, ctx.user.id);
        return { success: true };
      }),

    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),

    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUnreadNotificationCount(ctx.user.id);
    }),
  }),

  // ============================================
  // ADMIN ROUTES
  // ============================================
  admin: router({
    users: router({
      list: adminProcedure.query(async () => {
        return await db.getAllUsers();
      }),

      invite: adminProcedure
        .input(
          z.object({
            email: z.string().email(),
            firstName: z.string().optional(),
            lastName: z.string().optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          // Check if user already exists
          const existingUser = await db.getUserByEmail(input.email);
          if (existingUser) {
            throw new TRPCError({ 
              code: 'BAD_REQUEST', 
              message: 'Un utilisateur avec cet email existe déjà' 
            });
          }

          // Create invitation token (expires in 7 days)
          const tokenData = await db.createInvitationToken(
            input.email,
            ctx.user.id,
            7,
            input.firstName,
            input.lastName
          );

          if (!tokenData) {
            throw new TRPCError({ 
              code: 'INTERNAL_SERVER_ERROR', 
              message: 'Erreur lors de la création du token d\'invitation' 
            });
          }

          // Generate invitation link
          const invitationUrl = `${process.env.VITE_OAUTH_PORTAL_URL || 'http://localhost:3000'}/register?token=${tokenData.token}`;

          // Send invitation email
          try {
            await sendInvitationEmail({
              to: input.email,
              firstName: input.firstName,
              lastName: input.lastName,
              invitationUrl,
              expiresAt: tokenData.expiresAt,
            });
            console.log(`[Invitation] Email sent to ${input.email}`);
          } catch (emailError) {
            console.error('[Invitation] Failed to send email:', emailError);
            // Continue anyway - admin can still share the link manually
          }

          return { 
            success: true, 
            message: "Invitation créée et email envoyé avec succès",
            invitationUrl,
            expiresAt: tokenData.expiresAt
          };
        }),

      toggleActive: adminProcedure
        .input(
          z.object({
            userId: z.number(),
            isActive: z.boolean(),
          })
        )
        .mutation(async ({ input }) => {
          await db.updateUserStatus(input.userId, input.isActive);
          return { success: true };
        }),

      updateRole: adminProcedure
        .input(
          z.object({
            userId: z.number(),
            role: z.enum(['SUPER_ADMIN', 'ADMIN', 'PARTNER']),
          })
        )
        .mutation(async ({ input }) => {
          await db.updateUserRole(input.userId, input.role);
          return { success: true, message: 'Rôle mis à jour avec succès' };
        }),

      // List all invitations
      listInvitations: adminProcedure
        .query(async () => {
          return await db.getPendingInvitations();
        }),

      // Cancel an invitation
      cancelInvitation: adminProcedure
        .input(z.object({ tokenId: z.number() }))
        .mutation(async ({ input }) => {
          await db.cancelInvitation(input.tokenId);
          return { success: true, message: 'Invitation annulée avec succès' };
        }),

      // Resend an invitation
      resendInvitation: adminProcedure
        .input(z.object({ tokenId: z.number() }))
        .mutation(async ({ input }) => {
          const invitation = await db.getInvitationForResend(input.tokenId);
          
          if (!invitation) {
            throw new TRPCError({ 
              code: 'NOT_FOUND', 
              message: 'Invitation non trouvée' 
            });
          }

          // Generate invitation link
          const invitationUrl = `${process.env.VITE_OAUTH_PORTAL_URL || 'http://localhost:3000'}/register?token=${invitation.token}`;

          // Resend invitation email
          try {
            await sendInvitationEmail({
              to: invitation.email,
              firstName: invitation.firstName,
              lastName: invitation.lastName,
              invitationUrl,
              expiresAt: invitation.expiresAt,
            });
            console.log(`[Invitation] Email resent to ${invitation.email}`);
          } catch (emailError) {
            console.error('[Invitation] Failed to resend email:', emailError);
            throw new TRPCError({ 
              code: 'INTERNAL_SERVER_ERROR', 
              message: 'Erreur lors de l\'envoi de l\'email' 
            });
          }

          return { 
            success: true, 
            message: 'Invitation renvoyée avec succès' 
          };
        }),
    }),

    products: router({
      list: adminProcedure
        .input(
          z.object({
            search: z.string().optional(),
            category: z.string().optional(),
            limit: z.number().optional().default(50),
            offset: z.number().optional().default(0),
          })
        )
        .query(async ({ input }) => {
          return await db.getAllProducts(input);
        }),

      create: adminProcedure
        .input(
          z.object({
            sku: z.string(),
            name: z.string(),
            description: z.string().optional(),
            category: z.string().optional(),
            brand: z.string().optional(),
            priceHT: z.number(),
            vatRate: z.number(),
            stockQuantity: z.number(),
            minOrderQuantity: z.number().optional(),
            weight: z.number().optional(),
            dimensions: z.string().optional(),
            imageUrl: z.string().optional(),
            isActive: z.boolean().optional(),
            isVisible: z.boolean().optional(),
          })
        )
        .mutation(async ({ input }) => {
          return await db.createProduct(input);
        }),

      update: adminProcedure
        .input(
          z.object({
            id: z.number(),
            sku: z.string().optional(),
            name: z.string().optional(),
            description: z.string().optional(),
            category: z.string().optional(),
            brand: z.string().optional(),
            priceHT: z.number().optional(),
            vatRate: z.number().optional(),
            stockQuantity: z.number().optional(),
            minOrderQuantity: z.number().optional(),
            weight: z.number().optional(),
            dimensions: z.string().optional(),
            imageUrl: z.string().optional(),
            isActive: z.boolean().optional(),
            isVisible: z.boolean().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return await db.updateProduct(id, data);
        }),

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteProduct(input.id);
          return { success: true };
        }),

      // Variants management
      getVariants: adminProcedure
        .input(z.object({ productId: z.number() }))
        .query(async ({ input }) => {
          return await db.getProductVariants(input.productId);
        }),

      createVariant: adminProcedure
        .input(
          z.object({
            productId: z.number(),
            sku: z.string(),
            name: z.string(),
            priceAdjustmentHT: z.number().optional(),
            stockQuantity: z.number().optional(),
            isDefault: z.boolean().optional(),
            options: z.array(
              z.object({
                optionName: z.string(),
                optionValue: z.string(),
              })
            ),
          })
        )
        .mutation(async ({ input }) => {
          return await db.createProductVariant(input);
        }),

      updateVariant: adminProcedure
        .input(
          z.object({
            id: z.number(),
            sku: z.string().optional(),
            name: z.string().optional(),
            priceAdjustmentHT: z.number().optional(),
            stockQuantity: z.number().optional(),
            isActive: z.boolean().optional(),
            isDefault: z.boolean().optional(),
            imageUrl: z.string().nullable().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          await db.updateProductVariant(id, data);
          return { success: true };
        }),

      deleteVariant: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteProductVariant(input.id);
          return { success: true };
        }),

      // Variants
      listVariants: adminProcedure
        .input(z.object({ productId: z.number() }))
        .query(async ({ input }) => {
          return await db.getProductVariants(input.productId);
        }),

      // Image upload
      uploadImage: adminProcedure
        .input(
          z.object({
            productId: z.number().optional(),
            variantId: z.number().optional(),
            imageData: z.string(), // base64 encoded image
            fileName: z.string(),
          })
        )
        .mutation(async ({ input }) => {
          // Convert base64 to buffer
          const base64Data = input.imageData.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(base64Data, "base64");

          // Generate unique file key
          const fileExtension = input.fileName.split(".").pop() || "jpg";
          const fileKey = `products/${input.productId || "general"}/${nanoid()}.${fileExtension}`;

          // Upload to S3
          const { url } = await storagePut(fileKey, buffer, `image/${fileExtension}`);

          // Update product or variant with image URL
          if (input.variantId) {
            console.log(`[uploadImage] Updating variant ${input.variantId} with imageUrl`);
            await db.updateProductVariant(input.variantId, { imageUrl: url });
          } else if (input.productId) {
            console.log(`[uploadImage] Updating product ${input.productId} with imageUrl`);
            await db.updateProduct(input.productId, { imageUrl: url });
          }

          return { success: true, url };
        }),
    }),

    incomingStock: router({
      list: adminProcedure
        .input(
          z.object({
            productId: z.number().optional(),
            variantId: z.number().optional(),
            status: z.string().optional(),
          })
        )
        .query(async ({ input }) => {
          return await db.getIncomingStock(input);
        }),

      create: adminProcedure
        .input(
          z.object({
            productId: z.number().optional(),
            variantId: z.number().optional(),
            quantity: z.number(),
            expectedWeek: z.number().min(1).max(53),
            expectedYear: z.number(),
            notes: z.string().optional(),
          })
        )
        .mutation(async ({ input }) => {
          return await db.createIncomingStock(input);
        }),

      update: adminProcedure
        .input(
          z.object({
            id: z.number(),
            quantity: z.number().optional(),
            expectedWeek: z.number().min(1).max(53).optional(),
            expectedYear: z.number().optional(),
            status: z.string().optional(),
            notes: z.string().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          await db.updateIncomingStock(id, data);
          return { success: true };
        }),

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteIncomingStock(input.id);
          return { success: true };
        }),

      processArrived: adminProcedure
        .mutation(async () => {
          return await db.processArrivedStock();
        }),
    }),

    // Stock forecast
    forecast: router({
      getAll: adminProcedure
        .input(z.object({ weeks: z.number().optional().default(8) }))
        .query(async ({ input }) => {
          return await db.getStockForecast(input.weeks);
        }),

      getProduct: adminProcedure
        .input(
          z.object({
            productId: z.number(),
            weeks: z.number().optional().default(8),
          })
        )
        .query(async ({ input }) => {
          return await db.getProductForecast(input.productId, input.weeks);
        }),

      getSummary: adminProcedure
        .input(z.object({ weeks: z.number().optional().default(8) }))
        .query(async ({ input }) => {
          return await db.getStockForecastSummary(input.weeks);
        }),
    }),

    // Stripe payments
    payments: router({
      createPaymentIntent: adminProcedure
        .input(
          z.object({
            orderId: z.number(),
            amount: z.number(), // Amount in cents
          })
        )
        .mutation(async ({ input }) => {
          const { createPaymentIntent } = await import("./stripe");
          const order = await db.getOrderById(input.orderId);
          if (!order) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Commande non trouvée" });
          }
          
          const result = await createPaymentIntent({
            amount: input.amount,
            orderId: input.orderId,
            orderNumber: order.orderNumber,
            description: `Acompte commande ${order.orderNumber}`,
          });
          
          return result;
        }),
    }),

    partners: router({
      list: adminProcedure
        .input(
          z.object({
            search: z.string().optional(),
            status: z.string().optional(),
            level: z.string().optional(),
          })
        )
        .query(async ({ input }) => {
          return await db.getAllPartners(input);
        }),

      create: adminProcedure
        .input(
          z.object({
            companyName: z.string(),
            tradeName: z.string().optional(),
            vatNumber: z.string(),
            addressStreet: z.string().optional(),
            addressCity: z.string().optional(),
            addressPostalCode: z.string().optional(),
            addressCountry: z.string().optional(),
            primaryContactName: z.string().optional(),
            primaryContactEmail: z.string(),
            primaryContactPhone: z.string().optional(),
            level: z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM", "VIP"]).optional(),
            discountPercent: z.number().optional(),
            status: z.enum(["PENDING", "APPROVED", "SUSPENDED", "TERMINATED"]).optional(),
            internalNotes: z.string().optional(),
          })
        )
        .mutation(async ({ input }) => {
          return await db.createPartner(input);
        }),

      update: adminProcedure
        .input(
          z.object({
            id: z.number(),
            companyName: z.string().optional(),
            tradeName: z.string().optional(),
            vatNumber: z.string().optional(),
            addressStreet: z.string().optional(),
            addressCity: z.string().optional(),
            addressPostalCode: z.string().optional(),
            addressCountry: z.string().optional(),
            primaryContactName: z.string().optional(),
            primaryContactEmail: z.string().optional(),
            primaryContactPhone: z.string().optional(),
            level: z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM", "VIP"]).optional(),
            discountPercent: z.number().optional(),
            status: z.enum(["PENDING", "APPROVED", "SUSPENDED", "TERMINATED"]).optional(),
            internalNotes: z.string().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, discountPercent, ...rest } = input;
          const data = {
            ...rest,
            discountPercent: discountPercent !== undefined ? discountPercent.toString() : undefined,
          };
          await db.updatePartner(id, data);
          return { success: true };
        }),

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          const result = await db.deletePartner(input.id);
          return { 
            success: true, 
            reassignedTo: result.reassignedTo,
            territoriesTransferred: result.territoriesTransferred,
            leadsReassigned: result.leadsReassigned
          };
        }),

      approve: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.updatePartner(input.id, { status: "APPROVED" });
          return { success: true };
        }),
    }),

    // Events management
    events: router({
      list: adminProcedure
        .input(z.object({ type: z.string().optional() }).optional())
        .query(async ({ input }) => {
          return await db.getEvents(input);
        }),

      create: adminProcedure
        .input(
          z.object({
            title: z.string(),
            description: z.string().optional(),
            type: z.enum(['PROMOTION', 'EVENT', 'ANNOUNCEMENT', 'TRAINING', 'WEBINAR']),
            startDate: z.date(),
            endDate: z.date().optional(),
            allDay: z.boolean().optional(),
            imageUrl: z.string().optional(),
            discountPercent: z.number().optional(),
            promoCode: z.string().optional(),
            isPublished: z.boolean().optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          return await db.createEvent({ ...input, createdBy: ctx.user.id });
        }),

      update: adminProcedure
        .input(
          z.object({
            id: z.number(),
            title: z.string().optional(),
            description: z.string().optional().nullable(),
            type: z.enum(['PROMOTION', 'EVENT', 'ANNOUNCEMENT', 'TRAINING', 'WEBINAR']).optional(),
            startDate: z.date().optional(),
            endDate: z.date().optional().nullable(),
            allDay: z.boolean().optional(),
            imageUrl: z.string().optional().nullable(),
            discountPercent: z.number().optional().nullable(),
            promoCode: z.string().optional().nullable(),
            isPublished: z.boolean().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, discountPercent, ...rest } = input;
          await db.updateEvent(id, {
            ...rest,
            discountPercent: discountPercent != null ? discountPercent.toString() : undefined,
          });
          return { success: true };
        }),

      togglePublish: adminProcedure
        .input(z.object({ id: z.number(), isPublished: z.boolean() }))
        .mutation(async ({ input }) => {
          await db.updateEvent(input.id, { isPublished: input.isPublished });
          return { success: true };
        }),

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteEvent(input.id);
          return { success: true };
        }),
    }),

    // Leads management
    leads: router({
      list: adminProcedure
        .input(
          z.object({
            status: z.string().optional(),
            partnerId: z.number().optional(),
            source: z.string().optional(),
            leadType: z.enum(['VENTE', 'PARTENARIAT', 'SAV', 'all']).optional(),
          }).optional()
        )
        .query(async ({ input }) => {
          return await db.getLeads(input);
        }),

      // Liste des leads PARTENARIAT pour la carte du réseau
      partnershipLeads: adminProcedure
        .query(async () => {
          return await db.getLeads({ leadType: 'PARTENARIAT' });
        }),

      getById: adminProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          return await db.getLeadById(input.id);
        }),

      stats: adminProcedure
        .input(z.object({ partnerId: z.number().optional() }).optional())
        .query(async ({ input }) => {
          return await db.getLeadStats(input?.partnerId);
        }),

      create: adminProcedure
        .input(
          z.object({
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            email: z.string().optional(),
            phone: z.string().optional(),
            city: z.string().optional(),
            postalCode: z.string().optional(),
            source: z.enum(['META_ADS', 'GOOGLE_ADS', 'WEBSITE', 'REFERRAL', 'PHONE', 'EMAIL', 'TRADE_SHOW', 'OTHER']),
            productInterest: z.string().optional(),
            budget: z.string().optional(),
            message: z.string().optional(),
            assignedPartnerId: z.number().optional(),
          })
        )
        .mutation(async ({ input }) => {
          return await db.createLead(input);
        }),

      updateStatus: adminProcedure
        .input(
          z.object({
            id: z.number(),
            status: z.string(),
            notes: z.string().optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const result = await db.updateLeadStatus(input.id, input.status, ctx.user.id, input.notes);
          
          // Notifier les admins pour rafraîchir les KPIs en temps réel
          notifyAdmins("leads:refresh", { timestamp: Date.now(), leadId: input.id, newStatus: input.status });
          
          return result;
        }),

      assign: adminProcedure
        .input(
          z.object({
            leadId: z.number(),
            partnerId: z.number(),
          })
        )
        .mutation(async ({ input }) => {
          return await db.assignLeadToPartner(input.leadId, input.partnerId);
        }),

      reassignAll: adminProcedure
        .mutation(async () => {
          const { findBestPartnerForPostalCode } = await import('./territories-db');
          
          // Récupérer UNIQUEMENT les leads VENTE (pas PARTENARIAT ni SAV)
          const unassignedLeads = await db.getLeads({ leadType: 'VENTE' });
          const leadsWithPostalCode = unassignedLeads.filter((lead: any) => {
            const postalCode = lead.leads?.postalCode || lead.postalCode;
            return postalCode && postalCode.trim() !== '';
          });

          let assignedCount = 0;
          let notFoundCount = 0;
          const results = [];

          for (const leadData of leadsWithPostalCode) {
            const lead = leadData.leads || leadData;
            const postalCode = lead.postalCode;

            try {
              if (!postalCode) continue;
              const country = lead.country || undefined;
              const partner = await findBestPartnerForPostalCode(postalCode, country);
              
              if (partner) {
                await db.assignLeadToPartner(lead.id, partner.partnerId);
                assignedCount++;
                results.push({
                  leadId: lead.id,
                  email: lead.email,
                  postalCode,
                  assigned: true,
                  partnerName: partner.partnerName,
                  region: partner.region,
                });
              } else {
                notFoundCount++;
                results.push({
                  leadId: lead.id,
                  email: lead.email,
                  postalCode,
                  assigned: false,
                  reason: 'Aucun partenaire trouvé pour cette région',
                });
              }
            } catch (error) {
              notFoundCount++;
              results.push({
                leadId: lead.id,
                email: lead.email,
                postalCode,
                assigned: false,
                reason: 'Erreur lors de l\'assignation',
              });
            }
          }

          return {
            success: true,
            total: leadsWithPostalCode.length,
            assigned: assignedCount,
            notFound: notFoundCount,
            results,
          };
        }),

      // Webhook endpoint for Zapier/Make (public, no auth required)
      webhook: publicProcedure
        .input(z.object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          email: z.string().email(),
          phone: z.string().optional(),
          city: z.string().optional(),
          postalCode: z.string().optional(),
          companyName: z.string().optional(),
          message: z.string().optional(),
          source: z.enum(["FACEBOOK", "INSTAGRAM", "GOOGLE", "WEBSITE", "REFERRAL", "OTHER"]).optional().default("FACEBOOK"),
          productInterest: z.string().optional(),
          budget: z.string().optional(),
          campaignId: z.string().optional(),
          campaignName: z.string().optional(),
          adId: z.string().optional(),
          adName: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          // Map source to internal format
          const sourceMap: Record<string, string> = {
            FACEBOOK: "META_ADS",
            INSTAGRAM: "META_ADS",
            GOOGLE: "GOOGLE_ADS",
            WEBSITE: "WEBSITE",
            REFERRAL: "REFERRAL",
            OTHER: "OTHER",
          };

          // Create lead in database
          const lead = await db.createLead({
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            phone: input.phone,
            city: input.city,
            postalCode: input.postalCode,
            productInterest: input.productInterest || input.companyName,
            budget: input.budget,
            message: input.message,
            source: sourceMap[input.source] as any,
            metaCampaignId: input.campaignId,
            metaAdId: input.adId,
          });

          // Notify admins about new lead
          try {
            notifyAdmins("NEW_LEAD", {
              title: "Nouveau lead reçu",
              message: `${input.firstName || ''} ${input.lastName || ''} (${input.email})`,
              leadId: lead,
            });
          } catch (error) {
            // Log error but don't fail the webhook
            console.error('Failed to send notification:', error);
          }

          return { success: true, leadId: lead };
        }),
    }),

    // Territory management
    territories: router({
      // Get all countries
      countries: adminProcedure.query(async () => {
        return await territoriesDb.getAllCountries();
      }),

      // Get regions by country code
      regions: adminProcedure
        .input(z.object({ countryCode: z.string() }))
        .query(async ({ input }) => {
          // Get country by code first, then get regions
          const countries = await territoriesDb.getAllCountries();
          const country = countries.find((c: any) => c.code === input.countryCode);
          if (!country) return [];
          return await territoriesDb.getRegionsByCountry(country.id);
        }),

      // Get regions by country ID
      regionsByCountry: adminProcedure
        .input(z.object({ countryId: z.number() }))
        .query(async ({ input }) => {
          return await territoriesDb.getRegionsByCountry(input.countryId);
        }),

      // Get all regions with country info
      allRegions: adminProcedure.query(async () => {
        return await territoriesDb.getAllRegionsWithCountry();
      }),

      // Get postal code ranges by region
      postalCodeRanges: adminProcedure
        .input(z.object({ regionId: z.number() }))
        .query(async ({ input }) => {
          return await territoriesDb.getPostalCodeRangesByRegion(input.regionId);
        }),

      // Get partner territories
      partnerTerritories: adminProcedure
        .input(z.object({ partnerId: z.number() }))
        .query(async ({ input }) => {
          return await territoriesDb.getPartnerTerritories(input.partnerId);
        }),

      // Get all partner territories
      allPartnerTerritories: adminProcedure.query(async () => {
        return await territoriesDb.getAllPartnerTerritories();
      }),

      // Get all partner territories (alias for list)
      list: adminProcedure.query(async () => {
        return await territoriesDb.getAllPartnerTerritories();
      }),

      // Get partner territories by partner ID (alias for partnerTerritories)
      byPartner: adminProcedure
        .input(z.object({ partnerId: z.number() }))
        .query(async ({ input }) => {
          return await territoriesDb.getPartnerTerritories(input.partnerId);
        }),

      // Assign territory to partner
      assign: adminProcedure
        .input(
          z.object({
            partnerId: z.number(),
            regionId: z.number(),
            assignedBy: z.number(),
            notes: z.string().optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          return await territoriesDb.assignTerritoryToPartner(
            input.partnerId,
            input.regionId,
            ctx.user.id,
            input.notes
          );
        }),

      // Remove territory from partner
      remove: adminProcedure
        .input(z.object({ territoryId: z.number() }))
        .mutation(async ({ input }) => {
          await territoriesDb.removeTerritoryFromPartner(input.territoryId);
          return { success: true };
        }),

      // Unassign territory from partner (alias for remove)
      unassign: adminProcedure
        .input(z.object({ territoryId: z.number() }))
        .mutation(async ({ input }) => {
          await territoriesDb.removeTerritoryFromPartner(input.territoryId);
          return { success: true };
        }),

      // Update territory notes
      updateNotes: adminProcedure
        .input(
          z.object({
            territoryId: z.number(),
            notes: z.string(),
          })
        )
        .mutation(async ({ input }) => {
          await territoriesDb.updateTerritoryNotes(input.territoryId, input.notes);
          return { success: true };
        }),

      // Find best partner for postal code
      findPartnerForPostalCode: adminProcedure
        .input(z.object({ postalCode: z.string(), country: z.string().optional() }))
        .query(async ({ input }) => {
          return await territoriesDb.findBestPartnerForPostalCode(input.postalCode, input.country);
        }),

      // Map data: partners + leads + territories for interactive map
      mapData: adminProcedure.query(async () => {
        const [allPartners, allLeads, partnershipLeads, allTerritories, allRegions] = await Promise.all([
          db.getAllPartners({}),
          db.getLeads({ leadType: 'VENTE' }),
          db.getLeads({ leadType: 'PARTENARIAT' }),
          territoriesDb.getAllPartnerTerritories(),
          territoriesDb.getAllRegionsWithCountry(),
        ]);
        return {
          partners: allPartners,
          leads: allLeads,
          partnershipLeads: partnershipLeads,
          territories: allTerritories,
          regions: allRegions,
        };
      }),
    }),

    // ============================================
    // PARTNER CANDIDATES (Prospection)
    // ============================================
    candidates: router({
      list: adminProcedure.query(async () => {
        return await candidatesDb.getAllCandidates();
      }),

      getById: adminProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          return await candidatesDb.getCandidateById(input.id);
        }),

      create: adminProcedure
        .input(z.object({
          companyName: z.string(),
          fullName: z.string(),
          city: z.string(),
          phoneNumber: z.string(),
          email: z.string(),
          priorityScore: z.number().min(0).max(8),
          showroom: z.string().default("non"),
          vendSpa: z.string().default("non"),
          autreMarque: z.string().default("non"),
          domaineSimilaire: z.string().default("non"),
          notes: z.string().nullable().optional(),
          status: z.enum(["non_contacte", "en_cours", "valide", "archive"]).default("non_contacte"),
          latitude: z.string().nullable().optional(),
          longitude: z.string().nullable().optional(),
        }))
        .mutation(async ({ input }) => {
          return await candidatesDb.createCandidate(input);
        }),

      update: adminProcedure
        .input(z.object({
          id: z.number(),
          updates: z.object({
            companyName: z.string().optional(),
            fullName: z.string().optional(),
            city: z.string().optional(),
            phoneNumber: z.string().optional(),
            email: z.string().optional(),
            priorityScore: z.number().min(0).max(8).optional(),
            showroom: z.string().optional(),
            vendSpa: z.string().optional(),
            autreMarque: z.string().optional(),
            domaineSimilaire: z.string().optional(),
            notes: z.string().nullable().optional(),
            status: z.enum(["non_contacte", "en_cours", "valide", "archive"]).optional(),
            latitude: z.string().nullable().optional(),
            longitude: z.string().nullable().optional(),
          }),
        }))
        .mutation(async ({ input }) => {
          return await candidatesDb.updateCandidate(input.id, input.updates);
        }),

      // Sauvegarder les coordonnées géocodées en batch
      saveCoordinates: adminProcedure
        .input(z.array(z.object({
          id: z.number(),
          latitude: z.string(),
          longitude: z.string(),
        })))
        .mutation(async ({ input }) => {
          let saved = 0;
          for (const item of input) {
            await candidatesDb.updateCandidate(item.id, {
              latitude: item.latitude,
              longitude: item.longitude,
            });
            saved++;
          }
          return { saved };
        }),

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await candidatesDb.deleteCandidate(input.id);
          return { success: true };
        }),

      incrementPhoneCall: adminProcedure
        .input(z.object({ candidateId: z.number() }))
        .mutation(async ({ input }) => {
          return await candidatesDb.incrementPhoneCall(input.candidateId);
        }),

      incrementEmail: adminProcedure
        .input(z.object({ candidateId: z.number() }))
        .mutation(async ({ input }) => {
          return await candidatesDb.incrementEmail(input.candidateId);
        }),

      toggleVisited: adminProcedure
        .input(z.object({ candidateId: z.number(), visited: z.boolean() }))
        .mutation(async ({ input }) => {
          return await candidatesDb.toggleVisited(input.candidateId, input.visited);
        }),

      reclassifyPartnerLeads: adminProcedure
        .mutation(async () => {
          return await reclassifyExistingPartnerLeads();
        }),

      importCSV: adminProcedure
        .input(z.object({
          candidates: z.array(z.object({
            companyName: z.string(),
            fullName: z.string(),
            city: z.string(),
            phoneNumber: z.string(),
            email: z.string(),
            priorityScore: z.number(),
            showroom: z.string(),
            vendSpa: z.string(),
            autreMarque: z.string(),
            domaineSimilaire: z.string(),
            notes: z.string().nullable().optional(),
            status: z.enum(["non_contacte", "en_cours", "valide", "archive"]).default("non_contacte"),
            latitude: z.string().nullable().optional(),
            longitude: z.string().nullable().optional(),
          })),
        }))
        .mutation(async ({ input }) => {
          return await candidatesDb.importCandidates(input.candidates);
        }),

      getContactHistory: adminProcedure
        .input(z.object({ candidateId: z.number() }))
        .query(async ({ input }) => {
          return await candidatesDb.getContactHistory(input.candidateId);
        }),

      addContactHistory: adminProcedure
        .input(z.object({
          candidateId: z.number(),
          type: z.enum(["appel", "email", "visite", "note"]),
          content: z.string(),
        }))
        .mutation(async ({ input }) => {
          await candidatesDb.addContactHistory(input);
          return { success: true };
        }),
    }),

    // Analytics & Charts
    analytics: router({
      // Sales by month
      salesByMonth: adminProcedure
        .input(z.object({ months: z.number().default(12) }).optional())
        .query(async ({ input }) => {
          return await db.getSalesByMonth(input?.months || 12);
        }),

      // Top products
      topProducts: adminProcedure
        .input(z.object({ limit: z.number().default(10) }).optional())
        .query(async ({ input }) => {
          return await db.getTopProducts(input?.limit || 10);
        }),

      // Partner performance
      partnerPerformance: adminProcedure
        .input(z.object({ limit: z.number().default(10) }).optional())
        .query(async ({ input }) => {
          return await db.getPartnerPerformance(input?.limit || 10);
        }),
    }),

    // Technical Resources
    technicalResources: router({
      // List all technical resources
      list: protectedProcedure
        .input(
          z
            .object({
              type: z.string().optional(),
              category: z.string().optional(),
              productCategory: z.string().optional(),
              search: z.string().optional(),
            })
            .optional()
        )
        .query(async ({ input }) => {
          return await db.getAllTechnicalResources(input || {});
        }),

      // Get single resource
      getById: protectedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          const resource = await db.getTechnicalResourceById(input.id);
          if (resource) {
            await db.incrementResourceViewCount(input.id);
          }
          return resource;
        }),

      // Create resource (admin only)
      create: adminProcedure
        .input(
          z.object({
            title: z.string(),
            description: z.string(),
            type: z.string(),
            fileUrl: z.string(),
            category: z.string(),
            productCategory: z.string().optional(),
            tags: z.string().optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          return await db.createTechnicalResource({
            ...input,
            createdBy: ctx.user.id,
          });
        }),

      // Update resource (admin only)
      update: adminProcedure
        .input(
          z.object({
            id: z.number(),
            title: z.string().optional(),
            description: z.string().optional(),
            type: z.string().optional(),
            fileUrl: z.string().optional(),
            category: z.string().optional(),
            productCategory: z.string().optional(),
            tags: z.string().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          return await db.updateTechnicalResource(id, data);
        }),

      // Delete resource (admin only)
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          return await db.deleteTechnicalResource(input.id);
        }),
    }),

    // Forum
    forum: router({
      // List all topics
      listTopics: protectedProcedure
        .input(
          z
            .object({
              category: z.string().optional(),
              productCategory: z.string().optional(),
              status: z.string().optional(),
              search: z.string().optional(),
            })
            .optional()
        )
        .query(async ({ input }) => {
          return await db.getAllForumTopics(input || {});
        }),

      // Get single topic with replies
      getTopic: protectedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          const topic = await db.getForumTopicById(input.id);
          if (!topic) return null;

          await db.incrementTopicViewCount(input.id);
          const replies = await db.getForumRepliesByTopicId(input.id);

          return { topic, replies };
        }),

      // Create topic
      createTopic: protectedProcedure
        .input(
          z.object({
            title: z.string(),
            description: z.string(),
            category: z.string(),
            productCategory: z.string().optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          return await db.createForumTopic({
            ...input,
            authorId: ctx.user.id,
          });
        }),

      // Create reply
      createReply: protectedProcedure
        .input(
          z.object({
            topicId: z.number(),
            content: z.string(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          const isAdmin = ctx.user.role === "SUPER_ADMIN" || ctx.user.role === "ADMIN";
          return await db.createForumReply({
            ...input,
            authorId: ctx.user.id,
            isAdminReply: isAdmin,
          });
        }),

      // Mark topic as resolved
      markResolved: protectedProcedure
        .input(z.object({ topicId: z.number() }))
        .mutation(async ({ input }) => {
          return await db.markTopicAsResolved(input.topicId);
        }),

      // Mark reply as helpful
      markHelpful: protectedProcedure
        .input(z.object({ replyId: z.number() }))
        .mutation(async ({ input }) => {
          return await db.markReplyAsHelpful(input.replyId);
        }),
    }),

    // ============================================
    // NEWSLETTER
    // ============================================
    newsletter: router({
      send: adminProcedure
        .input(
          z.object({
            subject: z.string().min(1, "Le sujet est requis"),
            title: z.string().min(1, "Le titre est requis"),
            content: z.string().min(1, "Le contenu est requis"),
            ctaText: z.string().optional(),
            ctaUrl: z.string().url().optional(),
            recipients: z.enum(['ALL', 'PARTNERS_ONLY', 'ADMINS_ONLY']).default('ALL'),
            isRawHtml: z.boolean().optional().default(false),
          })
        )
        .mutation(async ({ input }) => {
          let recipientEmails: string[] = [];
          if (input.recipients === 'ALL') {
            const allUsers = await db.getAllUsers();
            recipientEmails = allUsers.filter(u => u.isActive && u.email).map(u => u.email);
          } else if (input.recipients === 'PARTNERS_ONLY') {
            const allUsers = await db.getAllUsers();
            recipientEmails = allUsers.filter(u => u.isActive && u.email && u.role === 'PARTNER').map(u => u.email);
          } else if (input.recipients === 'ADMINS_ONLY') {
            const allUsers = await db.getAllUsers();
            recipientEmails = allUsers.filter(u => u.isActive && u.email && (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')).map(u => u.email);
          }
          if (recipientEmails.length === 0) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Aucun destinataire trouvé' });
          }
          const { createNewsletterTemplate, sendNewsletterEmail } = await import('./email');
          let htmlContent: string;
          if (input.isRawHtml) {
            htmlContent = `<!DOCTYPE html>\n<html lang="fr">\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${input.title}</title></head>\n<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f1f5f9;">\n<table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:32px 16px;">\n${input.content}\n</td></tr></table>\n</body></html>`;
          } else {
            htmlContent = createNewsletterTemplate(input.title, input.content, input.ctaText, input.ctaUrl);
          }
          const result = await sendNewsletterEmail(recipientEmails, input.subject, htmlContent);
          const successCount = result.results.filter(r => r.success).length;
          const failureCount = result.results.filter(r => !r.success).length;
          return {
            success: result.success,
            totalRecipients: recipientEmails.length,
            successCount,
            failureCount,
            message: `Newsletter envoyée à ${successCount}/${recipientEmails.length} destinataires`,
          };
        }),

      schedule: adminProcedure
        .input(
          z.object({
            subject: z.string().min(1, "Le sujet est requis"),
            title: z.string().min(1, "Le titre est requis"),
            content: z.string().min(1, "Le contenu est requis"),
            recipients: z.enum(['ALL', 'PARTNERS_ONLY', 'ADMINS_ONLY']).default('ALL'),
            scheduledAt: z.string().min(1, "La date de programmation est requise"),
          })
        )
        .mutation(async ({ input, ctx }) => {
          const scheduledDate = new Date(input.scheduledAt);
          if (scheduledDate <= new Date()) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'La date de programmation doit être dans le futur' });
          }
          const htmlContent = `<!DOCTYPE html>\n<html lang="fr">\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${input.title}</title></head>\n<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f1f5f9;">\n<table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:32px 16px;">\n${input.content}\n</td></tr></table>\n</body></html>`;
          const result = await db.createScheduledNewsletter({
            subject: input.subject,
            title: input.title,
            htmlContent,
            recipients: input.recipients,
            scheduledAt: scheduledDate,
            createdById: ctx.user.id,
          });
          return {
            success: true,
            id: result.id,
            scheduledAt: scheduledDate.toISOString(),
            message: `Newsletter programmée pour le ${scheduledDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
          };
        }),

      listScheduled: adminProcedure
        .query(async () => {
          return db.getScheduledNewsletters();
        }),

      cancel: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.cancelScheduledNewsletter(input.id);
          return { success: true, message: 'Newsletter annulée' };
        }),

      deleteScheduled: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteScheduledNewsletter(input.id);
          return { success: true, message: 'Newsletter supprimée' };
        }),

      uploadImage: adminProcedure
        .input(
          z.object({
            fileData: z.string().min(1, "Le fichier est requis"),
            fileName: z.string().min(1, "Le nom du fichier est requis"),
            fileType: z.string().min(1, "Le type du fichier est requis"),
          })
        )
        .mutation(async ({ input }) => {
          const { storagePut } = await import('./storage');
          const buffer = Buffer.from(input.fileData.split(',')[1] || input.fileData, 'base64');
          const ext = input.fileName.split('.').pop() || 'jpg';
          const fileKey = `newsletter-images/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
          const { url } = await storagePut(fileKey, buffer, input.fileType);
          return { success: true, url };
        }),
    }),
  }),

  // ============================================
  // TEAM MANAGEMENT
  // ============================================
  team: router({
    // List team members
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.partnerId) {
        throw new Error("User is not associated with a partner");
      }
      return await db.getTeamMembers(ctx.user.partnerId);
    }),

    // List pending invitations
    listInvitations: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.partnerId) {
        throw new Error("User is not associated with a partner");
      }
      return await db.getTeamInvitations(ctx.user.partnerId);
    }),

    // Invite a team member
    invite: protectedProcedure
      .input(
        z.object({
          email: z.string().email(),
          role: z.enum(["SALES_REP", "ORDER_MANAGER", "ACCOUNTANT", "FULL_MANAGER"]),
          customPermissions: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user.partnerId) {
          throw new Error("User is not associated with a partner");
        }

        // Check if user has permission to invite
        const member = await db.getTeamMember(ctx.user.id, ctx.user.partnerId);
        if (member) {
          const permissions = member.permissions ? JSON.parse(member.permissions) : null;
          if (!permissions?.team?.invite) {
            throw new Error("You don't have permission to invite team members");
          }
        } else if (ctx.user.role !== "PARTNER_ADMIN") {
          throw new Error("Only partner admins can invite team members");
        }

        return await db.createTeamInvitation({
          email: input.email,
          partnerId: ctx.user.partnerId,
          role: input.role,
          permissions: input.customPermissions || null,
          invitedBy: ctx.user.id,
        });
      }),

    // Cancel invitation
    cancelInvitation: protectedProcedure
      .input(z.object({ invitationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user.partnerId) {
          throw new Error("User is not associated with a partner");
        }
        return await db.cancelTeamInvitation(input.invitationId, ctx.user.partnerId);
      }),

    // Update member permissions
    updatePermissions: protectedProcedure
      .input(
        z.object({
          memberId: z.number(),
          role: z.enum(["SALES_REP", "ORDER_MANAGER", "ACCOUNTANT", "FULL_MANAGER", "OWNER"]),
          permissions: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user.partnerId) {
          throw new Error("User is not associated with a partner");
        }

        // Check if user has permission to manage team
        const member = await db.getTeamMember(ctx.user.id, ctx.user.partnerId);
        if (member) {
          const permissions = member.permissions ? JSON.parse(member.permissions) : null;
          if (!permissions?.team?.manage) {
            throw new Error("You don't have permission to manage team members");
          }
        } else if (ctx.user.role !== "PARTNER_ADMIN") {
          throw new Error("Only partner admins can manage team members");
        }

        return await db.updateTeamMemberPermissions({
          id: input.memberId,
          partnerId: ctx.user.partnerId,
          role: input.role,
          permissions: input.permissions || null,
        });
      }),

    // Remove team member
    remove: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user.partnerId) {
          throw new Error("User is not associated with a partner");
        }

        // Check if user has permission to manage team
        const member = await db.getTeamMember(ctx.user.id, ctx.user.partnerId);
        if (member) {
          const permissions = member.permissions ? JSON.parse(member.permissions) : null;
          if (!permissions?.team?.manage) {
            throw new Error("You don't have permission to remove team members");
          }
        } else if (ctx.user.role !== "PARTNER_ADMIN") {
          throw new Error("Only partner admins can remove team members");
        }

        return await db.removeTeamMember(input.memberId, ctx.user.partnerId);
      }),

    // Accept invitation (public route with token)
    acceptInvitation: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        return await db.acceptTeamInvitation(input.token);
      }),
  }),

  // ============================================
  // RETURNS
  // ============================================
  returns: router({
    // Create a return request
    create: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
          items: z.array(
            z.object({
              productId: z.number(),
              quantity: z.number(),
              reason: z.enum(["DEFECTIVE", "WRONG_ITEM", "NOT_AS_DESCRIBED", "CHANGED_MIND", "OTHER"]),
              reasonDetails: z.string().optional(),
              unitPrice: z.number().optional(),
            })
          ),
          notes: z.string().optional(),
          photos: z.array(
            z.object({
              base64: z.string(),
              mimeType: z.string(),
              description: z.string().optional(),
            })
          ).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.partnerId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Partner ID required" });
        }

        // Upload photos to S3 if provided
        const uploadedPhotos: Array<{ url: string; key: string; description?: string }> = [];
        if (input.photos && input.photos.length > 0) {
          for (const photo of input.photos) {
            const buffer = Buffer.from(photo.base64, "base64");
            const fileKey = `returns/${ctx.user.partnerId}/${Date.now()}-${nanoid()}.jpg`;
            const { url } = await storagePut(fileKey, buffer, photo.mimeType);
            uploadedPhotos.push({
              url,
              key: fileKey,
              description: photo.description,
            });
          }
        }

        const returnId = await db.createReturn({
          orderId: input.orderId,
          partnerId: ctx.user.partnerId,
          items: input.items,
          notes: input.notes,
          photos: uploadedPhotos,
        });

        return { returnId };
      }),

    // List returns
    list: protectedProcedure
      .input(
        z.object({
          status: z.string().optional(),
          orderId: z.number().optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        const isAdmin = ctx.user.role === "SUPER_ADMIN" || ctx.user.role === "ADMIN";

        if (isAdmin) {
          return await db.getReturns(input);
        } else if (ctx.user.partnerId) {
          return await db.getReturns({
            partnerId: ctx.user.partnerId,
            ...input,
          });
        }

        return [];
      }),

    // Get return by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const returnData = await db.getReturnById(input.id);

        if (!returnData) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Return not found" });
        }

        const isAdmin = ctx.user.role === "SUPER_ADMIN" || ctx.user.role === "ADMIN";

        // Check access
        if (!isAdmin && returnData.return.partnerId !== ctx.user.partnerId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });
        }

        return returnData;
      }),

    // Update return status (admin only)
    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["REQUESTED", "APPROVED", "REJECTED", "IN_TRANSIT", "RECEIVED", "REFUNDED"]),
          adminNotes: z.string().optional(),
          refundAmount: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateReturnStatus(
          input.id,
          input.status,
          input.adminNotes,
          input.refundAmount
        );
        return { success: true };
      }),

    // Add note to return
    addNote: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          note: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const returnData = await db.getReturnById(input.id);

        if (!returnData) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Return not found" });
        }

        const isAdmin = ctx.user.role === "SUPER_ADMIN" || ctx.user.role === "ADMIN";

        // Check access
        if (!isAdmin && returnData.return.partnerId !== ctx.user.partnerId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });
        }

        await db.addReturnNote(input.id, input.note, isAdmin);
        return { success: true };
      }),
  }),

  // ============================================
  // AFTER-SALES SERVICE (SAV) - SYSTÈME INTELLIGENT
  // ============================================
  afterSales: router({
    // ===== REFERENCE DATA (public for authenticated users) =====
    getComponentsByBrand: protectedProcedure
      .input(z.object({ brand: z.string() }))
      .query(({ input }) => {
        return COMPONENTS_BY_BRAND[input.brand as SavBrand] || [];
      }),

    getDefectTypesByComponent: protectedProcedure
      .input(z.object({ component: z.string() }))
      .query(({ input }) => {
        return DEFECT_TYPES_BY_COMPONENT[input.component] || ["Autre"];
      }),

    getProductLinesByBrand: protectedProcedure
      .input(z.object({ brand: z.string() }))
      .query(({ input }) => {
        return PRODUCT_LINES_BY_BRAND[input.brand as SavBrand] || [];
      }),

    // ===== WARRANTY ANALYSIS =====
    analyzeWarranty: protectedProcedure
      .input(z.object({
        brand: z.string(),
        productLine: z.string().optional(),
        component: z.string(),
        defectType: z.string(),
        purchaseDate: z.string(),
        deliveryDate: z.string(),
        usageType: z.enum(["PRIVATE", "COMMERCIAL", "HOLIDAY_LET"]).default("PRIVATE"),
        isOriginalBuyer: z.boolean().default(true),
        isModified: z.boolean().default(false),
        isMaintenanceConform: z.boolean().default(true),
        isChemistryConform: z.boolean().default(true),
        usesHydrogenPeroxide: z.boolean().default(false),
      }))
      .query(({ input }) => {
        return analyzeWarranty(input as WarrantyInput);
      }),

    // ===== CREATE TICKET =====
    create: protectedProcedure
      .input(z.object({
        productId: z.number().optional(),
        serialNumber: z.string().min(1),
        issueType: z.string(),
        description: z.string().min(10),
        urgency: z.enum(["NORMAL", "URGENT", "CRITICAL"]).default("NORMAL"),
        brand: z.string().optional(),
        productLine: z.string().optional(),
        modelName: z.string().optional(),
        component: z.string().optional(),
        defectType: z.string().optional(),
        purchaseDate: z.string().optional(),
        deliveryDate: z.string().optional(),
        usageType: z.enum(["PRIVATE", "COMMERCIAL", "HOLIDAY_LET"]).default("PRIVATE"),
        isOriginalBuyer: z.boolean().default(true),
        isModified: z.boolean().default(false),
        isMaintenanceConform: z.boolean().default(true),
        isChemistryConform: z.boolean().default(true),
        usesHydrogenPeroxide: z.boolean().default(false),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        customerEmail: z.string().optional(),
        customerAddress: z.string().optional(),
        installationDate: z.string().optional(),
        partnerId: z.number().optional(),
        media: z.array(z.object({
          base64: z.string(),
          mimeType: z.string(),
          type: z.enum(["IMAGE", "VIDEO"]),
          description: z.string().optional(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let partnerId = input.partnerId || ctx.user.partnerId;
        if (input.partnerId && ctx.user.partnerId && input.partnerId !== ctx.user.partnerId && ctx.user.role !== "ADMIN" && ctx.user.role !== "SUPER_ADMIN") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Vous ne pouvez créer des tickets SAV que pour votre propre partenaire." });
        }
        if (!partnerId && ctx.user.role !== "ADMIN" && ctx.user.role !== "SUPER_ADMIN") {
          throw new TRPCError({ code: "FORBIDDEN", message: "ID partenaire requis." });
        }
        if (!partnerId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Veuillez sélectionner un partenaire." });
        }

        // Upload media to S3
        const uploadedMedia: Array<{ url: string; key: string; type: "IMAGE" | "VIDEO"; description?: string }> = [];
        if (input.media && input.media.length > 0) {
          for (const item of input.media) {
            const buffer = Buffer.from(item.base64, "base64");
            const ext = item.type === "VIDEO" ? "mp4" : "jpg";
            const fileKey = `sav/${partnerId}/${Date.now()}-${nanoid()}.${ext}`;
            const { url } = await storagePut(fileKey, buffer, item.mimeType);
            uploadedMedia.push({ url, key: fileKey, type: item.type, description: item.description });
          }
        }

        // Run warranty analysis if enough data
        let warrantyResult = null;
        if (input.brand && input.component && input.defectType && input.purchaseDate && input.deliveryDate) {
          try {
            warrantyResult = analyzeWarranty({
              brand: input.brand as SavBrand,
              productLine: input.productLine,
              component: input.component,
              defectType: input.defectType,
              purchaseDate: input.purchaseDate,
              deliveryDate: input.deliveryDate,
              usageType: input.usageType as UsageType,
              isOriginalBuyer: input.isOriginalBuyer,
              isModified: input.isModified,
              isMaintenanceConform: input.isMaintenanceConform,
              isChemistryConform: input.isChemistryConform,
              usesHydrogenPeroxide: input.usesHydrogenPeroxide,
            });
          } catch (err) {
            console.error("Warranty analysis failed:", err);
          }
        }

        const result = await savDb.createSavTicket({
          partnerId,
          productId: input.productId,
          serialNumber: input.serialNumber,
          issueType: input.issueType,
          description: input.description,
          urgency: input.urgency,
          brand: input.brand,
          productLine: input.productLine,
          modelName: input.modelName,
          component: input.component,
          defectType: input.defectType,
          purchaseDate: input.purchaseDate,
          deliveryDate: input.deliveryDate,
          usageType: input.usageType,
          isOriginalBuyer: input.isOriginalBuyer,
          isModified: input.isModified,
          isMaintenanceConform: input.isMaintenanceConform,
          isChemistryConform: input.isChemistryConform,
          usesHydrogenPeroxide: input.usesHydrogenPeroxide,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail,
          customerAddress: input.customerAddress,
          installationDate: input.installationDate,
          media: uploadedMedia,
          warrantyStatus: warrantyResult?.status,
          warrantyPercentage: warrantyResult?.percentage,
          warrantyExpiryDate: warrantyResult?.expiryDate || undefined,
          warrantyAnalysisDetails: warrantyResult ? JSON.stringify(warrantyResult) : undefined,
        });

        // Notify admin
        const urgencyLabel = input.urgency === "CRITICAL" ? "CRITIQUE" : input.urgency === "URGENT" ? "URGENT" : "";
        await notifyOwner({
          title: `Nouveau ticket SAV ${urgencyLabel} - ${result.ticketNumber}`,
          content: `Ticket: ${result.ticketNumber}\nMarque: ${input.brand || "N/A"}\nModèle: ${input.modelName || "N/A"}\nComposant: ${input.component || "N/A"}\nGarantie: ${warrantyResult?.status || "À analyser"}\nDescription: ${input.description.substring(0, 200)}`,
        }).catch(err => console.error("Failed to send SAV notification:", err));

        return { ...result, warrantyAnalysis: warrantyResult };
      }),

    // ===== LIST TICKETS =====
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        urgency: z.string().optional(),
        brand: z.string().optional(),
        warrantyStatus: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        customerName: z.string().optional(),
        search: z.string().optional(),
        orderBy: z.string().optional(),
        orderDirection: z.enum(["asc", "desc"]).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const isAdmin = ctx.user.role === "SUPER_ADMIN" || ctx.user.role === "ADMIN";
        if (isAdmin) {
          return await savDb.getSavTickets(input || undefined);
        } else if (ctx.user.partnerId) {
          return await savDb.getSavTickets({ partnerId: ctx.user.partnerId, ...input });
        }
        return [];
      }),

    // ===== GET TICKET BY ID =====
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const serviceData = await savDb.getSavTicketById(input.id);
        if (!serviceData) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ticket SAV non trouvé." });
        }
        const isAdmin = ctx.user.role === "SUPER_ADMIN" || ctx.user.role === "ADMIN";
        if (!isAdmin && serviceData.service.partnerId !== ctx.user.partnerId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Accès non autorisé." });
        }
        return serviceData;
      }),

    // ===== UPDATE STATUS (admin) =====
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["NEW", "ANALYZING", "INFO_REQUIRED", "QUOTE_PENDING", "PAYMENT_PENDING", "PAYMENT_CONFIRMED", "PARTS_ORDERED", "SHIPPED", "RESOLVED", "CLOSED"]),
        resolutionNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const service = await savDb.getSavTicketById(input.id);
        if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket non trouvé." });

        const previousStatus = service.service.status;
        await savDb.updateSavTicket(input.id, {
          status: input.status as any,
          resolutionNotes: input.resolutionNotes,
        });

        // Record status history
        await savDb.addSavStatusHistory(input.id, previousStatus, input.status, ctx.user.id, input.resolutionNotes);

        // Notify partner
        const statusLabels: Record<string, string> = {
          NEW: "Nouveau", ANALYZING: "En cours d'analyse", INFO_REQUIRED: "Informations requises",
          QUOTE_PENDING: "Devis en attente", PAYMENT_PENDING: "Paiement en attente",
          PAYMENT_CONFIRMED: "Paiement confirmé", PARTS_ORDERED: "Pièces commandées",
          SHIPPED: "Expédié", RESOLVED: "Résolu", CLOSED: "Fermé",
        };
        await notifyOwner({
          title: `Ticket SAV ${service.service.ticketNumber} - ${statusLabels[input.status] || input.status}`,
          content: `Le statut du ticket a été mis à jour : ${statusLabels[input.status]}${input.resolutionNotes ? `\nNotes: ${input.resolutionNotes}` : ""}`,
        }).catch(err => console.error("Failed to send status notification:", err));

        try {
          notifyPartner(service.service.partnerId, "sav:status_changed", {
            savId: input.id,
            ticketNumber: service.service.ticketNumber,
            oldStatus: previousStatus,
            newStatus: input.status,
          });
        } catch (err) {
          console.error("Failed to send WebSocket notification:", err);
        }

        return { success: true };
      }),

    // ===== WARRANTY DECISION (admin) =====
    updateWarrantyDecision: adminProcedure
      .input(z.object({
        id: z.number(),
        warrantyStatus: z.enum(["COVERED", "PARTIAL", "EXPIRED", "EXCLUDED", "REVIEW_NEEDED"]),
        warrantyPercentage: z.number().min(0).max(100),
        adminNotes: z.string(),
        adminOverride: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        await savDb.updateSavWarrantyDecision(
          input.id,
          input.warrantyStatus,
          input.warrantyPercentage,
          input.adminNotes,
          input.adminOverride
        );

        // If not covered or partial, set status to QUOTE_PENDING
        if (input.warrantyStatus === "EXPIRED" || input.warrantyStatus === "EXCLUDED") {
          await savDb.updateSavTicket(input.id, { status: "QUOTE_PENDING" as any });
        } else if (input.warrantyStatus === "PARTIAL") {
          await savDb.updateSavTicket(input.id, { status: "QUOTE_PENDING" as any });
        } else if (input.warrantyStatus === "COVERED") {
          await savDb.updateSavTicket(input.id, { status: "PARTS_ORDERED" as any });
        }

        return { success: true };
      }),

    // ===== LINK SPARE PARTS TO TICKET (admin) =====
    linkSparePart: adminProcedure
      .input(z.object({
        serviceId: z.number(),
        sparePartId: z.number(),
        quantity: z.number().min(1).default(1),
        unitPrice: z.string(),
        isCoveredByWarranty: z.boolean().default(false),
        coveragePercentage: z.number().min(0).max(100).default(0),
      }))
      .mutation(async ({ input }) => {
        return await savDb.linkSparePartToSav(input);
      }),

    unlinkSparePart: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await savDb.unlinkSparePartFromSav(input.id);
      }),

    getSavSpareParts: protectedProcedure
      .input(z.object({ serviceId: z.number() }))
      .query(async ({ input }) => {
        return await savDb.getSavSpareParts(input.serviceId);
      }),

    // ===== CALCULATE TOTAL (for payment) =====
    calculateTotal: protectedProcedure
      .input(z.object({ serviceId: z.number() }))
      .query(async ({ input }) => {
        return await savDb.calculateSavTotal(input.serviceId);
      }),

    // ===== SET SHIPPING COST (admin) =====
    setShippingCost: adminProcedure
      .input(z.object({
        serviceId: z.number(),
        shippingCost: z.string(),
      }))
      .mutation(async ({ input }) => {
        await savDb.updateSavTicket(input.serviceId, { shippingCost: input.shippingCost });
        // Recalculate total
        const total = await savDb.calculateSavTotal(input.serviceId);
        if (total) {
          await savDb.updateSavTicket(input.serviceId, { totalAmount: total.totalTTC.toFixed(2) });
        }
        return { success: true, total };
      }),

    // ===== CREATE PAYMENT (Stripe) =====
    createPayment: protectedProcedure
      .input(z.object({ serviceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const service = await savDb.getSavTicketById(input.serviceId);
        if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket non trouvé." });

        const isAdmin = ctx.user.role === "SUPER_ADMIN" || ctx.user.role === "ADMIN";
        if (!isAdmin && service.service.partnerId !== ctx.user.partnerId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Accès non autorisé." });
        }

        const total = await savDb.calculateSavTotal(input.serviceId);
        if (!total || total.totalTTC <= 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Aucun montant à payer." });
        }

        // Create Stripe Checkout Session
        const stripe = (await import("stripe")).default;
        const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);

        const lineItems = total.parts.map(p => ({
          price_data: {
            currency: "eur",
            product_data: {
              name: `${p.name} (${p.reference})`,
              description: p.coveragePercentage > 0 ? `Couverture garantie: ${p.coveragePercentage}%` : undefined,
            },
            unit_amount: Math.round(p.customerPrice * 100 / p.quantity), // cents
          },
          quantity: p.quantity,
        }));

        if (total.shippingCost > 0) {
          lineItems.push({
            price_data: {
              currency: "eur",
              product_data: {
                name: "Frais de livraison",
                description: undefined,
              },
              unit_amount: Math.round(total.shippingCost * 100),
            },
            quantity: 1,
          });
        }

        const origin = ctx.req?.headers?.origin || process.env.SITE_URL || "";
        const session = await stripeClient.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: lineItems,
          mode: "payment",
          success_url: `${origin}/after-sales/${input.serviceId}?payment=success`,
          cancel_url: `${origin}/after-sales/${input.serviceId}?payment=cancelled`,
          customer_email: ctx.user.email || undefined,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            sav_id: input.serviceId.toString(),
            ticket_number: service.service.ticketNumber,
            user_id: ctx.user.id.toString(),
          },
          allow_promotion_codes: true,
        });

        // Update ticket with payment intent
        await savDb.updateSavPayment(input.serviceId, {
          totalAmount: total.totalTTC.toFixed(2),
          stripePaymentIntentId: session.payment_intent as string || session.id,
        });
        await savDb.updateSavTicket(input.serviceId, { status: "PAYMENT_PENDING" as any });

        return { checkoutUrl: session.url };
      }),

    // ===== ADD TRACKING (admin) =====
    addTracking: adminProcedure
      .input(z.object({
        serviceId: z.number(),
        trackingNumber: z.string().min(1),
        trackingCarrier: z.enum(["BPOST", "DHL", "UPS", "GLS", "MONDIAL_RELAY", "OTHER"]).default("BPOST"),
      }))
      .mutation(async ({ input }) => {
        const trackingUrl = generateTrackingUrl(input.trackingCarrier, input.trackingNumber);
        await savDb.updateSavTracking(input.serviceId, {
          trackingNumber: input.trackingNumber,
          trackingCarrier: input.trackingCarrier,
          trackingUrl,
        });

        // Notify partner
        const service = await savDb.getSavTicketById(input.serviceId);
        if (service) {
          try {
            notifyPartner(service.service.partnerId, "sav:shipped", {
              savId: input.serviceId,
              ticketNumber: service.service.ticketNumber,
              trackingNumber: input.trackingNumber,
              trackingUrl,
            });
          } catch (err) {
            console.error("Failed to send shipping notification:", err);
          }
        }

        return { success: true, trackingUrl };
      }),

    // ===== ADD NOTE =====
    addNote: protectedProcedure
      .input(z.object({
        id: z.number(),
        note: z.string(),
        isInternal: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const serviceData = await savDb.getSavTicketById(input.id);
        if (!serviceData) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket non trouvé." });

        const isAdmin = ctx.user.role === "SUPER_ADMIN" || ctx.user.role === "ADMIN";
        if (!isAdmin && serviceData.service.partnerId !== ctx.user.partnerId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Accès non autorisé." });
        }
        const noteIsInternal = isAdmin && input.isInternal;
        await savDb.addSavNote(input.id, ctx.user.id, input.note, noteIsInternal);
        return { success: true };
      }),

    // ===== COMPATIBLE PARTS =====
    getCompatibleParts: protectedProcedure
      .input(z.object({
        brand: z.string(),
        modelName: z.string().optional(),
        component: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await savDb.getCompatibleParts(input.brand, input.modelName, input.component);
      }),

    // ===== STATS =====
    stats: adminProcedure
      .input(z.object({ period: z.string().optional().default("8weeks") }))
      .query(async ({ input }) => {
        return await savDb.getSavStats(input.period);
      }),

    weeklyStats: adminProcedure
      .input(z.object({ period: z.string().optional().default("8weeks") }))
      .query(async ({ input }) => {
        return await savDb.getSavWeeklyStats(input.period);
      }),

    statusHistory: protectedProcedure
      .input(z.object({ serviceId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAfterSalesStatusHistory(input.serviceId);
      }),

    responseTemplates: adminProcedure
      .query(async () => {
        return await db.getResponseTemplates();
      }),
  }),

  // ============================================
  // SPARE PARTS (Pièces détachées)
  // ============================================
  spareParts: router({
    list: protectedProcedure
      .input(z.object({
        category: z.string().optional(),
        brand: z.string().optional(),
        modelName: z.string().optional(),
        component: z.string().optional(),
        search: z.string().optional(),
        isActive: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await savDb.getSparePartsList(input || undefined);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const part = await savDb.getSparePartById(input.id);
        if (!part) throw new TRPCError({ code: "NOT_FOUND", message: "Pièce non trouvée." });
        return part;
      }),

    create: adminProcedure
      .input(z.object({
        reference: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string(),
        priceHT: z.string(),
        vatRate: z.string().optional(),
        stockQuantity: z.number().optional(),
        lowStockThreshold: z.number().optional(),
        imageUrl: z.string().optional(),
        weight: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await savDb.createSparePart(input);
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: z.record(z.any()),
      }))
      .mutation(async ({ input }) => {
        return await savDb.updateSparePart(input.id, input.data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await savDb.deleteSparePart(input.id);
      }),

    addCompatibility: adminProcedure
      .input(z.object({
        sparePartId: z.number(),
        brand: z.string(),
        productLine: z.string().optional(),
        modelName: z.string().optional(),
        component: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await savDb.addSparePartCompatibility(input);
      }),

    removeCompatibility: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await savDb.removeSparePartCompatibility(input.id);
      }),
  }),

  // ============================================
  // WARRANTY RULES (admin)
  // ============================================
  warrantyRules: router({
    list: adminProcedure
      .input(z.object({
        brand: z.string().optional(),
        component: z.string().optional(),
        isActive: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await savDb.getWarrantyRulesList(input || undefined);
      }),

    create: adminProcedure
      .input(z.object({
        brand: z.string(),
        productLine: z.string().optional(),
        component: z.string(),
        warrantyMonths: z.number(),
        coveragePercentage: z.number().default(100),
        coverageRules: z.string().optional(),
        exclusions: z.string().optional(),
        warrantyStartType: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await savDb.createWarrantyRule(input);
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: z.record(z.any()),
      }))
      .mutation(async ({ input }) => {
        return await savDb.updateWarrantyRule(input.id, input.data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await savDb.deleteWarrantyRule(input.id);
      }),
  }),

  // ============================================
  // META ADS INTEGRATION
  // ============================================
  metaAds: router({
    // Get OAuth URL to connect Meta account
    getOAuthUrl: adminProcedure
      .query(async ({ ctx }) => {
        // Use the production site URL for the redirect URI
        // Facebook Login for Business redirects directly to the frontend page
        // The redirect_uri must match exactly what Facebook uses
        const siteUrl = process.env.SITE_URL || process.env.VITE_APP_URL || ctx.req?.headers?.origin || "";
        const redirectUri = `${siteUrl}/admin/leads`;
        const state = Buffer.from(JSON.stringify({ userId: ctx.user.id })).toString("base64");
        const url = metaOAuth.getMetaOAuthUrl(redirectUri, state);
        return { url, redirectUri };
      }),

    // Handle OAuth callback - exchange code for token
    handleCallback: adminProcedure
      .input(z.object({
        code: z.string(),
        redirectUri: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Exchange code for short-lived token
        const tokenResponse = await metaOAuth.exchangeCodeForToken(input.code, input.redirectUri);
        
        // Exchange for long-lived token (60 days)
        const longLivedToken = await metaOAuth.getLongLivedToken(tokenResponse.access_token);
        
        // Get user info
        const userInfo = await metaOAuth.getMetaUserInfo(longLivedToken.access_token);
        
        // Get ad accounts
        const adAccounts = await metaOAuth.getAdAccounts(longLivedToken.access_token);
        
        return {
          accessToken: longLivedToken.access_token,
          expiresIn: longLivedToken.expires_in,
          metaUserId: userInfo.id,
          metaUserName: userInfo.name,
          adAccounts: adAccounts.map(acc => ({
            id: acc.id,
            name: acc.name,
            accountId: acc.account_id,
            currency: acc.currency,
            timezone: acc.timezone_name,
          })),
        };
      }),

    // Save selected ad account connection
    connectAdAccount: adminProcedure
      .input(z.object({
        metaUserId: z.string(),
        metaUserName: z.string(),
        adAccountId: z.string(),
        adAccountName: z.string(),
        currency: z.string().optional(),
        timezone: z.string().optional(),
        accessToken: z.string(),
        tokenExpiresAt: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        console.log(`[Meta Ads] Connecting ad account ${input.adAccountId} for user ${ctx.user.id}`);
        try {
          const result = await db.connectMetaAdAccount({
            metaUserId: input.metaUserId,
            metaUserName: input.metaUserName,
            adAccountId: input.adAccountId,
            adAccountName: input.adAccountName,
            currency: input.currency || "EUR",
            timezone: input.timezone,
            accessToken: input.accessToken,
            tokenExpiresAt: input.tokenExpiresAt ? new Date(input.tokenExpiresAt) : null,
            connectedBy: ctx.user.id,
          });
          console.log(`[Meta Ads] Account connected successfully, id: ${result.id}`);
          return result;
        } catch (error: any) {
          console.error(`[Meta Ads] Error connecting account:`, error.message);
          throw error;
        }
      }),

    // Disconnect ad account
    disconnectAdAccount: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.disconnectMetaAdAccount(input.id);
      }),

    // Get connected ad accounts
    getConnectedAccounts: adminProcedure
      .query(async () => {
        return db.getConnectedMetaAdAccounts();
      }),

    // Fetch campaigns from connected Meta account
    getCampaigns: adminProcedure
      .input(z.object({
        adAccountId: z.string().optional(),
        datePreset: z.string().optional().default("last_30d"),
        since: z.string().optional(),
        until: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const accounts = await db.getConnectedMetaAdAccounts();
        console.log(`[Meta Ads] getCampaigns: found ${accounts.length} connected accounts`);
        if (accounts.length === 0) {
          return { connected: false, campaigns: [], accounts: [] };
        }

        const targetAccount = input?.adAccountId
          ? accounts.find(a => a.adAccountId === input.adAccountId)
          : accounts[0];

        if (!targetAccount) {
          return { connected: true, campaigns: [], accounts };
        }

        try {
          // Validate token first
          const isValid = await metaOAuth.validateToken(targetAccount.accessToken);
          if (!isValid) {
            await db.updateMetaAdAccountSyncError(targetAccount.id, "Token expiré - veuillez reconnecter votre compte Meta");
            return { connected: true, campaigns: [], accounts, error: "Token expiré" };
          }

          const timeRange = input?.since && input?.until 
            ? { since: input.since, until: input.until } 
            : undefined;
          const campaigns = await metaOAuth.getCampaignsWithInsights(
            targetAccount.adAccountId,
            targetAccount.accessToken,
            input?.datePreset || "last_30d",
            timeRange
          );

          // Update last synced
          await db.updateMetaAdAccountLastSynced(targetAccount.id);

          return {
            connected: true,
            campaigns,
            accounts,
            currentAccount: {
              id: targetAccount.id,
              adAccountId: targetAccount.adAccountId,
              adAccountName: targetAccount.adAccountName,
              currency: targetAccount.currency,
              lastSyncedAt: targetAccount.lastSyncedAt,
            },
          };
        } catch (error: any) {
          console.error("[Meta] Erreur récupération campagnes:", error);
          await db.updateMetaAdAccountSyncError(targetAccount.id, error.message);
          return { connected: true, campaigns: [], accounts, error: error.message };
        }
      }),

    // Fetch daily insights for chart
    getDailyInsights: adminProcedure
      .input(z.object({
        datePreset: z.string().optional().default("last_30d"),
        since: z.string().optional(),
        until: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const accounts = await db.getConnectedMetaAdAccounts();
        if (accounts.length === 0) {
          return { connected: false, dailyData: [] };
        }

        const targetAccount = accounts[0];
        try {
          const isValid = await metaOAuth.validateToken(targetAccount.accessToken);
          if (!isValid) {
            return { connected: true, dailyData: [], error: "Token expir\u00e9" };
          }

          const timeRange = input?.since && input?.until
            ? { since: input.since, until: input.until }
            : undefined;
          const dailyData = await metaOAuth.getDailyInsights(
            targetAccount.adAccountId,
            targetAccount.accessToken,
            input?.datePreset || "last_30d",
            timeRange
          );

          return { connected: true, dailyData };
        } catch (error: any) {
          console.error("[Meta] Erreur r\u00e9cup\u00e9ration insights quotidiens:", error);
          return { connected: true, dailyData: [], error: error.message };
        }
      }),
    // Compare two periods
    getComparisonInsights: adminProcedure
      .input(z.object({
        currentPeriod: z.object({ since: z.string(), until: z.string() }),
        previousPeriod: z.object({ since: z.string(), until: z.string() }),
      }))
      .query(async ({ input }) => {
        const accounts = await db.getConnectedMetaAdAccounts();
        if (accounts.length === 0) {
          return { connected: false, current: null, previous: null };
        }

        const targetAccount = accounts[0];
        try {
          const isValid = await metaOAuth.validateToken(targetAccount.accessToken);
          if (!isValid) {
            return { connected: true, current: null, previous: null, error: "Token expiré" };
          }

          const [current, previous] = await Promise.all([
            metaOAuth.getPeriodInsights(targetAccount.adAccountId, targetAccount.accessToken, input.currentPeriod),
            metaOAuth.getPeriodInsights(targetAccount.adAccountId, targetAccount.accessToken, input.previousPeriod),
          ]);

          return {
            connected: true,
            current,
            previous,
            currentPeriod: input.currentPeriod,
            previousPeriod: input.previousPeriod,
          };
        } catch (error: any) {
          console.error("[Meta] Erreur comparaison périodes:", error);
          return { connected: true, current: null, previous: null, error: error.message };
        }
      }),

    // Synchronisation manuelle des leads depuis les formulaires Meta (rattrapage)
    syncLeads: adminProcedure
      .input(z.object({
        since: z.string().optional(), // ISO date string, default: 7 jours
      }).optional())
      .mutation(async () => {
        const accounts = await db.getConnectedMetaAdAccounts();
        if (accounts.length === 0) {
          return { success: false, error: "Aucun compte Meta connecté", imported: 0, skipped: 0 };
        }

        const targetAccount = accounts[0];
        const isValid = await metaOAuth.validateToken(targetAccount.accessToken);
        if (!isValid) {
          return { success: false, error: "Token Meta expiré - veuillez reconnecter votre compte", imported: 0, skipped: 0 };
        }

        // Récupérer les formulaires
        const forms = await metaOAuth.getLeadForms(targetAccount.accessToken);
        if (forms.length === 0) {
          return { success: false, error: "Aucun formulaire Lead Ads trouvé", imported: 0, skipped: 0 };
        }

        // Date de début : dernier lead Meta connu ou 30 jours
        const mysql2 = await import('mysql2/promise');
        const conn = await mysql2.createConnection(process.env.DATABASE_URL!);
        const [lastLeadRows] = await conn.execute('SELECT MAX(receivedAt) as lastDate FROM leads WHERE source = "META_ADS"') as any;
        const lastLeadDate = lastLeadRows[0]?.lastDate ? new Date(lastLeadRows[0].lastDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        // Reculer de 1 heure pour éviter les ratages
        lastLeadDate.setHours(lastLeadDate.getHours() - 1);

        let imported = 0;
        let skipped = 0;

        for (const form of forms) {
          const formLeads = await metaOAuth.getLeadsFromForm(form.id, form.pageToken, lastLeadDate);
          
          for (const leadData of formLeads) {
            // Vérifier si le lead existe déjà
            const [existing] = await conn.execute(
              'SELECT id FROM leads WHERE metaLeadgenId = ?',
              [leadData.id]
            ) as any;

            if (existing.length > 0) {
              skipped++;
              continue;
            }

            // Parser les champs
            const fields: Record<string, string> = {};
            for (const field of (leadData.field_data || [])) {
              fields[field.name.toLowerCase()] = field.values[0] || "";
            }

            const firstName = fields.first_name || fields.full_name?.split(' ')[0] || "";
            const lastName = fields.last_name || fields.full_name?.split(' ').slice(1).join(' ') || "";
            const email = fields.email || "";
            const phone = fields.phone_number || fields.phone || "";
            const postalCode = fields.postal_code || fields.zip || fields.code_postal || "";
            const city = fields.city || fields.ville || "";
            const message = fields.message || fields.comments || "";
            const productInterest = fields.product_interest || fields.produit || "";

            // Détecter si c'est un lead partenariat (Devenir Partenaire)
            const { isPartnerLead } = await import('./meta-leads');
            const isPartnership = isPartnerLead(fields);
            const leadType = isPartnership ? 'PARTENARIAT' : 'VENTE';

            await conn.execute(
              `INSERT INTO leads (firstName, lastName, email, phone, postalCode, city, source, status, leadType, metaLeadgenId, metaFormId, productInterest, message, customFields, receivedAt, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?, ?, 'META_ADS', 'NEW', ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [firstName, lastName, email, phone, postalCode, city, leadType, leadData.id, form.id, productInterest, message, JSON.stringify(fields), new Date(leadData.created_time)]
            );

            imported++;
          }
        }

        await conn.end();

        // Créer automatiquement les candidats partenaires pour les leads PARTENARIAT importés
        if (imported > 0) {
          try {
            const { reclassifyExistingPartnerLeads } = await import('./meta-leads');
            const reclassResult = await reclassifyExistingPartnerLeads();
            console.log(`[Meta Sync] Candidats partenaires créés: ${reclassResult.created}, déjà existants: ${reclassResult.alreadyExists}`);
          } catch (e) {
            console.error('[Meta Sync] Erreur création candidats partenaires:', e);
          }
        }

        // Notifier les admins si de nouveaux leads ont été importés
        if (imported > 0) {
          notifyAdmins("leads:refresh", { timestamp: Date.now() });
        }

        return { success: true, imported, skipped, forms: forms.length };
      }),
  }),

  // ============================================
  // GOOGLE ADS INTEGRATION
  // ============================================
  googleAds: router({
    // Get OAuth URL to connect Google Ads account
    getOAuthUrl: adminProcedure
      .query(async ({ ctx }) => {
        const googleAdsOAuth = await import("./google-ads-oauth");
        const state = Buffer.from(JSON.stringify({ userId: ctx.user.id })).toString("base64");
        const url = googleAdsOAuth.getGoogleAdsAuthUrl(state);
        return { url };
      }),

    // Handle OAuth callback - exchange code for token and save connection
    handleCallback: adminProcedure
      .input(z.object({
        code: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const googleAdsOAuth = await import("./google-ads-oauth");
        
        console.log(`[Google Ads OAuth] Exchanging code for tokens for user ${ctx.user.id}`);
        
        // Exchange code for tokens
        const tokens = await googleAdsOAuth.exchangeCodeForTokens(input.code);
        
        // Get user info
        const userInfo = await googleAdsOAuth.getGoogleUserInfo(tokens.accessToken);
        
        console.log(`[Google Ads OAuth] Token exchange successful for ${userInfo.googleUserEmail}`);
        
        // Automatically save the connection to database
        // Use a default customer ID (the user can update it later if they have multiple accounts)
        const result = await db.connectGoogleAdAccount({
          googleUserId: userInfo.googleUserId,
          googleUserEmail: userInfo.googleUserEmail,
          customerId: "PENDING", // Placeholder - will be updated when fetching campaigns
          customerName: userInfo.googleUserName || userInfo.googleUserEmail || "Compte Google Ads",
          currency: "EUR",
          timezone: undefined,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: tokens.expiresAt,
          connectedBy: ctx.user.id,
        });
        
        console.log(`[Google Ads OAuth] Account saved to database with ID ${result.id}`);
        
        // Try to fetch accessible customer IDs and update the account
        try {
          const googleAdsApi = await import('./google-ads-api');
          const customerIds = await googleAdsApi.listAccessibleCustomers(tokens.accessToken);
          console.log(`[Google Ads OAuth] Accessible customers: ${customerIds.join(', ')}`);
          
          if (customerIds.length > 0) {
            // Get details of the first customer
            const details = await googleAdsApi.getCustomerDetails(tokens.accessToken, customerIds[0]);
            if (details) {
              // Update the account with real customer ID and name
              await db.updateGoogleAdAccountCustomer(result.id, {
                customerId: details.id,
                customerName: details.name,
                currency: details.currency,
                timezone: details.timezone,
              });
              console.log(`[Google Ads OAuth] Updated account with customer: ${details.name} (${details.id})`);
            }
          }
        } catch (custError: any) {
          console.warn(`[Google Ads OAuth] Could not fetch customer details: ${custError.message}`);
        }
        
        return {
          success: true,
          accountId: result.id,
          googleUserEmail: userInfo.googleUserEmail,
        };
      }),

    // Save selected Google Ads account connection
    connectAdAccount: adminProcedure
      .input(z.object({
        googleUserId: z.string(),
        googleUserEmail: z.string().nullable(),
        customerId: z.string(),
        customerName: z.string().nullable(),
        currency: z.string().optional(),
        timezone: z.string().optional(),
        accessToken: z.string(),
        refreshToken: z.string().nullable(),
        tokenExpiresAt: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        console.log(`[Google Ads] Connecting customer ${input.customerId} for user ${ctx.user.id}`);
        try {
          const result = await db.connectGoogleAdAccount({
            googleUserId: input.googleUserId,
            googleUserEmail: input.googleUserEmail,
            customerId: input.customerId,
            customerName: input.customerName,
            currency: input.currency || "EUR",
            timezone: input.timezone,
            accessToken: input.accessToken,
            refreshToken: input.refreshToken,
            tokenExpiresAt: input.tokenExpiresAt ? new Date(input.tokenExpiresAt) : null,
            connectedBy: ctx.user.id,
          });
          console.log(`[Google Ads] Account connected successfully, id: ${result.id}`);
          return result;
        } catch (error: any) {
          console.error(`[Google Ads] Error connecting account:`, error.message);
          throw error;
        }
      }),

    // Disconnect Google Ads account
    disconnectAdAccount: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.disconnectGoogleAdAccount(input.id);
      }),

    // Get connected Google Ads accounts
    getConnectedAccounts: adminProcedure
      .query(async () => {
        return db.getConnectedGoogleAdAccounts();
      }),

    // Manually fetch and update customer ID
    fetchCustomerId: adminProcedure
      .input(z.object({ accountId: z.number() }))
      .mutation(async ({ input }) => {
        const accounts = await db.getConnectedGoogleAdAccounts();
        const account = accounts.find(a => a.id === input.accountId);
        if (!account) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Compte Google Ads introuvable' });
        }

        try {
          const googleAdsApi = await import('./google-ads-api');
          const customerIds = await googleAdsApi.listAccessibleCustomers(account.accessToken);
          console.log(`[Google Ads] Accessible customers for account ${input.accountId}:`, customerIds);
          
          if (customerIds.length === 0) {
            throw new Error('Aucun compte Google Ads accessible. Vérifiez que le compte Google connecté a accès à un compte Google Ads.');
          }

          // Get details of the first customer
          const details = await googleAdsApi.getCustomerDetails(account.accessToken, customerIds[0]);
          if (!details) {
            throw new Error('Impossible de récupérer les détails du compte Google Ads');
          }

          // Update the account with real customer ID and name
          await db.updateGoogleAdAccountCustomer(input.accountId, {
            customerId: details.id,
            customerName: details.name,
            currency: details.currency,
            timezone: details.timezone,
          });

          console.log(`[Google Ads] Updated account ${input.accountId} with customer: ${details.name} (${details.id})`);

          return {
            success: true,
            customerId: details.id,
            customerName: details.name,
            allCustomerIds: customerIds,
          };
        } catch (error: any) {
          console.error('[Google Ads] Error fetching customer ID:', error);
          await db.updateGoogleAdAccountSyncError(input.accountId, error.message);
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: `Erreur lors de la récupération du Customer ID: ${error.message}` 
          });
        }
      }),

    // Fetch campaigns from connected Google Ads account
    getCampaigns: adminProcedure
      .input(z.object({
        customerId: z.string().optional(),
        datePreset: z.string().optional().default("last_30d"),
        since: z.string().optional(),
        until: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const accounts = await db.getConnectedGoogleAdAccounts();
        console.log(`[Google Ads] getCampaigns: found ${accounts.length} connected accounts`);
        if (accounts.length === 0) {
          return { connected: false, campaigns: [], accounts: [] };
        }

        const targetAccount = input?.customerId
          ? accounts.find(a => a.customerId === input.customerId)
          : accounts[0];

        if (!targetAccount) {
          return { connected: true, campaigns: [], accounts };
        }

        try {
          // Calculer les dates selon le preset
          let startDate: string;
          let endDate: string;

          if (input?.since && input?.until) {
            startDate = input.since;
            endDate = input.until;
          } else {
            const preset = input?.datePreset || "last_30d";
            const today = new Date();
            endDate = today.toISOString().split('T')[0];

            switch (preset) {
              case "today":
                startDate = endDate;
                break;
              case "yesterday":
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                startDate = yesterday.toISOString().split('T')[0];
                endDate = startDate;
                break;
              case "last_7d":
                const last7d = new Date(today);
                last7d.setDate(last7d.getDate() - 7);
                startDate = last7d.toISOString().split('T')[0];
                break;
              case "last_30d":
              default:
                const last30d = new Date(today);
                last30d.setDate(last30d.getDate() - 30);
                startDate = last30d.toISOString().split('T')[0];
                break;
            }
          }

          // Récupérer les campagnes via l'API Google Ads
          const googleAdsApi = await import("./google-ads-api");
          const campaigns = await googleAdsApi.getCampaignsWithInsights(
            targetAccount.refreshToken || "",
            targetAccount.customerId,
            startDate,
            endDate
          );

          await db.updateGoogleAdAccountLastSynced(targetAccount.id);

          return {
            connected: true,
            campaigns,
            accounts,
            currentAccount: {
              id: targetAccount.id,
              customerId: targetAccount.customerId,
              customerName: targetAccount.customerName,
              currency: targetAccount.currency,
              lastSyncedAt: new Date().toISOString(),
            },
          };
        } catch (error: any) {
          console.error("[Google Ads] Erreur récupération campagnes:", error);
          await db.updateGoogleAdAccountSyncError(targetAccount.id, error.message);
          return { connected: true, campaigns: [], accounts, error: error.message };
        }
      }),
  }),

  // ============================================
  // WEBHOOKS (Public endpoints for integrations)
  // ============================================
  webhooks: router({
    // Meta Leads webhook for Zapier/Make
    metaLeads: publicProcedure
      .input(z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email(),
        phone: z.string().optional(),
        city: z.string().optional(),
        postalCode: z.string().optional(),
        companyName: z.string().optional(),
        message: z.string().optional(),
        source: z.enum(["FACEBOOK", "INSTAGRAM", "GOOGLE", "WEBSITE", "REFERRAL", "OTHER"]).optional().default("FACEBOOK"),
        productInterest: z.string().optional(),
        budget: z.string().optional(),
        campaignId: z.string().optional(),
        campaignName: z.string().optional(),
        adId: z.string().optional(),
        adName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Map source to internal format
        const sourceMap: Record<string, string> = {
          FACEBOOK: "META_ADS",
          INSTAGRAM: "META_ADS",
          GOOGLE: "GOOGLE_ADS",
          WEBSITE: "WEBSITE",
          REFERRAL: "REFERRAL",
          OTHER: "OTHER",
        };

        // Create lead in database
        const lead = await db.createLead({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          city: input.city,
          postalCode: input.postalCode,
          productInterest: input.productInterest || input.companyName,
          budget: input.budget,
          message: input.message,
          source: sourceMap[input.source] as any,
          metaCampaignId: input.campaignId,
          metaAdId: input.adId,
        });

        // Notify admins about new lead
        try {
          notifyAdmins("NEW_LEAD", {
            title: "Nouveau lead reçu",
            message: `${input.firstName || ''} ${input.lastName || ''} (${input.email})`,
            leadId: lead,
          });
        } catch (error) {
          console.error('Failed to send notification:', error);
        }

        return { success: true, leadId: lead };
      }),
  }),

  // ============================================
  // CUSTOMER SAV TICKETS (tickets SAV clients finaux)
  // ============================================
  customerSav: router({
    list: adminProcedure
      .input(z.object({
        status: z.string().optional(),
        priority: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      }).optional())
    .query(async ({ input }) => {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) return { tickets: [], total: 0 };
      const mysql = await import('mysql2/promise');
      const conn = await mysql.default.createConnection(dbUrl);
      try {
        let where = '1=1';
        const params: any[] = [];
        if (input?.status && input.status !== 'all') { where += ' AND status = ?'; params.push(input.status); }
        if (input?.priority && input.priority !== 'all') { where += ' AND priority = ?'; params.push(input.priority); }
        if (input?.search) {
          where += ' AND (customerName LIKE ? OR customerEmail LIKE ? OR subject LIKE ? OR ticketNumber LIKE ?)';
          const s = `%${input.search}%`;
          params.push(s, s, s, s);
        }
        const [countRows] = await conn.execute<any[]>(`SELECT COUNT(*) as total FROM customer_sav_tickets WHERE ${where}`, params);
        const total = countRows[0]?.total || 0;
        const [rows] = await conn.execute<any[]>(
          `SELECT * FROM customer_sav_tickets WHERE ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
          [...params, input?.limit || 50, input?.offset || 0]
        );
        return { tickets: rows, total };
      } finally { await conn.end(); }
    }),

    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['NEW', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED']),
        internalNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const mysql = await import('mysql2/promise');
        const conn = await mysql.default.createConnection(dbUrl);
        try {
          const resolvedAt = input.status === 'RESOLVED' || input.status === 'CLOSED' ? new Date() : null;
          await conn.execute(
            'UPDATE customer_sav_tickets SET status = ?, internalNotes = COALESCE(?, internalNotes), resolvedAt = ?, updatedAt = NOW() WHERE id = ?',
            [input.status, input.internalNotes || null, resolvedAt, input.id]
          );
          return { success: true };
        } finally { await conn.end(); }
      }),

    stats: adminProcedure.query(async () => {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) return { total: 0, new: 0, inProgress: 0, resolved: 0 };
      const mysql = await import('mysql2/promise');
      const conn = await mysql.default.createConnection(dbUrl);
      try {
        const [rows] = await conn.execute<any[]>(
          `SELECT status, COUNT(*) as count FROM customer_sav_tickets GROUP BY status`
        );
        const byStatus = Object.fromEntries(rows.map((r: any) => [r.status, r.count]));
        return {
          total: rows.reduce((s: number, r: any) => s + r.count, 0),
          new: byStatus['NEW'] || 0,
          inProgress: byStatus['IN_PROGRESS'] || 0,
          waitingCustomer: byStatus['WAITING_CUSTOMER'] || 0,
          resolved: byStatus['RESOLVED'] || 0,
          closed: byStatus['CLOSED'] || 0,
        };
      } finally { await conn.end(); }
    }),
  }),
});

export type AppRouter = typeof appRouter;
