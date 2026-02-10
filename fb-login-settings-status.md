# Facebook Login for Business - État actuel

## Page: Paramètres de Facebook Login for Business
URL: https://developers.facebook.com/apps/1228586458787257/business-login/settings/

## Avertissement
- "Facebook Login for Business nécessite un accès Avancé"
- "Votre application dispose d'un accès standard au public_profile. Pour utiliser Facebook Login for Business, basculez le public_profile sur un accès Avancé."

## Validateur d'URI de redirection
- URI testée: https://market-spas-b2b.manus.space/api/auth/meta/callback
- Résultat: "Ceci n'est pas un URI de redirection valide pour cette application"
- Message: "Vous pouvez rendre cette URI valide en l'ajoutant à la liste des URI de redirection OAuth valides ci-dessus"

## Paramètres OAuth client
- Connexion OAuth cliente: Oui
- Connexion OAuth Web: Oui
- Imposer le HTTPS: Oui
- Forcer la ré-authentification OAuth Web: Non
- Connexion OAuth de navigateur intégrée: Non
- Utiliser le mode strict pour les URI de redirection: Oui

## Champ "URI de redirection OAuth valides"
- Il faut scroller vers le bas pour le trouver et y ajouter l'URI

## Action requise
- Il faut ajouter https://market-spas-b2b.manus.space/api/auth/meta/callback dans le champ "URI de redirection OAuth valides"
- Le validateur confirme que l'URI n'est pas encore dans la liste, mais qu'elle PEUT être ajoutée
