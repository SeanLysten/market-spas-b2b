# Intégration Facebook Lead Ads - Market Spas B2B

## Vue d'ensemble

Pour connecter les leads Facebook et les statistiques Meta Ads au portail B2B, il existe plusieurs méthodes :

## Méthode 1 : Webhooks (Temps réel)

### Prérequis
- Un compte Meta Business
- Une application Facebook configurée
- Les permissions suivantes :
  - `ads_management` - Gestion des publicités
  - `leads_retrieval` - Récupération des leads
  - `pages_show_list` - Liste des pages
  - `pages_read_engagement` - Engagement des pages
  - `pages_manage_ads` - Gestion des publicités de la page

### Configuration du Webhook

1. **Créer un endpoint webhook** dans votre application
2. **Configurer le webhook** dans Meta Business Suite
3. **Recevoir les leads en temps réel**

### Format de la réponse Webhook

```json
{
  "object": "page",
  "entry": [
    {
      "id": "PAGE_ID",
      "time": 1438292065,
      "changes": [
        {
          "field": "leadgen",
          "value": {
            "leadgen_id": "LEAD_ID",
            "page_id": "PAGE_ID",
            "form_id": "FORM_ID",
            "adgroup_id": "ADGROUP_ID",
            "ad_id": "AD_ID",
            "created_time": 1440120384
          }
        }
      ]
    }
  ]
}
```

### Récupérer les détails du lead

```bash
curl -X GET \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v24.0/<LEAD_ID>
```

## Méthode 2 : Polling (Interrogation périodique)

Interroger l'API Facebook périodiquement pour récupérer les nouveaux leads.

```bash
curl -X GET \
  "https://graph.facebook.com/v24.0/<PAGE_ID>/leadgen_forms?access_token=<ACCESS_TOKEN>"
```

## Méthode 3 : Intégration CRM existante

Meta propose des intégrations natives avec plusieurs CRM :
- Salesforce
- HubSpot
- Zoho CRM
- Et autres...

## Statistiques Meta Ads (Insights API)

Pour récupérer les statistiques des campagnes :

```bash
curl -X GET \
  "https://graph.facebook.com/v24.0/<AD_ACCOUNT_ID>/insights?fields=spend,impressions,clicks,actions&access_token=<ACCESS_TOKEN>"
```

### Champs disponibles
- `spend` - Dépenses
- `impressions` - Impressions
- `clicks` - Clics
- `actions` - Actions (leads, conversions, etc.)
- `cpc` - Coût par clic
- `cpm` - Coût pour mille impressions
- `reach` - Portée

## Rate Limits

La limite de requêtes est : 200 × 24 × nombre de leads créés dans les 90 derniers jours.

## Tokens d'accès

Utiliser un **token de page à longue durée** pour éviter les expirations fréquentes.
