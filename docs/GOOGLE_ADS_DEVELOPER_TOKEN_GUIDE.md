# Guide pour obtenir le Developer Token Google Ads

## Pourquoi un Developer Token ?

Le **Developer Token** est nécessaire pour accéder à l'API Google Ads et récupérer les données de campagnes (dépenses, impressions, clics, conversions). C'est différent des identifiants OAuth (Client ID/Secret) qui permettent uniquement l'authentification.

## Prérequis

- Un compte administrateur Google Ads (MCC - My Client Center)
- Les comptes Google Ads normaux ne peuvent pas demander de Developer Token

## Étapes pour créer un compte administrateur (MCC)

1. **Accéder à la page de création**
   - URL : https://ads.google.com/home/tools/manager-accounts/
   - Cliquer sur "Accéder aux comptes administrateur"

2. **Créer le compte**
   - Se connecter avec l'adresse email souhaitée (marketing@spas-wellis.com)
   - Cliquer sur "Créer un compte administrateur"
   - Nom du compte : "Market Spas Manager"
   - Pays : France
   - Fuseau horaire : Europe/Paris
   - Devise : EUR
   - Usage : "Je gère mes propres comptes"

3. **Lier vos comptes existants**
   - Une fois le compte MCC créé, aller dans "Paramètres" → "Sous-comptes"
   - Cliquer sur "Lier un compte existant"
   - Entrer l'ID du compte "Market Spas" (227-767-4380)
   - Accepter la demande de liaison depuis le compte Market Spas

## Étapes pour obtenir le Developer Token

1. **Accéder au Centre API**
   - Se connecter au compte administrateur (MCC)
   - URL : https://ads.google.com/aw/apicenter
   - Le message "Seuls les comptes administrateur ont accès au centre API" ne devrait plus apparaître

2. **Demander le Developer Token**
   - Dans le Centre API, cliquer sur "Demander un token"
   - Remplir le formulaire :
     * Nom de l'application : "Market Spas B2B Portal"
     * Description : "Portail B2B pour partenaires Market Spas avec intégration Google Ads"
     * Type d'accès : "Test" (pour commencer)
   - Accepter les conditions d'utilisation
   - Soumettre la demande

3. **Récupérer le token**
   - Le token apparaîtra dans le Centre API (format : `XXXXXXXXXXXXXXXXXXXXXXXX`)
   - Copier le token

4. **Ajouter le token au projet**
   - Le token sera ajouté automatiquement via `webdev_request_secrets`
   - Variable d'environnement : `GOOGLE_ADS_DEVELOPER_TOKEN`

## Niveaux d'accès du Developer Token

- **Test** : Limité à 15 000 opérations par jour, accès uniquement aux comptes test
- **Basic** : Limité à 15 000 opérations par jour, accès à tous les comptes
- **Standard** : Illimité, nécessite une validation de Google (dépenses publicitaires > 50 000 USD sur 90 jours)

Pour Market Spas, le niveau **Test** ou **Basic** sera suffisant au début.

## Ressources

- [Documentation officielle Google Ads API](https://developers.google.com/google-ads/api/docs/start)
- [Guide des comptes administrateur](https://support.google.com/google-ads/answer/6139186)
- [Demande de Developer Token](https://developers.google.com/google-ads/api/docs/get-started/dev-token)

## Prochaines étapes après obtention du token

Une fois le Developer Token obtenu, il sera automatiquement configuré dans le projet et vous pourrez :

1. Connecter votre compte Google Ads via OAuth
2. Voir vos campagnes Google Ads dans l'onglet "Campagnes Google Ads"
3. Consulter les statistiques (dépenses, impressions, clics, conversions)
4. Comparer les performances Meta vs Google Ads dans le tableau de bord unifié
