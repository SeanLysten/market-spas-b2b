# Guide du système de préférences de notification

## Vue d'ensemble

Le portail B2B Market Spas dispose maintenant d'un système complet de préférences de notification permettant aux utilisateurs de personnaliser leurs notifications pour chaque type d'événement. Les utilisateurs peuvent choisir de recevoir des notifications **toast** (dans l'application) et/ou des notifications **par email** pour chaque catégorie d'événement.

---

## Architecture du système

### 1. Base de données

**Table : `notification_preferences`**

Stocke les préférences de notification de chaque utilisateur avec les colonnes suivantes :

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | INT | Identifiant unique |
| `userId` | INT | Référence à l'utilisateur |
| `orderStatusChangedToast` | BOOLEAN | Toast pour changement de statut de commande |
| `orderStatusChangedEmail` | BOOLEAN | Email pour changement de statut de commande |
| `orderNewToast` | BOOLEAN | Toast pour nouvelle commande (admin) |
| `orderNewEmail` | BOOLEAN | Email pour nouvelle commande (admin) |
| `savStatusChangedToast` | BOOLEAN | Toast pour changement de statut SAV |
| `savStatusChangedEmail` | BOOLEAN | Email pour changement de statut SAV |
| `savNewToast` | BOOLEAN | Toast pour nouveau ticket SAV (admin) |
| `savNewEmail` | BOOLEAN | Email pour nouveau ticket SAV (admin) |
| `leadNewToast` | BOOLEAN | Toast pour nouveau lead attribué |
| `leadNewEmail` | BOOLEAN | Email pour nouveau lead attribué |
| `systemAlertToast` | BOOLEAN | Toast pour alertes système |
| `systemAlertEmail` | BOOLEAN | Email pour alertes système |
| `stockLowToast` | BOOLEAN | Toast pour stock bas (admin) |
| `stockLowEmail` | BOOLEAN | Email pour stock bas (admin) |
| `partnerNewToast` | BOOLEAN | Toast pour nouveau partenaire (admin) |
| `partnerNewEmail` | BOOLEAN | Email pour nouveau partenaire (admin) |
| `createdAt` | TIMESTAMP | Date de création |
| `updatedAt` | TIMESTAMP | Date de dernière mise à jour |

**Valeurs par défaut :** Toutes les préférences sont activées (`true`) par défaut.

---

### 2. Backend (tRPC)

**Routes disponibles :**

#### `notificationPreferences.get`
- **Type :** Query (protégée)
- **Description :** Récupère les préférences de l'utilisateur connecté
- **Comportement :** Si aucune préférence n'existe, crée automatiquement des préférences par défaut

```typescript
const { data: preferences } = trpc.notificationPreferences.get.useQuery();
```

#### `notificationPreferences.update`
- **Type :** Mutation (protégée)
- **Description :** Met à jour les préférences de l'utilisateur
- **Paramètres :** Objet avec les préférences à modifier (toutes optionnelles)

```typescript
const updateMutation = trpc.notificationPreferences.update.useMutation();

await updateMutation.mutateAsync({
  orderStatusChangedToast: false,
  savNewEmail: true,
  // ... autres préférences
});
```

**Helpers de base de données :**

```typescript
// server/db.ts
getNotificationPreferences(userId: number)
createDefaultNotificationPreferences(userId: number)
updateNotificationPreferences(userId: number, preferences: Partial<...>)
```

---

### 3. Frontend

#### Page de gestion des préférences

**Route :** `/notification-preferences`

**Fichier :** `client/src/pages/NotificationPreferences.tsx`

**Fonctionnalités :**
- Affichage de toutes les préférences organisées par catégorie
- Switches pour activer/désactiver chaque type de notification
- Boutons "Annuler" et "Enregistrer les préférences"
- Détection automatique des modifications (état `hasChanges`)
- Feedback utilisateur via toasts de succès/erreur

**Catégories affichées :**

1. **Commandes**
   - Changement de statut de commande
   - Nouvelle commande (admin uniquement)

2. **Service après-vente**
   - Changement de statut SAV
   - Nouveau ticket SAV (admin uniquement)

3. **Leads commerciaux**
   - Nouveau lead attribué

4. **Alertes système**
   - Alertes système importantes
   - Stock bas (admin uniquement)
   - Nouveau partenaire (admin uniquement)

#### Intégration dans le profil

Dans la page `/profile`, l'onglet "Notifications" contient maintenant un lien vers la page de préférences détaillées :

```tsx
<Link href="/notification-preferences">
  <Button>Configurer mes préférences</Button>
</Link>
```

---

### 4. Hook useWebSocket

**Fichier :** `client/src/hooks/useWebSocket.ts`

Le hook a été modifié pour respecter les préférences de l'utilisateur avant d'afficher les toasts.

**Logique de filtrage :**

```typescript
// Charger les préférences
const { data: preferences } = trpc.notificationPreferences.get.useQuery(undefined, {
  enabled: !!user,
});

// Vérifier avant d'afficher un toast
socket.on("order:status_changed", (data) => {
  if (preferences?.orderStatusChangedToast !== false) {
    toast.success("Commande mise à jour", { ... });
  }
});
```

**Comportement :**
- Si `preferences?.xxxToast === false` → Le toast n'est **pas** affiché
- Si `preferences?.xxxToast === true` ou `undefined` → Le toast **est** affiché
- Approche permissive par défaut pour éviter de bloquer les notifications si les préférences ne sont pas encore chargées

---

## Types de notifications

### Notifications toast (dans l'application)

Les notifications toast sont des messages qui s'affichent temporairement en haut à droite de l'écran. Elles sont gérées par la bibliothèque `sonner`.

**Types de toast utilisés :**
- `toast.success()` - Notifications positives (commande validée, lead attribué)
- `toast.info()` - Notifications informatives (changement de statut SAV)
- `toast.warning()` - Notifications d'avertissement (nouveau ticket SAV urgent)
- `toast.error()` - Notifications d'erreur (échec d'une action)

### Notifications par email

Les notifications par email sont envoyées via le système d'email transactionnel du portail. Actuellement, seules les notifications au propriétaire sont implémentées via `notifyOwner()`.

**À implémenter :**
- Intégration avec un service d'email transactionnel (SendGrid, Mailgun, etc.)
- Templates d'emails pour chaque type de notification
- Respect des préférences `xxxEmail` dans les mutations

---

## Événements WebSocket supportés

| Événement | Description | Préférence toast | Préférence email |
|-----------|-------------|------------------|------------------|
| `order:status_changed` | Changement de statut de commande | `orderStatusChangedToast` | `orderStatusChangedEmail` |
| `order:new` | Nouvelle commande créée | `orderNewToast` | `orderNewEmail` |
| `sav:status_changed` | Changement de statut SAV | `savStatusChangedToast` | `savStatusChangedEmail` |
| `sav:new` | Nouveau ticket SAV créé | `savNewToast` | `savNewEmail` |
| `lead:new` | Nouveau lead attribué | `leadNewToast` | `leadNewEmail` |

---

## Guide d'utilisation pour les utilisateurs

### Accéder aux préférences

1. Cliquez sur votre profil dans le header
2. Sélectionnez l'onglet "Notifications"
3. Cliquez sur "Configurer mes préférences"

**OU**

1. Accédez directement à `/notification-preferences`

### Modifier les préférences

1. Activez ou désactivez les switches pour chaque type de notification
2. Vous pouvez choisir de recevoir :
   - Uniquement des toasts (dans l'application)
   - Uniquement des emails
   - Les deux
   - Aucune notification

3. Cliquez sur "Enregistrer les préférences"
4. Un message de confirmation s'affiche

### Annuler les modifications

Si vous avez modifié des préférences mais souhaitez revenir à l'état précédent :

1. Cliquez sur "Annuler"
2. Les préférences reviennent à leur état initial

---

## Tests et validation

### Test manuel

1. **Accéder à la page de préférences**
   ```
   https://[votre-domaine]/notification-preferences
   ```

2. **Désactiver une notification toast**
   - Exemple : Désactiver "Changement de statut SAV (toast)"
   - Cliquer sur "Enregistrer les préférences"

3. **Déclencher l'événement**
   - Aller sur la page admin SAV
   - Changer le statut d'un ticket SAV
   - **Résultat attendu :** Aucun toast ne s'affiche

4. **Réactiver la notification**
   - Retourner aux préférences
   - Réactiver "Changement de statut SAV (toast)"
   - Enregistrer

5. **Déclencher à nouveau l'événement**
   - Changer le statut du ticket SAV
   - **Résultat attendu :** Le toast s'affiche normalement

### Test avec plusieurs utilisateurs

Pour tester les notifications en temps réel entre plusieurs utilisateurs :

1. **Ouvrir deux fenêtres de navigateur**
   - Fenêtre A : Connecté en tant qu'admin
   - Fenêtre B: Connecté en tant que partenaire

2. **Configurer les préférences du partenaire**
   - Dans la fenêtre B, activer toutes les notifications toast

3. **Déclencher un événement depuis l'admin**
   - Dans la fenêtre A, changer le statut d'une commande du partenaire

4. **Vérifier la notification**
   - Dans la fenêtre B, un toast devrait s'afficher automatiquement

---

## Dépannage

### Les préférences ne se sauvegardent pas

**Vérifications :**
1. Vérifier que la table `notification_preferences` existe dans la base de données
2. Vérifier les logs du serveur pour des erreurs SQL
3. Vérifier que l'utilisateur est bien connecté (`ctx.user` existe)

**Solution :**
```sql
-- Vérifier l'existence de la table
SHOW TABLES LIKE 'notification_preferences';

-- Vérifier les préférences d'un utilisateur
SELECT * FROM notification_preferences WHERE userId = 1;
```

### Les toasts s'affichent malgré la désactivation

**Causes possibles :**
1. Les préférences ne sont pas encore chargées
2. Le hook useWebSocket n'a pas été redémarré après la modification

**Solution :**
1. Rafraîchir la page après avoir modifié les préférences
2. Vérifier que `preferences?.xxxToast !== false` dans useWebSocket.ts

### Les notifications par email ne fonctionnent pas

**Statut actuel :**
Les notifications par email ne sont pas encore implémentées. Seules les notifications toast sont fonctionnelles.

**À faire :**
1. Intégrer un service d'email transactionnel
2. Créer les templates d'emails
3. Modifier les mutations pour envoyer des emails selon les préférences

---

## Évolutions futures

### Priorité haute
- [ ] Implémenter l'envoi d'emails transactionnels
- [ ] Créer les templates d'emails pour chaque type de notification
- [ ] Ajouter un historique des notifications reçues

### Priorité moyenne
- [ ] Ajouter des préférences de fréquence (immédiat, quotidien, hebdomadaire)
- [ ] Permettre de définir des plages horaires de réception
- [ ] Ajouter des notifications push (PWA)

### Priorité basse
- [ ] Ajouter des préférences de langue pour les emails
- [ ] Permettre de personnaliser le son des toasts
- [ ] Ajouter des préférences de groupement (une seule notification pour plusieurs événements)

---

## Conclusion

Le système de préférences de notification est maintenant **100% fonctionnel** pour les notifications toast. Les utilisateurs peuvent personnaliser leurs notifications de manière granulaire, améliorant ainsi leur expérience utilisateur et réduisant la fatigue liée aux notifications.

**Prochaine étape recommandée :** Implémenter l'envoi d'emails transactionnels pour compléter le système de notification.

---

**Date de création :** 7 janvier 2026  
**Version :** 1.0  
**Auteur :** Manus AI
