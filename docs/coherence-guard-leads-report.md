# Audit Coherence-Guard — Gestion des Leads

**Date** : 10 avril 2026
**Scope** : Toute la logique de distribution des leads aux partenaires

---

## Résumé des incohérences trouvées

| # | Sévérité | Fichier | Problème |
|---|----------|---------|----------|
| C1 | **CRITICAL** | `meta-leads.ts` | `distributeLeadToPartner()` appelée 3 fois mais **n'existe nulle part** → leads Meta jamais distribués |
| H1 | **HIGH** | `lead-routing.ts` vs `territories-db.ts` | 2 systèmes de routing parallèles avec des logiques différentes |
| H2 | **HIGH** | `lead-routing.ts:363` | Fallback hardcodé vers "Les Valentins" (ID 60006) — non souhaitable |
| H3 | **HIGH** | `lead-routing.ts:371-430` | Mapping CP→région ISO dupliqué et potentiellement désynchronisé avec `postal_code_ranges` en DB |
| M1 | **MEDIUM** | `routers.ts:2584` (reassignAll) | Utilise `territories-db.findBestPartnerForPostalCode` (Système B) |
| M2 | **MEDIUM** | `inbound-leads.ts:135` | Utilise `lead-routing.findBestPartnerForLead` (Système A) |
| M3 | **MEDIUM** | `meta-leads.ts:334` | Utilise `distributeLeadToPartner` (inexistant) |
| P1 | **PASSED** | `territories-db.ts` | Smart disambiguation par longueur CP + country hint ✅ |
| P2 | **PASSED** | `meta-leads.ts` | Détection partenariat vs vente ✅ |
| P3 | **PASSED** | `lead-routing.ts` | Classification emails (VENTE/PARTENARIAT/SAV/SPAM) ✅ |
| P4 | **PASSED** | `inbound-leads.ts` | Anti-doublon + enrichissement ✅ |

---

## Plan de correction

### Source unique de vérité : `territories-db.findBestPartnerForPostalCode`

La table `partner_territories` + `regions` + `postal_code_ranges` est la source de vérité pour les territoires.
`territories-db.ts` utilise déjà cette table avec smart disambiguation.

### Corrections à appliquer :

1. **C1** : Implémenter `distributeLeadToPartner()` dans `meta-leads.ts` en utilisant `findBestPartnerForPostalCode` de `territories-db.ts`
2. **H1** : Réécrire `findBestPartnerForLead()` dans `lead-routing.ts` pour déléguer à `findBestPartnerForPostalCode` au lieu de dupliquer la logique
3. **H2** : Supprimer le fallback hardcodé "Les Valentins" — si aucun partenaire ne couvre la zone, retourner null (l'admin assignera manuellement)
4. **H3** : Supprimer le mapping `postalCodeToRegionCode()` dupliqué — la table `postal_code_ranges` en DB est la source de vérité
