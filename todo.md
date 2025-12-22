# Portail B2B Market Spas - TODO

## Phase 1: Base de données et schéma
- [x] Configurer le schéma Drizzle complet avec tous les modèles
- [x] Créer les tables pour utilisateurs et authentification
- [x] Créer les tables pour partenaires et adresses
- [x] Créer les tables pour produits et variantes
- [x] Créer les tables pour commandes et lignes de commande
- [x] Créer les tables pour facturation et paiements
- [x] Créer les tables pour ressources et catégories
- [x] Créer les tables pour notifications et logs d'activité
- [x] Pousser les migrations vers la base de données

## Phase 2: Authentification et gestion utilisateurs
- [x] Connexion SSO avec Manus OAuth
- [x] Gestion des sessions utilisateur
- [x] Profil utilisateur avec préférences
- [x] Gestion des rôles (SUPER_ADMIN, ADMIN, PARTNER_ADMIN, PARTNER_USER, etc.)
- [ ] Système d'inscription partenaire avec validation email
- [ ] Authentification 2FA (Two-Factor Authentication)
- [ ] Récupération et réinitialisation de mot de passe

## Phase 3: Gestion des partenaires
- [x] Système de niveaux (Bronze, Silver, Gold, Platinum, VIP)
- [x] Gestion des remises personnalisées par niveau
- [x] Validation et approbation des partenaires par admin
- [x] Profil partenaire complet avec informations entreprise
- [x] Gestion des adresses multiples (facturation, livraison)
- [x] Page admin de gestion des partenaires
- [ ] Interface d'onboarding pour nouveaux partenaires
- [ ] Gestion des contacts partenaires
- [ ] Conditions commerciales personnalisées
- [ ] Attribution de commerciaux aux partenaires

## Phase 4: Catalogue produits
- [x] Affichage du catalogue avec images et descriptions
- [x] Gestion des variantes produits (couleurs, tailles, options)
- [x] Affichage du stock en temps réel
- [x] Recherche et filtres avancés
- [x] Affichage des arrivages prévus
- [x] Prix personnalisés par niveau partenaire
- [x] Page de détail produit
- [ ] Synchronisation automatique depuis Google Sheets (toutes les 5 min)
- [ ] Surcharges de prix individuelles

## Phase 5: Système de commandes
- [x] Panier d'achat avec gestion des quantités
- [x] Processus de checkout avec sélection adresse livraison
- [x] Validation des commandes
- [x] Création de commande avec numéro unique
- [x] Page de confirmation de commande
- [x] Historique complet des commandes
- [x] Notifications de changement de statut
- [ ] Paiement d'acompte via Stripe
- [ ] Suivi de statut des commandes en temps réel
- [ ] Gestion des expéditions partielles
- [ ] Système d'annulation et remboursement

## Phase 6: Facturation et intégration Odoo
- [ ] Génération automatique de devis
- [ ] Génération de factures d'acompte
- [ ] Génération de factures de solde
- [ ] Génération d'avoirs (credit notes)
- [ ] Intégration API JSON-RPC avec Odoo
- [ ] Synchronisation des contacts vers Odoo
- [ ] Préparation Peppol pour facturation électronique
- [ ] Stockage sécurisé des PDFs de factures

## Phase 7: Intégration Stripe
- [x] Configuration Stripe avec clés API (sandbox)
- [ ] Création de Payment Intents pour acomptes
- [ ] Gestion des webhooks Stripe
- [ ] Traitement des paiements réussis
- [ ] Gestion des échecs de paiement
- [ ] Système de remboursements
- [ ] Historique des transactions

## Phase 8: Dashboard et analytics
- [x] Dashboard partenaire avec KPIs personnels
- [x] Dashboard administrateur avec KPIs globaux
- [x] Affichage de l'activité récente
- [x] Système de notifications en temps réel
- [ ] Alertes de stock bas
- [ ] Alertes de nouveaux partenaires
- [ ] Graphiques et visualisations de données
- [ ] Rapports exportables (CSV, Excel, PDF)
- [ ] Prévisions commerciales

## Phase 9: Bibliothèque de ressources
- [x] Catégorisation des ressources (Documentation, Vidéos, Marketing, etc.)
- [x] Upload et stockage sécurisé sur S3
- [x] Gestion des permissions d'accès par rôle
- [x] Documentation technique téléchargeable
- [x] Vidéos tutoriels intégrées
- [x] Guides de dépannage
- [x] Images marketing HD
- [x] Catalogues et PLV
- [x] Guides de vente et installation
- [x] Certificats et documents de garantie

## Phase 10: Interface d'administration
- [x] Gestion complète des partenaires (CRUD)
- [x] Gestion des produits et variantes
- [x] Gestion des commandes et statuts
- [x] Gestion des ressources
- [x] Gestion des utilisateurs et permissions
- [x] Gestion des arrivages programmés
- [ ] Paramètres système
- [ ] Logs d'activité et audit trail
- [ ] Configuration des intégrations externes
- [ ] Gestion des niveaux et remises

## Phase 11: Multilingue et emails
- [x] Support FR, NL, EN avec i18next
- [x] Sélecteur de langue dans le header
- [ ] Traductions complètes de l'interface
- [ ] Adaptation par pays (BE, FR, LU)
- [ ] Configuration du service d'email transactionnel
- [ ] Email de confirmation d'inscription
- [ ] Email de confirmation de commande
- [ ] Email de changement de statut
- [ ] Email de facture disponible
- [ ] Email d'alerte de stock bas
- [ ] Email de validation partenaire
- [ ] Templates d'emails personnalisés

## Phase 12: Jobs en arrière-plan
- [x] Tâche planifiée hebdomadaire pour actualiser le stock des arrivages
- [ ] Configuration de BullMQ avec Redis
- [ ] Job de synchronisation stock Google Sheets (toutes les 5 min)
- [ ] Job de traitement des commandes
- [ ] Job de génération de factures
- [ ] Job d'envoi d'emails transactionnels
- [ ] Job de notifications push
- [ ] Job de génération de rapports
- [ ] Job de nettoyage des fichiers anciens

## Phase 13: Design et UX
- [x] Design élégant et moderne pour toutes les pages
- [x] Thème de couleurs cohérent (bleu profond professionnel)
- [x] Typographie professionnelle
- [x] Animations et transitions fluides
- [x] Interface responsive (desktop, tablette, mobile)
- [x] États de chargement et feedback utilisateur
- [x] Gestion des erreurs avec messages clairs
- [x] États vides avec illustrations

## Phase 14: Tests et optimisation
- [x] Tests unitaires pour les procédures critiques (31 tests passent)
- [ ] Tests d'intégration pour les workflows complets
- [ ] Validation de toutes les intégrations externes
- [ ] Optimisation des performances
- [ ] Vérification de la sécurité
- [ ] Tests de charge
- [ ] Documentation technique complète


## Fonctionnalités complétées récemment
- [x] Créer le thème élégant avec palette de couleurs professionnelle (bleu profond)
- [x] Développer la page d'accueil avec hero section et features
- [x] Créer le dashboard avec KPIs et statistiques en temps réel
- [x] Implémenter la navigation et le header élégant
- [x] Créer la page catalogue produits avec recherche et filtres
- [x] Créer la page historique des commandes avec statuts
- [x] Créer la page bibliothèque de ressources avec catégories
- [x] Configurer les routes tRPC pour toutes les fonctionnalités
- [x] Implémenter les helpers de base de données
- [x] Système de panier avec sélection de quantité et pré-réservations
- [x] Catalogue avec affichage des arrivages programmés
- [x] Interface admin pour produits, variantes et arrivages
- [x] Page de checkout avec formulaire d'adresse et sélection de paiement
- [x] Tâche planifiée hebdomadaire pour actualiser le stock des arrivages
- [x] Système d'upload d'images vers S3
- [x] Page de confirmation de commande
- [x] Page de détail produit
- [x] Page de profil utilisateur
- [x] Page admin de gestion des partenaires
- [x] Système de notifications
- [x] Support multilingue (FR/NL/EN)
- [x] Données de démonstration (10 produits, 4 partenaires)


## Bugs corrigés
- [x] Corriger l'erreur "OAuth callback failed" lors de la connexion
- [x] Corriger l'erreur pricePublicHT.toFixed() dans AdminProducts.tsx
- [x] Corriger les balises <a> imbriquées dans AdminLayout.tsx
- [x] Corriger les colonnes partner_level et partner_status dans la table partners
- [x] Remplacer la section "Programme de fidélité" par une mise en avant des ressources média, marketing et PLV


## Système d'upload d'images
- [x] Créer les routes API pour l'upload d'images vers S3
- [x] Ajouter le composant d'upload d'images dans AdminProducts
- [x] Intégrer le composant ImageUpload dans le formulaire de création de produit
- [x] Intégrer le composant ImageUpload dans le formulaire de création de variante
- [x] Permettre l'upload d'images spécifiques par variante (colonne imageUrl ajoutée)
- [x] Gérer la suppression d'images (bouton X sur l'aperçu)
- [ ] Permettre l'upload de plusieurs images par produit (galerie)
- [ ] Afficher les images dans le catalogue produits


## Tâches complétées récemment (session actuelle)
- [x] Intégrer Stripe pour les paiements d'acompte (module stripe.ts + routes tRPC)
- [x] Compléter les traductions FR/NL/EN pour toute l'interface
- [x] Afficher les images produits dans le catalogue
- [x] Ajouter les alertes de stock bas (dashboard admin)
- [x] Créer les rapports exportables (CSV/Excel) - page AdminReports
- [x] Améliorer le dashboard admin avec KPIs et alertes
- [x] Créer l'interface d'onboarding partenaire (PartnerOnboarding.tsx)
- [x] Créer le module d'emails transactionnels (email.ts)

## Tâches restantes (optionnelles)
- [ ] Implémenter le suivi de statut des commandes en temps réel
- [ ] Ajouter les logs d'activité et audit trail
- [ ] Créer la page de paramètres système admin
- [ ] Intégration complète Odoo pour facturation
- [ ] Configuration BullMQ pour jobs en arrière-plan


## Session actuelle - Finalisation complète

### Admin - Complété
- [x] Page de gestion des commandes admin (AdminOrders.tsx)
- [x] Détail de commande admin avec changement de statut
- [x] Page de paramètres système admin (AdminSettings.tsx)
- [ ] Logs d'activité et audit trail (optionnel)

### Utilisateur - Complété
- [x] Améliorer le panier avec prix partenaire réels
- [x] Finaliser le checkout avec Stripe Elements
- [x] Page de suivi de commande en temps réel (OrderTracking.tsx)
- [x] Améliorer la page de profil avec gestion des adresses
- [x] Finaliser la page de ressources avec téléchargement fonctionnel
- [x] Ajouter les notifications toast pour les actions utilisateur


## Bugs identifiés lors de l'audit

- [x] BUG: Le bouton "Ajouter au panier" ne fonctionne pas - CORRIGÉ (table cart_items persistante créée)
- [x] Vérifier la route cart.add et la mutation tRPC - FONCTIONNEL
- [x] Ajouter un feedback visuel (toast) lors de l'ajout au panier - FONCTIONNEL
- [x] Vérifier le fonctionnement du checkout complet - FONCTIONNEL

## Fonctionnalités pour usage quotidien - COMPLÉTÉES

### Revendeurs
- [x] Recherche rapide par SKU/référence produit (route products.quickSearch)
- [x] Système de favoris pour produits fréquents (page Favorites.tsx + table favorites)
- [x] Bouton "Recommander" sur commandes précédentes (route orders.reorder)
- [x] Lien vers les favoris dans le catalogue et le dashboard
- [ ] Téléchargement de devis PDF avant validation (optionnel)
- [ ] Alertes email de disponibilité produit (optionnel)
- [ ] Contact support direct depuis l'app (optionnel)

### Admin
- [x] Vue des commandes du jour sur le dashboard (route orders.getToday)
- [x] Alertes visuelles de stock critique (dashboard admin)
- [x] Validation rapide des commandes en attente (route orders.quickValidate)
- [x] Export CSV des commandes du jour (route orders.exportToday)
