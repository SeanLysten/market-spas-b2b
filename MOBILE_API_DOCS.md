# API Mobile Market Spas B2B

Documentation complète de l'API REST mobile pour l'application React Native / Expo.

## Configuration

| Paramètre | Valeur |
|---|---|
| **Base URL (production)** | `https://marketspas.pro` |
| **Base URL (dev)** | `https://3000-xxx.manus.computer` |
| **Authentification** | Bearer Token (JWT) |
| **Format** | JSON |
| **Encodage** | UTF-8 |

## Authentification

L'API mobile utilise un système JWT avec **access tokens** (15 min) et **refresh tokens** (90 jours) avec rotation automatique.

### POST `/api/mobile/auth/login`

Connexion et obtention des tokens.

**Body :**
```json
{
  "email": "partenaire@example.com",
  "password": "MotDePasse123",
  "platform": "ios",
  "deviceId": "identifiant-unique-appareil"
}
```

| Champ | Type | Requis | Description |
|---|---|---|---|
| `email` | string | oui | Email du compte |
| `password` | string | oui | Mot de passe |
| `platform` | string | non | `ios`, `android`, `web` |
| `deviceId` | string | non | Identifiant unique de l'appareil |

**Réponse 200 :**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "rt_abc123def456...",
  "expiresIn": 900,
  "user": {
    "id": 42,
    "openId": "abc123",
    "name": "Jean Dupont",
    "email": "partenaire@example.com",
    "role": "PARTNER_USER",
    "partnerId": 10,
    "partnerName": "Spa Concept Lyon",
    "avatarUrl": null
  }
}
```

**Erreurs :**

| Code | Error | Description |
|---|---|---|
| 400 | `MISSING_FIELDS` | Email ou mot de passe manquant |
| 401 | `INVALID_CREDENTIALS` | Email ou mot de passe incorrect |
| 403 | `ACCOUNT_INACTIVE` | Compte désactivé |

### POST `/api/mobile/auth/refresh`

Renouveler l'access token avec le refresh token. Le refresh token est automatiquement renouvelé (rotation).

**Body :**
```json
{
  "refreshToken": "rt_abc123def456..."
}
```

**Réponse 200 :**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "rt_newtoken789...",
  "expiresIn": 900
}
```

**Erreurs :**

| Code | Error | Description |
|---|---|---|
| 401 | `INVALID_REFRESH_TOKEN` | Token invalide, expiré ou révoqué |

### GET `/api/mobile/auth/me`

Obtenir les informations de l'utilisateur connecté.

**Headers :** `Authorization: Bearer <accessToken>`

**Réponse 200 :**
```json
{
  "user": {
    "id": 42,
    "openId": "abc123",
    "name": "Jean Dupont",
    "email": "partenaire@example.com",
    "role": "PARTNER_USER",
    "partnerId": 10,
    "partnerName": "Spa Concept Lyon",
    "avatarUrl": null
  }
}
```

### POST `/api/mobile/auth/logout`

Révoquer le refresh token.

**Headers :** `Authorization: Bearer <accessToken>`

**Body :**
```json
{
  "refreshToken": "rt_abc123def456..."
}
```

**Réponse 200 :**
```json
{
  "success": true
}
```

## Endpoints API v1

Tous les endpoints v1 nécessitent le header `Authorization: Bearer <accessToken>`.

### GET `/api/mobile/v1/dashboard`

Données agrégées du tableau de bord (écran d'accueil).

**Réponse 200 :**
```json
{
  "orders": [
    {
      "id": 1,
      "orderNumber": "CMD-2026-0001",
      "status": "SHIPPED",
      "totalHT": "5400.00",
      "createdAt": "2026-03-15T10:30:00.000Z"
    }
  ],
  "unreadNotificationCount": 3,
  "resources": [
    {
      "id": 90019,
      "title": "Catalogue Printemps 2026",
      "fileType": "application/pdf",
      "thumbnailUrl": "https://cdn.../thumb.webp",
      "createdAt": "2026-03-16T15:16:00.000Z"
    }
  ],
  "events": [
    {
      "id": 1,
      "title": "Salon Piscine & Spa",
      "description": "Retrouvez-nous au stand B42",
      "startDate": "2026-04-10T09:00:00.000Z",
      "endDate": "2026-04-12T18:00:00.000Z",
      "imageUrl": "https://cdn.../event.jpg"
    }
  ]
}
```

### GET `/api/mobile/v1/products`

Catalogue produits paginé.

**Query params :**

| Param | Type | Défaut | Description |
|---|---|---|---|
| `page` | number | 1 | Numéro de page |
| `limit` | number | 20 | Éléments par page (max 50) |
| `search` | string | - | Recherche par nom |
| `category` | string | - | Filtre par catégorie (`SPAS`, `SWIM_SPAS`, `MAINTENANCE`, `COVERS`, `ACCESSORIES`, `OTHER`) |

**Réponse 200 :**
```json
{
  "products": [
    {
      "id": 90001,
      "name": "Twin Plug & Play",
      "sku": "SPA-TWIN-PLUG-PLAY",
      "category": "SPAS",
      "pricePublicHT": "2200.00",
      "imageUrl": "https://cdn.../product.png",
      "isFeatured": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasMore": true
  }
}
```

### GET `/api/mobile/v1/products/:id`

Détail d'un produit avec remise partenaire.

**Réponse 200 :**
```json
{
  "product": {
    "id": 90001,
    "name": "Twin Plug & Play",
    "sku": "SPA-TWIN-PLUG-PLAY",
    "category": "SPAS",
    "pricePublicHT": "2200.00",
    "pricePartnerHT": "1650.00",
    "imageUrl": "https://cdn.../product.png",
    "description": "Spa 2 places...",
    "weight": "150.000",
    "length": "180.00",
    "width": "120.00",
    "height": "75.00"
  },
  "discount": {
    "percentage": "25.00"
  }
}
```

### GET `/api/mobile/v1/orders`

Commandes du partenaire paginées.

**Query params :**

| Param | Type | Défaut | Description |
|---|---|---|---|
| `page` | number | 1 | Numéro de page |
| `limit` | number | 20 | Éléments par page (max 50) |
| `status` | string | - | Filtre par statut |

**Statuts possibles :** `PENDING_APPROVAL`, `PENDING_DEPOSIT`, `DEPOSIT_PAID`, `IN_PRODUCTION`, `READY_TO_SHIP`, `SHIPPED`, `DELIVERED`, `COMPLETED`, `CANCELLED`

**Réponse 200 :**
```json
{
  "orders": [
    {
      "id": 1,
      "orderNumber": "CMD-2026-0001",
      "status": "SHIPPED",
      "totalHT": "5400.00",
      "totalTTC": "6534.00",
      "depositAmount": "1620.00",
      "depositPaid": true,
      "createdAt": "2026-03-15T10:30:00.000Z",
      "updatedAt": "2026-03-16T14:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 12, "totalPages": 1, "hasMore": false }
}
```

### GET `/api/mobile/v1/notifications`

Notifications de l'utilisateur paginées.

**Query params :**

| Param | Type | Défaut | Description |
|---|---|---|---|
| `page` | number | 1 | Numéro de page |
| `limit` | number | 30 | Éléments par page (max 50) |

**Réponse 200 :**
```json
{
  "notifications": [
    {
      "id": 1,
      "title": "Commande CMD-2026-0001 expédiée",
      "message": "Votre commande a été expédiée...",
      "type": "ORDER_STATUS_CHANGED",
      "isRead": false,
      "linkUrl": "/orders/1",
      "createdAt": "2026-03-16T14:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 30, "total": 5, "totalPages": 1, "hasMore": false }
}
```

### POST `/api/mobile/v1/notifications/mark-read`

Marquer des notifications comme lues.

**Body :**
```json
{
  "ids": [1, 2, 3]
}
```
Ou pour tout marquer comme lu :
```json
{
  "ids": "all"
}
```

### GET `/api/mobile/v1/resources`

Médiathèque avec navigation par dossiers.

**Query params :**

| Param | Type | Défaut | Description |
|---|---|---|---|
| `folderId` | number | null | ID du dossier (null = racine) |
| `page` | number | 1 | Numéro de page |
| `limit` | number | 30 | Éléments par page (max 50) |

**Réponse 200 :**
```json
{
  "folders": [
    {
      "id": 4,
      "name": "Spa",
      "parentId": null,
      "sortOrder": 0
    }
  ],
  "files": [
    {
      "id": 1,
      "title": "Photo Premium terrace",
      "fileType": "image/jpeg",
      "fileSize": 8945632,
      "fileUrl": "https://cdn.../original.jpg",
      "thumbnailUrl": "https://cdn.../thumb.webp",
      "createdAt": "2026-03-10T09:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 30, "total": 95, "totalPages": 4, "hasMore": true }
}
```

### GET `/api/mobile/v1/sav`

Tickets SAV du partenaire.

**Query params :**

| Param | Type | Défaut | Description |
|---|---|---|---|
| `page` | number | 1 | Numéro de page |
| `limit` | number | 20 | Éléments par page (max 50) |

**Réponse 200 :**
```json
{
  "tickets": [
    {
      "id": 1,
      "ticketNumber": "SAV-2026-0001",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "subject": "Fuite pompe Neptune",
      "productName": "Neptune V2",
      "serialNumber": "NEP-2025-1234",
      "createdAt": "2026-03-14T11:00:00.000Z",
      "updatedAt": "2026-03-15T09:30:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 3, "totalPages": 1, "hasMore": false }
}
```

## Notifications Push (Expo Push)

### POST `/api/mobile/auth/push-token`

Enregistrer le token push de l'appareil.

**Headers :** `Authorization: Bearer <accessToken>`

**Body :**
```json
{
  "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "ios",
  "deviceId": "identifiant-unique-appareil"
}
```

### DELETE `/api/mobile/auth/push-token`

Supprimer le token push (déconnexion).

**Headers :** `Authorization: Bearer <accessToken>`

**Body :**
```json
{
  "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

## Intégration tRPC

En plus des endpoints REST, l'app mobile peut aussi appeler les routes **tRPC** existantes en utilisant le header `Authorization: Bearer <accessToken>`.

**Configuration du client tRPC dans React Native :**

```typescript
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import * as SecureStore from "expo-secure-store";

const API_URL = "https://marketspas.pro";

const trpcClient = createTRPCClient({
  links: [
    httpBatchLink({
      url: `${API_URL}/api/trpc`,
      async headers() {
        const token = await SecureStore.getItemAsync("accessToken");
        return {
          Authorization: token ? `Bearer ${token}` : "",
        };
      },
    }),
  ],
});
```

## Health Check

### GET `/api/mobile/health`

Vérification de la disponibilité de l'API (pas d'authentification requise).

**Réponse 200 :**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-03-17T14:00:00.000Z"
}
```

## Gestion des erreurs

Toutes les erreurs suivent le format :

```json
{
  "error": "ERROR_CODE",
  "message": "Description lisible de l'erreur"
}
```

| Code HTTP | Error | Description |
|---|---|---|
| 400 | `MISSING_FIELDS` | Champs requis manquants |
| 401 | `UNAUTHORIZED` | Token manquant |
| 401 | `INVALID_TOKEN` | Token invalide ou expiré |
| 401 | `INVALID_CREDENTIALS` | Email/mot de passe incorrect |
| 403 | `ACCOUNT_INACTIVE` | Compte désactivé |
| 404 | `NOT_FOUND` | Ressource non trouvée |
| 500 | `INTERNAL_ERROR` | Erreur serveur |

## Flux d'authentification recommandé (React Native)

```
1. Login → stocker accessToken + refreshToken dans SecureStore
2. Chaque requête → ajouter Authorization: Bearer <accessToken>
3. Si 401 → appeler /refresh avec le refreshToken
4. Si refresh OK → mettre à jour les tokens et rejouer la requête
5. Si refresh 401 → rediriger vers l'écran de login
6. Logout → appeler /logout + supprimer les tokens locaux
```

## Channels de notifications push

| Channel ID | Nom | Description |
|---|---|---|
| `orders` | Commandes | Mises à jour de statut de commandes |
| `resources` | Ressources | Nouvelles ressources disponibles |
| `sav` | Service Après-Vente | Mises à jour de tickets SAV |
| `general` | Général | Notifications générales |
