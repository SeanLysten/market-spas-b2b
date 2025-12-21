import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

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
        return await db.getNotificationsByUserId(ctx.user.id, input.limit);
      }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUnreadNotificationsCount(ctx.user.id);
    }),

    markNotificationRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.id);
        return { success: true };
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
  }),

  // ============================================
  // PRODUCTS
  // ============================================
  products: router({
    list: protectedProcedure
      .input(
        z.object({
          categoryId: z.number().optional(),
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
});

export type AppRouter = typeof appRouter;
