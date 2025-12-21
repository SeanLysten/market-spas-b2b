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
- [ ] Système d'inscription partenaire avec validation email
- [ ] Connexion SSO avec Manus OAuth
- [ ] Authentification 2FA (Two-Factor Authentication)
- [ ] Récupération et réinitialisation de mot de passe
- [ ] Gestion des sessions utilisateur
- [ ] Profil utilisateur avec avatar et préférences
- [ ] Gestion des rôles (SUPER_ADMIN, ADMIN, PARTNER_ADMIN, PARTNER_USER, etc.)

## Phase 3: Gestion des partenaires
- [ ] Interface d'onboarding pour nouveaux partenaires
- [ ] Système de niveaux (Bronze, Silver, Gold, Platinum, VIP)
- [ ] Gestion des remises personnalisées par niveau
- [ ] Validation et approbation des partenaires par admin
- [ ] Profil partenaire complet avec informations entreprise
- [ ] Gestion des adresses multiples (facturation, livraison)
- [ ] Gestion des contacts partenaires
- [ ] Conditions commerciales personnalisées
- [ ] Attribution de commerciaux aux partenaires

## Phase 4: Catalogue produits
- [ ] Affichage du catalogue avec images et descriptions
- [ ] Gestion des variantes produits (couleurs, tailles, options)
- [ ] Affichage du stock en temps réel
- [ ] Synchronisation automatique depuis Google Sheets (toutes les 5 min)
- [ ] Recherche et filtres avancés
- [ ] Affichage des arrivages prévus
- [ ] Prix personnalisés par niveau partenaire
- [ ] Surcharges de prix individuelles

## Phase 5: Système de commandes
- [ ] Panier d'achat avec gestion des quantités
- [ ] Processus de checkout avec sélection adresse livraison
- [ ] Validation des commandes
- [ ] Paiement d'acompte via Stripe
- [ ] Suivi de statut des commandes en temps réel
- [ ] Historique complet des commandes
- [ ] Notifications de changement de statut
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
- [ ] Configuration Stripe avec clés API
- [ ] Création de Payment Intents pour acomptes
- [ ] Gestion des webhooks Stripe
- [ ] Traitement des paiements réussis
- [ ] Gestion des échecs de paiement
- [ ] Système de remboursements
- [ ] Historique des transactions

## Phase 8: Dashboard et analytics
- [ ] Dashboard partenaire avec KPIs personnels
- [ ] Dashboard administrateur avec KPIs globaux
- [ ] Affichage de l'activité récente
- [ ] Système de notifications en temps réel
- [ ] Alertes de stock bas
- [ ] Alertes de nouveaux partenaires
- [ ] Graphiques et visualisations de données
- [ ] Rapports exportables (CSV, Excel, PDF)
- [ ] Prévisions commerciales

## Phase 9: Bibliothèque de ressources
- [ ] Catégorisation des ressources (Documentation, Vidéos, Marketing, etc.)
- [ ] Upload et stockage sécurisé sur S3
- [ ] Gestion des permissions d'accès par rôle
- [ ] Documentation technique téléchargeable
- [ ] Vidéos tutoriels intégrées
- [ ] Guides de dépannage
- [ ] Images marketing HD
- [ ] Catalogues et PLV
- [ ] Guides de vente et installation
- [ ] Certificats et documents de garantie

## Phase 10: Interface d'administration
- [ ] Gestion complète des partenaires (CRUD)
- [ ] Gestion des produits et variantes
- [ ] Gestion des commandes et statuts
- [ ] Gestion des ressources
- [ ] Gestion des utilisateurs et permissions
- [ ] Paramètres système
- [ ] Logs d'activité et audit trail
- [ ] Configuration des intégrations externes
- [ ] Gestion des niveaux et remises

## Phase 11: Multilingue et emails
- [ ] Support FR, NL, EN avec next-intl
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
- [ ] Configuration de BullMQ avec Redis
- [ ] Job de synchronisation stock Google Sheets (toutes les 5 min)
- [ ] Job de traitement des commandes
- [ ] Job de génération de factures
- [ ] Job d'envoi d'emails transactionnels
- [ ] Job de notifications push
- [ ] Job de génération de rapports
- [ ] Job de nettoyage des fichiers anciens

## Phase 13: Design et UX
- [ ] Design élégant et moderne pour toutes les pages
- [ ] Thème de couleurs cohérent
- [ ] Typographie professionnelle
- [ ] Animations et transitions fluides
- [ ] Interface responsive (desktop, tablette, mobile)
- [ ] États de chargement et feedback utilisateur
- [ ] Gestion des erreurs avec messages clairs
- [ ] États vides avec illustrations

## Phase 14: Tests et optimisation
- [ ] Tests unitaires pour les procédures critiques
- [ ] Tests d'intégration pour les workflows complets
- [ ] Validation de toutes les intégrations externes
- [ ] Optimisation des performances
- [ ] Vérification de la sécurité
- [ ] Tests de charge
- [ ] Documentation technique complète


## Tâches complétées récemment
- [x] Créer le thème élégant avec palette de couleurs professionnelle (bleu profond)
- [x] Développer la page d'accueil avec hero section et features
- [x] Créer le dashboard avec KPIs et statistiques en temps réel
- [x] Implémenter la navigation et le header élégant
- [x] Créer la page catalogue produits avec recherche et filtres
- [x] Créer la page historique des commandes avec statuts
- [x] Créer la page bibliothèque de ressources avec catégories
- [x] Configurer les routes tRPC pour toutes les fonctionnalités
- [x] Implémenter les helpers de base de données


## Bugs à corriger
- [x] Corriger l'erreur "OAuth callback failed" lors de la connexion
- [ ] Corriger les noms de colonnes dans la table notifications (notification_type)
- [ ] Corriger les noms de colonnes dans la table orders (payment_status, order_status)

- [x] Remplacer la section "Programme de fidélité" par une mise en avant des ressources média, marketing et PLV


## Interface d'administration (Super Admin)
- [x] Créer une interface admin distincte avec navigation dédiée
- [x] Page de gestion des ressources média avec upload et catégorisation
- [x] Page d'ajout/invitation d'utilisateurs par email
- [ ] Page de gestion du catalogue produits avec formulaire complet
- [x] Système d'upload de fichiers vers S3 pour les ressources
- [ ] Système d'upload d'images produits
- [ ] Gestion des catégories de produits
- [ ] Gestion des variantes de produits

- [x] Ajouter un bouton dans le header pour accéder à l'interface admin (visible uniquement pour les super admins)


## Développement des fonctionnalités restantes
- [x] Page de gestion des produits admin avec formulaire complet
- [x] Système de panier d'achat avec gestion des quantités
- [ ] Page de checkout avec calcul des remises
- [ ] Intégration Stripe pour paiement d'acompte
- [ ] Page de gestion des partenaires admin
- [x] Ajouter des données de démonstration (produits, ressources, commandes)
- [ ] Améliorer la page de détail produit
- [ ] Système de notifications en temps réel


## Système de variantes de produits
- [x] Créer les tables pour les variantes (product_variants, variant_options)
- [x] Ajouter les migrations SQL pour les variantes
- [x] Routes API pour créer/gérer les variantes
- [x] Ajouter des données de démonstration avec variantes (3 couleurs pour SPA-001)
- [ ] Interface admin pour créer/gérer les variantes d'un produit
- [ ] Afficher les variantes dans le catalogue avec sélecteur
- [ ] Adapter le panier pour gérer les variantes sélectionnées


## Système d'arrivages programmés
- [x] Créer la table incoming_stock pour les arrivages programmés
- [x] Ajouter les champs expectedWeek et expectedYear dans la table
- [x] Routes API pour créer/gérer les arrivages programmés
- [x] Système automatique d'actualisation des arrivages (fonction processArrivedStock)
- [ ] Afficher les arrivages prévus dans le catalogue pour les revendeurs
- [x] Interface admin pour ajouter des arrivages avec semaine prévue

## Interface admin produits et variantes
- [x] Rendre visible la page AdminProducts dans le menu admin
- [x] Formulaire complet d'ajout de produit avec tous les champs
- [x] Section de gestion des variantes dans la page produit
- [x] Formulaire d'ajout de variante avec options (couleur, taille, voltage, matériau)
- [x] Gestion du stock par variante
- [x] Interface de gestion des arrivages programmés par produit


## Bugs à corriger
- [x] Corriger l'erreur pricePublicHT.toFixed() dans AdminProducts.tsx
- [x] Corriger les balises <a> imbriquées dans AdminLayout.tsx


## Amélioration du système de panier
- [x] Ajouter un sélecteur de quantité dans le catalogue (avec limite du stock disponible)
- [x] Afficher les arrivages programmés dans le catalogue avec badge "Arrivage semaine X"
- [x] Permettre la pré-réservation des produits en arrivage
- [x] Améliorer la page panier avec modification des quantités
- [x] Distinguer visuellement les produits en stock et les pré-réservations
- [x] Calculer automatiquement les remises selon le niveau partenaire


## Développement en cours
- [x] Créer la page de checkout avec paiements directs (virement, à la livraison)
- [ ] Implémenter la création de commande avec génération de devis Odoo
- [ ] Implémenter la synchronisation Google Sheets (toutes les 5 min)
- [ ] Créer le job cron hebdomadaire d'actualisation des arrivages
