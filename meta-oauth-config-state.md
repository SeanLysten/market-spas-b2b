# Configuration OAuth Facebook - État actuel

## Problèmes identifiés
1. **Facebook Login for Business nécessite un accès Avancé** au public_profile
   - Message: "Votre application dispose d'un accès standard au public_profile. Pour utiliser Facebook Login for Business, basculez le public_profile sur un accès Avancé."
   - Lien: "Get Advanced Access"

2. **URI de redirection OAuth valides** est VIDE - il faut ajouter l'URI
   - Le champ est visible (index 35) avec placeholder "https://example.com/oauth.php"
   - Il faut y saisir: https://market-spas-b2b.manus.space/api/auth/meta/callback

3. **Mode strict pour les URI de redirection** est activé (Oui)
   - Cela signifie que l'URI doit correspondre EXACTEMENT

## Actions à faire
1. Saisir l'URI de redirection dans le champ (index 35)
2. Scroller vers le bas et cliquer "Enregistrer les modifications"
3. Obtenir l'accès Avancé pour public_profile OU changer d'approche

## Approche alternative
- Puisque Facebook Login for Business nécessite un accès Avancé (review par Meta),
  on peut utiliser l'endpoint OAuth standard de Facebook (dialog/oauth) 
  qui fonctionne en mode Développement pour les admins/testeurs de l'app.
- Le code actuel utilise déjà www.facebook.com/v21.0/dialog/oauth qui est l'endpoint standard.
- Il faut juste ajouter l'URI de redirection dans les paramètres.
