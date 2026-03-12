# 📱 Intégration Meta Leads avec Zapier/Make

Ce guide vous explique comment connecter vos campagnes Meta (Facebook/Instagram) Lead Ads à votre portail B2B Market Spas via Zapier ou Make (Integromat).

## 🎯 Vue d'ensemble

Lorsqu'un utilisateur remplit un formulaire Lead Ads sur Facebook/Instagram, ses informations sont automatiquement envoyées à votre portail où vous pouvez :
- Visualiser tous les leads dans l'interface admin
- Assigner les leads à des commerciaux
- Suivre le statut de chaque lead
- Recevoir des notifications en temps réel
- Exporter les données en CSV

---

## 🔗 URL du Webhook

Votre portail expose un endpoint API public pour recevoir les leads :

```
https://votre-domaine.manus.space/api/trpc/webhooks.metaLeads
```

**Méthode HTTP :** `POST`  
**Format :** JSON  
**Authentification :** Aucune (endpoint public)

---

## 📋 Format des données attendues

Le webhook attend un objet JSON avec les champs suivants :

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `email` | string | ✅ Oui | Email du lead |
| `firstName` | string | ❌ Non | Prénom du lead |
| `lastName` | string | ❌ Non | Nom du lead |
| `phone` | string | ❌ Non | Numéro de téléphone |
| `companyName` | string | ❌ Non | Nom de l'entreprise |
| `message` | string | ❌ Non | Message ou commentaire |
| `source` | string | ❌ Non | Source du lead (FACEBOOK, INSTAGRAM, GOOGLE, etc.) |
| `campaignId` | string | ❌ Non | ID de la campagne Meta |
| `campaignName` | string | ❌ Non | Nom de la campagne |
| `adId` | string | ❌ Non | ID de la publicité |
| `adName` | string | ❌ Non | Nom de la publicité |

### Exemple de payload JSON :

```json
{
  "email": "jean.dupont@example.com",
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "+32 470 12 34 56",
  "companyName": "Spa Wellness SPRL",
  "message": "Intéressé par un jacuzzi 6 places",
  "source": "FACEBOOK",
  "campaignId": "123456789",
  "campaignName": "Promo Jacuzzi Été 2024",
  "adId": "987654321",
  "adName": "Jacuzzi 6 places - 20% de réduction"
}
```

---

## 🔧 Configuration avec Zapier

### Étape 1 : Créer un nouveau Zap

1. Connectez-vous à [Zapier](https://zapier.com)
2. Cliquez sur **"Create Zap"**
3. Nommez votre Zap : `Meta Leads → Market Spas`

### Étape 2 : Configurer le Trigger (Déclencheur)

1. **App** : Recherchez et sélectionnez **"Facebook Lead Ads"**
2. **Event** : Sélectionnez **"New Lead"**
3. **Account** : Connectez votre compte Facebook Business
4. **Page** : Sélectionnez votre page Facebook
5. **Form** : Sélectionnez le formulaire Lead Ads concerné
6. **Test** : Testez le trigger pour récupérer un lead exemple

### Étape 3 : Configurer l'Action

1. **App** : Recherchez et sélectionnez **"Webhooks by Zapier"**
2. **Event** : Sélectionnez **"POST"**
3. **URL** : Collez l'URL de votre webhook :
   ```
   https://votre-domaine.manus.space/api/trpc/webhooks.metaLeads
   ```
4. **Payload Type** : Sélectionnez **"JSON"**
5. **Data** : Mappez les champs du formulaire Meta vers votre API :

   ```json
   {
     "json": {
       "email": {{1. Email}},
       "firstName": {{1. First Name}},
       "lastName": {{1. Last Name}},
       "phone": {{1. Phone}},
       "city": {{1. City}},
       "postalCode": {{1. Postal Code}},
       "companyName": {{1. Company Name}},
       "message": {{1. Message}},
       "source": "FACEBOOK",
       "productInterest": {{1. Product Interest}},
       "budget": {{1. Budget}},
       "campaignId": {{1. Campaign ID}},
       "campaignName": {{1. Campaign Name}},
       "adId": {{1. Ad ID}},
       "adName": {{1. Ad Name}}
     }
   }
   ```

6. **Headers** : Ajoutez le header suivant :
   - **Content-Type** : `application/json`

### Étape 4 : Tester et Activer

1. Cliquez sur **"Test & Continue"**
2. Vérifiez que le lead apparaît dans votre portail (section Admin → Leads)
3. Si le test réussit, cliquez sur **"Publish"**
4. Votre Zap est maintenant actif ! 🎉

---

## 🔧 Configuration avec Make (Integromat)

### Étape 1 : Créer un nouveau Scénario

1. Connectez-vous à [Make](https://www.make.com)
2. Cliquez sur **"Create a new scenario"**
3. Nommez votre scénario : `Meta Leads → Market Spas`

### Étape 2 : Ajouter le module Facebook Lead Ads

1. Cliquez sur le **"+"** pour ajouter un module
2. Recherchez et sélectionnez **"Facebook Lead Ads"**
3. Choisissez **"Watch Leads"** (surveiller les nouveaux leads)
4. Connectez votre compte Facebook Business
5. Sélectionnez :
   - **Page** : Votre page Facebook
   - **Form** : Votre formulaire Lead Ads
   - **Limit** : 10 (nombre de leads à récupérer par exécution)

### Étape 3 : Ajouter le module HTTP

1. Cliquez sur le **"+"** après le module Facebook
2. Recherchez et sélectionnez **"HTTP"**
3. Choisissez **"Make a request"**
4. Configurez la requête :
   - **URL** : `https://votre-domaine.manus.space/api/trpc/webhooks.metaLeads`
   - **Method** : `POST`
   - **Headers** :
     - **Content-Type** : `application/json`
   - **Body type** : `Raw`
   - **Content type** : `JSON (application/json)`
   - **Request content** :

   ```json
   {
     "json": {
       "email": "{{1.email}}",
       "firstName": "{{1.first_name}}",
       "lastName": "{{1.last_name}}",
       "phone": "{{1.phone_number}}",
       "city": "{{1.city}}",
       "postalCode": "{{1.postal_code}}",
       "companyName": "{{1.company_name}}",
       "message": "{{1.message}}",
       "source": "FACEBOOK",
       "productInterest": "{{1.product_interest}}",
       "budget": "{{1.budget}}",
       "campaignId": "{{1.campaign_id}}",
       "campaignName": "{{1.campaign_name}}",
       "adId": "{{1.ad_id}}",
       "adName": "{{1.ad_name}}"
     }
   }
   ```

### Étape 4 : Tester et Activer

1. Cliquez sur **"Run once"** pour tester
2. Vérifiez que le lead apparaît dans votre portail
3. Si le test réussit, activez le scénario en cliquant sur **"ON"**
4. Configurez la fréquence d'exécution (ex: toutes les 15 minutes)
5. Votre scénario est maintenant actif ! 🎉

---

## ✅ Vérification

Après avoir configuré Zapier ou Make, vérifiez que tout fonctionne :

1. **Créez un lead test** sur votre formulaire Facebook Lead Ads
2. **Attendez quelques minutes** (délai de synchronisation)
3. **Connectez-vous à votre portail** : https://votre-domaine.manus.space
4. **Accédez à** : Administration → Gestion des Leads
5. **Vérifiez** que le lead apparaît dans la liste

### Indicateurs de succès :
- ✅ Le lead apparaît dans la liste
- ✅ Toutes les informations sont correctement remplies
- ✅ Le statut est "NEW" (Nouveau)
- ✅ La source est "FACEBOOK" ou "INSTAGRAM"
- ✅ Vous recevez une notification dans le portail

---

## 🔔 Notifications

Lorsqu'un nouveau lead est reçu :
- 📧 Les admins reçoivent une notification dans le portail
- 🔔 Une notification en temps réel apparaît dans l'interface
- 📊 Le compteur de leads est mis à jour automatiquement

---

## 🐛 Dépannage

### Le lead n'apparaît pas dans le portail

1. **Vérifiez l'URL du webhook** : Elle doit être exacte
2. **Vérifiez le format JSON** : Assurez-vous que le payload est valide
3. **Vérifiez les logs Zapier/Make** : Recherchez les erreurs dans l'historique
4. **Testez manuellement** : Utilisez Postman ou curl pour envoyer un lead test

### Erreur 400 (Bad Request)

- Le champ `email` est manquant ou invalide
- Le format JSON est incorrect

### Erreur 500 (Server Error)

- Problème côté serveur
- Contactez le support technique

---

## 📊 Tarifs

### Zapier
- **Gratuit** : Jusqu'à 100 tâches/mois
- **Starter** : 20€/mois - 750 tâches/mois
- **Professional** : 49€/mois - 2000 tâches/mois

### Make
- **Gratuit** : Jusqu'à 1000 opérations/mois
- **Core** : 9€/mois - 10 000 opérations/mois
- **Pro** : 16€/mois - 10 000 opérations/mois

---

## 📞 Support

Pour toute question ou problème :
- 📧 Email : support@marketspas.com
- 💬 Chat : Disponible dans le portail
- 📚 Documentation : https://docs.marketspas.com

---

## 🎉 Félicitations !

Votre intégration Meta Leads est maintenant configurée ! Tous vos leads Facebook et Instagram seront automatiquement synchronisés avec votre portail B2B Market Spas.

**Prochaines étapes suggérées :**
1. Configurez des règles d'assignation automatique des leads
2. Créez des templates d'emails pour répondre rapidement
3. Configurez des rappels automatiques pour le suivi des leads
