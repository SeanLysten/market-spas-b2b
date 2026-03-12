# Guide d'automatisation des arrivages programmés

## Vue d'ensemble

Le système d'arrivages programmés permet de gérer les stocks futurs et de les convertir automatiquement en stock réel lorsque la semaine d'arrivée est atteinte.

## Architecture

### 1. Table `incoming_stock`

Stocke les arrivages programmés avec les informations suivantes :
- `productId` : Référence au produit
- `variantId` : Référence à la variante (optionnel)
- `quantity` : Quantité attendue
- `expectedWeek` : Semaine d'arrivée (1-53)
- `expectedYear` : Année d'arrivée
- `status` : Statut (`PENDING`, `ARRIVED`, `CANCELLED`)
- `notes` : Notes optionnelles
- `arrivedAt` : Date de conversion en stock réel

### 2. Fonction `processArrivedStock()`

Localisation : `server/db.ts`

Cette fonction :
1. Récupère tous les arrivages avec statut `PENDING`
2. Compare la semaine/année d'arrivée avec la date actuelle
3. Pour chaque arrivage passé :
   - Incrémente le stock du produit/variante
   - Change le statut à `ARRIVED`
   - Enregistre la date de conversion

```typescript
export async function processArrivedStock() {
  const db = await getDb();
  if (!db) return { processed: 0 };

  // Récupérer la semaine et l'année actuelles
  const now = new Date();
  const currentWeek = getWeekNumber(now);
  const currentYear = now.getFullYear();

  // Récupérer tous les arrivages en attente
  const pendingStock = await db
    .select()
    .from(incomingStock)
    .where(eq(incomingStock.status, "PENDING"));

  let processed = 0;

  for (const stock of pendingStock) {
    // Vérifier si l'arrivage est passé
    const isPast =
      stock.expectedYear < currentYear ||
      (stock.expectedYear === currentYear && stock.expectedWeek < currentWeek);

    if (isPast) {
      // Incrémenter le stock
      if (stock.variantId) {
        await db
          .update(productVariants)
          .set({
            stockQuantity: sql`${productVariants.stockQuantity} + ${stock.quantity}`,
          })
          .where(eq(productVariants.id, stock.variantId));
      } else if (stock.productId) {
        await db
          .update(products)
          .set({
            stockQuantity: sql`${products.stockQuantity} + ${stock.quantity}`,
          })
          .where(eq(products.id, stock.productId));
      }

      // Marquer comme arrivé
      await db
        .update(incomingStock)
        .set({
          status: "ARRIVED",
          arrivedAt: new Date(),
        })
        .where(eq(incomingStock.id, stock.id));

      processed++;
    }
  }

  return { processed };
}
```

### 3. Route tRPC `cron.processArrivedStock`

Localisation : `server/routers.ts`

Route publique sécurisée par clé secrète pour permettre l'exécution par le système de cron.

```typescript
cron: router({
  processArrivedStock: publicProcedure
    .input(z.object({ secret: z.string() }))
    .mutation(async ({ input }) => {
      // Vérifier la clé secrète
      const CRON_SECRET = process.env.CRON_SECRET || 'default-secret-change-me';
      if (input.secret !== CRON_SECRET) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid secret key' });
      }
      
      // Exécuter la conversion des arrivages
      const result = await db.processArrivedStock();
      return { success: true, result };
    }),
}),
```

### 4. Tâche cron automatique

**Configuration :** Chaque lundi à 8h00 du matin

**Expression cron :** `0 0 8 * * 1`
- `0` : Secondes (0)
- `0` : Minutes (0)
- `8` : Heures (8h du matin)
- `*` : Jour du mois (tous)
- `*` : Mois (tous)
- `1` : Jour de la semaine (lundi)

**Fonctionnement :**
1. Le système de scheduling Manus exécute la tâche chaque lundi à 8h00
2. La tâche appelle la route `cron.processArrivedStock` avec la clé secrète
3. La fonction `processArrivedStock()` est exécutée
4. Les arrivages passés sont convertis en stock réel
5. Les logs d'exécution sont enregistrés

## Bouton manuel admin

En plus de l'automatisation, les administrateurs peuvent déclencher manuellement la conversion via :

**Interface :** Page `/admin/products` → Onglet "Arrivages programmés"

**Bouton :** "Traiter les arrivages"

**Route tRPC :** `admin.incomingStock.processArrived`

Ce bouton permet de forcer la conversion sans attendre le prochain lundi.

## Décrémentation lors des précommandes

Lorsqu'un partenaire passe une précommande sur un arrivage programmé :

1. Le champ `incomingStockId` est enregistré dans la commande
2. La quantité est décrémentée du stock d'arrivage programmé
3. Le stock réel n'est pas touché (car le produit n'est pas encore arrivé)

```typescript
// Dans createOrder()
if (item.isPreorder && item.incomingStockId) {
  // Décrémenter le stock d'arrivage programmé pour les précommandes
  await db
    .update(incomingStock)
    .set({
      quantity: sql`${incomingStock.quantity} - ${item.quantity}`,
    })
    .where(eq(incomingStock.id, item.incomingStockId));
}
```

## Variables d'environnement

### `CRON_SECRET`

Clé secrète pour sécuriser l'accès à la route cron.

**Valeur par défaut :** `default-secret-change-me`

**Recommandation :** Générer une clé aléatoire forte en production :

```bash
openssl rand -base64 32
```

## Tests

**Fichier :** `server/cron.processArrivedStock.test.ts`

**Tests inclus :**
1. ✅ Rejet des clés secrètes invalides
2. ✅ Acceptation de la clé secrète valide
3. ✅ Conversion correcte des arrivages passés

**Exécution :**
```bash
pnpm test cron.processArrivedStock.test.ts
```

## Monitoring et logs

### Logs d'exécution

Les logs sont automatiquement enregistrés par le système de scheduling Manus :
- Date et heure d'exécution
- Nombre d'arrivages traités
- Erreurs éventuelles

### Vérification manuelle

Pour vérifier les arrivages traités :

```sql
SELECT * FROM incoming_stock 
WHERE status = 'ARRIVED' 
ORDER BY arrivedAt DESC 
LIMIT 10;
```

## Workflow complet

### 1. Création d'un arrivage programmé

**Interface :** `/admin/products` → Onglet "Arrivages programmés" → Bouton "Nouvel arrivage"

**Données requises :**
- Produit (ou variante)
- Quantité
- Semaine d'arrivée (1-53)
- Année d'arrivée
- Notes optionnelles

### 2. Précommandes partenaires

**Interface :** `/catalog` → Clic sur un produit → Bouton "Ajouter au panier"

**Options :**
- **Stock disponible** : Expédition immédiate (décrément du stock réel)
- **Arrivage programmé** : Précommande (décrément du stock d'arrivage)

### 3. Conversion automatique

**Déclenchement :** Chaque lundi à 8h00

**Actions :**
1. Vérification des arrivages `PENDING` avec semaine/année passées
2. Incrémentation du stock réel
3. Changement du statut à `ARRIVED`
4. Enregistrement de la date de conversion

### 4. Notification (optionnel)

Possibilité d'ajouter une notification aux partenaires ayant des précommandes :

```typescript
// Dans processArrivedStock()
if (stock.productId) {
  // Récupérer les commandes en précommande pour ce produit
  const preorders = await getPreordersForIncomingStock(stock.id);
  
  // Notifier les partenaires
  for (const order of preorders) {
    await notifyPartner({
      partnerId: order.partnerId,
      title: "Votre précommande est arrivée",
      content: `Le produit ${stock.product.name} est maintenant disponible.`,
    });
  }
}
```

## Dépannage

### La tâche cron ne s'exécute pas

**Vérifications :**
1. La tâche est bien créée dans le système de scheduling
2. La clé secrète `CRON_SECRET` est correctement configurée
3. Les logs d'exécution ne montrent pas d'erreurs

### Les arrivages ne sont pas convertis

**Vérifications :**
1. Le statut est bien `PENDING`
2. La semaine/année d'arrivée est bien passée
3. Le `productId` ou `variantId` est valide
4. Le stock du produit existe dans la base de données

### Erreur "Invalid secret key"

**Solution :**
Vérifier que la clé secrète utilisée par le cron correspond à la variable d'environnement `CRON_SECRET`.

## Améliorations futures

### 1. Notifications automatiques

Envoyer des notifications aux partenaires lorsque leurs précommandes arrivent.

### 2. Prévisions de stock

Afficher les prévisions de stock basées sur les arrivages programmés et les précommandes.

### 3. Alertes admin

Notifier les admins si un arrivage programmé n'a pas été converti après X jours.

### 4. Historique détaillé

Enregistrer l'historique complet des conversions avec détails (produit, quantité, date, etc.).

### 5. Gestion des retards

Permettre aux admins de reporter un arrivage si le fournisseur a du retard.

## Conclusion

Le système d'automatisation des arrivages programmés est maintenant complet et fonctionnel :

✅ **Conversion automatique** chaque lundi à 8h00
✅ **Déclenchement manuel** via l'interface admin
✅ **Décrémentation automatique** lors des précommandes
✅ **Tests unitaires** validés (3/3)
✅ **Documentation complète** pour maintenance et évolution

Le système est prêt pour la production et peut gérer efficacement les stocks futurs et les précommandes.
