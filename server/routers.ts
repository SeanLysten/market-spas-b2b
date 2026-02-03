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
import { sendInvitationEmail } from "./email";

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

        // TODO: Send email with reset link
        // For now, log the token (in production, send email)
        console.log(`Password reset token for ${input.email}: ${resetToken}`);

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
        
        return await db.updateLeadStatus(input.id, input.status, ctx.user.id, input.notes);
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
            await db.updateProductVariant(input.variantId, { imageUrl: url });
          } else if (input.productId) {
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
          await db.deletePartner(input.id);
          return { success: true };
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
          }).optional()
        )
        .query(async ({ input }) => {
          return await db.getLeads(input);
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
          return await db.updateLeadStatus(input.id, input.status, ctx.user.id, input.notes);
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
          
          // Récupérer tous les leads non assignés avec un code postal
          const unassignedLeads = await db.getLeads({});
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
              const partner = await findBestPartnerForPostalCode(postalCode);
              
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
        .input(z.object({ postalCode: z.string() }))
        .query(async ({ input }) => {
          return await territoriesDb.findBestPartnerForPostalCode(input.postalCode);
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
  // AFTER-SALES SERVICE (SAV)
  // ============================================
  afterSales: router({
    // Create a new SAV request
    create: protectedProcedure
      .input(
        z.object({
          productId: z.number().optional(),
          serialNumber: z.string().min(1),
          issueType: z.enum(["TECHNICAL", "LEAK", "ELECTRICAL", "HEATING", "JETS", "CONTROL_PANEL", "OTHER"]),
          description: z.string().min(10),
          urgency: z.enum(["NORMAL", "URGENT", "CRITICAL"]).default("NORMAL"),
          customerName: z.string().optional(),
          customerPhone: z.string().optional(),
          customerEmail: z.string().optional(),
          customerAddress: z.string().optional(),
          installationDate: z.string().optional(),
          partnerId: z.number().optional(),
          media: z.array(
            z.object({
              base64: z.string(),
              mimeType: z.string(),
              type: z.enum(["IMAGE", "VIDEO"]),
              description: z.string().optional(),
            })
          ).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Determine which partner to use
        let partnerId = input.partnerId || ctx.user.partnerId;
        
        // Only admins can specify a different partner
        if (input.partnerId && ctx.user.partnerId && input.partnerId !== ctx.user.partnerId && ctx.user.role !== "ADMIN" && ctx.user.role !== "SUPER_ADMIN") {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only create SAV requests for your own partner" });
        }
        
        // If no partnerId is provided and user is not an admin, reject
        if (!partnerId && ctx.user.role !== "ADMIN" && ctx.user.role !== "SUPER_ADMIN") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Partner ID required. Please select a partner or contact support to be associated with a partner." });
        }
        
        // If admin without partnerId, require partnerId in input
        if (!partnerId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Please select a partner for this SAV request" });
        }

        // Upload media to S3 if provided
        const uploadedMedia: Array<{ url: string; key: string; type: "IMAGE" | "VIDEO"; description?: string }> = [];
        if (input.media && input.media.length > 0) {
          for (const item of input.media) {
            const buffer = Buffer.from(item.base64, "base64");
            const ext = item.type === "VIDEO" ? "mp4" : "jpg";
            const fileKey = `sav/${partnerId}/${Date.now()}-${nanoid()}.${ext}`;
            const { url } = await storagePut(fileKey, buffer, item.mimeType);
            uploadedMedia.push({
              url,
              key: fileKey,
              type: item.type,
              description: item.description,
            });
          }
        }

        const result = await db.createAfterSalesService({
          partnerId: partnerId,
          productId: input.productId,
          serialNumber: input.serialNumber,
          issueType: input.issueType,
          description: input.description,
          urgency: input.urgency,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail,
          customerAddress: input.customerAddress,
          installationDate: input.installationDate,
          media: uploadedMedia,
        });

        // Send notification to admin for urgent/critical tickets
        if (input.urgency === "URGENT" || input.urgency === "CRITICAL") {
          const urgencyLabel = input.urgency === "CRITICAL" ? "CRITIQUE" : "URGENT";
          const issueTypeLabels: Record<string, string> = {
            TECHNICAL: "Technique",
            LEAK: "Fuite",
            ELECTRICAL: "Électrique",
            HEATING: "Chauffage",
            JETS: "Jets",
            CONTROL_PANEL: "Panneau de contrôle",
            OTHER: "Autre",
          };
          await notifyOwner({
            title: `Nouveau ticket SAV ${urgencyLabel}`,
            content: `Un nouveau ticket SAV ${urgencyLabel} a été créé.\n\nNuméro de ticket: ${result.ticketNumber}\nNuméro de série: ${input.serialNumber}\nType de problème: ${issueTypeLabels[input.issueType] || input.issueType}\nDescription: ${input.description.substring(0, 200)}${input.description.length > 200 ? '...' : ''}`,
          }).catch(err => console.error("Failed to send SAV notification:", err));
        }

        return result;
      }),

    // List SAV requests
    list: protectedProcedure
      .input(
        z.object({
          status: z.string().optional(),
          urgency: z.string().optional(),
          dateFrom: z.string().optional(),
          dateTo: z.string().optional(),
          customerName: z.string().optional(),
          orderBy: z.string().optional(),
          orderDirection: z.enum(["asc", "desc"]).optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        const isAdmin = ctx.user.role === "SUPER_ADMIN" || ctx.user.role === "ADMIN";

        if (isAdmin) {
          return await db.getAfterSalesServices(input);
        } else if (ctx.user.partnerId) {
          return await db.getAfterSalesServices({
            partnerId: ctx.user.partnerId,
            ...input,
          });
        }

        return [];
      }),

    // Get SAV by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const serviceData = await db.getAfterSalesServiceById(input.id);

        if (!serviceData) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Service not found" });
        }

        const isAdmin = ctx.user.role === "SUPER_ADMIN" || ctx.user.role === "ADMIN";

        // Check access
        if (!isAdmin && serviceData.service.partnerId !== ctx.user.partnerId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });
        }

        return serviceData;
      }),

    // Update SAV status (admin only)
    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["NEW", "IN_PROGRESS", "WAITING_PARTS", "RESOLVED", "CLOSED"]),
          assignedTechnicianId: z.number().optional(),
          resolutionNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateAfterSalesServiceStatus(
          input.id,
          input.status,
          {
            assignedTechnicianId: input.assignedTechnicianId,
            resolutionNotes: input.resolutionNotes,
          }
        );

        // Get service details for notification
        const service = await db.getAfterSalesServiceById(input.id);
        if (service) {
          // Send notification to owner about status change
          const statusLabels: Record<string, string> = {
            NEW: "Nouveau",
            IN_PROGRESS: "En cours",
            WAITING_PARTS: "En attente de pièces",
            RESOLVED: "Résolu",
            CLOSED: "Fermé",
          };
          await notifyOwner({
            title: `Ticket SAV ${service.service.ticketNumber} - Statut mis à jour`,
            content: `Le statut du ticket SAV a été mis à jour : ${statusLabels[input.status] || input.status}${input.resolutionNotes ? `\n\nNotes: ${input.resolutionNotes}` : ''}`,
          }).catch(err => console.error("Failed to send status update notification:", err));

          // Send real-time WebSocket notification to partner
          try {
            notifyPartner(service.service.partnerId, "sav:status_changed", {
              savId: input.id,
              ticketNumber: service.service.ticketNumber,
              oldStatus: service.service.status,
              newStatus: input.status,
            });
          } catch (err) {
            console.error("Failed to send WebSocket notification:", err);
          }
        }

        return { success: true };
      }),

    // Add note to SAV
    addNote: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          note: z.string(),
          isInternal: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const serviceData = await db.getAfterSalesServiceById(input.id);

        if (!serviceData) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Service not found" });
        }

        const isAdmin = ctx.user.role === "SUPER_ADMIN" || ctx.user.role === "ADMIN";

        // Check access
        if (!isAdmin && serviceData.service.partnerId !== ctx.user.partnerId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });
        }

        // Only admins can add internal notes
        const noteIsInternal = isAdmin && input.isInternal;

        await db.addAfterSalesNote(input.id, ctx.user.id, input.note, noteIsInternal);
        return { success: true };
      }),

    stats: adminProcedure
      .input(z.object({ period: z.string().optional().default("8weeks") }))
      .query(async ({ input }) => {
        return await db.getAfterSalesStats(input.period);
      }),

    statsByPartner: adminProcedure
      .input(z.object({ partnerId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAfterSalesStatsByPartner(input.partnerId);
      }),

    weeklyStats: adminProcedure
      .input(z.object({ period: z.string().optional().default("8weeks") }))
      .query(async ({ input }) => {
        return await db.getAfterSalesWeeklyStats(input.period);
      }),

    statusHistory: protectedProcedure
      .input(z.object({ serviceId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAfterSalesStatusHistory(input.serviceId);
      }),

    assignmentHistory: protectedProcedure
      .input(z.object({ serviceId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAfterSalesAssignmentHistory(input.serviceId);
      }),

    responseTemplates: adminProcedure
      .query(async () => {
        return await db.getResponseTemplates();
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
});

export type AppRouter = typeof appRouter;
