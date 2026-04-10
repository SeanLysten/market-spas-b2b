# Refonte SAV et Pièces Détachées — Plan d'Implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refondre le système SAV pour que la sélection d'un modèle de spa affiche automatiquement toutes ses pièces détachées associées (BOM), permettant au revendeur de sélectionner directement les pièces nécessaires lors de la création d'un ticket SAV.

**Architecture:** Le formulaire SAV actuel utilise un champ texte libre pour le modèle. La refonte remplace ce champ par un sélecteur dynamique lié à la table `spa_models`, qui charge automatiquement la nomenclature (BOM) du modèle via `spa_model_spare_parts`. L'utilisateur sélectionne ensuite les pièces concernées dans cette BOM, et elles sont automatiquement liées au ticket SAV via `sav_spare_parts`.

**Tech Stack:** React + tRPC + Drizzle ORM + MySQL + Tailwind CSS + shadcn/ui

---

## Rapport Comparatif : État Actuel vs Meilleures Pratiques

### Analyse des Concurrents

| Fonctionnalité | Jacuzzi Partners | Master Spa Parts | Interactive Spares | BlueLink ERP | **Market Spas (actuel)** |
|---|---|---|---|---|---|
| Identification par modèle | Numéro de série → modèle auto | 4 dropdowns cascade (Year→Model Line→Model→Part) | Catalogue interactif avec vues éclatées | Numéro de série → équipement | Champ texte libre `modelName` |
| BOM par modèle | Oui — pièces filtrées par modèle | Oui — pièces taggées par modèle | Oui — schémas éclatés | Oui — pièces requises auto | Table `spa_model_spare_parts` existe mais **non utilisée dans le formulaire SAV** |
| Sélection pièces dans SAV | Dropdown filtré par modèle | N/A (e-commerce) | Clic sur schéma éclaté | Auto-suggestion par problème | **Absent** — pièces ajoutées manuellement par l'admin après coup |
| Catégorisation pièces | Par composant (pompe, jet, etc.) | Par type (filters, pumps, etc.) | Par zone du produit | Par catégorie technique | `sparePartCategoryEnum` avec 12 catégories |
| Workflow garantie | Unsubmitted→Parts Being Returned→Approved/Rejected | N/A | N/A | Automatique par numéro de série | 5 statuts garantie + analyse automatique |

### Lacunes Identifiées dans l'Existant

L'infrastructure de données est déjà en place (tables `spa_models`, `spa_model_spare_parts`, `sav_spare_parts`) mais le **lien entre le formulaire SAV et la BOM du modèle n'existe pas dans l'UI**. Le champ `modelName` est un simple texte libre, et les pièces ne sont pas proposées au revendeur lors de la création du ticket. L'admin doit manuellement identifier et lier les pièces après réception du ticket, ce qui est inefficace et source d'erreurs.

---

## Impact Analysis (impact-guard)

```
CHANGE RECORD
═══════════════════════════════════════
Type:        Modify (formulaire SAV) + Add (sélection modèle → pièces)
Location:    client/src/pages/AfterSales.tsx, server/routers.ts, server/sav-db.ts
Description: Remplacer le champ texte modelName par un sélecteur de spa_models,
             ajouter la sélection de pièces BOM dans le formulaire SAV,
             lier automatiquement les pièces sélectionnées au ticket créé.
Risk Level:  HIGH (modifie le formulaire de création SAV + l'API create)
```

### Dependency Map

```
DEPENDENCY MAP
═══════════════════════════════════════
Change: Ajout sélection modèle + pièces BOM dans formulaire SAV

DIRECT DEPENDENCIES (Layer 1):
  → client/src/pages/AfterSales.tsx       (formulaire de création — MUST CHANGE)
  → server/routers.ts                      (route afterSales.create — MUST CHANGE)
  → server/sav-db.ts                       (createSavTicket — MUST CHANGE)
  → drizzle/schema.ts                      (afterSalesServices — SHOULD VERIFY)

DATA FLOW (Layer 2):
  → database: after_sales_services.spaModelId (nouveau champ FK)
  → database: sav_spare_parts (liaison auto lors de la création)
  → database: spa_model_spare_parts (lecture BOM)

CONTRACTS (Layer 3):
  → server/routers.ts: afterSales.create input schema (MUST CHANGE)
  → server/routers.ts: spaModels.getParts (déjà existant, réutilisé)

UI CONSUMERS (Layer 4):
  → client/src/pages/AfterSales.tsx        (formulaire — MUST CHANGE)
  → client/src/components/AfterSalesDetail.tsx (affichage — SHOULD VERIFY)
  → client/src/pages/SpareParts.tsx         (INFORM ONLY)
  → client/src/components/SAVPDFExport.tsx  (SHOULD VERIFY)

TESTS:
  → server/sav-dashboard-stats.test.ts     (SHOULD TEST)
  → server/sav-partner-access.test.ts      (SHOULD TEST)

TOTAL IMPACT RADIUS: 10 files across 4 layers
```

---

## File Structure

| Action | File | Responsabilité |
|--------|------|----------------|
| Modify | `drizzle/schema.ts` | Ajouter `spaModelId` à `afterSalesServices` |
| Modify | `server/sav-db.ts` | Ajouter `spaModelId` dans createSavTicket + lier les pièces auto |
| Modify | `server/routers.ts` | Ajouter `spaModelId` et `selectedParts` dans l'input de `afterSales.create` |
| Modify | `client/src/pages/AfterSales.tsx` | Remplacer champ texte modelName par sélecteur modèle + pièces BOM |
| Modify | `client/src/components/AfterSalesDetail.tsx` | Afficher le modèle de spa lié et les pièces sélectionnées |
| Create | `server/sav-spare-parts-link.test.ts` | Tests pour la liaison auto pièces → ticket |
| Modify | `scripts/seed-sav-tickets.mjs` | Nettoyage données test |

---

## Task 1: Ajouter `spaModelId` au schéma DB

**Files:**
- Modify: `drizzle/schema.ts` (table `afterSalesServices`, ~ligne 2034)

- [ ] **Step 1: Ajouter le champ `spaModelId` à la table `afterSalesServices`**

Dans `drizzle/schema.ts`, ajouter après le champ `productId`:
```typescript
spaModelId: int("spaModelId"),  // FK vers spa_models pour identification du modèle
```

- [ ] **Step 2: Pousser la migration**

```bash
cd /home/ubuntu/market-spas-b2b && pnpm db:push
```

---

## Task 2: Modifier la fonction `createSavTicket` pour accepter `spaModelId` et lier les pièces

**Files:**
- Modify: `server/sav-db.ts` (fonction `createSavTicket`)

- [ ] **Step 1: Ajouter `spaModelId` et `selectedPartIds` aux paramètres de `createSavTicket`**

Ajouter dans le type d'entrée:
```typescript
spaModelId?: number;
selectedPartIds?: number[];  // IDs des pièces sélectionnées depuis la BOM
```

- [ ] **Step 2: Insérer `spaModelId` dans l'insert**

Ajouter `spaModelId: data.spaModelId` dans l'objet passé à `db.insert(afterSalesServices).values({...})`.

- [ ] **Step 3: Lier automatiquement les pièces sélectionnées au ticket**

Après la création du ticket, si `selectedPartIds` est fourni:
```typescript
if (data.selectedPartIds && data.selectedPartIds.length > 0) {
  // Récupérer les prix des pièces
  const partsData = await db.select().from(spareParts).where(inArray(spareParts.id, data.selectedPartIds));
  const partsValues = partsData.map(part => ({
    serviceId,
    sparePartId: part.id,
    quantity: 1,
    unitPrice: part.priceHT,
    isCoveredByWarranty: false,
    coveragePercentage: 0,
  }));
  if (partsValues.length > 0) {
    await db.insert(savSpareParts).values(partsValues);
  }
}
```

---

## Task 3: Modifier la route tRPC `afterSales.create`

**Files:**
- Modify: `server/routers.ts` (route `afterSales.create`, ~ligne 3957)

- [ ] **Step 1: Ajouter les champs au schema Zod**

```typescript
spaModelId: z.number().optional(),
selectedPartIds: z.array(z.number()).optional(),
```

- [ ] **Step 2: Passer les nouveaux champs à `createSavTicket`**

```typescript
spaModelId: input.spaModelId,
selectedPartIds: input.selectedPartIds,
```

---

## Task 4: Refonte du formulaire SAV — Sélection modèle + pièces BOM

**Files:**
- Modify: `client/src/pages/AfterSales.tsx`

- [ ] **Step 1: Ajouter `spaModelId` et `selectedPartIds` au type `SavFormData`**

```typescript
spaModelId: number | null;
selectedPartIds: number[];
```

- [ ] **Step 2: Ajouter les queries tRPC pour charger les modèles et les pièces**

```typescript
const { data: spaModels } = trpc.spaModels.listWithPartCount.useQuery(
  { brand: formData.brand },
  { enabled: !!formData.brand }
);

const { data: modelParts } = trpc.spaModels.getParts.useQuery(
  { spaModelId: formData.spaModelId! },
  { enabled: !!formData.spaModelId }
);
```

- [ ] **Step 3: Remplacer le champ texte `modelName` par un Select lié à `spa_models`**

Dans le Step 1 du formulaire, remplacer l'Input par un Select qui affiche les modèles filtrés par marque, groupés par série. Quand un modèle est sélectionné, remplir automatiquement `spaModelId` et `modelName`.

- [ ] **Step 4: Ajouter la sélection de pièces dans le Step 2 (Diagnostic)**

Après la sélection du composant défectueux, afficher les pièces de la BOM du modèle sélectionné, filtrées par catégorie correspondante. L'utilisateur peut cocher les pièces qu'il pense nécessaires. Afficher les pièces avec: nom, référence, catégorie, prix HT, image.

- [ ] **Step 5: Passer les pièces sélectionnées dans le mutation**

```typescript
createMutation.mutate({
  ...formData,
  spaModelId: formData.spaModelId || undefined,
  selectedPartIds: formData.selectedPartIds.length > 0 ? formData.selectedPartIds : undefined,
  media: mediaData.length > 0 ? mediaData : undefined,
  partnerId: selectedPartnerId || undefined,
});
```

---

## Task 5: Mettre à jour l'affichage du détail SAV

**Files:**
- Modify: `client/src/components/AfterSalesDetail.tsx`

- [ ] **Step 1: Afficher le modèle de spa lié**

Si `spaModelId` est présent, afficher le nom du modèle avec un badge et un lien vers la page pièces détachées.

- [ ] **Step 2: Afficher les pièces sélectionnées lors de la création**

Les pièces liées sont déjà chargées via `linkedParts` dans `getSavTicketById`. Vérifier qu'elles s'affichent correctement avec les informations de couverture garantie.

---

## Task 6: Nettoyage des données test

**Files:**
- Modify: `scripts/seed-sav-tickets.mjs`

- [ ] **Step 1: Supprimer les tickets SAV de test de la base de données**

```sql
DELETE FROM sav_spare_parts WHERE serviceId IN (SELECT id FROM after_sales_services WHERE ticketNumber LIKE 'SAV-17%');
DELETE FROM after_sales_media WHERE serviceId IN (SELECT id FROM after_sales_services WHERE ticketNumber LIKE 'SAV-17%');
DELETE FROM after_sales_notes WHERE serviceId IN (SELECT id FROM after_sales_services WHERE ticketNumber LIKE 'SAV-17%');
DELETE FROM after_sales_status_history WHERE serviceId IN (SELECT id FROM after_sales_services WHERE ticketNumber LIKE 'SAV-17%');
DELETE FROM after_sales_services WHERE ticketNumber LIKE 'SAV-17%';
```

- [ ] **Step 2: Nettoyer les pièces détachées de test**

Vérifier et supprimer les pièces détachées de test (référence commençant par "TEST-").

- [ ] **Step 3: Nettoyer les modèles de spa de test**

Vérifier et supprimer les modèles de spa de test.

---

## Task 7: Tests

**Files:**
- Create: `server/sav-spare-parts-link.test.ts`

- [ ] **Step 1: Écrire un test pour la liaison automatique pièces → ticket**

Vérifier que quand on crée un ticket SAV avec `selectedPartIds`, les pièces sont bien liées dans `sav_spare_parts`.

- [ ] **Step 2: Écrire un test pour la route tRPC avec spaModelId**

Vérifier que la route accepte `spaModelId` et `selectedPartIds` et les traite correctement.

---

## Rollback Plan

En cas de problème, utiliser `webdev_rollback_checkpoint` pour revenir au dernier checkpoint stable. Les modifications de schéma DB (ajout de `spaModelId`) sont additives et non-destructives — elles n'affectent pas les données existantes.
