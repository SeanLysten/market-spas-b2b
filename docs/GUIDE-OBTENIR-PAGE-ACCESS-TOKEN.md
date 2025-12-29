# Guide Détaillé : Obtenir le Page Access Token Facebook

## Prérequis

Avant de commencer, assurez-vous d'avoir :
- ✅ Un compte Facebook Business Manager
- ✅ Une Page Facebook associée à votre entreprise
- ✅ Une application Facebook créée (ID : 1910344849576746)
- ✅ Les droits d'administrateur sur la Page Facebook

---

## Étape 1 : Accéder à l'Explorateur de l'API Graph

1. Ouvrez votre navigateur et allez sur : **https://developers.facebook.com/tools/explorer/**
2. Vous arrivez sur la page "Graph API Explorer"

---

## Étape 2 : Sélectionner votre Application

1. En haut à droite, vous verrez un menu déroulant **"Meta App"**
2. Cliquez dessus et cherchez votre application avec l'ID **1910344849576746**
3. Sélectionnez-la dans la liste

---

## Étape 3 : Générer un Token d'Accès Utilisateur

1. À côté du menu "Meta App", cliquez sur le bouton **"Generate Access Token"** (ou "Obtenir un token d'accès")
2. Une fenêtre popup s'ouvre avec les permissions demandées

### Permissions à cocher :

Vous devez cocher **ces 4 permissions** :

- ✅ **pages_show_list** - Afficher la liste de vos pages
- ✅ **pages_read_engagement** - Lire l'engagement sur vos pages
- ✅ **leads_retrieval** - Récupérer les leads
- ✅ **pages_manage_ads** - Gérer les publicités de la page

3. Cliquez sur **"Continuer"** ou **"Continue"**
4. Facebook vous demandera de vous connecter si ce n'est pas déjà fait
5. Acceptez les permissions demandées

---

## Étape 4 : Sélectionner votre Page Facebook

1. Une fois le token généré, vous verrez un nouveau menu déroulant apparaître : **"User or Page"**
2. Cliquez dessus et sélectionnez **votre Page Facebook** (celle qui reçoit les leads)
3. **Important** : Ne sélectionnez PAS "User", mais bien votre **Page**

---

## Étape 5 : Copier le Page Access Token

1. Dans le champ **"Access Token"** en haut de la page, vous verrez maintenant un très long texte (environ 200-300 caractères)
2. Cliquez sur le bouton **"Copier"** (icône de deux feuilles) à côté du token
3. **Sauvegardez ce token dans un endroit sûr** (bloc-notes, gestionnaire de mots de passe)

Le token ressemble à quelque chose comme :
```
EAABsbCS1iHgBO7ZCwV8RjZAZBkZCxZCQZDZD...
```

---

## Étape 6 : Convertir en Token à Longue Durée (Optionnel mais Recommandé)

Le token que vous venez de copier expire après **quelques heures**. Pour obtenir un token qui dure **60 jours** :

1. Ouvrez un nouvel onglet et allez sur : **https://developers.facebook.com/tools/debug/accesstoken/**
2. Collez votre token dans le champ
3. Cliquez sur **"Debug"**
4. Vous verrez les informations du token
5. En bas, cliquez sur **"Extend Access Token"**
6. Copiez le nouveau token généré (celui-ci dure 60 jours)

---

## Étape 7 : Configurer le Token dans votre Portail

Maintenant que vous avez le token :

1. Retournez sur votre portail Market Spas B2B
2. Allez dans **Administration** → **Paramètres** → **Intégrations**
3. Cherchez la section **"Meta Lead Ads"**
4. Collez le token dans le champ **"META_PAGE_ACCESS_TOKEN"**
5. Cliquez sur **"Enregistrer"**

---

## Vérification

Pour vérifier que tout fonctionne :

1. Dans l'Explorateur de l'API Graph, collez cette requête :
   ```
   /me/leadgen_forms
   ```
2. Cliquez sur **"Submit"** ou **"Envoyer"**
3. Vous devriez voir la liste de vos formulaires Lead Ads

Si vous voyez une erreur, vérifiez que :
- Vous avez bien sélectionné votre **Page** (pas "User")
- Vous avez coché toutes les **4 permissions** nécessaires
- Votre Page a bien des **formulaires Lead Ads** actifs

---

## Renouvellement du Token

Les tokens de page expirent après **60 jours**. Pour éviter les interruptions :

1. Configurez un rappel dans votre calendrier pour renouveler le token tous les **50 jours**
2. Répétez les étapes 1 à 7 pour générer un nouveau token
3. Remplacez l'ancien token par le nouveau dans les paramètres du portail

---

## Besoin d'Aide ?

Si vous rencontrez des difficultés :
- Vérifiez que vous êtes **administrateur** de la Page Facebook
- Vérifiez que votre application est bien **approuvée** par Facebook
- Contactez le support technique avec une capture d'écran de l'erreur

---

## Résumé Rapide

1. Aller sur https://developers.facebook.com/tools/explorer/
2. Sélectionner votre application (1910344849576746)
3. Cliquer sur "Generate Access Token"
4. Cocher les 4 permissions : `pages_show_list`, `pages_read_engagement`, `leads_retrieval`, `pages_manage_ads`
5. Sélectionner votre **Page Facebook** (pas "User")
6. Copier le token généré
7. (Optionnel) Convertir en token longue durée
8. Configurer le token dans le portail
