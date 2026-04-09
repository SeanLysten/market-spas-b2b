# Audit & Plan de Complétion — Endpoints Mobiles Market Spas B2B

**Date :** 09/04/2026  
**Auteur :** Manus AI  
**Portée :** `server/routes/mobile-api.ts` et `server/routes/mobile-auth.ts`

---

## 1. Situation Actuelle

Le backend web expose **289 procédures tRPC** couvrant l'intégralité des fonctionnalités du portail B2B (dashboard utilisateur, dashboard admin, catalogue, commandes, SAV, leads, ressources, forum, newsletter, analytics, etc.). L'API mobile REST, quant à elle, ne propose que **27 endpoints** dans `mobile-api.ts` et **6 endpoints** dans `mobile-auth.ts`, soit un taux de couverture d'environ **11 %** du backend.

L'objectif est de compléter l'API mobile pour que les dashboards utilisateur et admin soient **complets**, avec toutes les données du backend accessibles de manière **structurée et cohérente**.

---

## 2. Inventaire des Écarts

### 2.1 Endpoints Utilisateur Manquants (Priorité Haute)

| Domaine | Endpoints Manquants | Équivalent tRPC |
|---------|---------------------|-----------------|
| **Profil** | GET/PUT profil utilisateur | `profile.get`, `profile.update` |
| **Partenaire** | PUT profil partenaire | `partners.updateMyPartner` |
| **Panier** | GET/POST/PUT/DELETE panier | `cart.get`, `cart.add`, `cart.updateQuantity`, `cart.removeItem`, `cart.clear` |
| **Favoris produits** | GET/POST/DELETE favoris | `products.getFavorites`, `addFavorite`, `removeFavorite`, `isFavorite` |
| **Recherche** | GET recherche rapide | `products.quickSearch` |
| **Commandes** | POST annuler, POST re-commander, GET export | `orders.cancel`, `orders.reorder`, `orders.export` |
| **Retours** | GET/POST retours | `returns.create`, `returns.list`, `returns.getById`, `returns.addNote` |
| **SAV détail** | GET composants/défauts/garantie, POST note, POST paiement | `afterSales.getComponentsByBrand`, `analyzeWarranty`, `addNote`, `createPayment`, `statusHistory`, `getSavSpareParts`, `calculateTotal`, `getCompatibleParts` |
| **Pièces détachées** | GET liste/détail | `spareParts.list`, `spareParts.getById` |
| **Modèles spa** | GET liste/détail/pièces | `spaModels.list`, `spaModels.getById`, `spaModels.getParts` |
| **Ressources** | GET download, GET favoris | `resources.download`, `resourceFavorites.toggle/list/listWithDetails` |
| **Ressources techniques** | GET liste/détail/download | `technicalResources.list`, `getById`, `trackDownload` |
| **Forum** | GET/POST topics/replies | `forum.listTopics`, `getTopic`, `createTopic`, `createReply`, `markResolved`, `markHelpful` |
| **Équipe** | GET/POST/DELETE membres | `team.list`, `invite`, `cancelInvitation`, `updatePermissions`, `remove`, `myPermissions` |
| **Préférences notifs** | GET/PUT préférences | `notificationPreferences.get`, `update` |
| **Leads stats** | GET stats/export | `leads.myStats`, `leads.export` |
| **Zones livraison** | GET lookup | `shippingZones.lookup` |
| **Onboarding** | GET/POST état onboarding | `auth.getCompletedOnboarding`, `markOnboardingCompleted` |

### 2.2 Endpoints Admin Manquants (Priorité Haute)

| Domaine | Endpoints Manquants | Équivalent tRPC |
|---------|---------------------|-----------------|
| **Utilisateurs** | GET/POST/PUT users | `admin.users.list`, `admin.invite`, `admin.users.toggleActive`, `admin.users.resendInvitation` |
| **Produits** | CRUD complet + variantes + images | `admin.products.*` (12 procédures) |
| **Événements** | CRUD événements | `admin.events.*` (4 procédures) |
| **Ressources** | POST/DELETE/PUT resources | `admin.resources.create/delete/moveToFolder` |
| **Paiements** | GET liste paiements | `admin.payments.list` |
| **Commandes admin** | PUT status, POST validate, GET today/export | `orders.updateStatus`, `quickValidate`, `getToday`, `exportToday` |
| **SAV admin** | PUT status/garantie, POST tracking/pièces | `afterSales.updateStatus`, `updateWarrantyDecision`, `linkSparePart`, `addTracking`, `stats`, `weeklyStats` |
| **Partenaires admin** | POST/PUT create/update | `admin.partners.create`, `admin.partners.update` |
| **Leads admin** | Filtres avancés + assignation | `admin.leads.*` |
| **Territoires** | CRUD territoires | `admin.territories.*` (6 procédures) |
| **Candidats** | CRUD candidats | `admin.candidates.*` (4 procédures) |
| **Newsletter** | POST send/schedule, GET list | `admin.newsletter.*` (6 procédures) |
| **SAV client (B2C)** | GET/PUT customerSav | `customerSav.list`, `updateStatus`, `stats` |
| **Paramètres** | GET/PUT settings | `settings.*` (5 procédures) |
| **Logs webhook** | GET logs | `admin.webhookLogs.*` |
| **Logs fournisseur** | GET logs | `supplierApiLogs.*` |
| **Zones livraison** | CRUD zones | `shippingZones.list` |
| **Règles garantie** | CRUD rules | `warrantyRules.*` |
| **Pièces/Modèles admin** | CRUD complet | `spareParts.*`, `spaModels.*` |
| **Prévisions stock** | GET forecast | `admin.forecast.getAll` |
| **Analytics marketing** | GET rapports | `metaAds`, `googleAds`, `googleAnalytics`, `shopify` (rapports uniquement) |

### 2.3 Données Incomplètes dans les Endpoints Existants

| Endpoint Existant | Données Manquantes |
|-------------------|--------------------|
| `admin/stats` | CA mensuel par mois, stats SAV détaillées, stats leads par statut, taux de conversion, stats par partenaire |
| `admin/partners` | totalRevenue, lastOrderDate, partnerContacts |
| `admin/orders` | itemsCount, paymentStatus complet, shippingInfo |
| `v1/dashboard` | stats leads, stats SAV, favoris récents, panier en cours, onboarding status |
| `v1/orders` (liste) | itemsCount, paymentMethod |

---

## 3. Plan d'Implémentation

### 3.1 Structure du Fichier

Le fichier `mobile-api.ts` actuel (1771 lignes) sera restructuré en sections clairement délimitées :

```
1. Auth middleware (existant)
2. USER ENDPOINTS (/api/mobile/v1/*)
   2a. Dashboard (enrichi)
   2b. Profile & Partner
   2c. Products & Search & Favorites
   2d. Cart
   2e. Orders (enrichi) + Returns
   2f. Notifications & Preferences
   2g. Resources & Technical Resources & Favorites
   2h. SAV (enrichi) + Spare Parts + Spa Models
   2i. Leads (enrichi)
   2j. Events
   2k. Network
   2l. Forum
   2m. Team
   2n. Shipping Zones
   2o. Onboarding
3. ADMIN ENDPOINTS (/api/mobile/admin/*)
   3a. Stats (enrichi)
   3b. Users
   3c. Partners (enrichi)
   3d. Products (CRUD)
   3e. Orders (enrichi + actions)
   3f. Events (CRUD)
   3g. Resources (CRUD)
   3h. Leads (enrichi)
   3i. SAV Admin + Customer SAV
   3j. Territories & Candidates
   3k. Newsletter
   3l. Settings
   3m. Logs (webhook + supplier)
   3n. Shipping Zones
   3o. Warranty Rules
   3p. Spare Parts & Spa Models (CRUD)
   3q. Forecast
   3r. Analytics (Meta, Google, Shopify reports)
4. Health check (existant)
```

### 3.2 Conventions REST

Tous les nouveaux endpoints suivront les conventions déjà établies :

- **Authentification** : Bearer token JWT via middleware `requireMobileAuth`
- **Admin** : middleware `requireAdminRole` pour `/api/mobile/admin/*`
- **Pagination** : `{ page, limit, total, totalPages, hasMore }`
- **Erreurs** : `{ error: "CODE", message: "description" }`
- **Filtres** : query params (`?status=...&search=...&page=1&limit=20`)
- **Réponses** : JSON structuré avec les mêmes noms de champs que le tRPC web

### 3.3 Estimation

L'implémentation ajoutera environ **80-90 nouveaux endpoints**, portant le total à environ **110-120 routes**. Le fichier sera scindé en modules si nécessaire pour la maintenabilité.

---

## 4. Impact Guard

### 4.1 Fichiers Impactés

| Fichier | Impact |
|---------|--------|
| `server/routes/mobile-api.ts` | Modification majeure (ajout endpoints) |
| `server/routes/mobile-auth.ts` | Aucun changement |
| `server/index.ts` ou `server/app.ts` | Vérifier que le router est bien monté |
| `server/db.ts` | Réutilisation des helpers existants |
| `server/routers.ts` | Lecture seule (référence pour la logique) |
| `drizzle/schema.ts` | Lecture seule (aucun changement de schéma) |

### 4.2 Risques et Mitigations

| Risque | Mitigation |
|--------|------------|
| Taille du fichier (>3000 lignes) | Scinder en modules si nécessaire |
| Duplication de logique avec tRPC | Réutiliser les helpers de `server/db.ts` |
| Sécurité (accès non autorisé) | Middleware auth + vérification partnerId systématique |
| Performance (requêtes N+1) | Utiliser Promise.all comme dans les endpoints existants |
| Compatibilité app mobile existante | Aucun endpoint existant ne sera modifié, uniquement des ajouts |
