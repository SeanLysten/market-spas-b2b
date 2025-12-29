# Guide de Configuration Facebook Lead Ads

## Étape 1 : Créer une Application Facebook

1. Allez sur [Meta for Developers](https://developers.facebook.com/)
2. Cliquez sur **"Mes applications"** puis **"Créer une application"**
3. Choisissez **"Business"** comme type d'application
4. Donnez un nom à votre application (ex: "Market Spas B2B Leads")
5. Sélectionnez votre compte Business Manager

## Étape 2 : Configurer le Webhook

1. Dans votre application Facebook, allez dans **"Produits"** → **"Webhooks"**
2. Cliquez sur **"Ajouter un produit"** et sélectionnez **"Webhooks"**
3. Sélectionnez **"Page"** dans le menu déroulant
4. Cliquez sur **"S'abonner à cet objet"**
5. Remplissez les champs :

   - **URL de rappel** : `https://VOTRE-DOMAINE/api/webhooks/meta-leads`
   - **Token de vérification** : `market_spas_b2b_verify`

6. Cliquez sur **"Vérifier et enregistrer"**
7. Cochez la case **"leadgen"** dans les champs d'abonnement

## Étape 3 : Obtenir le Token d'Accès de Page

1. Allez dans **"Outils"** → **"Explorateur de l'API Graph"**
2. Sélectionnez votre application
3. Cliquez sur **"Obtenir un token d'accès utilisateur"**
4. Cochez les permissions :
   - `pages_show_list`
   - `pages_read_engagement`
   - `leads_retrieval`
   - `pages_manage_ads`
5. Cliquez sur **"Générer un token d'accès"**
6. Dans le menu déroulant "Page", sélectionnez votre page Facebook
7. Copiez le **Token d'accès de page**

### Convertir en Token à Longue Durée

Le token par défaut expire après quelques heures. Pour obtenir un token permanent :

```bash
curl -X GET "https://graph.facebook.com/v24.0/oauth/access_token?grant_type=fb_exchange_token&client_id=VOTRE_APP_ID&client_secret=VOTRE_APP_SECRET&fb_exchange_token=VOTRE_TOKEN_COURT"
```

## Étape 4 : Configurer les Secrets dans le Portail

Dans les paramètres de votre portail Market Spas B2B, ajoutez ces variables d'environnement :

| Variable | Description |
|----------|-------------|
| `META_APP_ID` | ID de votre application Facebook |
| `META_APP_SECRET` | Secret de votre application Facebook |
| `META_PAGE_ACCESS_TOKEN` | Token d'accès de page (longue durée) |
| `META_WEBHOOK_VERIFY_TOKEN` | `market_spas_b2b_verify` (ou votre token personnalisé) |

## Étape 5 : Tester l'Intégration

### Test du Webhook

1. Dans Facebook, allez dans **"Webhooks"** → **"Page"**
2. Cliquez sur **"Tester"** à côté de "leadgen"
3. Vérifiez que votre serveur reçoit le test

### Test avec un Lead Réel

1. Créez une publicité Lead Ads de test
2. Remplissez le formulaire
3. Vérifiez que le lead apparaît dans votre portail

## URL du Webhook

```
https://VOTRE-DOMAINE/api/webhooks/meta-leads
```

**URL actuelle (développement)** :
```
https://3000-iqwsi08th5tizclm194j5-4687332a.manusvm.computer/api/webhooks/meta-leads
```

## Fonctionnalités Incluses

✅ Réception automatique des leads en temps réel
✅ Distribution automatique aux partenaires par code postal
✅ Notifications aux partenaires
✅ Historique des statuts des leads
✅ Statistiques par partenaire et par campagne

## Dépannage

### Le webhook ne reçoit pas les leads

1. Vérifiez que l'URL du webhook est accessible publiquement
2. Vérifiez que le token de vérification correspond
3. Vérifiez les logs du serveur pour les erreurs

### Les leads n'ont pas toutes les informations

Les champs disponibles dépendent de votre formulaire Lead Ads. Assurez-vous d'inclure :
- Prénom / Nom
- Email
- Téléphone
- Code postal
- Ville

## Support

Pour toute question, contactez le support technique.
