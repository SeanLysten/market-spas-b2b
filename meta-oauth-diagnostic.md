# Diagnostic OAuth Facebook - Problèmes identifiés

## Problème principal
Le `redirect_uri` utilisé dans le flux OAuth est dynamique (basé sur `ctx.req.headers.origin`).
Quand l'utilisateur clique "Connecter avec Facebook" depuis le portail publié (market-spas-b2b.manus.space),
le redirect_uri est `https://market-spas-b2b.manus.space/api/auth/meta/callback`.

MAIS dans Facebook Login for Business, le champ "URI de redirection OAuth valides" est VIDE.
Facebook rejette donc la redirection car l'URI n'est pas dans la liste blanche.

## Problème secondaire
Facebook Login for Business nécessite un "accès Avancé" pour public_profile.
En mode Développement, seuls les admins/testeurs de l'app peuvent se connecter.

## Solution
1. Utiliser Facebook Login standard (pas "for Business") - plus simple en mode dev
2. Ajouter l'URI de redirection dans les paramètres Facebook Login
3. OU utiliser le mode strict désactivé et ajouter le domaine

## Actions correctives côté Facebook
- Ajouter `https://market-spas-b2b.manus.space/api/auth/meta/callback` dans "URI de redirection OAuth valides"
- Ajouter le domaine `market-spas-b2b.manus.space` dans "Domaines autorisés pour le SDK Javascript"

## Actions correctives côté code
- Le code utilise `ctx.req.headers.origin` qui donne l'URL de preview en dev
- Il faut s'assurer que le redirect_uri correspond exactement à ce qui est enregistré dans Facebook
- Ajouter une variable d'env VITE_APP_URL pour fixer l'URL de production
