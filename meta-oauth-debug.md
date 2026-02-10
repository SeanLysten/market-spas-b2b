# Meta OAuth Debug

## Problèmes identifiés :

1. **Domaines de l'app** : Le champ "Domaines de l'app" est VIDE. Il faut ajouter le domaine du portail.
2. **Mode** : L'app est en mode "Développement" - seuls les admins/testeurs de l'app peuvent se connecter.
3. **URL de la Politique de confidentialité** : VIDE (requis pour passer en mode Live)
4. **URL des conditions de service** : VIDE (requis pour passer en mode Live)

## Problèmes dans le code :
- Le redirect_uri utilise `ctx.req?.headers?.origin` qui en dev retourne l'URL de preview (https://3000-xxx.manus.computer)
- Mais dans Facebook, le redirect URI configuré est `https://market-spas-b2b.manus.space/api/auth/meta/callback`
- **MISMATCH** : L'URL de redirection ne correspond pas

## Solution :
1. Ajouter le domaine de preview dans "Domaines de l'app"
2. OU configurer le redirect_uri pour utiliser une URL fixe
3. Ajouter les URLs de politique de confidentialité et conditions de service
