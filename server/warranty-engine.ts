/**
 * WARRANTY ENGINE — Moteur d'analyse automatique de garantie
 * 
 * Évalue chaque ticket SAV en 6 étapes séquentielles :
 * 1. Vérification de l'acheteur initial
 * 2. Vérification de l'usage (privé/commercial/holiday let)
 * 3. Vérification des exclusions
 * 4. Calcul de la durée de garantie
 * 5. Vérification de la période
 * 6. Vérification de la couverture partielle
 */

export type WarrantyStatus = "COVERED" | "PARTIAL" | "EXPIRED" | "EXCLUDED" | "REVIEW_NEEDED";

export type SavBrand = "MARKET_SPAS" | "WELLIS_CLASSIC" | "WELLIS_LIFE" | "WELLIS_WIBES" | "PASSION_SPAS" | "PLATINUM_SPAS";

export type UsageType = "PRIVATE" | "COMMERCIAL" | "HOLIDAY_LET";

export interface WarrantyInput {
  brand: SavBrand;
  productLine?: string | null;
  component: string;
  defectType: string;
  purchaseDate: string; // ISO date
  deliveryDate: string; // ISO date
  usageType: UsageType;
  isOriginalBuyer: boolean;
  isModified: boolean;
  isMaintenanceConform: boolean;
  isChemistryConform: boolean;
  usesHydrogenPeroxide: boolean;
}

export interface WarrantyResult {
  status: WarrantyStatus;
  percentage: number; // 0-100
  expiryDate: string | null; // ISO date
  details: string;
  warnings: string[];
  stepResults: StepResult[];
}

interface StepResult {
  step: number;
  name: string;
  passed: boolean;
  detail: string;
}

// ============================================
// MATRICE DE GARANTIE COMPLÈTE
// ============================================

interface WarrantyMatrixEntry {
  component: string;
  months: number; // 999 = à vie
  coverage: number; // pourcentage par défaut
  coverageRules?: Record<number, number>; // mois -> pourcentage (dégressif)
  startType: "PURCHASE_DATE" | "DELIVERY_DATE";
  exclusions?: string[];
  notes?: string;
}

type WarrantyMatrix = Record<SavBrand, Record<string, WarrantyMatrixEntry[]>>;

const WARRANTY_MATRIX: WarrantyMatrix = {
  MARKET_SPAS: {
    default: [
      { component: "Structure / Coque", months: 60, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Surface de la coque (Shell)", months: 36, coverage: 100, coverageRules: { 12: 100, 24: 50, 36: 30 }, startType: "DELIVERY_DATE", notes: "An 1: échange, An 2: 50%, An 3: 30%" },
      { component: "Pompes", months: 24, coverage: 100, startType: "DELIVERY_DATE", notes: "Pièces uniquement (pas main-d'œuvre)" },
      { component: "Boîtier de commande / Afficheur", months: 24, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Chauffage", months: 24, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Jets", months: 24, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Éclairage LED", months: 24, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Générateur d'ozone / UVC", months: 24, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Habillage (Cabinet)", months: 24, coverage: 100, startType: "DELIVERY_DATE", exclusions: ["usure naturelle"] },
      { component: "Composants optionnels", months: 12, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Marchepieds / Table / Tabouret", months: 12, coverage: 100, startType: "DELIVERY_DATE", notes: "Pourriture et fissures structurelles uniquement" },
      { component: "Couverture thermique", months: 12, coverage: 100, startType: "DELIVERY_DATE", exclusions: ["usure normale"] },
      { component: "Plomberie", months: 24, coverage: 100, startType: "DELIVERY_DATE" },
    ],
  },
  WELLIS_CLASSIC: {
    default: [
      { component: "Cadre / Isolation WPS", months: 999, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Structure / Coque", months: 84, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Surface de la coque (Shell)", months: 36, coverage: 100, startType: "PURCHASE_DATE", exclusions: ["chimie excessive"] },
      { component: "Habillage (Cabinet)", months: 24, coverage: 100, startType: "PURCHASE_DATE", exclusions: ["décoloration naturelle"] },
      { component: "Plomberie", months: 24, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Pompes", months: 24, coverage: 100, startType: "PURCHASE_DATE", exclusions: ["fusibles", "ampoules", "joints"] },
      { component: "Boîtier de commande / Afficheur", months: 24, coverage: 100, startType: "PURCHASE_DATE", exclusions: ["fusibles", "ampoules", "joints"] },
      { component: "Chauffage", months: 24, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Jets", months: 24, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Composants optionnels", months: 24, coverage: 100, startType: "PURCHASE_DATE", exclusions: ["cartouches", "couvercle filtre", "coussins", "verrous"] },
      { component: "Couverture thermique", months: 12, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Générateur d'ozone / UVC", months: 12, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Système audio", months: 12, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Éclairage LED", months: 12, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Composants EVA (appuie-tête, couvercle filtre)", months: 6, coverage: 100, startType: "DELIVERY_DATE" },
    ],
  },
  WELLIS_LIFE: {
    default: [
      { component: "Cadre / Isolation WPS", months: 999, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Structure / Coque", months: 120, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Surface de la coque (Shell)", months: 60, coverage: 100, startType: "PURCHASE_DATE", exclusions: ["chimie excessive"] },
      { component: "Habillage (Cabinet)", months: 36, coverage: 100, startType: "PURCHASE_DATE", exclusions: ["décoloration naturelle"] },
      { component: "Plomberie", months: 36, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Pompes", months: 36, coverage: 100, startType: "PURCHASE_DATE", exclusions: ["fusibles", "ampoules", "joints"] },
      { component: "Boîtier de commande / Afficheur", months: 36, coverage: 100, startType: "PURCHASE_DATE", exclusions: ["fusibles", "ampoules", "joints"] },
      { component: "Chauffage", months: 36, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Jets", months: 24, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Composants optionnels", months: 24, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Pompe à chaleur", months: 24, coverage: 100, startType: "PURCHASE_DATE", exclusions: ["étalonnage sondes"] },
      { component: "Couverture thermique", months: 12, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Générateur d'ozone / UVC", months: 12, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Système audio", months: 12, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Éclairage LED", months: 12, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Composants EVA (appuie-tête, couvercle filtre)", months: 6, coverage: 100, startType: "DELIVERY_DATE" },
    ],
  },
  WELLIS_WIBES: {
    default: [
      { component: "Structure / Coque", months: 60, coverage: 100, startType: "PURCHASE_DATE", coverageRules: { 36: 100, 60: 50 }, notes: "An 1-3: réparation/remplacement. Après an 3: remise 50% sur nouveau spa" },
      { component: "Surface de la coque (Shell)", months: 24, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Pompes", months: 24, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Boîtier de commande / Afficheur", months: 24, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Chauffage", months: 24, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Plomberie", months: 24, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Jets", months: 24, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Composants optionnels", months: 24, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Pompe à chaleur", months: 24, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Couverture thermique", months: 24, coverage: 100, startType: "PURCHASE_DATE", exclusions: ["décoloration", "usure normale"] },
      { component: "Générateur d'ozone / UVC", months: 24, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Système audio", months: 24, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Éclairage LED", months: 24, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Habillage (Cabinet)", months: 24, coverage: 100, startType: "PURCHASE_DATE", exclusions: ["décoloration climatique"] },
      { component: "Composants EVA (appuie-tête, couvercle filtre)", months: 12, coverage: 100, startType: "DELIVERY_DATE" },
    ],
  },
  PASSION_SPAS: {
    default: [
      { component: "Structure / Coque", months: 120, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Surface de la coque (Shell)", months: 60, coverage: 100, coverageRules: { 12: 100, 24: 80, 36: 60, 48: 40, 60: 20 }, startType: "PURCHASE_DATE", notes: "Couverture dégressive : An 1=100%, An 2=80%, An 3=60%, An 4=40%, An 5=20%" },
      { component: "Pompes", months: 24, coverage: 100, startType: "PURCHASE_DATE", notes: "Facturées à 90 jours, annulées si retour pièces défectueuses (Balboa)" },
      { component: "Boîtier de commande / Afficheur", months: 24, coverage: 100, startType: "PURCHASE_DATE", notes: "Facturées à 90 jours, annulées si retour pièces défectueuses (Balboa)" },
      { component: "Chauffage", months: 24, coverage: 100, startType: "PURCHASE_DATE" },
      { component: "Jets", months: 0, coverage: 0, startType: "PURCHASE_DATE", notes: "Consommable — NON couvert (doit être en parfait état à la livraison)" },
      { component: "Composants EVA (appuie-tête, couvercle filtre)", months: 0, coverage: 0, startType: "PURCHASE_DATE", notes: "Consommable — NON couvert" },
    ],
  },
  PLATINUM_SPAS: {
    Deluxe: [
      { component: "Structure / Coque", months: 999, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Surface de la coque (Shell)", months: 60, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Boîtier de commande / Afficheur", months: 24, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Chauffage", months: 24, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Pompes", months: 24, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Plomberie", months: 12, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Habillage (Cabinet)", months: 12, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Générateur d'ozone / UVC", months: 12, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Système audio", months: 12, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Éclairage LED", months: 12, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Couverture thermique", months: 24, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Composants EVA (appuie-tête, couvercle filtre)", months: 12, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Jets", months: 12, coverage: 100, startType: "DELIVERY_DATE" },
    ],
    Premium: [
      { component: "Structure / Coque", months: 999, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Surface de la coque (Shell)", months: 60, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Boîtier de commande / Afficheur", months: 24, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Chauffage", months: 24, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Pompes", months: 24, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Plomberie", months: 12, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Habillage (Cabinet)", months: 12, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Générateur d'ozone / UVC", months: 12, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Système audio", months: 12, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Éclairage LED", months: 12, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Couverture thermique", months: 24, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Composants EVA (appuie-tête, couvercle filtre)", months: 12, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Jets", months: 12, coverage: 100, startType: "DELIVERY_DATE" },
    ],
    Luxury: [
      { component: "Structure / Coque", months: 999, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Surface de la coque (Shell)", months: 84, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Boîtier de commande / Afficheur", months: 36, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Chauffage", months: 36, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Pompes", months: 36, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Plomberie", months: 24, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Habillage (Cabinet)", months: 24, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Générateur d'ozone / UVC", months: 24, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Système audio", months: 24, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Éclairage LED", months: 24, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Couverture thermique", months: 24, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Composants EVA (appuie-tête, couvercle filtre)", months: 24, coverage: 100, startType: "DELIVERY_DATE" },
      { component: "Jets", months: 24, coverage: 100, startType: "DELIVERY_DATE" },
    ],
  },
};

// ============================================
// COMPOSANTS PAR MARQUE
// ============================================

export const COMPONENTS_BY_BRAND: Record<SavBrand, string[]> = {
  MARKET_SPAS: [
    "Structure / Coque", "Surface de la coque (Shell)", "Habillage (Cabinet)",
    "Pompes", "Boîtier de commande / Afficheur", "Chauffage", "Jets",
    "Générateur d'ozone / UVC", "Éclairage LED", "Couverture thermique",
    "Composants optionnels", "Marchepieds / Table / Tabouret", "Plomberie",
  ],
  WELLIS_CLASSIC: [
    "Cadre / Isolation WPS", "Structure / Coque", "Surface de la coque (Shell)",
    "Habillage (Cabinet)", "Plomberie", "Pompes", "Boîtier de commande / Afficheur",
    "Chauffage", "Jets", "Composants optionnels", "Couverture thermique",
    "Générateur d'ozone / UVC", "Système audio", "Éclairage LED",
    "Composants EVA (appuie-tête, couvercle filtre)",
  ],
  WELLIS_LIFE: [
    "Cadre / Isolation WPS", "Structure / Coque", "Surface de la coque (Shell)",
    "Habillage (Cabinet)", "Plomberie", "Pompes", "Boîtier de commande / Afficheur",
    "Chauffage", "Jets", "Composants optionnels", "Pompe à chaleur",
    "Couverture thermique", "Générateur d'ozone / UVC", "Système audio",
    "Éclairage LED", "Composants EVA (appuie-tête, couvercle filtre)",
  ],
  WELLIS_WIBES: [
    "Structure / Coque", "Surface de la coque (Shell)", "Pompes",
    "Boîtier de commande / Afficheur", "Chauffage", "Plomberie", "Jets",
    "Composants optionnels", "Pompe à chaleur", "Couverture thermique",
    "Générateur d'ozone / UVC", "Système audio", "Éclairage LED",
    "Habillage (Cabinet)", "Composants EVA (appuie-tête, couvercle filtre)",
  ],
  PASSION_SPAS: [
    "Structure / Coque", "Surface de la coque (Shell)", "Pompes",
    "Boîtier de commande / Afficheur", "Chauffage", "Jets",
    "Composants EVA (appuie-tête, couvercle filtre)",
  ],
  PLATINUM_SPAS: [
    "Structure / Coque", "Surface de la coque (Shell)",
    "Boîtier de commande / Afficheur", "Chauffage", "Pompes",
    "Plomberie", "Habillage (Cabinet)", "Générateur d'ozone / UVC",
    "Système audio", "Éclairage LED", "Couverture thermique",
    "Composants EVA (appuie-tête, couvercle filtre)", "Jets",
  ],
};

// ============================================
// TYPES DE DÉFAUT PAR COMPOSANT
// ============================================

export const DEFECT_TYPES_BY_COMPONENT: Record<string, string[]> = {
  "Structure / Coque": ["Fuite d'eau", "Fissure / Cloque / Délaminage", "Autre"],
  "Surface de la coque (Shell)": ["Fissure / Cloque / Délaminage", "Décoloration / Usure", "Autre"],
  "Habillage (Cabinet)": ["Fissure / Cloque / Délaminage", "Pelage / Rétrécissement", "Décoloration / Usure", "Autre"],
  "Plomberie": ["Fuite d'eau", "Autre"],
  "Pompes": ["Panne électrique", "Bruit anormal", "Fuite d'eau", "Dysfonctionnement", "Autre"],
  "Boîtier de commande / Afficheur": ["Panne électrique", "Dysfonctionnement", "Autre"],
  "Chauffage": ["Problème de chauffage", "Panne électrique", "Autre"],
  "Jets": ["Casse / Rupture", "Fuite d'eau", "Bruit anormal", "Autre"],
  "Générateur d'ozone / UVC": ["Panne électrique", "Dysfonctionnement", "Autre"],
  "Éclairage LED": ["Panne électrique", "Dysfonctionnement", "Autre"],
  "Système audio": ["Panne électrique", "Dysfonctionnement", "Autre"],
  "Couverture thermique": ["Casse / Rupture", "Décoloration / Usure", "Fissure / Cloque / Délaminage", "Autre"],
  "Pompe à chaleur": ["Dysfonctionnement", "Bruit anormal", "Problème de chauffage", "Autre"],
  "Composants EVA (appuie-tête, couvercle filtre)": ["Casse / Rupture", "Décoloration / Usure", "Autre"],
  "Cadre / Isolation WPS": ["Fissure / Cloque / Délaminage", "Autre"],
  "Composants optionnels": ["Panne électrique", "Casse / Rupture", "Dysfonctionnement", "Autre"],
  "Marchepieds / Table / Tabouret": ["Casse / Rupture", "Décoloration / Usure", "Autre"],
};

// ============================================
// GAMMES PAR MARQUE
// ============================================

export const PRODUCT_LINES_BY_BRAND: Record<SavBrand, string[]> = {
  MARKET_SPAS: [],
  WELLIS_CLASSIC: [],
  WELLIS_LIFE: [],
  WELLIS_WIBES: [],
  PASSION_SPAS: [],
  PLATINUM_SPAS: ["Deluxe", "Premium", "Luxury"],
};

// ============================================
// MOTEUR D'ANALYSE DE GARANTIE
// ============================================

export function analyzeWarranty(input: WarrantyInput): WarrantyResult {
  const stepResults: StepResult[] = [];
  const warnings: string[] = [];

  // ===== ÉTAPE 1 : Vérification de l'acheteur initial =====
  const step1Passed = input.isOriginalBuyer;
  stepResults.push({
    step: 1,
    name: "Vérification de l'acheteur initial",
    passed: step1Passed,
    detail: step1Passed
      ? "L'acheteur est le propriétaire initial du spa."
      : "Le spa a changé de propriétaire. La garantie ne s'applique qu'à l'acheteur initial.",
  });

  if (!step1Passed) {
    return {
      status: "EXCLUDED",
      percentage: 0,
      expiryDate: null,
      details: "La garantie ne s'applique qu'à l'acheteur initial. Le spa a changé de propriétaire.",
      warnings,
      stepResults,
    };
  }

  // ===== ÉTAPE 2 : Vérification de l'usage =====
  let usageOverrideMonths: number | null = null;

  if (input.usageType === "COMMERCIAL") {
    // Wellis Wibes : totalement exclu en commercial
    if (input.brand === "WELLIS_WIBES") {
      stepResults.push({
        step: 2,
        name: "Vérification de l'usage",
        passed: false,
        detail: "Usage commercial détecté. Les Wellis Wibes sont totalement exclus de la garantie en usage commercial/industriel.",
      });
      return {
        status: "EXCLUDED",
        percentage: 0,
        expiryDate: null,
        details: "Usage commercial/industriel : la garantie Wellis Wibes est totalement exclue pour un usage commercial.",
        warnings,
        stepResults,
      };
    }

    // Toutes les autres marques : exclu en commercial
    stepResults.push({
      step: 2,
      name: "Vérification de l'usage",
      passed: false,
      detail: "Usage commercial détecté. La garantie est exclue pour un usage commercial/industriel.",
    });
    return {
      status: "EXCLUDED",
      percentage: 0,
      expiryDate: null,
      details: "Usage commercial/industriel : la garantie est exclue pour un usage commercial.",
      warnings,
      stepResults,
    };
  }

  if (input.usageType === "HOLIDAY_LET") {
    if (input.brand === "WELLIS_CLASSIC") {
      // Wellis Classic Holiday Let : garantie réduite à 1 an
      usageOverrideMonths = 12;
      stepResults.push({
        step: 2,
        name: "Vérification de l'usage",
        passed: true,
        detail: "Usage Holiday Let détecté pour Wellis Classic. Garantie réduite à 1 an sur tous les composants.",
      });
      warnings.push("Holiday Let Spa (Wellis Classic) : garantie réduite à 1 an sur tous les composants.");
    } else if (input.brand === "WELLIS_WIBES") {
      // Wellis Wibes : totalement exclu en Holiday Let aussi
      stepResults.push({
        step: 2,
        name: "Vérification de l'usage",
        passed: false,
        detail: "Usage Holiday Let détecté. Les Wellis Wibes sont exclus de la garantie en usage commercial/Holiday Let.",
      });
      return {
        status: "EXCLUDED",
        percentage: 0,
        expiryDate: null,
        details: "Usage Holiday Let : la garantie Wellis Wibes est exclue pour un usage non privé.",
        warnings,
        stepResults,
      };
    } else {
      // Autres marques : Holiday Let = commercial = exclu
      stepResults.push({
        step: 2,
        name: "Vérification de l'usage",
        passed: false,
        detail: "Usage Holiday Let détecté. La garantie est exclue pour un usage non privé.",
      });
      return {
        status: "EXCLUDED",
        percentage: 0,
        expiryDate: null,
        details: "Usage Holiday Let : la garantie est exclue pour un usage non privé.",
        warnings,
        stepResults,
      };
    }
  } else {
    stepResults.push({
      step: 2,
      name: "Vérification de l'usage",
      passed: true,
      detail: "Usage privé confirmé.",
    });
  }

  // ===== ÉTAPE 3 : Vérification des exclusions =====
  const exclusionReasons: string[] = [];

  if (input.isModified) {
    exclusionReasons.push("Le spa a été modifié sans autorisation.");
  }
  if (!input.isMaintenanceConform) {
    exclusionReasons.push("L'entretien n'est pas conforme aux recommandations du fabricant.");
  }
  if (!input.isChemistryConform) {
    exclusionReasons.push("Les produits d'entretien utilisés ne sont pas conformes.");
  }
  if (input.usesHydrogenPeroxide && input.brand === "PLATINUM_SPAS") {
    exclusionReasons.push("Utilisation de peroxyde d'hydrogène détectée — annulation de la garantie Platinum Spas.");
  }

  if (exclusionReasons.length > 0) {
    stepResults.push({
      step: 3,
      name: "Vérification des exclusions",
      passed: false,
      detail: `Exclusion(s) détectée(s) : ${exclusionReasons.join(" / ")}`,
    });
    return {
      status: "EXCLUDED",
      percentage: 0,
      expiryDate: null,
      details: `Exclusion de garantie : ${exclusionReasons.join(". ")}`,
      warnings,
      stepResults,
    };
  }

  stepResults.push({
    step: 3,
    name: "Vérification des exclusions",
    passed: true,
    detail: "Aucune exclusion détectée.",
  });

  // ===== ÉTAPE 4 : Calcul de la durée de garantie =====
  const productLine = input.productLine || "default";
  const brandMatrix = WARRANTY_MATRIX[input.brand];
  const lineEntries = brandMatrix[productLine] || brandMatrix["default"];

  if (!lineEntries) {
    stepResults.push({
      step: 4,
      name: "Calcul de la durée de garantie",
      passed: false,
      detail: `Aucune règle de garantie trouvée pour ${input.brand} / ${productLine}.`,
    });
    return {
      status: "REVIEW_NEEDED",
      percentage: 0,
      expiryDate: null,
      details: `Aucune règle de garantie trouvée pour ${input.brand} / ${productLine}. Analyse manuelle requise.`,
      warnings,
      stepResults,
    };
  }

  // Trouver la règle pour le composant
  const rule = lineEntries.find(
    (r) => r.component.toLowerCase() === input.component.toLowerCase()
  );

  if (!rule) {
    stepResults.push({
      step: 4,
      name: "Calcul de la durée de garantie",
      passed: false,
      detail: `Aucune règle de garantie trouvée pour le composant "${input.component}" de la marque ${input.brand}.`,
    });
    return {
      status: "REVIEW_NEEDED",
      percentage: 0,
      expiryDate: null,
      details: `Composant "${input.component}" non trouvé dans la matrice de garantie pour ${input.brand}. Analyse manuelle requise.`,
      warnings,
      stepResults,
    };
  }

  // Composant non couvert (ex: jets Passion Spas)
  if (rule.months === 0) {
    stepResults.push({
      step: 4,
      name: "Calcul de la durée de garantie",
      passed: false,
      detail: `Le composant "${input.component}" n'est pas couvert par la garantie ${input.brand}. ${rule.notes || ""}`,
    });
    return {
      status: "EXCLUDED",
      percentage: 0,
      expiryDate: null,
      details: `Le composant "${input.component}" est considéré comme consommable et n'est pas couvert par la garantie. ${rule.notes || ""}`,
      warnings,
      stepResults,
    };
  }

  // Appliquer l'override Holiday Let si applicable
  const effectiveMonths = usageOverrideMonths !== null ? Math.min(usageOverrideMonths, rule.months) : rule.months;

  stepResults.push({
    step: 4,
    name: "Calcul de la durée de garantie",
    passed: true,
    detail: `Composant "${input.component}" garanti ${effectiveMonths === 999 ? "à vie" : `${effectiveMonths} mois`} pour ${input.brand}${productLine !== "default" ? ` (${productLine})` : ""}. Début : ${rule.startType === "PURCHASE_DATE" ? "date d'achat" : "date de livraison"}.`,
  });

  // Ajouter les notes spécifiques
  if (rule.notes) {
    warnings.push(rule.notes);
  }

  // Avertissement Passion Spas main-d'œuvre
  if (input.brand === "PASSION_SPAS") {
    warnings.push("Passion Spas : les frais de main-d'œuvre et de déplacement restent à la charge du partenaire, même sous garantie.");
  }

  // Avertissement Passion Spas Balboa
  if (input.brand === "PASSION_SPAS" && (input.component === "Pompes" || input.component === "Boîtier de commande / Afficheur")) {
    warnings.push("Pièces Balboa/Pompes Passion Spas : facturation à 90 jours, annulée si retour des pièces défectueuses.");
  }

  // ===== ÉTAPE 5 : Vérification de la période =====
  const startDate = rule.startType === "PURCHASE_DATE"
    ? new Date(input.purchaseDate)
    : new Date(input.deliveryDate);

  const now = new Date();
  const monthsElapsed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());

  let expiryDate: string | null = null;
  if (effectiveMonths !== 999) {
    const expiry = new Date(startDate);
    expiry.setMonth(expiry.getMonth() + effectiveMonths);
    expiryDate = expiry.toISOString().split("T")[0];
  }

  if (effectiveMonths !== 999 && monthsElapsed > effectiveMonths) {
    stepResults.push({
      step: 5,
      name: "Vérification de la période",
      passed: false,
      detail: `La période de garantie de ${effectiveMonths} mois est dépassée (${monthsElapsed} mois écoulés depuis le ${startDate.toLocaleDateString("fr-FR")}).`,
    });
    return {
      status: "EXPIRED",
      percentage: 0,
      expiryDate,
      details: `Garantie expirée. Le composant "${input.component}" était garanti ${effectiveMonths} mois. ${monthsElapsed} mois se sont écoulés depuis le ${startDate.toLocaleDateString("fr-FR")}.`,
      warnings,
      stepResults,
    };
  }

  stepResults.push({
    step: 5,
    name: "Vérification de la période",
    passed: true,
    detail: effectiveMonths === 999
      ? "Garantie à vie — pas d'expiration."
      : `Dans la période de garantie (${monthsElapsed} mois écoulés sur ${effectiveMonths}).${expiryDate ? ` Expire le ${new Date(expiryDate).toLocaleDateString("fr-FR")}.` : ""}`,
  });

  // ===== ÉTAPE 6 : Vérification de la couverture partielle =====
  let coveragePercentage = rule.coverage;

  if (rule.coverageRules) {
    // Trouver le bon palier de couverture
    const sortedThresholds = Object.keys(rule.coverageRules)
      .map(Number)
      .sort((a, b) => a - b);

    for (const threshold of sortedThresholds) {
      if (monthsElapsed <= threshold) {
        coveragePercentage = rule.coverageRules[threshold];
        break;
      }
    }

    // Si on dépasse tous les paliers mais qu'on est encore dans la période globale
    if (monthsElapsed > sortedThresholds[sortedThresholds.length - 1]) {
      // On est au dernier palier
      coveragePercentage = rule.coverageRules[sortedThresholds[sortedThresholds.length - 1]];
    }
  }

  if (coveragePercentage < 100) {
    stepResults.push({
      step: 6,
      name: "Vérification de la couverture partielle",
      passed: true,
      detail: `Couverture partielle : ${coveragePercentage}% (${monthsElapsed} mois écoulés).`,
    });

    return {
      status: "PARTIAL",
      percentage: coveragePercentage,
      expiryDate,
      details: `Garantie partielle à ${coveragePercentage}%. Le composant "${input.component}" est dans sa période de garantie mais avec une couverture dégressive.`,
      warnings,
      stepResults,
    };
  }

  stepResults.push({
    step: 6,
    name: "Vérification de la couverture partielle",
    passed: true,
    detail: "Couverture complète à 100%.",
  });

  return {
    status: "COVERED",
    percentage: 100,
    expiryDate,
    details: `Sous garantie. Le composant "${input.component}" est couvert à 100% par la garantie ${input.brand}.`,
    warnings,
    stepResults,
  };
}

// ============================================
// MAPPING COMPOSANT → CATÉGORIE DE PIÈCE
// ============================================

export const COMPONENT_TO_SPARE_CATEGORY: Record<string, string[]> = {
  "Pompes": ["PUMPS"],
  "Boîtier de commande / Afficheur": ["ELECTRONICS"],
  "Chauffage": ["HEATING"],
  "Jets": ["JETS"],
  "Éclairage LED": ["LIGHTING"],
  "Système audio": ["AUDIO"],
  "Générateur d'ozone / UVC": ["OZONE_UVC"],
  "Plomberie": ["PLUMBING"],
  "Couverture thermique": ["COVERS"],
  "Habillage (Cabinet)": ["CABINETS"],
  "Pompe à chaleur": ["HEATING"],
  "Composants EVA (appuie-tête, couvercle filtre)": ["OTHER"],
  "Composants optionnels": ["OTHER"],
  "Cadre / Isolation WPS": ["OTHER"],
  "Marchepieds / Table / Tabouret": ["OTHER"],
  // Structure et Surface : pas de pièce standard, intervention requise
  "Structure / Coque": [],
  "Surface de la coque (Shell)": [],
};

// ============================================
// TRACKING URL GENERATORS
// ============================================

export const TRACKING_URL_TEMPLATES: Record<string, string> = {
  BPOST: "https://track.bpost.cloud/btr/web/#/search?itemCode=",
  DHL: "https://www.dhl.com/fr-fr/home/suivi.html?tracking-id=",
  UPS: "https://www.ups.com/track?tracknum=",
  GLS: "https://gls-group.com/FR/fr/suivi-colis?match=",
  MONDIAL_RELAY: "https://www.mondialrelay.fr/suivi-de-colis/?NumeroExpedition=",
  OTHER: "",
};

export function generateTrackingUrl(carrier: string, trackingNumber: string): string {
  const template = TRACKING_URL_TEMPLATES[carrier];
  if (!template) return "";
  return `${template}${trackingNumber}`;
}
