# Recherche : Rôles et Permissions B2B Standards

## Source : BigCommerce B2B Edition

### Rôles prédéfinis standards

1. **Sales Rep (Commercial)**
   - Peut uniquement voir et gérer les comptes clients qui lui sont assignés
   - Accès aux détails des entreprises, commandes et demandes de devis
   - **Pas d'accès** aux utilisateurs, rôles ou paramètres

2. **Accountant (Comptable)**
   - Peut voir et exporter les données de facturation
   - Accès aux commandes facturées et paiements de factures
   - **Ne peut pas** créer ou modifier les factures

3. **Financial Manager (Gestionnaire Financier)**
   - Peut gérer tous les aspects de la facturation
   - Peut créer et modifier les paiements de factures
   - Accès complet aux données financières

4. **Administrator (Administrateur)**
   - Accès à toutes les informations des comptes clients
   - Peut gérer les utilisateurs, rôles et paramètres
   - Plusieurs administrateurs possibles

5. **Store Owner (Propriétaire)**
   - Accès complet à toutes les zones du panneau de contrôle
   - Un seul propriétaire possible

## Permissions granulaires typiques

### Gestion des leads
- Voir les leads assignés
- Modifier le statut des leads
- Ajouter des notes aux leads
- Voir tous les leads (admin uniquement)

### Gestion des commandes
- Voir les commandes
- Créer des commandes
- Modifier le statut des commandes
- Annuler des commandes
- Exporter les commandes

### Gestion financière
- Voir les factures
- Créer des factures
- Modifier des factures
- Voir les paiements
- Créer des paiements
- Exporter les données financières

### Gestion du catalogue
- Voir les produits
- Voir les prix
- Gérer les favoris

### Gestion des ressources
- Voir les ressources
- Télécharger les ressources
- Gérer les ressources (admin)

## Recommandations pour Market Spas B2B

### Rôles à implémenter

1. **Propriétaire** (existant - PARTNER_ADMIN)
   - Accès complet
   - Peut inviter des membres d'équipe
   - Peut gérer tous les aspects du compte

2. **Commercial Leads** (nouveau)
   - Accès aux leads assignés uniquement
   - Peut modifier le statut des leads
   - Peut ajouter des notes
   - **Pas d'accès** aux commandes, factures, paramètres

3. **Gestionnaire Commandes** (nouveau)
   - Accès au catalogue et aux commandes
   - Peut créer et gérer les commandes
   - Peut voir les factures (lecture seule)
   - **Pas d'accès** aux leads, paramètres

4. **Comptable** (nouveau)
   - Accès aux factures et paiements (lecture seule)
   - Peut exporter les données financières
   - **Pas d'accès** aux leads, commandes, paramètres

5. **Gestionnaire Complet** (nouveau)
   - Accès à tout sauf les paramètres d'équipe
   - Peut gérer leads, commandes, voir les factures
   - **Pas d'accès** à l'invitation de membres

## Matrice de permissions

| Permission | Propriétaire | Commercial | Gestionnaire Commandes | Comptable | Gestionnaire Complet |
|------------|--------------|------------|------------------------|-----------|---------------------|
| Gérer équipe | ✅ | ❌ | ❌ | ❌ | ❌ |
| Voir leads | ✅ | ✅ (assignés) | ❌ | ❌ | ✅ |
| Gérer leads | ✅ | ✅ (assignés) | ❌ | ❌ | ✅ |
| Voir catalogue | ✅ | ❌ | ✅ | ❌ | ✅ |
| Voir commandes | ✅ | ❌ | ✅ | ❌ | ✅ |
| Créer commandes | ✅ | ❌ | ✅ | ❌ | ✅ |
| Voir factures | ✅ | ❌ | ✅ (lecture) | ✅ | ✅ |
| Exporter données | ✅ | ❌ | ✅ | ✅ | ✅ |
| Voir ressources | ✅ | ❌ | ✅ | ❌ | ✅ |
| Modifier profil | ✅ | ❌ | ❌ | ❌ | ❌ |

## Système d'invitation

1. Le propriétaire du compte partenaire entre l'email du membre à inviter
2. Sélectionne un rôle prédéfini ou personnalise les permissions
3. Un email d'invitation est envoyé
4. Le membre clique sur le lien et crée son compte
5. Le compte est automatiquement lié au partenaire avec les permissions définies


## Conclusions de la recherche Frontegg

### Fonctionnalités clés pour B2B user management

1. **Multi-tenant par design**
   - Les utilisateurs appartiennent à des organisations
   - Un utilisateur peut appartenir à plusieurs organisations avec des rôles différents
   - Gestion des paramètres par organisation

2. **Self-service capabilities**
   - Les admins de chaque organisation doivent pouvoir gérer leurs utilisateurs indépendamment
   - Admin panel intégré dans le produit
   - Pas besoin de contacter le support pour ajouter/retirer des utilisateurs

3. **Granularité des permissions**
   - Ne pas donner plus (ou moins) de permissions que nécessaire
   - Créer des permissions spécifiques plutôt que des rôles larges
   - Exemple : "Voir les leads assignés" vs "Voir tous les leads"

4. **Expérience utilisateur fluide**
   - Même en B2B, l'expérience utilisateur doit être personnalisée et fluide
   - Ne pas se concentrer uniquement sur les admins et la sécurité
   - Les utilisateurs finaux doivent avoir une expérience agréable

## Recommandations finales pour Market Spas B2B

### Architecture proposée

1. **Table `team_invitations`**
   - email (string)
   - partnerId (int)
   - role (enum: SALES_REP, ORDER_MANAGER, ACCOUNTANT, FULL_MANAGER)
   - customPermissions (JSON - optionnel pour permissions personnalisées)
   - invitedBy (int - user_id)
   - status (enum: PENDING, ACCEPTED, EXPIRED)
   - token (string - unique)
   - expiresAt (timestamp)
   - createdAt (timestamp)

2. **Table `team_members`**
   - userId (int)
   - partnerId (int)
   - role (enum)
   - permissions (JSON - permissions granulaires)
   - addedBy (int)
   - createdAt (timestamp)

3. **Permissions granulaires (JSON)**
   ```json
   {
     "leads": {
       "view": "all" | "assigned" | "none",
       "edit": true | false,
       "delete": true | false
     },
     "orders": {
       "view": true | false,
       "create": true | false,
       "edit": true | false,
       "cancel": true | false
     },
     "invoices": {
       "view": true | false,
       "export": true | false
     },
     "catalog": {
       "view": true | false,
       "viewPrices": true | false
     },
     "resources": {
       "view": true | false,
       "download": true | false
     },
     "team": {
       "invite": true | false,
       "manage": true | false
     }
   }
   ```

### Workflow d'invitation

1. **Propriétaire invite un membre**
   - Va dans Profil > Équipe
   - Clique sur "Inviter un membre"
   - Entre l'email et sélectionne un rôle prédéfini
   - Peut personnaliser les permissions si besoin
   - Clique sur "Envoyer l'invitation"

2. **Email d'invitation envoyé**
   - Contient un lien unique avec token
   - Expire après 7 jours
   - Explique le rôle et les permissions

3. **Membre accepte l'invitation**
   - Clique sur le lien
   - Créé son compte (ou se connecte si compte existant)
   - Son compte est automatiquement lié au partenaire
   - Il a accès uniquement aux fonctionnalités autorisées

4. **Gestion des membres**
   - Le propriétaire peut voir tous les membres
   - Peut modifier les permissions d'un membre
   - Peut supprimer un membre de l'équipe
   - Peut renvoyer une invitation expirée

### Rôles prédéfinis à implémenter

1. **Commercial Leads** (SALES_REP)
   - Leads: view=assigned, edit=true
   - Tout le reste: false

2. **Gestionnaire Commandes** (ORDER_MANAGER)
   - Catalog: view=true, viewPrices=true
   - Orders: all true
   - Invoices: view=true (read-only)
   - Resources: view=true, download=true

3. **Comptable** (ACCOUNTANT)
   - Invoices: view=true, export=true
   - Orders: view=true (read-only)
   - Tout le reste: false

4. **Gestionnaire Complet** (FULL_MANAGER)
   - Tout true sauf team.invite et team.manage

5. **Propriétaire** (OWNER)
   - Tout true (rôle existant PARTNER_ADMIN)
