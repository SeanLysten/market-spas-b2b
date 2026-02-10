# Facebook Login for Business - Documentation Key Points

## Invocation de la boîte de dialogue Login

### Avec SDK (recommandé)
La boîte de dialogue Login peut être appelée via le SDK JavaScript.
- Pour les tokens SUAT (System User Access Token): utiliser `config_id` au lieu de `scope`
- `response_type` doit être `code`
- `override_default_response_type` doit être `true`

```js
FB.login(
  function(response) {
    console.log(response);
  },
  [
    config_id: '<CONFIG_ID>',
    response_type: 'code',
    override_default_response_type: true
  ]
);
```

### Flux manuel (sans SDK)
Pour le flux manuel, il faut utiliser `config_id` au lieu de `scope` dans l'URL OAuth:
- `config_id` remplace `scope`
- `response_type` doit être `code`
- `override_default_response_type` doit être `true`

## PROBLÈME IDENTIFIÉ:
Notre code utilise `scope` au lieu de `config_id` dans l'URL OAuth.
Facebook Login for Business nécessite un `config_id` qui est créé dans les Configurations de l'app.
Sans `config_id`, Facebook ne renvoie pas le code d'autorisation correctement.

## Flux manuel (sans SDK) - IMPORTANT:
"Créer manuellement un processus de connexion" : pour invoquer la boîte de dialogue Login et définir l'URL de redirection,
incluez votre ID de configuration dans un paramètre facultatif (il est également possible d'inclure le champ d'application, mais nous ne vous le déconseillons).

URL format:
https://www.facebook.com/v24.0/dialog/oauth?
  client_id=<APP_ID>
  &redirect_uri=<REDIRECT_URI>
  &config_id=<CONFIG_ID>
  &response_type=code
  &override_default_response_type=true
  &state=<STATE>

Pour les tokens d'accès utilisateur·ice (pas SUAT):
- `config_id` a remplacé `scope` (il est possible d'inclure scope mais déconseillé)
- Pas besoin de `override_default_response_type` pour les user tokens

## Solution:
1. Créer une configuration dans Facebook Login for Business → Configurations
2. Utiliser le `config_id` dans l'URL OAuth au lieu de `scope`
3. Ajouter `override_default_response_type=true` à l'URL si on veut un code
4. OU: Ajouter aussi le produit Facebook Login standard (pas for Business) pour utiliser le flux classique avec scope
