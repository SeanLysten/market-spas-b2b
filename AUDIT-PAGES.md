# Audit complet des pages existantes - Portail B2B Market Spas

## Pages Partenaires (Frontend)

### ✅ Dashboard.tsx
- **Status**: Partiellement fonctionnel
- **Manque**: 
  - Connexion aux vraies données (stats, notifications, événements)
  - KPIs partenaire (CA, commandes, leads)

### ❌ Catalog.tsx
- **Status**: À connecter
- **Manque**:
  - Connexion à `trpc.products.list`
  - Filtres fonctionnels (catégorie, prix, stock)
  - Recherche
  - Affichage stock en temps réel + arrivages programmés
  - Bouton "Ajouter au panier"

### ❌ Cart.tsx
- **Status**: À connecter
- **Manque**:
  - Gestion du panier en base de données
  - Persistance du panier
  - Calcul des totaux
  - Validation des quantités vs stock
  - Lien vers Checkout

### ❌ Checkout.tsx
- **Status**: À connecter
- **Manque**:
  - Récupération des données du panier
  - Validation des adresses
  - Création de la commande
  - Gestion des précommandes (arrivages)
  - Redirection vers OrderConfirmation

### ❌ Orders.tsx
- **Status**: À connecter
- **Manque**:
  - Connexion à `trpc.orders.myOrders`
  - Affichage de l'historique des commandes
  - Filtres par statut et date
  - Détails de chaque commande
  - Suivi de livraison

### ❌ OrderTracking.tsx
- **Status**: À connecter
- **Manque**:
  - Connexion à `trpc.orders.track`
  - Affichage du statut en temps réel
  - Historique des événements
  - Informations de livraison

### ❌ OrderConfirmation.tsx
- **Status**: À connecter
- **Manque**:
  - Récupération des détails de la commande
  - Affichage du récapitulatif
  - Envoi d'email de confirmation

### ❌ Leads.tsx
- **Status**: À connecter
- **Manque**:
  - Connexion à `trpc.leads.myLeads`
  - Affichage des leads attribués au partenaire
  - Filtres par statut (nouveau, contacté, qualifié, converti, perdu)
  - Formulaire de mise à jour du statut
  - Historique des interactions
  - Statistiques de conversion

### ❌ Resources.tsx
- **Status**: À connecter
- **Manque**:
  - Connexion à `trpc.resources.list`
  - Affichage des ressources médias (PLV, catalogues)
  - Organisation par catégorie
  - Téléchargement de fichiers
  - Recherche et filtres

### ❌ TechnicalResources.tsx
- **Status**: À connecter
- **Manque**:
  - Connexion à `trpc.technicalResources.list`
  - Affichage des guides de réparation
  - Vidéos tutoriels
  - Forum d'entraide (onglet)
  - Téléchargement de fichiers

### ❌ ProductDetail.tsx
- **Status**: À connecter
- **Manque**:
  - Connexion à `trpc.products.getById`
  - Affichage des détails complets
  - Galerie d'images
  - Specs techniques
  - Stock en temps réel + arrivages
  - Bouton "Ajouter au panier"
  - Produits similaires

### ✅ Profile.tsx
- **Status**: À vérifier
- **Manque** (potentiel):
  - Modification des informations partenaire
  - Upload de logo
  - Gestion des utilisateurs associés

### ❌ Favorites.tsx
- **Status**: À connecter
- **Manque**:
  - Connexion à `trpc.favorites.list`
  - Ajout/suppression de favoris
  - Persistance en base

### ❌ Calendar.tsx
- **Status**: À connecter
- **Manque**:
  - Connexion à `trpc.events.list`
  - Affichage des événements
  - Création d'événements
  - Synchronisation

### ❌ ForumTopicDetail.tsx + ForumNewTopic.tsx
- **Status**: À connecter
- **Manque**:
  - Connexion à `trpc.forum.*`
  - Création de topics
  - Réponses
  - Modération

### ✅ PartnerOnboarding.tsx + PartnerPending.tsx
- **Status**: À vérifier
- **Manque** (potentiel):
  - Workflow d'onboarding complet
  - Validation admin

---

## Pages Admin (Backend)

### ✅ AdminDashboard.tsx
- **Status**: Partiellement fonctionnel
- **Manque**:
  - KPIs globaux (CA, commandes, leads)
  - Graphiques de performance
  - Alertes de stock critique

### ✅ AdminProducts.tsx
- **Status**: Fonctionnel
- **Manque**: RAS (déjà complet)

### ❌ AdminOrders.tsx
- **Status**: À connecter
- **Manque**:
  - Connexion à `trpc.admin.orders.list`
  - Gestion des statuts
  - Filtres avancés
  - Export CSV/PDF
  - Détails de chaque commande

### ❌ AdminLeads.tsx
- **Status**: À connecter
- **Manque**:
  - Connexion à `trpc.admin.leads.list`
  - Attribution manuelle aux partenaires
  - Modification du statut
  - Historique des interactions
  - Statistiques de conversion

### ❌ AdminPartners.tsx
- **Status**: À connecter
- **Manque**:
  - Connexion à `trpc.admin.partners.list`
  - Création/modification de partenaires
  - Activation/désactivation
  - Gestion des territoires attribués
  - Statistiques par partenaire

### ✅ AdminUsers.tsx
- **Status**: Fonctionnel
- **Manque**: RAS (déjà complet)

### ✅ AdminTerritories.tsx
- **Status**: Fonctionnel
- **Manque**: RAS (déjà complet)

### ✅ AdminStockForecast.tsx
- **Status**: Fonctionnel
- **Manque**: RAS (déjà complet)

### ❌ AdminResources.tsx
- **Status**: À connecter
- **Manque**:
  - Connexion à `trpc.admin.resources.*`
  - Upload de fichiers (PLV, catalogues)
  - Organisation par catégorie
  - Gestion des permissions
  - Suppression de fichiers

### ❌ AdminReports.tsx
- **Status**: À connecter
- **Manque**:
  - Connexion à `trpc.admin.reports.*`
  - Rapports de ventes
  - Rapports de stock
  - Rapports de leads
  - Export PDF/Excel

### ❌ AdminSettings.tsx
- **Status**: À connecter
- **Manque**:
  - Configuration globale du portail
  - Paramètres de notifications
  - Gestion des emails
  - Logs d'activité

### ❌ TechnicalResources.tsx (admin)
- **Status**: À connecter
- **Manque**:
  - Upload de guides de réparation
  - Upload de vidéos
  - Gestion du forum (modération)

---

## Résumé des priorités

### 🔴 CRITIQUE (Workflow principal)
1. **Catalog.tsx** → Connexion produits + ajout au panier
2. **Cart.tsx** → Gestion du panier persistant
3. **Checkout.tsx** → Création de commande
4. **Orders.tsx** → Historique des commandes
5. **AdminOrders.tsx** → Gestion admin des commandes

### 🟠 IMPORTANT (Gestion des leads)
6. **Leads.tsx** → Affichage des leads partenaire
7. **AdminLeads.tsx** → Gestion admin des leads
8. **API d'import de leads** → Webhook Shopify + Meta Ads

### 🟡 MOYEN (Ressources et support)
9. **Resources.tsx** → Téléchargement de ressources
10. **AdminResources.tsx** → Upload de ressources
11. **TechnicalResources.tsx** → Guides et vidéos
12. **Forum** → Entraide entre partenaires

### 🟢 BONUS (Confort)
13. **Favorites.tsx** → Wishlist
14. **Calendar.tsx** → Événements
15. **AdminReports.tsx** → Rapports avancés
16. **Notifications** → Système de notifications temps réel
