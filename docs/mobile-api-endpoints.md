# Market Spas B2B — API Mobile : Documentation Complète des Endpoints

**Version :** 1.0  
**Base URL :** `https://marketspas.pro`  
**Total endpoints :** 136  
**Dernière mise à jour :** 10 avril 2026

---

## Table des matières

1. [Authentification](#1-authentification-6-endpoints)
2. [Dashboard & Général](#2-dashboard--général-3-endpoints)
3. [Produits & Catalogue](#3-produits--catalogue-4-endpoints)
4. [Panier](#4-panier-6-endpoints)
5. [Favoris](#5-favoris-3-endpoints)
6. [Commandes](#6-commandes-7-endpoints)
7. [Notifications](#7-notifications-4-endpoints)
8. [Ressources & Médias](#8-ressources--médias-5-endpoints)
9. [SAV (Service Après-Vente)](#9-sav-service-après-vente-7-endpoints)
10. [Pièces Détachées & Modèles Spa](#10-pièces-détachées--modèles-spa-4-endpoints)
11. [Ressources Techniques](#11-ressources-techniques-2-endpoints)
12. [Forum](#12-forum-4-endpoints)
13. [Équipe](#13-équipe-2-endpoints)
14. [Leads](#14-leads-4-endpoints)
15. [Réseau Partenaires](#15-réseau-partenaires-1-endpoint)
16. [Profil & Préférences](#16-profil--préférences-6-endpoints)
17. [Onboarding](#17-onboarding-2-endpoints)
18. [Routes Sauvegardées](#18-routes-sauvegardées-5-endpoints)
19. [Dossiers Médias](#19-dossiers-médias-1-endpoint)
20. [Zones de Livraison](#20-zones-de-livraison-1-endpoint)
21. [Admin — Statistiques & Analytics](#21-admin--statistiques--analytics-4-endpoints)
22. [Admin — Utilisateurs](#22-admin--utilisateurs-2-endpoints)
23. [Admin — Partenaires](#23-admin--partenaires-4-endpoints)
24. [Admin — Produits](#24-admin--produits-5-endpoints)
25. [Admin — Commandes](#25-admin--commandes-5-endpoints)
26. [Admin — Paiements](#26-admin--paiements-1-endpoint)
27. [Admin — Événements](#27-admin--événements-4-endpoints)
28. [Admin — Ressources](#28-admin--ressources-1-endpoint)
29. [Admin — SAV](#29-admin--sav-9-endpoints)
30. [Admin — SAV Client](#30-admin--sav-client-2-endpoints)
31. [Admin — Territoires](#31-admin--territoires-1-endpoint)
32. [Admin — Candidats Partenaires](#32-admin--candidats-partenaires-2-endpoints)
33. [Admin — Leads](#33-admin--leads-2-endpoints)
34. [Admin — Newsletter](#34-admin--newsletter-1-endpoint)
35. [Admin — Paramètres](#35-admin--paramètres-4-endpoints)
36. [Admin — Logs](#36-admin--logs-2-endpoints)
37. [Admin — Zones de Livraison](#37-admin--zones-de-livraison-1-endpoint)
38. [Admin — Garantie](#38-admin--garantie-4-endpoints)
39. [Admin — Pièces Détachées](#39-admin--pièces-détachées-3-endpoints)
40. [Admin — Modèles Spa](#40-admin--modèles-spa-5-endpoints)
41. [Admin — Prévisions](#41-admin--prévisions-1-endpoint)
42. [Santé](#42-santé-1-endpoint)

---

## Authentification

Tous les endpoints (sauf Auth et Health) nécessitent un header `Authorization: Bearer <access_token>`.  
Les endpoints **Admin** (`/api/mobile/admin/*`) nécessitent en plus le rôle administrateur.

---

## 1. Authentification (6 endpoints)

**Fichier source :** `server/routes/mobile-auth.ts`

### POST `/api/mobile/auth/login`

Connexion d'un utilisateur. Retourne un access token et un refresh token.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `email` | string | oui | Adresse email |
| `password` | string | oui | Mot de passe |
| `deviceId` | string | non | Identifiant unique de l'appareil |
| `deviceName` | string | non | Nom de l'appareil |
| `platform` | string | non | Plateforme (ios, android) |

**Réponse :** `{ token, refreshToken, expiresIn, user: { id, name, email, role, partnerId, partnerName } }`

---

### POST `/api/mobile/auth/refresh`

Rafraîchir un access token expiré.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `refreshToken` | string | oui | Refresh token obtenu lors du login |

**Réponse :** `{ token, refreshToken, expiresIn }`

---

### POST `/api/mobile/auth/logout`

Déconnexion. Invalide le refresh token.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `refreshToken` | string | oui | Refresh token à invalider |

**Réponse :** `{ success: true }`

---

### GET `/api/mobile/auth/me`

Récupérer les informations de l'utilisateur connecté. **Auth requise.**

**Réponse :** `{ user: { id, name, email, role, partnerId, partnerName, avatarUrl, ... } }`

---

### POST `/api/mobile/push/register`

Enregistrer un token de notification push. **Auth requise.**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `pushToken` | string | oui | Token FCM/APNs |
| `platform` | string | oui | ios ou android |
| `deviceId` | string | non | Identifiant de l'appareil |
| `deviceName` | string | non | Nom de l'appareil |

**Réponse :** `{ success: true }`

---

### POST `/api/mobile/push/unregister`

Supprimer un token de notification push. **Auth requise.**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `pushToken` | string | oui | Token à supprimer |

**Réponse :** `{ success: true }`

---

## 2. Dashboard & Général (3 endpoints)

**Fichier source :** `server/routes/mobile-api.ts`

### GET `/api/mobile/v1/dashboard`

Récupérer les données du tableau de bord utilisateur. **Auth requise.**

**Réponse :** `{ partner, recentOrders, stats: { totalOrders, pendingOrders, totalSpent, savTickets }, upcomingEvents, notifications }`

---

### GET `/api/mobile/v1/events`

Liste des événements à venir. **Auth requise.**

| Query Param | Type | Défaut | Description |
|-------------|------|--------|-------------|
| `page` | number | 1 | Page courante |
| `limit` | number | 20 | Résultats par page (max 50) |

**Réponse :** `{ events: [...], total, page, totalPages }`

---

### GET `/api/mobile/v1/network`

Réseau de partenaires (carte). **Auth requise.**

| Query Param | Type | Défaut | Description |
|-------------|------|--------|-------------|
| `country` | string | — | Filtrer par pays |
| `status` | string | — | Filtrer par statut |

**Réponse :** `{ partners: [{ id, companyName, city, country, lat, lng, status }] }`

---

## 3. Produits & Catalogue (4 endpoints)

**Fichier source :** `server/routes/mobile-api.ts` + `mobile-api-user.ts`

### GET `/api/mobile/v1/products`

Liste paginée des produits. **Auth requise.**

| Query Param | Type | Défaut | Description |
|-------------|------|--------|-------------|
| `page` | number | 1 | Page courante |
| `limit` | number | 20 | Résultats par page (max 50) |
| `search` | string | "" | Recherche textuelle |
| `category` | string | "" | Filtrer par catégorie (SPAS, SWIM_SPAS, MAINTENANCE, COVERS, ACCESSORIES, OTHER) |

**Réponse :** `{ products: [...], total, page, totalPages }`

---

### GET `/api/mobile/v1/products/:id`

Détail d'un produit avec ses variantes. **Auth requise.**

| Param | Type | Description |
|-------|------|-------------|
| `id` | number | ID du produit |

**Réponse :** `{ product: { id, name, sku, description, category, pricePublicHT, pricePartnerHT, vatRate, variants: [...], ... } }`

---

### GET `/api/mobile/v1/products/search`

Recherche avancée de produits. **Auth requise.**

| Query Param | Type | Description |
|-------------|------|-------------|
| `q` | string | Terme de recherche |
| `category` | string | Filtrer par catégorie |
| `minPrice` | number | Prix minimum |
| `maxPrice` | number | Prix maximum |
| `inStock` | boolean | Uniquement en stock |

**Réponse :** `{ products: [...], total }`

---

### GET `/api/mobile/v1/spa-models`

Liste des modèles de spa. **Auth requise.**

**Réponse :** `{ models: [{ id, name, brand, category, seats, dimensions, weight, imageUrl }] }`

---

### GET `/api/mobile/v1/spa-models/:id`

Détail d'un modèle de spa avec ses pièces détachées associées. **Auth requise.**

**Réponse :** `{ model: { ..., spareParts: [...] } }`

---

## 4. Panier (6 endpoints)

**Fichier source :** `server/routes/mobile-api-user.ts`

### GET `/api/mobile/v1/cart`

Récupérer le panier de l'utilisateur. **Auth requise.**

**Réponse :** `{ items: [{ productId, variantId, quantity, isPreorder, product: {...}, variant: {...} }], total }`

---

### POST `/api/mobile/v1/cart`

Ajouter un article au panier. **Auth requise.**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `productId` | number | oui | ID du produit |
| `quantity` | number | oui | Quantité |
| `isPreorder` | boolean | non | Précommande |
| `variantId` | number | non | ID de la variante |

**Réponse :** `{ success: true, item: {...} }`

---

### PUT `/api/mobile/v1/cart/:productId`

Modifier la quantité d'un article. **Auth requise.**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `quantity` | number | oui | Nouvelle quantité |
| `variantId` | number | non | ID de la variante |

**Réponse :** `{ success: true }`

---

### DELETE `/api/mobile/v1/cart/:productId`

Supprimer un article du panier. **Auth requise.**

**Réponse :** `{ success: true }`

---

### DELETE `/api/mobile/v1/cart`

Vider le panier. **Auth requise.**

**Réponse :** `{ success: true }`

---

### GET `/api/mobile/v1/cart/available/:productId`

Vérifier la disponibilité d'un produit. **Auth requise.**

**Réponse :** `{ available: boolean, stockQuantity: number, inTransit: number }`

---

## 5. Favoris (3 endpoints)

**Fichier source :** `server/routes/mobile-api-user.ts`

### GET `/api/mobile/v1/favorites`

Liste des produits favoris. **Auth requise.**

**Réponse :** `{ favorites: [{ productId, product: {...} }] }`

---

### POST `/api/mobile/v1/favorites/:productId`

Ajouter un produit aux favoris. **Auth requise.**

**Réponse :** `{ success: true }`

---

### DELETE `/api/mobile/v1/favorites/:productId`

Retirer un produit des favoris. **Auth requise.**

**Réponse :** `{ success: true }`

---

### GET `/api/mobile/v1/favorites/:productId/check`

Vérifier si un produit est en favori. **Auth requise.**

**Réponse :** `{ isFavorite: boolean }`

---

## 6. Commandes (7 endpoints)

**Fichier source :** `server/routes/mobile-api.ts` + `mobile-api-user.ts`

### GET `/api/mobile/v1/orders`

Liste paginée des commandes. **Auth requise.**

| Query Param | Type | Défaut | Description |
|-------------|------|--------|-------------|
| `page` | number | 1 | Page courante |
| `limit` | number | 20 | Max 50 |
| `status` | string | — | Filtrer par statut |

**Réponse :** `{ orders: [...], total, page, totalPages }`

---

### GET `/api/mobile/v1/orders/:id`

Détail d'une commande. **Auth requise.**

**Réponse :** `{ order: { id, orderNumber, status, items, totalHT, totalTTC, depositAmount, depositPaid, deliveryAddress, tracking, ... } }`

---

### POST `/api/mobile/v1/orders`

Créer une nouvelle commande. **Auth requise.**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `items` | array | oui | `[{ productId, variantId?, quantity }]` |
| `deliveryAddress` | object | oui | `{ street, city, postalCode, country }` |
| `paymentMethod` | string | non | Méthode de paiement |
| `shippingType` | string | non | Type de livraison |
| `customerNotes` | string | non | Notes du client |

**Réponse :** `{ order: {...}, paymentUrl?: string }`

---

### POST `/api/mobile/v1/orders/:id/cancel`

Annuler une commande. **Auth requise.**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `reason` | string | non | Raison de l'annulation |

**Réponse :** `{ success: true }`

---

### GET `/api/mobile/v1/orders/export`

Exporter les commandes (CSV). **Auth requise.**

| Query Param | Type | Description |
|-------------|------|-------------|
| `startDate` | string | Date de début (ISO) |
| `endDate` | string | Date de fin (ISO) |
| `status` | string | Filtrer par statut |

**Réponse :** Fichier CSV

---

### GET `/api/mobile/v1/orders/:id/tracking`

Suivi de livraison d'une commande. **Auth requise.**

**Réponse :** `{ tracking: { trackingNumber, carrier, url, estimatedDelivery, events: [...] } }`

---

### PUT `/api/mobile/v1/orders/:id/tracking`

Mettre à jour le suivi de livraison. **Auth requise.**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `trackingNumber` | string | non | Numéro de suivi |
| `trackingCarrier` | string | non | Transporteur |
| `trackingUrl` | string | non | URL de suivi |
| `estimatedDeliveryDate` | string | non | Date estimée (ISO) |
| `note` | string | non | Note |

**Réponse :** `{ success: true }`

---

## 7. Notifications (4 endpoints)

**Fichier source :** `server/routes/mobile-api.ts` + `mobile-api-user.ts`

### GET `/api/mobile/v1/notifications`

Liste paginée des notifications. **Auth requise.**

| Query Param | Type | Défaut | Description |
|-------------|------|--------|-------------|
| `page` | number | 1 | Page courante |
| `limit` | number | 30 | Max 50 |

**Réponse :** `{ notifications: [...], total, page, totalPages, unreadCount }`

---

### POST `/api/mobile/v1/notifications/mark-read`

Marquer des notifications comme lues. **Auth requise.**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `ids` | number[] | oui | IDs des notifications à marquer |

**Réponse :** `{ success: true }`

---

### GET `/api/mobile/v1/notification-preferences`

Récupérer les préférences de notification. **Auth requise.**

**Réponse :** `{ preferences: { email, push, orderUpdates, savUpdates, newsletter, ... } }`

---

### PUT `/api/mobile/v1/notification-preferences`

Mettre à jour les préférences de notification. **Auth requise.**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `email` | boolean | Notifications par email |
| `push` | boolean | Notifications push |
| `orderUpdates` | boolean | Mises à jour commandes |
| `savUpdates` | boolean | Mises à jour SAV |
| `newsletter` | boolean | Newsletter |

**Réponse :** `{ success: true }`

---

## 8. Ressources & Médias (5 endpoints)

**Fichier source :** `server/routes/mobile-api.ts` + `mobile-api-user.ts`

### GET `/api/mobile/v1/resources`

Liste des ressources médias (PLV, catalogues, supports marketing). **Auth requise.**

| Query Param | Type | Défaut | Description |
|-------------|------|--------|-------------|
| `folderId` | number | null | Filtrer par dossier |
| `page` | number | 1 | Page courante |
| `limit` | number | 30 | Max 50 |

**Réponse :** `{ resources: [...], folders: [...], total, page, totalPages }`

---

### POST `/api/mobile/v1/resources/:id/favorite`

Ajouter/retirer une ressource des favoris. **Auth requise.**

**Réponse :** `{ success: true, isFavorite: boolean }`

---

### GET `/api/mobile/v1/resources/favorites`

Liste des ressources favorites. **Auth requise.**

**Réponse :** `{ resources: [...] }`

---

### GET `/api/mobile/v1/media-folders`

Liste des dossiers médias. **Auth requise.**

**Réponse :** `{ folders: [{ id, name, parentId, resourceCount }] }`

---

### GET `/api/mobile/v1/technical-resources`

Liste des ressources techniques (guides de réparation, vidéos tutoriels). **Auth requise.**

**Réponse :** `{ resources: [...] }`

---

### GET `/api/mobile/v1/technical-resources/:id`

Détail d'une ressource technique. **Auth requise.**

**Réponse :** `{ resource: { id, title, type, url, description, ... } }`

---

## 9. SAV — Service Après-Vente (7 endpoints)

**Fichier source :** `server/routes/mobile-api.ts` + `mobile-api-user.ts`

### GET `/api/mobile/v1/sav`

Liste paginée des tickets SAV. **Auth requise.**

| Query Param | Type | Défaut | Description |
|-------------|------|--------|-------------|
| `page` | number | 1 | Page courante |
| `limit` | number | 20 | Max 50 |

**Réponse :** `{ tickets: [...], total, page, totalPages }`

---

### GET `/api/mobile/v1/sav/:id`

Détail d'un ticket SAV. **Auth requise.**

**Réponse :** `{ ticket: { id, ticketNumber, status, subject, description, product, notes, spareParts, ... } }`

---

### POST `/api/mobile/v1/sav`

Créer un nouveau ticket SAV. **Auth requise.**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `subject` | string | oui | Objet du ticket |
| `description` | string | oui | Description du problème |
| `productId` | number | non | Produit concerné |
| `serialNumber` | string | non | Numéro de série |
| `purchaseDate` | string | non | Date d'achat (ISO) |
| `priority` | string | non | low, medium, high, urgent |
| `componentType` | string | non | Type de composant |
| `images` | string[] | non | URLs des images |

**Réponse :** `{ ticket: {...} }`

---

### GET `/api/mobile/v1/sav/:id/history`

Historique d'un ticket SAV. **Auth requise.**

**Réponse :** `{ history: [{ date, action, user, details }] }`

---

### GET `/api/mobile/v1/sav/:id/spare-parts`

Pièces détachées associées à un ticket SAV. **Auth requise.**

**Réponse :** `{ spareParts: [...] }`

---

### POST `/api/mobile/v1/sav/:id/note`

Ajouter une note à un ticket SAV. **Auth requise.**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `content` | string | oui | Contenu de la note |

**Réponse :** `{ success: true }`

---

### GET `/api/mobile/v1/sav/components`

Liste des types de composants SAV. **Auth requise.**

**Réponse :** `{ components: [{ type, label, count }] }`

---

## 10. Pièces Détachées & Modèles Spa (4 endpoints)

**Fichier source :** `server/routes/mobile-api-user.ts`

### GET `/api/mobile/v1/spare-parts`

Liste des pièces détachées. **Auth requise.**

| Query Param | Type | Description |
|-------------|------|-------------|
| `category` | string | Filtrer par catégorie |
| `search` | string | Recherche textuelle |

**Réponse :** `{ spareParts: [...] }`

---

### GET `/api/mobile/v1/spare-parts/:id`

Détail d'une pièce détachée. **Auth requise.**

**Réponse :** `{ sparePart: { id, name, reference, category, price, compatibility, imageUrl, ... } }`

---

### GET `/api/mobile/v1/spa-models`

Liste des modèles de spa. **Auth requise.**

**Réponse :** `{ models: [...] }`

---

### GET `/api/mobile/v1/spa-models/:id`

Détail d'un modèle avec pièces associées. **Auth requise.**

**Réponse :** `{ model: { ..., spareParts: [...] } }`

---

## 11. Ressources Techniques (2 endpoints)

**Fichier source :** `server/routes/mobile-api-user.ts`

### GET `/api/mobile/v1/technical-resources`

Liste des ressources techniques. **Auth requise.**

**Réponse :** `{ resources: [...] }`

---

### GET `/api/mobile/v1/technical-resources/:id`

Détail d'une ressource technique. **Auth requise.**

**Réponse :** `{ resource: {...} }`

---

## 12. Forum (4 endpoints)

**Fichier source :** `server/routes/mobile-api-user.ts`

### GET `/api/mobile/v1/forum/topics`

Liste des sujets du forum. **Auth requise.**

| Query Param | Type | Description |
|-------------|------|-------------|
| `page` | number | Page courante |
| `limit` | number | Max 50 |
| `category` | string | Filtrer par catégorie |

**Réponse :** `{ topics: [...], total, page, totalPages }`

---

### GET `/api/mobile/v1/forum/topics/:id`

Détail d'un sujet avec ses réponses. **Auth requise.**

**Réponse :** `{ topic: { ..., replies: [...] } }`

---

### POST `/api/mobile/v1/forum/topics`

Créer un nouveau sujet. **Auth requise.**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `title` | string | oui | Titre du sujet |
| `content` | string | oui | Contenu |

**Réponse :** `{ topic: {...} }`

---

### POST `/api/mobile/v1/forum/topics/:id/reply`

Répondre à un sujet. **Auth requise.**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `content` | string | oui | Contenu de la réponse |

**Réponse :** `{ reply: {...} }`

---

## 13. Équipe (2 endpoints)

**Fichier source :** `server/routes/mobile-api-user.ts`

### GET `/api/mobile/v1/team`

Liste des membres de l'équipe du partenaire. **Auth requise.**

**Réponse :** `{ members: [{ id, name, email, role, isActive }] }`

---

### GET `/api/mobile/v1/team/permissions`

Permissions de l'utilisateur dans l'équipe. **Auth requise.**

**Réponse :** `{ permissions: { canOrder, canManageSAV, canViewReports, ... } }`

---

## 14. Leads (4 endpoints)

**Fichier source :** `server/routes/mobile-api.ts` + `mobile-api-user.ts`

### GET `/api/mobile/v1/leads`

Liste paginée des leads. **Auth requise.**

| Query Param | Type | Description |
|-------------|------|-------------|
| `page` | number | Page courante |
| `limit` | number | Max 50 |
| `status` | string | Filtrer par statut |

**Réponse :** `{ leads: [...], total, page, totalPages }`

---

### GET `/api/mobile/v1/leads/:id`

Détail d'un lead. **Auth requise.**

**Réponse :** `{ lead: { id, name, email, phone, status, source, notes, ... } }`

---

### PATCH `/api/mobile/v1/leads/:id`

Mettre à jour un lead. **Auth requise.**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `status` | string | Nouveau statut |
| `notes` | string | Notes |
| `phone` | string | Téléphone |

**Réponse :** `{ success: true }`

---

### GET `/api/mobile/v1/leads/stats`

Statistiques des leads. **Auth requise.**

**Réponse :** `{ stats: { total, new, contacted, qualified, converted, conversionRate } }`

---

## 15. Réseau Partenaires (1 endpoint)

### GET `/api/mobile/v1/network`

Voir section 2.

---

## 16. Profil & Préférences (6 endpoints)

**Fichier source :** `server/routes/mobile-api.ts` + `mobile-api-user.ts`

### GET `/api/mobile/v1/profile`

Récupérer le profil utilisateur. **Auth requise.**

**Réponse :** `{ user: { id, name, email, phone, avatarUrl, role } }`

---

### PUT `/api/mobile/v1/profile`

Mettre à jour le profil utilisateur. **Auth requise.**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `name` | string | Nom |
| `phone` | string | Téléphone |
| `avatarUrl` | string | URL de l'avatar |

**Réponse :** `{ success: true }`

---

### GET `/api/mobile/v1/partner/profile`

Récupérer le profil du partenaire (entreprise). **Auth requise.**

**Réponse :** `{ partner: { id, companyName, tradeName, address, contacts, supplierClientCode, ... } }`

---

### PUT `/api/mobile/v1/partner/profile`

Mettre à jour le profil du partenaire. **Auth requise.**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `companyName` | string | Raison sociale |
| `tradeName` | string | Nom commercial |
| `website` | string | Site web |
| `primaryContactName` | string | Nom du contact principal |
| `primaryContactEmail` | string | Email du contact principal |
| `primaryContactPhone` | string | Téléphone du contact principal |
| `addressStreet` | string | Adresse |
| `addressCity` | string | Ville |
| `addressPostalCode` | string | Code postal |
| `addressCountry` | string | Pays |

**Réponse :** `{ success: true }`

---

### GET `/api/mobile/v1/notification-preferences`

Voir section 7.

---

### PUT `/api/mobile/v1/notification-preferences`

Voir section 7.

---

## 17. Onboarding (2 endpoints)

**Fichier source :** `server/routes/mobile-api-user.ts`

### GET `/api/mobile/v1/onboarding`

Récupérer l'état d'onboarding. **Auth requise.**

**Réponse :** `{ completed: boolean, steps: [...] }`

---

### POST `/api/mobile/v1/onboarding/complete`

Marquer l'onboarding comme terminé. **Auth requise.**

**Réponse :** `{ success: true }`

---

## 18. Routes Sauvegardées (5 endpoints)

**Fichier source :** `server/routes/mobile-api-user.ts`

### GET `/api/mobile/v1/saved-routes`

Liste des routes sauvegardées. **Auth requise.**

**Réponse :** `{ routes: [...] }`

---

### GET `/api/mobile/v1/saved-routes/:id`

Détail d'une route. **Auth requise.**

**Réponse :** `{ route: { id, name, points, totalDistance, totalDuration, notes } }`

---

### POST `/api/mobile/v1/saved-routes`

Créer une route. **Auth requise.**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `name` | string | oui | Nom de la route |
| `type` | string | non | Type de route |
| `points` | array | oui | Points GPS |
| `totalDistance` | number | non | Distance totale |
| `totalDuration` | number | non | Durée totale |
| `notes` | string | non | Notes |

**Réponse :** `{ route: {...} }`

---

### PUT `/api/mobile/v1/saved-routes/:id`

Modifier une route. **Auth requise.**

**Réponse :** `{ success: true }`

---

### DELETE `/api/mobile/v1/saved-routes/:id`

Supprimer une route. **Auth requise.**

**Réponse :** `{ success: true }`

---

## 19. Dossiers Médias (1 endpoint)

### GET `/api/mobile/v1/media-folders`

Voir section 8.

---

## 20. Zones de Livraison (1 endpoint)

**Fichier source :** `server/routes/mobile-api-user.ts`

### GET `/api/mobile/v1/shipping-zones/lookup`

Rechercher une zone de livraison par code postal. **Auth requise.**

| Query Param | Type | Description |
|-------------|------|-------------|
| `postalCode` | string | Code postal |
| `country` | string | Pays |

**Réponse :** `{ zone: { id, name, deliveryDays, shippingCost } }`

---

## 21. Admin — Statistiques & Analytics (4 endpoints)

**Fichier source :** `server/routes/mobile-api.ts` + `mobile-api-admin.ts`

### GET `/api/mobile/admin/stats`

Statistiques globales du dashboard admin. **Admin requis.**

**Réponse :** `{ totalPartners, totalOrders, totalRevenue, pendingOrders, activeSAV, ... }`

---

### GET `/api/mobile/admin/stats/detailed`

Statistiques détaillées avec graphiques. **Admin requis.**

| Query Param | Type | Description |
|-------------|------|-------------|
| `period` | string | day, week, month, year |
| `startDate` | string | Date de début (ISO) |
| `endDate` | string | Date de fin (ISO) |

**Réponse :** `{ revenue: { total, byPeriod: [...] }, orders: { total, byStatus: {...} }, partners: { total, active, new }, topProducts: [...] }`

---

### GET `/api/mobile/admin/forecast`

Prévisions de ventes. **Admin requis.**

| Query Param | Type | Description |
|-------------|------|-------------|
| `months` | number | Nombre de mois de prévision |

**Réponse :** `{ forecast: [{ month, predictedRevenue, predictedOrders }] }`

---

### GET `/api/mobile/admin/leads/stats`

Statistiques des leads (admin). **Admin requis.**

**Réponse :** `{ stats: { total, bySource, byStatus, conversionRate, averageTime } }`

---

## 22. Admin — Utilisateurs (2 endpoints)

**Fichier source :** `server/routes/mobile-api-admin.ts`

### GET `/api/mobile/admin/users`

Liste de tous les utilisateurs. **Admin requis.**

**Réponse :** `{ users: [{ id, name, email, role, isActive, partnerId, lastLogin }] }`

---

### PUT `/api/mobile/admin/users/:id/toggle-active`

Activer/désactiver un utilisateur. **Admin requis.**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `isActive` | boolean | oui | Nouvel état |

**Réponse :** `{ success: true }`

---

## 23. Admin — Partenaires (4 endpoints)

**Fichier source :** `server/routes/mobile-api.ts` + `mobile-api-admin.ts`

### GET `/api/mobile/admin/partners`

Liste paginée des partenaires. **Admin requis.**

| Query Param | Type | Description |
|-------------|------|-------------|
| `page` | number | Page courante |
| `limit` | number | Max 50 |
| `search` | string | Recherche |
| `status` | string | Filtrer par statut |

**Réponse :** `{ partners: [...], total, page, totalPages }`

---

### GET `/api/mobile/admin/partners/:id`

Détail d'un partenaire. **Admin requis.**

**Réponse :** `{ partner: { id, companyName, tradeName, contacts, orders, stats, supplierClientCode, ... } }`

---

### POST `/api/mobile/admin/partners`

Créer un partenaire. **Admin requis.**

**Body :** Objet partenaire complet (companyName, tradeName, address, contacts, etc.)

**Réponse :** `{ partner: {...} }`

---

### PUT `/api/mobile/admin/partners/:id`

Modifier un partenaire. **Admin requis.**

**Body :** Champs à modifier

**Réponse :** `{ success: true }`

---

## 24. Admin — Produits (5 endpoints)

**Fichier source :** `server/routes/mobile-api-admin.ts`

### GET `/api/mobile/admin/products`

Liste des produits (admin). **Admin requis.**

**Réponse :** `{ products: [...] }`

---

### POST `/api/mobile/admin/products`

Créer un produit. **Admin requis.**

**Body :** Objet produit complet (name, sku, category, pricePublicHT, pricePartnerHT, etc.)

**Réponse :** `{ product: {...} }`

---

### PUT `/api/mobile/admin/products/:id`

Modifier un produit. **Admin requis.**

**Body :** Champs à modifier

**Réponse :** `{ success: true }`

---

### DELETE `/api/mobile/admin/products/:id`

Supprimer un produit. **Admin requis.**

**Réponse :** `{ success: true }`

---

### GET `/api/mobile/admin/products/:id/variants`

Liste des variantes d'un produit. **Admin requis.**

**Réponse :** `{ variants: [{ id, name, colorName, colorHex, supplierCode, ean13, imageUrl, stockQuantity }] }`

---

## 25. Admin — Commandes (5 endpoints)

**Fichier source :** `server/routes/mobile-api.ts` + `mobile-api-admin.ts`

### GET `/api/mobile/admin/orders`

Liste paginée des commandes (admin). **Admin requis.**

| Query Param | Type | Description |
|-------------|------|-------------|
| `page` | number | Page courante |
| `limit` | number | Max 50 |
| `status` | string | Filtrer par statut |
| `partnerId` | number | Filtrer par partenaire |

**Réponse :** `{ orders: [...], total, page, totalPages }`

---

### GET `/api/mobile/admin/orders/:id`

Détail d'une commande (admin). **Admin requis.**

**Réponse :** `{ order: { ..., partner: {...}, payments: [...] } }`

---

### GET `/api/mobile/admin/orders/today`

Commandes du jour. **Admin requis.**

**Réponse :** `{ orders: [...], total }`

---

### PUT `/api/mobile/admin/orders/:id/status`

Changer le statut d'une commande. **Admin requis.**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `status` | string | oui | Nouveau statut |
| `note` | string | non | Note interne |

**Réponse :** `{ success: true }`

---

### POST `/api/mobile/admin/orders/:id/validate`

Valider une commande. **Admin requis.**

**Réponse :** `{ success: true }`

---

## 26. Admin — Paiements (1 endpoint)

**Fichier source :** `server/routes/mobile-api-admin.ts`

### GET `/api/mobile/admin/payments`

Liste des paiements. **Admin requis.**

| Query Param | Type | Description |
|-------------|------|-------------|
| `page` | number | Page courante |
| `limit` | number | Max 50 |
| `status` | string | Filtrer par statut |

**Réponse :** `{ payments: [...], total, page, totalPages }`

---

## 27. Admin — Événements (4 endpoints)

**Fichier source :** `server/routes/mobile-api-admin.ts`

### GET `/api/mobile/admin/events`

Liste des événements. **Admin requis.**

**Réponse :** `{ events: [...] }`

---

### POST `/api/mobile/admin/events`

Créer un événement. **Admin requis.**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `title` | string | oui | Titre |
| `description` | string | non | Description |
| `type` | string | non | Type d'événement |
| `startDate` | string | oui | Date de début (ISO) |
| `endDate` | string | non | Date de fin (ISO) |
| `location` | string | non | Lieu |
| `imageUrl` | string | non | Image |
| `isPublished` | boolean | non | Publié |

**Réponse :** `{ event: {...} }`

---

### PUT `/api/mobile/admin/events/:id`

Modifier un événement. **Admin requis.**

**Réponse :** `{ success: true }`

---

### DELETE `/api/mobile/admin/events/:id`

Supprimer un événement. **Admin requis.**

**Réponse :** `{ success: true }`

---

## 28. Admin — Ressources (1 endpoint)

**Fichier source :** `server/routes/mobile-api-admin.ts`

### DELETE `/api/mobile/admin/resources/:id`

Supprimer une ressource. **Admin requis.**

**Réponse :** `{ success: true }`

---

## 29. Admin — SAV (9 endpoints)

**Fichier source :** `server/routes/mobile-api-admin.ts`

### GET `/api/mobile/admin/sav`

Liste des tickets SAV (admin). **Admin requis.**

| Query Param | Type | Description |
|-------------|------|-------------|
| `page` | number | Page courante |
| `limit` | number | Max 50 |
| `status` | string | Filtrer par statut |
| `priority` | string | Filtrer par priorité |

**Réponse :** `{ tickets: [...], total, page, totalPages }`

---

### GET `/api/mobile/admin/sav/stats`

Statistiques SAV. **Admin requis.**

**Réponse :** `{ stats: { total, open, inProgress, resolved, averageResolutionTime } }`

---

### PUT `/api/mobile/admin/sav/:id/status`

Changer le statut d'un ticket SAV. **Admin requis.**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `status` | string | oui | Nouveau statut |
| `note` | string | non | Note |

**Réponse :** `{ success: true }`

---

### PUT `/api/mobile/admin/sav/:id/warranty`

Mettre à jour la garantie d'un ticket. **Admin requis.**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `warrantyStatus` | string | oui | Statut de garantie |
| `warrantyNotes` | string | non | Notes de garantie |

**Réponse :** `{ success: true }`

---

### POST `/api/mobile/admin/sav/:id/spare-part`

Ajouter une pièce détachée à un ticket SAV. **Admin requis.**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `sparePartId` | number | oui | ID de la pièce |
| `quantity` | number | oui | Quantité |
| `unitPrice` | number | non | Prix unitaire |

**Réponse :** `{ success: true }`

---

### DELETE `/api/mobile/admin/sav/:savId/spare-part/:partId`

Retirer une pièce d'un ticket SAV. **Admin requis.**

**Réponse :** `{ success: true }`

---

### POST `/api/mobile/admin/sav/:id/tracking`

Ajouter un suivi de livraison SAV. **Admin requis.**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `trackingNumber` | string | oui | Numéro de suivi |
| `trackingCarrier` | string | non | Transporteur |
| `trackingUrl` | string | non | URL de suivi |

**Réponse :** `{ success: true }`

---

## 30. Admin — SAV Client (2 endpoints)

**Fichier source :** `server/routes/mobile-api-admin.ts`

### GET `/api/mobile/admin/customer-sav`

Liste des tickets SAV clients (B2C). **Admin requis.**

**Réponse :** `{ tickets: [...] }`

---

### PUT `/api/mobile/admin/customer-sav/:id/status`

Changer le statut d'un ticket SAV client. **Admin requis.**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `status` | string | oui | Nouveau statut |

**Réponse :** `{ success: true }`

---

## 31. Admin — Territoires (1 endpoint)

**Fichier source :** `server/routes/mobile-api-admin.ts`

### GET `/api/mobile/admin/territories`

Liste des territoires/zones géographiques. **Admin requis.**

**Réponse :** `{ territories: [{ id, name, country, postalCodes, partnerId, partnerName }] }`

---

## 32. Admin — Candidats Partenaires (2 endpoints)

**Fichier source :** `server/routes/mobile-api-admin.ts`

### GET `/api/mobile/admin/candidates`

Liste des candidatures partenaires. **Admin requis.**

**Réponse :** `{ candidates: [...] }`

---

### PUT `/api/mobile/admin/candidates/:id`

Mettre à jour une candidature. **Admin requis.**

**Body :** Champs à modifier (status, notes, etc.)

**Réponse :** `{ success: true }`

---

## 33. Admin — Leads (2 endpoints)

**Fichier source :** `server/routes/mobile-api-admin.ts`

### GET `/api/mobile/admin/leads/stats`

Statistiques des leads (admin). **Admin requis.**

**Réponse :** `{ stats: {...} }`

---

### PUT `/api/mobile/admin/leads/:id`

Mettre à jour un lead (admin). **Admin requis.**

**Body :** Champs à modifier

**Réponse :** `{ success: true }`

---

## 34. Admin — Newsletter (1 endpoint)

**Fichier source :** `server/routes/mobile-api-admin.ts`

### GET `/api/mobile/admin/newsletters/scheduled`

Liste des newsletters programmées. **Admin requis.**

**Réponse :** `{ newsletters: [{ id, subject, scheduledAt, recipients, status }] }`

---

## 35. Admin — Paramètres (4 endpoints)

**Fichier source :** `server/routes/mobile-api-admin.ts`

### GET `/api/mobile/admin/settings`

Récupérer les paramètres du portail. **Admin requis.**

**Réponse :** `{ settings: {...} }`

---

### PUT `/api/mobile/admin/settings`

Mettre à jour les paramètres. **Admin requis.**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `settings` | object | Objet de paramètres |

**Réponse :** `{ success: true }`

---

### GET `/api/mobile/admin/settings/integrations`

État des intégrations (Mollie, Meta, Shopify, etc.). **Admin requis.**

**Réponse :** `{ integrations: { mollie: { configured, mode }, meta: { connected, accounts }, shopify: { connected, store } } }`

---

## 36. Admin — Logs (2 endpoints)

**Fichier source :** `server/routes/mobile-api-admin.ts`

### GET `/api/mobile/admin/webhook-logs`

Logs des webhooks Mollie. **Admin requis.**

| Query Param | Type | Description |
|-------------|------|-------------|
| `page` | number | Page courante |
| `limit` | number | Max 50 |

**Réponse :** `{ logs: [...], total, page, totalPages }`

---

### GET `/api/mobile/admin/supplier-logs`

Logs des appels API fournisseur. **Admin requis.**

| Query Param | Type | Description |
|-------------|------|-------------|
| `page` | number | Page courante |
| `limit` | number | Max 50 |

**Réponse :** `{ logs: [...], total, page, totalPages }`

---

## 37. Admin — Zones de Livraison (1 endpoint)

**Fichier source :** `server/routes/mobile-api-admin.ts`

### GET `/api/mobile/admin/shipping-zones`

Liste des zones de livraison. **Admin requis.**

**Réponse :** `{ zones: [...] }`

---

## 38. Admin — Garantie (4 endpoints)

**Fichier source :** `server/routes/mobile-api-admin.ts`

### GET `/api/mobile/admin/warranty-rules`

Liste des règles de garantie. **Admin requis.**

**Réponse :** `{ rules: [...] }`

---

### POST `/api/mobile/admin/warranty-rules`

Créer une règle de garantie. **Admin requis.**

**Body :** Objet règle de garantie

**Réponse :** `{ rule: {...} }`

---

### PUT `/api/mobile/admin/warranty-rules/:id`

Modifier une règle de garantie. **Admin requis.**

**Réponse :** `{ success: true }`

---

### DELETE `/api/mobile/admin/warranty-rules/:id`

Supprimer une règle de garantie. **Admin requis.**

**Réponse :** `{ success: true }`

---

## 39. Admin — Pièces Détachées (3 endpoints)

**Fichier source :** `server/routes/mobile-api-admin.ts`

### POST `/api/mobile/admin/spare-parts`

Créer une pièce détachée. **Admin requis.**

**Body :** Objet pièce détachée

**Réponse :** `{ sparePart: {...} }`

---

### PUT `/api/mobile/admin/spare-parts/:id`

Modifier une pièce détachée. **Admin requis.**

**Réponse :** `{ success: true }`

---

### DELETE `/api/mobile/admin/spare-parts/:id`

Supprimer une pièce détachée. **Admin requis.**

**Réponse :** `{ success: true }`

---

## 40. Admin — Modèles Spa (5 endpoints)

**Fichier source :** `server/routes/mobile-api-admin.ts`

### POST `/api/mobile/admin/spa-models`

Créer un modèle de spa. **Admin requis.**

**Body :** Objet modèle spa

**Réponse :** `{ model: {...} }`

---

### PUT `/api/mobile/admin/spa-models/:id`

Modifier un modèle de spa. **Admin requis.**

**Réponse :** `{ success: true }`

---

### DELETE `/api/mobile/admin/spa-models/:id`

Supprimer un modèle de spa. **Admin requis.**

**Réponse :** `{ success: true }`

---

### POST `/api/mobile/admin/spa-models/:id/parts`

Associer une pièce détachée à un modèle. **Admin requis.**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `sparePartId` | number | oui | ID de la pièce |
| `quantity` | number | non | Quantité par défaut |

**Réponse :** `{ success: true }`

---

### DELETE `/api/mobile/admin/spa-models/:modelId/parts/:partId`

Dissocier une pièce d'un modèle. **Admin requis.**

**Réponse :** `{ success: true }`

---

## 41. Admin — Prévisions (1 endpoint)

### GET `/api/mobile/admin/forecast`

Voir section 21.

---

## 42. Santé (1 endpoint)

**Fichier source :** `server/routes/mobile-api.ts`

### GET `/api/mobile/health`

Vérifier que l'API mobile est opérationnelle. **Aucune auth requise.**

**Réponse :** `{ status: "ok", timestamp: "2026-04-10T...", version: "1.0.0" }`

---

## Résumé par module

| Module | Fichier source | Endpoints |
|--------|---------------|-----------|
| Authentification | `mobile-auth.ts` | 6 |
| API Core (dashboard, produits, commandes, SAV, leads, admin) | `mobile-api.ts` | 27 |
| API User (profil, panier, favoris, forum, équipe, routes) | `mobile-api-user.ts` | 50 |
| API Admin (utilisateurs, produits, commandes, SAV, settings) | `mobile-api-admin.ts` | 53 |
| **Total** | | **136** |

---

## Codes d'erreur HTTP

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Créé avec succès |
| 400 | Requête invalide (paramètres manquants ou incorrects) |
| 401 | Non authentifié (token manquant ou expiré) |
| 403 | Accès refusé (rôle insuffisant) |
| 404 | Ressource non trouvée |
| 409 | Conflit (doublon) |
| 500 | Erreur serveur interne |

---

## Notes d'implémentation

**Pagination :** Tous les endpoints paginés acceptent `page` (défaut: 1) et `limit` (défaut: 20, max: 50). La réponse inclut `total`, `page` et `totalPages`.

**Authentification :** Le token JWT a une durée de vie de 15 minutes. Utilisez `/api/mobile/auth/refresh` pour obtenir un nouveau token. Le refresh token a une durée de vie de 30 jours.

**Gestion des erreurs :** Toutes les erreurs retournent un objet `{ error: string, message: string, details?: any }`.

**Dates :** Toutes les dates sont au format ISO 8601 (ex: `2026-04-10T12:00:00.000Z`).

**Montants :** Tous les montants sont en euros (EUR), exprimés en décimal avec 2 chiffres après la virgule (ex: `"1250.00"`).
