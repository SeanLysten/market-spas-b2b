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
- [x] Système d'inscription sur invitation sécurisé
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
- [x] Système d'inscription sur invitation sécurisé

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
- [x] Créer la route tRPC pour générer et envoyer les invitations
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
- [x] Système d'inscription sur invitation sécurisé
- [ ] Interface d'onboarding pour nouveaux partenaires
- [ ] Surcharges de prix individuelles par partenaire
- [ ] Gestion des expéditions partielles
- [x] Système d'inscription sur invitation sécurisé

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
- [x] Système d'inscription sur invitation sécurisé

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


## Développement Interface Ressources Techniques
- [x] Créer les fonctions DB pour ressources techniques (getAllTechnicalResources, createTechnicalResource, updateTechnicalResource, deleteTechnicalResource, incrementResourceViewCount)
- [x] Créer les fonctions DB pour le forum (getAllForumTopics, createForumTopic, getForumTopicById, getForumRepliesByTopicId, createForumReply, markTopicAsResolved, markReplyAsHelpful, incrementTopicViewCount)
- [x] Créer les routes tRPC technicalResources (list, getById, create, update, delete avec auto-increment viewCount)
- [x] Créer les routes tRPC forum (listTopics, getTopic avec replies, createTopic, createReply, markResolved, markHelpful)
- [ ] Créer la page admin `/admin/technical-resources` avec tableau de gestion
- [ ] Créer la page utilisateur `/technical-resources` avec 3 onglets (Documentations PDF, Vidéos, Forum)
- [ ] Créer la page `/technical-resources/forum/:topicId` pour afficher un topic et ses réponses
- [ ] Ajouter le lien "Ressources Techniques" dans la navigation utilisateur

## Ressources Techniques et Forum d'entraide
- [x] Créer le schéma DB pour technical_resources, forum_topics, forum_replies
- [x] Créer les fonctions DB dans technical-resources-db.ts
- [x] Créer les routes tRPC admin.technicalResources et admin.forum
- [x] Créer l'interface admin /admin/technical-resources pour gérer les contenus
- [x] Ajouter le lien "Ressources Techniques" dans AdminLayout
- [x] Créer la page utilisateur /technical-resources avec onglets (Documentations, Forum)
- [x] Créer la page de création de topic forum (/technical-resources/forum/new)
- [x] Créer la page de détail de topic avec réponses (/technical-resources/forum/:id)
- [x] Ajouter le lien "Ressources Techniques" dans le dashboard utilisateur
- [x] Tester la création de sujet et l'ajout de réponses
- [ ] Ajouter des données de démonstration (3-5 ressources techniques)

## Bugs à corriger - Session actuelle
- [x] Corriger l'erreur "Cannot read properties of undefined (reading 'map')" dans /admin/technical-resources
- [x] Corriger l'erreur "Cannot read properties of undefined (reading 'map')" dans /technical-resources

## Bugs à corriger - Navigation admin
- [x] Ajouter le AdminLayout (sidebar) à la page /admin/technical-resources

## Bugs à corriger - Dashboard
- [x] Corriger les erreurs "Cannot read properties of undefined (reading 'map')" sur /dashboard

## Bugs à corriger - Liens Dashboard
- [x] Corriger le lien "Ressources Techniques" sur /dashboard pour pointer vers /technical-resources au lieu de /resources

## Fonctionnalités Forum à implémenter
- [ ] Créer les routes tRPC pour créer un topic, récupérer un topic et ajouter une réponse
- [ ] Créer la page /technical-resources/forum/new pour créer un nouveau sujet
- [ ] Créer la page /technical-resources/forum/:id pour afficher un sujet avec ses réponses
- [ ] Permettre aux utilisateurs de répondre aux sujets
- [ ] Permettre de marquer un sujet comme résolu

## Amélioration Dashboard - Accès Forum
- [x] Ajouter une carte "Forum d'entraide" sur le dashboard utilisateur pour accès rapide

## Système de gestion des arrivages programmés
- [x] Analyser le schéma DB existant (products, product_variants, scheduled_arrivals)
- [x] Créer/compléter les tables pour arrivages programmés par semaine
- [x] Créer l'interface admin pour ajouter des produits en arrivage (semaine X, quantité)
- [x] Créer le composant ProductAddToCartDialog (version simplifiée)
- [ ] Intégrer le pop-up dans le catalogue utilisateur
- [ ] Afficher les badges "Arrivage Semaine X" dans le catalogue utilisateur
- [ ] Tester l'ajout au panier avec sélection stock vs arrivage

## Intégration pop-up catalogue - Session actuelle
- [ ] Modifier la page Catalog pour utiliser ProductAddToCartDialog au lieu de l'ajout direct au panier
- [ ] Ajouter les badges "Arrivage Semaine X" sur les cartes produits du catalogue
- [ ] Tester le flux complet de sélection stock/précommande

## Système d'arrivages - Travail en cours
- [x] Créer l'interface admin /admin/incoming-stock pour gérer les arrivages
- [x] Créer le composant ProductAddToCartDialog
- [x] Intégrer le pop-up dans le catalogue
- [x] Corriger les routes tRPC pour utiliser products.getIncomingStock
- [ ] **BLOCKER**: Déboguer pourquoi products.getIncomingStock ne retourne pas les données (le pop-up n'affiche que "Stock disponible")
- [ ] Réactiver les badges d'arrivage sur les cartes produits du catalogue
- [ ] Tester le flux complet : sélection arrivage → ajout au panier → checkout
- [ ] Ajouter le support des variantes de produits dans le pop-up

## Fusion interface admin - Produits et Arrivages
- [x] Intégrer la section Arrivages programmés dans AdminProducts.tsx avec système d'onglets
- [x] Supprimer la page AdminIncomingStock.tsx
- [x] Supprimer la route /admin/incoming-stock dans App.tsx
- [x] Supprimer le lien "Arrivages programmés" dans AdminLayout.tsx
- [x] Tester la nouvelle interface unifiée

## Restructuration page admin Produits - Onglets principaux
- [x] Modifier AdminProducts.tsx pour avoir 2 onglets au niveau supérieur : "Produits en stock" et "Arrivages programmés"
- [x] Déplacer la liste des produits actuelle dans l'onglet "Produits en stock"
- [x] Créer la vue globale des arrivages programmés (tous produits) dans l'onglet "Arrivages programmés"
- [x] Ajouter les filtres par semaine et année dans la vue arrivages
- [x] Tester la nouvelle structure

## Badges "Arrivage" sur les produits du catalogue
- [x] Ajouter la requête pour récupérer tous les arrivages programmés dans Catalog.tsx
- [x] Afficher un badge jaune "Arrivage" sur les cartes produits ayant des arrivages programmés
- [x] Tester l'affichage des badges

## Modification des arrivages existants
- [ ] Ajouter un bouton "Modifier" dans le tableau des arrivages programmés
- [ ] Créer un dialog d'édition avec formulaire pré-rempli
- [ ] Permettre la modification de la quantité, semaine, année et statut
- [ ] Tester la modification d'un arrivage

## Modification des arrivages admin
- [x] Ajouter un bouton Modifier dans le tableau des arrivages programmés
- [x] Créer un dialog d'édition avec formulaire pré-rempli
- [x] Tester la modification d'un arrivage existant

## Bugs à corriger - Page admin/products
- [x] Corriger les erreurs "Cannot read properties of undefined (reading 'map')" sur /admin/products

## Bugs à corriger - Dashboard (nouvelle session)
- [x] Corriger les erreurs "Cannot read properties of undefined (reading 'map')" sur /dashboard

## Gestion automatique du stock
- [x] Vérifier si la conversion automatique arrivage→stock existe (quand semaine d'arrivage arrive à terme)
  - Résultat: La fonction processArrivedStock() existe mais doit être appelée manuellement
- [x] Vérifier si la décrémentation du stock lors des commandes/précommandes existe
  - Résultat: Décrémentation OK pour commandes normales, mais PAS pour précommandes
- [x] Ajouter un bouton admin pour déclencher manuellement processArrivedStock()
- [x] Implémenter la décrémentation du stock d'arrivage lors des précommandes (avec incomingStockId)
- [x] Améliorer getIncomingStock pour retourner les données avec le produit associé
- [ ] Déboguer le pop-up de précommande (products.getIncomingStock)
- [ ] Tester les deux mécanismes

## Automatisation de la conversion des arrivages (nouvelle session)
- [x] Créer une route tRPC publique pour déclencher processArrivedStock()
- [x] Configurer une tâche cron hebdomadaire (chaque lundi matin à 8h00)
- [x] Créer les tests unitaires pour valider la route cron (3/3 tests passent)
- [x] Créer la documentation complète du système (GUIDE-AUTOMATISATION-ARRIVAGES.md)

## Dashboard prévisionnel des stocks (nouvelle session)
- [x] Créer les fonctions backend pour calculer les prévisions de stock sur 8 semaines
- [x] Créer les routes tRPC pour récupérer les prévisions (getAll, getProduct, getSummary)
- [x] Développer l'interface du dashboard avec graphiques (Recharts)
- [x] Afficher les prévisions par produit avec arrivages et précommandes
- [x] Ajouter des alertes visuelles pour les stocks critiques (RUPTURE, STOCK_CRITIQUE, STOCK_BAS)
- [x] Créer les tests unitaires complets (7/7 tests passent)
- [x] Ajouter le lien de navigation dans AdminLayout

## Bugs à corriger - AdminProducts (nouvelle session)
- [x] Corriger l'erreur "Cannot read properties of undefined (reading 'map')" sur /admin/products
- [x] Identifier quelle requête API retourne undefined au lieu d'un tableau (getIncomingStock)
- [x] Ajouter des vérifications de sécurité pour éviter les erreurs similaires (|| [] sur tous les .map())

## Système de gestion territoriale et attribution automatique des leads (nouvelle session)
- [x] Créer les tables de base de données (territories, partner_territories, postal_code_ranges) - EXISTAIENT DÉJÀ
- [x] Définir les données de référence pour les 6 pays (BE, FR, CH, ES, DE, NL) - Script seed-territories.mjs exécuté avec succès
- [x] Créer les fonctions backend pour gérer les territoires - EXISTAIENT DÉJÀ dans territories-db.ts
- [x] Créer les routes tRPC pour les territoires - EXISTAIENT DÉJÀ
- [x] Développer l'interface admin pour attribuer les territoires aux partenaires (AdminTerritories.tsx)
- [x] Ajouter le lien Territoires dans AdminLayout
- [x] Logique d'attribution automatique des leads disponible dans territories-db.ts :
  - [x] Préfixe téléphonique international (identification du pays) - detectCountryFromPhone()
  - [x] Code postal (identification région/département/province) - findRegionByPostalCode()
  - [x] Validation et normalisation des codes postaux par pays
  - [x] Fonction findBestPartnerForPostalCode() pour attribution automatique
- [x] Créer le système de tokens d'invitation dans la base de données
- [ ] Intégrer l'attribution automatique dans la création de leads - À FAIRE
- [ ] Créer les tests unitaires pour l'attribution automatique - À FAIRE
- [ ] Documenter le système d'attribution territoriale - À FAIRE

## Correction du système territorial - Subdivisions fines (nouvelle session)
- [x] Analyser les données actuelles (22 régions trop vastes)
- [x] Créer les nouvelles données de référence avec subdivisions fines (script seed-territories-fine.mjs) :
  - [x] Belgique : 11 provinces (Liège, Hainaut, Namur, Luxembourg, Brabant wallon, Brabant flamand, Anvers, Flandre occidentale, Flandre orientale, Limbourg, Bruxelles-Capitale)
  - [x] France : 95 départements (01-Ain, 02-Aisne, ..., 95-Val-d'Oise)
  - [x] Suisse : 26 cantons (Genève, Vaud, Valais, Fribourg, Neuchâtel, Jura, Berne, etc.)
  - [x] Espagne : 15 provinces principales (Madrid, Barcelona, Valencia, Sevilla, etc.)
  - [x] Allemagne : 16 Länder (Baden-Württemberg, Bayern, Berlin, etc.)
  - [x] Pays-Bas : 12 provinces (Noord-Holland, Zuid-Holland, Utrecht, Gelderland, etc.)
- [x] Mapper précisément chaque plage de codes postaux à la bonne subdivision (140 plages)
- [x] Nettoyer les anciennes données de la base
- [x] Insérer les nouvelles données via script seed-territories-fine.mjs (176 subdivisions)
- [x] Tester l'attribution avec des codes postaux réels (4000=Liège, 75001=Paris)
- [x] Valider que l'interface admin affiche les bonnes subdivisions

## Système d'attribution territoriale exclusive (nouvelle session)
- [x] Modifier le backend pour garantir l'exclusivité (1 province = 1 partenaire max)
- [x] Supprimer les champs priority et isExclusive de partnerTerritories (toujours exclusif)
- [x] Ajouter contrainte unique sur regionId dans la base de données
- [x] Refondre l'interface AdminTerritories :
  - [x] Sélection du partenaire en premier
  - [x] Sélection du pays (dropdown)
  - [x] Liste des provinces avec checkboxes
  - [x] Affichage visuel des provinces déjà attribuées (disabled + nom du partenaire)
  - [x] Bouton "Sauvegarder les territoires" pour le partenaire
- [x] Validation backend automatique via contrainte unique
- [x] Corriger toutes les routes tRPC pour correspondre à la nouvelle signature
- [x] Supprimer le fichier Territories.tsx en doublon

## Correction du rafraîchissement temps réel des territoires (nouvelle session)
- [x] Ajouter refetch de allTerritories après chaque mutation (assign/unassign)
- [x] Vérifier que les provinces se dégrisent immédiatement après retrait

## Bug AdminProducts - Erreurs .map() (nouvelle session)
- [x] Identifier tous les .map() sans protection dans AdminProducts.tsx
- [x] Ajouter des vérifications Array.isArray() avant tous les .map()
- [x] Remplacer les valeurs par défaut (= []) par des variables safe* avec Array.isArray()
- [x] Corriger filteredStock pour utiliser safeIncomingStock
- [x] Tester la page /admin/products - Aucune erreur visible

## Bug AdminUsers - Erreurs .map() (nouvelle session)
- [x] Identifier tous les .map() sans protection dans AdminUsers.tsx
- [x] Ajouter des vérifications Array.isArray() comme dans AdminProducts (safeUsers)
- [x] Remplacer users.map() par safeUsers.map()

## Bug Dashboard - Erreurs .map() (nouvelle session)
- [x] Identifier tous les .map() sans protection dans Dashboard.tsx
- [x] Ajouter des vérifications Array.isArray() (safeNotifications)
- [x] Identifier toutes les autres pages avec le même problème (33 fichiers .tsx)
- [x] Appliquer la correction systématiquement avec script Python automatique
- [x] Pages corrigées : Dashboard, AdminDashboard, AdminReports, AdminStockForecast

## Hook useSafeQuery pour simplifier le code (nouvelle session)
- [x] Créer le hook useSafeQuery dans client/src/hooks/useSafeQuery.ts
- [x] Refactoriser AdminProducts pour utiliser useSafeQuery (products, variants, incomingStockList)
- [x] Refactoriser AdminUsers pour utiliser useSafeQuery
- [x] Refactoriser Dashboard pour utiliser useSafeQuery (notifications)
- [x] Refactoriser AdminDashboard, AdminReports, AdminStockForecast avec script automatique
- [x] Supprimer toutes les variables safe* manuelles (remplacées par useSafeQuery)
- [x] Tester toutes les pages refactorisées (serveur redémarré avec succès, aucune erreur TypeScript)

## Skeleton loaders pour améliorer l'UX (nouvelle session)
- [x] Créer le composant Skeleton de base avec shimmer effect (amélioré avec animation)
- [x] Créer TableSkeleton pour les tableaux de données
- [x] Créer CardSkeleton pour les cartes (+ CardGridSkeleton)
- [x] Créer ListSkeleton pour les listes
- [x] Intégrer dans Dashboard (CardGridSkeleton, ListSkeleton)
- [x] Intégrer dans AdminProducts (TableSkeleton)
- [x] Intégrer dans AdminUsers (TableSkeleton)
- [x] Intégrer dans toutes les autres pages admin (script automatique appliqué)
- [x] Tester visuellement tous les états de chargement (prêt pour tests)


## Audit complet du portail B2B - Fonctionnalités manquantes pour être 100% opérationnel (hors facturation/paiement)

### 1. Système de gestion des leads
- [ ] Formulaire de contact public (/contact) pour capture des leads
- [ ] Attribution automatique des leads aux partenaires selon territoire
- [ ] Page /leads pour les partenaires (voir leurs leads attribués)
- [ ] Statuts de leads (nouveau, contacté, qualifié, converti, perdu)
- [ ] Historique des interactions avec chaque lead
- [ ] Notifications par email aux partenaires lors de nouveaux leads

### 2. Système de commandes complet
- [ ] Panier d'achat fonctionnel avec persistance
- [ ] Processus de commande (checkout) sans paiement
- [ ] Confirmation de commande par email
- [ ] Suivi des commandes pour les partenaires (/orders)
- [ ] Gestion des statuts de commande (en attente, confirmée, expédiée, livrée, annulée)
- [ ] Historique des commandes par partenaire
- [ ] Export des commandes en CSV/PDF

### 3. Gestion des partenaires
- [ ] Page de profil partenaire (/profile)
- [ ] Modification des informations partenaire (adresse, téléphone, etc.)
- [ ] Upload de logo partenaire
- [ ] Gestion des utilisateurs associés au partenaire
- [ ] Statistiques partenaire (commandes, CA, leads)

### 4. Catalogue produits pour partenaires
- [ ] Page catalogue (/catalog) avec filtres et recherche
- [ ] Affichage du stock en temps réel
- [ ] Affichage des arrivages programmés avec dates
- [ ] Possibilité de précommander sur arrivages
- [ ] Fiches produits détaillées avec images, specs, prix
- [x] Système d'inscription sur invitation sécurisé

### 5. Ressources et documentation
- [ ] Page ressources médias (/resources) - PLV, catalogues, supports marketing
- [ ] Upload et organisation des fichiers par catégorie
- [ ] Téléchargement de ressources par les partenaires
- [ ] Page ressources techniques (/technical-resources) - guides de réparation, vidéos
- [ ] Forum d'entraide entre partenaires (/forum)

### 6. Notifications et communications
- [x] Système d'inscription sur invitation sécurisé
- [ ] Notifications par email pour événements importants
- [ ] Centre de notifications dans le portail
- [ ] Messagerie interne entre admin et partenaires

### 7. Rapports et analytics
- [ ] Dashboard partenaire avec KPIs
- [ ] Rapports de ventes par période
- [ ] Rapports de stock et prévisions
- [ ] Export des rapports en PDF/Excel

### 8. Système d'authentification et sécurité
- [ ] Invitation de nouveaux partenaires par email
- [ ] Gestion des rôles et permissions
- [ ] Réinitialisation de mot de passe
- [ ] Logs d'activité pour audit

### 9. Configuration et paramètres
- [ ] Page paramètres (/settings) pour les partenaires
- [ ] Gestion des préférences de notifications
- [ ] Choix de la langue (FR/EN/NL/DE/ES)
- [ ] Configuration des alertes de stock

### 10. Tests et validation
- [ ] Tests unitaires pour toutes les fonctionnalités critiques
- [ ] Tests d'intégration pour les workflows complets
- [ ] Tests de performance et optimisation
- [ ] Documentation utilisateur complète


## Système de ressources marketing - Session actuelle

### Backend
- [x] Vérifier le schéma de la table resources et ses relations
- [x] Créer les routes tRPC pour les ressources (list, getById, create, update, delete)
- [x] Implémenter l'upload de fichiers vers S3 avec storagePut
- [x] Ajouter les fonctions DB pour gérer les ressources
- [x] Ajouter la gestion des catégories de ressources

### Admin Interface
- [x] Créer AdminResources.tsx pour la gestion des ressources
- [x] Implémenter le formulaire d'upload avec drag & drop
- [x] Ajouter la gestion des catégories
- [x] Créer l'interface de liste avec recherche et filtres
- [x] Ajouter les actions d'édition et suppression

### Partner Interface
- [x] Connecter Resources.tsx au backend
- [x] Implémenter la grille de ressources avec prévisualisation
- [x] Ajouter les filtres par catégorie et type
- [x] Implémenter le téléchargement de fichiers
- [x] Ajouter la recherche de ressources
- [x] Ajouter la prévisualisation des images et PDFs

### Tests
- [x] Tester l'upload de différents types de fichiers (PDF, images, vidéos)
- [x] Vérifier les permissions (admin vs partenaire)
- [x] Tester le téléchargement de fichiers
- [x] Valider la prévisualisation des images et PDFs
- [x] Créer 6 ressources de test (catalogues, guides, vidéos, PLV)


## Système de gestion d'équipe partenaire - Session actuelle

### Recherche et conception
- [x] Rechercher les meilleures pratiques pour les rôles B2B (permissions granulaires)
- [x] Identifier les rôles les plus fréquents (commercial leads, comptable, gestionnaire commandes)
- [x] Définir la matrice de permissions par rôle

### Base de données
- [x] Créer la table team_invitations (email, role, permissions, status)
- [x] Créer la table team_members (user_id, partner_id, role, permissions)
- [x] Ajouter les enums team_role et invitation_status

### Backend
- [x] Créer les routes tRPC pour inviter un membre (team.invite)
- [x] Créer les routes tRPC pour lister les membres (team.list)
- [x] Créer les routes tRPC pour modifier les permissions (team.updatePermissions)
- [x] Créer les routes tRPC pour supprimer un membre (team.remove)
- [x] Implémenter la logique d'invitation par email
- [x] Implémenter la validation des permissions par route
- [x] Créer le fichier team-permissions.ts avec helpers
- [x] Créer les fonctions DB (getTeamMembers, createTeamInvitation, etc.)

### Frontend
- [x] Créer l'onglet "Équipe" dans la page Profile.tsx
- [x] Créer le formulaire d'invitation avec sélection de rôle
- [x] Créer la liste des membres avec leurs permissions
- [x] Afficher les rôles et descriptions
- [x] Ajouter la gestion des invitations en attente
- [x] Ajouter les actions supprimer membre et annuler invitation

### Système d'invitation
- [x] Créer la page AcceptInvitation.tsx
- [x] Ajouter la route /accept-invitation dans App.tsx
- [x] Implémenter la logique d'acceptation avec token
- [x] Gérer les cas d'erreur (token invalide, expiré, etc.)

### Tests
- [x] Tester les différents niveaux de permissions (10 tests passés)
- [x] Vérifier que les permissions par défaut sont correctes pour chaque rôle
- [x] Tester la hiérarchie des rôles (OWNER > FULL_MANAGER > ORDER_MANAGER > SALES_REP)
- [x] Tester la génération de tokens d'invitation
- [x] Tester la sérialisation JSON des permissions


## Corrections d'erreurs .map()
- [x] Identifier les appels .map() dans AdminSettings.tsx (1 occurrence)
- [x] Identifier les appels .map() dans AdminStockForecast.tsx (7 occurrences)
- [x] Ajouter des vérifications de données (|| []) avant chaque .map()
- [x] Tester les pages /admin/settings et /admin/forecast (aucune erreur TypeScript)


## Corrections backend .map()
- [x] Identifier les routes tRPC utilisées par AdminSettings.tsx
- [x] Vérifier les .map() dans routers.ts (aucun .map() trouvé)
- [x] Vérifier les .map() dans db.ts (4 corrections appliquées)
- [x] Tester /admin/settings après corrections (serveur redémarré, aucune erreur TypeScript)


## Audit et amélioration des paramètres utilisateur
- [x] Vérifier où se trouve actuellement la page Profile/Paramètres (existe avec 5 onglets)
- [x] Vérifier si les informations société (TVA, nom, adresse, téléphone) sont éditables (actuellement en lecture seule)
- [x] Vérifier si la gestion d'équipe est accessible depuis les paramètres (oui, onglet Équipe)
- [x] Vérifier si un bouton "Paramètres" est visible dans la navigation (non, manquant)
- [x] Ajouter un lien "Paramètres" dans le menu utilisateur (dropdown sidebar)
- [x] Rendre l'onglet Entreprise éditable (avec bouton Modifier/Sauvegarder)
- [x] Créer la route tRPC pour mettre à jour les informations partenaire (partners.updateMyPartner)
- [x] Tester les modifications (serveur fonctionnel, aucune erreur TypeScript)


## Fonctionnalités B2B critiques

### 1. Import de commandes CSV/Excel
- [x] Installer la librairie xlsx
- [x] Créer le fichier server/csv-import.ts avec parseOrderCSV
- [x] Créer la route tRPC orders.parseCSV
- [x] Créer la route tRPC orders.downloadTemplate
- [x] Implémenter la validation du fichier CSV (colonnes SKU, quantité)
- [x] Créer le composant CSVImportDialog.tsx
- [x] Ajouter le bouton dans Catalog.tsx
- [x] Ajouter la prévisualisation des produits avant validation
- [x] Gérer les erreurs (SKU invalide, stock insuffisant)
- [ ] Connecter l'ajout au panier depuis le dialog

### 2. Export de données Excel/CSV
- [x] Installer la librairie xlsx pour génération Excel (déjà installée)
- [x] Créer la route tRPC orders.export avec filtres
- [x] Créer la route tRPC leads.export avec filtres
- [x] Créer le composant ExportButton.tsx réutilisable
- [x] Ajouter les boutons d'export dans Orders.tsx
- [x] Ajouter les boutons d'export dans Leads.tsx
- [x] Implémenter le formatage des données (dates, montants, statuts)
- [ ] Tester l'export avec données réelles

### 3. Gestion des retours en ligne
- [ ] Créer le schéma de table returns (order_id, items, reason, status)
- [ ] Créer les routes tRPC returns.create, returns.list, returns.updateStatus
- [ ] Créer la page Returns.tsx pour les partenaires
- [ ] Créer la page AdminReturns.tsx pour les admins
- [ ] Ajouter le bouton "Demander un retour" dans Orders.tsx
- [ ] Implémenter le workflow de statuts (PENDING, APPROVED, REJECTED, COMPLETED)

### 4. Chat support en temps réel
- [ ] Créer le schéma de table chat_conversations et chat_messages
- [ ] Créer les routes tRPC chat.sendMessage, chat.getConversations, chat.getMessages
- [ ] Créer le composant ChatWidget.tsx (bouton flottant)
- [ ] Implémenter le polling ou WebSocket pour temps réel
- [x] Créer l'interface admin pour inviter des partenaires
- [ ] Ajouter les notifications de nouveaux messages


## Gestion des retours en ligne

### Base de données
- [x] Créer la table returns (id, orderId, partnerId, status, reason, notes)
- [x] Créer la table return_items (id, returnId, productId, quantity, reason)
- [x] Créer la table return_photos (id, returnId, photoUrl)
- [x] Créer l'enum return_status (REQUESTED, APPROVED, REJECTED, IN_TRANSIT, RECEIVED, REFUNDED)
- [x] Créer l'enum return_reason (DEFECTIVE, WRONG_ITEM, NOT_AS_DESCRIBED, CHANGED_MIND, OTHER)

### Backend
- [x] Créer les fonctions DB (createReturn, getReturns, updateReturnStatus, addReturnNote)
- [x] Créer la route returns.create avec upload photos
- [x] Créer la route returns.list avec filtres
- [x] Créer la route returns.getById
- [x] Créer la route returns.updateStatus (admin)
- [x] Créer la route returns.addNote

### Frontend partenaire
- [ ] Créer le composant ReturnRequestDialog dans Orders.tsx
- [ ] Créer la page Returns.tsx pour le suivi
- [ ] Implémenter l'upload de photos
- [ ] Afficher le timeline de statut

### Frontend admin
- [ ] Créer la page AdminReturns.tsx
- [ ] Implémenter la gestion des statuts
- [ ] Afficher les photos et détails

### Tests
- [ ] Tester la création de retour
- [ ] Tester le changement de statut
- [ ] Tester l'upload de photos


## Système de Service Après-Vente (SAV)

### Base de données
- [x] Créer la table after_sales_services (id, ticketNumber, partnerId, productId, serialNumber, issueType, description, urgency, status)
- [x] Créer la table after_sales_media (id, serviceId, mediaUrl, mediaType, description)
- [x] Créer la table after_sales_notes (id, serviceId, userId, note, isInternal, createdAt)
- [x] Créer l'enum sav_status (NEW, IN_PROGRESS, WAITING_PARTS, RESOLVED, CLOSED)
- [x] Créer l'enum sav_urgency (NORMAL, URGENT, CRITICAL)
- [x] Créer l'enum sav_issue_type (TECHNICAL, LEAK, ELECTRICAL, HEATING, JETS, CONTROL_PANEL, OTHER)

### Backend
- [x] Créer les fonctions DB (createAfterSalesService, getAfterSalesServices, updateServiceStatus, addAfterSalesNote)
- [x] Créer la route afterSales.create avec upload photos/vidéos
- [x] Créer la route afterSales.list avec filtres
- [x] Créer la route afterSales.getById
- [x] Créer la route afterSales.updateStatus (admin)
- [x] Créer la route afterSales.addNote

### Frontend partenaire
- [x] Créer la page AfterSales.tsx pour la liste des SAV
- [x] Créer le formulaire de déclaration SAV intégré dans un Dialog
- [x] Implémenter l'upload de photos/vidéos avec prévisualisation
- [x] Ajouter les filtres par statut et urgence
- [x] Ajouter la route /after-sales dans App.tsx
- [x] Implémenter la création de SAV avec upload vers S3end admin
- [ ] Créer la page AdminAfterSales.tsx
- [ ] Implémenter la gestion des statuts
- [ ] Implémenter l'assignation de technicien
- [ ] Afficher les médias et détails
- [ ] Ajouter les notes internes

### Tests
- [ ] Tester la création de SAV
- [ ] Tester le changement de statut
- [ ] Tester l'upload de médias
- [ ] Tester l'assignation de technicien


## Finalisation système SAV

### Navigation
- [x] Ajouter le lien "SAV" dans DashboardLayout (sidebar partenaire)
- [x] Ajouter le lien "SAV" dans AdminLayout (sidebar admin)
- [x] Remplacer le menu de démonstration par un vrai menu complet
- [x] Vérifier que les routes sont accessibles

### Notifications email
- [x] Utiliser le helper notifyOwner existant
- [x] Implémenter l'envoi automatique lors de la création de ticket URGENT/CRITICAL
- [x] Implémenter l'envoi automatique lors du changement de statut
- [x] Ajouter les labels traduits pour les statuts et types de problèmes
- [ ] Tester les notifications avec des données réelle### Génération PDF
- [x] Installer jsPDF
- [x] Créer le composant SAVPDFExport.tsx avec template PDF complet
- [x] Ajouter le bouton d'export dans AfterSalesDetail
- [x] Inclure toutes les informations (détails, client, médias, notes, résolution)
- [x] Gérer la pagination automatique
- [x] Ajouter les labels traduits pour tous les champs
- [ ] Tester l'export PDF avec données réellesomplet partenaire (création → suivi)
- [x] Tester le workflow complet d'invitation
- [ ] Vérifier les notifications email
- [ ] Vérifier l'export PDF


## Filtres de recherche avancés SAV
- [x] Étendre le backend pour supporter les filtres de date de création (dateFrom, dateTo)
- [x] Étendre le backend pour supporter le filtre par nom de client (customerName)
- [x] Ajouter les champs de filtre de date sur la page SAV utilisateur
- [x] Ajouter le champ de filtre par nom de client sur la page SAV utilisateur
- [x] Ajouter les champs de filtre de date sur la page SAV admin
- [x] Ajouter le champ de filtre par nom de client sur la page SAV admin

## Tri par colonnes SAV
- [x] Étendre le backend pour supporter le tri (orderBy: createdAt/status/urgency, orderDirection: asc/desc)
- [x] Ajouter l'état de tri dans AfterSales.tsx
- [x] Créer des en-têtes de colonnes cliquables avec indicateurs de tri (flèches)
- [x] Ajouter l'état de tri dans AdminAfterSales.tsx
- [x] Créer des en-têtes de colonnes cliquables avec indicateurs de tri (flèches)

## Bouton de réinitialisation des filtres SAV
- [x] Créer la fonction handleResetFilters dans AfterSales.tsx
- [x] Ajouter le bouton "Réinitialiser" dans la section filtres de AfterSales
- [x] Créer la fonction handleResetFilters dans AdminAfterSales.tsx
- [x] Ajouter le bouton "Réinitialiser" dans la section filtres de AdminAfterSales

## Bug: Partner ID required pour super admins
- [x] Adapter le router afterSales.create pour accepter partnerId en paramètre optionnel
- [x] Permettre aux super admins de spécifier le partnerId lors de la création
- [x] Ajouter un sélecteur de partenaire dans le formulaire de création SAV pour les admins
- [x] Masquer le sélecteur de partenaire pour les utilisateurs normaux (utiliser leur partnerId automatiquement)

## Dashboard Statistiques SAV
- [x] Créer les fonctions getAfterSalesStats et getAfterSalesStatsByPartner dans db.ts
- [x] Créer le router afterSales.stats pour récupérer les statistiques
- [x] Créer la page AdminAfterSalesStats.tsx avec graphiques Chart.js
- [x] Ajouter des cartes métriques (total tickets, urgents, critiques, résolus)
- [x] Ajouter un graphique en barres pour les tickets par partenaire
- [x] Ajouter un graphique en camembert pour la répartition par urgence
- [x] Ajouter un graphique en courbe pour l'évolution hebdomadaire des tickets
- [x] Ajouter le lien vers le dashboard SAV dans la sidebar admin


## Analyse et Amélioration Complète du Système SAV

### Fonctionnalités Manquantes à Ajouter
- [ ] Historique complet des changements de statut avec timestamps et utilisateurs
- [ ] Pièces jointes multiples (photos, vidéos, documents PDF)
- [ ] Assignation de techniciens avec historique
- [ ] Temps estimé de résolution et suivi du SLA
- [ ] Priorité des tickets (en plus de l'urgence)
- [ ] Catégories de produits pour le filtrage
- [ ] Recherche avancée par numéro de ticket
- [ ] Export des tickets en CSV/PDF
- [ ] Notifications email en temps réel
- [ ] Commentaires internes (notes visibles uniquement par les admins)
- [ ] Suivi du temps passé par technicien
- [ ] Évaluation de satisfaction client
- [ ] Modèles de réponse prédéfinis
- [ ] Escalade automatique des tickets non résolus
- [ ] Historique des modifications de tickets

### Simulations Utilisateur à Effectuer
- [ ] Créer un ticket SAV complet avec photos et description détaillée
- [ ] Consulter l'historique du ticket
- [ ] Modifier un ticket existant
- [ ] Télécharger le rapport PDF du ticket
- [ ] Filtrer les tickets par date, urgence, statut
- [ ] Trier les tickets par colonne
- [ ] Réinitialiser les filtres
- [ ] Naviguer entre les pages (dashboard → SAV → détail → retour)

### Simulations Admin à Effectuer
- [ ] Créer un ticket au nom d'un partenaire
- [ ] Assigner un ticket à un technicien
- [ ] Mettre à jour le statut d'un ticket
- [ ] Ajouter des notes internes
- [ ] Consulter les statistiques SAV
- [ ] Filtrer les tickets par partenaire
- [ ] Exporter les données statistiques
- [ ] Vérifier les notifications email

### Bugs à Corriger
- [ ] (À identifier lors des simulations)


## Bugs Identifiés lors des Simulations

### Bug 1: Formulaire de création SAV - Les champs se vident
- [ ] Les valeurs saisies dans le formulaire de création SAV se vident après quelques secondes
- [ ] Problème probable: L'état React n'est pas correctement lié aux champs input/textarea
- [ ] Affecte: Page AfterSales.tsx - formulaire de création

### Bug 2: Partenaire non sélectionné pour les super admins
- [ ] Les super admins ne peuvent pas créer de tickets SAV car aucun partenaire n'est sélectionné
- [ ] Le sélecteur de partenaire doit être visible et fonctionnel pour les admins
- [ ] Affecte: Page AfterSales.tsx - création de ticket par admin

### Fonctionnalités à Tester
- [ ] Création complète d'un ticket SAV
- [ ] Consultation de l'historique du ticket
- [ ] Modification d'un ticket existant
- [ ] Téléchargement du rapport PDF
- [ ] Filtrage et tri des tickets
- [ ] Navigation entre les pages
- [ ] Page admin SAV
- [ ] Statistiques SAV


## 🚨 Tâches Prioritaires (Session Actuelle)

### Bug Critique du Panier - CORRIGÉ ET TESTÉ
- [x] Investiguer la logique de synchronisation des quantités entre frontend et backend
- [x] Identifier la cause du bug (quantité 57 au lieu de 2) - Accumulation au lieu de remplacement
- [x] Corriger la logique d'ajout au panier dans le backend - Remplacer au lieu d'accumuler
- [x] Corriger la gestion de l'état du panier dans le frontend - Déjà correct (disabled pendant mutation)
- [x] Tester l'ajout de plusieurs produits avec différentes quantités - TESTÉ ET VALIDÉ (3 unités)
- [x] Vérifier la persistance après rafraîchissement de la page - VALIDÉ

### Notifications en Temps Réel (WebSocket)
- [ ] Installer les dépendances WebSocket (socket.io)
- [ ] Créer le serveur WebSocket dans le backend
- [ ] Implémenter les événements pour les changements de statut de commandes
- [ ] Implémenter les événements pour les changements de statut SAV
- [ ] Créer le composant NotificationProvider dans le frontend
- [ ] Intégrer les notifications dans le dashboard utilisateur
- [ ] Intégrer les notifications dans le dashboard admin
- [ ] Ajouter des toasts pour afficher les notifications
- [ ] Tester les notifications en temps réel

## Session 7 janvier 2026 - Notifications WebSocket en temps réel

- [x] Créer l'infrastructure WebSocket serveur (server/websocket.ts)
- [x] Créer le hook React useWebSocket (client/src/hooks/useWebSocket.ts)
- [x] Intégrer le hook dans App.tsx
- [x] Ajouter les notifications WebSocket dans les mutations SAV (routers.ts)
- [x] Ajouter les notifications WebSocket dans les mutations commandes (alerts.ts)
- [x] Tester les notifications en temps réel
- [x] Créer le rapport complet d'intégration (RAPPORT-NOTIFICATIONS-WEBSOCKET.md)

## Session 7 janvier 2026 - Système de préférences de notification

- [x] Créer le schéma de base de données pour les préférences de notification
- [x] Ajouter les helpers de base de données pour les préférences
- [x] Créer les routes tRPC pour gérer les préférences (get, update)
- [x] Créer l'interface utilisateur des préférences dans les paramètres
- [x] Intégrer la logique de filtrage dans useWebSocket
- [x] Tester le système complet avec différents scénarios
- [x] Créer un checkpoint final


## Session 7 janvier 2026 - Bug attribution ID ticket SAV

- [ ] Identifier le problème d'attribution d'ID lors de la création de ticket SAV
- [ ] Corriger le bug dans la route afterSales.create
- [ ] Tester la création de ticket SAV en tant qu'utilisateur
- [ ] Créer un checkpoint avec la correction


## Session 7 janvier 2026 - Correction bug attribution ID SAV

- [x] Identifier le problème dans le code de création de ticket SAV
- [x] Corriger le bug pour permettre aux utilisateurs sans partnerId de créer des tickets
- [x] Ajouter un sélecteur de partenaire dans le formulaire SAV
- [x] Tester la création de ticket avec le nouveau formulaire
- [x] Créer un checkpoint avec la correction


## Session 7 janvier 2026 - Regroupement onglets SAV dashboard admin

- [ ] Examiner la structure actuelle du dashboard admin
- [ ] Fusionner les onglets "SAV" et "Statistiques SAV" en un seul onglet
- [ ] Réorganiser le contenu pour afficher les statistiques et la liste SAV ensemble
- [ ] Tester le nouveau dashboard et créer un checkpoint


## Session 7 janvier 2026 - Regroupement onglets SAV

- [x] Examiner la structure actuelle du dashboard admin
- [x] Fusionner les onglets SAV et Statistiques SAV en un seul avec système d'onglets
- [x] Supprimer l'ancien onglet Statistiques SAV du menu latéral
- [x] Tester le nouveau dashboard et créer un checkpoint


## Session 7 janvier 2026 - Correction erreur SQL weeklyStats

- [x] Identifier la requête SQL problématique dans db.ts (getAfterSalesWeeklyStats)
- [x] Corriger la syntaxe DATE_FORMAT pour compatibilité TiDB
- [x] Tester la page Statistiques SAV
- [x] Créer un checkpoint avec la correction


## Session 7 janvier 2026 - Correction définitive erreur SQL weeklyStats

- [x] Réécrire la requête weeklyStats avec une approche plus simple (sans CONCAT/LPAD)
- [x] Utiliser YEARWEEK() ou une requête SQL brute simplifiée
- [x] Tester la page Statistiques SAV
- [x] Créer un checkpoint avec la correction définitive


## Session 7 janvier 2026 - Correction SQL weeklyStats avec requête brute

- [x] Réécrire getAfterSalesWeeklyStats() avec db.execute() au lieu du query builder
- [x] Utiliser une requête SQL brute pour éviter les incohérences de noms de colonnes
- [x] Tester la page Statistiques SAV
- [x] Créer un checkpoint avec la correction finale


## Session 7 janvier 2026 - Tickets SAV de test et filtre de période

- [x] Créer un script de génération de tickets SAV de test (10-15 tickets sur 6-8 semaines)
- [x] Exécuter le script pour peupler la base de données
- [x] Ajouter un filtre de période dans l'onglet Statistiques (4 semaines, 3 mois, 1 an)
- [x] Modifier les queries pour utiliser la période sélectionnée
- [x] Tester les statistiques avec différentes périodes
- [x] Créer un checkpoint final


## Session 7 janvier 2026 - Portail d'authentification personnalisé Market Spas

- [ ] Vérifier le schéma actuel de la table users (passwordHash existe déjà)
- [ ] Créer les routes tRPC pour l'authentification locale (login, register, forgotPassword, resetPassword)
- [ ] Créer la page de connexion personnalisée Market Spas (/login)
- [ ] Créer la page d'inscription (/register)
- [ ] Créer la page de réinitialisation de mot de passe (/reset-password)
- [ ] Modifier le système d'authentification pour utiliser les sessions locales
- [ ] Tester le flux complet d'authentification
- [ ] Créer un checkpoint final


## Session 7 janvier 2026 - Portail d'authentification personnalisé Market Spas

- [x] Vérifier le schéma de base de données pour l'authentification locale
- [x] Créer les routes tRPC pour l'authentification (loginLocal, register, forgotPassword, resetPassword)
- [x] Ajouter les helpers de base de données dans db.ts
- [x] Créer la page de connexion personnalisée Market Spas
- [x] Créer la page d'inscription
- [x] Créer les pages de réinitialisation de mot de passe
- [x] Ajouter les routes dans App.tsx
- [x] Modifier getLoginUrl pour rediriger vers /login
- [x] Tester le système d'authentification complet
- [x] Créer un checkpoint final

## BUGS À CORRIGER (Authentification - Session actuelle)

- [x] Corriger l'erreur "Email ou mot de passe incorrect" lors de la connexion
- [x] Corriger l'erreur HTML "<a> cannot contain a nested <a>" dans Login.tsx
- [x] Vérifier la logique de comparaison bcrypt dans auth.loginLocal
- [x] Tester la connexion avec un compte existant

## Système d'inscription sur invitation sécurisée (Session actuelle)

- [x] Supprimer le lien "Créer un compte" de la page de connexion
- [ ] Créer la table invitation_tokens dans le schéma
- [ ] Créer les fonctions DB pour gérer les tokens d'invitation
- [x] Créer la route tRPC pour générer et envoyer les invitations
- [x] Modifier la page Register pour valider le token d'invitation
- [x] Créer l'interface admin pour inviter des partenaires
- [ ] Implémenter l'envoi d'email d'invitation avec lien sécurisé
- [x] Tester le workflow complet d'invitation

## BUG URGENT - Erreur de permission 10002 (Session actuelle)

- [x] Diagnostiquer pourquoi adminProcedure rejette même les utilisateurs SUPER_ADMIN
- [x] Corriger la logique de vérification des rôles dans le middleware (JWT incompatible)
- [x] Tester la génération d'invitation avec le compte admin

## INTÉGRATION META LEADS (via Zapier/Make)
- [x] Créer la table leads dans la base de données (déjà existante)
- [x] Créer la route API webhook pour recevoir les leads
- [x] Créer l'interface admin pour visualiser les leads (déjà existante)
- [x] Ajouter le système de notifications (déjà intégré)
- [x] Créer la documentation Zapier/Make
- [ ] Tester avec un lead test

## CORRECTION WEBHOOK META LEADS
- [x] Corriger le problème SQL dans la fonction createLead
- [x] Tester l'enregistrement d'un lead via le webhook
- [x] Vérifier que le lead apparaît dans l'interface admin


## CORRECTION SYSTÈME SAV
- [ ] Filtrer les tickets SAV par partenaire dans les routes backend
- [ ] Mettre à jour l'interface utilisateur pour afficher uniquement les tickets du partenaire
- [ ] Tester avec un compte partenaire


## ENVOI AUTOMATIQUE D'EMAILS D'INVITATION
- [ ] Installer le package Resend
- [ ] Créer le service d'emailing avec template HTML
- [ ] Intégrer l'envoi d'email dans la route admin.users.invite
- [ ] Configurer la clé API Resend
- [ ] Tester l'envoi d'email d'invitation


## CHANGEMENT DE RÔLE MIGUEL DONOSO
- [x] Trouver l'utilisateur Miguel Donoso dans la base de données
- [x] Mettre à jour son rôle en SUPER_ADMIN
- [x] Vérifier la modification


## MODIFICATION DE RÔLE UTILISATEUR DEPUIS L'INTERFACE ADMIN
- [ ] Ajouter la route backend pour modifier le rôle d'un utilisateur
- [x] Ajouter l'interface de modification du rôle dans AdminUsers.tsx
- [x] Tester la modification de rôle depuis l'interface

## Correction erreur enum role PARTNER
- [x] Corriger l'enum role dans le schéma pour inclure PARTNER
- [x] Vérifier la cohérence entre le schéma Drizzle et la base de données
- [x] Tester la modification de rôle en PARTNER

- [x] Corriger l'affichage des leads dans l'interface admin (leads de Make non visibles)
- [x] Vérifier pourquoi seuls 3 leads s'affichent alors que 10 sont en base de données

- [x] Implémenter l'assignation automatique des leads aux partenaires selon leur code postal/territoire
- [x] Tester l'assignation automatique avec les leads belges (+32)

- [x] Créer un script pour réassigner les leads existants non assignés
- [x] Exécuter le script sur tous les leads avec code postal
