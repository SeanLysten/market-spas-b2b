# Coherence Guard — Scan Reorder Function

## Références à supprimer (fonction "Recommander" / reorder)

### 1. Frontend — Bouton dans la page Commandes
- `client/src/pages/Orders.tsx` — bouton icône rechargement (à identifier)

### 2. Backend — Endpoint tRPC
- `server/routers.ts:1322-1326` — `orders.reorder` protectedProcedure

### 3. Backend — Fonction DB
- `server/db.ts:2472-2492` — `reorderFromOrder()`

### 4. Backend — Route mobile API
- `server/routes/mobile-api-user.ts:326-327` — `POST /api/mobile/v1/orders/:id/reorder`

### 5. Documentation
- `docs/mobile-api-endpoints.md:398` — Section POST reorder
- `docs/b2b-features-research.md:58` — Mention recommander
- `mobile-api-audit-plan.md:28` — Mention orders.reorder

## À NE PAS toucher (reorder = réorganisation produits admin, pas recommander)
- `client/src/pages/admin/AdminProducts.tsx` — `admin.products.reorder` = drag & drop réorganisation produits (DIFFÉRENT)
- `server/routers.ts:2077` — `admin.products.reorder` = réorganisation tri produits (DIFFÉRENT)
- `drizzle/schema.ts:536` — `sortOrder` pour drag & drop (DIFFÉRENT)

## À NE PAS toucher (isPreorder = précommande, pas recommander)
- Toutes les références `isPreorder` / `preorder` = fonctionnalité précommande (DIFFÉRENT)
