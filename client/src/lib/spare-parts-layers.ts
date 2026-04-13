/**
 * Mapping des catégories de pièces détachées vers les 3 couches du spa.
 * Structure en arbre : Couche → Sous-catégorie → Pièces
 * Basé sur le croquis de Sean (IMG_2414)
 */

import {
  Droplets, Cpu, Wind, Eye, Thermometer, Wrench,
  Package, Box, Zap, Speaker, ShieldCheck, Waves,
  Armchair, Monitor, Sparkles, Sofa,
} from "lucide-react";

// ===== LAYER DEFINITIONS =====

export type LayerKey = "SHELL" | "TECHNICAL" | "EXTERIOR";

export interface LayerConfig {
  key: LayerKey;
  label: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  subcategories: SubcategoryConfig[];
}

export interface SubcategoryConfig {
  key: string;
  label: string;
  icon: any;
  color: string;
  /** DB category values that map to this subcategory */
  categoryMatches: string[];
  /** Optional: also match by part name pattern (regex) */
  namePatterns?: RegExp[];
}

// ===== LAYER → SUBCATEGORY MAPPING =====

export const LAYERS: LayerConfig[] = [
  {
    key: "SHELL",
    label: "Coque intérieure",
    description: "Jets, écran de contrôle, coussins, massages",
    icon: Waves,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
    subcategories: [
      {
        key: "PLACES",
        label: "Places (Jets)",
        icon: Wind,
        color: "text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-950",
        categoryMatches: ["JETS"],
      },
      {
        key: "SCREEN",
        label: "Écran de contrôle",
        icon: Monitor,
        color: "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950",
        categoryMatches: ["SCREENS"],
      },
      {
        key: "CUSHIONS",
        label: "Coussins / Oreillers",
        icon: Sofa,
        color: "text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950",
        categoryMatches: [],
        namePatterns: [/oreiller/i, /coussin/i, /pillow/i, /headrest/i, /EVA-501/i],
      },
      {
        key: "MASSAGE",
        label: "Massages",
        icon: Sparkles,
        color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950",
        categoryMatches: [],
        namePatterns: [/massage/i, /contre-courant/i, /backwater/i],
      },
    ],
  },
  {
    key: "TECHNICAL",
    label: "Pompes & Électronique",
    description: "Pompes, chauffage, électronique, plomberie, ozone",
    icon: Cpu,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/50",
    subcategories: [
      {
        key: "PUMPS",
        label: "Pompes",
        icon: Droplets,
        color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950",
        categoryMatches: ["PUMPS"],
      },
      {
        key: "ELECTRONICS",
        label: "Électronique / Cartes mères",
        icon: Cpu,
        color: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950",
        categoryMatches: ["ELECTRONICS"],
      },
      {
        key: "HEATING",
        label: "Chauffage / Réchauffeur",
        icon: Thermometer,
        color: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950",
        categoryMatches: ["HEATING"],
      },
      {
        key: "PLUMBING",
        label: "Plomberie",
        icon: Wrench,
        color: "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950",
        categoryMatches: ["PLUMBING"],
      },
      {
        key: "OZONE_UVC",
        label: "Ozonateur / UV-C",
        icon: ShieldCheck,
        color: "text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-950",
        categoryMatches: ["OZONE_UVC"],
      },
      {
        key: "AUDIO",
        label: "Système audio",
        icon: Speaker,
        color: "text-pink-600 bg-pink-50 dark:text-pink-400 dark:bg-pink-950",
        categoryMatches: ["AUDIO"],
      },
    ],
  },
  {
    key: "EXTERIOR",
    label: "Extérieur",
    description: "Couverture, panneaux, coins, éclairage extérieur",
    icon: Box,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/50",
    subcategories: [
      {
        key: "COVERS",
        label: "Couverture thermique",
        icon: Package,
        color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950",
        categoryMatches: ["COVERS"],
      },
      {
        key: "CABINETS",
        label: "Panneaux / Habillage",
        icon: Box,
        color: "text-stone-600 bg-stone-50 dark:text-stone-400 dark:bg-stone-950",
        categoryMatches: ["CABINETS"],
      },
      {
        key: "LIGHTING",
        label: "Éclairage LED",
        icon: Zap,
        color: "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950",
        categoryMatches: ["LIGHTING"],
      },
    ],
  },
];

// ===== HELPER FUNCTIONS =====

export interface PartWithLayer {
  layerKey: LayerKey;
  subcategoryKey: string;
  part: any;
}

/**
 * Classify a single part into a layer and subcategory.
 * First checks name patterns (more specific), then category matches.
 */
export function classifyPart(part: any): { layerKey: LayerKey; subcategoryKey: string } {
  // First pass: check name patterns (highest priority — catches oreillers in PLUMBING, etc.)
  for (const layer of LAYERS) {
    for (const sub of layer.subcategories) {
      if (sub.namePatterns) {
        for (const pattern of sub.namePatterns) {
          if (pattern.test(part.name || "")) {
            return { layerKey: layer.key, subcategoryKey: sub.key };
          }
        }
      }
    }
  }

  // Second pass: match by DB category
  for (const layer of LAYERS) {
    for (const sub of layer.subcategories) {
      if (sub.categoryMatches.includes(part.category)) {
        return { layerKey: layer.key, subcategoryKey: sub.key };
      }
    }
  }

  // Fallback: OTHER goes to EXTERIOR
  return { layerKey: "EXTERIOR", subcategoryKey: "OTHER" };
}

/**
 * Group parts into the layer tree structure.
 * Returns a map: layerKey → subcategoryKey → parts[]
 */
export function groupPartsByLayer(parts: any[]): Map<LayerKey, Map<string, any[]>> {
  const tree = new Map<LayerKey, Map<string, any[]>>();

  // Initialize all layers and subcategories
  for (const layer of LAYERS) {
    const subs = new Map<string, any[]>();
    for (const sub of layer.subcategories) {
      subs.set(sub.key, []);
    }
    tree.set(layer.key, subs);
  }

  // Classify each part
  for (const part of parts) {
    const { layerKey, subcategoryKey } = classifyPart(part);
    const layerMap = tree.get(layerKey);
    if (layerMap) {
      const list = layerMap.get(subcategoryKey) || [];
      list.push(part);
      layerMap.set(subcategoryKey, list);
    }
  }

  return tree;
}

/**
 * Get the total number of parts in a layer.
 */
export function getLayerPartCount(tree: Map<LayerKey, Map<string, any[]>>, layerKey: LayerKey): number {
  const layerMap = tree.get(layerKey);
  if (!layerMap) return 0;
  let count = 0;
  for (const parts of layerMap.values()) {
    count += parts.length;
  }
  return count;
}

/**
 * Get layer config by key.
 */
export function getLayerConfig(key: LayerKey): LayerConfig | undefined {
  return LAYERS.find((l) => l.key === key);
}

/**
 * Get subcategory config by key within a layer.
 */
export function getSubcategoryConfig(layerKey: LayerKey, subKey: string): SubcategoryConfig | undefined {
  const layer = LAYERS.find((l) => l.key === layerKey);
  return layer?.subcategories.find((s) => s.key === subKey);
}
