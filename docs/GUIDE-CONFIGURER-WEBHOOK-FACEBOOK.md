# Guide : Configurer le Webhook Facebook

## ✅ Prérequis Complétés

- ✅ Application Facebook créée (ID: 1910344849576746)
- ✅ Page Access Token configuré
- ✅ Page Facebook : Sean Lysten (ID: 3383815171783160)
- ✅ Endpoint webhook créé dans le portail

---

## Étape 1 : Accéder aux Paramètres de votre Application

1. Allez sur [Meta for Developers](https://developers.facebook.com/apps/)
2. Cliquez sur votre application **1910344849576746**
3. Dans le menu de gauche, cherchez **"Webhooks"**
4. Si "Webhooks" n'est pas visible, cliquez sur **"Ajouter un produit"** et sélectionnez **"Webhooks"**

---

## Étape 2 : Configurer le Webhook pour les Pages

1. Dans la page Webhooks, cherchez la section **"Page"**
2. Cliquez sur **"Configurer les webhooks"** ou **"Modifier"**

### Informations à renseigner :

| Champ | Valeur |
|-------|--------|
| **URL de rappel** | `https://VOTRE-DOMAINE.com/api/webhooks/meta-leads` |
| **Token de vérification** | `market_spas_b2b_verify` |

**⚠️ IMPORTANT** : Remplacez `VOTRE-DOMAINE.com` par l'URL publique de votre portail après publication.

**Pour le développement**, vous pouvez utiliser :
```
https://3000-iqwsi08th5tizclm194j5-4687332a.manusvm.computer/api/webhooks/meta-leads
```

3. Cliquez sur **"Vérifier et enregistrer"**

Facebook va maintenant envoyer une requête GET à votre webhook pour vérifier qu'il fonctionne.

---

## Étape 3 : S'abonner aux Événements "leadgen"

1. Une fois le webhook vérifié, vous verrez une liste de champs disponibles
2. **Cochez la case "leadgen"** - C'est l'événement qui envoie les nouveaux leads
3. Cliquez sur **"Enregistrer"**

---

## Étape 4 : Associer le Webhook à votre Page

1. Toujours dans la section Webhooks, cherchez **"Abonnements de page"**
2. Cliquez sur **"Ajouter un abonnement"**
3. Sélectionnez votre page **"Sean Lysten"**
4. Cliquez sur **"S'abonner"**

---

## Étape 5 : Tester l'Intégration

### Test avec l'Outil de Test Facebook

1. Dans la page Webhooks, cherchez le bouton **"Tester"** à côté de "leadgen"
2. Cliquez dessus
3. Facebook enverra un lead de test à votre webhook
4. Vérifiez dans votre portail (section Leads) que le lead de test est bien arrivé

### Test avec un Lead Réel

1. Créez une publicité Lead Ads de test sur Facebook
2. Remplissez le formulaire vous-même
3. Vérifiez que le lead apparaît dans votre portail dans les **5 secondes**

---

## Vérification du Fonctionnement

Une fois configuré, voici ce qui se passe automatiquement :

1. **Un utilisateur remplit** un formulaire Lead Ads sur Facebook/Instagram
2. **Facebook envoie** immédiatement les données à votre webhook
3. **Le portail reçoit** le lead et l'enregistre dans la base de données
4. **Le système distribue** automatiquement le lead au partenaire selon le code postal
5. **Le partenaire reçoit** une notification dans son portail

---

## Dépannage

### Le webhook ne se vérifie pas

- Vérifiez que l'URL est accessible publiquement
- Vérifiez que le token de vérification est exactement : `market_spas_b2b_verify`
- Vérifiez les logs du serveur pour voir les erreurs

### Les leads n'arrivent pas

1. Vérifiez que vous avez bien coché "leadgen" dans les abonnements
2. Vérifiez que votre Page est bien abonnée au webhook
3. Testez avec l'outil de test Facebook
4. Vérifiez les logs du serveur : `/api/webhooks/meta-leads`

### Comment voir les logs ?

Dans votre terminal serveur, vous verrez :
```
[Meta Webhook] Lead reçu: {...}
[Meta] Nouveau lead reçu: 123456789
[Lead] Lead 1 assigné au partenaire 2
```

---

## URLs Importantes

- **Webhook de développement** : https://3000-iqwsi08th5tizclm194j5-4687332a.manusvm.computer/api/webhooks/meta-leads
- **Webhook de production** : https://VOTRE-DOMAINE.com/api/webhooks/meta-leads
- **Token de vérification** : `market_spas_b2b_verify`

---

## Après Publication du Portail

⚠️ **Important** : Après avoir publié votre portail sur un domaine permanent :

1. Retournez dans les paramètres du webhook Facebook
2. Mettez à jour l'URL de rappel avec votre nouveau domaine
3. Cliquez sur "Vérifier et enregistrer"

---

## Support

Si vous rencontrez des problèmes, vérifiez :
- Les permissions de votre token (pages_show_list, leads_retrieval, etc.)
- Que votre application est en mode "Live" (pas "Development")
- Que vous avez bien les droits d'administrateur sur la Page
