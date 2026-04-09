# Refonte Gestion Partenaires + Emails — Plan d'implémentation

**Goal:** Compléter la gestion des partenaires (code client, flux invitation → création compte → validation admin) et redesigner tous les templates d'emails du système pour un rendu premium cohérent.

**Architecture:** Le champ `supplierClientCode` existe déjà en DB mais doit être exposé dans le formulaire admin complet de modification. Le flux d'invitation doit être simplifié : admin saisit juste l'email → le partenaire reçoit un lien → il crée son compte avec toutes ses coordonnées → l'admin valide. Les 11 templates d'emails seront refondus avec un design system email cohérent (header Market Spas, palette de couleurs, typographie, footer).

**Tech Stack:** TypeScript, Drizzle ORM, tRPC, React, Resend (email), HTML email tables

---

## État actuel (audit)

| Élément | Statut | Problème |
|---------|--------|----------|
| `supplierClientCode` en DB | ✅ Existe (schema.ts L334) | — |
| `supplierClientCode` dans admin update | ✅ Existe (routers.ts L851) | Seulement dans le formulaire rapide, pas dans le formulaire complet de modification |
| `supplierClientCode` dans export fournisseur | ✅ Existe (supplier-stock.ts L428) | — |
| `supplierClientCode` dans commandes | ❌ Manquant | Pas affiché dans le détail commande ni dans l'export |
| Flux invitation admin | ⚠️ Partiel | Admin doit saisir nom/prénom/partnerId — devrait juste saisir l'email |
| Flux register partenaire | ✅ Fonctionne | Le partenaire peut créer son compte avec coordonnées entreprise |
| Validation admin après inscription | ⚠️ Partiel | Le partenaire est créé en PENDING mais pas de notification claire |
| Modification profil par partenaire | ✅ Fonctionne (updateMyPartner) | Mais l'UI Profile.tsx ne couvre pas toutes les infos |
| Modification profil par admin | ⚠️ Limité | admin.partners.update ne permet que level/status/discount/notes/supplierClientCode |
| Templates emails | ⚠️ Fonctionnels mais basiques | Design incohérent entre les templates, pas de design system email |

---

## Task 1: Enrichir le formulaire admin de modification partenaire

**Files:**
- Modify: `server/routers.ts:840-867` (admin.partners.update)
- Modify: `client/src/pages/admin/AdminPartnerDetail.tsx`

Le formulaire admin `partners.update` n'accepte que `companyName, level, status, discountPercent, internalNotes, supplierClientCode`. Il faut l'étendre pour permettre la modification complète de toutes les informations du partenaire (adresses, contacts, conditions commerciales).

---

## Task 2: Simplifier le flux d'invitation partenaire

**Files:**
- Modify: `server/routers.ts:1675-1735` (admin.users.invite)
- Modify: `client/src/pages/admin/AdminPartners.tsx` (bouton "Inviter un partenaire")

Le flux actuel demande nom/prénom/partnerId. Le nouveau flux : admin saisit juste l'email → le système envoie un email d'invitation → le partenaire clique et arrive sur Register.tsx où il saisit toutes ses coordonnées → le partenaire est créé en PENDING → l'admin reçoit une notification et valide.

---

## Task 3: Intégrer le code client dans les commandes

**Files:**
- Modify: `server/db.ts` (getOrderWithItems, getAllOrders)
- Modify: `server/routes/supplier-stock.ts` (export orders)
- Modify: `client/src/pages/admin/AdminOrders.tsx` (affichage)

Ajouter le `supplierClientCode` du partenaire dans les données de commande pour que le fournisseur puisse identifier le client.

---

## Task 4: Redesign complet des templates d'emails

**Files:**
- Rewrite: `server/email.ts` (11 templates)

Les 11 fonctions d'envoi d'email à redesigner :
1. `sendInvitationEmail` — Invitation partenaire
2. `sendNewOrderNotificationToAdmins` — Nouvelle commande (admin)
3. `sendOrderStatusChangeToPartner` — Changement statut commande
4. `sendDepositReminderEmail` — Rappel acompte
5. `sendPasswordResetEmail` — Réinitialisation mot de passe
6. `sendPaymentConfirmationEmail` — Confirmation paiement
7. `sendPaymentFailureEmail` — Échec paiement
8. `sendRefundConfirmationEmail` — Confirmation remboursement
9. `sendNewsletterEmail` — Newsletter
10. `sendOrderRefusedEmail` — Commande refusée
11. `createNewsletterTemplate` — Template newsletter

Design system email :
- Header : logo Market Spas + bande de couleur
- Palette : vert profond (#1B4332) + accents dorés (#C9A84C)
- Typographie : system fonts (Arial, Helvetica)
- Boutons CTA : arrondis, gradient subtil
- Footer : coordonnées Market Spas, liens utiles, mentions légales
- Responsive : tables fluides, max-width 600px

---

## Task 5: Tests et cohérence

**Files:**
- Create: `server/partner-management-refonte.test.ts`
- Run: tous les tests existants
