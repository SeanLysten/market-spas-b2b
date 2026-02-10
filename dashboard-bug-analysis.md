# Analyse du bug: Dashboard ne s'actualise pas après connexion OAuth

## Flux actuel:
1. User clique "Connecter avec Facebook" → redirigé vers Facebook
2. Facebook redirige vers `https://marketspas.pro/api/auth/meta/callback?code=XXX&state=YYY`
3. Le serveur Express redirige vers `/admin/leads?code=XXX&state=YYY`
4. Le useEffect dans AdminLeads détecte `code` dans l'URL
5. Il appelle `metaCallbackMutation` avec le code et le redirectUri
6. Si succès: affiche le sélecteur de compte ad (showAccountSelector = true)
7. L'utilisateur sélectionne un compte → appelle connectAccountMutation
8. Après succès: refetchMeta() est appelé

## Problème potentiel:
- Ligne 163: `if (code && metaOAuthUrl?.redirectUri && !metaCallbackData)`
- Le `metaOAuthUrl` doit être chargé AVANT que le useEffect ne s'exécute
- Si metaOAuthUrl n'est pas encore chargé quand le code est dans l'URL, le callback ne sera jamais traité
- Le useEffect dépend de [metaOAuthUrl] donc il devrait se re-exécuter quand metaOAuthUrl est chargé
- MAIS: à ce moment, window.location.search a peut-être déjà été nettoyé par un autre render

## Autre problème:
- Si l'utilisateur dit "tout se connecte mais rien ne s'actualise", cela signifie que:
  - Le sélecteur de compte s'affiche bien
  - L'utilisateur sélectionne un compte
  - Mais après, le dashboard ne montre pas les campagnes
  - Cela pourrait être un problème avec getCampaigns qui ne retourne pas les données
  - Ou un problème de mapping des données de campagne
