// Team permissions helpers

export type TeamRole = "OWNER" | "SALES_REP" | "ORDER_MANAGER" | "ACCOUNTANT" | "FULL_MANAGER";

export interface TeamPermissions {
  leads: {
    view: "all" | "assigned" | "none";
    edit: boolean;
    delete: boolean;
  };
  orders: {
    view: boolean;
    create: boolean;
    edit: boolean;
    cancel: boolean;
  };
  spas: {
    view: boolean;
    order: boolean; // Can order spas - controlled by partner owner
  };
  invoices: {
    view: boolean;
    export: boolean;
  };
  catalog: {
    view: boolean;
    viewPrices: boolean;
  };
  sav: {
    view: boolean;
    create: boolean;
    edit: boolean;
  };
  spareParts: {
    view: boolean;
    order: boolean;
  };
  resources: {
    view: boolean;
    download: boolean;
  };
  team: {
    invite: boolean;
    manage: boolean;
  };
  profile: {
    edit: boolean;
  };
}

/**
 * Get default permissions for a given role
 */
export function getDefaultPermissions(role: TeamRole): TeamPermissions {
  switch (role) {
    case "OWNER":
      return {
        leads: { view: "all", edit: true, delete: true },
        orders: { view: true, create: true, edit: true, cancel: true },
        spas: { view: true, order: true },
        invoices: { view: true, export: true },
        catalog: { view: true, viewPrices: true },
        sav: { view: true, create: true, edit: true },
        spareParts: { view: true, order: true },
        resources: { view: true, download: true },
        team: { invite: true, manage: true },
        profile: { edit: true },
      };

    case "SALES_REP":
      return {
        leads: { view: "assigned", edit: true, delete: false },
        orders: { view: false, create: false, edit: false, cancel: false },
        spas: { view: false, order: false },
        invoices: { view: false, export: false },
        catalog: { view: true, viewPrices: false },
        sav: { view: false, create: false, edit: false },
        spareParts: { view: false, order: false },
        resources: { view: false, download: false },
        team: { invite: false, manage: false },
        profile: { edit: false },
      };

    case "ORDER_MANAGER":
      return {
        leads: { view: "none", edit: false, delete: false },
        orders: { view: true, create: true, edit: true, cancel: true },
        spas: { view: true, order: true },
        invoices: { view: true, export: false },
        catalog: { view: true, viewPrices: true },
        sav: { view: true, create: true, edit: false },
        spareParts: { view: true, order: true },
        resources: { view: true, download: true },
        team: { invite: false, manage: false },
        profile: { edit: false },
      };

    case "ACCOUNTANT":
      return {
        leads: { view: "none", edit: false, delete: false },
        orders: { view: true, create: false, edit: false, cancel: false },
        spas: { view: false, order: false },
        invoices: { view: true, export: true },
        catalog: { view: false, viewPrices: false },
        sav: { view: false, create: false, edit: false },
        spareParts: { view: false, order: false },
        resources: { view: false, download: false },
        team: { invite: false, manage: false },
        profile: { edit: false },
      };

    case "FULL_MANAGER":
      return {
        leads: { view: "all", edit: true, delete: true },
        orders: { view: true, create: true, edit: true, cancel: true },
        spas: { view: true, order: true },
        invoices: { view: true, export: true },
        catalog: { view: true, viewPrices: true },
        sav: { view: true, create: true, edit: true },
        spareParts: { view: true, order: true },
        resources: { view: true, download: true },
        team: { invite: false, manage: false },
        profile: { edit: false },
      };

    default:
      // Default to most restrictive permissions
      return {
        leads: { view: "none", edit: false, delete: false },
        orders: { view: false, create: false, edit: false, cancel: false },
        spas: { view: false, order: false },
        invoices: { view: false, export: false },
        catalog: { view: false, viewPrices: false },
        sav: { view: false, create: false, edit: false },
        spareParts: { view: false, order: false },
        resources: { view: false, download: false },
        team: { invite: false, manage: false },
        profile: { edit: false },
      };
  }
}

/**
 * Get role label in French
 */
export function getRoleLabel(role: TeamRole): string {
  const labels: Record<TeamRole, string> = {
    OWNER: "Propriétaire",
    SALES_REP: "Commercial",
    ORDER_MANAGER: "Gestionnaire Commandes",
    ACCOUNTANT: "Comptable",
    FULL_MANAGER: "Gestionnaire Complet",
  };
  return labels[role] || role;
}

/**
 * Get role description in French
 */
export function getRoleDescription(role: TeamRole): string {
  const descriptions: Record<TeamRole, string> = {
    OWNER: "Accès complet à toutes les fonctionnalités du compte",
    SALES_REP: "Consultation des leads et du catalogue (sans prix)",
    ORDER_MANAGER: "Gestion du catalogue, commandes, SAV et pièces détachées",
    ACCOUNTANT: "Consultation des commandes et export des factures",
    FULL_MANAGER: "Accès complet sauf gestion d'équipe",
  };
  return descriptions[role] || "";
}

/**
 * Permission categories with labels for the UI
 */
export const PERMISSION_CATEGORIES: Record<keyof TeamPermissions, { label: string; actions: Record<string, string> }> = {
  leads: {
    label: "Leads",
    actions: { view: "Voir", edit: "Modifier", delete: "Supprimer" },
  },
  orders: {
    label: "Commandes",
    actions: { view: "Voir", create: "Créer", edit: "Modifier", cancel: "Annuler" },
  },
  spas: {
    label: "Commande de Spas",
    actions: { view: "Voir le catalogue", order: "Commander des spas" },
  },
  invoices: {
    label: "Factures",
    actions: { view: "Voir", export: "Exporter" },
  },
  catalog: {
    label: "Catalogue",
    actions: { view: "Voir", viewPrices: "Voir les prix" },
  },
  sav: {
    label: "Service Après-Vente",
    actions: { view: "Voir les tickets", create: "Créer un ticket", edit: "Modifier" },
  },
  spareParts: {
    label: "Pièces Détachées",
    actions: { view: "Voir", order: "Commander" },
  },
  resources: {
    label: "Ressources",
    actions: { view: "Voir", download: "Télécharger" },
  },
  team: {
    label: "Équipe",
    actions: { invite: "Inviter", manage: "Gérer" },
  },
  profile: {
    label: "Profil",
    actions: { edit: "Modifier" },
  },
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  permissions: TeamPermissions | null,
  category: keyof TeamPermissions,
  action: string
): boolean {
  if (!permissions) return false;
  
  const categoryPerms = permissions[category] as any;
  if (!categoryPerms) return false;
  
  return categoryPerms[action] === true || categoryPerms[action] === "all";
}

/**
 * Generate a random invitation token
 */
export function generateInvitationToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
