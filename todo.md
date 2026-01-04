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
- [x] Création de Payment Intents pour acomptes (stripe.ts)
- [x] Gestion des webhooks Stripe (/api/webhooks/stripe)
- [x] Traitement des paiements réussis (handlePaymentSuccess)
- [x] Gestion des échecs de paiement (handlePaymentFailure)
- [x] Système de remboursements (handleRefund)
- [x] Historique des transactions (table payments)
- [ ] Intégration frontend checkout avec Stripe Elements

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


## Nouvelle session - Modifications majeures demandées - COMPLÉTÉES

### Simplification interface utilisateur
- [x] Supprimer les analytics/statistiques du dashboard utilisateur
- [x] Garder uniquement : catalogue produits (stock + arrivages), ressources médias/PLV, ressources techniques
- [x] Créer une section ressources techniques (réparation spas, vidéos présentation)

### Calendrier événements et promotions
- [x] Créer la table events dans le schéma
- [x] Créer la page calendrier avec vue annuelle (Calendar.tsx)
- [x] Permettre aux admins de créer des événements/promotions
- [x] Afficher les événements à venir sur le dashboard utilisateur

### Système de gestion de leads
- [x] Rechercher les meilleures pratiques pour l'intégration Meta Ads
- [x] Concevoir le schéma de base de données pour les leads (tables leads, lead_status_history)
- [x] Créer l'endpoint webhook pour recevoir les leads Meta (meta-leads.ts)
- [x] Implémenter la distribution automatique des leads par code postal (findPartnerByPostalCode)
- [x] Créer l'interface de gestion des leads pour les revendeurs (Leads.tsx)
- [x] Ajouter les statuts de lead (NEW, ASSIGNED, CONTACTED, NO_RESPONSE, QUALIFIED, NOT_QUALIFIED, CONVERTED, LOST)
- [x] Créer le dashboard admin pour les statistiques de leads (AdminLeads.tsx)
- [x] Afficher les budgets et métriques des campagnes Meta (intégration API préparée)
- [x] Tracker les interactions des revendeurs avec leurs leads (lead_status_history)


## Finalisation complète du portail - Session actuelle

### Audit des pages utilisateur
- [x] Dashboard utilisateur - Vérifier affichage et liens (tous les liens fonctionnels)
- [x] Catalogue produits - Vérifier recherche, filtres, ajout panier (16 produits, prix affichés)
- [x] Panier - Vérifier ajout, modification quantité, suppression (calcul TVA correct)
- [x] Checkout - Vérifier formulaire et paiement (4 modes de paiement, validation fonctionnelle)
- [x] Commandes - Vérifier historique et détails (filtres par statut, état vide géré)
- [x] Leads - Vérifier affichage et gestion des statuts (3 leads, statistiques affichées)
- [x] Calendrier - Vérifier affichage des événements (8 événements affichés)
- [x] Ressources - Vérifier téléchargement des fichiers (1 ressource, boutons Voir/Télécharger)
- [x] Favoris - Vérifier ajout et suppression (état vide géré, recherche disponible)
- [x] Profil - Vérifier modification des informations (4 onglets, 3 langues)

### Audit des pages admin
- [x] Dashboard admin - Vérifier KPIs et alertes (16 produits, alertes stock)
- [x] Gestion produits - Vérifier CRUD complet (16 produits affichés)
- [x] Gestion commandes - Vérifier changement de statut (filtres, export, état vide)
- [x] Gestion partenaires - Vérifier approbation et modification (4 partenaires, 1 approuvé)
- [x] Gestion leads - Vérifier statistiques et attribution (3 leads, filtres fonctionnels)
- [x] Rapports - Vérifier export CSV/Excel (4 types de rapports, dates optionnelles)
- [x] Paramètres - Vérifier sauvegarde des configurations (5 onglets, formulaire complet)

### Bugs à corriger
- [x] Vérifier tous les liens de navigation (tous fonctionnels)
- [x] Vérifier tous les formulaires (validation, champs obligatoires)
- [x] Vérifier les messages d'erreur (états vides bien gérés)
- [x] Vérifier les états de chargement (aucune erreur console)

### Données de démonstration
- [x] Ajouter des événements dans le calendrier (8 événements créés)
- [x] Ajouter des leads de test (3 leads créés avec statuts différents)
- [x] Vérifier les ressources disponibles (1 ressource Logo Market Spas)

## Modifications demandées

### Options de paiement
- [x] Supprimer les options virement bancaire, paiement à la livraison, facturation 30 jours
- [x] Garder uniquement paiement par carte avec 2 options : 100% ou 30% d'acompte

### Intégration Facebook Lead Ads
- [x] Créer l'endpoint webhook pour recevoir les leads Facebook
- [x] Ajouter la vérification du token Facebook
- [x] Configurer les secrets Meta (App ID, App Secret, Page Access Token)
- [x] Valider le token avec l'API Facebook (Page: Sean Lysten)
- [x] Documenter la configuration Facebook (GUIDE-CONFIGURATION-FACEBOOK.md)
- [x] Documenter la configuration du webhook (GUIDE-CONFIGURER-WEBHOOK-FACEBOOK.md)
- [ ] Configurer le webhook dans Facebook (action utilisateur)
- [ ] Créer la route pour récupérer les statistiques Meta Ads
- [ ] Mettre à jour la page Leads pour afficher les données Facebook

### Gestion des Territoires et Attribution des Leads
- [x] Créer les tables pour les pays, régions et codes postaux (countries, regions, postal_code_ranges, partner_territories)
- [x] Ajouter les données de référence (5 pays: BE, CH, ES, FR, DE avec 22 régions et 78 plages de codes postaux)
- [x] Créer les routes tRPC pour la gestion des territoires (admin.territories)
- [x] Créer l'interface admin pour assigner des territoires aux partenaires (Territories.tsx)
- [x] Implémenter la logique d'attribution automatique par code postal (findBestPartnerForPostalCode)
- [x] Mettre à jour meta-leads.ts pour utiliser le nouveau système de territoires
- [ ] Tester l'attribution automatique avec différents codes postaux


## Session finale - Finalisation complète du portail

### Système d'authentification
- [ ] Vérifier le fonctionnement de la connexion OAuth Manus
- [ ] Tester la déconnexion
- [ ] Vérifier la persistance de session
- [ ] Tester les redirections après connexion
- [ ] Vérifier les permissions admin vs utilisateur

### Fonctionnalités prioritaires à compléter
- [ ] Synchronisation automatique stock depuis Google Sheets (toutes les 5 min)
- [ ] Paiement d'acompte via Stripe (Payment Intents)
- [ ] Gestion des webhooks Stripe
- [ ] Système d'inscription partenaire avec validation email
- [ ] Interface d'onboarding pour nouveaux partenaires
- [ ] Surcharges de prix individuelles par partenaire
- [ ] Gestion des expéditions partielles
- [ ] Système d'annulation et remboursement

### Intégration Odoo
- [ ] Génération automatique de devis PDF
- [ ] Génération de factures d'acompte
- [ ] Génération de factures de solde
- [ ] Intégration API JSON-RPC avec Odoo
- [ ] Synchronisation des contacts vers Odoo

### Emails transactionnels
- [ ] Configuration du service d'email
- [ ] Email de confirmation d'inscription
- [ ] Email de confirmation de commande
- [ ] Email de changement de statut
- [ ] Email de facture disponible
- [ ] Email d'alerte de stock bas
- [ ] Email de validation partenaire

### Jobs en arrière-plan
- [ ] Configuration de BullMQ avec Redis
- [ ] Job de synchronisation stock Google Sheets
- [ ] Job de traitement des commandes
- [ ] Job de génération de factures
- [ ] Job d'envoi d'emails transactionnels

### Tests et optimisation
- [ ] Tests d'intégration pour workflows complets
- [ ] Validation de toutes les intégrations externes
- [ ] Optimisation des performances
- [ ] Vérification de la sécurité
- [ ] Documentation technique complète


## Finalisation - Tâches restantes

### Navigation et UX
- [x] Ajouter un bouton "Dashboard Utilisateur" dans le dashboard admin
- [ ] Vérifier tous les liens de navigation
- [ ] Améliorer les transitions entre pages

### Alertes et notifications
- [x] Alertes de stock bas (automatiques) - checkLowStockAlerts()
- [x] Alertes de nouveaux partenaires (pour admins) - checkPendingPartnersAlert()
- [x] Notifications de changement de statut de commande - notifyOrderStatusChange()
- [x] Notifications de nouvelle commande - notifyNewOrder()
- [ ] Système de notifications en temps réel (nécessite WebSockets)

### Gestion avancée des commandes
- [x] Système d'annulation de commande (cancelOrder avec restauration stock)
- [ ] Gestion des remboursements partiels (processPartialRefund - TODO schema)
- [x] Gestion des expéditions partielles (createPartialShipment)
- [x] Historique complet des modifications (via internalNotes)

### Visualisations et rapports
- [ ] Graphiques de ventes (Chart.js)
- [ ] Graphiques d'évolution du stock
- [ ] Rapports exportables améliorés
- [ ] Dashboard analytics avancé


## Graphiques de ventes - Dashboard Admin
- [x] Installer Chart.js et react-chartjs-2
- [x] Créer les routes tRPC pour les données de graphiques (salesByMonth, topProducts, partnerPerformance)
- [x] Créer les composants de graphiques réutilisables (SalesChart, TopProductsChart)
- [x] Intégrer les graphiques dans le dashboard admin (Évolution des ventes + Top 5 produits)
- [x] Tester l'affichage avec des données réelles (graphiques affichés, message si aucune donnée)


## Système de catégories produits
- [x] Ajouter une colonne `category` dans la table products (enum: SPAS, SWIM_SPAS, MAINTENANCE, COVERS, ACCESSORIES, OTHER)
- [x] Mettre à jour les routes tRPC pour filtrer par catégorie (getAllProducts avec filter category)
- [x] Ajouter un sélecteur de catégorie dans le formulaire admin de création/modification de produit
- [x] Ajouter des filtres par catégorie dans le catalogue utilisateur (7 boutons: Tous, Spas, Spas de nage, Produits d'entretien, Couvertures, Accessoires, Autre)
- [ ] Migrer les produits existants vers les bonnes catégories (TODO: script SQL)

### Section Ressources Techniques + Forum
- [x] Créer la table `technical_resources` (id, title, description, type: PDF/VIDEO/LINK, fileUrl, category, productCategory, tags, viewCount, createdAt, createdBy)
- [x] Créer la table `forum_topics` (id, title, description, category, productCategory, authorId, status: OPEN/RESOLVED/CLOSED, viewCount, replyCount, isPinned, createdAt)
- [x] Créer la table `forum_replies` (id, topicId, authorId, content, isAdminReply, isHelpful, helpfulCount, createdAt)t, isHelpful)
- [ ] Créer les routes tRPC pour les ressources techniques (list, create, update, delete)
- [ ] Créer les routes tRPC pour le forum (createTopic, replyToTopic, markAsResolved, markAsHelpful)
- [ ] Créer la page admin `/admin/technical-resources` pour gérer les ressources
- [ ] Créer la page utilisateur `/technical-resources` avec onglets (Documentations, Vidéos, Forum)
- [ ] Implémenter le système de commentaires/réponses du forum
- [ ] Ajouter la possibilité de marquer une réponse comme "utile"
- [ ] Ajouter la possibilité de marquer un topic comme "résolu"
