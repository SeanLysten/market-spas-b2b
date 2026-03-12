# Rapport d'Audit Complet — Market Spas B2B Portal

**Date :** 12 mars 2026
**Auteur :** Manus AI
**Portée :** Audit exhaustif du codebase (Phase 1 — Audit uniquement, aucune modification de code)

---

## 1. Résumé Exécutif

Le portail B2B Market Spas est une application complexe de **82 655 lignes de code** réparties sur **265 fichiers TypeScript/TSX**, construite itérativement sur 274 commits. L'audit a identifié un total de **78 problèmes** répartis comme suit :

| Sévérité | Nombre | Description |
|----------|--------|-------------|
| **CRITIQUE** | 4 | Risques de sécurité et composants totalement déconnectés |
| **MOYEN** | 38 | Code mort, doublons, dépendances inutilisées |
| **FAIBLE** | 36 | Organisation, nommage, console.log de debug |

Le projet souffre principalement d'une **accumulation de code mort** (fonctions db.ts remplacées par sav-db.ts, composants jamais importés), de **fichiers de développement laissés à la racine** (scripts, notes, debug), et de quelques **problèmes de sécurité** (token JWT hardcodé, CSP désactivé). La structure fonctionnelle est globalement saine : les 31 modules sont majoritairement connectés de bout en bout, avec quelques exceptions notables.

---

## 2. Statut des Modules

### 2.1 Modules Partenaires

| # | Module | Statut | Détails |
|---|--------|--------|---------|
| 1 | **Authentification** | ✅ | Login local, Register (avec/sans invitation), Forgot/Reset Password, JWT cookies via Jose. Rate limiting appliqué (20 req/15min). |
| 2 | **Dashboard Partenaire** | ✅ | Stats, notifications, événements à venir. 4 appels tRPC connectés. |
| 3 | **Catalogue & Commandes** | ✅ | Browse → détail → panier → checkout → Stripe → confirmation. Flux complet connecté. |
| 4 | **Favoris** | ✅ | Add/remove/check. 3 routes backend, frontend connecté. |
| 5 | **Gestion des Leads** | ✅ | Leads filtrés par territoire, export, stats, mise à jour de statut. |
| 6 | **SAV / Après-Vente** | ✅ | Tickets avec moteur de garantie, upload fichiers S3, historique de statut. Utilise sav-db.ts (pas db.ts). |
| 7 | **Médiathèque (Ressources)** | ✅ | Browse/download par dossier. Upload admin → visibilité partenaire. |
| 8 | **Ressources Techniques & Forum** | ✅ | Documentation + forum topics/réponses. Appels tRPC connectés. |
| 9 | **Gestion d'Équipe** | ✅ | Invitation, rôles, permissions. Récemment corrigé et testé (71 tests). |
| 10 | **Calendrier** | ✅ | Événements à venir. 2 appels tRPC connectés. |
| 11 | **Pièces Détachées** | ✅ | Catalogue avec compatibilité modèles spa. |
| 12 | **Profil & Notifications** | ✅ | Mise à jour profil, préférences de notification, WebSocket. |
| 13 | **Onboarding Partenaire** | ✅ | Inscription en 3 étapes, création automatique fiche partenaire, statut PENDING. |

### 2.2 Modules Admin

| # | Module | Statut | Détails |
|---|--------|--------|---------|
| 14 | **Admin Dashboard** | ✅ | 13 appels tRPC, graphiques SalesChart/TopProductsChart. |
| 15 | **Admin Leads** | ✅ | 18 appels tRPC. Meta OAuth, webhook, sync, routage géographique, CSV import. Fichier très volumineux (2303 lignes). |
| 16 | **Admin Carte Partenaires** | ✅ | 13 appels tRPC. Carte interactive, routes sauvegardées, itinéraires. |
| 17 | **Admin Produits** | ✅ | 13 appels tRPC. CRUD complet avec variantes, stock, upload S3. |
| 18 | **Admin Newsletter** | ✅ | 6 appels tRPC. Création, planification, envoi via Resend. Job cron 60s. |
| 19 | **Admin SAV** | ✅ | 15 appels tRPC. Cycle de vie complet des tickets. |
| 20 | **Admin Pièces Détachées** | ✅ | 16 appels tRPC. CRUD + compatibilité modèles. |
| 21 | **Admin Utilisateurs** | ✅ | 10 appels tRPC. 7 niveaux de rôles, activation/désactivation. |
| 22 | **Admin Ressources** | ✅ | 7 appels tRPC. Upload multipart, dossiers, visibilité. |
| 23 | **Admin Partenaires** | ✅ | 6 appels tRPC. CRUD, approbation, cascade suppression. |
| 24 | **Admin Commandes** | ⚠️ | Seulement 2 appels tRPC (list + updateStatus). Pas de validation, expéditions partielles, ni remboursements connectés au frontend. Les fonctions `cancelOrder`, `createPartialShipment`, `processPartialRefund` existent dans db.ts mais ne sont appelées nulle part. |
| 25 | **Admin Paramètres** | ❌ | **Composant entièrement statique.** Aucun appel tRPC, aucun fetch. Le bouton "Enregistrer" simule une sauvegarde avec `setTimeout`. Les paramètres ne sont pas persistés. |
| 26 | **Admin Rapports** | ⚠️ | 3 appels tRPC seulement. Fonctionnel mais limité. |
| 27 | **Admin Calendrier** | ✅ | 5 appels tRPC. CRUD événements, publication. |
| 28 | **Admin Territoires** | ✅ | 7 appels tRPC. Gestion des territoires et codes postaux. |
| 29 | **Admin Prévisions Stock** | ✅ | 3 appels tRPC. Suivi arrivages, job de traitement. |
| 30 | **Admin Intégrations Analytics** | ✅ | Meta Ads, Google Ads, GA4, Shopify — tous connectés via tRPC dans AdminDashboard/AdminLeads. |
| 31 | **Admin Candidats** | ✅ | Gestion des candidatures partenaires depuis la carte. |

---

## 3. Rapport Code Mort

### 3.1 Fichiers Morts Confirmés

| Fichier | Taille | Preuve |
|---------|--------|--------|
| `client/src/pages/ComponentShowcase.tsx` | 1437 lignes (58KB) | Aucun import dans App.tsx ni dans aucun autre fichier. Non routé. |
| `client/src/components/AIChatBox.tsx` | 11KB | Uniquement importé par ComponentShowcase (mort). |
| `client/src/components/ManusDialog.tsx` | ~5KB | Défini mais jamais importé nulle part. |
| `client/src/components/StripePayment.tsx` | ~8KB | Défini mais jamais importé nulle part. |
| `client/src/components/NotificationCenter.tsx` | ~10KB | Défini mais jamais importé nulle part. |
| `server/_core/llm.ts` | ~10KB | Aucun import en dehors de `_core/`. |
| `server/_core/voiceTranscription.ts` | ~5KB | Aucun import en dehors de `_core/`. |
| `server/_core/imageGeneration.ts` | ~5KB | Aucun import en dehors de `_core/`. |
| `server/_core/dataApi.ts` | ~3KB | Aucun import en dehors de `_core/`. |
| `.manus/db/` (350 fichiers JSON) | 1.8MB | Artefacts de debug Manus, pas du code applicatif. |

### 3.2 Composants UI Non Utilisés

Les composants shadcn/ui suivants sont installés mais jamais importés dans le code applicatif :

| Composant | Fichier |
|-----------|---------|
| `button-group` | `client/src/components/ui/button-group.tsx` |
| `empty` | `client/src/components/ui/empty.tsx` |
| `field` | `client/src/components/ui/field.tsx` |
| `input-group` | `client/src/components/ui/input-group.tsx` |
| `kbd` | `client/src/components/ui/kbd.tsx` |
| `navigation-menu` | `client/src/components/ui/navigation-menu.tsx` |
| `spinner` | `client/src/components/ui/spinner.tsx` |

> **Note :** `form.tsx` et `item.tsx` sont référencés indirectement par d'autres composants UI, ils ne sont donc pas considérés comme morts.

### 3.3 Fonctions Mortes dans db.ts (22 fonctions)

Ces fonctions sont exportées depuis `server/db.ts` mais ne sont appelées nulle part dans le code serveur (ni dans `routers.ts`, ni dans aucun autre fichier serveur hors tests) :

| Fonction | Catégorie | Raison probable |
|----------|-----------|-----------------|
| `getUsersByPartnerId` | Utilisateurs | Remplacée par requête directe |
| `getPartnerByVatNumber` | Partenaires | Jamais implémentée côté frontend |
| `generateOrderNumber` | Commandes | Logique déplacée inline |
| `createNotification` | Notifications | Remplacée par WebSocket |
| `notifyPartnerUsers` | Notifications | Remplacée par WebSocket |
| `getLowStockProducts` | Stock | Jamais connectée |
| `getLowStockVariants` | Stock | Jamais connectée |
| `checkAndCreateStockAlerts` | Stock | Jamais connectée |
| `getAdminDashboardStats` | Dashboard | Remplacée par requêtes inline dans routers.ts |
| `getRecentActivity` | Dashboard | Remplacée par requêtes inline |
| `getLeadsByPartnerId` | Leads | Remplacée par filtrage dans routers.ts |
| `getPaymentsByOrderId` | Paiements | Jamais connectée au frontend |
| `cancelOrder` | Commandes | Jamais connectée au frontend |
| `createPartialShipment` | Commandes | Jamais connectée au frontend |
| `processPartialRefund` | Commandes | Jamais connectée au frontend |
| `createAfterSalesService` | SAV | Remplacée par `sav-db.ts` |
| `getAfterSalesServices` | SAV | Remplacée par `sav-db.ts` |
| `getAfterSalesServiceById` | SAV | Remplacée par `sav-db.ts` |
| `updateAfterSalesServiceStatus` | SAV | Remplacée par `sav-db.ts` |
| `addAfterSalesNote` | SAV | Remplacée par `sav-db.ts` |
| `getAfterSalesStats` | SAV | Remplacée par `sav-db.ts` |
| `getAfterSalesStatsByPartner` | SAV | Remplacée par `sav-db.ts` |
| `getAfterSalesWeeklyStats` | SAV | Remplacée par `sav-db.ts` |
| `addAfterSalesStatusHistory` | SAV | Remplacée par `sav-db.ts` |
| `getAfterSalesAssignmentHistory` | SAV | Remplacée par `sav-db.ts` |
| `addAfterSalesAssignmentHistory` | SAV | Remplacée par `sav-db.ts` |
| `addResponseTemplate` | SAV | Jamais connectée |
| `deleteExpiredInvitationTokens` | Auth | Jamais appelée (pas de cron) |

### 3.4 Fichiers Racine à Nettoyer

Le projet contient **61+ fichiers en vrac à la racine** qui devraient être organisés ou supprimés :

| Catégorie | Fichiers | Action recommandée |
|-----------|----------|-------------------|
| Scripts .mjs (14) | `audit-leads.mjs`, `check-user.mjs`, `check-users.mjs`, `extract-leads.mjs`, `get-partners.mjs`, `import-candidates.mjs`, `import_contacts.mjs`, `run-import.mjs`, `seed-demo-data.mjs`, `seed-resources.mjs`, `seed-variants.mjs`, `setup-leadgen-webhook.mjs`, `test-reassign.mjs`, `update-password.mjs` | Consolider dans `scripts/` ou supprimer |
| Notes Meta/OAuth (10) | `meta-app-*.md`, `meta-oauth-*.md`, `oauth-flow-analysis.md`, `debug-oauth-config.txt` | Déplacer dans `docs/` ou supprimer |
| Guides (6) | `GOOGLE_ADS_*.md`, `GUIDE-*.md`, `RESEND_SETUP_GUIDE.md`, `ZAPIER_MAKE_INTEGRATION.md` | Déplacer dans `docs/` |
| Audits/Todos (8) | `AUDIT-PAGES.md`, `audit-*.md`, `b2b-*.md`, `todo-prioritized.md`, `mobile-adaptation-todo.md`, `PLAN-FINALISATION.md` | Supprimer (obsolètes) |
| Shopify (4) | `SHOPIFY_FORM_CODE.txt`, `SHOPIFY_FORM_FINAL.liquid`, `SHOPIFY_FORM_FINAL.txt`, `SHOPIFY_FORM_UPDATED.liquid` | Garder uniquement la version finale |
| Blueprints JSON (3) | `Facebook-Leads-Blueprint.json`, `Facebook-Leads-Fixed.json`, `Meta-Ads-Stats-Blueprint.json` | Déplacer dans `docs/` |
| Divers | `add-variants-tables.sql`, `SIMULATION_REPORT.md`, `STYLE_GUIDE.md`, `research-*.md` | Évaluer au cas par cas |

---

## 4. Rapport Doublons

### 4.1 Fonctions Dupliquées dans db.ts

| Doublon A | Doublon B | Les deux utilisées ? |
|-----------|-----------|---------------------|
| `getUnreadNotificationsCount` (ligne 399) | `getUnreadNotificationCount` (ligne 1694) | **Oui** — les deux sont appelées dans routers.ts à des endroits différents. Risque d'incohérence. |
| `getProductBySku` (ligne 267) | `getProductBySKU` (ligne 3664) | **Oui** — `getProductBySku` utilisée dans routers.ts (ligne 853), `getProductBySKU` utilisée dans csv-import.ts. |
| `updateGa4AccountLastSynced` | `updateGa4AccountSyncError` | Non dupliquées, noms similaires mais fonctions différentes. |

### 4.2 Fichiers Dupliqués

| Fichier A | Fichier B | Statut |
|-----------|-----------|--------|
| `seed-demo-data.mjs` (racine, 3929 octets) | `scripts/seed-demo-data.mjs` (10365 octets) | Implémentations différentes. La version `scripts/` est plus complète. |
| `client/src/pages/TechnicalResources.tsx` (308 lignes) | `client/src/pages/admin/TechnicalResources.tsx` (415 lignes) | **Pas un vrai doublon** — la version partenaire et la version admin ont des layouts et permissions différents. Cependant, la logique de rendu des topics/ressources est partiellement dupliquée. |

### 4.3 Code SAV Dupliqué

Les fonctions SAV (After-Sales) existent en **double** : une version dans `server/db.ts` (12 fonctions, ~400 lignes) et une version dans `server/sav-db.ts` (20 fonctions). Seule la version `sav-db.ts` est utilisée par `routers.ts`. Les 12 fonctions dans `db.ts` sont du code mort qui devrait être supprimé.

### 4.4 Routes Google OAuth Potentiellement Redondantes

Dans `server/_core/index.ts`, deux routes de callback OAuth Google coexistent :

- **Ligne 136 :** `/api/google-analytics/callback` — callback dédié GA4
- **Ligne 164 :** `/api/google-ads/callback` — callback dédié Google Ads (gère aussi GA4 via préfixe state)

Il est possible que la première route soit redondante si la seconde gère les deux cas via le préfixe state. Une vérification plus approfondie est nécessaire avant suppression.

---

## 5. Rapport Connexions Cassées

### 5.1 AdminSettings — Composant Entièrement Déconnecté

> **Sévérité : CRITIQUE**

Le composant `AdminSettings.tsx` est un **mock statique**. Il affiche un formulaire de paramètres (entreprise, email, paiement, notifications, sécurité) mais :

- Aucun appel tRPC, fetch, ou axios
- Le bouton "Enregistrer" exécute `setTimeout(1000)` puis affiche un toast de succès
- Les valeurs sont stockées uniquement dans le state local React (perdues au rechargement)
- Aucune route backend correspondante n'existe pour persister ces paramètres

### 5.2 AdminOrders — Fonctionnalités Partiellement Déconnectées

> **Sévérité : MOYEN**

Le composant AdminOrders n'utilise que 2 appels tRPC (`orders.list` et `orders.updateStatus`). Les fonctionnalités avancées suivantes existent dans `db.ts` mais ne sont pas connectées au frontend :

- `cancelOrder` — annulation de commande
- `createPartialShipment` — expéditions partielles
- `processPartialRefund` — remboursements partiels
- `getPaymentsByOrderId` — historique des paiements

### 5.3 StripePayment et NotificationCenter — Composants Orphelins

> **Sévérité : MOYEN**

- `StripePayment.tsx` est défini mais jamais importé. Le paiement Stripe passe par Checkout Sessions (redirection), rendant ce composant inutile.
- `NotificationCenter.tsx` est défini mais jamais importé. Les notifications passent par le WebSocket hook et les toasts.

---

## 6. Problèmes de Sécurité

### 6.1 Sévérité CRITIQUE

| Problème | Fichier | Détails |
|----------|---------|---------|
| **Token JWT hardcodé** | `test-reassign.mjs` (ligne 6) | Un token JWT complet est hardcodé dans le header Cookie. Bien qu'expiré, c'est une mauvaise pratique qui expose la structure du token. |
| **Mot de passe loggé en console** | `update-password.mjs` (ligne 25) | `console.log(\`New password: ${newPassword}\`)` — le mot de passe en clair est affiché dans les logs. |

### 6.2 Sévérité MOYENNE

| Problème | Fichier | Détails |
|----------|---------|---------|
| **CSP désactivé** | `server/_core/index.ts` | `contentSecurityPolicy: false` dans la config Helmet. Nécessaire pour Vite en dev, mais devrait être activé en production. |
| **crossOriginEmbedderPolicy désactivé** | `server/_core/index.ts` | Désactivé pour les popups OAuth. Acceptable mais à documenter. |
| **Pas de configuration CORS explicite** | `server/_core/index.ts` | Aucune configuration CORS trouvée. Probablement géré par le proxy, mais devrait être explicite. |

### 6.3 Sévérité FAIBLE

| Problème | Détails |
|----------|---------|
| **164 console.log dans le serveur** | Logs de debug qui devraient être remplacés par un logger structuré en production. |
| **15 console.log dans le client** | Logs de debug à nettoyer. |
| **9 TODO/FIXME dans le code** | Marqueurs de dette technique non résolus. |

### 6.4 Points Positifs (Sécurité)

- Toutes les routes admin utilisent `adminProcedure` (159 routes protégées)
- Rate limiting appliqué : auth (20 req/15min), API (100 req/15min)
- Toutes les requêtes SQL utilisent Drizzle ORM (paramétrisé), les `sql\`\`` template literals sont sûrs
- 225 routes avec validation d'input Zod sur 170 routes totales (166 avec `z.`)
- JWT géré via Jose (bibliothèque moderne)

---

## 7. Dépendances

### 7.1 Statistiques

Le projet contient **87 dépendances** et **26 devDependencies**.

### 7.2 Dépendances Inutilisées

| Dépendance | Type | Raison |
|------------|------|--------|
| `add@^2.0.6` | devDependency | **Accidentelle** — résultat probable d'un `npm add` mal tapé. |
| `@aws-sdk/client-s3` | dependency | Le stockage S3 utilise un proxy (`server/storage.ts`), pas le SDK AWS directement. |
| `@aws-sdk/s3-request-presigner` | dependency | Même raison que ci-dessus. |
| `framer-motion` | dependency | Aucun import `from "framer-motion"` trouvé dans le code. |
| `jsonwebtoken` | dependency | Aucun import trouvé. Le projet utilise `jose` pour le JWT. |
| `@hookform/resolvers` | dependency | Aucun import de `zodResolver` trouvé. |
| `tailwindcss-animate` | dependency | Aucun import trouvé dans les fichiers CSS ou TSX. |
| `@types/multer` | dependency | Devrait être dans devDependencies, pas dependencies. |

### 7.3 Estimation d'Économie

La suppression de ces 7 dépendances inutilisées réduirait la taille du `node_modules` et accélérerait les installations. Les deux packages AWS SDK sont les plus volumineux (~50MB combinés).

---

## 8. Architecture et Nommage

### 8.1 Fichiers Monolithiques

| Fichier | Lignes | Problème |
|---------|--------|----------|
| `server/db.ts` | 5605 | 200 fonctions exportées. Contient des fonctions mortes (SAV dupliqué), des doublons, et mélange toutes les entités. |
| `server/routers.ts` | 5090 | Toutes les routes tRPC dans un seul fichier. Difficile à maintenir. |
| `drizzle/schema.ts` | 2604 | Schéma complet en un fichier. Acceptable pour Drizzle mais volumineux. |
| `server/email.ts` | 1960 | Tous les templates email en un fichier. |
| `client/src/pages/admin/AdminLeads.tsx` | 2303 | Plus gros composant frontend. Intègre Meta Ads, Google Ads, GA4, Shopify. |

### 8.2 Nommage

Le code utilise principalement l'anglais pour les noms de variables et fonctions, avec du français pour les messages utilisateur et les erreurs. C'est un choix cohérent et acceptable. Quelques incohérences mineures :

- `getProductBySku` vs `getProductBySKU` (casse différente)
- `getUnreadNotificationsCount` vs `getUnreadNotificationCount` (pluriel vs singulier)

---

## 9. Recommandations de Nettoyage (Prioritisées)

### Priorité 1 — Sécurité (immédiat)

1. Supprimer le token JWT hardcodé dans `test-reassign.mjs`
2. Supprimer le `console.log` du mot de passe dans `update-password.mjs`
3. Activer CSP en production (configurer Helmet conditionnellement)

### Priorité 2 — Code Mort (rapide, sans risque)

4. Supprimer `.manus/db/` (350 fichiers debug, 1.8MB)
5. Supprimer `ComponentShowcase.tsx`, `AIChatBox.tsx`, `ManusDialog.tsx`
6. Supprimer `StripePayment.tsx`, `NotificationCenter.tsx` (orphelins)
7. Supprimer les 4 modules `_core` inutilisés (llm, voiceTranscription, imageGeneration, dataApi)
8. Supprimer les 7 composants UI inutilisés
9. Supprimer les 22+ fonctions mortes dans `db.ts`
10. Consolider les doublons (`getUnreadNotification*`, `getProductBySku/SKU`)

### Priorité 3 — Dépendances

11. Supprimer `add@^2.0.6` de devDependencies
12. Supprimer `@aws-sdk/client-s3` et `@aws-sdk/s3-request-presigner`
13. Supprimer `framer-motion`, `jsonwebtoken`, `@hookform/resolvers`, `tailwindcss-animate`
14. Déplacer `@types/multer` vers devDependencies

### Priorité 4 — Organisation

15. Consolider les 14 scripts .mjs racine dans `scripts/`
16. Déplacer les guides/docs dans `docs/`
17. Garder uniquement `SHOPIFY_FORM_FINAL.liquid`, supprimer les autres versions
18. Déplacer les blueprints JSON dans `docs/`
19. Supprimer les fichiers d'audit/todo obsolètes à la racine

### Priorité 5 — Connexions Cassées

20. Connecter `AdminSettings` au backend (créer les routes tRPC de persistance)
21. Connecter les fonctionnalités avancées de commandes (annulation, expéditions partielles, remboursements)
22. Vérifier et potentiellement supprimer la route Google Analytics callback redondante

### Priorité 6 — Qualité (long terme)

23. Remplacer les 164 `console.log` serveur par un logger structuré (winston/pino)
24. Envisager le découpage de `routers.ts` et `db.ts` en modules par domaine
25. Résoudre les 9 TODO/FIXME restants dans le code

---

## 10. Estimation d'Impact du Nettoyage

| Métrique | Avant | Après (estimé) |
|----------|-------|----------------|
| Fichiers TS/TSX | 265 | ~240 |
| Lignes de code | 82 655 | ~78 000 |
| Fonctions db.ts | 200 | ~175 |
| Fichiers racine | 61+ | ~15 |
| Dépendances | 87 + 26 | 80 + 25 |
| `.manus/db/` | 1.8MB | 0 |

---

**En attente de votre validation avant de procéder à la Phase 2 (corrections).**
