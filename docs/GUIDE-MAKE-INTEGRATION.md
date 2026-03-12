# Guide d'intégration Make : Leads Facebook & Statistiques Meta Ads

## Vue d'ensemble

Ce guide vous explique comment configurer **2 scénarios Make** pour automatiser :
1. **La récupération des leads Facebook/Instagram** depuis vos formulaires Lead Ads
2. **La synchronisation des statistiques Meta Ads** (impressions, clics, coût, conversions)

---

## Informations importantes

### URLs des webhooks
- **Leads Facebook** : `https://3000-i5ugl2f2mfskmg7cdlknd-f17f2b0d.us2.manus.computer/api/trpc/webhooks.metaLeads`
- **Stats Meta Ads** : `https://3000-i5ugl2f2mfskmg7cdlknd-f17f2b0d.us2.manus.computer/api/trpc/webhooks.metaAdsStats`

### Informations de votre compte Make
- **Team ID** : `2104387`
- **Organization ID** : `4308208`

---

## Scénario 1 : Leads Facebook → Market Spas

### Étape 1 : Créer le scénario

1. Connectez-vous à [make.com](https://www.make.com)
2. Cliquez sur **"Create a new scenario"**
3. Nommez-le : **"Facebook Leads → Market Spas"**

### Étape 2 : Ajouter le module Facebook Lead Ads

1. Cliquez sur le **+** pour ajouter un module
2. Recherchez **"Facebook Lead Ads"**
3. Sélectionnez **"Watch Leads"** (déclencheur instantané)
4. Connectez votre compte Facebook :
   - Cliquez sur **"Add"**
   - Autorisez l'accès à vos pages et formulaires
   - Sélectionnez votre **Page Facebook**
   - Sélectionnez le **Formulaire Lead Ads** à surveiller

### Étape 3 : Ajouter le module HTTP

1. Cliquez sur le **+** après le module Facebook
2. Recherchez **"HTTP"**
3. Sélectionnez **"Make a request"**
4. Configurez :

**URL** :
```
https://3000-i5ugl2f2mfskmg7cdlknd-f17f2b0d.us2.manus.computer/api/trpc/webhooks.metaLeads
```

**Method** : `POST`

**Headers** :
```
Content-Type: application/json
```

**Body type** : `Raw`

**Request content** :
```json
{
  "firstName": "{{1.field_data.first_name}}",
  "lastName": "{{1.field_data.last_name}}",
  "email": "{{1.field_data.email}}",
  "phone": "{{1.field_data.phone_number}}",
  "postalCode": "{{1.field_data.zip}}",
  "city": "{{1.field_data.city}}",
  "message": "{{1.field_data.message}}",
  "source": "FACEBOOK",
  "campaignId": "{{1.campaign_id}}",
  "campaignName": "{{1.campaign_name}}",
  "adId": "{{1.ad_id}}",
  "adName": "{{1.ad_name}}"
}
```

> **Note** : Adaptez les champs `{{1.field_data.xxx}}` selon les champs de votre formulaire Facebook.

### Étape 4 : Tester et activer

1. Cliquez sur **"Run once"**
2. Remplissez un formulaire test sur Facebook
3. Vérifiez que le lead apparaît dans `/admin/leads`
4. Activez le scénario avec le bouton **ON**

---

## Scénario 2 : Stats Meta Ads → Market Spas

### Étape 1 : Créer le scénario

1. Cliquez sur **"Create a new scenario"**
2. Nommez-le : **"Meta Ads Stats → Market Spas"**

### Étape 2 : Configurer le scheduler

1. Cliquez sur l'icône **horloge** en haut à gauche
2. Sélectionnez **"Every hour"** (ou selon vos besoins)
3. Configurez les heures : **08:00 - 20:00** (optionnel)

### Étape 3 : Ajouter le module Facebook Ads

1. Cliquez sur le **+** pour ajouter un module
2. Recherchez **"Facebook Ads"** ou **"Facebook Marketing"**
3. Sélectionnez **"List Ad Insights"** ou **"Get Campaign Insights"**
4. Connectez votre compte publicitaire
5. Configurez :
   - **Ad Account** : Sélectionnez votre compte pub
   - **Level** : `campaign`
   - **Time Range** : `last_7d`
   - **Fields** : Sélectionnez :
     - `campaign_id`
     - `campaign_name`
     - `impressions`
     - `clicks`
     - `spend`
     - `reach`
     - `cpc`
     - `cpm`
     - `ctr`
     - `actions` (pour les conversions)

### Étape 4 : Ajouter un Iterator

1. Cliquez sur le **+** après Facebook Ads
2. Recherchez **"Iterator"**
3. Configurez :
   - **Array** : `{{2.data}}` (ou le champ contenant les résultats)

### Étape 5 : Ajouter le module HTTP

1. Cliquez sur le **+** après l'Iterator
2. Recherchez **"HTTP"**
3. Sélectionnez **"Make a request"**
4. Configurez :

**URL** :
```
https://3000-i5ugl2f2mfskmg7cdlknd-f17f2b0d.us2.manus.computer/api/trpc/webhooks.metaAdsStats
```

**Method** : `POST`

**Headers** :
```
Content-Type: application/json
```

**Body type** : `Raw`

**Request content** :
```json
{
  "campaignId": "{{3.campaign_id}}",
  "campaignName": "{{3.campaign_name}}",
  "impressions": {{3.impressions}},
  "clicks": {{3.clicks}},
  "spend": {{3.spend}},
  "reach": {{3.reach}},
  "cpc": {{3.cpc}},
  "cpm": {{3.cpm}},
  "ctr": {{3.ctr}},
  "conversions": {{3.actions[0].value}},
  "costPerConversion": {{3.cost_per_action_type[0].value}},
  "date": "{{formatDate(now; "YYYY-MM-DD")}}"
}
```

### Étape 6 : Tester et activer

1. Cliquez sur **"Run once"**
2. Vérifiez les logs pour voir si les stats sont envoyées
3. Consultez `/admin/leads` pour voir les statistiques
4. Activez le scénario avec le bouton **ON**

---

## Vérification

### Vérifier les leads
1. Allez sur `/admin/leads`
2. Vous devriez voir les nouveaux leads avec source **META_ADS**

### Vérifier les statistiques
1. Allez sur `/admin/leads`
2. Consultez la section des statistiques Meta Ads
3. Vous devriez voir les graphiques avec impressions, clics, coût

---

## Dépannage

### Les leads ne sont pas reçus
1. Vérifiez que le scénario est activé (ON)
2. Vérifiez l'historique d'exécution dans Make
3. Testez l'URL du webhook avec curl :
```bash
curl -X POST https://3000-i5ugl2f2mfskmg7cdlknd-f17f2b0d.us2.manus.computer/api/trpc/webhooks.metaLeads \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","source":"FACEBOOK"}'
```

### Les stats ne sont pas synchronisées
1. Vérifiez que le scénario est activé
2. Vérifiez que le scheduler fonctionne
3. Vérifiez les permissions sur votre compte publicitaire Facebook
4. Testez l'URL du webhook avec curl :
```bash
curl -X POST https://3000-i5ugl2f2mfskmg7cdlknd-f17f2b0d.us2.manus.computer/api/trpc/webhooks.metaAdsStats \
  -H "Content-Type: application/json" \
  -d '{"campaignId":"test-123","campaignName":"Test","impressions":1000,"clicks":50,"spend":25.00,"date":"2026-01-09"}'
```

---

## Support

En cas de problème, contactez l'équipe technique Market Spas.
