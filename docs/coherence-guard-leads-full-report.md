# Audit Coherence-Guard + Impact-Guard — Gestion des Leads
## Date : 10 avril 2026

---

## Résumé exécutif

Audit complet du flux leads couvrant 5 points clés : création partenaire → territoire → distribution → isolation → carte du réseau + scoring.

| Sévérité | Nombre | Description |
|----------|--------|-------------|
| CRITICAL | 1 | Bug d'isolation mobile API leads/stats |
| HIGH | 2 | Appel conditionnel de hooks React + notification envoyée au mauvais ID |
| MEDIUM | 1 | Leads.tsx utilise un ternaire conditionnel pour les hooks tRPC |
| PASSED | 8 | Contrôles OK |

---

## PASSED — Contrôles validés

### P1. Isolation backend tRPC (myLeads)
`leads.myLeads` filtre correctement par `ctx.user.partnerId`. Si pas de partnerId → retourne `[]`. **OK**

### P2. Isolation backend tRPC (getById)
`leads.getById` vérifie que `lead.assignedPartnerId === ctx.user.partnerId` pour les non-admins. Sinon → FORBIDDEN. **OK**

### P3. Isolation backend tRPC (updateStatus)
`leads.updateStatus` vérifie que le lead appartient au partenaire avant de permettre la modification. **OK**

### P4. Isolation backend tRPC (export)
`leads.export` filtre par `partnerId` pour les non-admins. **OK**

### P5. Guard admin frontend (AdminLayout)
`AdminLayout` vérifie `user.role === "SUPER_ADMIN" || user.role === "ADMIN"` et affiche "Accès refusé" sinon. **OK**

### P6. Guard admin backend (admin.leads.*)
Toutes les routes `admin.leads.*` utilisent `adminProcedure`. **OK**

### P7. Distribution automatique (distributeLeadToPartner)
Utilise correctement `resolveCountry` + `findBestPartnerForPostalCode` comme source unique de vérité. **OK**

### P8. Scoring partenariat (calculatePartnerScore)
Score 0-8 calculé correctement : +1 base, +2 showroom, +3 vend spa, +1 autre marque, +1 domaine similaire. Candidats créés dans `partner_candidates` et affichés sur la Carte du Réseau. **OK**

---

## CRITICAL — Bugs à corriger

### C1. Mobile API leads/stats — Fuite de données si partnerId est null
**Fichier :** `server/routes/mobile-api-user.ts:897-917`
**Problème :** Si `req.mobileUser.partnerId` est `null`, aucun filtre n'est appliqué → la requête retourne les stats de TOUS les leads de TOUS les partenaires.
**Impact :** Un utilisateur mobile sans partenaire associé peut voir les statistiques globales des leads.
**Correction :** Retourner des stats vides si `partnerId` est null (comme le fait `myLeads` côté tRPC).

### H1. Notification envoyée au mauvais ID
**Fichier :** `server/meta-leads.ts:862-863`
**Problème :** La notification est envoyée à `result.partnerId` (ID du partenaire dans la table partners), mais `notifications.userId` attend un ID utilisateur (table users). Ce ne sont pas les mêmes IDs.
**Impact :** La notification de nouveau lead n'arrive pas au bon utilisateur, ou crée une erreur silencieuse.
**Correction :** Récupérer l'userId du propriétaire du partenaire avant d'envoyer la notification.

### H2. Leads.tsx — Appel conditionnel de hooks tRPC
**Fichier :** `client/src/pages/Leads.tsx:95-102`
**Problème :** `isAdmin ? trpc.admin.leads.list.useQuery() : trpc.leads.myLeads.useQuery()` — c'est un appel conditionnel de hook React. Si `isAdmin` change entre les rendus (ex: données user qui arrivent en async), ça peut causer React Error #310.
**Impact :** Crash potentiel de la page Leads (même bug que Cart.tsx corrigé plus tôt).
**Correction :** Appeler les deux hooks avec `enabled: isAdmin` / `enabled: !isAdmin` et combiner les résultats.

### M1. Leads.tsx — myStats appelé par les admins aussi
**Fichier :** `client/src/pages/Leads.tsx:109`
**Problème :** `trpc.leads.myStats.useQuery()` est appelé pour tous les utilisateurs, y compris les admins. Côté backend c'est géré (admins voient tout), mais c'est une requête inutile quand l'admin utilise `admin.leads.list` qui a déjà les données.
**Impact :** Performance mineure, pas de bug fonctionnel.

---

## Recommandations

1. **Corriger C1** immédiatement — fuite de données sur la mobile API
2. **Corriger H1** — la notification doit aller au bon userId
3. **Corriger H2** — éviter un crash React potentiel sur la page Leads
4. M1 est mineur, peut être ignoré
