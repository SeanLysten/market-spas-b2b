# COHERENCE GUARD — AUDIT REPORT TVA
## Market Spas B2B — 10 avril 2026

---

| Sévérité | Nombre | Description |
|----------|--------|-------------|
| CRITICAL | 2 | Provoquera des bugs ou des montants incorrects |
| HIGH | 4 | Risque élevé d'incohérence pour l'utilisateur |
| MEDIUM | 4 | Qualité / cohérence visuelle |
| LOW | 2 | Nettoyage / amélioration |
| PASSED | 5 | Aucun problème détecté |

---

## Règle métier de référence

> **France (FR) : TVA 20%** — **Hors France (BE, LU, DE, ES, NL, etc.) : TVA 0%** (autoliquidation intra-UE B2B)
>
> Le taux de 21% (Belgique) ne doit apparaître nulle part dans le code. La TVA est **dynamique**, calculée en fonction du pays du partenaire.

---

## CRITICAL

### CRITICAL #1 — Calcul SAV hardcodé à 21% (Belgique)

| Champ | Détail |
|-------|--------|
| Localisation | `server/sav-db.ts:893` |
| Problème | `const vatRate = 0.21; // 21% TVA Belgique` — Le calcul du total SAV utilise un taux de 21% en dur, ignorant complètement le pays du partenaire. Un partenaire français paiera 21% au lieu de 20%, et un partenaire belge paiera 21% au lieu de 0%. |
| Impact | Montants TTC incorrects sur tous les paiements SAV (pièces détachées). |
| Cause | Implémentation initiale basée sur la Belgique avant l'ajout de `getVatRateForPartner`. |
| Correction | Remplacer le taux en dur par un appel à `getVatRateForPartner(service.partnerId)`. |
| Fichiers liés | `server/sav-db.ts`, `server/routers.ts` (appels à `calculateSavTotal`) |
| Effort | Quick fix |

### CRITICAL #2 — PDF commande affiche "TVA (21%)" en dur

| Champ | Détail |
|-------|--------|
| Localisation | `server/routes/order-pdf.ts:435` |
| Problème | `.text("TVA (21%)", 350, tableY)` — Le PDF de commande affiche toujours "TVA (21%)" quel que soit le taux réel appliqué à la commande. Un partenaire français verra "TVA (21%)" alors que le montant calculé est à 20%. Un partenaire belge verra "TVA (21%)" alors que le montant est à 0%. |
| Impact | Document commercial incorrect, potentiellement illégal (taux affiché ne correspond pas au taux appliqué). |
| Cause | Texte statique au lieu d'utiliser le taux réel de la commande. |
| Correction | Calculer le taux réel depuis les données de la commande (`totalVAT / totalHT * 100`) ou stocker le taux dans la commande. |
| Fichiers liés | `server/routes/order-pdf.ts` |
| Effort | Quick fix |

---

## HIGH

### HIGH #1 — Défaut DB produits : vatRate default "21"

| Champ | Détail |
|-------|--------|
| Localisation | `drizzle/schema.ts:498` |
| Problème | `vatRate: decimal("vatRate", { precision: 5, scale: 2 }).default("21")` — Le défaut de la colonne `vatRate` dans la table `products` est 21%. Tous les produits créés sans spécifier explicitement le taux auront 21%. |
| Impact | Les produits affichent 21% dans la fiche produit (`ProductDetail.tsx:439`), ce qui est trompeur. Cependant, le calcul réel des commandes utilise `getVatRateForPartner`, donc le montant final est correct. L'impact est principalement visuel/informatif. |
| Cause | Valeur initiale basée sur la TVA belge. |
| Correction | Changer le défaut à "20" (taux France, marché principal) ou supprimer le champ `vatRate` des produits (car la TVA est dynamique par partenaire, pas par produit). |
| Fichiers liés | `drizzle/schema.ts`, `client/src/pages/ProductDetail.tsx` |
| Effort | Medium (migration DB + mise à jour des produits existants) |

### HIGH #2 — Défaut DB pièces détachées : vatRate default "21"

| Champ | Détail |
|-------|--------|
| Localisation | `drizzle/schema.ts:2285` |
| Problème | `vatRate: decimal("vatRate", { precision: 5, scale: 2 }).default("21")` — Même problème que HIGH #1 pour la table `spare_parts`. |
| Impact | Les pièces détachées affichent 21% dans `SpareParts.tsx:400`. |
| Cause | Copié du schéma produits. |
| Correction | Changer le défaut à "20". |
| Fichiers liés | `drizzle/schema.ts`, `client/src/pages/SpareParts.tsx` |
| Effort | Quick fix |

### HIGH #3 — Formulaire admin produits : défaut vatRate "21"

| Champ | Détail |
|-------|--------|
| Localisation | `client/src/pages/admin/AdminProducts.tsx:68, 170, 188` |
| Problème | Le formulaire de création/modification de produit initialise `vatRate: "21"` par défaut. Tous les nouveaux produits créés via l'admin auront 21% sauf modification manuelle. |
| Impact | Incohérence avec la règle métier (20% France). |
| Cause | Valeur initiale copiée du schéma DB. |
| Correction | Changer à "20" ou mieux, rendre ce champ informatif avec une note expliquant que la TVA est calculée dynamiquement. |
| Fichiers liés | `client/src/pages/admin/AdminProducts.tsx` |
| Effort | Quick fix |

### HIGH #4 — Formulaire admin pièces détachées : défaut vatRate "21"

| Champ | Détail |
|-------|--------|
| Localisation | `client/src/pages/admin/AdminSpareParts.tsx:1234, 1250, 1268, 1281, 1363, 1427` |
| Problème | 6 occurrences de "21" comme valeur par défaut dans le formulaire de pièces détachées (initialisation, édition, reset, placeholder, soumission). |
| Impact | Même que HIGH #3. |
| Cause | Valeur initiale copiée. |
| Correction | Remplacer toutes les occurrences par "20". |
| Fichiers liés | `client/src/pages/admin/AdminSpareParts.tsx` |
| Effort | Quick fix |

---

## MEDIUM

### MEDIUM #1 — Affichage vatRate produit dans ProductDetail.tsx

| Champ | Détail |
|-------|--------|
| Localisation | `client/src/pages/ProductDetail.tsx:439` |
| Problème | `{product.vatRate}%` — Affiche le taux stocké dans le produit (21% par défaut) alors que la TVA réelle dépend du pays du partenaire. |
| Impact | Information trompeuse pour le partenaire. Un partenaire belge voit "TVA 21%" alors qu'il paiera 0%. |
| Cause | Le champ `vatRate` du produit est un vestige de l'ancien système à taux fixe. |
| Correction | Remplacer par un texte dynamique basé sur le pays du partenaire connecté, ou afficher "TVA selon pays". |
| Fichiers liés | `client/src/pages/ProductDetail.tsx` |
| Effort | Quick fix |

### MEDIUM #2 — Affichage vatRate pièce détachée dans SpareParts.tsx

| Champ | Détail |
|-------|--------|
| Localisation | `client/src/pages/SpareParts.tsx:400` |
| Problème | `{detailPart.vatRate || 21}%` — Affiche le taux stocké ou 21% par défaut. Fallback explicite à 21%. |
| Impact | Information trompeuse. |
| Cause | Fallback codé en dur. |
| Correction | Remplacer le fallback 21 par 20, ou afficher "TVA selon pays". |
| Fichiers liés | `client/src/pages/SpareParts.tsx` |
| Effort | Quick fix |

### MEDIUM #3 — Seed script utilise vatRate 21

| Champ | Détail |
|-------|--------|
| Localisation | `scripts/seed-real-products.ts:333` |
| Problème | `${"21"}` — Le script de seed insère les produits avec vatRate 21%. |
| Impact | Tous les produits seedés ont un taux incorrect. |
| Cause | Script créé avant la règle TVA dynamique. |
| Correction | Changer à "20". |
| Fichiers liés | `scripts/seed-real-products.ts` |
| Effort | Quick fix |

### MEDIUM #4 — Création pièce détachée dans sav-db.ts : fallback "21"

| Champ | Détail |
|-------|--------|
| Localisation | `server/sav-db.ts:549` |
| Problème | `vatRate: data.vatRate || "21"` — Le fallback lors de la création d'une pièce détachée est 21%. |
| Impact | Pièces créées sans taux explicite auront 21%. |
| Cause | Valeur copiée du schéma. |
| Correction | Changer à "20". |
| Fichiers liés | `server/sav-db.ts` |
| Effort | Quick fix |

---

## LOW

### LOW #1 — AdminSettings affiche "21% (Belgique)" comme exemple

| Champ | Détail |
|-------|--------|
| Localisation | `client/src/pages/admin/AdminSettings.tsx:510` |
| Problème | `Exemples : 0% (exonéré), 20% (France), 21% (Belgique)` — Le texte d'aide mentionne 21% Belgique comme option valide, ce qui peut induire en erreur puisque la TVA est dynamique par pays. |
| Impact | Confusion pour l'admin. Le champ `getTaxConfig` (taux global) n'est plus utilisé dans les calculs de commandes (remplacé par `getVatRateForPartner`). |
| Cause | Vestige de l'ancien système. |
| Correction | Mettre à jour le texte pour expliquer que la TVA est calculée automatiquement par pays (20% France, 0% autres). Le champ global dans les settings est obsolète. |
| Fichiers liés | `client/src/pages/admin/AdminSettings.tsx` |
| Effort | Quick fix |

### LOW #2 — Test order-pricing.test.ts utilise vatRate 21

| Champ | Détail |
|-------|--------|
| Localisation | `server/order-pricing.test.ts:153, 159` |
| Problème | Le test vérifie que `getTaxConfig` retourne 21 quand le setting est à 21. C'est techniquement correct (le test vérifie le comportement de la fonction), mais le scénario de test utilise 21% comme exemple. |
| Impact | Aucun impact fonctionnel, mais incohérent avec la règle métier. |
| Cause | Test écrit avant la règle TVA dynamique. |
| Correction | Optionnel — changer l'exemple de test à 20%. |
| Fichiers liés | `server/order-pricing.test.ts` |
| Effort | Quick fix |

---

## PASSED (aucun problème)

| Check | Détail |
|-------|--------|
| Calcul commandes (db.ts) | `getVatRateForPartner` correctement utilisé dans `getCart` (ligne 976) et `createOrder` (ligne 1909). Taux 20% FR, 0% autres. |
| Calcul commandes (routers.ts) | `getVatRateForPartner` correctement utilisé dans la mutation `orders.create` (ligne 1114). |
| Calcul commandes (mobile-api.ts) | `getVatRateForPartner` correctement utilisé dans la route mobile de création de commande (ligne 947). |
| Affichage panier (Cart.tsx) | Utilise `vatRate` et `vatLabel` dynamiques retournés par le serveur. |
| Affichage checkout (Checkout.tsx) | Utilise `vatRate`, `vatLabel`, `vatAmount` dynamiques retournés par le serveur. |

---

## Résumé des corrections à appliquer

| # | Fichier | Action | Effort |
|---|---------|--------|--------|
| C1 | `server/sav-db.ts:893` | Remplacer `0.21` par appel à `getVatRateForPartner(service.partnerId)` | Quick |
| C2 | `server/routes/order-pdf.ts:435` | Calculer le taux réel depuis les données de la commande | Quick |
| H1 | `drizzle/schema.ts:498` | Changer default "21" → "20" | Quick |
| H2 | `drizzle/schema.ts:2285` | Changer default "21" → "20" | Quick |
| H3 | `client/src/pages/admin/AdminProducts.tsx` | Changer 3 occurrences "21" → "20" | Quick |
| H4 | `client/src/pages/admin/AdminSpareParts.tsx` | Changer 6 occurrences "21" → "20" | Quick |
| M1 | `client/src/pages/ProductDetail.tsx:439` | Afficher "TVA selon pays" au lieu du taux produit | Quick |
| M2 | `client/src/pages/SpareParts.tsx:400` | Remplacer fallback 21 → 20 et ajouter mention dynamique | Quick |
| M3 | `scripts/seed-real-products.ts:333` | Changer "21" → "20" | Quick |
| M4 | `server/sav-db.ts:549` | Changer fallback "21" → "20" | Quick |
| L1 | `client/src/pages/admin/AdminSettings.tsx:510` | Mettre à jour le texte d'aide TVA | Quick |
| L2 | `server/order-pricing.test.ts:153` | Changer exemple 21 → 20 | Quick |
| DB | Produit test Mollie (ID 150002) | Mettre à jour vatRate de 21 à 20 en DB | Quick |
| DB | Tous les produits existants | Mettre à jour vatRate de 21 à 20 en DB | Quick |
