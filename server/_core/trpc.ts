import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { hasAdminModuleAccess, type AdminModule, type AdminPermissions } from "../admin-permissions";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

// Base admin procedure - checks SUPER_ADMIN or ADMIN role
export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || (ctx.user.role !== 'SUPER_ADMIN' && ctx.user.role !== 'ADMIN')) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

// Super admin only procedure - only SUPER_ADMIN can access
export const superAdminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'SUPER_ADMIN') {
      throw new TRPCError({ code: "FORBIDDEN", message: "Seuls les Super Administrateurs peuvent effectuer cette action" });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/**
 * Create a module-specific admin procedure that checks permissions
 */
export function createModuleAdminProcedure(module: AdminModule, action: "view" | "edit" = "view") {
  return t.procedure.use(
    t.middleware(async opts => {
      const { ctx, next } = opts;

      if (!ctx.user || (ctx.user.role !== 'SUPER_ADMIN' && ctx.user.role !== 'ADMIN')) {
        throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
      }

      // SUPER_ADMIN always has access
      if (ctx.user.role === 'SUPER_ADMIN') {
        return next({ ctx: { ...ctx, user: ctx.user } });
      }

      // For ADMIN, check module permissions
      let adminPerms: AdminPermissions | null = null;
      try {
        if (ctx.user.adminPermissions) {
          adminPerms = typeof ctx.user.adminPermissions === 'string' 
            ? JSON.parse(ctx.user.adminPermissions) 
            : ctx.user.adminPermissions;
        }
      } catch {
        adminPerms = null;
      }

      if (!hasAdminModuleAccess(ctx.user.role, adminPerms, module, action)) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: `Vous n'avez pas accès au module "${module}" en mode ${action === "edit" ? "modification" : "lecture"}` 
        });
      }

      return next({
        ctx: {
          ...ctx,
          user: ctx.user,
        },
      });
    }),
  );
}
