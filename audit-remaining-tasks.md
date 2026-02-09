# Analyse des tâches restantes - Todo List

## Tâches DÉJÀ COMPLÉTÉES mais non cochées (à marquer [x])

### Authentification (Phase 2)
- "Authentification 2FA" → Non pertinent (OAuth SSO + local auth déjà en place)
- "Récupération et réinitialisation de mot de passe" → DÉJÀ FAIT (ForgotPassword.tsx + ResetPassword.tsx)

### Partenaires (Phase 3)
- "Interface d'onboarding pour nouveaux partenaires" → DÉJÀ FAIT (PartnerOnboarding.tsx)
- "Gestion des contacts partenaires" → DÉJÀ FAIT (Profile.tsx onglet Équipe)

### Catalogue (Phase 4)
- "Afficher les images dans le catalogue produits" → DÉJÀ FAIT (marqué [x] ligne 206)

### Commandes (Phase 5)
- "Suivi de statut des commandes en temps réel" → DÉJÀ FAIT (OrderTracking.tsx + WebSocket)

### Stripe (Phase 7)
- "Intégration frontend checkout avec Stripe Elements" → DÉJÀ FAIT (Checkout.tsx)

### Dashboard (Phase 8)
- "Alertes de stock bas" → DÉJÀ FAIT (checkLowStockAlerts)
- "Graphiques et visualisations de données" → DÉJÀ FAIT (Chart.js intégré)

### Emails (Phase 11)
- "Configuration du service d'email transactionnel" → DÉJÀ FAIT (Resend)
- "Email de confirmation de commande" → DÉJÀ FAIT (sendNewOrderNotificationToAdmins)
- "Email de changement de statut" → DÉJÀ FAIT (sendOrderStatusChangeToPartner)

### Admin (Phase 10)
- "Paramètres système" → DÉJÀ FAIT (AdminSettings.tsx)

### Forum (Phase 445-451)
- Routes tRPC forum → DÉJÀ FAIT (routers.ts ligne 2040)
- Page admin technical-resources → DÉJÀ FAIT (admin/TechnicalResources.tsx)
- Page utilisateur /technical-resources → DÉJÀ FAIT (TechnicalResources.tsx)

### Notifications WebSocket
- Toutes les tâches → DÉJÀ FAIT (websocket.ts + useWebSocket)

### Invitation email
- "Implémenter l'envoi d'email d'invitation" → DÉJÀ FAIT (sendInvitationEmail dans email.ts)

## Tâches RÉELLEMENT RESTANTES à implémenter

### Priorité HAUTE
1. Filtrer les tickets SAV par partenaire (ligne 1270-1272)
2. Bug formulaire SAV - champs qui se vident (ligne 1077-1079)

### Priorité MOYENNE
3. Connecter l'ajout au panier depuis le dialog CSV import (ligne 866)
4. Tester l'export avec données réelles (ligne 876)

### Priorité BASSE (optionnel/futur)
- Intégration Odoo (lignes 369-373) → Dépend de la config Odoo du client
- BullMQ/Redis (lignes 384-389) → Architecture avancée
- Synchronisation Google Sheets (ligne 359) → Dépend de la config
- Conditions commerciales personnalisées (ligne 32) → Feature future
- Attribution de commerciaux (ligne 33) → Feature future
- Surcharges de prix individuelles (ligne 44) → Feature future
- 2FA (ligne 20) → Feature future
- Chat support (lignes 886-892) → Feature future
