# Portail B2B Market Spas - Tâches Prioritaires

## 🔴 CRITIQUE - Système de commandes (doit fonctionner pour un MVP)

### 1. Finaliser createOrder()
- [ ] Corriger les noms de colonnes dans la table orders
- [ ] Implémenter createOrder() avec tous les champs requis
- [ ] Créer les lignes de commande (order_items)
- [ ] Générer un numéro de commande unique (format: CMD-YYYYMMDD-XXXX)
- [ ] Vider le panier après validation

### 2. Page de confirmation de commande
- [ ] Créer OrderConfirmation.tsx
- [ ] Afficher le récapitulatif de la commande
- [ ] Afficher les instructions de paiement (virement bancaire)
- [ ] Bouton pour télécharger le bon de commande PDF

### 3. Historique des commandes amélioré
- [ ] Afficher toutes les commandes du partenaire
- [ ] Filtres par statut, date
- [ ] Détail de chaque commande
- [ ] Suivi du statut en temps réel

## 🟠 IMPORTANT - Interface utilisateur

### 4. Afficher les images dans le catalogue
- [ ] Afficher l'image du produit dans la liste
- [ ] Afficher l'image de la variante sélectionnée
- [ ] Placeholder élégant si pas d'image

### 5. Page de détail produit
- [ ] Créer ProductDetail.tsx
- [ ] Galerie d'images
- [ ] Sélecteur de variantes
- [ ] Affichage du stock et arrivages
- [ ] Bouton ajouter au panier

### 6. Profil utilisateur
- [ ] Page de profil avec informations personnelles
- [ ] Modifier ses informations
- [ ] Voir son niveau partenaire et remises

### 7. Profil partenaire (entreprise)
- [ ] Informations de l'entreprise
- [ ] Adresses de facturation/livraison
- [ ] Contacts de l'entreprise
- [ ] Historique et statistiques

## 🟡 ADMIN - Gestion complète

### 8. Page de gestion des partenaires
- [ ] Liste des partenaires avec filtres
- [ ] Créer/modifier un partenaire
- [ ] Changer le niveau (Bronze, Silver, Gold, Platinum, VIP)
- [ ] Définir les remises personnalisées
- [ ] Approuver/rejeter les demandes

### 9. Page de gestion des commandes admin
- [ ] Liste de toutes les commandes
- [ ] Changer le statut (en attente, confirmée, en préparation, expédiée, livrée)
- [ ] Voir les détails de chaque commande
- [ ] Générer les documents (bon de commande, facture)

### 10. Dashboard admin amélioré
- [ ] Graphiques de ventes (Chart.js)
- [ ] Top produits vendus
- [ ] Nouveaux partenaires
- [ ] Commandes en attente
- [ ] Stock bas alertes

## 🟢 AMÉLIORATION - UX et fonctionnalités

### 11. Système de notifications
- [ ] Notifications en temps réel (nouvelle commande, changement statut)
- [ ] Centre de notifications dans le header
- [ ] Marquer comme lu
- [ ] Préférences de notifications

### 12. Support multilingue (FR/NL/EN)
- [ ] Créer le système de traduction
- [ ] Traduire l'interface principale
- [ ] Sélecteur de langue dans le header

### 13. Recherche et filtres avancés
- [ ] Recherche par nom, SKU, catégorie
- [ ] Filtres par prix, stock, catégorie
- [ ] Tri par prix, nom, popularité

### 14. Données de démonstration complètes
- [ ] 15-20 produits avec images réalistes
- [ ] Variantes pour chaque produit
- [ ] Arrivages programmés
- [ ] Quelques commandes de test
- [ ] Ressources marketing

## 🔵 OPTIONNEL - Intégrations futures

### 15. Intégration Odoo (si credentials fournis)
- [ ] Génération automatique de devis
- [ ] Synchronisation des contacts
- [ ] Génération de factures

### 16. Emails transactionnels
- [ ] Confirmation de commande
- [ ] Changement de statut
- [ ] Bienvenue nouveau partenaire

### 17. Export de données
- [ ] Export CSV des commandes
- [ ] Export PDF des factures
- [ ] Rapports de ventes

