# Plan de finalisation du Portail B2B Market Spas

## Contexte
- **Leads** : Viennent de sources externes (Shopify + Meta Ads via webhook)
- **Utilisateurs** : Admins (SUPER_ADMIN) + Partenaires revendeurs
- **Objectif** : Portail 100% opérationnel (hors facturation/paiement)

---

## Phase 1 : Workflow principal de commande (CRITIQUE)

### 1.1 Catalog.tsx - Page catalogue produits
**Routes backend nécessaires** :
- ✅ `trpc.products.list` (existe déjà)
- ✅ `trpc.products.getById` (existe déjà)
- ❌ `trpc.cart.addItem` (à créer)

**Fonctionnalités** :
- Afficher tous les produits avec images, prix, stock
- Filtres : catégorie, prix, stock disponible
- Recherche par nom/SKU
- Badge "Stock disponible" vs "Arrivage programmé (semaine X)"
- Bouton "Ajouter au panier" → appelle `trpc.cart.addItem`
- Lien vers ProductDetail

### 1.2 ProductDetail.tsx - Fiche produit détaillée
**Routes backend nécessaires** :
- ✅ `trpc.products.getById` (existe déjà)
- ✅ `trpc.products.getVariants` (existe déjà)
- ✅ `trpc.products.getIncomingStock` (existe déjà)
- ❌ `trpc.cart.addItem` (à créer)

**Fonctionnalités** :
- Galerie d'images (carousel)
- Détails complets (description, specs, dimensions)
- Variantes (couleurs, modèles)
- Stock en temps réel + arrivages programmés
- Sélection quantité + ajout au panier
- Produits similaires/recommandés

### 1.3 Cart.tsx - Panier d'achat
**Routes backend nécessaires** :
- ❌ `trpc.cart.get` (à créer)
- ❌ `trpc.cart.updateQuantity` (à créer)
- ❌ `trpc.cart.removeItem` (à créer)
- ❌ `trpc.cart.clear` (à créer)

**Fonctionnalités** :
- Afficher tous les articles du panier
- Modifier les quantités
- Supprimer des articles
- Calcul automatique des totaux
- Validation du stock disponible
- Bouton "Passer la commande" → redirect vers Checkout

**Table DB** :
```sql
CREATE TABLE cart_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  variant_id INT NULL,
  quantity INT NOT NULL,
  incoming_stock_id INT NULL, -- Pour les précommandes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id),
  FOREIGN KEY (incoming_stock_id) REFERENCES incoming_stock(id)
);
```

### 1.4 Checkout.tsx - Processus de commande
**Routes backend nécessaires** :
- ✅ `trpc.cart.get` (créé en 1.3)
- ❌ `trpc.orders.create` (à créer)

**Fonctionnalités** :
- Récapitulatif du panier
- Formulaire adresse de livraison
- Notes de commande (optionnel)
- Validation finale
- Création de la commande → redirect vers OrderConfirmation
- Envoi d'email de confirmation

**Table DB** :
```sql
-- Table orders existe déjà, vérifier les champs nécessaires
ALTER TABLE orders ADD COLUMN delivery_address TEXT;
ALTER TABLE orders ADD COLUMN delivery_city VARCHAR(255);
ALTER TABLE orders ADD COLUMN delivery_postal_code VARCHAR(20);
ALTER TABLE orders ADD COLUMN delivery_country VARCHAR(2);
ALTER TABLE orders ADD COLUMN notes TEXT;
```

### 1.5 OrderConfirmation.tsx - Confirmation de commande
**Routes backend nécessaires** :
- ❌ `trpc.orders.getById` (à créer)

**Fonctionnalités** :
- Afficher le numéro de commande
- Récapitulatif complet
- Informations de livraison
- Lien vers Orders (historique)

### 1.6 Orders.tsx - Historique des commandes (Partenaire)
**Routes backend nécessaires** :
- ❌ `trpc.orders.myOrders` (à créer)
- ❌ `trpc.orders.getById` (à créer)

**Fonctionnalités** :
- Liste de toutes les commandes du partenaire
- Filtres : statut, date
- Recherche par numéro de commande
- Détails de chaque commande (modal ou page dédiée)
- Statuts : en_attente, confirmée, en_préparation, expédiée, livrée, annulée

### 1.7 OrderTracking.tsx - Suivi de commande
**Routes backend nécessaires** :
- ✅ `trpc.orders.getById` (créé en 1.6)
- ❌ `trpc.orders.getTracking` (à créer)

**Fonctionnalités** :
- Timeline des événements
- Statut actuel
- Informations de livraison
- Numéro de tracking (si disponible)

### 1.8 AdminOrders.tsx - Gestion admin des commandes
**Routes backend nécessaires** :
- ❌ `trpc.admin.orders.list` (à créer)
- ❌ `trpc.admin.orders.updateStatus` (à créer)
- ❌ `trpc.admin.orders.cancel` (à créer)

**Fonctionnalités** :
- Liste de toutes les commandes (tous partenaires)
- Filtres avancés : partenaire, statut, date, montant
- Modification du statut
- Annulation de commande
- Export CSV/PDF
- Détails complets de chaque commande

---

## Phase 2 : Gestion des leads (IMPORTANT)

### 2.1 API d'import de leads
**Routes backend nécessaires** :
- ❌ `trpc.leads.import` ou endpoint REST `/api/leads/import` (à créer)
- ❌ `trpc.leads.assignToPartner` (à créer - utilise `findBestPartnerForPostalCode`)

**Fonctionnalités** :
- Webhook pour recevoir les leads de Shopify
- Webhook pour recevoir les leads de Meta Ads
- Validation des données (email, téléphone, code postal)
- Attribution automatique au partenaire selon territoire
- Création d'une notification pour le partenaire
- Envoi d'email au partenaire

**Table DB** :
```sql
CREATE TABLE leads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  source ENUM('shopify', 'meta_ads', 'manual') NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  postal_code VARCHAR(20),
  city VARCHAR(255),
  country VARCHAR(2),
  message TEXT,
  status ENUM('nouveau', 'contacte', 'qualifie', 'converti', 'perdu') DEFAULT 'nouveau',
  partner_id INT NULL,
  assigned_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id)
);

CREATE TABLE lead_interactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lead_id INT NOT NULL,
  user_id INT NOT NULL,
  type ENUM('appel', 'email', 'visite', 'note') NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 2.2 Leads.tsx - Gestion des leads (Partenaire)
**Routes backend nécessaires** :
- ❌ `trpc.leads.myLeads` (à créer)
- ❌ `trpc.leads.updateStatus` (à créer)
- ❌ `trpc.leads.addInteraction` (à créer)

**Fonctionnalités** :
- Liste des leads attribués au partenaire
- Filtres par statut
- Recherche par nom/email/téléphone
- Détails de chaque lead (modal)
- Formulaire de mise à jour du statut
- Ajout d'interactions (notes, appels, emails)
- Statistiques de conversion

### 2.3 AdminLeads.tsx - Gestion admin des leads
**Routes backend nécessaires** :
- ❌ `trpc.admin.leads.list` (à créer)
- ❌ `trpc.admin.leads.reassign` (à créer)
- ❌ `trpc.admin.leads.updateStatus` (à créer)

**Fonctionnalités** :
- Liste de tous les leads (tous partenaires)
- Filtres avancés : partenaire, statut, source, date
- Réattribution manuelle à un autre partenaire
- Modification du statut
- Export CSV/PDF
- Statistiques globales de conversion

---

## Phase 3 : Ressources et documentation (MOYEN)

### 3.1 Resources.tsx - Ressources médias (Partenaire)
**Routes backend nécessaires** :
- ❌ `trpc.resources.list` (à créer)
- ❌ `trpc.resources.download` (à créer)

**Fonctionnalités** :
- Liste des ressources disponibles (PLV, catalogues, supports marketing)
- Organisation par catégorie
- Recherche et filtres
- Téléchargement de fichiers
- Aperçu des fichiers (images, PDFs)

**Table DB** :
```sql
CREATE TABLE resources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('plv', 'catalogue', 'marketing', 'autre') NOT NULL,
  file_url TEXT NOT NULL,
  file_key TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3.2 AdminResources.tsx - Gestion admin des ressources
**Routes backend nécessaires** :
- ❌ `trpc.admin.resources.list` (à créer)
- ❌ `trpc.admin.resources.upload` (à créer)
- ❌ `trpc.admin.resources.delete` (à créer)

**Fonctionnalités** :
- Upload de fichiers (utiliser `storagePut`)
- Organisation par catégorie
- Modification des métadonnées
- Suppression de fichiers
- Statistiques de téléchargement

### 3.3 TechnicalResources.tsx - Ressources techniques (Partenaire)
**Routes backend nécessaires** :
- ❌ `trpc.technicalResources.list` (à créer)
- ❌ `trpc.forum.topics` (à créer)

**Fonctionnalités** :
- Liste des guides de réparation
- Vidéos tutoriels
- Onglet Forum d'entraide
- Téléchargement de fichiers
- Recherche et filtres

**Table DB** :
```sql
CREATE TABLE technical_resources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('guide', 'video', 'document') NOT NULL,
  product_id INT NULL,
  file_url TEXT,
  file_key TEXT,
  video_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE forum_topics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE forum_replies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  topic_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (topic_id) REFERENCES forum_topics(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Phase 4 : Système de notifications (IMPORTANT)

### 4.1 Backend - Notifications
**Routes backend nécessaires** :
- ❌ `trpc.notifications.list` (à créer)
- ❌ `trpc.notifications.markAsRead` (à créer)
- ❌ `trpc.notifications.markAllAsRead` (à créer)

**Table DB** :
```sql
-- Vérifier si la table notifications existe déjà
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type ENUM('lead', 'order', 'stock', 'system') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 4.2 Frontend - Centre de notifications
**Composant** : `<NotificationCenter />` dans le header

**Fonctionnalités** :
- Badge avec nombre de notifications non lues
- Dropdown avec liste des notifications
- Clic sur notification → marquer comme lue + redirect vers lien
- Bouton "Tout marquer comme lu"

### 4.3 Déclencheurs de notifications
- **Nouveau lead attribué** → Notification au partenaire
- **Nouvelle commande** → Notification à l'admin
- **Changement de statut de commande** → Notification au partenaire
- **Stock critique** → Notification à l'admin
- **Arrivage programmé arrivé** → Notification à l'admin

---

## Phase 5 : Fonctionnalités bonus (CONFORT)

### 5.1 Favorites.tsx - Wishlist
**Routes backend nécessaires** :
- ❌ `trpc.favorites.list` (à créer)
- ❌ `trpc.favorites.add` (à créer)
- ❌ `trpc.favorites.remove` (à créer)

**Table DB** :
```sql
CREATE TABLE favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE KEY (user_id, product_id)
);
```

### 5.2 AdminPartners.tsx - Gestion des partenaires
**Routes backend nécessaires** :
- ✅ `trpc.admin.partners.list` (à vérifier)
- ❌ `trpc.admin.partners.create` (à créer)
- ❌ `trpc.admin.partners.update` (à créer)
- ❌ `trpc.admin.partners.toggleActive` (à créer)

### 5.3 AdminReports.tsx - Rapports avancés
**Routes backend nécessaires** :
- ❌ `trpc.admin.reports.sales` (à créer)
- ❌ `trpc.admin.reports.stock` (à créer)
- ❌ `trpc.admin.reports.leads` (à créer)

### 5.4 Profile.tsx - Profil partenaire
**Routes backend nécessaires** :
- ❌ `trpc.profile.get` (à créer)
- ❌ `trpc.profile.update` (à créer)
- ❌ `trpc.profile.uploadLogo` (à créer)

---

## Ordre d'implémentation recommandé

1. **Workflow de commande** (Phase 1) - 🔴 CRITIQUE
   - Cart (backend + frontend)
   - Catalog (connexion backend)
   - ProductDetail (connexion backend)
   - Checkout (création commande)
   - Orders (historique)
   - AdminOrders (gestion admin)

2. **Gestion des leads** (Phase 2) - 🟠 IMPORTANT
   - API d'import de leads
   - Leads.tsx (partenaire)
   - AdminLeads.tsx (admin)

3. **Notifications** (Phase 4) - 🟠 IMPORTANT
   - Backend notifications
   - NotificationCenter component
   - Déclencheurs automatiques

4. **Ressources** (Phase 3) - 🟡 MOYEN
   - Resources.tsx + AdminResources.tsx
   - TechnicalResources.tsx
   - Forum (basique)

5. **Bonus** (Phase 5) - 🟢 CONFORT
   - Favorites
   - AdminPartners
   - AdminReports
   - Profile

---

## Tests de validation

### Tests unitaires à créer
- `server/cart.test.ts` - Gestion du panier
- `server/orders.test.ts` - Création et gestion des commandes
- `server/leads.test.ts` - Import et attribution des leads
- `server/notifications.test.ts` - Création et envoi de notifications

### Tests d'intégration (manuels)
- [ ] Workflow complet : Catalog → Cart → Checkout → Order → Confirmation
- [ ] Import de lead → Attribution automatique → Notification partenaire
- [ ] Upload de ressource admin → Téléchargement par partenaire
- [ ] Création de commande → Notification admin → Changement statut → Notification partenaire

---

## Estimation de temps

- **Phase 1 (Workflow commande)** : 8-10 heures
- **Phase 2 (Gestion leads)** : 4-6 heures
- **Phase 3 (Ressources)** : 3-4 heures
- **Phase 4 (Notifications)** : 2-3 heures
- **Phase 5 (Bonus)** : 4-5 heures
- **Tests et validation** : 2-3 heures

**Total estimé** : 23-31 heures de développement
