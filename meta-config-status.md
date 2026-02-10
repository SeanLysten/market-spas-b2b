# Configuration Facebook App - État actuel

- App ID: 1228586458787257
- Mode: Développement
- Domaine: manus.space
- URL du site: https://market-spas-b2b.manus.space/
- Enregistré: Oui (badge "Enregistré" visible en haut)
- Business: Market spas (127116395181938) - Vérifié

## Problèmes identifiés pour OAuth:
1. L'app est en mode Développement - seuls les testeurs peuvent se connecter
2. Il faut configurer la redirect URI dans Facebook Login for Business → Configurations
3. Le code utilise `ctx.req.headers.origin` qui peut être l'URL de preview et non l'URL de production
