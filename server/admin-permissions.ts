// Admin permissions system
// Defines granular module-level access for admin users

/**
 * Admin modules that can be individually granted
 */
export const ADMIN_MODULES = {
  dashboard: "Dashboard",
  products: "Produits & Catalogue",
  stock: "Gestion du Stock",
  orders: "Commandes",
  partners: "Partenaires",
  marketing: "Marketing & Leads",
  territories: "Territoires",
  sav: "Service Après-Vente",
  spare_parts: "Pièces Détachées",
  resources: "Ressources Médias",
  technical_resources: "Ressources Techniques",
  newsletter: "Newsletter",
  calendar: "Agenda",
  users: "Gestion Utilisateurs",
  settings: "Paramètres",
  reports: "Rapports",
  partner_map: "Carte du Réseau",
} as const;

export type AdminModule = keyof typeof ADMIN_MODULES;

/**
 * Admin permissions structure stored as JSON in user.adminPermissions
 */
export interface AdminPermissions {
  modules: Record<AdminModule, {
    view: boolean;
    edit: boolean;
  }>;
}

/**
 * Admin role presets for quick assignment
 */
export type AdminRolePreset = "SUPER_ADMIN" | "ADMIN_FULL" | "ADMIN_STOCK" | "ADMIN_SAV" | "ADMIN_MARKETING" | "ADMIN_ORDERS" | "ADMIN_CUSTOM";

export const ADMIN_ROLE_PRESETS: Record<AdminRolePreset, { label: string; description: string }> = {
  SUPER_ADMIN: {
    label: "Super Administrateur",
    description: "Accès total + gestion des administrateurs",
  },
  ADMIN_FULL: {
    label: "Administrateur Complet",
    description: "Accès à tous les modules sauf gestion des utilisateurs admin",
  },
  ADMIN_STOCK: {
    label: "Gestionnaire Stock",
    description: "Produits, stock, prévisions, pièces détachées",
  },
  ADMIN_SAV: {
    label: "Gestionnaire SAV",
    description: "Service après-vente, pièces détachées, ressources techniques",
  },
  ADMIN_MARKETING: {
    label: "Gestionnaire Marketing",
    description: "Marketing, leads, territoires, newsletter, agenda, carte réseau",
  },
  ADMIN_ORDERS: {
    label: "Gestionnaire Commandes",
    description: "Commandes, partenaires, rapports",
  },
  ADMIN_CUSTOM: {
    label: "Personnalisé",
    description: "Permissions personnalisées par module",
  },
};

/**
 * Get all modules with full access (view + edit)
 */
function allModulesAccess(view: boolean, edit: boolean): AdminPermissions["modules"] {
  const modules: any = {};
  for (const key of Object.keys(ADMIN_MODULES)) {
    modules[key] = { view, edit };
  }
  return modules;
}

/**
 * Get default admin permissions for a preset role
 */
export function getAdminPermissions(preset: AdminRolePreset): AdminPermissions {
  switch (preset) {
    case "SUPER_ADMIN":
      return { modules: allModulesAccess(true, true) };

    case "ADMIN_FULL":
      const fullModules = allModulesAccess(true, true);
      // Full admin can't manage other admins
      fullModules.users = { view: true, edit: false };
      return { modules: fullModules };

    case "ADMIN_STOCK":
      return {
        modules: {
          ...allModulesAccess(false, false),
          dashboard: { view: true, edit: false },
          products: { view: true, edit: true },
          stock: { view: true, edit: true },
          spare_parts: { view: true, edit: true },
          orders: { view: true, edit: false },
        },
      };

    case "ADMIN_SAV":
      return {
        modules: {
          ...allModulesAccess(false, false),
          dashboard: { view: true, edit: false },
          sav: { view: true, edit: true },
          spare_parts: { view: true, edit: true },
          technical_resources: { view: true, edit: true },
          partners: { view: true, edit: false },
        },
      };

    case "ADMIN_MARKETING":
      return {
        modules: {
          ...allModulesAccess(false, false),
          dashboard: { view: true, edit: false },
          marketing: { view: true, edit: true },
          territories: { view: true, edit: true },
          newsletter: { view: true, edit: true },
          calendar: { view: true, edit: true },
          resources: { view: true, edit: true },
          partner_map: { view: true, edit: true },
          partners: { view: true, edit: false },
        },
      };

    case "ADMIN_ORDERS":
      return {
        modules: {
          ...allModulesAccess(false, false),
          dashboard: { view: true, edit: false },
          orders: { view: true, edit: true },
          partners: { view: true, edit: true },
          reports: { view: true, edit: true },
          products: { view: true, edit: false },
        },
      };

    case "ADMIN_CUSTOM":
    default:
      return { modules: allModulesAccess(false, false) };
  }
}

/**
 * Detect which preset matches the given permissions (or ADMIN_CUSTOM if none match)
 */
export function detectPreset(permissions: AdminPermissions): AdminRolePreset {
  const presets: AdminRolePreset[] = ["SUPER_ADMIN", "ADMIN_FULL", "ADMIN_STOCK", "ADMIN_SAV", "ADMIN_MARKETING", "ADMIN_ORDERS"];
  
  for (const preset of presets) {
    const expected = getAdminPermissions(preset);
    if (JSON.stringify(expected.modules) === JSON.stringify(permissions.modules)) {
      return preset;
    }
  }
  return "ADMIN_CUSTOM";
}

/**
 * Check if an admin user has access to a specific module
 */
export function hasAdminModuleAccess(
  userRole: string,
  adminPermissions: AdminPermissions | null,
  module: AdminModule,
  action: "view" | "edit" = "view"
): boolean {
  // SUPER_ADMIN always has full access
  if (userRole === "SUPER_ADMIN") return true;
  
  // Non-admin users never have admin access
  if (userRole !== "ADMIN") return false;
  
  // If no permissions set, deny access
  if (!adminPermissions) return false;
  
  const modulePerms = adminPermissions.modules[module];
  if (!modulePerms) return false;
  
  if (action === "edit") return modulePerms.edit;
  return modulePerms.view;
}

/**
 * Get the list of accessible admin modules for a user
 */
export function getAccessibleModules(
  userRole: string,
  adminPermissions: AdminPermissions | null
): AdminModule[] {
  if (userRole === "SUPER_ADMIN") {
    return Object.keys(ADMIN_MODULES) as AdminModule[];
  }
  
  if (userRole !== "ADMIN" || !adminPermissions) return [];
  
  return (Object.keys(ADMIN_MODULES) as AdminModule[]).filter(
    (module) => adminPermissions.modules[module]?.view
  );
}

/**
 * Map admin module to menu section paths
 */
export const MODULE_TO_PATHS: Record<AdminModule, string[]> = {
  dashboard: ["/admin"],
  products: ["/admin/products"],
  stock: ["/admin/forecast"],
  orders: ["/admin/orders"],
  partners: ["/admin/partners"],
  marketing: ["/admin/leads"],
  territories: ["/admin/territories"],
  sav: ["/admin/after-sales"],
  spare_parts: ["/admin/spare-parts"],
  resources: ["/admin/resources"],
  technical_resources: ["/admin/technical-resources"],
  newsletter: ["/admin/newsletter"],
  calendar: ["/admin/calendar"],
  users: ["/admin/users", "/admin/invite-partner"],
  settings: ["/admin/settings"],
  reports: ["/admin/reports"],
  partner_map: ["/admin/partner-map"],
};
