# Problèmes OAuth Facebook identifiés

## Problème 1: Accès Avancé requis
Facebook Login for Business nécessite un accès Avancé pour public_profile.
Il faut cliquer sur "Get Advanced Access" pour activer.

## Problème 2: URI de redirection OAuth non configurée
Le champ "URI de redirection OAuth valides" est vide.
Il faut ajouter: https://market-spas-b2b.manus.space/api/auth/meta/callback

## Problème 3: Mode Développement
L'app est en mode Développement. Seuls les testeurs ajoutés peuvent se connecter.
Pour le moment c'est OK car Sean est admin de l'app.

## Actions à effectuer:
1. Scroller vers le bas pour trouver le champ "URI de redirection OAuth valides"
2. Y ajouter https://market-spas-b2b.manus.space/api/auth/meta/callback
3. Cliquer "Get Advanced Access" pour public_profile
4. Enregistrer les modifications
5. Côté code: s'assurer que le redirect_uri utilise l'URL de production (manus.space) et non l'URL de preview
