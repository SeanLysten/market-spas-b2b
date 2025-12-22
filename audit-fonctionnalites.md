# Audit des fonctionnalités - Portail B2B Market Spas

## Pages vérifiées

### Page d'accueil (/)
- [x] Header avec logo, nom utilisateur, rôle
- [x] Sélecteur de langue (FR/NL/EN)
- [x] Bouton Administration (visible pour admin)
- [x] Bouton "Access portal"
- [x] Message de bienvenue
- [x] Boutons "Tableau de bord" et "Catalogue produits"
- [x] Cards de fonctionnalités
- [x] Section Ressources média & PLV

### Dashboard (/dashboard)
- [x] KPIs: Commandes totales, Chiffre d'affaires, Produits disponibles, Partenaires actifs
- [x] Section Commandes récentes avec lien "Voir tout"
- [x] Section Notifications
- [x] Actions rapides: Catalogue, Nouvelle commande, Ressources, Administration
- [ ] Afficher les vraies commandes récentes du partenaire
- [ ] Afficher les vraies notifications

## Fonctionnalités à vérifier

### Côté Revendeur (Partenaire)
- [ ] /catalog - Catalogue produits avec filtres et recherche
- [ ] /product/:id - Page détail produit
- [ ] /cart - Panier avec calcul des prix partenaire
- [ ] /checkout - Processus de commande complet
- [ ] /orders - Liste des commandes du partenaire
- [ ] /order/:id - Suivi de commande en temps réel
- [ ] /resources - Bibliothèque de ressources téléchargeables
- [ ] /profile - Profil utilisateur avec gestion adresses

### Côté Admin
- [ ] /admin - Dashboard admin avec KPIs globaux
- [ ] /admin/orders - Gestion des commandes
- [ ] /admin/products - Gestion des produits et variantes
- [ ] /admin/partners - Gestion des partenaires
- [ ] /admin/users - Gestion des utilisateurs
- [ ] /admin/resources - Gestion des ressources
- [ ] /admin/reports - Rapports et exports
- [ ] /admin/settings - Paramètres système

## Fonctionnalités manquantes identifiées

### Priorité haute (usage quotidien revendeur)
- [ ] Recherche rapide de produits par référence/SKU
- [ ] Favoris/Liste de souhaits pour les produits fréquents
- [ ] Récommander une commande précédente
- [ ] Téléchargement de devis PDF avant commande
- [ ] Historique des prix et évolution
- [ ] Alertes de disponibilité produit
- [ ] Contact support direct depuis l'app

### Priorité haute (usage quotidien admin)
- [ ] Vue d'ensemble des commandes du jour
- [ ] Alertes de stock critique
- [ ] Validation rapide des commandes en attente
- [ ] Export des commandes du jour
- [ ] Tableau de bord des livraisons en cours
- [ ] Gestion des arrivages et mise à jour stock

### Priorité moyenne
- [ ] Historique des modifications de commande
- [ ] Notes internes sur les commandes
- [ ] Système de tickets/support
- [ ] Statistiques de vente par produit
- [ ] Comparaison de périodes (mois/année)
