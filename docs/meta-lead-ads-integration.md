# Intégration Meta Lead Ads - Documentation technique

## Vue d'ensemble

L'intégration Meta Lead Ads permet de recevoir automatiquement les leads générés par les campagnes Facebook/Instagram et de les distribuer aux revendeurs selon leur zone géographique (code postal).

## Architecture

### 1. Webhook Meta → Notre serveur
- Meta envoie une notification webhook à chaque nouveau lead
- Le webhook contient : `leadgen_id`, `page_id`, `form_id`, `ad_id`, `adgroup_id`, `created_time`
- Notre serveur doit répondre avec un code 200 dans les 20 secondes

### 2. Récupération des données du lead
Après réception du webhook, on utilise le `leadgen_id` pour récupérer les données complètes :
```
GET https://graph.facebook.com/v24.0/{leadgen_id}?access_token={page_access_token}
```

Réponse type :
```json
{
  "created_time": "2015-02-28T08:49:14+0000",
  "id": "<LEAD_ID>",
  "ad_id": "<AD_ID>",
  "form_id": "<FORM_ID>",
  "field_data": [
    { "name": "full_name", "values": ["Joe Example"] },
    { "name": "email", "values": ["joe@example.com"] },
    { "name": "phone_number", "values": ["+32123456789"] },
    { "name": "postal_code", "values": ["1000"] }
  ]
}
```

### 3. Distribution automatique par code postal
- Chaque partenaire a une zone de couverture définie par des codes postaux
- Le système attribue automatiquement le lead au partenaire correspondant
- Si aucun partenaire ne couvre la zone, le lead est marqué "non attribué"

## Permissions requises

Pour l'application Meta :
- `pages_read_engagement`
- `pages_manage_metadata`
- `pages_show_list`
- `ads_management`
- `leads_retrieval`

## Configuration requise

1. **Meta App ID** - Créer une application sur developers.facebook.com
2. **Page Access Token** - Token long-lived pour la page Facebook
3. **Webhook URL** - Endpoint public HTTPS pour recevoir les notifications
4. **Verify Token** - Token secret pour valider les webhooks

## Flux de données

```
[Meta Lead Form] 
    ↓ (utilisateur soumet)
[Meta Webhook] 
    ↓ (notification)
[Notre Endpoint /api/webhooks/meta-leads]
    ↓ (récupération données)
[Graph API - GET /leadgen_id]
    ↓ (données complètes)
[Distribution par code postal]
    ↓
[Notification au revendeur]
```

## Statuts des leads

| Statut | Description |
|--------|-------------|
| NEW | Lead vient d'arriver, non traité |
| ASSIGNED | Attribué à un revendeur |
| CONTACTED | Revendeur a contacté le lead |
| NO_RESPONSE | Pas de réponse du prospect |
| QUALIFIED | Lead qualifié, intéressé |
| NOT_QUALIFIED | Lead non qualifié |
| CONVERTED | Vente réalisée |
| LOST | Perdu (concurrent, budget, etc.) |

## Métriques admin

- Nombre total de leads par période
- Leads par campagne/ad set/ad
- Taux de distribution (attribués vs non attribués)
- Taux de contact par revendeur
- Taux de conversion par revendeur
- Temps moyen de premier contact

## Limitations API Meta

- Rate limit : 200 × 24 × (nombre de leads des 90 derniers jours)
- Les données de budget/dépenses nécessitent des permissions supplémentaires (Marketing API)
