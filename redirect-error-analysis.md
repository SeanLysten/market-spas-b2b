# Analyse de l'erreur de redirection OAuth

## Flux actuel
1. Frontend appelle `trpc.metaAds.getOAuthUrl.useQuery()` → retourne `{ url, redirectUri }`
2. Le `url` est construit avec `siteUrl = process.env.SITE_URL || process.env.VITE_APP_URL || ctx.req?.headers?.origin`
3. Le `redirectUri` est `${siteUrl}/api/auth/meta/callback`
4. Quand l'utilisateur clique "Connecter avec Facebook", `window.location.href = metaOAuthUrl.url`
5. Facebook redirige vers `redirectUri` avec le code
6. Le serveur Express route `/api/auth/meta/callback` redirige vers `/admin/leads?code=xxx`
7. Le frontend récupère le code et appelle `handleCallback`

## Problème potentiel
- Le `SITE_URL` est configuré comme `https://market-spas-b2b.manus.space`
- Mais le serveur de dev tourne sur `https://3000-xxx.us1.manus.computer`
- L'URL de callback envoyée à Facebook est `https://market-spas-b2b.manus.space/api/auth/meta/callback`
- Mais le serveur qui doit recevoir le callback est sur le domaine de dev
- Facebook redirige vers `market-spas-b2b.manus.space` qui peut ne pas router correctement

## Solution
- En mode dev, utiliser l'origin du header de la requête
- En production, utiliser SITE_URL
- OU : utiliser le domaine de production publié
