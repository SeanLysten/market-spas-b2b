# Analyse complète du flux OAuth Meta Ads

## Flux actuel (CASSÉ)
1. Frontend appelle `trpc.metaAds.getOAuthUrl.useQuery()` → récupère l'URL OAuth et le redirectUri
2. Le redirectUri est construit comme: `${origin}/api/auth/meta/callback`
3. L'utilisateur clique "Connecter avec Facebook" → `window.location.href = metaOAuthUrl.url`
4. Facebook redirige vers `{origin}/api/auth/meta/callback?code=xxx&state=xxx`
5. **PROBLÈME**: Il n'y a PAS de route Express pour `/api/auth/meta/callback`!
6. Comme c'est sous `/api/`, le SPA ne peut pas intercepter cette URL
7. Le frontend attend `?code=` dans l'URL de `/admin/leads` mais ne le reçoit jamais

## Solution
Il y a deux approches possibles:

### Approche A: Créer une route Express de redirection (RECOMMANDÉE)
- Ajouter une route Express GET `/api/auth/meta/callback` qui:
  1. Récupère le `code` et `state` des query params
  2. Redirige vers `/admin/leads?code=xxx&state=xxx`
- Le frontend existant dans AdminLeads.tsx détectera `?code=` et traitera le callback

### Approche B: Changer le redirectUri vers une page frontend
- Changer le redirectUri vers `/admin/leads` directement
- Problème: Facebook n'accepte pas les redirectUri sans path spécifique

## Choix: Approche A
- Créer une route Express `/api/auth/meta/callback` dans index.ts
- Cette route redirige vers `/admin/leads?code=xxx&state=xxx`
- Le frontend existant gère le reste

## Correction supplémentaire
- Le `origin` dans getOAuthUrl doit être l'URL de production fixe
- Utiliser `https://market-spas-b2b.manus.space` comme base URL
- Le redirectUri pour Facebook doit être: `https://market-spas-b2b.manus.space/api/auth/meta/callback`
